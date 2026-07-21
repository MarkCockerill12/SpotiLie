/**
 * SpotiLIE Hardware Spoofing Module
 * 
 * Comprehensive desktop emulation to convince Spotify's detection
 * that this is a real Windows desktop browser. This unlocks:
 * - On-demand track selection (no forced shuffle)
 * - Unlimited skips
 * - Full queue management
 * - Higher quality audio (when available via web player)
 */

export function initHardwareSpoofing() {
  try {
    // ── Platform spoofing ─────────────────────────────────────────────
    try {
      Object.defineProperty(navigator, 'platform', {
        get: () => 'Win32',
        configurable: true
      });
    } catch (_) {}

    try {
      Object.defineProperty(navigator, 'vendor', {
        get: () => 'Google Inc.',
        configurable: true
      });
    } catch (_) {}

    // ── Desktop plugins polyfill ──────────────────────────────────────
    try {
      const fakePlugin = {
        name: 'Chrome PDF Plugin',
        filename: 'internal-pdf-viewer',
        description: 'Portable Document Format',
        length: 1,
        item: () => null,
        namedItem: () => null,
      };
      const fakePlugins = [fakePlugin];
      (fakePlugins as any).item = (i: number) => fakePlugins[i] || null;
      (fakePlugins as any).namedItem = (name: string) => fakePlugins.find(p => p.name === name) || null;
      Object.defineProperty(navigator, 'plugins', {
        get: () => fakePlugins,
        configurable: true
      });
    } catch (_) {}

    // ── Client Hints (userAgentData) spoofing ─────────────────────────
    // Critical: Spotify's modern JS checks navigator.userAgentData (Client Hints).
    // If userAgentData returns Android/mobile, Spotify detects spoofing and disables playback.
    if ('userAgentData' in navigator || true) {
      try {
        const fakeUserAgentData = {
          brands: [
            { brand: 'Not-A.Brand', version: '99' },
            { brand: 'Chromium', version: '124' },
            { brand: 'Google Chrome', version: '124' }
          ],
          mobile: false,
          platform: 'Windows',
          getHighEntropyValues: async (hints: string[]) => ({
            brands: [
              { brand: 'Not-A.Brand', version: '99' },
              { brand: 'Chromium', version: '124' },
              { brand: 'Google Chrome', version: '124' }
            ],
            mobile: false,
            platform: 'Windows',
            platformVersion: '10.0.0',
            architecture: 'x86',
            bitness: '64',
            model: '',
            uaFullVersion: '124.0.6367.201',
            fullVersionList: [
              { brand: 'Not-A.Brand', version: '99.0.0.0' },
              { brand: 'Chromium', version: '124.0.6367.201' },
              { brand: 'Google Chrome', version: '124.0.6367.201' }
            ]
          }),
          toJSON: () => ({
            brands: [
              { brand: 'Not-A.Brand', version: '99' },
              { brand: 'Chromium', version: '124' },
              { brand: 'Google Chrome', version: '124' }
            ],
            mobile: false,
            platform: 'Windows'
          })
        };

        Object.defineProperty(navigator, 'userAgentData', {
          get: () => fakeUserAgentData,
          configurable: true
        });
      } catch (e) {
        console.warn('SpotiLIE: Failed to spoof userAgentData', e);
      }
    }

    // ── EME Widevine Handler with Android L3 Fallback ──────────────────
    const origRequestMediaKeySystemAccess = navigator.requestMediaKeySystemAccess;
    if (origRequestMediaKeySystemAccess && !(origRequestMediaKeySystemAccess as any)._spotilie_patched) {
      const patchedFn = function(this: Navigator, keySystem: string, supportedConfigurations: MediaKeySystemConfiguration[]) {
        console.log('SpotiLIE: EME requestMediaKeySystemAccess called for:', keySystem);
        return origRequestMediaKeySystemAccess.call(this, keySystem, supportedConfigurations)
          .then(access => {
            console.log('SpotiLIE: EME requestMediaKeySystemAccess SUCCEEDED for:', keySystem);
            return access;
          })
          .catch(err => {
            console.warn('SpotiLIE: EME requestMediaKeySystemAccess failed with original configs, retrying with sanitized Android Widevine L3 configs...', err);
            
            // Attempt 1: Strip robustness constraints that desktop JS requests but Android WebView Widevine L3 rejects
            try {
              const sanitizedConfigs = JSON.parse(JSON.stringify(supportedConfigurations));
              sanitizedConfigs.forEach((cfg: any) => {
                if (cfg.audioCapabilities) {
                  cfg.audioCapabilities.forEach((cap: any) => delete cap.robustness);
                }
                if (cfg.videoCapabilities) {
                  cfg.videoCapabilities.forEach((cap: any) => delete cap.robustness);
                }
              });
              return origRequestMediaKeySystemAccess.call(this, keySystem, sanitizedConfigs)
                .then(access => {
                  console.log('SpotiLIE: EME requestMediaKeySystemAccess SUCCEEDED with sanitized configs for:', keySystem);
                  return access;
                })
                .catch(() => {
                  // Attempt 2: Minimal Widevine L3 config for Android WebView
                  console.warn('SpotiLIE: Retrying EME with basic Widevine L3 config');
                  const basicL3Config: MediaKeySystemConfiguration[] = [{
                    initDataTypes: ['cenc'],
                    audioCapabilities: [
                      { contentType: 'audio/mp4; codecs="mp4a.40.2"' },
                      { contentType: 'audio/webm; codecs="opus"' }
                    ]
                  }];
                  return origRequestMediaKeySystemAccess.call(this, keySystem, basicL3Config);
                });
            } catch (_) {
              throw err;
            }
          });
      };
      (patchedFn as any)._spotilie_patched = true;
      navigator.requestMediaKeySystemAccess = patchedFn;
    }

    // ── AudioContext & HTML5 Audio Unlocker ───────────────────────────
    initAudioUnlocker();

    console.log('SpotiLIE: Hardware spoofing active (desktop layout + userAgentData + EME handler)');
  } catch (e) {
    console.error('SpotiLIE: Failed to spoof hardware', e);
  }
}

/** Unlock Web Audio / HTML5 Audio engine on initial user interaction */
function initAudioUnlocker() {
  const unlock = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const dummyCtx = new AudioCtx();
        if (dummyCtx.state === 'suspended') {
          dummyCtx.resume();
        }
      }
    } catch (_) {}

    try {
      const silentAudio = new Audio();
      silentAudio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
      silentAudio.play().then(() => silentAudio.pause()).catch(() => {});
    } catch (_) {}

    document.removeEventListener('touchstart', unlock, true);
    document.removeEventListener('click', unlock, true);
  };

  document.addEventListener('touchstart', unlock, true);
  document.addEventListener('click', unlock, true);
}


