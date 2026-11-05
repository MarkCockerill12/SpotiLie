/**
 * Page world: Spotify's track menu for the current song, mirrored into the
 * native MenuSheet. The page opens Spotify's real menu, reports its items, and
 * clicks the one the user picks — so every option Spotify offers (playlists,
 * Liked Songs, queue, radio, credits, share…) works with Spotify's own logic,
 * in the user's language, including options added later.
 *
 * Protocol (native → page actions; page → native messages):
 *   menu-open                → MENU {level 0, items}
 *   menu-select  "i" | "i/j" → MENU {level 1} for a submenu, else MENU_DONE / MENU_DIALOG
 *   menu-search  text        → MENU {level 1} filtered (playlist search box)
 *   menu-dialog  buttonLabel → MENU_DONE
 *   menu-close
 *   playlist-remove "uri\nname" → MENU_DONE | MENU {state: error}
 * Share → "Copy link" is captured from the clipboard call → SHARE_TEXT.
 */

import { closeMenus, navigate, pageLog, sleep, toNative, uriFromProps, waitFor } from './pagekit';

const WIDGET_TARGET =
  '[data-testid="now-playing-widget-v2"] a[href^="/album/"], [data-testid="now-playing-widget-v2"] a, ' +
  '[data-testid="now-playing-widget"] a, [data-testid="now-playing-widget"]';
/** Options that make no sense inside the app. */
const HIDDEN = /open in desktop app/i;
const PLAYLIST_URI = /^spotify:playlist:[A-Za-z0-9]+$/;
const TRACK_URI = /^spotify:(track|episode):[A-Za-z0-9]+$/;

let expectShareUntil = 0;

const label = (el: Element) => (el.textContent || '').trim().replace(/\s+/g, ' ');

function topItems(): HTMLElement[] {
  return [...document.querySelectorAll('#context-menu [role="menuitem"]')] as HTMLElement[];
}

/** The open submenu: a menu that doesn't hold the top-level items. */
function subMenu(): HTMLElement | null {
  const first = topItems()[0];
  return ([...document.querySelectorAll('[role="menu"]')] as HTMLElement[])
    .find((m) => !first || !m.contains(first)) || null;
}

function subItems(): HTMLElement[] {
  return [...(subMenu()?.querySelectorAll('[role="menuitem"]') || [])] as HTMLElement[];
}

function hover(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  const o = { bubbles: true, cancelable: true, view: window, clientX: r.left + 10, clientY: r.top + 5 };
  el.dispatchEvent(new PointerEvent('pointerover', o));
  el.dispatchEvent(new MouseEvent('mouseover', o));
  el.dispatchEvent(new MouseEvent('mousemove', o));
}

async function openTrackMenu(): Promise<boolean> {
  await closeMenus();
  const target = document.querySelector(WIDGET_TARGET) as HTMLElement | null;
  if (!target) return false;
  const r = target.getBoundingClientRect();
  target.dispatchEvent(new MouseEvent('contextmenu', {
    bubbles: true, cancelable: true, button: 2, buttons: 2, clientX: r.left + 5, clientY: r.top + 5, view: window,
  }));
  return !!(await waitFor(() => topItems().length > 0, 2500));
}

function fail(message: string) {
  toNative({ type: 'MENU', state: 'error', message });
}

function sendTop() {
  const items = topItems()
    .map((el, i) => ({ key: String(i), label: label(el), sub: el.hasAttribute('aria-expanded') }))
    .filter((it) => it.label && !HIDDEN.test(it.label));
  toNative({ type: 'MENU', state: 'ready', level: 0, title: '', items });
}

function sendSub(topIndex: number) {
  const top = topItems()[topIndex];
  const menu = subMenu();
  const items = subItems().map((el, j) => ({
    key: `${topIndex}/${j}`,
    label: label(el),
    sub: false,
    uri: uriFromProps(el, PLAYLIST_URI, 12),
  })).filter((it) => it.label);
  toNative({
    type: 'MENU', state: 'ready', level: 1,
    title: top ? label(top) : '',
    search: !!menu?.querySelector('input'),
    items,
  });
}

async function openSub(topIndex: number): Promise<boolean> {
  const top = topItems()[topIndex];
  if (!top) return false;
  if (top.getAttribute('aria-expanded') !== 'true') hover(top);
  return !!(await waitFor(() => subItems().length > 0, 2500));
}

/** A visible Spotify dialog (e.g. "already in this playlist"). */
function visibleDialog(): HTMLElement | null {
  return ([...document.querySelectorAll('[role="dialog"], [role="alertdialog"]')] as HTMLElement[])
    .find((d) => d.offsetWidth > 0 && d.offsetHeight > 0 && d.querySelector('button')) || null;
}

async function activate(el: HTMLElement) {
  const name = label(el);
  if (/copy|link/i.test(name)) expectShareUntil = Date.now() + 5000;
  const before = location.pathname;
  el.click();
  await sleep(900);
  const dialog = visibleDialog();
  if (dialog) {
    const buttons = [...dialog.querySelectorAll('button')].map(label).filter(Boolean);
    toNative({ type: 'MENU_DIALOG', text: label(dialog.querySelector('h1, h2, p') || dialog).slice(0, 300), buttons });
    return;
  }
  toNative({ type: 'MENU_DONE', label: name, navigated: location.pathname !== before });
}

async function select(key: string) {
  const [i, j] = key.split('/').map(Number);
  // The menu can close underneath us (track change, focus loss): reopen once.
  if (!topItems()[i] && !(await openTrackMenu())) return fail("Couldn't open Spotify's menu.");
  const top = topItems()[i];
  if (!top) return fail('That option is no longer available.');

  if (j === undefined) {
    if (top.hasAttribute('aria-expanded')) {
      if (!(await openSub(i))) return fail("Couldn't open that menu.");
      return sendSub(i);
    }
    return activate(top);
  }
  if (!subItems()[j] && !(await openSub(i))) return fail("Couldn't open that menu.");
  const item = subItems()[j];
  if (!item) return fail('That option is no longer available.');
  return activate(item);
}

/** Type into the submenu's own search box ("Find a playlist"). */
async function search(text: string) {
  const input = subMenu()?.querySelector('input') as HTMLInputElement | null;
  if (!input) return;
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, text);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await sleep(600);
  const top = topItems().findIndex((el) => el.getAttribute('aria-expanded') === 'true');
  sendSub(top < 0 ? 0 : top);
}

async function answerDialog(buttonLabel: string) {
  const dialog = visibleDialog();
  const button = dialog && ([...dialog.querySelectorAll('button')] as HTMLElement[]).find((b) => label(b) === buttonLabel);
  button?.click();
  await sleep(600);
  toNative({ type: 'MENU_DONE', label: buttonLabel, navigated: false });
}

/** The current track's URI (props of the now-playing widget). */
function currentTrackUri(): string {
  return uriFromProps(document.querySelector('[data-testid="now-playing-widget-v2"], [data-testid="now-playing-widget"]'), TRACK_URI);
}

/**
 * Spotify only offers "Remove from this playlist" on the playlist's own page.
 * So: open the playlist, find the song's row (scrolling — long lists are
 * virtualized), use the row's menu, then go back where the user was.
 */
async function removeFromPlaylist(arg: string) {
  const [uri, name = 'playlist'] = arg.split('\n');
  const track = currentTrackUri();
  const playlistId = PLAYLIST_URI.test(uri) ? uri.split(':')[2] : '';
  if (!track || !playlistId) return fail("Couldn't identify the song or playlist.");
  const [, kind, id] = track.split(':');

  await closeMenus();
  const origin = location.pathname + location.search;
  navigate(`/playlist/${playlistId}`);
  const ok = await waitFor(() => location.pathname === `/playlist/${playlistId}` && document.querySelector('[data-testid="tracklist-row"]'), 6000);
  if (!ok) { navigate(origin); return fail(`Couldn't open “${name}”.`); }

  const view = document.getElementById('main-view');
  if (view) view.scrollTop = 0;
  let row: HTMLElement | null = null;
  for (let step = 0; step < 200; step++) {
    const link = document.querySelector(`[data-testid="tracklist-row"] a[href="/${kind}/${id}"]`);
    row = link?.closest('[data-testid="tracklist-row"]') as HTMLElement | null;
    if (row || !view) break;
    const before = view.scrollTop;
    view.scrollTop += view.clientHeight * 0.8;
    await sleep(250);
    if (view.scrollTop === before) break;
  }
  if (!row) { navigate(origin); return fail(`This song isn't in “${name}”.`); }

  row.scrollIntoView({ block: 'center' });
  await sleep(200);
  const r = row.getBoundingClientRect();
  row.dispatchEvent(new MouseEvent('contextmenu', {
    bubbles: true, cancelable: true, button: 2, clientX: r.left + 40, clientY: r.top + 10, view: window,
  }));
  await waitFor(() => topItems().length > 0, 2500);
  const remove = topItems().find((el) => /remove from this playlist/i.test(label(el)));
  if (!remove) {
    await closeMenus();
    navigate(origin);
    return fail(`You can't edit “${name}”.`);
  }
  remove.click();
  await sleep(900);
  navigate(origin);
  pageLog(`removed ${track} from ${uri}`);
  toNative({ type: 'MENU_DONE', label: `Removed from ${name}`, navigated: false, message: `Removed from ${name}` });
}

/** Share → "Copy link": hand the link to Android's share sheet instead. */
function captureShareLinks() {
  const forward = (text: unknown) => {
    if (Date.now() < expectShareUntil && typeof text === 'string' && text.startsWith('https://open.spotify.com/')) {
      expectShareUntil = 0;
      toNative({ type: 'SHARE_TEXT', text });
    }
  };
  const clip = navigator.clipboard as any;
  if (clip && !clip._spotilie) {
    const original = clip.writeText?.bind(clip);
    clip.writeText = (text: string) => {
      forward(text);
      return original ? original(text).catch(() => {}) : Promise.resolve();
    };
    const originalWrite = clip.write?.bind(clip);
    if (originalWrite) {
      clip.write = (items: ClipboardItem[]) => {
        for (const item of items || []) {
          if (item.types?.includes('text/plain')) {
            item.getType('text/plain').then((b) => b.text()).then(forward).catch(() => {});
          }
        }
        return originalWrite(items).catch(() => {});
      };
    }
    clip._spotilie = true;
  }
  // Spotify's "Copy link" uses the select-and-execCommand('copy') method
  // (verified: the writeText hook alone never fired).
  const originalExec = document.execCommand;
  document.execCommand = function (this: Document, command: string, ...rest: unknown[]) {
    if (String(command).toLowerCase() === 'copy') {
      const active = document.activeElement as HTMLInputElement | HTMLTextAreaElement | null;
      const fromField = active && 'value' in active && typeof active.selectionStart === 'number'
        ? active.value.slice(active.selectionStart || 0, active.selectionEnd || active.value.length)
        : '';
      forward(fromField || String(window.getSelection() || ''));
    }
    return (originalExec as any).call(this, command, ...rest);
  } as typeof document.execCommand;
}

export function initTrackMenu() {
  captureShareLinks();
}

export function handleMenuAction(action: string, arg: string): boolean {
  switch (action) {
    case 'menu-open': void openTrackMenu().then((ok) => (ok ? sendTop() : fail("Couldn't open Spotify's menu."))); return true;
    case 'menu-select': void select(arg); return true;
    case 'menu-search': void search(arg); return true;
    case 'menu-dialog': void answerDialog(arg); return true;
    case 'menu-close': void closeMenus(); return true;
    case 'playlist-remove': void removeFromPlaylist(arg); return true;
  }
  return false;
}
