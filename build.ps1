# SpotiLIE Build & Deploy Script
# Bypasses Windows Symlink restrictions and deploys directly to Android.

$adb = "C:/Users/Mark/AppData/Local/Android/Sdk/platform-tools/adb.exe"

Write-Host "--- 1. Building Frontend & Injector ---" -ForegroundColor Cyan
# Ensure injector.js is updated from injector.ts
& bun run tsc src/injector.ts --outFile src/injector.js --target ES2020 --lib ES2020,DOM --skipLibCheck
# Build the React/Vite frontend
& bun run build

Write-Host "--- 1.1 Syncing Injector to Assets ---" -ForegroundColor Cyan
$assetsDir = "src-tauri/gen/android/app/src/main/assets"
if (!(Test-Path $assetsDir)) { New-Item -ItemType Directory -Path $assetsDir -Force }
Copy-Item -Path "src/injector.js" -Destination "$assetsDir/injector.js" -Force
Write-Host "Injector copied to assets." -ForegroundColor Green

Write-Host "--- 2. Syncing Rust Library (Symlink Workaround) ---" -ForegroundColor Cyan
# NOTE: If you changed Rust code or the Injector, run:
# cargo tauri build --target aarch64-linux-android
# before running this script if you want those changes included.

New-Item -ItemType Directory -Force -Path "src-tauri/gen/android/app/src/main/jniLibs/arm64-v8a"
$source = "src-tauri/target/aarch64-linux-android/debug/libtauri_app_lib.so"
$dest = "src-tauri/gen/android/app/src/main/jniLibs/arm64-v8a/libtauri_app_lib.so"

if (Test-Path $source) {
    Copy-Item -Path $source -Destination $dest -Force
    Write-Host "Library copied successfully." -ForegroundColor Green
} else {
    Write-Host "Warning: Rust library not found. Run 'cargo tauri build --target aarch64-linux-android' first." -ForegroundColor Yellow
}

Write-Host "--- 3. Building Android APK (Gradle) ---" -ForegroundColor Cyan
Push-Location src-tauri/gen/android
./gradlew assembleDebug
Pop-Location

Write-Host "--- 4. Installing to Phone ---" -ForegroundColor Cyan
& $adb install -r "src-tauri/gen/android/app/build/outputs/apk/debug/app-debug.apk"

Write-Host "--- 5. Launching App ---" -ForegroundColor Cyan
& $adb shell am start -n com.spotilie.app/com.spotilie.app.MainActivity

Write-Host "--- Done! ---" -ForegroundColor Green
