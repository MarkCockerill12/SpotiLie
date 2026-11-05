/**
 * Page world: Spotify's own controls, driven for the native player
 * (NowPlayingUi / MenuSheet) and the media session.
 *
 * Everything goes through Spotify's real buttons, menus and shortcuts, so
 * shuffle modes, likes, playlist edits, queueing, radio and sharing run
 * Spotify's own logic and sync to the account exactly as a tap on the website
 * would. (The public Web API is not an option: it answers the web player's
 * token with 429 on every endpoint — verified.)
 *
 * Verified on device (2026-11-05):
 *  - clicks must be dispatched from the page world; content-script clicks are ignored;
 *  - the track menu opens on a `contextmenu` event on the now-playing widget;
 *    submenus open on hover; Escape keydown on a menu item closes it;
 *  - Alt+Shift+B toggles Liked Songs (no popup — works with the page hidden);
 *  - popups only render while the page is visible (rAF positioning).
 */

import { handleMenuAction, initTrackMenu } from './menu';
import { closeMenus, pageLog, sleep } from './pagekit';
import { DEBUG, shuffleButton, shuffleMode } from './shared';

const REPEAT = 'button[data-testid="control-button-repeat"]';

// ── Repeat ───────────────────────────────────────────────────────────────────

/** aria-checked is locale-independent: "false" off, "true" all, "mixed" one. */
export function repeatMode(): 0 | 1 | 2 {
  const v = document.querySelector(REPEAT)?.getAttribute('aria-checked');
  return v === 'mixed' ? 2 : v === 'true' ? 1 : 0;
}

/** Click through Spotify's off → all → one cycle until it lands on `target`. */
async function setRepeat(target: number) {
  for (let i = 0; i < 3 && repeatMode() !== target; i++) {
    (document.querySelector(REPEAT) as HTMLElement | null)?.click();
    await sleep(400);
  }
}

// ── Shuffle ──────────────────────────────────────────────────────────────────

/**
 * One step of Spotify's own cycle (off → shuffle → Smart Shuffle → off; plain
 * on/off for accounts without Smart Shuffle). A click while a menu is open only
 * closes the menu, so close menus first.
 */
async function shuffleCycle() {
  await closeMenus();
  shuffleButton()?.click();
}

/** From the notification / Auto: 0 = off, 1 = on (any shuffle mode counts). */
async function setShuffle(target: number) {
  await closeMenus();
  for (let i = 0; i < 3; i++) {
    const m = shuffleMode();
    if (m < 0 || (target === 0 ? m === 0 : m > 0)) return;
    shuffleButton()?.click();
    await sleep(700);
  }
}

// ── Liked Songs ──────────────────────────────────────────────────────────────

/** Spotify's Like shortcut. Toggles Liked Songs for the current track. */
function toggleLike() {
  const o = {
    key: 'B', code: 'KeyB', keyCode: 66, which: 66,
    altKey: true, shiftKey: true, bubbles: true, cancelable: true, composed: true,
  };
  document.dispatchEvent(new KeyboardEvent('keydown', o));
  document.dispatchEvent(new KeyboardEvent('keyup', o));
}

function saveButton(): HTMLElement | null {
  return document.querySelector(
    '[data-testid="now-playing-widget-v2"] button[aria-checked], [data-testid="now-playing-widget"] button[aria-checked]'
  );
}

/** "+": not saved anywhere → Liked Songs (exactly Spotify's + button). */
function save() {
  if (saveButton()?.getAttribute('aria-checked') !== 'true') toggleLike();
}

// ── Dispatch ─────────────────────────────────────────────────────────────────

export function initControls() {
  initTrackMenu();
}

/** Returns true when the action belonged here. */
export function handleControlAction(action: string, value: number, arg: string): boolean {
  switch (action) {
    case 'repeat': void setRepeat(value); return true;
    case 'shuffle': void setShuffle(value); return true;
    case 'shuffle-cycle': void shuffleCycle(); return true;
    case 'like-toggle': toggleLike(); return true;
    case 'save': save(); return true;
  }
  if (handleMenuAction(action, arg)) return true;
  if (DEBUG && action) pageLog(`unhandled action ${action}`);
  return false;
}
