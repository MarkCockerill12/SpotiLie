package com.spotilie.app

import android.Manifest
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import android.os.SystemClock
import android.provider.Settings
import android.util.Base64
import android.util.Log
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.media3.common.util.UnstableApi
import org.json.JSONObject
import org.mozilla.geckoview.AllowOrDeny
import org.mozilla.geckoview.ContentBlocking
import org.mozilla.geckoview.GeckoResult
import org.mozilla.geckoview.GeckoRuntime
import org.mozilla.geckoview.GeckoRuntimeSettings
import org.mozilla.geckoview.GeckoSession
import org.mozilla.geckoview.GeckoSessionSettings
import org.mozilla.geckoview.GeckoView
import org.mozilla.geckoview.WebExtension
import org.mozilla.geckoview.WebExtensionController
import org.mozilla.geckoview.WebRequestError

/**
 * Hosts the Spotify web player in GeckoView and bridges it to the media session.
 *
 * GeckoView is used rather than Android WebView because Chromium WebView revokes
 * the Widevine DRM HAL session, which stops playback dead.
 *
 * The user agent claims desktop **Firefox**, which is what this engine actually is.
 * Spotify serves the full desktop player (on-demand tracks, unlimited skips, queue,
 * lyrics) to desktop Firefox, so we get every premium-tier surface without pretending
 * to be an engine we aren't — a Chrome UA on Gecko is trivially detectable.
 */
@UnstableApi
class MainActivity : AppCompatActivity() {

    private var geckoView: GeckoView? = null
    private var geckoSession: GeckoSession? = null
    private val mainHandler = Handler(Looper.getMainLooper())

    /** Android system nav bar height in CSS pixels, measured from WindowInsets. */
    @Volatile
    private var navBarHeightCssPx: Int = 0

    /** WebExtension port for bidirectional messaging with the injector. */
    @Volatile
    private var extensionPort: WebExtension.Port? = null

    @Volatile
    private var canGoBack: Boolean = false

    /** The injector's full-screen player or Library overlay is showing. */
    @Volatile
    private var overlayOpen: Boolean = false

    /** Last open.spotify.com location, so recoveries land where the user was. */
    private var lastSpotifyUrl: String = SPOTIFY_URL

    /** True while the offline page is up; a validated network reloads Spotify. */
    @Volatile
    private var showingOfflinePage = false

    private var lastReloadAt = 0L
    private val recoveryTimes = ArrayDeque<Long>()
    private var networkCallback: ConnectivityManager.NetworkCallback? = null
    private var debugReceiver: BroadcastReceiver? = null

    /** Battery exemption is asked after this settles, so the two prompts don't stack. */
    private val notificationPermission =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) {
            maybeRequestBatteryExemption()
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        instance = this

        setupEdgeToEdge()
        if (!maybeRequestNotificationPermission()) maybeRequestBatteryExemption()

        startService(Intent(this, PlaybackService::class.java))

        initGeckoView()
        installBackHandler()
        registerNetworkCallback()
        if (BuildConfig.INJECTOR_DEBUG) registerDebugReceiver()
    }

    // ── Window / insets ──────────────────────────────────────────────────────

    private fun setupEdgeToEdge() {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        WindowCompat.getInsetsController(window, window.decorView).apply {
            systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            hide(WindowInsetsCompat.Type.statusBars())
        }

        // The injector needs the real nav bar height to place its bottom nav.
        ViewCompat.setOnApplyWindowInsetsListener(window.decorView) { _, insets ->
            val bottom = insets.getInsets(
                WindowInsetsCompat.Type.navigationBars() or WindowInsetsCompat.Type.systemBars()
            ).bottom
            val density = resources.displayMetrics.density
            navBarHeightCssPx = (maxOf(bottom, (28 * density).toInt()) / density).toInt()
            sendNavHeight()
            insets
        }
    }

    /**
     * Android 13+ hides the media notification — and with it the lock-screen and
     * shade controls — until POST_NOTIFICATIONS is granted. It was declared in
     * the manifest but never requested, so it sat at granted=false. Asked once.
     */
    private fun maybeRequestNotificationPermission(): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return false
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) ==
            PackageManager.PERMISSION_GRANTED
        ) return false

        val prefs = getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        if (prefs.getBoolean(KEY_NOTIFICATIONS_ASKED, false)) return false
        prefs.edit().putBoolean(KEY_NOTIFICATIONS_ASKED, true).apply()

        notificationPermission.launch(Manifest.permission.POST_NOTIFICATIONS)
        return true
    }

    /**
     * Ask once, not on every cold start. The old behaviour launched a Settings
     * activity over the player every single launch until it was granted.
     */
    private fun maybeRequestBatteryExemption() {
        val prefs = getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        if (prefs.getBoolean(KEY_BATTERY_ASKED, false)) return

        val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
        if (pm.isIgnoringBatteryOptimizations(packageName)) return

        prefs.edit().putBoolean(KEY_BATTERY_ASKED, true).apply()
        try {
            startActivity(
                Intent(
                    Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
                    Uri.parse("package:$packageName")
                )
            )
        } catch (_: Exception) {
        }
    }

    /** Back navigates the web player rather than dropping straight out of the app. */
    private fun installBackHandler() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                // The full-screen player and the Library overlay close first,
                // the way a native app's sheets do.
                if (overlayOpen) {
                    overlayOpen = false
                    postToPort(JSONObject().apply { put("type", "CLOSE_OVERLAY") })
                    return
                }
                val session = geckoSession
                if (session != null && canGoBack) {
                    session.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })
    }

    // ── GeckoView ────────────────────────────────────────────────────────────

    private fun initGeckoView() {
        val view = GeckoView(this)
        geckoView = view
        setContentView(view)

        val runtime = runtimeInstance ?: GeckoRuntime.create(
            this,
            GeckoRuntimeSettings.Builder()
                .consoleOutput(BuildConfig.INJECTOR_DEBUG)
                .aboutConfigEnabled(false)
                .preferredColorScheme(GeckoRuntimeSettings.COLOR_SCHEME_DARK)
                // Autoplay is granted through the permission delegate below,
                // which allows every content permission the page asks for.
                // Engine-level tracker blocking. Spotify's own domains are first
                // party here so they're untouched; this only kills third-party
                // ad and analytics networks before a request is ever made.
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
                .build()
        ).also { runtimeInstance = it }

        // Register the extension and wire messaging before loading Spotify, so
        // there's no window where the page runs without the injector attached.
        runtime.webExtensionController.ensureBuiltIn(EXT_PATH, EXT_ID).then({ ext ->
            ext?.setMessageDelegate(portDelegate, PORT_NAME)
            runOnUiThread { openSessionAndLoad(runtime, SPOTIFY_URL) }
            GeckoResult.fromValue(null)
        }, { err ->
            Log.e(TAG, "WebExtension registration failed: ${err.message}")
            runOnUiThread { openSessionAndLoad(runtime, SPOTIFY_URL) }
            GeckoResult.fromValue(null)
        })

        ensureAdBlocker(runtime)
    }

    private fun openSessionAndLoad(runtime: GeckoRuntime, url: String) {
        val session = GeckoSession(
            GeckoSessionSettings.Builder()
                .usePrivateMode(false)
                // Applied for the document load only — see clearUaOverride below.
                .userAgentOverride(DESKTOP_FIREFOX_UA)
                // Deliberately NOT VIEWPORT_MODE_DESKTOP: we want desktop feature
                // detection but device-width rendering, so the injected mobile
                // layout lays out at real phone dimensions.
                .build()
        )
        geckoSession = session

        // Widevine needs a media-key grant; nothing else is ever requested.
        session.permissionDelegate = object : GeckoSession.PermissionDelegate {
            override fun onContentPermissionRequest(
                session: GeckoSession,
                perm: GeckoSession.PermissionDelegate.ContentPermission
            ): GeckoResult<Int> =
                GeckoResult.fromValue(GeckoSession.PermissionDelegate.ContentPermission.VALUE_ALLOW)
        }

        /*
         * The UA override has to be live for the top-level document request —
         * open.spotify.com genuinely serves different HTML to mobile and desktop
         * agents (verified: ~298 KB vs ~156 KB) — but it must be gone before the
         * app starts making API calls.
         *
         * GeckoView applies the override as an author-set header on the channel,
         * so Gecko lists `user-agent` in the CORS preflight's
         * Access-Control-Request-Headers. Spotify's servers don't allow it, and
         * every preflighted request fails: metadata, playlists, artwork and the
         * Widevine licence endpoint all 'CORS request did not succeed'.
         *
         * So: set it per top-level navigation, drop it as soon as the document
         * starts parsing. The injector then spoofs navigator.userAgent, which is
         * what Spotify's client-side code actually reads.
         */
        session.progressDelegate = object : GeckoSession.ProgressDelegate {
            override fun onPageStart(session: GeckoSession, url: String) {
                session.settings.userAgentOverride = null
            }
        }

        session.navigationDelegate = object : GeckoSession.NavigationDelegate {
            override fun onCanGoBack(session: GeckoSession, canGoBack: Boolean) {
                this@MainActivity.canGoBack = canGoBack
            }

            override fun onLocationChange(
                session: GeckoSession,
                url: String?,
                perms: List<GeckoSession.PermissionDelegate.ContentPermission>,
                hasUserGesture: Boolean
            ) {
                if (url != null && url.startsWith(SPOTIFY_URL)) {
                    lastSpotifyUrl = url
                    showingOfflinePage = false
                }
            }

            /** Re-arm the desktop UA for each new top-level document. */
            override fun onLoadRequest(
                session: GeckoSession,
                request: GeckoSession.NavigationDelegate.LoadRequest
            ): GeckoResult<AllowOrDeny>? {
                session.settings.userAgentOverride = DESKTOP_FIREFOX_UA
                return null
            }

            /** Show the bundled offline page instead of Gecko's error page. */
            override fun onLoadError(
                session: GeckoSession,
                uri: String?,
                error: WebRequestError
            ): GeckoResult<String>? {
                Log.w(TAG, "Load error for $uri (category=${error.category} code=${error.code})")
                showingOfflinePage = true
                return GeckoResult.fromValue("resource://android/assets/offline.html")
            }
        }

        /*
         * Content process death. Nothing handled this before: when Android's
         * low-memory killer or a Gecko crash took the tab process down, the
         * GeckoSession closed and the app was left showing a dead, frozen page
         * until the user force-stopped it.
         */
        session.contentDelegate = object : GeckoSession.ContentDelegate {
            override fun onCrash(session: GeckoSession) {
                Log.e(TAG, "Content process crashed")
                recoverSession(session, "crash")
            }

            override fun onKill(session: GeckoSession) {
                Log.w(TAG, "Content process killed")
                recoverSession(session, "kill")
            }
        }

        session.open(runtime)
        // Tells Gecko this tab is what the user is using, so its content process
        // keeps a foreground binding instead of being first in line for the LMK.
        session.setPriorityHint(GeckoSession.PRIORITY_HIGH)
        geckoView?.setSession(session)
        session.settings.userAgentOverride = DESKTOP_FIREFOX_UA
        session.loadUri(url)
    }

    /** Replace a dead session with a fresh one, backing off if it keeps dying. */
    private fun recoverSession(dead: GeckoSession, reason: String) {
        mainHandler.post {
            if (dead !== geckoSession || isFinishing || isDestroyed) return@post

            val now = SystemClock.elapsedRealtime()
            while (recoveryTimes.isNotEmpty() && now - recoveryTimes.first() > RECOVERY_WINDOW_MS) {
                recoveryTimes.removeFirst()
            }
            recoveryTimes.addLast(now)
            val delayMs = RECOVERY_BACKOFF_MS[minOf(recoveryTimes.size - 1, RECOVERY_BACKOFF_MS.lastIndex)]
            Log.w(TAG, "Recovering web player after $reason in ${delayMs}ms (#${recoveryTimes.size})")

            geckoView?.releaseSession()
            try { dead.close() } catch (_: Exception) {}
            geckoSession = null
            PlaybackService.instance?.onWebPlayerReset()

            mainHandler.postDelayed({
                val runtime = runtimeInstance ?: return@postDelayed
                if (geckoSession == null && !isFinishing && !isDestroyed) {
                    openSessionAndLoad(runtime, lastSpotifyUrl)
                }
            }, delayMs)
        }
    }

    /**
     * Reload Spotify, re-arming the desktop UA first (a page-initiated
     * `location.reload()` can't do that). Used by the injector's watchdogs and
     * when the network comes back while the offline page is showing.
     */
    private fun reloadSpotify(reason: String) {
        mainHandler.post {
            val session = geckoSession ?: return@post
            val now = SystemClock.elapsedRealtime()
            if (now - lastReloadAt < MIN_RELOAD_INTERVAL_MS) return@post
            lastReloadAt = now

            Log.w(TAG, "Reloading Spotify: $reason")
            showingOfflinePage = false
            session.settings.userAgentOverride = DESKTOP_FIREFOX_UA
            session.loadUri(lastSpotifyUrl)
        }
    }

    /** Leave the offline page as soon as Android has a network that actually works. */
    private fun registerNetworkCallback() {
        val cm = getSystemService(ConnectivityManager::class.java) ?: return
        val callback = object : ConnectivityManager.NetworkCallback() {
            override fun onCapabilitiesChanged(network: Network, caps: NetworkCapabilities) {
                if (showingOfflinePage && caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)) {
                    reloadSpotify("network validated")
                }
            }
        }
        try {
            cm.registerDefaultNetworkCallback(callback)
            networkCallback = callback
        } catch (e: Exception) {
            Log.w(TAG, "Network callback unavailable: ${e.message}")
        }
    }

    // ── uBlock Origin ────────────────────────────────────────────────────────

    /**
     * A real, maintained content blocker for everything that isn't a Spotify
     * audio ad: display ads, sponsored shelves, trackers, third-party scripts.
     * Installed from AMO (Mozilla-signed) into this Gecko runtime on first run,
     * and kept current by checking for updates weekly. Installation needs the
     * network, so it simply retries on the next launch if it fails.
     */
    private fun ensureAdBlocker(runtime: GeckoRuntime) {
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
            val prefs = getSharedPreferences(PREFS, Context.MODE_PRIVATE)
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

    // ── Extension bridge ─────────────────────────────────────────────────────

    private val portDelegate = object : WebExtension.MessageDelegate {
        override fun onConnect(port: WebExtension.Port) {
            if (port.name != PORT_NAME) return
            extensionPort = port
            postToPort(JSONObject().apply {
                put("type", "CONFIG")
                put("debug", BuildConfig.INJECTOR_DEBUG)
            })
            sendNavHeight()
            port.setDelegate(object : WebExtension.PortDelegate {
                override fun onPortMessage(message: Any, port: WebExtension.Port) {
                    handlePortMessage(message)
                }

                override fun onDisconnect(port: WebExtension.Port) {
                    if (extensionPort === port) extensionPort = null
                }
            })
        }
    }

    private fun handlePortMessage(message: Any) {
        try {
            val json = message as? JSONObject ?: JSONObject(message.toString())
            when (json.optString("type")) {
                "UPDATE_METADATA" -> {
                    if (BuildConfig.INJECTOR_DEBUG) logChunked("port → $json")
                    PlaybackService.instance?.updateMetadata(
                        title = json.optString("title", "SpotiLIE"),
                        artist = json.optString("artist", ""),
                        artworkUrl = json.optString("artwork", ""),
                        isPlaying = json.optBoolean("isPlaying", false),
                        durationMs = json.optLong("duration", 0L),
                        positionMs = json.optLong("position", 0L)
                    )
                }
                "RELOAD" -> reloadSpotify(json.optString("reason", "injector request"))
                "OVERLAY" -> overlayOpen = json.optBoolean("open", false)
                "DEBUG_DUMP", "PAGE_LOG" ->
                    if (BuildConfig.INJECTOR_DEBUG) logChunked("${json.optString("type")} ${json.optString("text")}")
                else -> if (BuildConfig.INJECTOR_DEBUG) logChunked("port → $json")
            }
        } catch (e: Exception) {
            Log.w(TAG, "Bad port message: ${e.message}")
        }
    }

    private fun postToPort(json: JSONObject) {
        val port = extensionPort ?: return
        runOnUiThread {
            try {
                port.postMessage(json)
            } catch (e: Exception) {
                Log.e(TAG, "Failed to post ${json.optString("type", json.optString("action"))}: ${e.message}")
            }
        }
    }

    /**
     * Send a transport action to the web player. Used by the media session, the
     * notification buttons, Bluetooth keys and Android Auto.
     */
    fun sendMediaAction(action: String, arg: Long = 0L) {
        // Resuming from the notification while backgrounded: the session was left
        // inactive when paused, so wake it before asking it to play.
        if (action == "play" || action == "toggle") {
            runOnUiThread { geckoSession?.setActive(true) }
        }
        postToPort(JSONObject().apply {
            put("action", action)
            put("value", arg)
        })
    }

    /** Push the measured system nav bar height so the injector can offset its UI. */
    private fun sendNavHeight() {
        postToPort(JSONObject().apply {
            put("type", "SET_NAV_HEIGHT")
            put("height", maxOf(navBarHeightCssPx, 44))
        })
    }

    /** logcat truncates lines around 4 KB; DOM dumps are longer than that. */
    private fun logChunked(text: String) {
        var i = 0
        while (i < text.length) {
            Log.d(TAG, text.substring(i, minOf(text.length, i + 3500)))
            i += 3500
        }
    }

    /**
     * DEBUG builds only: run JS in the content script from adb, output to logcat.
     *   adb shell am broadcast -a com.spotilie.app.DEBUG_EVAL -p com.spotilie.app --es b64 <base64>
     */
    private fun registerDebugReceiver() {
        val receiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                val b64 = intent?.getStringExtra("b64") ?: return
                val js = String(Base64.decode(b64, Base64.DEFAULT), Charsets.UTF_8)
                postToPort(JSONObject().apply {
                    put("type", "DEBUG_EVAL")
                    put("js", js)
                })
            }
        }
        ContextCompat.registerReceiver(
            this, receiver, IntentFilter(ACTION_DEBUG_EVAL), ContextCompat.RECEIVER_EXPORTED
        )
        debugReceiver = receiver
    }

    // ── Background playback ──────────────────────────────────────────────────

    /*
     * GeckoView deactivates the session whenever its surface goes away — app sent
     * to the background or screen turned off (GeckoView$Display.onSurfaceDestroyed
     * → setActive(false)). An inactive session is a background tab to Gecko: its
     * timers are throttled, which starves Spotify's MediaSource buffering and lets
     * its dealer websocket time out, so music stopped a little after leaving the
     * app. While music is playing, put the session straight back to active. When
     * paused, it is left inactive so a backgrounded, idle player costs nothing.
     */
    private val keepPlayingInBackground = Runnable {
        if (PlaybackService.instance?.isWebPlaying() == true) {
            geckoSession?.setActive(true)
        }
    }

    override fun onStart() {
        super.onStart()
        mainHandler.removeCallbacks(keepPlayingInBackground)
    }

    override fun onStop() {
        super.onStop()
        // The surface is torn down around onStop; re-activate after it has gone,
        // and once more in case the teardown lands late.
        mainHandler.postDelayed(keepPlayingInBackground, 300)
        mainHandler.postDelayed(keepPlayingInBackground, 1500)
    }

    fun stopSession() {
        try { geckoSession?.stop() } catch (_: Exception) {}
    }

    override fun onDestroy() {
        mainHandler.removeCallbacksAndMessages(null)
        networkCallback?.let {
            try { getSystemService(ConnectivityManager::class.java)?.unregisterNetworkCallback(it) } catch (_: Exception) {}
        }
        debugReceiver?.let { try { unregisterReceiver(it) } catch (_: Exception) {} }
        extensionPort = null
        stopSession()
        try { geckoSession?.close() } catch (_: Exception) {}
        geckoView = null
        geckoSession = null
        instance = null
        super.onDestroy()
    }

    companion object {
        private const val TAG = "SpotiLIE"
        private const val EXT_ID = "spotilie@local"
        private const val EXT_PATH = "resource://android/assets/spotilie-ext/"
        private const val SPOTIFY_URL = "https://open.spotify.com"
        private const val PREFS = "spotilie"
        private const val KEY_BATTERY_ASKED = "battery_exemption_asked"
        private const val KEY_NOTIFICATIONS_ASKED = "notifications_asked"
        private const val KEY_UBO_CHECKED = "ubo_update_checked_at"
        private const val ACTION_DEBUG_EVAL = "com.spotilie.app.DEBUG_EVAL"

        private const val UBO_ID = "uBlock0@raymondhill.net"
        private const val UBO_URL = "https://addons.mozilla.org/firefox/downloads/latest/ublock-origin/latest.xpi"
        private const val UBO_UPDATE_INTERVAL_MS = 7L * 24 * 60 * 60 * 1000

        /** Consecutive crashes inside this window escalate the backoff. */
        private const val RECOVERY_WINDOW_MS = 5L * 60 * 1000
        private val RECOVERY_BACKOFF_MS = longArrayOf(500, 2_000, 5_000, 15_000, 30_000)
        private const val MIN_RELOAD_INTERVAL_MS = 10_000L

        /** GeckoView rejects port names that aren't `\w+(\.\w+)*` — no hyphens. */
        private const val PORT_NAME = "spotilie_native_bridge"

        private const val DESKTOP_FIREFOX_UA =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:153.0) Gecko/20100101 Firefox/153.0"

        /** GeckoRuntime may only be created once per process. */
        @Volatile
        private var runtimeInstance: GeckoRuntime? = null

        @Volatile
        var instance: MainActivity? = null
            private set
    }
}
