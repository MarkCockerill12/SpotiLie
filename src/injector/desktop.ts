/**
 * Desktop-player enablement.
 *
 * The engine really is desktop Firefox (see MainActivity's UA), so this module
 * doesn't fabricate a browser identity — it only corrects the handful of values
 * that would otherwise contradict that UA on Android, keeps the consent
 * framework from crashing startup, and unlocks the premium-tier surfaces.
 */

import { unlockPayload } from './adblock';
import { log, warn } from './shared';

export function initDesktop() {
  try {
    spoofDeviceClass();
    patchEme();
    initAudioUnlocker();
    stubConsentFramework();
    unlockPremiumResponses();
    enableAutoplay();
    log('desktop enablement active');
  } catch (e) {
    console.error('SpotiLIE: desktop init failed', e);
  }
}

// ── Device class ─────────────────────────────────────────────────────────────

/** Kept in sync with DESKTOP_FIREFOX_UA in MainActivity.kt. */
const DESKTOP_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:153.0) Gecko/20100101 Firefox/153.0';

/**
 * Present as desktop Firefox to page script.
 *
 * The native layer applies the same UA to the top-level document request and
 * then drops it, because leaving GeckoView's override in place makes Gecko
 * treat `user-agent` as an author header and every CORS preflight Spotify does
 * fails. Everything after that first request is this spoof's job — which is
 * fine, because the desktop/mobile branch in Spotify's bundle reads
 * navigator.userAgent, not the wire header.
 *
 * Deliberately NOT spoofed:
 *   navigator.vendor        — desktop Firefox reports "", as Gecko already does.
 *   navigator.userAgentData — doesn't exist in Firefox; defining it would be a
 *                             stronger spoofing signal than its absence.
 *   navigator.plugins       — Gecko already returns the standard fixed list.
 */
function spoofDeviceClass() {
  const define = (prop: string, value: unknown) => {
    try {
      Object.defineProperty(navigator, prop, { get: () => value, configurable: true });
    } catch (_) {}
  };

  define('userAgent', DESKTOP_UA);
  define('appVersion', DESKTOP_UA.replace('Mozilla/', ''));
  define('platform', 'Win32');
  define('oscpu', 'Windows NT 10.0; Win64; x64');
  define('maxTouchPoints', 0);

  // Report a mouse-driven pointer so the desktop player keeps hover affordances
  // and full-size hit targets. The real MediaQueryList is returned untouched
  // apart from `matches`, so listeners and methods all still work.
  try {
    const original = window.matchMedia.bind(window);
    window.matchMedia = (query: string): MediaQueryList => {
      const mql = original(query);
      let forced: boolean | null = null;
      if (/pointer\s*:\s*fine|hover\s*:\s*hover|any-pointer\s*:\s*fine/i.test(query)) forced = true;
      else if (/pointer\s*:\s*coarse|hover\s*:\s*none/i.test(query)) forced = false;

      if (forced !== null) {
        try {
          Object.defineProperty(mql, 'matches', { get: () => forced, configurable: true });
        } catch (_) {}
      }
      return mql;
    };
  } catch (e) {
    warn('matchMedia override failed', e);
  }
}

// ── Widevine ─────────────────────────────────────────────────────────────────

/**
 * Spotify asks for the robustness levels a desktop machine offers. Android's
 * Widevine L3 rejects those, so retry with progressively simpler configs rather
 * than letting the first rejection kill playback.
 */
function patchEme() {
  const original = navigator.requestMediaKeySystemAccess;
  if (!original || (original as any)._spotilie) return;

  const patched = function (
    this: Navigator,
    keySystem: string,
    configs: MediaKeySystemConfiguration[]
  ) {
    return original.call(this, keySystem, configs).catch((err) => {
      warn('EME rejected desktop configs, retrying without robustness', err);

      const relaxed: MediaKeySystemConfiguration[] = JSON.parse(JSON.stringify(configs));
      for (const cfg of relaxed) {
        cfg.audioCapabilities?.forEach((c: any) => delete c.robustness);
        cfg.videoCapabilities?.forEach((c: any) => delete c.robustness);
      }

      return original.call(this, keySystem, relaxed).catch(() => {
        warn('EME retrying with minimal Widevine L3 config');
        return original.call(this, keySystem, [{
          initDataTypes: ['cenc'],
          audioCapabilities: [
            { contentType: 'audio/mp4; codecs="mp4a.40.2"' },
            { contentType: 'audio/webm; codecs="opus"' },
          ],
        }]);
      });
    });
  };
  (patched as any)._spotilie = true;
  navigator.requestMediaKeySystemAccess = patched;
}

/** Resume the audio graph on the first real user gesture. */
function initAudioUnlocker() {
  const unlock = () => {
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (Ctx) {
        const ctx = new Ctx();
        if (ctx.state === 'suspended') ctx.resume();
      }
    } catch (_) {}
    document.removeEventListener('touchstart', unlock, true);
    document.removeEventListener('click', unlock, true);
  };
  document.addEventListener('touchstart', unlock, true);
  document.addEventListener('click', unlock, true);
}

// ── Consent framework ────────────────────────────────────────────────────────

/**
 * Spotify's bundle talks to an IAB TCF consent frame. When ad blocking removes
 * that frame, the bundle dereferences null and throws during initialisation,
 * which takes the whole player down.
 *
 * We provide the locator frames and API stubs it looks for. Earlier versions of
 * this file also installed an `Object.prototype.__cmpCall` getter and replaced
 * `MessageEvent.prototype.source` globally — that made every object in the page
 * report a truthy `__cmpCall` and handed every message listener a fake source
 * window, which is far more likely to break Spotify than the bug it patched.
 */
function stubConsentFramework() {
  const consentPayload = { eventStatus: 'tcloaded', gdprApplies: false };

  if (!(window as any).__cmp) {
    const stub: any = function (..._args: any[]) {
      const callback = _args[2];
      if (typeof callback === 'function') {
        try { callback(consentPayload, true); } catch (_) {}
      }
    };
    stub.a = [];
    (window as any).__cmp = stub;
  }

  if (!(window as any).__tcfapi) {
    const stub: any = function (_cmd: string, _version: number, callback: any) {
      if (typeof callback === 'function') {
        try {
          callback({ ...consentPayload, tcString: 'CP1234567890', listenerId: 1 }, true);
        } catch (_) {}
      }
    };
    stub.a = [];
    (window as any).__tcfapi = stub;
  }

  const ensureLocator = (name: string) => {
    try {
      if (document.querySelector(`iframe[name="${name}"]`)) return;
      const frame = document.createElement('iframe');
      frame.name = name;
      frame.id = name;
      frame.style.display = 'none';
      (document.body || document.documentElement).appendChild(frame);
    } catch (_) {}
  };
  const ensureLocators = () => {
    ensureLocator('__cmpLocator');
    ensureLocator('__tcfapiLocator');
  };
  ensureLocators();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureLocators, { once: true });
  }

  // Answer consent probes sent by postMessage.
  window.addEventListener('message', (event) => {
    const call = (event.data as any)?.__cmpCall;
    if (!call) return;
    const source = event.source as any;
    if (typeof source?.postMessage !== 'function') return;
    try {
      source.postMessage({
        __cmpReturn: { returnValue: consentPayload, success: true, callId: call.callId ?? null },
      }, '*');
    } catch (_) {}
  }, true);

  // Net for anything that still throws on a missing consent frame. Scoped to
  // consent errors only, so genuine player errors surface normally.
  const isConsentError = (text: string) => text.includes('__cmp') || text.includes('__tcfapi');

  window.addEventListener('error', (event) => {
    if (event.message && isConsentError(event.message)) {
      warn('suppressed consent-frame error:', event.message);
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    const reason = (event.reason as any)?.message || String(event.reason || '');
    if (isConsentError(reason)) event.preventDefault();
  }, true);
}

// ── Premium surfaces ─────────────────────────────────────────────────────────

/**
 * Patch entitlement responses read via `fetch().json()`.
 *
 * Note this hooks `Response.prototype.json` and NOT `JSON.stringify`. React
 * calls stringify thousands of times a second and hooking it caused visible
 * jank for no benefit.
 */
function unlockPremiumResponses() {
  const original = Response.prototype.json;
  Response.prototype.json = async function () {
    const data = await original.call(this);
    if (!data || typeof data !== 'object') return data;

    // Same deep walk as the JSON.parse hook — responses read via
    // response.json() never pass through JSON.parse, so they need it too.
    unlockPayload(data);

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

function enableAutoplay() {
  try {
    const raw = localStorage.getItem('playback.settings');
    if (!raw) return;
    const settings = JSON.parse(raw);
    if (settings.autoplay) return;
    settings.autoplay = true;
    if (settings.crossfade === undefined) settings.crossfade = 0;
    localStorage.setItem('playback.settings', JSON.stringify(settings));
  } catch (_) {}
}
