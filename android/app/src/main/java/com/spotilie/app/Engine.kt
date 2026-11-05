package com.spotilie.app

import android.content.Context
import android.util.Log
import org.mozilla.geckoview.AllowOrDeny
import org.mozilla.geckoview.ContentBlocking
import org.mozilla.geckoview.GeckoResult
import org.mozilla.geckoview.GeckoRuntime
import org.mozilla.geckoview.GeckoRuntimeSettings
import org.mozilla.geckoview.WebExtension
import org.mozilla.geckoview.WebExtensionController
import java.io.File

/**
 * Gecko runtime construction and the add-ons it carries.
 *
 * GeckoView is used rather than Android WebView because Chromium WebView revokes
 * the Widevine DRM HAL session, which stops playback dead.
 */
object Engine {

    private const val TAG = "SpotiLIE"

    const val EXT_ID = "spotilie@local"
    const val EXT_PATH = "resource://android/assets/spotilie-ext/"

    /** GeckoView rejects port names that aren't `\w+(\.\w+)*` — no hyphens. */
    const val PORT_NAME = "spotilie_native_bridge"

    /**
     * Desktop **Firefox**, which is what this engine actually is. Spotify serves
     * the full desktop player to it; a Chrome UA on Gecko is trivially detectable.
     */
    const val DESKTOP_FIREFOX_UA =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:153.0) Gecko/20100101 Firefox/153.0"

    private const val CONFIG_ASSET = "geckoview-config.yaml"

    private const val UBO_ID = "uBlock0@raymondhill.net"
    private const val UBO_URL = "https://addons.mozilla.org/firefox/downloads/latest/ublock-origin/latest.xpi"
    private const val UBO_UPDATE_INTERVAL_MS = 7L * 24 * 60 * 60 * 1000
    private const val KEY_UBO_CHECKED = "ubo_update_checked_at"

    /** GeckoRuntime may only be created once per process. */
    fun createRuntime(context: Context): GeckoRuntime {
        val builder = GeckoRuntimeSettings.Builder()
            .consoleOutput(BuildConfig.INJECTOR_DEBUG)
            .aboutConfigEnabled(false)
            .preferredColorScheme(GeckoRuntimeSettings.COLOR_SCHEME_DARK)
            // Let Gecko watch Android's memory signals and drop caches under
            // pressure, rather than holding on until lmkd kills the tab.
            .lowMemoryDetection(true)
            // ⚠ Do NOT add fissionEnabled(false). It halves nothing the yaml
            // doesn't already, and it broke touch: a new touch could no longer
            // stop a running fling (bisected on device). Process sharing is done
            // with fission.webContentIsolationStrategy=0 in the yaml instead.
            
            // Engine-level tracker blocking. Spotify's own domains are first
            // party, so this only kills third-party ad/analytics networks.
            .contentBlocking(
                ContentBlocking.Settings.Builder()
                    .antiTracking(
                        ContentBlocking.AntiTracking.AD or
                            ContentBlocking.AntiTracking.ANALYTIC or
                            ContentBlocking.AntiTracking.SOCIAL or
                            ContentBlocking.AntiTracking.CRYPTOMINING
                    )
                    .enhancedTrackingProtectionLevel(ContentBlocking.EtpLevel.DEFAULT)
                    .build()
            )
        installConfig(context)?.let { builder.configFilePath(it) }
        return GeckoRuntime.create(context, builder.build())
    }

    /**
     * Copy the bundled prefs file somewhere Gecko can read it. An explicit
     * configFilePath is honoured in every build type; only the default
     * /data/local/tmp path is gated on the app being debuggable.
     */
    private fun installConfig(context: Context): String? = try {
        val out = File(context.filesDir, CONFIG_ASSET)
        context.assets.open(CONFIG_ASSET).use { input ->
            out.outputStream().use { input.copyTo(it) }
        }
        out.absolutePath
    } catch (e: Exception) {
        Log.w(TAG, "Gecko config not installed: ${e.message}")
        null
    }

    /**
     * uBlock Origin for everything that isn't a Spotify audio ad. Installed from
     * AMO (Mozilla-signed) on first run, update-checked weekly; retries next
     * launch if offline.
     */
    fun ensureAdBlocker(runtime: GeckoRuntime, context: Context) {
        val controller = runtime.webExtensionController
        controller.promptDelegate = object : WebExtensionController.PromptDelegate {
            override fun onInstallPromptRequest(
                extension: WebExtension,
                permissions: Array<String>,
                origins: Array<String>,
                dataCollectionPermissions: Array<String>
            ): GeckoResult<WebExtension.PermissionPromptResponse> =
                GeckoResult.fromValue(
                    WebExtension.PermissionPromptResponse(extension.id == UBO_ID, false, false)
                )

            override fun onUpdatePrompt(
                extension: WebExtension,
                newPermissions: Array<String>,
                newOrigins: Array<String>,
                newDataCollectionPermissions: Array<String>
            ): GeckoResult<AllowOrDeny> =
                GeckoResult.fromValue(if (extension.id == UBO_ID) AllowOrDeny.ALLOW else AllowOrDeny.DENY)
        }

        controller.list().accept({ extensions ->
            val prefs = context.getSharedPreferences("spotilie", Context.MODE_PRIVATE)
            val existing = extensions?.firstOrNull { it.id == UBO_ID }
            if (existing == null) {
                Log.i(TAG, "Installing uBlock Origin")
                controller.install(UBO_URL, WebExtensionController.INSTALLATION_METHOD_MANAGER).accept(
                    { Log.i(TAG, "uBlock Origin installed (${it?.metaData?.version})") },
                    { Log.w(TAG, "uBlock Origin install failed, will retry next launch: ${it?.message}") }
                )
            } else if (System.currentTimeMillis() - prefs.getLong(KEY_UBO_CHECKED, 0L) > UBO_UPDATE_INTERVAL_MS) {
                prefs.edit().putLong(KEY_UBO_CHECKED, System.currentTimeMillis()).apply()
                controller.update(existing).accept(
                    { Log.i(TAG, "uBlock Origin update check done (${it?.metaData?.version ?: "current"})") },
                    { Log.w(TAG, "uBlock Origin update failed: ${it?.message}") }
                )
            }
        }, { Log.w(TAG, "Could not list extensions: ${it?.message}") })
    }
}
