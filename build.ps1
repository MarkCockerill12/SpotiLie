# SpotiLIE Build & Deploy Script
#
# Usage:
#   .\build.ps1           — Full rebuild (Rust + Kotlin + Gradle + deploy)
#   .\build.ps1 -JSOnly   — JS injector change only (skip Rust, ~30s)
#
# NOTE: Windows symlink restriction prevents 'tauri android build' from linking
# the .so automatically. This script uses Copy-Item as a workaround after
# the Rust library has been compiled.

param(
    [switch]$JSOnly   # Skip Rust recompilation, use last built .so
)

$adb     = "C:/Users/Mark/AppData/Local/Android/Sdk/platform-tools/adb.exe"
$soSrc   = "src-tauri/target/aarch64-linux-android/debug/libtauri_app_lib.so"
$soDest  = "src-tauri/gen/android/app/src/main/jniLibs/arm64-v8a/libtauri_app_lib.so"
$apkPath = "src-tauri/gen/android/app/build/outputs/apk/debug/app-debug.apk"

# ── 1. Build JS injector ──────────────────────────────────────────────────────
Write-Host "--- 1. Building Injector ---" -ForegroundColor Cyan
& bun build src/injector/index.ts --outfile src/injector.js --minify
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: Injector build failed" -ForegroundColor Red; exit 1 }
Write-Host "Injector built ($(((Get-Item 'src/injector.js').Length / 1KB).ToString('F1')) KB)" -ForegroundColor Green

# ── 2. Sync injector to Android assets ───────────────────────────────────────
Write-Host "--- 2. Syncing to Android Assets ---" -ForegroundColor Cyan
$assetsDir = "src-tauri/gen/android/app/src/main/assets"
$extDir = "$assetsDir/spotilie-ext"
if (!(Test-Path $extDir)) { New-Item -ItemType Directory -Path $extDir -Force | Out-Null }
Copy-Item -Path "src/injector.js" -Destination "$assetsDir/injector.js" -Force
Copy-Item -Path "src/injector.js" -Destination "$extDir/injector.js" -Force
Write-Host "Injector synced to assets and GeckoView extension." -ForegroundColor Green

# ── 3. Rust compilation (skipped with -JSOnly) ────────────────────────────────
if (-not $JSOnly) {
    Write-Host "--- 3. Compiling Rust Library (NDK aarch64) ---" -ForegroundColor Cyan
    Write-Host "(~1 min incremental, ~5 min clean)" -ForegroundColor DarkGray

    # Touch lib.rs to force Cargo to re-evaluate include_str!("../../src/injector.js")
    (Get-Item "src-tauri/src/lib.rs").LastWriteTime = Get-Date

    $env:TAURI_SKIP_DEVSERVER_CHECK = "true"
    & bun tauri android build --apk --debug 2>&1 | ForEach-Object {
        Write-Host $_
        # Stop once Rust finishes (symlink error will follow but .so is already written)
        if ($_ -match "Finished .* target\(s\) in") { Write-Host "Rust compiled OK" -ForegroundColor Green }
    }
    # Don't fail on the symlink error — we copy manually below
} else {
    Write-Host "--- 3. Skipping Rust (using cached .so) ---" -ForegroundColor DarkGray
}

# ── 4. Copy .so into jniLibs (Windows symlink workaround) ────────────────────
Write-Host "--- 4. Copying Rust .so to jniLibs ---" -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path "src-tauri/gen/android/app/src/main/jniLibs/arm64-v8a" | Out-Null
if (Test-Path $soSrc) {
    Copy-Item -Path $soSrc -Destination $soDest -Force
    Write-Host "Library copied (built: $((Get-Item $soDest).LastWriteTime))" -ForegroundColor Green
} else {
    Write-Host "WARNING: Rust .so not found at $soSrc" -ForegroundColor Yellow
    Write-Host "If this is the first build, run without -JSOnly first." -ForegroundColor Yellow
}

# ── 5. Gradle assembleDebug ───────────────────────────────────────────────────
Write-Host "--- 5. Building Android APK (Gradle) ---" -ForegroundColor Cyan
Push-Location src-tauri/gen/android
./gradlew assembleDebug 2>&1
$gradleResult = $LASTEXITCODE
Pop-Location
if ($gradleResult -ne 0) { Write-Host "ERROR: Gradle build failed" -ForegroundColor Red; exit 1 }
Write-Host "APK built." -ForegroundColor Green

# ── 6. Install to device ──────────────────────────────────────────────────────
Write-Host "--- 6. Installing to Phone ---" -ForegroundColor Cyan
$deviceLines = & $adb devices 2>&1
if ($deviceLines -match "unauthorized") {
    Write-Host "ERROR: Device unauthorized." -ForegroundColor Red
    Write-Host "  → Look for 'Allow USB debugging?' dialog on your phone and tap Allow." -ForegroundColor Yellow
    exit 1
}
if (-not ($deviceLines -match "\bdevice\b")) {
    Write-Host "ERROR: No authorized device found. Connect phone via USB." -ForegroundColor Red
    exit 1
}

& $adb install -r $apkPath
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: ADB install failed" -ForegroundColor Red; exit 1 }

# ── 7. Launch ─────────────────────────────────────────────────────────────────
Write-Host "--- 7. Launching SpotiLIE ---" -ForegroundColor Cyan
& $adb shell am start -n com.spotilie.app/com.spotilie.app.MainActivity

Write-Host '  Tip: Use .\build.ps1 -JSOnly for injector-only changes (~30s)' -ForegroundColor DarkGray
