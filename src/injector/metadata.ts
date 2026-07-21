/**
 * SpotiLIE Metadata Observer Module
 *
 * Watches for track changes and syncs metadata to the Android
 * notification drawer via the WebExtension port bridge:
 *   content script → background.js → native port → MainActivity → MediaForegroundService
 *
 * Detection strategies (in priority order):
 * 1. Document title MutationObserver (primary — Spotify sets "Song - Artist")
 * 2. Now-playing bar DOM observer (backup — reads from widget)
 * 3. Polling interval (fallback — catches edge cases)
 */

interface TrackInfo {
  title: string;
  artist: string;
  isPlaying: boolean;
}

export function initMetadataObserver() {
  let lastTrack: TrackInfo = { title: '', artist: '', isPlaying: false };
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let titleObserverActive = false;
  let nowPlayingObserverActive = false;

  /** Parse "Song Name - Artist Name · Spotify" from document.title */
  const getTrackFromTitle = (): TrackInfo | null => {
    const docTitle = document.title || '';
    // Spotify title format: "Song Name - Artist Name" or "Song Name - Artist · Spotify"
    const dashIdx = docTitle.indexOf(' - ');
    if (dashIdx < 1) return null;

    const title = docTitle.substring(0, dashIdx).trim();
    let artist = docTitle.substring(dashIdx + 3).trim();

    // Strip " · Spotify" or " · Album" suffix
    const dotIdx = artist.lastIndexOf(' · ');
    if (dotIdx > 0) artist = artist.substring(0, dotIdx).trim();

    // Skip if title looks like an ad or the page isn't a track
    if (!title || title.toLowerCase() === 'spotify') return null;

    return { title, artist, isPlaying: isCurrentlyPlaying() };
  };

  /** Read metadata directly from the now-playing bar DOM */
  const getTrackFromDOM = (): TrackInfo | null => {
    try {
      const titleEl =
        document.querySelector('[data-testid="context-item-info-title"]') ||
        document.querySelector('[data-testid="now-playing-widget"] [data-testid="context-item-link"]');
      const artistEl =
        document.querySelector('[data-testid="context-item-info-subtitles"]') ||
        document.querySelector('[data-testid="now-playing-widget"] [data-testid="context-item-info-subtitles"]');

      if (!titleEl || !artistEl) return null;

      const title = (titleEl.textContent || '').trim();
      const artist = (artistEl.textContent || '').trim();

      // Skip ads/invalid states
      if (!title || title.toLowerCase() === 'advertisement') return null;

      return { title, artist, isPlaying: isCurrentlyPlaying() };
    } catch (_) {
      return null;
    }
  };

  /**
   * Detect playback state via aria-label on the play/pause button.
   * When Pause button is visible → currently playing.
   */
  const isCurrentlyPlaying = (): boolean => {
    const btn = document.querySelector('button[data-testid="control-button-playpause"]');
    if (btn) {
      const label = btn.getAttribute('aria-label') || '';
      return label.toLowerCase() === 'pause';
    }
    return !!document.querySelector('button[aria-label="Pause"]');
  };

  /**
   * Send metadata to native Android via the WebExtension port bridge.
   * Routes: content script → background.js → nativePort → MainActivity → MediaForegroundService
   *
   * NOTE: We do NOT use window.__TAURI__?.core?.invoke here because GeckoView does not
   * have the Tauri JS bridge injected (it's a separate engine from the Tauri WebView).
   */
  const sendUpdate = (track: TrackInfo) => {
    if (!track.title) return;

    // Only send if something changed
    if (
      track.title === lastTrack.title &&
      track.artist === lastTrack.artist &&
      track.isPlaying === lastTrack.isPlaying
    ) return;

    lastTrack = { ...track };

    try {
      // Primary: WebExtension runtime message → background.js → native port
      const ext = (globalThis as any).browser || (globalThis as any).chrome;
      if (ext?.runtime?.sendMessage) {
        ext.runtime.sendMessage({
          type: 'UPDATE_METADATA',
          title: track.title,
          artist: track.artist,
          isPlaying: track.isPlaying,
        }).catch(() => {});
        console.log(`SpotiLIE: Metadata sent → "${track.title}" by "${track.artist}" playing=${track.isPlaying}`);
        return;
      }
    } catch (_) {}

    // Fallback: try old Tauri invoke path (works if somehow running in standard WebView)
    try {
      const invoke = (window as any).__TAURI__?.core?.invoke ||
                     (window as any).__TAURI_INTERNALS__?.invoke;
      if (invoke) {
        invoke('update_media_info', {
          title: track.title,
          artist: track.artist,
          isPlaying: track.isPlaying,
        });
      }
    } catch (_) {}
  };

  const debouncedUpdate = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const track = getTrackFromTitle() || getTrackFromDOM();
      if (track) sendUpdate(track);
    }, 250);
  };

  // ── Strategy 1: Title element observer ───────────────────────────────
  const startTitleObserver = () => {
    if (titleObserverActive) return;
    const titleEl = document.querySelector('title');
    if (!titleEl) return;
    titleObserverActive = true;
    new MutationObserver(debouncedUpdate).observe(titleEl, {
      subtree: true,
      characterData: true,
      childList: true,
    });
  };

  // ── Strategy 2: Now-playing bar observer ─────────────────────────────
  const startNowPlayingObserver = () => {
    if (nowPlayingObserverActive) return;
    const target =
      document.querySelector('[data-testid="now-playing-bar"]') ||
      document.querySelector('.Root__now-playing-bar');
    if (!target) return;
    nowPlayingObserverActive = true;
    new MutationObserver(debouncedUpdate).observe(target, {
      subtree: true,
      characterData: true,
      childList: true,
      attributes: true,
      attributeFilter: ['aria-label'],
    });
  };

  // ── Strategy 3: Polling fallback ─────────────────────────────────────
  setInterval(debouncedUpdate, 3000);

  // Initialize and retry until DOM elements are available
  const tryInit = () => {
    startTitleObserver();
    startNowPlayingObserver();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryInit);
  } else {
    tryInit();
  }

  // Watch for Spotify dynamically injecting the now-playing bar (it's a React SPA)
  if (document.body) {
    const bodyObserver = new MutationObserver(() => {
      if (!nowPlayingObserverActive) startNowPlayingObserver();
      if (!titleObserverActive) startTitleObserver();
      if (nowPlayingObserverActive && titleObserverActive) {
        bodyObserver.disconnect();
      }
    });
    bodyObserver.observe(document.body, { childList: true, subtree: false });
  }
}
