import { initCMPStub } from './cmp';
import { initAdblock } from './adblock';
import { initHardwareSpoofing } from './hardware';
import { initUI } from './ui';
import { initPlaybackHooks } from './playback';
import { initMetadataObserver } from './metadata';
import { initPremiumFeatures } from './premium';

(function() {
  if ((window as any)._spotilie_initialized) return;
  (window as any)._spotilie_initialized = true;

  console.log("SpotiLIE: Injector Active v2.0 (Nuclear Edition)");

  // Order matters:
  // 0. Adblock — network/Headers interception before any network requests
  initAdblock();
  // 1. CMP Stub — prevents web-player.js startup TypeError on __cmpCall
  initCMPStub();
  // 2. Hardware spoofing — before any Spotify JS can read device info
  initHardwareSpoofing();
  // 3. Premium features — patches quality settings and feature flags
  initPremiumFeatures();
  // 4. UI — inject CSS and bottom nav
  initUI();
  // 5. Playback hooks — shuffle reseed, media actions, Bluetooth guard
  initPlaybackHooks();
  // 6. Metadata observer — syncs to Android notification
  initMetadataObserver();
})();
