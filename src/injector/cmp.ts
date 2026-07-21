/**
 * SpotiLIE Consent Management Platform (CMP) & Error Guard Module
 *
 * Spotify's web-player.js communicates with IAB TCF CMP (Consent Management Platform).
 * When ad-blocking or DOM restructuring hides CMP iframes, web-player.js attempts
 * to access window.frames['__cmpLocator'].__cmpCall on null/undefined elements, throwing:
 * "Uncaught TypeError: Cannot read properties of null (reading '__cmpCall')"
 * which crashes Spotify's web player initialization script at startup.
 *
 * This module creates the IAB TCF locator iframes (__cmpLocator & __tcfapiLocator)
 * and stubs __cmp, __tcfapi, and __cmpCall to allow web-player.js to initialize cleanly.
 */

export function initCMPStub() {
  try {
    const fakeCmpWindow: any = {
      __cmpCall: function() {},
      __tcfapiCall: function() {},
      postMessage: function(msg: any) {
        try {
          if (msg && typeof msg === 'object' && msg.__cmpCall) {
            const call = msg.__cmpCall;
            window.postMessage({
              __cmpReturn: {
                returnValue: { eventStatus: 'tcloaded', gdprApplies: false },
                success: true,
                callId: call ? call.callId : null
              }
            }, '*');
          }
        } catch (_) {}
      }
    };
    fakeCmpWindow.contentWindow = fakeCmpWindow;
    fakeCmpWindow.frames = fakeCmpWindow;
    fakeCmpWindow.__cmpLocator = fakeCmpWindow;
    fakeCmpWindow.__tcfapiLocator = fakeCmpWindow;

    // Safe fallback source for MessageEvents with null event.source (fixes otSDKStub.js / web-player.js null.__cmpCall crash)
    try {
      const origSourceDesc = Object.getOwnPropertyDescriptor(MessageEvent.prototype, 'source');
      if (origSourceDesc && origSourceDesc.get) {
        const origGet = origSourceDesc.get;
        Object.defineProperty(MessageEvent.prototype, 'source', {
          get: function() {
            const src = origGet.call(this);
            return src || fakeCmpWindow;
          },
          configurable: true
        });
      }
    } catch (_) {}

    // Fallback property access for __cmpCall and __tcfapiCall
    try {
      if (!('__cmpCall' in Object.prototype)) {
        Object.defineProperty(Object.prototype, '__cmpCall', {
          get: function() { return fakeCmpWindow.__cmpCall; },
          configurable: true
        });
      }
      if (!('__tcfapiCall' in Object.prototype)) {
        Object.defineProperty(Object.prototype, '__tcfapiCall', {
          get: function() { return fakeCmpWindow.__tcfapiCall; },
          configurable: true
        });
      }
    } catch (_) {}

    // Attach __cmpLocator and __tcfapiLocator getters directly to window, top, parent, globalThis
    const globals = [window, (window as any).top, (window as any).parent, globalThis];
    for (const g of globals) {
      if (!g) continue;
      try {
        g.__cmpLocator = fakeCmpWindow;
        g.__tcfapiLocator = fakeCmpWindow;
        g.__cmpCall = fakeCmpWindow.__cmpCall;
      } catch (_) {}
    }

    // Wrap window.addEventListener to catch and neutralize __cmpCall errors inside any message event listeners (e.g. otSDKStub.js)
    try {
      const origAddEventListener = window.addEventListener;
      window.addEventListener = function(type: string, listener: any, options?: any) {
        if (type === 'message' && typeof listener === 'function') {
          const wrappedListener: any = function(this: any, event: any) {
            try {
              if (event && typeof event === 'object' && 'source' in event) {
                try {
                  Object.defineProperty(event, 'source', { get: () => fakeCmpWindow, configurable: true });
                } catch (_) {}
              }
              return listener.apply(this, arguments as any);
            } catch (err: any) {
              if (err && err.message && (err.message.includes('__cmpCall') || err.message.includes('__cmp'))) {
                console.warn('SpotiLIE: Suppressed CMP error in message listener:', err.message);
                return;
              }
              throw err;
            }
          };
          return origAddEventListener.call(this, type, wrappedListener, options);
        }
        return origAddEventListener.call(this, type, listener, options);
      };
    } catch (_) {}

    // Suppress unhandled rejections and error events for CMP
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason?.message || String(event.reason || '');
      if (reason.includes('__cmpCall') || reason.includes('__cmp')) {
        event.preventDefault();
      }
    }, true);

    // Legacy __cmp stub
    if (!(window as any).__cmp) {
      const cmpStub: any = function() {
        const args = Array.from(arguments);
        if (typeof args[2] === 'function') {
          try { args[2]({ eventStatus: 'tcloaded', gdprApplies: false }, true); } catch (_) {}
        }
      };
      cmpStub.a = [];
      (window as any).__cmp = cmpStub;
    }

    // TCF v2 __tcfapi stub
    if (!(window as any).__tcfapi) {
      const tcfStub: any = function(_cmd: string, _version: number, callback: any) {
        if (typeof callback === 'function') {
          try {
            callback({
              eventStatus: 'tcloaded',
              gdprApplies: false,
              tcString: 'CP1234567890',
              listenerId: 1
            }, true);
          } catch (_) {}
        }
      };
      tcfStub.a = [];
      (window as any).__tcfapi = tcfStub;
    }

    // Ensure locator iframes exist in DOM synchronously
    const ensureLocatorIframe = (name: string) => {
      try {
        let frame = document.querySelector(`iframe[name="${name}"]`) as HTMLIFrameElement;
        if (!frame) {
          frame = document.createElement('iframe');
          frame.name = name;
          frame.id = name;
          frame.style.display = 'none';
          const targetNode = document.body || document.documentElement || document.head;
          if (targetNode) targetNode.appendChild(frame);
        }
        if (frame && frame.contentWindow) {
          try {
            (frame.contentWindow as any).__cmpCall = fakeCmpWindow.__cmpCall;
            (frame.contentWindow as any).__tcfapiCall = fakeCmpWindow.__tcfapiCall;
          } catch (_) {}
        }
      } catch (_) {}
    };

    ensureLocatorIframe('__cmpLocator');
    ensureLocatorIframe('__tcfapiLocator');
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        ensureLocatorIframe('__cmpLocator');
        ensureLocatorIframe('__tcfapiLocator');
      });
    }

    // Intercept window postMessage for __cmpCall
    window.addEventListener('message', (event) => {
      try {
        if (event.data && typeof event.data === 'object' && event.data.__cmpCall) {
          const call = event.data.__cmpCall;
          if (event.source && typeof (event.source as any).postMessage === 'function') {
            (event.source as any).postMessage({
              __cmpReturn: {
                returnValue: { eventStatus: 'tcloaded', gdprApplies: false },
                success: true,
                callId: call ? call.callId : null
              }
            }, '*');
          }
        }
      } catch (_) {}
    }, true);

    // Global error listener to prevent uncaught CMP errors from crashing React
    window.addEventListener('error', (event) => {
      if (event.message && (event.message.includes('__cmpCall') || event.message.includes('__cmp'))) {
        console.warn('SpotiLIE: Suppressed CMP TypeError:', event.message);
        event.stopImmediatePropagation();
        event.preventDefault();
      }
    }, true);

    console.log('SpotiLIE: CMP stub & locator iframes initialized');
  } catch (e) {
    console.error('SpotiLIE: Failed to initialize CMP stub', e);
  }
}
