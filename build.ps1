# SpotiLIE build & deploy.
#
#   .\build.ps1              Build, install, launch
#   .\build.ps1 -Debug       Same, with injector console logging enabled
#   .\build.ps1 -Release     Minified/shrunk release APK
#   .\build.ps1 -Logs        Tail logcat after launching
#
# There is no Rust step any more: the Tauri layer never executed (MainActivity
# hosts GeckoView directly and never loaded the native library), so it was
# removed along with the 139 MB .so it was shipping inside the APK.

param(
    [switch]$Debug,
    [switch]$Release,
    [switch]$Logs
)

$ErrorActionPreference = "Stop"

# adb: SDK env vars first, then PATH, then the Android Studio default location.
$sdkRoots = @($env:ANDROID_HOME, $env:ANDROID_SDK_ROOT, (Join-Path $env:LOCALAPPDATA "Android/Sdk")) | Where-Object { $_ }
$adb = $sdkRoots | ForEach-Object { Join-Path $_ "platform-tools/adb.exe" } | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $adb) { $adb = (Get-Command adb -ErrorAction SilentlyContinue).Source }
if (-not $adb) { Write-Host "adb not found. Set ANDROID_HOME or put platform-tools on PATH." -ForegroundColor Red; exit 1 }
$injectorJs = "android/app/src/main/assets/spotilie-ext/index.js"
$variant    = if ($Release) { "Release" } else { "Debug" }
$apkPath    = "android/app/build/outputs/apk/$($variant.ToLower())/app-$($variant.ToLower()).apk"

# ── 1. Injector ───────────────────────────────────────────────────────────────
Write-Host "--- 1. Building injector ---" -ForegroundColor Cyan
$env:SPOTILIE_DEBUG = if ($Debug) { "1" } else { "0" }
& bun run build
if ($LASTEXITCODE -ne 0) { Write-Host "Injector build failed" -ForegroundColor Red; exit 1 }
$size = (Get-Item $injectorJs).Length / 1KB
Write-Host ("Injector built ({0:F1} KB, debug={1})" -f $size, $env:SPOTILIE_DEBUG) -ForegroundColor Green

# ── 2. APK ────────────────────────────────────────────────────────────────────
Write-Host "--- 2. Building APK ($variant) ---" -ForegroundColor Cyan
Push-Location android
try {
    $debugProp = if ($Debug) { "-PspotilieDebug=true" } else { "-PspotilieDebug=false" }
    & ./gradlew "assemble$variant" $debugProp --console=plain
    $gradleExit = $LASTEXITCODE
} finally {
    Pop-Location
}
if ($gradleExit -ne 0) { Write-Host "Gradle build failed" -ForegroundColor Red; exit 1 }
Write-Host ("APK built ({0:F1} MB)" -f ((Get-Item $apkPath).Length / 1MB)) -ForegroundColor Green

# ── 3. Install ────────────────────────────────────────────────────────────────
Write-Host "--- 3. Installing ---" -ForegroundColor Cyan
$devices = & $adb devices 2>&1
if ($devices -match "unauthorized") {
    Write-Host "Device unauthorized - accept the USB debugging prompt on the phone." -ForegroundColor Red
    exit 1
}
if (-not ($devices -match "\bdevice\b")) {
    Write-Host "No device found. Connect the phone over USB." -ForegroundColor Red
    exit 1
}

& $adb install -r $apkPath
if ($LASTEXITCODE -ne 0) { Write-Host "adb install failed" -ForegroundColor Red; exit 1 }

# ── 4. Launch ─────────────────────────────────────────────────────────────────
Write-Host "--- 4. Launching ---" -ForegroundColor Cyan
& $adb shell am start -n com.spotilie.app/com.spotilie.app.MainActivity | Out-Null

if ($Logs) {
    Write-Host "--- Tailing logcat (Ctrl+C to stop) ---" -ForegroundColor Cyan
    & $adb logcat -c
    & $adb logcat SpotiLIE:V GeckoConsole:V AndroidRuntime:E "*:S"
}
