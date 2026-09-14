/**
 * Page-world script. Injected by the content script as a <script> tag so it
 * runs in Spotify's own JavaScript context.
 *
 * This split is not optional. Firefox gives content scripts an isolated global
 * — patching `JSON.parse`, `Response.prototype.json` or `navigator` from there
 * leaves Spotify's bundle using the originals, so the premium unlocks silently
 * did nothing. Measured on device: `pageJSONpatched=no`.
 *
 * Everything here needs page globals or the real media element. Anything that
 * only touches the DOM stays in the content script, which is easier to reason
 * about and can talk to the extension APIs directly.
 */

import { initJsonSpoofing, patchStats } from './adblock';
import { initDesktop } from './desktop';
import { ACTION_EVENT, DEBUG, NAV_EVENT, PAGE_LOG_EVENT, STATE_EVENT } from './shared';

function pageLog(text: string) {
  if (!DEBUG) return;
  document.dispatchEvent(new CustomEvent(PAGE_LOG_EVENT, { detail: JSON.stringify(text) }));
}

// ── Media element registry ───────────────────────────────────────────────────

/**
 * Spotify builds its audio element in JS and never appends it to the document,
 * so it can't be found by querying the DOM. Capture them at construction
 * instead — this runs before Spotify's bundle, so nothing is missed.
 *
 * ⚠ Because the element is detached, its events never propagate to `document`.
 * The previous version listened for play/pause/loadstart on the document, so
 * none of those listeners ever fired: state only refreshed on a 2 s poll, which
 * is why ads were audible for seconds before the guard reacted. Listeners are
 * now attached to each element directly.
 */
const elements = new Set<HTMLMediaElement>();

/** The element that most recently started playing. */
let lastPlayed: HTMLMediaElement | null = null;

const MEDIA_EVENTS = [
  'play', 'playing', 'pause', 'ended', 'loadstart', 'emptied', 'loadedmetadata',
  'durationchange', 'seeked', 'error', 'stalled', 'waiting', 'ratechange',
];

const srcOf = (el: HTMLMediaElement) => el.currentSrc || el.src || '';

function register(el: HTMLMediaElement) {
  if (elements.has(el)) return;
  elements.add(el);
  for (const type of MEDIA_EVENTS) el.addEventListener(type, onMediaEvent);
  prune();
}

/** Drop idle, sourceless, detached elements so the registry can't grow forever. */
function prune() {
  if (elements.size <= 12) return;
  for (const el of elements) {
    if (el !== lastPlayed && el.paused && !srcOf(el) && !el.isConnected) {
      for (const type of MEDIA_EVENTS) el.removeEventListener(type, onMediaEvent);
      elements.delete(el);
    }
  }
}

function captureMediaElements() {
  const isMedia = (tag: string) => /^(audio|video)$/i.test(tag);

  const originalCreate = document.createElement;
  document.createElement = function (
    this: Document,
    tagName: string,
    options?: ElementCreationOptions
  ) {
    const el = originalCreate.call(this, tagName, options);
    if (isMedia(tagName)) register(el as HTMLMediaElement);
    return el;
  } as typeof document.createElement;

  // `new Audio()` doesn't necessarily route through createElement.
  const OriginalAudio = window.Audio;
  if (OriginalAudio) {
    window.Audio = function (src?: string) {
      const el = new OriginalAudio(src);
      register(el);
      return el;
    } as unknown as typeof Audio;
    window.Audio.prototype = OriginalAudio.prototype;
  }

  // Last resort: anything that actually plays gets registered.
  const originalPlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
    register(this);
    return originalPlay.apply(this);
  };
}

/** Elements we muted, so unmuting never overrides a mute that wasn't ours. */
const mutedByUs = new WeakSet<HTMLMediaElement>();

/**
 * Canvas loops and muted feed previews are decoration, not the player. The old
 * `current()` returned `document.querySelector('audio, video')` first — which is
 * the Canvas video whenever one is on screen — so the notification showed the
 * loop's timing and a notification "pause" paused the Canvas instead of music.
 */
function isDecoration(el: HTMLMediaElement): boolean {
  if (el.loop) return true;
  if (srcOf(el).includes('canvaz.scdn.co')) return true;
  return el instanceof HTMLVideoElement && el.muted && !mutedByUs.has(el);
}

/** The element currently responsible for audio. */
function current(): HTMLMediaElement | null {
  for (const el of elements) {
    if (!isDecoration(el) && !el.paused) return el;
  }
  return lastPlayed && !isDecoration(lastPlayed) ? lastPlayed : null;
}

// ── Audio ads ────────────────────────────────────────────────────────────────

/**
 * Ad creatives are plain MP3 files on Spotify's asset CDN
 * (`https://…-assets.scdn.co/mp3/<sha1>.mp3`, captured during a live ad).
 * Catalogue music is always a MediaSource `blob:`. Deliberately narrower than
 * "any .mp3": externally hosted podcast episodes are plain MP3s too, and
 * previews live under `/mp3-preview/`.
 */
const isAdSource = (src: string) => /^https?:\/\/[^/]*scdn\.co\/mp3\//i.test(src);

/**
 * Ads are muted, and long ones fast-forwarded — never seeked to the end.
 *
 * Spotify's ad controller tracks progress (quartile events); a creative that
 * jumps from 0 to the end is not a completion it expects.
 *
 * ⚠ Measured on device (2026-09-13): Spotify plays music AND ads through one
 * reused <video>. Setting playbackRate=16 at loadstart on a short creative put
 * the element into `waiting` at t=0 for ~15 s — the stall watchdog had to kick
 * it. The same creative left at 1x finished in 1.2 s. So the rate is only
 * applied to creatives long enough to be worth it, only once the element can
 * actually play, and is dropped back to 1x if the element wedges in `waiting`.
 */
const AD_RATES = [16, 8, 4, 2];
/** Creatives shorter than this just play out muted at 1x. */
const AD_MIN_FAST_FORWARD_S = 5;
/** Caps how often we re-apply the rate if something keeps resetting it. */
const MAX_RATE_FIGHTS = 6;
/** How long a fast-forwarded creative may sit in `waiting` before going back to 1x. */
const AD_WEDGE_MS = 2000;

interface AdRateState {
  src: string;
  fights: number;
  waitingSince: number;
}
/** Keyed by element but reset per source, because the element is reused. */
const adRate = new WeakMap<HTMLMediaElement, AdRateState>();

/**
 * Set while the content-side detector wants everything silent. Mute state is
 * derived from (ad source || forcedMute) on every media event and every tick,
 * so an element can never be left muted after an ad: previously, an element
 * whose source was still the creative at the instant "unmute" arrived was
 * skipped, then played the next song muted.
 */
let forcedMute = false;

function mute(el: HTMLMediaElement) {
  if (!el.muted) {
    el.muted = true;
    mutedByUs.add(el);
  }
}

function unmute(el: HTMLMediaElement) {
  if (mutedByUs.has(el)) {
    el.muted = false;
    mutedByUs.delete(el);
  }
}

/**
 * Reconcile one element with the ad state. Idempotent: runs on every media
 * event and on the 1 s tick (which is what catches a wedged `waiting` element,
 * since a stuck element emits no further events).
 */
function guardAd(el: HTMLMediaElement, eventType = '') {
  const src = srcOf(el);
  const ad = isAdSource(src);

  if (ad || (forcedMute && !isDecoration(el))) mute(el);
  else unmute(el);

  if (!ad) {
    if (adRate.has(el)) {
      // Same element reused for real audio: hand it back at normal speed.
      adRate.delete(el);
      try { if (el.playbackRate !== 1) el.playbackRate = 1; } catch (_) {}
      pageLog(`ad element released #${idOf(el)}`);
    }
    return;
  }

  let state = adRate.get(el);
  if (!state || state.src !== src) {
    state = { src, fights: 0, waitingSince: 0 };
    adRate.set(el, state);
  }
  if (eventType === 'waiting') state.waitingSince = state.waitingSince || Date.now();
  else if (eventType === 'playing' || eventType === 'seeked') state.waitingSince = 0;

  const wedged =
    el.playbackRate > 1 && state.waitingSince > 0 && Date.now() - state.waitingSince > AD_WEDGE_MS;
  if (wedged) {
    try { el.playbackRate = 1; } catch (_) {}
    state.fights = MAX_RATE_FIGHTS;
    state.waitingSince = 0;
    pageLog(`ad fast-forward wedged — back to 1x #${idOf(el)}`);
    return;
  }

  const worthIt = isFinite(el.duration) && el.duration > AD_MIN_FAST_FORWARD_S;
  const canPlay = el.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA;
  if (worthIt && canPlay && el.playbackRate < AD_RATES[0] && state.fights < MAX_RATE_FIGHTS) {
    state.fights++;
    for (const rate of AD_RATES) {
      try { el.playbackRate = rate; break; } catch (_) {}
    }
    pageLog(`ad fast-forward rate=${el.playbackRate} dur=${el.duration.toFixed(1)} #${idOf(el)}`);
  }
}

/** DEBUG: stable per-element ids, so logs show when Spotify reuses an element. */
const ids = new WeakMap<HTMLMediaElement, number>();
let nextId = 1;
function idOf(el: HTMLMediaElement): number {
  let id = ids.get(el);
  if (!id) {
    id = nextId++;
    ids.set(el, id);
  }
  return id;
}

function onMediaEvent(e: Event) {
  const el = e.currentTarget as HTMLMediaElement;
  if (e.type === 'play' || e.type === 'playing') lastPlayed = el;
  guardAd(el, e.type);

  if (DEBUG && e.type !== 'ratechange') {
    const err = e.type === 'error' && el.error ? ` err=${el.error.code}:${el.error.message}` : '';
    pageLog(
      `media:${e.type} ${el.tagName}#${idOf(el)} t=${el.currentTime.toFixed(1)} dur=${isFinite(el.duration) ? el.duration.toFixed(1) : '?'}` +
      ` rate=${el.playbackRate} muted=${el.muted} src=…${srcOf(el).slice(-48)}${err}`
    );
  }
  reportState();
}

// ── Transport ────────────────────────────────────────────────────────────────

const PLAY_PAUSE = 'button[data-testid="control-button-playpause"]';

function clickSelector(selector: string): boolean {
  const el = document.querySelector(selector) as HTMLElement | null;
  if (!el) return false;
  try { el.click(); return true; } catch (_) { return false; }
}

/**
 * Whether the player is actually producing audio. The media element is
 * authoritative; the button label is only a fallback, and it is localised.
 *
 * `play` and `pause` used to click the play/pause *toggle* unconditionally, so
 * a notification "play" while already playing paused the music — and then
 * called `el.play()` behind Spotify's back, desynchronising its state machine.
 */
function isPlaying(): boolean {
  const el = current();
  if (el) return !el.paused;
  return (document.querySelector(PLAY_PAUSE)?.getAttribute('aria-label') || '').toLowerCase() === 'pause';
}

function setMutedAll(muted: boolean) {
  forcedMute = muted;
  for (const el of elements) guardAd(el);
}

function handleAction(action: string, value: number) {
  switch (action) {
    case 'play':
      if (!isPlaying() && !clickSelector(PLAY_PAUSE)) current()?.play().catch(() => {});
      break;

    case 'pause':
      if (isPlaying() && !clickSelector(PLAY_PAUSE)) current()?.pause();
      break;

    case 'toggle':
      if (!clickSelector(PLAY_PAUSE)) {
        const el = current();
        if (el?.paused) el.play().catch(() => {});
        else el?.pause();
      }
      break;

    // Test ids only. The old aria-label*="Next" fallback could match unrelated
    // buttons elsewhere on the page.
    case 'next':
      clickSelector('button[data-testid="control-button-skip-forward"]');
      break;

    case 'prev':
      clickSelector('button[data-testid="control-button-skip-back"]');
      break;

    case 'seek': {
      const el = current();
      if (el && isFinite(el.duration)) {
        try { el.currentTime = Math.min(value / 1000, el.duration); } catch (_) {}
      }
      break;
    }

    case 'mute':
      setMutedAll(true);
      break;

    case 'unmute':
      setMutedAll(false);
      break;

    /** Content-side detector saw an ad: make sure every creative is fast-forwarding. */
    case 'skip-ad': {
      for (const el of elements) guardAd(el);
      const btn = document.querySelector('[data-testid="skip-ad-button"]') as HTMLButtonElement | null;
      if (btn && !btn.disabled) {
        try { btn.click(); } catch (_) {}
      }
      break;
    }

    /**
     * Stall recovery. Toggles through Spotify's own button, off then on, so its
     * state machine re-requests the stream. Works whether the element or the UI
     * is the side that is stuck, which a state-aware play/pause could not.
     */
    case 'recover':
      if (clickSelector(PLAY_PAUSE)) setTimeout(() => clickSelector(PLAY_PAUSE), 900);
      break;
  }
}

// ── State reporting ──────────────────────────────────────────────────────────

let lastDetail = '';

/** Push timing and source up to the content script, which owns metadata sync. */
function reportState() {
  const el = current();
  const src = el ? srcOf(el) : '';
  const detail = JSON.stringify({
    duration: el && isFinite(el.duration) && el.duration > 0 ? Math.round(el.duration * 1000) : 0,
    position: el ? Math.round(el.currentTime * 1000) : 0,
    src,
    paused: el ? el.paused : true,
    hasMedia: !!el,
    ad: !!el && !el.paused && isAdSource(src),
    // Which entitlement fields the deep walk actually rewrote (DEBUG probe).
    patched: DEBUG ? Object.keys(patchStats).map((k) => `${k}:${patchStats[k]}`).join(',') : '',
  });
  if (detail === lastDetail) return;
  lastDetail = detail;
  document.dispatchEvent(new CustomEvent(STATE_EVENT, { detail }));
}

(function () {
  if ((window as any)._spotiliePage) return;
  (window as any)._spotiliePage = true;

  // Before anything else: capture media elements and intercept parsing, both of
  // which must beat Spotify's bundle to the punch.
  captureMediaElements();
  initJsonSpoofing();
  initDesktop();

  pageLog(
    `page.js running at ${Math.round(performance.now())}ms readyState=${document.readyState}` +
    ` scriptsBefore=${document.scripts.length}`
  );

  // Spotify's router navigates with pushState, which fires no event. A patch in
  // the content script is invisible to page code, so it has to live here.
  for (const method of ['pushState', 'replaceState'] as const) {
    const original = history[method];
    history[method] = function (this: History, ...args: Parameters<History['pushState']>) {
      const result = original.apply(this, args);
      document.dispatchEvent(new CustomEvent(NAV_EVENT));
      return result;
    };
  }

  document.addEventListener(ACTION_EVENT, (e) => {
    try {
      const { action, value } = JSON.parse((e as CustomEvent).detail);
      handleAction(action, value || 0);
    } catch (_) {}
  });

  // Media events drive state changes; this tick keeps position fresh for the
  // notification scrubber and the stall watchdog, and re-reconciles ad/mute
  // state (a wedged element emits nothing). Unchanged state isn't re-sent.
  setInterval(() => {
    for (const el of elements) guardAd(el);
    reportState();
  }, 1000);
})();
