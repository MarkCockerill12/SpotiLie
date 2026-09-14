/**
 * SpotiLIE UI Module — Mobile-First Spotify Experience
 *
 * Transforms the Desktop Web Player into a native mobile-like experience.
 *
 * Layout stack (bottom to top):
 *   ┌─────────────────────────┐  ← top: 56px fixed top bar
 *   │   Content / Main View   │  ← flex-fill scroll area
 *   │   (or Library overlay)  │
 *   ├─────────────────────────┤
 *   │  Mini player 64px       │  ← tap to expand to a full-screen player
 *   ├─────────────────────────┤
 *   │  App nav: Home/Search/  │  ← fixed 52px above system nav
 *   │          Library        │
 *   ├─────────────────────────┤
 *   │  System nav bar         │  ← measured by Kotlin
 *   └─────────────────────────┘
 */

import { coalesced, ext, log, NAV_EVENT, sendNative, whenBody } from './shared';

const TOP_H     = 56;   // fixed top bar
const APP_NAV_H = 52;   // home/search/library nav
const PLAYER_H  = 64;   // collapsed mini player
const GAP       = 8;    // breathing room between content, mini player and nav

const root = document.documentElement;
const PLAYER_OPEN = 'spotilie-player-open';
const LIBRARY_OPEN = 'spotilie-library-open';

export function initUI() {
  const style = document.createElement('style');
  style.id = 'spotilie-ui';
  style.textContent = buildCSS();

  /**
   * Keep the stylesheet attached, and attached *last*.
   *
   * At document_start there is no <head> yet, so the first insertion goes into
   * <html>. Once <head> exists the element is moved there — being the last
   * stylesheet in the document is what lets these rules win ties against
   * Spotify's own, and React re-mounts can otherwise drop it entirely.
   */
  const attach = () => {
    const parent = document.head || document.documentElement;
    if (!parent) return;
    if (style.parentNode !== parent || parent.lastChild !== style) {
      parent.appendChild(style);
    }
  };

  attach();
  whenBody(() => {
    attach();
    new MutationObserver(coalesced(attach)).observe(document.documentElement, {
      childList: true,
      subtree: false,
    });
    if (document.head) {
      new MutationObserver(coalesced(attach)).observe(document.head, { childList: true });
    }
  });

  fixViewport();
  initNavHeightListener();
  initBottomNav();
  initPlayerSheet();
  initOverlayBridge();
  hideDesktopPromos();
}

// ── Overlays: full-screen player and Library ─────────────────────────────────

/** Tell Kotlin whether Back should close an overlay instead of navigating. */
function reportOverlay() {
  sendNative({
    type: 'OVERLAY',
    open: root.classList.contains(PLAYER_OPEN) || root.classList.contains(LIBRARY_OPEN),
  });
}

function setPlayerOpen(open: boolean) {
  if (root.classList.contains(PLAYER_OPEN) === open) return;
  root.classList.toggle(PLAYER_OPEN, open);
  document.dispatchEvent(new CustomEvent('spotilie-player-toggle'));
  reportOverlay();
}

function setLibraryOpen(open: boolean) {
  if (root.classList.contains(LIBRARY_OPEN) === open) return;
  root.classList.toggle(LIBRARY_OPEN, open);
  if (open) ensureLibraryExpanded();
  document.dispatchEvent(new CustomEvent('spotilie-library-toggle'));
  reportOverlay();
}

/** Back button (from Kotlin): close the topmost overlay. */
function initOverlayBridge() {
  ext()?.runtime?.onMessage?.addListener((msg: any) => {
    if (msg?.type !== 'CLOSE_OVERLAY') return;
    if (root.classList.contains(PLAYER_OPEN)) setPlayerOpen(false);
    else setLibraryOpen(false);
    // The other one may still be open underneath.
    reportOverlay();
  });
}

/**
 * The Library is Spotify's own left sidebar, shown full-screen.
 *
 * The desktop web player has no library *page*: "Your Library" lives only in
 * that sidebar, which the mobile layout hides. The old Library tab clicked the
 * first `a[href^="/collection"]` it found — Liked Songs — which is why that was
 * all it ever showed. The sidebar gives every playlist, artist, album, podcast
 * and folder with Spotify's own filters, search and sort.
 *
 * It must be in its *expanded* state to render names rather than an icon strip.
 * Spotify persists that choice, so this normally only clicks once, ever.
 */
function ensureLibraryExpanded() {
  setTimeout(() => {
    const sidebar = document.getElementById('Desktop_LeftSidebar_Id');
    if (!sidebar) return;
    const hasNames = !!sidebar.querySelector('[role="row"] p');
    if (hasNames) return;
    const toggle = sidebar.querySelector('button[aria-label="Open Your Library"]') as HTMLElement | null;
    toggle?.click();
    log(`library expanded via toggle (found=${!!toggle})`);
  }, 250);
}

/**
 * Mini player → full-screen player.
 *
 * The bar is Spotify's React tree, so nothing is moved in the DOM: both states
 * are pure CSS keyed off a class on <html>. The one addition is a high-res
 * artwork element, which lives in <body> rather than inside React's subtree so
 * a re-render can never drop it.
 */
function initPlayerSheet() {
  const art = document.createElement('img');
  art.id = 'spotilie-big-art';
  art.alt = '';

  const close = document.createElement('button');
  close.id = 'spotilie-player-close';
  close.setAttribute('aria-label', 'Close player');
  close.innerHTML =
    '<svg viewBox="0 0 24 24"><path d="M2.793 8.043a1 1 0 0 1 1.414 0L12 15.836l7.793-7.793a1 1 0 1 1 1.414 1.414L12 18.664 2.793 9.457a1 1 0 0 1 0-1.414z"/></svg>';
  close.addEventListener('click', () => setPlayerOpen(false));

  whenBody(() => document.body.append(art, close));

  const refreshArt = () => {
    const img = document.querySelector(
      '[data-testid="now-playing-widget"] img, [data-testid="now-playing-bar"] [data-testid="cover-art-image"]'
    ) as HTMLImageElement | null;
    // The bar loads a 64px thumbnail; ask the CDN for the 640px rendition.
    const src = (img?.src || '').replace(/ab67616d0000(4851|1e02)/, 'ab67616d0000b273');
    if (src && art.getAttribute('src') !== src) art.src = src;
  };

  let artTimer = 0;
  document.addEventListener('spotilie-player-toggle', () => {
    window.clearInterval(artTimer);
    if (root.classList.contains(PLAYER_OPEN)) {
      refreshArt();
      artTimer = window.setInterval(refreshArt, 1000);
    }
  });

  // In the mini player, real buttons (play, next, like) keep working; a tap
  // anywhere else on the bar — artwork, title, empty space — expands it. The
  // title is a link to the album, so this runs in the capture phase to expand
  // instead of navigating away.
  document.addEventListener('click', (e) => {
    if (!e.isTrusted || root.classList.contains(PLAYER_OPEN)) return;
    const target = e.target as Element | null;
    if (!target?.closest?.('[data-testid="now-playing-bar"]')) return;
    const button = target.closest('button');
    if (button && button.getAttribute('data-testid') !== 'cover-art-button') return;
    e.preventDefault();
    e.stopPropagation();
    setPlayerOpen(true);
  }, true);
}

/**
 * Hide "Install App" / "Upgrade to Premium" style promos in the top bar.
 *
 * These can't be matched reliably by CSS: the testids Spotify uses for them
 * change and CSS can't select on text. Matching the label is the one thing
 * that stays true across their markup churn. Run on demand, not on a timer.
 */
function hideDesktopPromos() {
  // Prefix match: the logged-out top bar's "Install app" carries extra text (an
  // icon label) and slipped past an exact match on a clean install.
  const PROMO = /^\s*(install( the)? app|get the app|download( the)? app|upgrade to premium|explore premium|upgrade\b)/i;

  const scan = () => {
    for (const el of document.querySelectorAll('a, button')) {
      const label = (el.textContent || '').trim() || el.getAttribute('aria-label') || '';
      if (PROMO.test(label)) {
        (el as HTMLElement).style.setProperty('display', 'none', 'important');
      }
    }
  };

  whenBody(() => {
    scan();
    for (const delay of [1000, 3000, 6000]) setTimeout(scan, delay);
    document.addEventListener(NAV_EVENT, () => setTimeout(scan, 300));
    window.addEventListener('popstate', () => setTimeout(scan, 300));
  });
}

function buildCSS(): string {
  const mini = `html:not(.${PLAYER_OPEN})`;
  const open = `html.${PLAYER_OPEN}`;

  return `
    :root {
      --sys-nav-h:  44px;
      --app-nav-h:  ${APP_NAV_H}px;
      --player-h:   ${PLAYER_H}px;
      --top-bar-h:  ${TOP_H}px;
      --nav-bottom: calc(var(--sys-nav-h) + 6px);
      --player-bottom: calc(var(--nav-bottom) + var(--app-nav-h) + ${GAP / 2}px);
      --bottom-h:   calc(var(--player-bottom) + var(--player-h) + ${GAP}px);
    }

    html, body {
      width: 100vw !important;
      min-width: 0 !important;
      max-width: 100vw !important;
      height: 100dvh !important;
      min-height: 0 !important;
      overflow: hidden !important;
      overscroll-behavior: none !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #121212 !important;
    }

    body { min-width: unset !important; }

    .Root {
      width: 100vw !important;
      min-width: 0 !important;
      max-width: 100vw !important;
      height: 100dvh !important;
      overflow: hidden !important;
      overscroll-behavior: none !important;
    }

    .Root > div {
      display: block !important;
      position: relative !important;
      width: 100vw !important;
      height: 100dvh !important;
      overflow: hidden !important;
    }

    /* Hide desktop-only elements. The left sidebar is only hidden while the
       Library overlay is closed; see SECTION 8. */
    html:not(.${LIBRARY_OPEN}) [data-testid="left-sidebar"],
    html:not(.${LIBRARY_OPEN}) #Desktop_LeftSidebar_Id,
    .Root__nav-bar,
    .Root__right-sidebar,
    [data-testid="buddy-feed"],
    aside[aria-label="Friend Activity"],
    .LayoutResizer__handler,
    /* Spotify's sidebar resizer: an invisible absolute overlay spanning the
       whole sidebar with touch-action:none. It swallowed every swipe in the
       Library (no scrolling) and drew its resize line under the finger. It
       carries a data-testid and a class, NOT an id — the old
       #LayoutResizer__resize-bar rule never matched it. */
    [data-testid="LayoutResizer__resize-bar"],
    .LayoutResizer__resize-bar,
    [data-testid="upgrade-button"],
    [data-testid="install-app-button"],
    [aria-label*="Install"],
    [aria-label*="Get the app"],
    [aria-label*="Upgrade to Premium"],
    a[href*="/premium"],
    .main-view-container__footer,
    [data-testid="ad-indicator"],
    [data-testid="ad-sponsor-container"],
    .desktop-media-picker-ads,
    .Root__ads-container,
    .nav-bar-ad-item,
    iframe[src*="doubleclick"],
    div[class*="ad-slot"],
    .Root__modal-slot:has([aria-label*="Premium"]),
    div[role="dialog"]:has([href*="premium"]),
    [class*="globalNav__history"],
    [data-testid="topbar-navigation-button"] {
      display: none !important;
      width: 0 !important;
      min-width: 0 !important;
    }

    /* Top bar */
    .Root__globalNav,
    .Root__top-bar,
    [data-testid="topbar-content-wrapper"] {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      height: var(--top-bar-h) !important;
      z-index: 9990 !important;
      width: 100% !important;
      min-width: 0 !important;
      max-width: 100vw !important;
      background: rgba(18, 18, 18, 0.96) !important;
      backdrop-filter: blur(12px) !important;
      -webkit-backdrop-filter: blur(12px) !important;
      display: flex !important;
      align-items: center !important;
      box-sizing: border-box !important;
      padding: 0 12px !important;
    }

    /* Main View Area */
    .Root__main-view,
    #main-view,
    main[data-testid="main-view"] {
      position: fixed !important;
      top: var(--top-bar-h) !important;
      left: 0 !important;
      right: 0 !important;
      bottom: var(--bottom-h) !important;
      width: 100% !important;
      box-sizing: border-box !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
      -webkit-overflow-scrolling: touch !important;
      padding-bottom: 8px !important;
      border-radius: 0 !important;
    }

    /* Main view only. Unscoped, this also reached the Library sidebar's own
       scroll viewport. */
    .main-view-container__scroll-node,
    [data-testid="main-view-container__scroll-node"],
    .os-viewport:not(#Desktop_LeftSidebar_Id *),
    [data-overlayscrollbars-viewport]:not(#Desktop_LeftSidebar_Id *) {
      padding-bottom: 0px !important;
      height: auto !important;
      min-height: 100% !important;
    }

    [data-testid="playlist-page"] > div:first-child,
    [data-testid="artist-page"] > div:first-child,
    [data-testid="album-page"] > div:first-child,
    [class*="contentSpacing"],
    .main-view-container__scroll-node-child {
      padding-top: 0 !important;
    }

    [data-testid="entity-header-image-container"],
    [class*="entityHeader"],
    [class*="EntityHeader"] {
      margin-top: 0 !important;
      padding-top: 0 !important;
    }

    [data-testid="main-view-container__scroll-node"] > div:first-child,
    .os-content > div:first-child {
      padding-top: 0 !important;
      margin-top: 0 !important;
    }

    /* ═══════════════════════════════════════════════════════════════════════
       SECTION 6: Now-playing bar, shared by both states

       Structure (dumped from the running app, 2026-09-13):
         aside[now-playing-bar]
           div                                  wrapper
             div                                track info row
               [now-playing-widget]             cover + title/artist
               div > button                     add to Liked (no testid)
             div                                controls wrapper
               [player-controls]
                 [general-controls]             shuffle prev [playpause] next repeat
                 div                            progress row
                   [playback-position] | div > [playback-progressbar] | [playback-duration]
             div                                utility row: lyrics, queue, connect, volume, fullscreen

       Shuffle and repeat carry no data-testid any more, so they are selected
       as the non-skip children of general-controls side groups.
       ═══════════════════════════════════════════════════════════════════════ */
    [data-testid="now-playing-bar"] {
      position: fixed !important;
      min-width: 0 !important;
      max-width: none !important;
      padding: 0 !important;
      border: none !important;
      box-sizing: border-box !important;
    }

    [data-testid="now-playing-bar"] > div {
      width: 100% !important;
      max-width: 100% !important;
      min-width: 0 !important;
      height: 100% !important;
      box-sizing: border-box !important;
    }

    [data-testid="now-playing-bar"] > div > div:first-child {
      display: flex !important;
      flex-direction: row !important;
      align-items: center !important;
      gap: 10px !important;
      min-width: 0 !important;
    }

    [data-testid="now-playing-widget"] {
      flex: 1 1 auto !important;
      min-width: 0 !important;
    }

    [data-testid="context-item-info-title"],
    [data-testid="now-playing-bar"] [data-testid="context-item-link"] {
      font-weight: 700 !important;
      color: #fff !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
      min-width: 0 !important;
    }

    [data-testid="context-item-info-subtitles"],
    [data-testid="context-item-info-subtitle"] {
      color: rgba(255,255,255,0.65) !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
    }

    [data-testid="now-playing-bar"] div:has(> [data-testid="player-controls"]) {
      display: block !important;
      width: 100% !important;
    }

    /* The zero-width wrapper around the progress bar. Without flex-grow it
       computes to 0px and the bar is invisible rather than thin. */
    [data-testid="player-controls"] div:has(> [data-testid="playback-progressbar"]) {
      flex: 1 1 auto !important;
      min-width: 0 !important;
      width: auto !important;
    }

    [data-testid="playback-progressbar"],
    [data-testid="player-controls"] [data-testid="progress-bar"] {
      display: flex !important;
      align-items: center !important;
      flex: 1 1 auto !important;
      width: 100% !important;
      min-width: 0 !important;
      opacity: 1 !important;
      visibility: visible !important;
      overflow: visible !important;
    }

    [data-testid="general-controls"] > div {
      display: flex !important;
      flex-direction: row !important;
      align-items: center !important;
    }

    [data-testid="control-button-playpause"] {
      background: #fff !important;
      border-radius: 50% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      flex-shrink: 0 !important;
    }
    [data-testid="control-button-playpause"] svg { fill: #000 !important; }

    [data-testid="volume-bar"],
    [data-testid="fullscreen-mode-button"] {
      display: none !important;
    }

    /* ═══════════════════════════════════════════════════════════════════════
       SECTION 6a: Mini player (default)
       One row: artwork, title, like, play/pause, next. Hairline progress along
       the bottom edge. Tap anywhere that isn't a button to expand.
       ═══════════════════════════════════════════════════════════════════════ */
    ${mini} [data-testid="now-playing-bar"] {
      left: 8px !important;
      right: 8px !important;
      width: auto !important;
      bottom: var(--player-bottom) !important;
      height: var(--player-h) !important;
      background: #2a2a2a !important;
      border-radius: 10px !important;
      overflow: hidden !important;
      z-index: 9980 !important;
    }

    ${mini} [data-testid="now-playing-bar"] > div {
      position: relative !important;
      display: block !important;
      padding: 8px !important;
      overflow: visible !important;
    }

    ${mini} [data-testid="now-playing-bar"] > div > div:first-child {
      height: 48px !important;
      width: calc(100% - 88px) !important;
    }

    ${mini} [data-testid="CoverSlotCollapsed__container"],
    ${mini} [data-testid="CoverSlotCollapsed__container"] > div,
    ${mini} [data-testid="cover-art-button"],
    ${mini} [data-testid="cover-art-button"] > div,
    ${mini} [data-testid="now-playing-bar"] [data-testid="cover-art-image"] {
      width: 48px !important;
      height: 48px !important;
      min-width: 48px !important;
      border-radius: 6px !important;
      flex-shrink: 0 !important;
      object-fit: cover !important;
    }

    ${mini} [data-testid="context-item-info-title"],
    ${mini} [data-testid="now-playing-bar"] [data-testid="context-item-link"] { font-size: 14px !important; }
    ${mini} [data-testid="context-item-info-subtitles"],
    ${mini} [data-testid="context-item-info-subtitle"] { font-size: 12px !important; }

    ${mini} [data-testid="player-controls"] { position: static !important; display: block !important; }

    ${mini} [data-testid="general-controls"] {
      position: absolute !important;
      top: 12px !important;
      right: 6px !important;
      display: flex !important;
      flex-direction: row !important;
      align-items: center !important;
      width: auto !important;
      gap: 0 !important;
    }
    ${mini} [data-testid="general-controls"] > div { gap: 0 !important; width: auto !important; flex: 0 0 auto !important; }
    ${mini} [data-testid="general-controls"] > div > *:not([data-testid="control-button-skip-forward"]):not(:has([data-testid="control-button-skip-forward"])) {
      display: none !important;
    }

    ${mini} [data-testid="control-button-playpause"] {
      width: 36px !important;
      height: 36px !important;
      margin-right: 4px !important;
    }
    ${mini} [data-testid="control-button-playpause"] svg { width: 16px !important; height: 16px !important; }

    ${mini} [data-testid="control-button-skip-forward"] {
      width: 40px !important;
      height: 40px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }
    ${mini} [data-testid="control-button-skip-forward"] svg { width: 20px !important; height: 20px !important; fill: #fff !important; }

    ${mini} [data-testid="player-controls"] > div:has([data-testid="playback-progressbar"]) {
      position: absolute !important;
      left: 10px !important;
      right: 10px !important;
      bottom: 0 !important;
      height: 3px !important;
      display: flex !important;
      gap: 0 !important;
      pointer-events: none !important;
    }
    ${mini} [data-testid="playback-position"],
    ${mini} [data-testid="playback-duration"] { display: none !important; }
    ${mini} [data-testid="playback-progressbar"],
    ${mini} [data-testid="player-controls"] [data-testid="progress-bar"] { height: 3px !important; }

    ${mini} [data-testid="now-playing-bar"] > div > div:has([data-testid="fullscreen-mode-button"], [data-testid="lyrics-button"]):not(:has([data-testid="player-controls"])) {
      display: none !important;
    }

    #spotilie-big-art, #spotilie-player-close { display: none; }

    /* ═══════════════════════════════════════════════════════════════════════
       SECTION 6b: Full-screen player
       Artwork up top, then title, scrubber, transport and the utility row
       (lyrics, queue, Connect) stacked from the bottom.
       ═══════════════════════════════════════════════════════════════════════ */
    ${open} [data-testid="now-playing-bar"] {
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100vw !important;
      height: 100dvh !important;
      border-radius: 0 !important;
      overflow: hidden !important;
      z-index: 10000 !important;
      background: linear-gradient(180deg, #3a3a3a 0%, #1e1e1e 45%, #121212 100%) !important;
    }

    ${open} [data-testid="now-playing-bar"] > div {
      display: flex !important;
      flex-direction: column !important;
      justify-content: flex-end !important;
      gap: 12px !important;
      padding: 0 24px calc(var(--sys-nav-h) + 24px) !important;
    }

    ${open} [data-testid="now-playing-bar"] > div > div:first-child {
      width: 100% !important;
      height: auto !important;
    }

    ${open} [data-testid="CoverSlotCollapsed__container"] { display: none !important; }

    ${open} [data-testid="context-item-info-title"],
    ${open} [data-testid="now-playing-bar"] [data-testid="context-item-link"] { font-size: 22px !important; line-height: 28px !important; }
    ${open} [data-testid="context-item-info-subtitles"],
    ${open} [data-testid="context-item-info-subtitle"] { font-size: 16px !important; line-height: 22px !important; }

    ${open} [data-testid="player-controls"] {
      display: flex !important;
      flex-direction: column !important;
      align-items: stretch !important;
      width: 100% !important;
      max-width: none !important;
      gap: 10px !important;
      padding: 0 !important;
    }

    ${open} [data-testid="player-controls"] > div:has([data-testid="playback-progressbar"]) {
      display: flex !important;
      flex-direction: row !important;
      align-items: center !important;
      width: 100% !important;
      gap: 10px !important;
      order: 1 !important;
    }
    ${open} [data-testid="playback-progressbar"],
    ${open} [data-testid="player-controls"] [data-testid="progress-bar"] { height: 28px !important; }

    ${open} [data-testid="playback-position"],
    ${open} [data-testid="playback-duration"] {
      font-size: 12px !important;
      line-height: 28px !important;
      color: rgba(255,255,255,0.7) !important;
      flex: 0 0 auto !important;
      min-width: 38px !important;
      text-align: center !important;
      font-variant-numeric: tabular-nums !important;
    }

    ${open} [data-testid="general-controls"] {
      display: flex !important;
      flex-direction: row !important;
      align-items: center !important;
      justify-content: space-between !important;
      width: 100% !important;
      gap: 0 !important;
      order: 2 !important;
    }
    ${open} [data-testid="general-controls"] > div {
      flex: 1 1 0 !important;
      justify-content: space-around !important;
    }
    ${open} [data-testid="general-controls"] button {
      width: 48px !important;
      height: 48px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }
    ${open} [data-testid="general-controls"] button svg { width: 24px !important; height: 24px !important; }
    ${open} [data-testid="control-button-skip-forward"] svg,
    ${open} [data-testid="control-button-skip-back"] svg { width: 30px !important; height: 30px !important; fill: #fff !important; }

    ${open} [data-testid="general-controls"] [data-testid="control-button-playpause"] {
      width: 68px !important;
      height: 68px !important;
    }
    ${open} [data-testid="control-button-playpause"] svg { width: 28px !important; height: 28px !important; }

    ${open} [data-testid="now-playing-bar"] > div > div:has([data-testid="fullscreen-mode-button"], [data-testid="lyrics-button"]):not(:has([data-testid="player-controls"])),
    ${open} [data-testid="now-playing-bar"] > div > div:has([data-testid="fullscreen-mode-button"], [data-testid="lyrics-button"]):not(:has([data-testid="player-controls"])) > div {
      display: flex !important;
      flex-direction: row !important;
      align-items: center !important;
      justify-content: space-around !important;
      width: 100% !important;
      max-width: 100% !important;
      min-width: 0 !important;
    }
    ${open} [data-testid="now-playing-bar"] > div > div:has([data-testid="fullscreen-mode-button"], [data-testid="lyrics-button"]):not(:has([data-testid="player-controls"])) button {
      width: 44px !important;
      height: 44px !important;
    }

    /* The bar lives inside Spotify's stacking context, so no z-index lifts it
       over our body-level nav; the nav steps aside instead. */
    ${open} #spotilie-bottom-nav { display: none !important; }

    ${open} [data-testid="now-playing-bar"] a { text-decoration: none !important; }

    ${open} #spotilie-big-art {
      display: block !important;
      position: fixed !important;
      top: 76px !important;
      left: 50% !important;
      transform: translateX(-50%) !important;
      width: min(calc(100vw - 48px), calc(100dvh - var(--sys-nav-h) - 360px)) !important;
      aspect-ratio: 1 / 1 !important;
      object-fit: cover !important;
      border-radius: 8px !important;
      box-shadow: 0 12px 40px rgba(0,0,0,0.6) !important;
      z-index: 10001 !important;
      pointer-events: none !important;
    }

    ${open} #spotilie-player-close {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      position: fixed !important;
      top: 16px !important;
      left: 12px !important;
      width: 48px !important;
      height: 48px !important;
      background: transparent !important;
      border: none !important;
      z-index: 10002 !important;
      -webkit-tap-highlight-color: transparent !important;
    }
    ${open} #spotilie-player-close svg { width: 24px !important; height: 24px !important; fill: #fff !important; }

    /* Spotify Connect: a genuine premium surface, so it stays visible. */
    [data-testid="connect-device-picker-button"] {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      flex-shrink: 0 !important;
    }

    /* ═══════════════════════════════════════════════════════════════════════
       SECTION 7: App bottom nav
       ═══════════════════════════════════════════════════════════════════════ */
    #spotilie-bottom-nav {
      position: fixed !important;
      bottom: var(--nav-bottom) !important;
      left: 0 !important;
      right: 0 !important;
      height: var(--app-nav-h) !important;
      background: linear-gradient(180deg, rgba(0,0,0,0.85), #000) !important;
      display: flex !important;
      flex-direction: row !important;
      justify-content: space-around !important;
      align-items: center !important;
      z-index: 9999 !important;
      padding: 0 !important;
      box-sizing: border-box !important;
    }

    /* Fill the strip under the nav down to the screen edge. */
    #spotilie-bottom-nav::after {
      content: '' !important;
      position: absolute !important;
      left: 0 !important;
      right: 0 !important;
      top: 100% !important;
      height: var(--nav-bottom) !important;
      background: #000 !important;
    }

    #spotilie-bottom-nav .nav-item {
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      color: rgba(255,255,255,0.55) !important;
      text-decoration: none !important;
      font-size: 11px !important;
      font-weight: 500 !important;
      gap: 3px !important;
      padding: 6px 20px !important;
      -webkit-tap-highlight-color: transparent !important;
      cursor: pointer !important;
      flex: 1 !important;
      height: 100% !important;
    }

    #spotilie-bottom-nav .nav-item.active { color: #fff !important; }

    #spotilie-bottom-nav .nav-item svg {
      width: 24px !important;
      height: 24px !important;
      fill: currentColor !important;
    }

    /* Hover tooltips. The desktop pointer spoof makes a tap count as hover, so
       "Pause" / "Next" labels popped up and stayed on screen after every tap. */
    [role="tooltip"],
    .encore-tooltip,
    [data-tippy-root] {
      display: none !important;
    }

    [data-testid="tracklist-row"] {
      padding: 8px 12px !important;
      min-height: 52px !important;
      -webkit-tap-highlight-color: rgba(255,255,255,0.05) !important;
    }

    /* ═══════════════════════════════════════════════════════════════════════
       SECTION 8: Library overlay — Spotify's own "Your Library" sidebar,
       full-screen between the top bar and the mini player.
       ═══════════════════════════════════════════════════════════════════════ */
    html.${LIBRARY_OPEN} #Desktop_LeftSidebar_Id {
      display: flex !important;
      flex-direction: column !important;
      position: fixed !important;
      top: var(--top-bar-h) !important;
      left: 0 !important;
      right: 0 !important;
      bottom: var(--bottom-h) !important;
      width: 100vw !important;
      min-width: 0 !important;
      max-width: 100vw !important;
      height: auto !important;
      z-index: 9985 !important;
      background: #121212 !important;
      overflow: hidden !important;
    }

    /* The resizer is also a direct child div of the sidebar. Without the :not(),
       this rule's id specificity beat its display:none and stretched it to
       100% x 100% — an invisible touch-action:none overlay across the whole
       Library that blocked scrolling and drew a line under the finger. */
    html.${LIBRARY_OPEN} #Desktop_LeftSidebar_Id > div:not(.LayoutResizer__resize-bar),
    html.${LIBRARY_OPEN} #Desktop_LeftSidebar_Id nav[aria-label="Main"] {
      display: flex !important;
      flex-direction: column !important;
      width: 100% !important;
      height: 100% !important;
      min-width: 0 !important;
      border-radius: 0 !important;
    }

    html.${LIBRARY_OPEN} #Desktop_LeftSidebar_Id [role="row"] {
      -webkit-tap-highlight-color: rgba(255,255,255,0.06) !important;
    }

    /* Library rows are drag-and-drop targets on desktop (reorder, add to
       playlist). On touch, a swipe started a drag instead of a scroll, which
       froze the list and drew the drop-indicator line across it. Panning is
       forced here; the drag itself is cancelled in initBottomNav. */
    html.${LIBRARY_OPEN} #Desktop_LeftSidebar_Id [data-overlayscrollbars-viewport],
    html.${LIBRARY_OPEN} #Desktop_LeftSidebar_Id [role="grid"],
    html.${LIBRARY_OPEN} #Desktop_LeftSidebar_Id [role="row"],
    html.${LIBRARY_OPEN} #Desktop_LeftSidebar_Id [draggable="true"] {
      touch-action: pan-y !important;
      user-select: none !important;
      -moz-user-select: none !important;
    }
    html.${LIBRARY_OPEN} #Desktop_LeftSidebar_Id [data-overlayscrollbars-viewport] {
      overscroll-behavior: contain !important;
    }
    html.${LIBRARY_OPEN} #Desktop_LeftSidebar_Id .os-scrollbar-horizontal {
      display: none !important;
    }

    html.${LIBRARY_OPEN} #left-sidebar-footer,
    html.${LIBRARY_OPEN} #Desktop_LeftSidebar_Id > .LayoutResizer__resize-bar,
    html.${LIBRARY_OPEN} #Desktop_LeftSidebar_Id [data-testid="LayoutResizer__resize-bar"] {
      display: none !important;
    }

    html.${LIBRARY_OPEN} .Root__main-view,
    html.${LIBRARY_OPEN} #main-view,
    html.${LIBRARY_OPEN} main[data-testid="main-view"] {
      visibility: hidden !important;
    }
  `;
}

function fixViewport() {
  let meta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement | null;
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'viewport';
    (document.head || document.documentElement).appendChild(meta);
  }
  meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
}

function initNavHeightListener() {
  const api = ext();
  if (!api?.runtime?.onMessage) return;
  api.runtime.onMessage.addListener((msg: any) => {
    if (msg?.type === 'SET_NAV_HEIGHT' && typeof msg.height === 'number') {
      // Every offset derives from --sys-nav-h in the stylesheet.
      root.style.setProperty('--sys-nav-h', `${Math.max(0, msg.height)}px`);
      log(`nav height set to ${msg.height}px from Kotlin`);
    }
  });
}

function spaNavigate(path: string) {
  const nativeLink = document.querySelector(`a[href="${path}"]`) as HTMLElement | null;
  if (nativeLink) {
    nativeLink.click();
    return;
  }
  try {
    history.pushState(null, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  } catch (_) {
    window.location.href = path;
  }
}

function initBottomNav() {
  const createNav = () => {
    if (document.getElementById('spotilie-bottom-nav')) return;

    const nav = document.createElement('div');
    nav.id = 'spotilie-bottom-nav';
    nav.innerHTML = `
      <div class="nav-item active" data-nav="home">
        <svg viewBox="0 0 24 24"><path d="M13.5 1.515a3 3 0 0 0-3 0L3 5.845a2 2 0 0 0-1 1.732V21a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-6h4v6a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V7.577a2 2 0 0 0-1-1.732l-7.5-4.33z"/></svg>
        <span>Home</span>
      </div>
      <div class="nav-item" data-nav="search">
        <svg viewBox="0 0 24 24"><path d="M10.533 1.279c-5.18 0-9.407 4.14-9.407 9.279s4.226 9.279 9.407 9.279c2.234 0 4.29-.77 5.907-2.058l4.353 4.353a1 1 0 1 0 1.414-1.414l-4.344-4.344a9.157 9.157 0 0 0 2.077-5.816c0-5.14-4.226-9.28-9.407-9.28zm-7.407 9.279c0-4.006 3.302-7.28 7.407-7.28s7.407 3.274 7.407 7.28-3.302 7.279-7.407 7.279-7.407-3.273-7.407-7.28z"/></svg>
        <span>Search</span>
      </div>
      <div class="nav-item" data-nav="library">
        <svg viewBox="0 0 24 24"><path d="M14.5 2.134a1 1 0 0 1 1 0l6 3.464a1 1 0 0 1 .5.866V21a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1V3a1 1 0 0 1 .5-.866zM16 4.732V20h4V7.041l-4-2.309zM3 22a1 1 0 0 1-1-1V3a1 1 0 0 1 2 0v18a1 1 0 0 1-1 1zm6 0a1 1 0 0 1-1-1V3a1 1 0 0 1 2 0v18a1 1 0 0 1-1 1z"/></svg>
        <span>Library</span>
      </div>
    `;

    nav.querySelectorAll('.nav-item').forEach((item) => {
      item.addEventListener('click', () => {
        const navType = item.getAttribute('data-nav');
        setPlayerOpen(false);
        if (navType === 'library') {
          setLibraryOpen(!root.classList.contains(LIBRARY_OPEN));
          return;
        }
        setLibraryOpen(false);
        spaNavigate(navType === 'search' ? '/search' : '/');
      });
    });

    document.body.appendChild(nav);

    const updateActiveTab = () => {
      const path = window.location.pathname;
      const libraryOpen = root.classList.contains(LIBRARY_OPEN);
      nav.querySelectorAll('.nav-item').forEach((item) => {
        const navType = item.getAttribute('data-nav');
        const active = libraryOpen
          ? navType === 'library'
          : (navType === 'home' && (path === '/' || path === '')) ||
            (navType === 'search' && path.startsWith('/search')) ||
            (navType === 'library' && path.startsWith('/collection'));
        item.classList.toggle('active', active);
      });
    };

    /*
     * Navigation tracking. The previous version patched history.pushState from
     * this content script — which Firefox sandboxes, so Spotify's router never
     * called the patch and the active tab never followed navigation. page.ts
     * patches it in the page world and relays NAV_EVENT instead.
     */
    let lastPath = location.pathname;
    const onNavigate = () => {
      if (location.pathname !== lastPath) {
        lastPath = location.pathname;
        // Opening anything closes the overlays, like a native app would.
        setLibraryOpen(false);
        setPlayerOpen(false);
      }
      updateActiveTab();
    };
    document.addEventListener(NAV_EVENT, onNavigate);
    window.addEventListener('popstate', onNavigate);
    document.addEventListener('spotilie-library-toggle', updateActiveTab);

    // No drag-and-drop in the Library on touch: a swipe must scroll. Capture
    // phase so Spotify's drag handlers never see the drag begin.
    document.addEventListener('dragstart', (e) => {
      if (!root.classList.contains(LIBRARY_OPEN)) return;
      if (!(e.target as Element | null)?.closest?.('#Desktop_LeftSidebar_Id')) return;
      e.preventDefault();
      e.stopPropagation();
    }, true);

    // Tapping an item in the Library opens it; close even if the path is the
    // one already showing (e.g. Liked Songs twice). Play buttons stay put.
    document.addEventListener('click', (e) => {
      if (!e.isTrusted || !root.classList.contains(LIBRARY_OPEN)) return;
      const target = e.target as Element | null;
      if (!target?.closest?.('#Desktop_LeftSidebar_Id [role="row"]')) return;
      if (target.closest('button')) return;
      setTimeout(() => setLibraryOpen(false), 150);
    });

    updateActiveTab();
  };

  whenBody(createNav);
}
