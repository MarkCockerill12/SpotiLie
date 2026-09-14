/**
 * SpotiLIE ad defence (page-side).
 *
 * Network-level blocking lives in the extension's background script (plus
 * uBlock Origin, installed by MainActivity). This module handles only what the
 * network layer can't:
 *
 *   1. Optional entitlement spoofing at `JSON.parse` time (off — see below).
 *   2. DOM purging of ad slots that Spotify renders client-side.
 *   3. Audio ads, which arrive as ordinary media and can only be caught by
 *      watching playback. The page world fast-forwards them the instant the
 *      source changes (page.ts); this side adds the DOM-based corroboration.
 */

import { coalesced, log, pageAction, pageState, STATE_EVENT, whenBody } from './shared';

// ── Layer 1: entitlement spoofing ────────────────────────────────────────────

/**
 * OFF by default.
 *
 * Measured ceiling (TECHNICAL_SPECS §10): `product` never appears in any JSON
 * payload — spclient delivers it over protobuf — so this never stopped a single
 * ad. What it did do was tell a *free* session's client that it was premium
 * (`isPremium`, `catalogue`), and rewrite `isAd` / `adBreak` / `ad_id` on
 * whatever payload carried them, including playback state. A client whose
 * idea of its entitlement and of the current ad slot disagrees with the
 * server's is a textbook source of "playback breaks after an ad" and "stops
 * advancing after a few songs". Flip to true only to experiment.
 */
const SPOOF_ENTITLEMENTS = false;

/**
 * Objects already processed. A WeakSet is used rather than tagging objects with
 * a marker property: a marker survives `JSON.stringify` and would be posted
 * back to Spotify's servers on every round-tripped payload, which is both an
 * adblock fingerprint and a way to get requests rejected.
 */
const seen = new WeakSet<object>();

/** Counts of entitlement fields actually rewritten; surfaced by the DEBUG probe. */
export const patchStats: Record<string, number> = Object.create(null);
const bump = (key: string) => { patchStats[key] = (patchStats[key] || 0) + 1; };

function patchNode(node: any) {
  if (node.product === 'free' || node.product === 'open') { node.product = 'premium'; bump('product'); }
  if (node.catalogue === 'free' || node.catalogue === 'open') { node.catalogue = 'premium'; bump('catalogue'); }
  if (node.canPlayOnDemand !== undefined) { node.canPlayOnDemand = true; bump('canPlayOnDemand'); }
  if (node.is_premium !== undefined) { node.is_premium = true; bump('is_premium'); }
  if (node.isPremium !== undefined) { node.isPremium = true; bump('isPremium'); }
  if (node.isFreeTier !== undefined) node.isFreeTier = false;
  if (node.isFreeUser !== undefined) node.isFreeUser = false;
  if (node.adsEnabled !== undefined) node.adsEnabled = false;
  if (node.audio_ads_enabled !== undefined) node.audio_ads_enabled = false;
}

/**
 * Cheap gate for the deep walk. JSON.parse is extremely hot, so testing the raw
 * text for a relevant key keeps the common case to a single substring scan.
 */
const RELEVANT =
  /"(product|catalogue|isPremium|is_premium|canPlayOnDemand|isFreeTier|isFreeUser|adsEnabled|audio_ads_enabled)"/;

const MAX_DEPTH = 12;

function spoofPremium(data: any): any {
  if (!data || typeof data !== 'object') return data;

  const walk = (node: any, depth: number) => {
    if (!node || typeof node !== 'object' || depth > MAX_DEPTH) return;
    if (seen.has(node)) return;
    seen.add(node);

    if (Array.isArray(node)) {
      for (const item of node) walk(item, depth + 1);
      return;
    }

    patchNode(node);
    for (const key in node) {
      const value = node[key];
      if (value && typeof value === 'object') walk(value, depth + 1);
    }
  };

  walk(data, 0);
  return data;
}

/**
 * PAGE WORLD ONLY — see page.ts. Patching JSON.parse from the content script is
 * useless: Firefox runs content scripts in an isolated sandbox.
 */
export function initJsonSpoofing() {
  if (!SPOOF_ENTITLEMENTS) return;
  const originalParse = JSON.parse;
  JSON.parse = function (text: string, reviver?: any) {
    const data = reviver ? originalParse(text, reviver) : originalParse(text);
    if (typeof text === 'string' && RELEVANT.test(text)) return spoofPremium(data);
    return data;
  };
}

/** Deep entitlement patching for callers outside this module (Response.json). */
export function unlockPayload(data: any): any {
  return SPOOF_ENTITLEMENTS ? spoofPremium(data) : data;
}

// ── Layer 2: DOM ad purge ────────────────────────────────────────────────────

/** One combined selector: querySelectorAll walks the document once per call. */
const AD_SELECTOR = [
  '[data-testid="ad-indicator"]',
  '[data-testid="ad-sponsor-container"]',
  '[data-testid="advertisement"]',
  '[data-testid="hpto-container"]',
  '[data-testid="embedded-ad"]',
  '.Root__ads-container',
  '.nav-bar-ad-item',
  '.desktop-media-picker-ads',
  '[class*="ad-slot"]',
  '[class*="adSlot"]',
  '[class*="AdSlot"]',
  'iframe[src*="doubleclick"]',
  'iframe[src*="googlesyndication"]',
  'div[id*="google_ads"]',
  'div[class*="video-ad"]',
  'div[class*="videoAd"]',
].join(',');

function initDomAdPurger() {
  const purge = () => {
    for (const el of document.querySelectorAll(AD_SELECTOR)) el.remove();
  };

  whenBody(() => {
    purge();
    // Coalesced onto a frame: the observer fires constantly during React
    // renders, but the actual DOM query runs at most once per frame.
    new MutationObserver(coalesced(purge)).observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}

// ── Layer 3: audio ads ───────────────────────────────────────────────────────

/** DEBUG hook so the probe can report what the ad guard is seeing. */
export const adDebug: { get: () => string } = { get: () => 'guard-not-started' };

function initAudioAdGuard() {
  /** Titles alone are not proof — real tracks are called "Advertisement". */
  const AD_TITLE = /\b(advertisement|anuncio|anzeige|publicit[ée]|reklama)\b/i;

  const AD_ELEMENT_SELECTOR =
    '[data-testid="ad-indicator"],[data-testid="ad-sponsor-container"],' +
    '.Root__ads-container,[class*="ad-overlay"],[class*="video-ad"]';

  /**
   * Does the now-playing widget link to real catalogue content? Verified on
   * device: every real item links to /album/, /track/ or /episode/ — an ad
   * links to nothing.
   */
  const CONTENT_LINK = ['/album/', '/track/', '/episode/', '/show/', '/chapter/', '/audiobook/']
    .flatMap((p) => [
      `[data-testid="now-playing-widget"] a[href*="${p}"]`,
      `[data-testid="context-item-link"][href*="${p}"]`,
    ])
    .join(',');
  const hasContentLink = () => !!document.querySelector(CONTENT_LINK);

  let adActive = false;
  let adStartedAt = 0;
  let suspectSince = 0;

  /**
   * The weak "no content link" signal is only trusted once this session has
   * seen the selector match real content. If Spotify renames the widget, the
   * link would be "missing" forever and the old guard muted every song.
   */
  let linkSelectorProven = false;

  const SUSPECT_MS = 1500;
  /** Heuristic-only detections give the audio back after this long. */
  const HEURISTIC_MAX_MS = 40_000;

  const nowPlayingTitle = () =>
    (document.querySelector('[data-testid="context-item-info-title"]')?.textContent || '').trim();

  adDebug.get = () => [
    `active=${adActive}`,
    `pageAd=${pageState.ad}`,
    `title="${nowPlayingTitle().slice(0, 40)}"`,
    `adEl=${document.querySelector(AD_ELEMENT_SELECTOR) ? 'YES' : 'no'}`,
    `contentLink=${hasContentLink() ? 'yes' : 'NO'}`,
    `proven=${linkSelectorProven}`,
    `suspect=${suspectSince ? Date.now() - suspectSince : 0}`,
    `src=${(pageState.src || 'none').slice(-60)}`,
  ].join(' ');

  const check = () => {
    const linked = hasContentLink();
    if (linked) linkSelectorProven = true;
    const playing = !pageState.paused;

    // Ad markup lingers for a few hundred ms after the break. Once the element is
    // demonstrably back on catalogue audio (MediaSource blob:), trust that over
    // the stale DOM — acting on it muted the first ~0.4 s of the next song.
    const musicPlaying = pageState.hasMedia && !pageState.paused && pageState.src.startsWith('blob:');

    // Unambiguous: the page world saw an ad creative, or Spotify rendered its
    // own ad markers. Title matches only count without a content link.
    const definite =
      pageState.ad ||
      (!musicPlaying && (
        !!document.querySelector(AD_ELEMENT_SELECTOR) ||
        (document.querySelector('[data-testid="context-item-link"]')?.getAttribute('href') || '').includes('/ad/') ||
        (playing && !linked && (AD_TITLE.test(document.title || '') || AD_TITLE.test(nowPlayingTitle())))
      ));

    // Weak: playing but linking to nothing. Held for SUSPECT_MS because the link
    // also disappears for a moment while a real track swaps in. It used to mute
    // on the very first frame of that, clipping the start of songs.
    if (playing && linkSelectorProven && !linked) {
      if (!suspectSince) suspectSince = Date.now();
    } else {
      suspectSince = 0;
    }
    const sustained = suspectSince > 0 && Date.now() - suspectSince > SUSPECT_MS;

    if (definite || sustained) {
      if (!adActive) {
        // Edge trigger: one action per ad.
        adActive = true;
        adStartedAt = Date.now();
        log(`audio ad detected (${pageState.ad ? 'ad creative' : definite ? 'ad markup' : 'no content link'})`);
        pageAction('mute');
        pageAction('skip-ad');
      } else if (!pageState.ad && Date.now() - adStartedAt > HEURISTIC_MAX_MS) {
        // Never stay latched on heuristics. Stand down until a real content link
        // is seen again, so this can't oscillate every 40 s either.
        log('ad guard latched on heuristics too long — restoring audio');
        adActive = false;
        suspectSince = 0;
        linkSelectorProven = false;
        pageAction('unmute');
      }
    } else if (adActive) {
      adActive = false;
      log('ad ended — restoring audio');
      pageAction('unmute');
    }
  };

  // Time-based weak signal needs a tick; state changes from the page world and
  // player DOM mutations trigger an immediate check on top.
  setInterval(check, 500);
  const scheduleCheck = coalesced(check);
  document.addEventListener(STATE_EVENT, scheduleCheck);

  whenBody(() => {
    let attached = false;
    const attach = () => {
      if (attached) return;
      const bar =
        document.querySelector('[data-testid="now-playing-bar"]') ||
        document.querySelector('.Root__now-playing-bar');
      if (!bar) return;
      attached = true;
      new MutationObserver(scheduleCheck).observe(bar, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['aria-label', 'href'],
      });
      bodyObserver.disconnect();
    };
    const bodyObserver = new MutationObserver(coalesced(attach));
    bodyObserver.observe(document.body, { childList: true, subtree: true });
    attach();
  });
}

/** Content-world half: everything that only needs the shared DOM. */
export function initAdblock() {
  try {
    initDomAdPurger();
    initAudioAdGuard();
    log('ad defence active (DOM + audio)');
  } catch (e) {
    console.error('SpotiLIE: adblock init failed', e);
  }
}
