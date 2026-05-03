(function() {
  console.log("SpotiLIE: Remote Injector Enabled");

  // ─── Mobile-Friendly CSS + DOM Transformation ────────────────────────
  // Uses current Spotify Web Player selectors (ID-based, stable)
  const MOBILE_CSS = `
    /* ══════════════════════════════════════════════════════════════════
       SpotiLIE Mobile Skin — Spotify Web Player (2024/2025)
       Uses stable ID selectors: #Desktop_LeftSidebar_Id, #main-view, etc.
       ══════════════════════════════════════════════════════════════════ */

    /* ── Hide the left sidebar ────────────────────────────────────────── */
    #Desktop_LeftSidebar_Id,
    [data-testid="left-sidebar"],
    .Root__nav-bar {
      display: none !important;
      width: 0 !important;
      min-width: 0 !important;
    }

    /* ── Hide the right sidebar / buddy feed ───────────────────────────── */
    .Root__right-sidebar,
    aside[aria-label="Friend Activity"],
    [data-testid="buddy-feed"],
    [data-testid="right-sidebar"] {
      display: none !important;
      width: 0 !important;
    }

    /* ── Hide the resize handle between panels ─────────────────────────── */
    .LayoutResizer__resize-bar,
    [data-testid="LayoutResizer"] {
      display: none !important;
    }

    /* ── Force main view to fill entire screen ─────────────────────────── */
    #main-view,
    .Root__main-view {
      width: 100% !important;
      max-width: 100vw !important;
      min-width: 0 !important;
    }

    /* ── Override the root grid container to single column ─────────────── */
    /* Spotify uses a CSS Grid with sidebar | main | sidebar */
    /* Force it to a single 100vw column */
    .Root__top-container,
    [class*="Root__top-container"] {
      grid-template-columns: 0 1fr 0 !important;
      width: 100vw !important;
      max-width: 100vw !important;
      overflow-x: hidden !important;
    }

    /* ── Hide top nav bar (global-nav-bar) — hides search, upgade banner ─ */
    /* NOTE: We KEEP it visible since it contains back/forward navigation */
    #global-nav-bar {
      padding: 4px 8px !important;
      min-height: 44px !important;
    }

    /* Hide the install/upgrade buttons in topbar */
    [data-testid="upgrade-button"],
    [data-testid="install-app-button"],
    a[href="/premium"],
    a[aria-label="Upgrade to Premium"] {
      display: none !important;
    }

    /* Back / forward nav buttons – large enough for touch */
    [data-testid="top-bar-back-button"],
    [data-testid="top-bar-forward-button"] {
      min-width: 44px !important;
      min-height: 44px !important;
    }

    /* ── Main content scroll area ──────────────────────────────────────── */
    #main-view,
    .main-view-container,
    .main-view-container__scroll-node,
    [data-testid="main-view-container"] {
      -webkit-overflow-scrolling: touch !important;
      overflow-y: auto !important;
      scrollbar-width: none !important;
    }
    #main-view::-webkit-scrollbar,
    .main-view-container::-webkit-scrollbar,
    .main-view-container__scroll-node::-webkit-scrollbar {
      display: none !important;
    }

    /* ── Grid cards (Home/Browse) — 2 columns on mobile ───────────────── */
    [data-testid="grid-container"] {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 12px !important;
      padding: 0 12px !important;
    }

    /* ── Shelf / section padding ────────────────────────────────────────── */
    .contentSpacing,
    section[data-testid] {
      padding: 0 12px !important;
    }

    /* ── Now Playing Bar (bottom footer) ───────────────────────────────── */
    [data-testid="now-playing-bar"],
    footer[data-testid="now-playing-bar"],
    .Root__now-playing-bar {
      min-height: 64px !important;
      padding: 4px 8px !important;
      background: #181818 !important;
      border-top: 1px solid rgba(255,255,255,0.08) !important;
      width: 100vw !important;
      max-width: 100vw !important;
      box-sizing: border-box !important;
      overflow: hidden !important;
    }
    
    .now-playing-bar__center {
      width: auto !important;
      max-width: none !important;
      min-width: 0 !important;
      flex: 1 1 auto !important;
    }

    /* ── Now playing widget (album art + track info) ───────────────────── */
    [data-testid="now-playing-widget"],
    .now-playing-bar__left {
      min-width: 0 !important;
      flex: 1 1 auto !important;
      overflow: hidden !important;
    }

    /* Album art */
    [data-testid="now-playing-widget"] img,
    [data-testid="CoverSlotCollapsed__container"] img {
      width: 48px !important;
      height: 48px !important;
      border-radius: 4px !important;
    }

    /* Track name & artist – prevent overflow */
    [data-testid="context-item-info-title"],
    [data-testid="context-item-info-subtitles"],
    [data-testid="now-playing-widget"] a,
    [data-testid="now-playing-widget"] span {
      font-size: 13px !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }

    /* ── Playback controls ─────────────────────────────────────────────── */
    [data-testid="player-controls"],
    .player-controls__buttons {
      gap: 4px !important;
    }

    /* Minimum 44px touch target for all control buttons */
    [data-testid="player-controls"] button,
    .player-controls__buttons button,
    [data-testid="control-button-skip-back"],
    [data-testid="control-button-skip-forward"],
    [data-testid="control-button-playpause"],
    button[data-testid="control-button-shuffle"],
    button[data-testid="control-button-repeat"] {
      min-width: 44px !important;
      min-height: 44px !important;
      padding: 8px !important;
    }

    /* Play/Pause slightly bigger */
    [data-testid="control-button-playpause"],
    button[aria-label="Play"],
    button[aria-label="Pause"] {
      min-width: 48px !important;
      min-height: 48px !important;
    }

    /* ── Hide volume & extras (right section of now-playing bar) ──────── */
    .now-playing-bar__right,
    [data-testid="volume-bar"],
    [data-testid="now-playing-bar-right"] {
      display: none !important;
    }

    /* ── Progress bar ──────────────────────────────────────────────────── */
    [data-testid="progress-bar"],
    .playback-bar {
      height: 10px !important;
      cursor: pointer !important;
    }
    [data-testid="progress-bar"] [role="slider"] {
      width: 14px !important;
      height: 14px !important;
    }

    /* ── Tracklist rows – taller for touch ─────────────────────────────── */
    [data-testid="tracklist-row"],
    [role="row"] {
      min-height: 52px !important;
    }
    [data-testid="tracklist-row"] [role="gridcell"],
    [role="row"] [role="gridcell"] {
      padding: 8px 12px !important;
    }

    /* ── Artist / Album page header ────────────────────────────────────── */
    [data-testid="entity-header"] {
      padding: 16px 12px !important;
    }
    [data-testid="entity-header"] img {
      width: 160px !important;
      height: 160px !important;
    }

    /* ── Search input ───────────────────────────────────────────────────── */
    [data-testid="search-input"] {
      font-size: 16px !important;
      min-height: 44px !important;
    }

    /* ── Context menus ──────────────────────────────────────────────────── */
    [data-testid="context-menu"],
    [role="menu"] {
      max-width: 90vw !important;
      max-height: 70vh !important;
      overflow-y: auto !important;
    }

    /* ── General mobile touch improvements ─────────────────────────────── */
    * {
      -webkit-tap-highlight-color: transparent !important;
    }
    body {
      overscroll-behavior: contain !important;
      -webkit-text-size-adjust: 100% !important;
    }
    a, button {
      touch-action: manipulation !important;
    }

    /* ── Hide desktop-only footer/global nav ────────────────────────────── */
    .Root__globalNav,
    [data-testid="web-player-link"] {
      display: none !important;
    }
  `;

  // ─── Apply CSS ────────────────────────────────────────────────────────
  function injectMobileCSS() {
    const id = 'spotilie-mobile-css';
    let style = document.getElementById(id);
    if (!style) {
      style = document.createElement('style');
      style.id = id;
      document.head.appendChild(style);
    }
    style.textContent = MOBILE_CSS;

    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute("name", "viewport");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0");
  }

  // ─── Apply layout via DOM style (overcomes grid stacking issues) ──────
  function applyLayout() {
    var sidebar = document.getElementById('Desktop_LeftSidebar_Id');
    var mainView = document.getElementById('main-view');

    if (sidebar) {
      sidebar.style.setProperty('display', 'none', 'important');
    }

    if (mainView && mainView.parentElement) {
      var parent = mainView.parentElement;
      parent.style.setProperty('grid-template-columns', '0 1fr 0', 'important');
      parent.style.setProperty('width', '100vw', 'important');
      parent.style.setProperty('overflow-x', 'hidden', 'important');
    }
  }

  // Inject immediately and on DOM ready
  if (document.head) { injectMobileCSS(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      injectMobileCSS();
      applyLayout();
    });
  } else {
    applyLayout();
  }

  // Re-apply after a delay (Spotify SPA loads JS framework after initial HTML)
  setTimeout(function() {
    injectMobileCSS();
    applyLayout();
  }, 1500);

  setTimeout(function() {
    injectMobileCSS();
    applyLayout();
  }, 4000);

  // MutationObserver: re-inject if our <style> tag is removed by SPA navigation
  var observer = new MutationObserver(function() {
    if (!document.getElementById('spotilie-mobile-css')) {
      injectMobileCSS();
    }
    // Also re-apply layout when Spotify rebuilds the DOM (page navigation)
    applyLayout();
  });
  observer.observe(document.documentElement, { childList: true, subtree: false });

  // ─── Global CSS injection helper (for console debugging) ──────────────
  (window as any).spotilieInject = function(css: string) {
    const id = 'spotilie-remote-css';
    let style = document.getElementById(id);
    if (!style) {
      style = document.createElement('style');
      style.id = id;
      document.head.appendChild(style);
    }
    style.innerHTML = css;
    console.log("CSS Applied.");
  };

  // ─── Media Controls (notification / headphone buttons → Spotify DOM) ──
  (window as any).spotilieMediaAction = function(action: string) {
    try {
      var p = (document.querySelector('button[aria-label="Pause"]') || document.querySelector('button[aria-label="Play"]') || document.querySelector('[data-testid="control-button-playpause"]')) as HTMLElement | null;
      var n = (document.querySelector('button[aria-label="Next"]') || document.querySelector('[data-testid="control-button-skip-forward"]')) as HTMLElement | null;
      var b = (document.querySelector('button[aria-label="Previous"]') || document.querySelector('[data-testid="control-button-skip-back"]')) as HTMLElement | null;
      if (action === 'play' || action === 'pause') p?.click();
      if (action === 'next') n?.click();
      if (action === 'prev') b?.click();
    } catch(e) {}
  };

  // ─── Metadata scraper: push track info → Rust → Android notification ──
  setInterval(function() {
    try {
      var raw = document.title || "";
      if (raw.indexOf(" - ") > -1) {
        var parts = raw.split(" - ");
        var title = parts[0].replace(/^[\W]+ /, "").trim();
        var artist = parts[1].trim();
        var isPlaying = !!(document.querySelector('button[aria-label="Pause"]') || document.querySelector('button[data-testid="control-button-playpause"][aria-label="Pause"]'));
        if ((window as any).__TAURI__?.core?.invoke) {
          (window as any).__TAURI__.core.invoke("update_media_info", { title, artist, isPlaying });
        }
      }
    } catch(e) {}
  }, 1000);
})();