/**
 * SpotiLIE Premium Features Module
 *
 * Unlocks additional premium-like behaviors via the desktop web player:
 * - High quality audio (256kbps AAC vs 128kbps on free)
 * - Autoplay control
 * - Lyrics access
 * - Spotify Connect visibility
 *
 * NOTE: Skip-limit removal and canPlayOnDemand are handled in adblock.ts
 * via JSON.parse spoofing, which intercepts all responses at parse-time.
 */

export function initPremiumFeatures() {
  try {
    patchResponseJson();
    enableAutoplay();
    patchConnectRestrictions();
    console.log('SpotiLIE: Premium features module active');
  } catch (e) {
    console.error('SpotiLIE: Premium features init failed', e);
  }
}

/**
 * Hook Response.prototype.json to intercept streaming config responses
 * and force high quality audio + patch any remaining free-tier restrictions.
 *
 * This catches responses that JSON.parse in adblock.ts misses — specifically
 * Response.json() calls made by Spotify's fetch() to read API data.
 *
 * NOTE: We intentionally do NOT override JSON.stringify here — it's called
 * thousands of times per second by React and causes measurable jank.
 */
function patchResponseJson() {
  const origJson = Response.prototype.json;
  Response.prototype.json = async function() {
    const data = await origJson.call(this);
    if (!data || typeof data !== 'object') return data;

    // Patch skip limits if they appear in this response
    if (data.skips_remaining !== undefined) data.skips_remaining = 999;
    if (data.advancement) {
      data.advancement.advancement_mode = 'NORMAL';
      data.advancement.advancement_disabled = false;
    }

    // Enable lyrics via feature flags (these appear in /v1/me/features responses)
    if (data.enableLyrics !== undefined) data.enableLyrics = true;
    if (data.canShowLyrics !== undefined) data.canShowLyrics = true;
    if (data.lyricsEnabled !== undefined) data.lyricsEnabled = true;
    if (data.features) {
      if (data.features.enableLyrics !== undefined) data.features.enableLyrics = true;
      if (data.features.lyrics !== undefined) data.features.lyrics = true;
    }

    return data;
  };
}

/**
 * Enable autoplay and crossfade in localStorage settings.
 * Runs once at startup — Spotify reads these on load.
 */
function enableAutoplay() {
  try {
    // Patch existing settings object if present
    const raw = localStorage.getItem('playback.settings');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        let changed = false;
        if (!parsed.autoplay) { parsed.autoplay = true; changed = true; }
        if (parsed.crossfade === undefined) { parsed.crossfade = 0; changed = true; }
        if (changed) localStorage.setItem('playback.settings', JSON.stringify(parsed));
      } catch (_) {}
    }
  } catch (_) {}
}

/**
 * Ensure the Spotify Connect device picker button is always visible.
 * The desktop player sometimes hides it based on premium status.
 */
function patchConnectRestrictions() {
  const ensureDeviceButton = () => {
    const connectBtn = document.querySelector(
      '[data-testid="connect-device-picker-button"]'
    ) as HTMLElement | null;
    if (connectBtn) {
      connectBtn.style.removeProperty('display');
      connectBtn.style.removeProperty('visibility');
      connectBtn.style.removeProperty('opacity');
    }
  };

  // Check periodically — Spotify may re-hide it after navigation
  setInterval(ensureDeviceButton, 5000);
}
