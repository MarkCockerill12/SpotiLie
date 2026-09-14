/**
 * Shared helpers for the injector modules.
 *
 * The injector runs inside Spotify's page at document_start, so everything here
 * is written to be cheap: this code shares a main thread with a large React app
 * that re-renders constantly.
 */

declare const process: { env: { SPOTILIE_DEBUG?: string } };

/**
 * Set by `build.ps1 -Debug`. Bun inlines the value at build time, so a normal
 * build constant-folds every `log()` call away instead of shipping console
 * noise — the old build logged every tap and every play() call in production.
 */
export const DEBUG = process.env.SPOTILIE_DEBUG === '1';

export function log(...args: unknown[]) {
  if (DEBUG) console.log('SpotiLIE:', ...args);
}

export function warn(...args: unknown[]) {
  if (DEBUG) console.warn('SpotiLIE:', ...args);
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
/** DEBUG only: page-world log lines, relayed to logcat by the content script. */
export const PAGE_LOG_EVENT = 'spotilie-page-log';

/** Ask the page world to do something that needs the real media element. */
export function pageAction(action: string, value = 0) {
  document.dispatchEvent(
    new CustomEvent(ACTION_EVENT, { detail: JSON.stringify({ action, value }) })
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
