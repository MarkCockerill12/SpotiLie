/** Page world helpers shared by controls.ts and menu.ts. */

import { DEBUG, PAGE_LOG_EVENT, TO_NATIVE_EVENT } from './shared';

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Poll until `fn` is truthy or the time runs out. */
export async function waitFor<T>(fn: () => T, timeoutMs: number): Promise<T | null> {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    const v = fn();
    if (v) return v;
    await sleep(100);
  }
  return null;
}

export function pageLog(text: string) {
  if (DEBUG) document.dispatchEvent(new CustomEvent(PAGE_LOG_EVENT, { detail: JSON.stringify(text) }));
}

/** Page world → native (relayed by the content script). */
export function toNative(msg: Record<string, unknown>) {
  document.dispatchEvent(new CustomEvent(TO_NATIVE_EVENT, { detail: JSON.stringify(msg) }));
}

/** Close any open Spotify menu. Escape only works when it targets an item inside it. */
export async function closeMenus() {
  for (let i = 0; i < 3; i++) {
    const item = document.querySelector('[role="menu"] [role="menuitem"]');
    if (!item) return;
    item.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true }));
    await sleep(250);
  }
}

/** Go to an in-app path through Spotify's own router. */
export function navigate(path: string) {
  if (!/^\/[a-z-]+(\/[A-Za-z0-9]+)?([?#].*)?$/.test(path)) return;
  const link = document.querySelector(`a[href="${path}"]`) as HTMLElement | null;
  if (link) { link.click(); return; }
  history.pushState(null, '', path);
  dispatchEvent(new PopStateEvent('popstate'));
}

/**
 * Walk React's fiber tree upwards from `el` looking for a Spotify URI in props.
 * Unofficial, so only ever used to *find* things (navigate to a playlist, find a
 * row) — never to perform an action — and always with a fallback.
 */
export function uriFromProps(el: Element | null, pattern: RegExp, depth = 40): string {
  if (!el) return '';
  const key = Object.keys(el).find((k) => k.startsWith('__reactFiber'));
  let f = key ? (el as any)[key] : null;
  for (let i = 0; f && i < depth; i++, f = f.return) {
    const props = f.memoizedProps || {};
    for (const k of Object.keys(props)) {
      const v = props[k];
      if (typeof v === 'string' && pattern.test(v)) return v;
      if (v && typeof v === 'object' && typeof v.uri === 'string' && pattern.test(v.uri)) return v.uri;
    }
  }
  return '';
}
