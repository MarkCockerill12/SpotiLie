/**
 * SpotiLIE Background Script — Native Port Bridge (Bidirectional)
 *
 * Handles TWO data flows:
 *
 *  1. Native → Content (Media Controls):
 *     MainActivity ──port.postMessage──▶ background.js ──tabs.sendMessage──▶ injector.js
 *
 *  2. Content → Native (Metadata Updates):
 *     injector.js ──runtime.sendMessage──▶ background.js ──port.postMessage──▶ MainActivity
 */

const PORT_NAME = "spotilie-native-bridge";

let nativePort = null;

function connectToNative() {
  try {
    nativePort = browser.runtime.connectNative(PORT_NAME);
    console.log("[SpotiLIE BG] Native port connected");

    // ── Flow 1: Native → Content (play/pause/next/prev/set_nav_height) ──────
    nativePort.onMessage.addListener((msg) => {
      console.log("[SpotiLIE BG] Native message:", JSON.stringify(msg));
      if (!msg) return;

      if (msg.action) {
        // Query all tabs without URL filter restriction to ensure delivery in GeckoView
        browser.tabs.query({}).then((tabs) => {
          tabs.forEach((tab) => {
            if (tab.id != null) {
              browser.tabs.sendMessage(tab.id, { type: "MEDIA_ACTION", action: msg.action })
                .catch((e) => console.warn("[SpotiLIE BG] Tab message error:", e));
            }
          });
        }).catch((e) => console.error("[SpotiLIE BG] Query tabs error:", e));
      }

      if (msg.type === "SET_NAV_HEIGHT") {
        browser.tabs.query({}).then((tabs) => {
          tabs.forEach((tab) => {
            if (tab.id != null) {
              browser.tabs.sendMessage(tab.id, { type: "SET_NAV_HEIGHT", height: msg.height })
                .catch(() => {});
            }
          });
        });
      }
    });

    nativePort.onDisconnect.addListener(() => {
      console.log("[SpotiLIE BG] Native port disconnected — reconnecting in 2s");
      nativePort = null;
      setTimeout(connectToNative, 2000);
    });

  } catch (e) {
    console.error("[SpotiLIE BG] connectToNative failed:", e);
    setTimeout(connectToNative, 3000);
  }
}

// ── Flow 2: Content → Native (metadata: title, artist, isPlaying) ────────────
browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === "UPDATE_METADATA") {
    if (nativePort) {
      try {
        nativePort.postMessage({
          type: "UPDATE_METADATA",
          title: msg.title || "",
          artist: msg.artist || "",
          isPlaying: !!msg.isPlaying,
        });
      } catch (e) {
        console.warn("[SpotiLIE BG] Failed to post metadata to native:", e);
      }
    }
  }
});

connectToNative();
