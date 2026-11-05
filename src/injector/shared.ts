/**
 * Shared helpers for the injector modules.
 *
 * The injector runs inside Spotify's page at document_start, so everything here
 * is written to be cheap: this code shares a main thread with a large React app
 * that re-renders constantly.
 */

/**
 * Set by `build.ps1 -Debug` (`process` is declared in src/env.d.ts). Bun inlines
 * the value at build time, so in a normal build this is `false` and every
 * `log()` call is a no-op. Note it does not *remove* code guarded by this const
 * from the bundle — for debug-only code that must not ship at all, test
 * `process.env.SPOTILIE_DEBUG === '1'` directly at the call site instead.
 */
export const DEBUG = process.env.SPOTILIE_DEBUG === '1';

export function log(...args: unknown[]) {
  if (DEBUG) console.log('SpotiLIE:', ...args);
}

export function warn(...args: unknown[]) {
  if (DEBUG) console.warn('SpotiLIE:', ...args);
}

// ── What's playing ───────────────────────────────────────────────────────────

/**
 * Spotify's player widget, both layouts. Late 2026 Spotify shipped
 * `now-playing-widget-v2` and dropped `context-item-info-title/-subtitles` and
 * `context-item-link` (verified on device 2026-11-05). Every metadata read went
 * blank: the media session never saw "playing", so the app never went
 * foreground and Samsung froze it in the background. Read it in ONE place.
 */
const WIDGET = '[data-testid="now-playing-widget"], [data-testid="now-playing-widget-v2"]';
/** Real catalogue items link to these; an ad links to none of them. */
const CONTENT_PATHS = ['/track/', '/episode/', '/album/', '/chapter/', '/show/', '/audiobook/'];
/** Title link preference: the item itself before its container (album/show). */
const TITLE_PATHS = ['/track/', '/episode/', '/chapter/', '/album/', '/audiobook/', '/show/'];

export interface NowPlaying {
  title: string;
  artist: string;
  /** Widget links to real catalogue content. */
  contentLinked: boolean;
  /** Widget links to an /ad/ page. */
  adLinked: boolean;
  /** Album art from the widget (small rendition). */
  artwork: string;
  /** Spotify's save button: ticked = saved to Liked Songs or a playlist. -1 = no button. */
  saved: -1 | 0 | 1;
  /** 0 off, 1 all, 2 one — from the repeat button's aria-checked (locale-independent). */
  repeat: 0 | 1 | 2;
  /** 0 off, 1 shuffle, 2 Smart Shuffle; -1 unknown. */
  shuffle: -1 | 0 | 1 | 2;
}

/** The shuffle button in the player bar (it has no test id). */
export function shuffleButton(): HTMLElement | null {
  const gc = document.querySelector('[data-testid="general-controls"]');
  return ([...(gc?.querySelectorAll('button') || [])] as HTMLElement[])
    .find((b) => /shuffle/i.test(b.getAttribute('aria-label') || '')) || null;
}

/**
 * The label names the *next* action: "Enable shuffle…" = off now,
 * "Enable Smart Shuffle…" = shuffle on, "Disable Smart Shuffle…" = smart on,
 * "Disable shuffle…" = on (accounts without Smart Shuffle). English labels;
 * other locales fall back to the button's active (accent) styling.
 */
export function shuffleMode(): -1 | 0 | 1 | 2 {
  const b = shuffleButton();
  if (!b) return -1;
  const label = (b.getAttribute('aria-label') || '').toLowerCase();
  if (label.startsWith('disable smart')) return 2;
  if (label.startsWith('enable smart') || label.startsWith('disable shuffle')) return 1;
  if (label.startsWith('enable shuffle')) return 0;
  return /accent|active/i.test(b.className) ? 1 : 0;
}

const textOf = (el: Element | null | undefined) => (el?.textContent || '').trim();

export function readNowPlaying(): NowPlaying {
  const widget = document.querySelector(WIDGET);
  const links = [
    ...(widget?.querySelectorAll('a[href]') || []),
    // Old layout put the title link outside the widget.
    ...document.querySelectorAll('[data-testid="context-item-link"]'),
  ] as HTMLAnchorElement[];
  const hrefs = links.map((a) => a.getAttribute('href') || '');

  // Old layout first, new layout second.
  let title = textOf(document.querySelector('[data-testid="context-item-info-title"]'));
  if (!title) {
    for (const p of TITLE_PATHS) {
      const i = hrefs.findIndex((h) => h.includes(p));
      if (i >= 0 && textOf(links[i])) { title = textOf(links[i]); break; }
    }
  }
  const artist =
    textOf(document.querySelector('[data-testid="context-item-info-subtitles"]')) ||
    textOf(widget?.querySelector('[data-testid="now-playing-widget-v2-byline"]'));

  const img = (widget?.querySelector('img') ||
    document.querySelector('[data-testid="now-playing-bar"] [data-testid="cover-art-image"]')) as HTMLImageElement | null;

  const save = widget?.querySelector('button[aria-checked]');
  const repeatAttr = document.querySelector('[data-testid="control-button-repeat"]')?.getAttribute('aria-checked');

  return {
    title,
    artist,
    saved: save ? (save.getAttribute('aria-checked') === 'true' ? 1 : 0) : -1,
    repeat: repeatAttr === 'mixed' ? 2 : repeatAttr === 'true' ? 1 : 0,
    shuffle: shuffleMode(),
    contentLinked: hrefs.some((h) => CONTENT_PATHS.some((p) => h.includes(p))),
    adLinked: hrefs.some((h) => h.includes('/ad/')),
    artwork: img?.src || '',
  };
}

/** The bar's thumbnail → the 640 px rendition (codes: 4851 64px, 1e02 300px, e1a3 small webp). */
export function largeArtwork(src: string): string {
  return src.replace(/ab67616d0000(4851|1e02|e1a3)/, 'ab67616d0000b273');
}

/**
 * Coalesce a callback onto the next animation frame.
 *
 * MutationObserver callbacks on a React SPA fire hundreds of times a second.
 * Running DOM queries directly in one is the single most expensive thing this
 * injector could do, so every observer routes through here instead.
 */
export function coalesced(fn: () => void): () => void {
  let scheduled = false;
  return () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      try { fn(); } catch (_) {}
    });
  };
}

/**
 * Like `coalesced()`, but on a timer.
 *
 * requestAnimationFrame never fires while the page is hidden — app in the
 * background, screen off — so anything scheduled through `coalesced()` silently
 * stops there. The media notification's metadata went through it, which is why
 * the notification froze on the first song once the app left the screen.
 */
export function coalescedTimer(fn: () => void, delayMs = 50): () => void {
  let scheduled = false;
  return () => {
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => {
      scheduled = false;
      try { fn(); } catch (_) {}
    }, delayMs);
  };
}

/** Run once `document.body` exists. At document_start it usually doesn't yet. */
export function whenBody(fn: () => void) {
  if (document.body) { fn(); return; }
  new MutationObserver((_, obs) => {
    if (document.body) { obs.disconnect(); fn(); }
  }).observe(document.documentElement, { childList: true });
}

// ── Cross-world channel ──────────────────────────────────────────────────────
//
// The content script and the page script share a DOM but not their globals, so
// they talk over CustomEvents. Payloads are JSON strings: structured objects
// don't survive the Xray boundary intact.

export const ACTION_EVENT = 'spotilie-action';
export const STATE_EVENT = 'spotilie-state';
/** Fired by the page world after Spotify's router calls pushState/replaceState. */
export const NAV_EVENT = 'spotilie-navigated';
/** Page world → native: a JSON message the content script forwards as-is. */
export const TO_NATIVE_EVENT = 'spotilie-to-native';
/** DEBUG only: page-world log lines, relayed to logcat by the content script. */
export const PAGE_LOG_EVENT = 'spotilie-page-log';

/** Ask the page world to do something that needs the real media element. */
export function pageAction(action: string, value = 0, arg = '') {
  document.dispatchEvent(
    new CustomEvent(ACTION_EVENT, { detail: JSON.stringify({ action, value, arg }) })
  );
}

export interface PageState {
  duration: number;
  position: number;
  src: string;
  paused: boolean;
  /** Whether the page world has a media element to report on at all. */
  hasMedia: boolean;
  /** The current element is playing an ad creative (and is being fast-forwarded). */
  ad: boolean;
  /** DEBUG: entitlement fields the page-world spoof actually rewrote. */
  patched: string;
}

/** Latest playback state pushed up from the page world. */
export const pageState: PageState = {
  duration: 0, position: 0, src: '', paused: true, hasMedia: false, ad: false, patched: '',
};

export function initPageStateListener(onChange?: () => void) {
  document.addEventListener(STATE_EVENT, (e) => {
    try {
      Object.assign(pageState, JSON.parse((e as CustomEvent).detail));
      onChange?.();
    } catch (_) {}
  });
}

/** WebExtension API surface, present because we're injected as a content script. */
export function ext(): any {
  return (globalThis as any).browser || (globalThis as any).chrome;
}

/** Fire-and-forget message to the background script (and from there, Kotlin). */
export function sendNative(message: Record<string, unknown>) {
  try {
    ext()?.runtime?.sendMessage?.(message)?.catch?.(() => {});
  } catch (_) {}
}

/** DEBUG: push text to logcat in chunks small enough to survive its line limit. */
export function debugDump(text: string) {
  if (!DEBUG) return;
  const CHUNK = 1500;
  for (let i = 0; i < text.length; i += CHUNK) {
    sendNative({ type: 'DEBUG_DUMP', part: Math.floor(i / CHUNK), text: text.slice(i, i + CHUNK) });
  }
}

/**
 * Ask Kotlin to reload the player (it re-arms the desktop UA first, which a
 * plain `location.reload()` would not). Rate-limited across reloads through
 * sessionStorage so a persistent fault can't become a reload loop.
 */
export function requestReload(reason: string, minIntervalMs = 60_000) {
  const KEY = 'spotilie-last-reload';
  try {
    const last = Number(sessionStorage.getItem(KEY) || 0);
    if (Date.now() - last < minIntervalMs) return;
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch (_) {}
  warn(`requesting reload: ${reason}`);
  if (ext()?.runtime?.sendMessage) sendNative({ type: 'RELOAD', reason });
  else location.reload();
}
