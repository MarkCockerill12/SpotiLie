/**
 * SpotiLIE background script.
 *
 * Two jobs:
 *
 * 1. Network ad filtering via `webRequest`. This runs inside Gecko's network
 *    stack, before any page script executes, so it catches media, beacon,
 *    worker and service-worker traffic that a patched `window.fetch` never sees
 *    — and page code cannot capture an original reference to bypass it.
 *
 * 2. The native port bridge to MainActivity (metadata up, transport down).
 *
 * Blocking strategy, and why it differs per target:
 *
 *   Third-party ad networks  → cancel outright. Nothing on Spotify depends on
 *                              them, so a network error is harmless.
 *   Spotify's own ad paths   → let the request complete but overwrite the body
 *                              with `{}` via filterResponseData. The response
 *                              keeps its real 200 status and CORS headers.
 *                              Spotify treats a hard failure on its own origin
 *                              as a fatal player error and drops into an
 *                              infinite "Playback Paused" loop, so we must
 *                              never cancel or error these.
 *
 * General-purpose ad and tracker blocking is uBlock Origin's job — MainActivity
 * installs it into the same Gecko runtime. This file only carries the
 * Spotify-specific rules uBO doesn't know about.
 */

const PORT_NAME = "spotilie_native_bridge";

/** Set by MainActivity on connect (debug builds only). Gates all verdict reporting. */
let debug = false;

// ── Spotify-owned ad endpoints: neutralise the body, keep the 200 ────────────
const SPOTIFY_AD_PATTERNS = [
  "/ad-logic/",
  "/ads/",
  "/ad-service/",
  "/commercial/",
  "/adbreak",
  "/sponsored",
  "audio-ads.spotify.com",
  "adeventtracker.spotify.com",
  "ads-fa.spotify.com",
  "adgen.spotify.com",
  "ad-proxy.spotify.com",
  "adstudio.spotify.com",
  "ads.spotify.com",
  "pixel.spotify.com",
  "video-ak.cdn.spotify.com",
  "adjust-callback.spotify.com",
  "crashdump.spotify.com",
  "datasharing.spotify.com",
];

// ── Third-party ad/tracking networks: cancel ─────────────────────────────────
const THIRD_PARTY_AD_HOSTS = [
  "doubleclick.net",
  "googleadservices.com",
  "googletagservices.com",
  "googlesyndication.com",
  "google-analytics.com",
  "moatads.com",
  "comscore.com",
  "scorecardresearch.com",
  "branch.io",
  "app.link",
  "connect.facebook.net",
  "facebook.com/tr",
  "admob.com",
  "adsrvr.org",
  "adnxs.com",
  "casalemedia.com",
  "criteo.com",
  "rubiconproject.com",
  "openx.net",
  "pubmatic.com",
  "freewheel.tv",
  "spotxchange.com",
  "liveramp.com",
  "rlcdn.com",
  "taboola.com",
  "outbrain.com",
  "smartadserver.com",
  "contextweb.com",
  "lijit.com",
  "tremorhub.com",
  "yieldmo.com",
  "sharethrough.com",
];

/**
 * Infrastructure that must never be touched. Blocking any of these kills
 * playback outright — they carry the websocket, session, streaming and CDN
 * traffic the player is built on.
 */
const NEVER_BLOCK = [
  "dealer.spotify.com",
  "apresolve.spotify.com",
  "spclient.spotify.com",
  "gew4-dealer.spotify.com",
  "wg.spotify.com",
  "api.spotify.com",
  "api-partner.spotify.com",
  "exp.spotify.com",
  "log.spotify.com",
  "analytics.spotify.com",
  "gslb.spotify.com",
  "open.spotify.com",
  "accounts.spotify.com",
  "scdn.co",
  "pscdn.co",
  "audio4-gm-fb.spotifycdn.com",
  "spotifycdn.com",
];

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const toRegex = (list) => new RegExp(list.map(escapeRe).join("|"), "i");

const SPOTIFY_AD_RE = toRegex(SPOTIFY_AD_PATTERNS);
const THIRD_PARTY_RE = toRegex(THIRD_PARTY_AD_HOSTS);
const NEVER_BLOCK_RE = toRegex(NEVER_BLOCK);

/**
 * Infrastructure hosts win over ad patterns. `api.spotify.com` is whitelisted
 * wholesale but `api.spotify.com/v1/ads` still needs neutralising, so the
 * explicit ad path check runs first.
 */
function classify(url) {
  if (SPOTIFY_AD_RE.test(url)) return "neutralise";
  if (NEVER_BLOCK_RE.test(url)) return "allow";
  if (THIRD_PARTY_RE.test(url)) return "cancel";
  return "allow";
}

const canFilter = typeof browser.webRequest.filterResponseData === "function";

function report(verdict, url) {
  if (!debug || !nativePort) return;
  try {
    nativePort.postMessage({ type: "DEBUG_NET", verdict, url: url.slice(0, 300) });
  } catch (_) {}
}

/** "facebook.com/tr" → "*://*.facebook.com/tr*"; "adnxs.com" → "*://*.adnxs.com/*". */
function toMatchPattern(entry) {
  const slash = entry.indexOf("/");
  const host = slash < 0 ? entry : entry.slice(0, slash);
  const path = slash < 0 ? "/*" : `${entry.slice(slash)}*`;
  return `*://*.${host}${path}`;
}

/**
 * Only URLs that can possibly be blocked reach the blocking listener.
 *
 * It used to be registered for <all_urls>, which put every audio segment and
 * every artwork image through a synchronous round trip to the extension
 * process — thousands of blocking IPC hops an hour on the hot playback path,
 * for requests that were always going to be allowed.
 */
const FILTER_URLS = ["*://*.spotify.com/*", ...THIRD_PARTY_AD_HOSTS.map(toMatchPattern)];

browser.webRequest.onBeforeRequest.addListener(
  (details) => {
    const verdict = classify(details.url);
    if (verdict !== "allow") report(verdict, details.url);

    if (verdict === "cancel") return { cancel: true };

    if (verdict === "neutralise" && canFilter) {
      try {
        const filter = browser.webRequest.filterResponseData(details.requestId);
        filter.ondata = () => {
          // Discard the ad payload entirely.
        };
        filter.onstop = () => {
          filter.write(new TextEncoder().encode("{}"));
          filter.close();
        };
        filter.onerror = () => {
          try { filter.close(); } catch (_) {}
        };
      } catch (_) {
        // If filtering fails, let the original response through rather than
        // risking a player-fatal error.
      }
    }
    return {};
  },
  { urls: FILTER_URLS },
  ["blocking"]
);

/** DEBUG: anything ad-shaped that slipped past `classify`, plus every plain media fetch. */
const AD_SHAPED = /\bads?\b|advert|commercial|sponsor|preroll|midroll|audio-ad/i;
let debugListenerAdded = false;

function enableDebug() {
  debug = true;
  if (debugListenerAdded) return;
  debugListenerAdded = true;
  browser.webRequest.onBeforeRequest.addListener(
    (details) => {
      if (details.type === "media") report(`MEDIA`, details.url);
      else if (classify(details.url) === "allow" && AD_SHAPED.test(details.url)) report("MISSED", details.url);
    },
    { urls: ["<all_urls>"] }
  );
}

/*
 * NOTE: do not add an onBeforeSendHeaders listener here.
 *
 * Returning a modified `requestHeaders` array makes Gecko treat the whole set
 * as author-specified, which pulls `user-agent` into the CORS preflight's
 * Access-Control-Request-Headers. Spotify's servers don't allow that header,
 * so every preflighted request fails — verified on device: track metadata,
 * playlists, artwork and the Widevine licence endpoint all broke at once.
 */

// ── Native port bridge ───────────────────────────────────────────────────────

let nativePort = null;

function broadcast(message) {
  browser.tabs.query({}).then((tabs) => {
    for (const tab of tabs) {
      if (tab.id != null) {
        browser.tabs.sendMessage(tab.id, message).catch(() => {});
      }
    }
  }).catch(() => {});
}

function connectToNative() {
  try {
    nativePort = browser.runtime.connectNative(PORT_NAME);

    // Native → content: transport actions, layout calibration, debug hooks.
    nativePort.onMessage.addListener((msg) => {
      if (!msg) return;
      if (msg.action) {
        broadcast({ type: "MEDIA_ACTION", action: msg.action, value: msg.value });
      }
      switch (msg.type) {
        case "SET_NAV_HEIGHT":
          broadcast({ type: "SET_NAV_HEIGHT", height: msg.height });
          break;
        case "CONFIG":
          if (msg.debug) enableDebug();
          break;
        case "DEBUG_EVAL":
        case "CLOSE_OVERLAY":
          broadcast(msg);
          break;
      }
    });

    nativePort.onDisconnect.addListener(() => {
      nativePort = null;
      setTimeout(connectToNative, 2000);
    });
  } catch (e) {
    console.error("[SpotiLIE] connectToNative failed:", e);
    setTimeout(connectToNative, 3000);
  }
}

/** Content → native message types that are relayed as-is. */
const PASSTHROUGH = new Set(["RELOAD", "OVERLAY", "DEBUG_DUMP", "DEBUG_NET", "PAGE_LOG"]);

browser.runtime.onMessage.addListener((msg) => {
  if (!msg || !nativePort) return;

  if (PASSTHROUGH.has(msg.type)) {
    try { nativePort.postMessage(msg); } catch (_) {}
    return;
  }

  if (msg.type !== "UPDATE_METADATA") return;
  try {
    nativePort.postMessage({
      ...msg,
      title: msg.title || "",
      artist: msg.artist || "",
      artwork: msg.artwork || "",
      isPlaying: !!msg.isPlaying,
      duration: msg.duration || 0,
      position: msg.position || 0,
    });
  } catch (_) {}
});

connectToNative();
