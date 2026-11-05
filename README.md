# SpotiLIE

An Android app that runs Spotify's **desktop** web player inside GeckoView and reshapes it
into a phone UI: on-demand playback, unlimited skips, the full queue, lyrics and Spotify
Connect, with ad handling, a real media notification, and background playback.

> Personal project. It uses your own Spotify account through Spotify's own web player;
> it does not download, redistribute or unlock any content.

## Features

- **Native player** — a real Android mini player and full-screen player (artwork-tinted
  background, seek bar, swipe down to close) that keep working while the page loads or
  reloads. Shuffle and Smart Shuffle, repeat / repeat-one, and Spotify's **+ / ✓** save button.
- **Spotify's full song menu, natively** — the ⋯ button shows Spotify's own menu for the
  current song: add to a playlist (with search and *New playlist*), **remove from a playlist**,
  Liked Songs, add to queue, song radio, go to artist / album, credits, and share (Android
  share sheet with the song link). Every option runs Spotify's own logic, so it syncs to your
  account exactly as it would on the website.
- **Mobile UI over the desktop player** — bottom navigation and a **Library** tab that shows
  your whole library (playlists, artists, albums, podcasts) with filters, search and sort.
- **Ads**
  - Audio ad creatives are detected the instant they load, muted, and allowed to finish
    (long ones are fast-forwarded), so an ad break is a couple of seconds of silence.
  - Spotify's own ad endpoints are neutralised at the network layer; third-party ad and
    tracking networks are blocked.
  - **uBlock Origin** is installed into the app's browser engine automatically (from
    addons.mozilla.org) and kept up to date.
- **Media notification & background playback** — lock-screen and notification controls
  (play/pause, next, previous, seek, shuffle, repeat, save) with artwork; keeps playing when you
  switch apps or turn the screen off (wake and Wi-Fi locks while playing); pauses when
  headphones or a Bluetooth audio device disconnect. Play from your earbuds or lock screen
  works even when the app isn't running: it starts in the background and carries on where
  you left off.
- **Self-healing** — if Android kills the player mid-song it rebuilds and resumes at the same
  spot; if it's killed while paused in the background it waits until you come back (no reload
  loops under memory pressure); reloads a page that failed to boot on a bad connection, nudges
  or reloads playback that has stalled, and leaves the offline screen when the network is back.
- **Light on memory** — one browser content process, no spare processes, capped caches, and
  Spotify's background "Canvas" videos are never played.
- **Custom icon** — adaptive launcher icon with a themed (Android 13+) variant.

## Download

Grab the latest APK from **[Releases](https://github.com/MarkCockerill12/SpotiLie/releases/latest)**.
Most phones want the `arm64-v8a` build; the `universal` build works on every supported
device. Requires Android 8.0+.

## How it works

```
MainActivity ── GeckoView (attach / detach only)        NowPlayingUi + MenuSheet (native player)
                     │                                          │ MediaController
PlayerHost (app-scoped) ── GeckoSession ──▶ open.spotify.com    ▼
   │  recovery, auto-resume, reloads   ├── background.js  ad rules, native bridge
   │  WebExtension port                ├── index.js       content script: UI, ad guard, sync, watchdogs
   │                                   └── page.js        page world: media, Spotify's controls & menus
   ▼
PlaybackService ──▶ media3 MediaSession ──▶ notification / lock screen / Bluetooth / Android Auto
```

- **GeckoView, not Android WebView.** Chromium WebView revokes the Widevine DRM session,
  which stops playback. Gecko keeps it.
- **Desktop Firefox user agent.** The engine really is Gecko, so this is honest, and Spotify
  serves desktop Firefox the full player.
- **Two injected bundles.** Firefox isolates content scripts from the page, so anything that
  must touch Spotify's own objects (its media element, `history.pushState`, its buttons and
  menus) runs in a separate page-world script.
- **The player outlives the screen.** `PlayerHost` owns the browser session for the whole app,
  so the media service can start or rebuild the player without any UI, and the screen just
  attaches to it.
- **Spotify's own controls.** Shuffle, repeat, likes and every menu option are driven through
  Spotify's real buttons, menus and shortcuts rather than reimplemented.

## Project layout

```
android/                      Gradle app (Kotlin, GeckoView, media3)
  app/src/main/
    java/com/spotilie/app/
      MainActivity.kt           The screen: window, permissions, back handling
      PlayerHost.kt             App-scoped web player: session, bridge, recovery, auto-resume
      Engine.kt                 GeckoRuntime settings, engine prefs, uBlock Origin
      PlaybackService.kt        media3 MediaSessionService (notification, locks, save button)
      WebPlayer.kt              SimpleBasePlayer facade over the web player
      PlayerStateStore.kt       Last track / position, survives process death
      NowPlayingUi.kt           Native mini + full-screen player (MediaController)
      MenuSheet.kt              Spotify's song menu, shown natively
    assets/
      offline.html              Offline screen with automatic retry
      geckoview-config.yaml     Engine prefs (process count, caches)
      spotilie-ext/             Built-in WebExtension (manifest + background.js;
                                index.js / page.js are build output)
    res/                        Adaptive icon, notification icon, theme
src/injector/                 TypeScript injected into Spotify
  index.ts                      Content-script entry
  page.ts                       Page-world entry: media element registry, ad handling, transport
  controls.ts                   Page world: shuffle, repeat, save / like
  menu.ts                       Page world: Spotify's song menu, playlist removal, share links
  pagekit.ts                    Page-world helpers
  adblock.ts                    DOM ad purge and audio-ad guard
  desktop.ts                    Device class, Widevine retry, consent stubs
  ui.ts                         Mobile CSS, bottom nav, Library overlay
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
.\build.ps1 -Release     # R8-minified release APKs per ABI (signed if android/keystore.properties exists)
.\build.ps1 -Logs        # tail logcat after launching
```

On first launch the app asks for notification permission (needed for the media
notification) and battery-optimisation exemption (recommended for background playback).
