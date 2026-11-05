package com.spotilie.app

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.media3.common.util.UnstableApi
import org.mozilla.geckoview.GeckoView

/**
 * The screen. The web player itself lives in [PlayerHost] and outlives this
 * Activity — closing, recreating or losing the Activity no longer touches the
 * music, and coming back reattaches the live page instead of reloading it.
 */
@UnstableApi
class MainActivity : AppCompatActivity() {

    private var geckoView: GeckoView? = null

    /** Battery exemption is asked after this settles, so the two prompts don't stack. */
    private val notificationPermission =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) {
            maybeRequestBatteryExemption()
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        PlayerHost.init(this)

        setupEdgeToEdge()
        if (!maybeRequestNotificationPermission()) maybeRequestBatteryExemption()

        startService(Intent(this, PlaybackService::class.java))

        val view = GeckoView(this)
        geckoView = view
        val root = FrameLayout(this)
        root.addView(view, FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT
        ))
        nowPlaying = NowPlayingUi(this, root)
        setContentView(root)
        PlayerHost.attachView(view)

        installBackHandler()
    }

    private var nowPlaying: NowPlayingUi? = null

    override fun onStart() {
        super.onStart()
        PlayerHost.setUiVisible(true)
        nowPlaying?.connect()
    }

    override fun onStop() {
        nowPlaying?.disconnect()
        PlayerHost.setUiVisible(false)
        super.onStop()
    }

    override fun onDestroy() {
        geckoView?.let { PlayerHost.detachView(it) }
        geckoView = null
        super.onDestroy()
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
            val navDp = (maxOf(bottom, (28 * density).toInt()) / density).toInt()
            PlayerHost.setNavBarHeight(navDp)
            nowPlaying?.setInsets(navDp, insets.isVisible(WindowInsetsCompat.Type.ime()))
            insets
        }
    }

    /**
     * Android 13+ hides the media notification — and with it the lock-screen and
     * shade controls — until POST_NOTIFICATIONS is granted. Asked once.
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

    /** Ask once, not on every cold start. */
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

    /** Back closes overlays, then navigates the player, then leaves the app. */
    private fun installBackHandler() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (nowPlaying?.handleBack() == true) return
                if (PlayerHost.overlayOpen) {
                    PlayerHost.closeOverlay()
                    return
                }
                if (PlayerHost.goBack()) return
                isEnabled = false
                onBackPressedDispatcher.onBackPressed()
                isEnabled = true
            }
        })
    }

    private companion object {
        const val PREFS = "spotilie"
        const val KEY_BATTERY_ASKED = "battery_exemption_asked"
        const val KEY_NOTIFICATIONS_ASKED = "notifications_asked"
    }
}
