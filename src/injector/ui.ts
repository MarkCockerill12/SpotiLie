/**
 * SpotiLIE UI Module — Mobile-First Spotify Experience
 *
 * Transforms the Desktop Web Player into a native mobile-like experience.
 *
 * Layout stack (bottom to top):
 *   ┌─────────────────────────┐  ← top: 56px fixed top bar
 *   │   Content / Main View   │  ← flex-fill scroll area
 *   ├─────────────────────────┤
 *   │  Now-playing bar ~148px │  ← fixed, above app nav
 *   ├─────────────────────────┤
 *   │  App nav: Home/Search/  │  ← fixed 52px above system nav
 *   │          Library        │
 *   ├─────────────────────────┤
 *   │  System nav bar         │  ← env(safe-area-inset-bottom)
 *   └─────────────────────────┘
 */

const TOP_H     = 56;   // fixed top bar
const APP_NAV_H = 52;   // home/search/library nav
const PLAYER_H  = 148;  // now-playing + controls + progress bar

export function initUI() {
  const style = document.createElement('style');
  style.id = 'spotilie-ui';
  style.textContent = buildCSS();

  const appendStyle = () => {
    const root = document.head || document.documentElement;
    if (root) {
      if (!document.getElementById('spotilie-ui')) root.appendChild(style);
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        const r = document.head || document.documentElement;
        if (r && !document.getElementById('spotilie-ui')) r.appendChild(style);
      }, { once: true });
    }
  };
  appendStyle();

  fixViewport();
  measureAndApplyLayout();
  initBottomNav();
  initProgressBarVisibility();
  initNavHeightListener();
}

function buildCSS(): string {
  return `
    :root {
      --sys-nav-h:  44px;
      --app-nav-h:  ${APP_NAV_H}px;
      --player-h:   ${PLAYER_H}px;
      --top-bar-h:  ${TOP_H}px;
      --bottom-h:   calc(var(--sys-nav-h) + var(--app-nav-h) + var(--player-h) + 6px);
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

    body {
      min-width: unset !important;
    }

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

    /* Hide desktop-only elements */
    [data-testid="left-sidebar"],
    .Root__nav-bar,
    #Desktop_LeftSidebar_Id,
    nav[aria-label="Main"],
    .Root__right-sidebar,
    [data-testid="buddy-feed"],
    aside[aria-label="Friend Activity"],
    .LayoutResizer__handler,
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
    }

    .main-view-container__scroll-node,
    [data-testid="main-view-container__scroll-node"],
    .os-viewport,
    [data-overlayscrollbars-viewport] {
      padding-bottom: 0px !important;
      height: auto !important;
      min-height: 100% !important;
    }

    /* Fix blank space under header on non-home pages */
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
       SECTION 6: Spotify Native Now-Playing Bar
       ═══════════════════════════════════════════════════════════════════════ */
    .Root__now-playing-bar,
    aside[data-testid="now-playing-bar"],
    [data-testid="now-playing-bar"] {
      position: fixed !important;
      bottom: calc(var(--sys-nav-h) + var(--app-nav-h)) !important;
      left: 0 !important;
      right: 0 !important;
      width: 100vw !important;
      min-width: 0 !important;
      max-width: 100vw !important;
      height: var(--player-h) !important;
      background: #181818 !important;
      border-top: 1px solid rgba(255,255,255,0.08) !important;
      z-index: 9980 !important;
      overflow: visible !important;
      padding: 0 !important;
    }

    [data-testid="now-playing-bar"] > div {
      display: flex !important;
      flex-direction: column !important;
      width: 100% !important;
      height: 100% !important;
      padding: 8px 12px 10px !important;
      box-sizing: border-box !important;
      gap: 6px !important;
      overflow: visible !important;
    }

    /* Track Info Row */
    [data-testid="now-playing-bar"] > div > div:first-child {
      display: flex !important;
      flex-direction: row !important;
      align-items: center !important;
      width: 100% !important;
      gap: 10px !important;
      min-width: 0 !important;
      flex-shrink: 0 !important;
    }

    [data-testid="CoverSlotCollapsed__container"],
    [data-testid="now-playing-bar"] [data-testid="cover-art-image"],
    [data-testid="now-playing-bar"] img:not([data-testid]) {
      width: 44px !important;
      height: 44px !important;
      min-width: 44px !important;
      border-radius: 4px !important;
      flex-shrink: 0 !important;
      object-fit: cover !important;
    }

    [data-testid="context-item-info-title"],
    [data-testid="now-playing-bar"] [data-testid="context-item-link"] {
      font-size: 13px !important;
      font-weight: 600 !important;
      color: #fff !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
      flex: 1 !important;
      min-width: 0 !important;
    }

    [data-testid="context-item-info-subtitles"],
    [data-testid="context-item-info-subtitle"] {
      font-size: 11px !important;
      color: rgba(255,255,255,0.55) !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
    }

    /* Progress bar — force visible */
    .playback-bar,
    [data-testid="playback-progressbar"],
    [data-testid="progress-bar"],
    [class*="progressBar"],
    [class*="progress-bar"],
    [class*="PlaybackBar"],
    [class*="playbackBar"],
    [class*="ProgressBar"],
    div[role="slider"] {
      display: flex !important;
      flex-direction: row !important;
      align-items: center !important;
      width: 100% !important;
      max-width: 100% !important;
      min-width: 0 !important;
      height: 28px !important;
      opacity: 1 !important;
      visibility: visible !important;
      overflow: visible !important;
      flex-shrink: 0 !important;
    }

    /* Track background */
    [class*="progressBar"] [class*="bg"],
    [class*="progressBar"] [class*="track"],
    [class*="playback-bar"] [class*="bg"],
    .playback-bar > div > div:first-child {
      height: 6px !important;
      flex: 1 !important;
      background: #3e3e3e !important;
      border-radius: 3px !important;
      position: relative !important;
      cursor: pointer !important;
    }

    /* Fill */
    [class*="progressBar"] [class*="fg"],
    [class*="progressBar"] [class*="fill"],
    [class*="progress-bar__fill"],
    [class*="PlaybackBar"] [class*="fill"] {
      background: #1DB954 !important;
      border-radius: 3px !important;
      height: 100% !important;
    }

    /* Thumb knob */
    [class*="progressBar"] [role="slider"],
    [class*="progressBar"] [class*="handle"],
    [class*="progressBar"] [class*="thumb"],
    [class*="progressBar"] [class*="knob"] {
      background: #fff !important;
      border-radius: 50% !important;
      width: 14px !important;
      height: 14px !important;
      position: absolute !important;
    }

    /* Time text */
    [class*="playback-bar"] [data-testid="playback-duration"],
    [class*="playback-bar"] [data-testid="playback-position"],
    [class*="PlaybackBar"] time,
    .playback-bar__progress-time-elapsed,
    .playback-bar__progress-time {
      font-size: 11px !important;
      color: rgba(255,255,255,0.7) !important;
      min-width: 32px !important;
      text-align: center !important;
      flex-shrink: 0 !important;
    }

    /* Controls Row */
    [data-testid="player-controls"],
    .player-controls__buttons,
    [data-testid="now-playing-bar"] [class*="controls"],
    [data-testid="now-playing-bar"] [class*="Controls"] {
      display: flex !important;
      flex-direction: row !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 20px !important;
      width: 100% !important;
      max-width: none !important;
      padding: 0 !important;
      flex-shrink: 0 !important;
    }

    [data-testid="control-button-playpause"] {
      width: 44px !important;
      height: 44px !important;
      background: #1DB954 !important;
      border-radius: 50% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      flex-shrink: 0 !important;
    }
    [data-testid="control-button-playpause"] svg {
      fill: #000 !important;
      width: 20px !important;
      height: 20px !important;
    }

    [data-testid="control-button-skip-forward"],
    [data-testid="control-button-skip-back"] {
      width: 36px !important;
      height: 36px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      flex-shrink: 0 !important;
    }
    [data-testid="control-button-skip-forward"] svg,
    [data-testid="control-button-skip-back"] svg {
      fill: rgba(255,255,255,0.85) !important;
      width: 22px !important;
      height: 22px !important;
    }

    [data-testid="control-button-shuffle"],
    [data-testid="control-button-repeat"] {
      width: 32px !important;
      height: 32px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      flex-shrink: 0 !important;
    }
    [data-testid="control-button-shuffle"] svg,
    [data-testid="control-button-repeat"] svg {
      fill: rgba(255,255,255,0.55) !important;
      width: 18px !important;
      height: 18px !important;
    }

    [data-testid="volume-bar"],
    [data-testid="connect-device-picker-button"] {
      display: none !important;
    }

    /* ═══════════════════════════════════════════════════════════════════════
       SECTION 7: App bottom nav
       ═══════════════════════════════════════════════════════════════════════ */
    #spotilie-bottom-nav {
      position: fixed !important;
      bottom: calc(var(--sys-nav-h) + 6px) !important;
      left: 0 !important;
      right: 0 !important;
      height: var(--app-nav-h) !important;
      background: #000 !important;
      border-top: 1px solid rgba(255,255,255,0.1) !important;
      display: flex !important;
      flex-direction: row !important;
      justify-content: space-around !important;
      align-items: center !important;
      z-index: 9999 !important;
      padding: 0 !important;
      box-sizing: border-box !important;
    }

    #spotilie-bottom-nav .nav-item {
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      color: rgba(255,255,255,0.45) !important;
      text-decoration: none !important;
      font-size: 10px !important;
      font-weight: 500 !important;
      gap: 2px !important;
      padding: 6px 20px !important;
      -webkit-tap-highlight-color: transparent !important;
      cursor: pointer !important;
      flex: 1 !important;
      height: 100% !important;
    }

    #spotilie-bottom-nav .nav-item.active {
      color: #fff !important;
    }

    #spotilie-bottom-nav .nav-item svg {
      width: 22px !important;
      height: 22px !important;
      fill: currentColor !important;
    }

    [data-testid="tracklist-row"] {
      padding: 8px 12px !important;
      min-height: 52px !important;
      -webkit-tap-highlight-color: rgba(255,255,255,0.05) !important;
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

function measureAndApplyLayout() {
  const apply = () => {
    try {
      document.documentElement.style.setProperty('--app-nav-h', `${APP_NAV_H}px`);
      document.documentElement.style.setProperty('--player-h', `${PLAYER_H}px`);
      document.documentElement.style.setProperty('--top-bar-h', `${TOP_H}px`);
    } catch (_) {}
  };

  apply();
  window.visualViewport?.addEventListener('resize', apply);
  window.addEventListener('resize', apply);
}

function initNavHeightListener() {
  const ext = (globalThis as any).browser || (globalThis as any).chrome;
  if (!ext?.runtime?.onMessage) return;
  ext.runtime.onMessage.addListener((msg: any) => {
    if (msg?.type === 'SET_NAV_HEIGHT' && typeof msg.height === 'number') {
      const h = Math.max(0, msg.height);
      document.documentElement.style.setProperty('--sys-nav-h', `${h}px`);
      document.documentElement.style.setProperty(
        '--bottom-h', `${h + APP_NAV_H + PLAYER_H + 6}px`
      );
      const nav = document.getElementById('spotilie-bottom-nav');
      if (nav) nav.style.setProperty('bottom', `calc(${h}px + 6px)`, 'important');
      console.log(`SpotiLIE: Nav height set to ${h}px CSS from Kotlin`);
    }
  });
}

function spaNavigate(path: string) {
  let targetSelector = `a[href="${path}"]`;
  if (path === '/collection') {
    targetSelector = 'a[href^="/collection"], a[href="/collection/playlists"], a[href="/library"]';
  }

  const nativeLink = document.querySelector(targetSelector) as HTMLElement | null;
  if (nativeLink) {
    nativeLink.click();
    return;
  }

  try {
    history.pushState(null, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  } catch (e) {
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
        <svg viewBox="0 0 24 24"><path d="M3 22a1 1 0 0 1-1-1V3a1 1 0 0 1 2 0v18a1 1 0 0 1-1 1zM15.5 2.134A1 1 0 0 0 14 3v18a1 1 0 0 0 1.5.866l11-9a1 1 0 0 0 0-1.732l-11-9zM16 19.27V4.73L24.113 12 16 19.27z"/><path d="M9 22a1 1 0 0 1-1-1V3a1 1 0 1 1 2 0v18a1 1 0 0 1-1 1z"/></svg>
        <span>Library</span>
      </div>
    `;

    nav.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const navType = item.getAttribute('data-nav');
        if (navType === 'home') spaNavigate('/');
        else if (navType === 'search') spaNavigate('/search');
        else if (navType === 'library') spaNavigate('/collection');
      });
    });

    document.body.appendChild(nav);

    const updateActiveTab = () => {
      const path = window.location.pathname;
      nav.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        const navType = item.getAttribute('data-nav');
        if (navType === 'home' && (path === '/' || path === '')) {
          item.classList.add('active');
        } else if (navType === 'search' && path.startsWith('/search')) {
          item.classList.add('active');
        } else if (navType === 'library' && path.startsWith('/collection')) {
          item.classList.add('active');
        }
      });
    };

    const origPushState = history.pushState;
    history.pushState = function() {
      origPushState.apply(this, arguments as any);
      updateActiveTab();
    };
    const origReplaceState = history.replaceState;
    history.replaceState = function() {
      origReplaceState.apply(this, arguments as any);
      updateActiveTab();
    };
    window.addEventListener('popstate', updateActiveTab);
    updateActiveTab();
  };

  if (document.body) {
    createNav();
  } else {
    const wait = setInterval(() => {
      if (document.body) { clearInterval(wait); createNav(); }
    }, 50);
  }
}

function initProgressBarVisibility() {
  const PROGRESS_SELECTORS = [
    '.playback-bar',
    '[data-testid="playback-progressbar"]',
    '[data-testid="progress-bar"]',
    '[class*="progressBar"]',
    '[class*="PlaybackBar"]',
    '[class*="playback-bar"]',
    'div[role="slider"]'
  ];

  const forceProgressBarVisible = () => {
    for (const sel of PROGRESS_SELECTORS) {
      document.querySelectorAll(sel).forEach(el => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.setProperty('display', 'flex', 'important');
        htmlEl.style.setProperty('visibility', 'visible', 'important');
        htmlEl.style.setProperty('opacity', '1', 'important');
        htmlEl.style.setProperty('overflow', 'visible', 'important');
        htmlEl.style.setProperty('min-width', '120px', 'important');
        htmlEl.style.setProperty('width', '100%', 'important');

        let parent = htmlEl.parentElement;
        let depth = 0;
        while (parent && depth < 8) {
          const cs = getComputedStyle(parent);
          if (cs.overflow === 'hidden' || cs.overflowY === 'hidden') {
            parent.style.setProperty('overflow', 'visible', 'important');
          }
          if (cs.display === 'none') {
            parent.style.setProperty('display', 'flex', 'important');
          }
          parent = parent.parentElement;
          depth++;
        }
      });
    }
  };

  setTimeout(forceProgressBarVisible, 500);
  setTimeout(forceProgressBarVisible, 1500);
  setTimeout(forceProgressBarVisible, 3000);
  setInterval(forceProgressBarVisible, 5000);
}
