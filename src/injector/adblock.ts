/**
 * SpotiLIE Adblock Module — Nuclear-grade ad elimination
 *
 * Four-layer defense:
 * 1. JSON.parse / JSON.stringify interception — spoofs premium status in all parsed data
 * 2. Network interception — blocks fetch/XHR to ad endpoints + returns safe empty responses
 * 3. DOM observer — continuously purges ad elements that slip through
 * 4. Audio ad guard — detects server-side ad insertion, mutes, and aggressively auto-skips
 *
 * IMPORTANT — "Safe to block" vs "Breaks playback":
 *   ❌ NEVER block: dealer.spotify.com, wg.spotify.com (websocket infra), apresolve, 
 *      spclient.wg.spotify.com (root), exp.spotify.com, log.spotify.com,
 *      analytics.spotify.com — blocking these causes "Playback Paused" freeze loops.
 *   ✅ SAFE to block: audio-ads, adgen, adstudio, ad-proxy, pixel, video-ak, etc.
 */

// ── Comprehensive Spotify ad endpoint patterns (SAFE ones only) ───────────────
const AD_PATTERNS: string[] = [
  // Spotify pure-ad endpoints
  '/ad-logic/',
  'spclient.wg.spotify.com/ads',
  'spclient.wg.spotify.com/ad-logic',
  'api.spotify.com/v1/ads',
  'audio-ads.spotify.com',
  'adeventtracker.spotify.com',
  'ads-fa.spotify.com',
  'adgen.spotify.com',
  'ad-proxy.spotify.com',
  'adstudio.spotify.com',
  'ads.spotify.com',
  'pixel.spotify.com',
  'video-ak.cdn.spotify.com',
  'adjust-callback.spotify.com',
  'crashdump.spotify.com',
  'datasharing.spotify.com',

  // Google ad services
  'doubleclick.net',
  'googleadservices.com',
  'googletagservices.com',
  'googlesyndication.com',
  'google-analytics.com',
  'pagead2.googlesyndication.com',
  'securepubads.g.doubleclick.net',

  // Third-party tracking/ad networks
  'moatads.com',
  'comscore.com',
  'scorecardresearch.com',
  'branch.io',
  'branchster.link',
  'app.link',
  'facebook.com/tr',
  'facebook.net/en_US/fbevents.js',
  'connect.facebook.net',
  'admob.com',
  'adsrvr.org',
  'adnxs.com',
  'casalemedia.com',
  'criteo.com',
  'rubiconproject.com',
  'openx.net',
  'pubmatic.com',
  'freewheel.tv',
  'spotxchange.com',
  'liveramp.com',
  'rlcdn.com',
];

// ── Fast regex for pattern matching ──────────────────────────────────────────
const AD_REGEX = new RegExp(AD_PATTERNS.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'i');

function isAdUrl(url: string): boolean {
  return AD_REGEX.test(url);
}

// ── Safe empty responses by content type ─────────────────────────────────────
function makeSafeResponse(url: string): Response {
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': '*',
  });
  if (url.includes('.js')) {
    headers.set('Content-Type', 'application/javascript');
    return new Response('', { status: 200, headers });
  }
  headers.set('Content-Type', 'application/json');
  return new Response('{}', { status: 200, headers });
}

function spoofPremium(data: any): any {
  if (!data || typeof data !== 'object') return data;

  if ((data as any).__spotilie_spoofed) return data;
  try { (data as any).__spotilie_spoofed = true; } catch (_) {}

  // ── Account / Player product flags ──────────────────────────────────────────
  if (data.canPlayOnDemand !== undefined) data.canPlayOnDemand = true;
  if (data.is_premium !== undefined) data.is_premium = true;
  if (data.premium !== undefined && typeof data.premium === 'boolean') data.premium = true;
  if (data.product !== undefined && typeof data.product === 'string') {
    if (data.product === 'free' || data.product === 'open') data.product = 'premium';
  }

  // ── Streaming rules ───────────────────────────────────────────────
  if (data.streaming_rules) {
    data.streaming_rules.advancement_disabled = false;
    data.streaming_rules.advancement_mode = 'NORMAL';
    data.streaming_rules.skips_unlimited = true;
    data.streaming_rules.max_skips_per_hour = 999;
  }

  // ── Skip limits ───────────────────────────────────────────────────
  if (data.skips_remaining !== undefined) data.skips_remaining = 999;
  if (data.advancement) {
    data.advancement.advancement_mode = 'NORMAL';
    data.advancement.advancement_disabled = false;
    data.advancement.skips_remaining = 999;
  }

  return data;
}

export function initAdblock() {
  try {
    // ── Layer 0: Headers prototype interception ───────────────────────
    // Prevent x-cache-hint from EVER being added to any Headers instance.
    // This resolves CORS preflight failure on spclient.spotify.com/connect-state/v1/cluster
    try {
      const origHeadersSet = Headers.prototype.set;
      Headers.prototype.set = function(name: string, value: string) {
        if (name && name.toLowerCase() === 'x-cache-hint') return;
        return origHeadersSet.call(this, name, value);
      };
      const origHeadersAppend = Headers.prototype.append;
      Headers.prototype.append = function(name: string, value: string) {
        if (name && name.toLowerCase() === 'x-cache-hint') return;
        return origHeadersAppend.call(this, name, value);
      };
    } catch (_) {}

    // ── Layer 1: JSON.parse premium spoofing ──────────────────────────
    const originalParse = JSON.parse;
    JSON.parse = function(text: string, reviver?: any) {
      try {
        const data = reviver ? originalParse(text, reviver) : originalParse(text);
        return spoofPremium(data);
      } catch (e) {
        try { return originalParse(text); } catch (_) { return null; }
      }
    };

    // ── Layer 2a: Fetch interception ──────────────────────────────────
    const originalFetch = window.fetch;
    window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
      let reqInput = input;
      let reqInit = init;

      const url = typeof reqInput === 'string' ? reqInput
        : (reqInput instanceof URL ? reqInput.toString() : (reqInput as Request).url);

      if (isAdUrl(url)) {
        return makeSafeResponse(url);
      }

      // Strip x-cache-hint header from Request object or RequestInit to prevent CORS preflight failure
      try {
        if (reqInput instanceof Request) {
          if (reqInput.headers.has('x-cache-hint') || reqInput.headers.has('X-Cache-Hint')) {
            const cleanHeaders = new Headers(reqInput.headers);
            cleanHeaders.delete('x-cache-hint');
            cleanHeaders.delete('X-Cache-Hint');
            reqInput = new Request(reqInput, { headers: cleanHeaders });
          }
        }
        if (reqInit && reqInit.headers) {
          if (reqInit.headers instanceof Headers) {
            reqInit.headers.delete('x-cache-hint');
            reqInit.headers.delete('X-Cache-Hint');
          } else if (Array.isArray(reqInit.headers)) {
            reqInit.headers = reqInit.headers.filter(([k]) => k.toLowerCase() !== 'x-cache-hint');
          } else if (typeof reqInit.headers === 'object') {
            delete (reqInit.headers as any)['x-cache-hint'];
            delete (reqInit.headers as any)['X-Cache-Hint'];
          }
        }
      } catch (_) {}

      return originalFetch.call(this, reqInput, reqInit);
    };

    // ── Layer 2b: XHR interception ────────────────────────────────────
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    const originalXHRSetHeader = XMLHttpRequest.prototype.setRequestHeader;

    XMLHttpRequest.prototype.setRequestHeader = function(header: string, _value: string) {
      if (header && header.toLowerCase() === 'x-cache-hint') {
        return;
      }
      return originalXHRSetHeader.apply(this, arguments as any);
    };

    XMLHttpRequest.prototype.open = function(_method: string, url: string | URL) {
      const urlString = url.toString();
      if (isAdUrl(urlString)) {
        // @ts-ignore
        this.__blocked = true;
      }
      return originalXHROpen.apply(this, arguments as any);
    };

    // ── Layer 2c: Worker & sendBeacon interception ────────────────────
    const originalSendBeacon = navigator.sendBeacon;
    if (originalSendBeacon) {
      navigator.sendBeacon = function(url: string | URL, _data?: BodyInit | null) {
        if (isAdUrl(url.toString())) return true;
        return originalSendBeacon.apply(this, arguments as any);
      };
    }

    const originalWorker = window.Worker;
    if (originalWorker) {
      // @ts-ignore
      window.Worker = function(scriptURL: string | URL, options?: WorkerOptions) {
        const workerUrl = scriptURL.toString();
        // Skip blob wrapping for data/blob URLs or cross-origin workers
        if (workerUrl.startsWith('data:') || workerUrl.startsWith('blob:')) {
          return new originalWorker(scriptURL, options);
        }
        try {
          const patchScript = `
            (function() {
              var origFetch = self.fetch;
              if (origFetch) {
                self.fetch = function(input, init) {
                  var reqInput = input;
                  var reqInit = init;
                  try {
                    if (reqInput instanceof Request) {
                      if (reqInput.headers.has('x-cache-hint') || reqInput.headers.has('X-Cache-Hint')) {
                        var cleanHeaders = new Headers(reqInput.headers);
                        cleanHeaders.delete('x-cache-hint');
                        cleanHeaders.delete('X-Cache-Hint');
                        reqInput = new Request(reqInput, { headers: cleanHeaders });
                      }
                    }
                    if (reqInit && reqInit.headers) {
                      if (reqInit.headers instanceof Headers) {
                        reqInit.headers.delete('x-cache-hint');
                        reqInit.headers.delete('X-Cache-Hint');
                      } else if (Array.isArray(reqInit.headers)) {
                        reqInit.headers = reqInit.headers.filter(function(pair) { return pair[0].toLowerCase() !== 'x-cache-hint'; });
                      } else if (typeof reqInit.headers === 'object') {
                        delete reqInit.headers['x-cache-hint'];
                        delete reqInit.headers['X-Cache-Hint'];
                      }
                    }
                  } catch(e) {}
                  return origFetch.call(this, reqInput, reqInit);
                };
              }
            })();
            importScripts('${workerUrl}');
          `;
          const blob = new Blob([patchScript], { type: 'application/javascript' });
          const blobUrl = URL.createObjectURL(blob);
          return new originalWorker(blobUrl, options);
        } catch (_) {
          return new originalWorker(scriptURL, options);
        }
      };
      window.Worker.prototype = originalWorker.prototype;
    }

    XMLHttpRequest.prototype.send = function() {
      // @ts-ignore
      if (this.__blocked) {
        // Asynchronously dispatch states to mirror real-browser network requests
        // and prevent synchronous dispatch callstack crashes.
        setTimeout(() => {
          try { Object.defineProperty(this, 'readyState', { get: () => 4, configurable: true }); } catch (_) {}
          try { Object.defineProperty(this, 'status', { get: () => 200, configurable: true }); } catch (_) {}
          try { Object.defineProperty(this, 'statusText', { get: () => 'OK', configurable: true }); } catch (_) {}
          try { Object.defineProperty(this, 'responseText', { get: () => '{}', configurable: true }); } catch (_) {}
          try { Object.defineProperty(this, 'response', { get: () => '{}', configurable: true }); } catch (_) {}
          try { this.dispatchEvent(new Event('readystatechange')); } catch (_) {}
          try { this.dispatchEvent(new Event('load')); } catch (_) {}
          try { this.dispatchEvent(new Event('loadend')); } catch (_) {}
          try { if (typeof (this as any).onreadystatechange === 'function') (this as any).onreadystatechange(); } catch (_) {}
          try { if (typeof (this as any).onload === 'function') (this as any).onload(); } catch (_) {}
        }, 10);
        return;
      }
      return originalXHRSend.apply(this, arguments as any);
    };

    // ── Layer 3: DOM ad purger ────────────────────────────────────────
    initDomAdPurger();

    // ── Layer 4: Audio ad auto-mute + auto-skip ───────────────────────
    initAudioAdGuard();

    console.log('SpotiLIE: Nuclear adblock v4 initialized (DOM + Network + JSON + Audio)');
  } catch (e) {
    console.error('SpotiLIE: Failed to initialize adblock', e);
  }
}

/**
 * Layer 3: DOM Ad Purger
 *
 * Watches for and removes ad elements that Spotify injects dynamically
 * via React re-renders. Runs via MutationObserver + interval.
 */
function initDomAdPurger() {
  const AD_DOM_SELECTORS = [
    '[data-testid="ad-indicator"]',
    '[data-testid="ad-sponsor-container"]',
    '[data-testid="advertisement"]',
    '.Root__ads-container',
    '.nav-bar-ad-item',
    '.desktop-media-picker-ads',
    '[class*="ad-slot"]',
    '[class*="adSlot"]',
    '[class*="AdSlot"]',
    'iframe[src*="doubleclick"]',
    'iframe[src*="googlesyndication"]',
    'div[id*="google_ads"]',
    'div[class*="video-ad"]',
    'div[class*="videoAd"]',
  ];

  const purge = () => {
    for (const sel of AD_DOM_SELECTORS) {
      try {
        document.querySelectorAll(sel).forEach(el => el.remove());
      } catch (_) {}
    }
  };

  purge();
  setInterval(purge, 500);

  // MutationObserver for instant removal when Spotify injects ads via React
  const attachObserver = () => {
    const obs = new MutationObserver(purge);
    obs.observe(document.body, { childList: true, subtree: true });
  };

  if (document.body) {
    attachObserver();
  } else {
    document.addEventListener('DOMContentLoaded', attachObserver, { once: true });
  }
}

/**
 * Layer 4: Audio ad auto-mute and auto-skip.
 *
 * Detection:
 * 1. Document title shows "Advertisement" or similar
 * 2. Ad indicator elements appear in the DOM
 * 3. The now-playing info matches ad patterns
 * 4. Track link explicitly points to /ad/
 *
 * Response: Mute → click skip (next) → retry aggressively → unmute after.
 */
function initAudioAdGuard() {
  let adActive = false;
  let skipAttempts = 0;
  let skipTimer: ReturnType<typeof setInterval> | null = null;

  const AD_TITLE_PATTERNS = [
    /^advertisement/i,
    /^ad\s*[-–—]/i,
    /sponsored/i,
  ];

  const isAdPlaying = (): boolean => {
    // Check 1: Document title
    const title = (document.title || '').trim();
    if (AD_TITLE_PATTERNS.some(p => p.test(title))) return true;

    // Check 2: Ad indicator elements in DOM
    if (document.querySelector('[data-testid="ad-indicator"]')) return true;
    if (document.querySelector('[data-testid="ad-sponsor-container"]')) return true;

    // Check 3: Now-playing widget text
    const nowPlayingTitle = document.querySelector(
      '[data-testid="context-item-info-title"], [data-testid="now-playing-widget"] [data-testid="context-item-link"]'
    );
    if (nowPlayingTitle) {
      const text = (nowPlayingTitle.textContent || '').toLowerCase().trim();
      if (text === 'advertisement' || text.startsWith('advertisement')) return true;
    }

    // Check 4: Any visible ad overlay
    const adOverlay = document.querySelector('.Root__ads-container, [class*="ad-overlay"], [class*="video-ad"]');
    if (adOverlay && (adOverlay as HTMLElement).offsetParent !== null) return true;

    // Check 5: Track link explicitly pointing to /ad/ or /advertisement/
    const trackLink = document.querySelector('[data-testid="context-item-link"]');
    if (trackLink) {
      const href = trackLink.getAttribute('href') || '';
      if (href.startsWith('/ad/') || href.includes('advertisement')) return true;
    }

    return false;
  };

  const muteAllAudio = () => {
    document.querySelectorAll('audio, video').forEach(el => {
      (el as HTMLMediaElement).muted = true;
      try { (el as HTMLMediaElement).volume = 0; } catch (_) {}
    });
  };

  const unmuteAllAudio = () => {
    document.querySelectorAll('audio, video').forEach(el => {
      (el as HTMLMediaElement).muted = false;
      try { (el as HTMLMediaElement).volume = 1; } catch (_) {}
    });
  };

  const trySkipAd = (): boolean => {
    const skipSelectors = [
      'button[data-testid="control-button-skip-forward"]',
      'button[aria-label="Next"]',
      'button[aria-label="Skip"]',
      'button[aria-label="Skip ad"]',
      '[data-testid="skip-ad-button"]',
    ];
    for (const sel of skipSelectors) {
      const btn = document.querySelector(sel) as HTMLElement;
      if (btn && !btn.hasAttribute('disabled')) {
        btn.click();
        console.log('SpotiLIE: Auto-skipped audio ad via', sel);
        return true;
      }
    }
    return false;
  };

  const startAggressiveSkip = () => {
    if (skipTimer) return; // already running
    skipAttempts = 0;
    skipTimer = setInterval(() => {
      if (!adActive) {
        clearInterval(skipTimer!);
        skipTimer = null;
        return;
      }
      muteAllAudio();
      trySkipAd();
      skipAttempts++;
      if (skipAttempts > 60) {
        clearInterval(skipTimer!);
        skipTimer = null;
      }
    }, 100);
  };

  /** Core ad-detected handler — mute instantly, then attack skip button */
  const onAdDetected = () => {
    if (adActive) return;
    adActive = true;
    console.log('SpotiLIE: Audio ad detected — muting and attacking skip button');
    muteAllAudio();

    // Fire rapid skip attempts — ad skip button often appears 100-600ms after ad start
    if (!trySkipAd()) {
      [50, 150, 300, 500, 800, 1200, 2000, 3000].forEach(t =>
        setTimeout(trySkipAd, t)
      );
    }
    startAggressiveSkip();
  };

  const onAdEnded = () => {
    if (!adActive) return;
    adActive = false;
    if (skipTimer) { clearInterval(skipTimer); skipTimer = null; }
    console.log('SpotiLIE: Audio ad ended — restoring audio');
    unmuteAllAudio();
  };

  const checkAdState = () => {
    if (isAdPlaying()) onAdDetected();
    else onAdEnded();
  };

  // ── Strategy 1: MutationObserver on document.title (fastest, fires on track change)
  const titleEl = document.querySelector('title');
  if (titleEl) {
    new MutationObserver(checkAdState).observe(titleEl, {
      subtree: true, characterData: true, childList: true
    });
  }

  // ── Strategy 2: MutationObserver on now-playing bar (catches ad-indicator DOM node)
  const attachNowPlayingObserver = () => {
    const bar = document.querySelector('[data-testid="now-playing-bar"]') ||
                document.querySelector('.Root__now-playing-bar');
    if (bar) {
      new MutationObserver(checkAdState).observe(bar, {
        subtree: true, childList: true, attributes: true
      });
    }
  };
  if (document.body) {
    attachNowPlayingObserver();
    new MutationObserver(() => attachNowPlayingObserver()).observe(document.body, { childList: true });
  }

  // ── Strategy 3: audio 'play' event — fires the instant a new track starts
  document.addEventListener('play', (e) => {
    if ((e.target as HTMLElement)?.tagName === 'AUDIO') {
      setTimeout(checkAdState, 50);   // check after brief delay so title updates
      setTimeout(checkAdState, 250);
    }
  }, true);

  // ── Strategy 4: Fast backup poll (500ms) — catches anything the above miss
  setInterval(checkAdState, 500);
}

