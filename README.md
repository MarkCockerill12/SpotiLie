# SpotiLIE

**SpotiLIE** is a custom Android web application built with [Tauri v2](https://v2.tauri.app/) and Mozilla's [GeckoView](https://wiki.mozilla.org/Mobile/GeckoView) engine. It wraps the desktop web player interface in a dedicated native Android container, optimizing the layout for mobile screens and integrating deep system media controls.

---

## 📱 Features

- **GeckoView Engine Integration:** Powered by Mozilla GeckoView (Firefox v129) for full EME/Widevine audio playback support on Android.
- **Native System Controls:** Full Android `MediaSessionCompat` integration providing lockscreen and notification media controls (Play, Pause, Skip, Track Metadata, Album Art).
- **Hardware & Device Guard:** Automatic audio auto-pause upon Bluetooth or wired headphone disconnection (`ACTION_AUDIO_BECOMING_NOISY`).
- **Responsive Mobile Interface:** Injector script transforms desktop web navigation elements into a single-column, touch-friendly mobile layout with custom navigation controls.
- **Background Playback & Reliability:** Dedicated Android Foreground Service ensuring continuous background audio execution and automatic network connection recovery.

---

## 🛠️ Tech Stack

- **Frontend Core:** TypeScript (`src/injector/`), bundled via Bun
- **Native Android Layer:** Kotlin (`MainActivity.kt`, `MediaForegroundService.kt`)
- **App Wrapper Framework:** Tauri 2.0 (Rust backend)
- **Browser Engine:** Mozilla GeckoView (aarch64)

---

## 🚀 Building & Running

### Prerequisites
- [Rust](https://www.rust-lang.org/) (`aarch64-linux-android` target installed)
- [Android Studio / SDK & NDK](https://developer.android.com/studio) (NDK 27+)
- [Bun](https://bun.sh/) or Node.js
- Connected Android device with ADB debugging enabled

### Build Command
Run the build script to compile native components, package the APK, and install directly via ADB:

```powershell
./build.ps1
```

For injector-only iteration (skipping Rust compilation):
```powershell
./build.ps1 -JSOnly
```

---

## 📄 License
MIT License
