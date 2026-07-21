package com.spotilie.app

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings
import android.util.Log
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import org.json.JSONObject
import org.mozilla.geckoview.GeckoResult
import org.mozilla.geckoview.GeckoRuntime
import org.mozilla.geckoview.GeckoRuntimeSettings
import org.mozilla.geckoview.GeckoSession
import org.mozilla.geckoview.GeckoSessionSettings
import org.mozilla.geckoview.GeckoView
import org.mozilla.geckoview.WebExtension

class MainActivity : AppCompatActivity() {
    companion object {
        @Volatile var instance: MainActivity? = null
        private const val TAG = "SpotiLIE"
        private const val EXT_ID = "spotilie@local"
        private const val EXT_PATH = "resource://android/assets/spotilie-ext/"
        // Port name must match the one used in the extension's background/content script
        private const val PORT_NAME = "spotilie_native_bridge"
    }

    private var geckoView: GeckoView? = null
    private var geckoSession: GeckoSession? = null
    private var geckoRuntime: GeckoRuntime? = null

    // Android system nav bar height in CSS pixels (measured from WindowInsets)
    @Volatile private var navBarHeightCssPx: Int = 0

    // WebExtension port for reliable bidirectional messaging
    @Volatile private var extensionPort: WebExtension.Port? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        instance = this

        // Full-screen edge-to-edge display
        val windowInsetsController = WindowCompat.getInsetsController(window, window.decorView)
        windowInsetsController.systemBarsBehavior =
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        windowInsetsController.hide(WindowInsetsCompat.Type.statusBars())
        WindowCompat.setDecorFitsSystemWindows(window, false)

        // Measure Android navigation bar height for CSS layout injection
        ViewCompat.setOnApplyWindowInsetsListener(window.decorView) { _, insets ->
            val navInsets = insets.getInsets(WindowInsetsCompat.Type.navigationBars() or WindowInsetsCompat.Type.systemBars())
            val density = resources.displayMetrics.density
            val bottomPx = Math.max(navInsets.bottom, (28 * density).toInt())
            // Convert physical pixels → CSS logical pixels
            navBarHeightCssPx = (bottomPx / density).toInt()
            Log.d(TAG, "Nav bar height: ${navInsets.bottom}px physical → ${navBarHeightCssPx}px CSS")
            // If port already connected, push the height immediately
            sendNavHeight()
            insets
        }

        // Request battery optimization exemption for background playback
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
            if (!pm.isIgnoringBatteryOptimizations(packageName)) {
                try {
                    startActivity(Intent().apply {
                        action = Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS
                        data = Uri.parse("package:$packageName")
                    })
                } catch (_: Exception) {}
            }
        }

        // Monitor network state — re-send layout & state when connection is restored
        try {
            val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as? android.net.ConnectivityManager
            cm?.registerDefaultNetworkCallback(object : android.net.ConnectivityManager.NetworkCallback() {
                override fun onAvailable(network: android.net.Network) {
                    Log.d(TAG, "Network available — re-sending nav height and state")
                    sendNavHeight()
                }
            })
        } catch (e: Exception) {
            Log.w(TAG, "Could not register NetworkCallback: ${e.message}")
        }

        // Start the foreground media service for notification + BT controls
        startService(Intent(this, MediaForegroundService::class.java))

        initGeckoView()
    }

    private fun initGeckoView() {
        val gView = GeckoView(this)
        geckoView = gView
        setContentView(gView)

        val runtimeSettings = GeckoRuntimeSettings.Builder()
            .consoleOutput(true)
            .build()

        val runtime = GeckoRuntime.create(this, runtimeSettings)
        geckoRuntime = runtime

        // Register built-in WebExtension, then wire up the messaging delegate,
        // then load Spotify — eliminates all startup race conditions
        runtime.webExtensionController.ensureBuiltIn(EXT_PATH, EXT_ID)
            .then({ ext ->
                Log.i(TAG, "WebExtension registered: ${ext?.id}")
                if (ext != null) {
                    // Register the native messaging delegate on the extension object
                    // This is the correct GeckoView API (not runtime.setMessageDelegate)
                    ext.setMessageDelegate(
                        object : WebExtension.MessageDelegate {
                            override fun onConnect(port: WebExtension.Port) {
                                if (port.name == PORT_NAME) {
                                    Log.i(TAG, "Extension port connected: ${port.name}")
                                    extensionPort = port
                                    // Immediately send nav bar height so JS layout is correct
                                    sendNavHeight()
                                    port.setDelegate(object : WebExtension.PortDelegate {
                                        override fun onPortMessage(message: Any, port: WebExtension.Port) {
                                            Log.d(TAG, "Port message from extension: $message")
                                            // Route UPDATE_METADATA to MediaForegroundService
                                            try {
                                                val json = message as? org.json.JSONObject
                                                    ?: org.json.JSONObject(message.toString())
                                                if (json.optString("type") == "UPDATE_METADATA") {
                                                    val title = json.optString("title", "SpotiLIE")
                                                    val artist = json.optString("artist", "Playing")
                                                    val isPlaying = json.optBoolean("isPlaying", false)
                                                    
                                                    val serviceIntent = Intent(this@MainActivity, MediaForegroundService::class.java).apply {
                                                        action = MediaForegroundService.ACTION_UPDATE_MEDIA
                                                        putExtra("title", title)
                                                        putExtra("artist", artist)
                                                        putExtra("isPlaying", isPlaying)
                                                    }
                                                    try {
                                                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                                                            startForegroundService(serviceIntent)
                                                        } else {
                                                            startService(serviceIntent)
                                                        }
                                                    } catch (e: Exception) {
                                                        Log.w(TAG, "Could not start MediaForegroundService: ${e.message}")
                                                    }
                                                    Log.d(TAG, "Metadata dispatched to service: $title – $artist playing=$isPlaying")
                                                }
                                            } catch (e: Exception) {
                                                Log.w(TAG, "Failed to parse port message: ${e.message}")
                                            }
                                        }
                                        override fun onDisconnect(port: WebExtension.Port) {
                                            Log.w(TAG, "Extension port disconnected")
                                            extensionPort = null
                                        }
                                    })
                                }
                            }
                        },
                        PORT_NAME
                    )
                }
                runOnUiThread { openSessionAndLoad(runtime) }
                GeckoResult.fromValue(null)
            }, { err ->
                Log.e(TAG, "WebExtension registration FAILED: ${err.message}")
                runOnUiThread { openSessionAndLoad(runtime) }
                GeckoResult.fromValue(null)
            })
    }

    private fun openSessionAndLoad(runtime: GeckoRuntime) {
        val sessionSettings = GeckoSessionSettings.Builder()
            .usePrivateMode(false)
            .userAgentOverride(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
                "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            )
            .build()

        val session = GeckoSession(sessionSettings)
        geckoSession = session

        // Auto-allow Widevine DRM media key requests
        session.permissionDelegate = object : GeckoSession.PermissionDelegate {
            override fun onContentPermissionRequest(
                session: GeckoSession,
                perm: GeckoSession.PermissionDelegate.ContentPermission
            ): GeckoResult<Int>? {
                Log.i(TAG, "Permission requested: ${perm.permission} — granting")
                return GeckoResult.fromValue(GeckoSession.PermissionDelegate.ContentPermission.VALUE_ALLOW)
            }
        }

        // Log navigation events for debugging
        session.navigationDelegate = object : GeckoSession.NavigationDelegate {
            override fun onLocationChange(
                session: GeckoSession,
                url: String?,
                perms: MutableList<GeckoSession.PermissionDelegate.ContentPermission>,
                hasUserGesture: Boolean
            ) {
                Log.d(TAG, "Navigation → $url")
            }
        }

        session.open(runtime)
        geckoView?.setSession(session)
        session.loadUri("https://open.spotify.com")
    }

    /**
     * Send a media control action to the Spotify web player via the WebExtension port.
     * This replaces the broken loadUri("javascript:...") approach which caused page navigations.
     *
     * Called from MediaForegroundService when notification buttons are tapped.
     */
    fun handleMediaAction(action: String) {
        val port = extensionPort
        if (port != null) {
            // Safe: sends message to extension content script without touching navigation
            runOnUiThread {
                try {
                    val msg = JSONObject().apply { put("action", action) }
                    port.postMessage(msg)
                    Log.d(TAG, "Sent media action via port: $action")
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to post media action via port: ${e.message}")
                }
            }
        } else {
            // Fallback: only used if port hasn't connected yet (rare edge case on first load)
            Log.w(TAG, "Extension port not ready for action: $action — using JS URI fallback")
            runOnUiThread {
                try {
                    val safe = action.replace("'", "\\'")
                    geckoSession?.loadUri(
                        "javascript:if(typeof window.spotilieMediaAction==='function'){window.spotilieMediaAction('$safe');}void(0);"
                    )
                } catch (_: Exception) {}
            }
        }
    }

    /** Send the Android nav bar height (CSS px) to the extension for layout calibration */
    private fun sendNavHeight() {
        val port = extensionPort ?: return
        runOnUiThread {
            try {
                var hPx = navBarHeightCssPx
                if (hPx < 36) {
                    val rootInsets = window.decorView.rootWindowInsets
                    if (rootInsets != null) {
                        val insets = WindowInsetsCompat.toWindowInsetsCompat(rootInsets)
                            .getInsets(WindowInsetsCompat.Type.navigationBars() or WindowInsetsCompat.Type.systemBars())
                        val density = resources.displayMetrics.density
                        if (insets.bottom > 0) {
                            hPx = (insets.bottom / density).toInt()
                            navBarHeightCssPx = hPx
                        }
                    }
                }
                val finalH = Math.max(hPx, 44)
                val msg = JSONObject().apply {
                    put("type", "SET_NAV_HEIGHT")
                    put("height", finalH)
                }
                port.postMessage(msg)
                Log.d(TAG, "Sent nav height: ${finalH}px to extension")
            } catch (e: Exception) {
                Log.w(TAG, "Failed to send nav height: ${e.message}")
            }
        }
    }

    override fun onDestroy() {
        extensionPort = null
        stopService(Intent(this, MediaForegroundService::class.java))
        geckoSession?.close()
        geckoView = null
        geckoSession = null
        instance = null
        super.onDestroy()
    }
}
