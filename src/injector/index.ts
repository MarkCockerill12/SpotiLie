/**
 * SpotiLIE content script — runs at document_start.
 *
 * This half owns the DOM and the extension APIs. The half that has to run
 * inside Spotify's own JavaScript context lives in page.ts and is injected
 * below; see the comment there for why the split is mandatory.
 */

import { initAdblock } from './adblock';
import { initDomProbe } from './probe';
import { initPlayer } from './player';
import { initUI } from './ui';
import { ext, initPageStateListener, log } from './shared';

/**
 * Inject the page-world script.
 *
 * Loaded from a moz-extension: URL rather than inlined, because Spotify serves
 * a CSP that forbids inline scripts. `async = false` keeps it ordered ahead of
 * the page's own bundle, which is what lets it patch JSON.parse in time.
 */
function injectPageScript() {
  try {
    const script = document.createElement('script');
    script.src = ext().runtime.getURL('page.js');
    script.async = false;
    script.onload = () => script.remove();
    (document.head || document.documentElement).appendChild(script);
  } catch (e) {
    console.error('SpotiLIE: failed to inject page script', e);
  }
}

(function () {
  if ((window as any)._spotilie) return;
  (window as any)._spotilie = true;

  injectPageScript();
  initPageStateListener();

  initAdblock();
  initUI();
  initPlayer();
  initDomProbe();

  log('content script active');
})();
