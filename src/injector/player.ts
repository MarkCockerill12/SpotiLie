/**
 * Transport bridge, metadata sync and self-healing.
 *
 * Down: notification / Bluetooth / Android Auto commands arrive from the native
 * port and are forwarded to the page world.
 * Up: track state is pushed to the media session so the notification shows
 * artwork, a title and a working seek bar.
 * Watchdogs: a page that never finished booting, or playback that silently
 * stopped advancing, is recovered instead of leaving a dead app.
 */

import { adDebug } from './adblock';
import {
  coalesced, coalescedTimer, DEBUG, debugDump, ext, log, PAGE_LOG_EVENT, pageAction, pageState,
  requestReload, sendNative, warn, whenBody,
} from './shared';

export function initPlayer() {
  initNativeMessageListener();
  initMobileTrackTap();
  initNetworkRecovery();
  initMetadataSync();
  initBootWatchdog();
  initPlaybackWatchdog();
  // Inline env test, not the imported DEBUG const: Bun only strips the branch (and
  // with it the eval listener) when the comparison is at the call site. Guarding
  // with `if (DEBUG)` shipped the listener in release bundles. See src/env.d.ts.
  if (process.env.SPOTILIE_DEBUG === '1') initDebugHooks();
}

const PLAY_PAUSE = 'button[data-testid="control-button-playpause"]';

/** Spotify's own button state. aria-label is localised, so English only. */
const uiSaysPlaying = () =>
  (document.querySelector(PLAY_PAUSE)?.getAttribute('aria-label') || '').toLowerCase() === 'pause';

/**
 * Commands relayed from MainActivity via background.js. They're forwarded to
 * the page world, which is the only side that can reach the media element.
 *
 * (The old JS `devicechange` "Bluetooth guard" is gone: that event also fires
 * when headphones *connect*, so it paused music on connect. Kotlin's
 * ACTION_AUDIO_BECOMING_NOISY is the correct signal and already handles it.)
 */
function initNativeMessageListener() {
  const api = ext();
  if (!api?.runtime?.onMessage) return;
  api.runtime.onMessage.addListener((msg: any) => {
    if (msg?.type === 'MEDIA_ACTION' && typeof msg.action === 'string') {
      pageAction(msg.action, msg.value || 0);
    }
  });
}

/**
 * On the desktop player a single click only selects a track row; playing needs
 * a double click or the row's hover play button. On a touch screen one tap
 * should just play.
 */
function initMobileTrackTap() {
  document.addEventListener('click', (e) => {
    // Ignore clicks we synthesised ourselves, or we'd recurse.
    if (!e.isTrusted) return;

    const target = e.target as HTMLElement | null;
    if (!target) return;

    // Leave explicit controls and links alone.
    if (target.closest('button, a[href*="/artist/"], a[href*="/album/"], [role="button"], [data-testid="more-button"], [data-testid="add-button"]')) return;

    const row = target.closest('[data-testid="tracklist-row"]') as HTMLElement | null;
    if (!row) return;

    const playBtn = row.querySelector(
      '[data-testid="play-button"], [data-testid="row-play-button"], button[aria-label*="Play" i]'
    ) as HTMLElement | null;
    if (playBtn) { playBtn.click(); return; }

    const link = row.querySelector('a[data-testid="internal-track-link"], a[href*="/track/"]') as HTMLElement | null;
    link?.click();
  });
}

/**
 * Resume after a network blip — but only if we were playing when it dropped.
 * The old version pressed play on every `online` event, starting music the
 * user had deliberately paused.
 */
function initNetworkRecovery() {
  let playingWhenLost = false;
  window.addEventListener('offline', () => {
    playingWhenLost = !pageState.paused || uiSaysPlaying();
    log(`network lost (playing=${playingWhenLost})`);
  });
  window.addEventListener('online', () => {
    if (!playingWhenLost) return;
    playingWhenLost = false;
    log('network restored — resuming');
    // Give Spotify's own reconnect a chance first; `play` is a no-op if it did.
    setTimeout(() => pageAction('play'), 2500);
  });
}

// ── Watchdogs ────────────────────────────────────────────────────────────────

/**
 * A cold start on a bad connection can leave the shell half-loaded: the HTML
 * arrived but a JS chunk didn't, and the SPA never renders or shows Spotify's
 * "Something went wrong" page. Nothing ever retried, so the app just sat there.
 */
function initBootWatchdog() {
  const KEY = 'spotilie-boot-attempts';
  const MAX_ATTEMPTS = 6;

  const booted = () =>
    !!document.querySelector(
      '[data-testid="now-playing-bar"], [data-testid="login-button"], [data-testid="signup-button"], main, [data-testid="main-view"]'
    );

  const errorPage = () => {
    const text = document.body?.innerText || '';
    return text.length < 600 && /something went wrong|try reloading|couldn.t load/i.test(text);
  };

  let attempts = 0;
  try { attempts = Number(sessionStorage.getItem(KEY) || 0); } catch (_) {}

  const check = () => {
    if (booted() && !errorPage()) {
      try { sessionStorage.removeItem(KEY); } catch (_) {}
      return;
    }
    if (attempts >= MAX_ATTEMPTS) {
      warn('boot watchdog: giving up after repeated failures');
      return;
    }
    if (!navigator.onLine) {
      window.addEventListener('online', check, { once: true });
      return;
    }
    try { sessionStorage.setItem(KEY, String(attempts + 1)); } catch (_) {}
    requestReload(`boot failed (attempt ${attempts + 1})`, 10_000);
  };

  // Backs off with each consecutive failure: 20 s, 40 s, 60 s, 80 s…
  setTimeout(check, 20_000 * Math.min(4, attempts + 1));

  // Lazy chunks can also fail long after boot (navigating on a bad signal).
  window.addEventListener('unhandledrejection', (e) => {
    let message = '';
    try { message = String((e as PromiseRejectionEvent).reason?.message || (e as PromiseRejectionEvent).reason || ''); } catch (_) {}
    if (/loading (css )?chunk .* failed|chunkloaderror/i.test(message) && navigator.onLine) {
      requestReload(`chunk load failed: ${message.slice(0, 80)}`, 120_000);
    }
  });
}

/**
 * Playback that claims to be playing but has stopped advancing.
 *
 * Stage 1 (12 s): toggle through Spotify's own button, which makes its state
 * machine re-request the stream — the cheap fix for a starved or desynced
 * element. Stage 2 (35 s): reload the player; Spotify restores the session.
 * Both are skipped while offline, where a stall is expected and a reload would
 * only strand the user on the offline page.
 */
function initPlaybackWatchdog() {
  let lastPosition = -1;
  let lastClock = '';
  let stuckSince = 0;
  let stage = 0;

  setInterval(() => {
    const clock = document.querySelector('[data-testid="playback-position"]')?.textContent || '';
    const moving = pageState.position !== lastPosition || clock !== lastClock;
    lastPosition = pageState.position;
    lastClock = clock;

    // Only when a real track is loaded. On a fresh, logged-out install the landing
    // page has media that "plays" without advancing, and the watchdog reloaded
    // that page every few minutes (verified on a clean release install). So:
    // a title in the player, and either Spotify's own button says playing or the
    // element playing is catalogue audio (MediaSource blob:) or an ad creative.
    const hasTrack = !!document.querySelector('[data-testid="context-item-info-title"]')?.textContent?.trim();
    const elementPlaying =
      pageState.hasMedia && !pageState.paused && (pageState.src.startsWith('blob:') || pageState.ad);
    const claimsPlaying = hasTrack && (elementPlaying || uiSaysPlaying());

    if (!claimsPlaying || moving || !navigator.onLine) {
      stuckSince = 0;
      stage = 0;
      return;
    }
    if (!stuckSince) {
      stuckSince = Date.now();
      return;
    }

    const stuckFor = Date.now() - stuckSince;
    if (stage === 0 && stuckFor > 12_000) {
      stage = 1;
      warn(`playback stalled ${stuckFor}ms (element paused=${pageState.paused}, ui=${uiSaysPlaying()}) — toggling`);
      sendNative({ type: 'PAGE_LOG', text: 'watchdog: stall → recover' });
      pageAction('recover');
    } else if (stage === 1 && stuckFor > 35_000) {
      stage = 2;
      requestReload(`playback stalled for ${Math.round(stuckFor / 1000)}s`, 180_000);
    }
  }, 2000);
}

// ── Metadata ─────────────────────────────────────────────────────────────────

function diagnose(): string {
  const page = (window as any).wrappedJSObject;
  return [
    `pageScript=${page?._spotiliePage ? 'yes' : 'NO'}`,
    `patched=[${pageState.patched || 'NONE'}]`,
    `AD{${adDebug.get()}}`,
    `media=${pageState.hasMedia ? 'yes' : 'none'}`,
    `dur=${pageState.duration}`,
    `desktopShell=${document.querySelector('[data-testid="left-sidebar"], .Root__nav-bar, nav[aria-label="Main"]') ? 'yes' : 'no'}`,
  ].join(' ');
}

interface TrackInfo {
  title: string;
  artist: string;
  artwork: string;
  isPlaying: boolean;
  duration: number;
  position: number;
}

function initMetadataSync() {
  let last = '';

  // The media element is authoritative when the page world has one; the button
  // label is the fallback (and is localised).
  const isPlaying = (): boolean => (pageState.hasMedia ? !pageState.paused : uiSaysPlaying());

  /** Ask for the 640px rendition rather than the bar's 64px thumbnail. */
  const readArtwork = (): string => {
    const img = document.querySelector(
      '[data-testid="now-playing-widget"] img, [data-testid="cover-art-image"]'
    ) as HTMLImageElement | null;
    return (img?.src || '').replace(/ab67616d0000(4851|1e02)/, 'ab67616d0000b273');
  };

  /**
   * "3:45" → ms, and whether it was negative. Spotify's duration field shows
   * time *remaining* ("-0:23") when toggled.
   */
  const parseClock = (selector: string): { ms: number; negative: boolean } => {
    const raw = document.querySelector(selector)?.textContent?.trim() || '';
    const negative = raw.startsWith('-');
    const parts = raw.replace(/^-/, '').split(':').map(Number);
    if (parts.length < 2 || parts.some((n) => isNaN(n) || n < 0)) {
      return { ms: 0, negative };
    }
    const seconds = parts.length === 3
      ? parts[0] * 3600 + parts[1] * 60 + parts[2]
      : parts[0] * 60 + parts[1];
    return { ms: seconds * 1000, negative };
  };

  const readTiming = (): { duration: number; position: number } => {
    if (pageState.duration > 0) {
      return { duration: pageState.duration, position: pageState.position };
    }
    const position = parseClock('[data-testid="playback-position"]').ms;
    const duration = parseClock('[data-testid="playback-duration"]');
    return {
      duration: duration.negative ? position + duration.ms : duration.ms,
      position,
    };
  };

  const readTrack = (): TrackInfo | null => {
    const titleEl = document.querySelector('[data-testid="context-item-info-title"]');
    const artistEl = document.querySelector('[data-testid="context-item-info-subtitles"]');

    let title = titleEl?.textContent?.trim() || '';
    let artist = artistEl?.textContent?.trim() || '';

    if (!title) {
      const docTitle = (document.title || '').trim();
      const dash = docTitle.indexOf(' - ');
      if (dash < 1) return null;
      title = docTitle.slice(0, dash).trim();
      artist = docTitle.slice(dash + 3).trim();
      const dot = artist.lastIndexOf(' · ');
      if (dot > 0) artist = artist.slice(0, dot).trim();
    }

    if (!title || title.toLowerCase() === 'spotify') return null;

    return { title, artist, artwork: readArtwork(), isPlaying: isPlaying(), ...readTiming() };
  };

  // Where media3 thinks playback is: the last position we sent, extrapolated.
  let sentPosition = 0;
  let sentAt = 0;
  let sentPlaying = false;

  const send = () => {
    const track = readTrack();
    if (!track) return;

    // Position moves constantly and media3 extrapolates between updates, so it
    // isn't part of the change key — otherwise every tick would be a change.
    // But a *jump* (a seek from the notification or in-app, or a stall) must be
    // sent, or the notification keeps showing the old time.
    const key = `${track.title}|${track.artist}|${track.artwork}|${track.isPlaying}|${track.duration}`;
    const now = Date.now();
    const expected = sentPlaying ? sentPosition + (now - sentAt) : sentPosition;
    const jumped = Math.abs(track.position - expected) > 2500;
    if (key === last && !jumped) return;
    last = key;
    sentPosition = track.position;
    sentAt = now;
    sentPlaying = track.isPlaying;

    sendNative({
      type: 'UPDATE_METADATA',
      ...track,
      ...(DEBUG ? { probe: diagnose() } : {}),
    });
    log(`metadata → "${track.title}" — ${track.artist} (playing=${track.isPlaying})`);
  };

  // Timer-based, not rAF: this has to keep running with the app in the
  // background, which is exactly when the notification matters most.
  const scheduleSend = coalescedTimer(send);

  document.addEventListener('spotilie-state', scheduleSend);
  setInterval(scheduleSend, 3000);

  const titleEl = document.querySelector('title');
  if (titleEl) {
    new MutationObserver(scheduleSend).observe(titleEl, {
      subtree: true, characterData: true, childList: true,
    });
  }

  whenBody(() => {
    let attached = false;
    const attach = () => {
      if (attached) return;
      const bar =
        document.querySelector('[data-testid="now-playing-bar"]') ||
        document.querySelector('.Root__now-playing-bar');
      if (!bar) return;
      attached = true;
      new MutationObserver(scheduleSend).observe(bar, {
        subtree: true, childList: true, characterData: true,
        attributes: true, attributeFilter: ['aria-label', 'src'],
      });
      observer.disconnect();
    };
    const observer = new MutationObserver(coalesced(attach));
    observer.observe(document.body, { childList: true, subtree: true });
    attach();
  });
}

// ── Debug ────────────────────────────────────────────────────────────────────

/**
 * DEBUG builds only (compiled out otherwise):
 *  - relays page-world log lines to logcat;
 *  - evaluates JS sent from adb, so live DOM can be inspected without guessing:
 *    adb shell am broadcast -a com.spotilie.app.DEBUG_EVAL -p com.spotilie.app --es b64 <base64 js>
 */
function initDebugHooks() {
  if (!DEBUG) return;

  document.addEventListener(PAGE_LOG_EVENT, (e) => {
    try { sendNative({ type: 'PAGE_LOG', text: JSON.parse((e as CustomEvent).detail) }); } catch (_) {}
  });

  ext()?.runtime?.onMessage?.addListener((msg: any) => {
    if (msg?.type !== 'DEBUG_EVAL' || typeof msg.js !== 'string') return;
    let out: string;
    try {
      const result = new Function(msg.js)();
      out = typeof result === 'string' ? result : JSON.stringify(result);
    } catch (err) {
      out = `EVAL ERROR: ${err}`;
    }
    debugDump(`EVAL> ${out}`);
  });
}
