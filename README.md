# SpotiLIE

An Android app that runs Spotify's **desktop** web player inside GeckoView and reshapes it
into a phone UI: on-demand playback, unlimited skips, the full queue, lyrics and Spotify
Connect, with ad handling, a real media notification, and background playback.

> Personal project. It uses your own Spotify account through Spotify's own web player;
> it does not download, redistribute or unlock any content.

## Features

- **Mobile UI over the desktop player** — bottom navigation, a compact mini player that
  expands into a full-screen player with high-resolution artwork, and a **Library** tab that
  shows your whole library (playlists, artists, albums, podcasts) with filters, search and sort.
- **Ads**
  - Audio ad creatives are detected the instant they load, muted, and allowed to finish
    (long ones are fast-forwarded), so an ad break is a couple of seconds of silence.
  - Spotify's own ad endpoints are neutralised at the network layer; third-party ad and
    tracking networks are blocked.
  - **uBlock Origin** is installed into the app's browser engine automatically (from
    addons.mozilla.org) and kept up to date.
- **Media notification & background playback** — lock-screen and notification controls
  (play/pause, next, previous, seek) with artwork; keeps playing when you switch apps or
  turn the screen off; pauses when headphones or a Bluetooth audio device disconnect.
- **Self-healing** — recovers automatically if the browser engine's process crashes or is
  killed, reloads a page that failed to boot on a bad connection, nudges or reloads playback
  that has stalled, and leaves the offline screen as soon as the network is back.
- **Custom icon** — adaptive launcher icon with a themed (Android 13+) variant.

## Download

Grab the latest APK from **[Releases](https://github.com/MarkCockerill12/SpotiLie/releases/latest)**.
Most phones want the `arm64-v8a` build; the `universal` build works on every supported
device. Requires Android 8.0+.

## How it works

```
MainActivity (Kotlin)            GeckoView ──▶ open.spotify.com (desktop web player)
   │  crash/offline recovery          │
   │  WebExtension port               ├── background.js  webRequest ad rules, native bridge
   │  spotilie_native_bridge          ├── index.js       content script: UI, ad guard, sync, watchdogs
   │                                  └── page.js        page world: media elements, navigation hooks
   ▼
PlaybackService ──▶ media3 MediaSession ──▶ notification / lock screen / Bluetooth / Android Auto
```

- **GeckoView, not Android WebView.** Chromium WebView revokes the Widevine DRM session,
  which stops playback. Gecko keeps it.
- **Desktop Firefox user agent.** The engine really is Gecko, so this is honest, and Spotify
  serves desktop Firefox the full player.
- **Two injected bundles.** Firefox isolates content scripts from the page, so anything that
  must touch Spotify's own objects (its media element, `history.pushState`) runs in a
  separate page-world script.

## Project layout

```
android/                      Gradle app (Kotlin, GeckoView, media3)
  app/src/main/
    java/com/spotilie/app/
      MainActivity.kt           GeckoView host, extension bridge, UA handling, recovery, uBO install
      PlaybackService.kt        media3 MediaSessionService (notification, foreground service)
      WebPlayer.kt              SimpleBasePlayer facade over the web player
    assets/
      offline.html              Offline screen with automatic retry
      spotilie-ext/             Built-in WebExtension (manifest + background.js;
                                index.js / page.js are build output)
    res/                        Adaptive icon, notification icon, theme
src/injector/                 TypeScript injected into Spotify
  index.ts                      Content-script entry
  page.ts                       Page-world entry: media element registry, ad handling, transport
  adblock.ts                    DOM ad purge and audio-ad guard
  desktop.ts                    Device class, Widevine retry, consent stubs
  ui.ts                         Mobile CSS, bottom nav, mini/full player, Library overlay
  player.ts                     Transport bridge, metadata sync, boot and stall watchdogs
  shared.ts                     Cross-world channel and helpers
  probe.ts                      Debug-only DOM dump
build.ps1                     Build, install, launch
```

## Build

Requirements: [Bun](https://bun.sh), the Android SDK (`ANDROID_HOME` or `adb` on `PATH`),
JDK 17, and an arm64 Android 8.0+ device connected over `adb`.

```powershell
bun install
.\build.ps1              # build the injector + APK, install, launch
.\build.ps1 -Debug       # also enable diagnostics (verbose logging, network verdicts,
                         # and an adb broadcast that evaluates JS in the page)
.\build.ps1 -Release     # R8-minified release APK (unsigned)
.\build.ps1 -Logs        # tail logcat after launching
```

On first launch the app asks for notification permission (needed for the media
notification) and battery-optimisation exemption (recommended for background playback).
