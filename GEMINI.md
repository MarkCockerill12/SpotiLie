# SpotiLIE Project Instructions

## Workflow & Deployment

- **Automatic Deployment:** Every code change or fix MUST be followed by a full build and deployment to the connected Android device.
- **Deployment Command:** Run `./build.ps1` to compile the APK, install via ADB, and launch the app.
- **Pre-requisite:** If `src/injector.js` or Rust code changes, you must run `cargo tauri build --target aarch64-linux-android` before running the build script to ensure the native library is updated.

## UI & Injection

- **Injector Logic:** The app uses `src/injector.ts` (compiled to `src/injector.js`) to modify the Spotify Web Player.
- **Mobile UI:** We force a Desktop User-Agent to unlock premium features but use injected CSS in `injector.ts` to make the UI mobile-friendly.
