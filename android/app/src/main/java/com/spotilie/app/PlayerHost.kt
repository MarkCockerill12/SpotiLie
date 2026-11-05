package com.spotilie.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.util.Base64
import android.util.Log
import androidx.core.content.ContextCompat
import androidx.media3.common.util.UnstableApi
import org.json.JSONObject
import org.mozilla.geckoview.AllowOrDeny
import org.mozilla.geckoview.GeckoResult
import org.mozilla.geckoview.GeckoRuntime
import org.mozilla.geckoview.GeckoSession
import org.mozilla.geckoview.GeckoSessionSettings
import org.mozilla.geckoview.GeckoView
import org.mozilla.geckoview.WebExtension
import org.mozilla.geckoview.WebRequestError

/**
 * Owns the web player: the Gecko runtime, the Spotify page session, the
 * extension bridge, crash recovery and auto-resume.
 *
 * App-scoped, like a native player service, rather than living inside the
 * Activity. Before this, anything that destroyed the Activity took the player
 * with it, and after a process restart (verified on device: the system brought
 * the media service back with no Activity) play from earbuds, the lock screen
 * or the notification went to `MainActivity.instance?` = null and did nothing.
 * Now the service can build the player headless, and the Activity just attaches
 * its view to whatever session exists — no reload when it comes back.
 *
 * Main-thread only.
 */
@UnstableApi
object PlayerHost {

    private const val TAG = "SpotiLIE"
    private const val SPOTIFY_URL = "https://open.spotify.com"

    private val main = Handler(Looper.getMainLooper())
    private lateinit var app: Context
    lateinit var store: PlayerStateStore
        private set

    private var runtime: GeckoRuntime? = null
    private var extensionReady = false
    private val onExtensionReady = ArrayList<() -> Unit>()

    var session: GeckoSession? = null
        private set
    private var attachedView: GeckoView? = null

    /** The page has reported metadata since this session opened — it can take commands. */
    private var pageAlive = false

    /** An Activity is on screen (between onStart and onStop). */
    private var uiVisible = false

    var canGoBack = false
        private set

    /** The open MenuSheet (Spotify's track menu, mirrored). */
    var menuListener: ((JSONObject) -> Unit)? = null

    /** Share → Copy link: the on-screen UI opens Android's share sheet with it. */
    var shareListener: ((String) -> Unit)? = null
    var overlayOpen = false

    @Volatile
    private var extensionPort: WebExtension.Port? = null
    private var navBarHeightCssPx = 0

    private var lastSpotifyUrl = SPOTIFY_URL
    private var showingOfflinePage = false
    private var lastReloadAt = 0L
    private val recoveryTimes = ArrayDeque<Long>()

    /** Resume playback as soon as the (re)built page reports its track, until then. */
    private var resumeUntil = 0L
    private var seekTarget: Pair<String, Long>? = null

    // Last report from the page, for resuming at the right spot.
    private var lastTitle = ""
    private var lastPositionMs = 0L
    private var lastReportAt = 0L
    private var lastPlaying = false
    private var lastResumeAttemptAt = 0L

    // ── Lifecycle ────────────────────────────────────────────────────────────

    fun init(context: Context) {
        if (::app.isInitialized) return
        app = context.applicationContext
        store = PlayerStateStore(app)
        store.lastUrl?.takeIf { it.startsWith(SPOTIFY_URL) }?.let { lastSpotifyUrl = it }
        registerNetworkCallback()
        if (BuildConfig.INJECTOR_DEBUG) registerDebugReceiver()
        main.postDelayed(checkpointPosition, POSITION_CHECKPOINT_MS)
    }

    /** Save where playback is every few seconds, so a process death resumes close by. */
    private val checkpointPosition = object : Runnable {
        override fun run() {
            if (lastPlaying) currentPosition()?.let { store.savePosition(it.second) }
            main.postDelayed(this, POSITION_CHECKPOINT_MS)
        }
    }

    /** The Activity's view. Attaches the live session, building one if needed. */
    fun attachView(view: GeckoView) {
        attachedView = view
        val existing = session
        if (existing != null) view.setSession(existing) else ensurePlayer()
    }

    fun detachView(view: GeckoView) {
        if (attachedView !== view) return
        // Release, never close: the session (and the music) outlives the screen.
        view.releaseSession()
        attachedView = null
    }

    fun setUiVisible(visible: Boolean) {
        uiVisible = visible
        main.removeCallbacks(keepPlayingInBackground)
        if (visible) {
            ensurePlayer()
        } else {
            // GeckoView deactivates the session when its surface is torn down,
            // around onStop. Re-activate after it has gone, and again in case
            // the teardown lands late. See TECHNICAL_SPECS §7a-2.
            main.postDelayed(keepPlayingInBackground, 300)
            main.postDelayed(keepPlayingInBackground, 1500)
        }
    }

    private val keepPlayingInBackground = Runnable {
        if (PlaybackService.instance?.isWebPlaying() == true || resumePending()) {
            session?.setActive(true)
        }
    }

    /** Swipe-away from Recents. */
    fun stop() {
        try { session?.stop() } catch (_: Exception) {}
    }

    // ── Engine + session ─────────────────────────────────────────────────────

    private fun ensureRuntime(): GeckoRuntime {
        runtime?.let { return it }
        val rt = Engine.createRuntime(app)
        runtime = rt
        rt.webExtensionController.ensureBuiltIn(Engine.EXT_PATH, Engine.EXT_ID).then({ ext ->
            ext?.setMessageDelegate(portDelegate, Engine.PORT_NAME)
            main.post { markExtensionReady() }
            GeckoResult.fromValue(null)
        }, { err ->
            Log.e(TAG, "WebExtension registration failed: ${err.message}")
            main.post { markExtensionReady() }
            GeckoResult.fromValue(null)
        })
        Engine.ensureAdBlocker(rt, app)
        return rt
    }

    private fun markExtensionReady() {
        extensionReady = true
        val pending = onExtensionReady.toList()
        onExtensionReady.clear()
        pending.forEach { it() }
    }

    /** Build the player if there isn't one. Safe to call repeatedly. */
    fun ensurePlayer() {
        if (session != null) return
        ensureRuntime()
        // Register the extension before loading, so the page never runs
        // without the injector attached.
        if (!extensionReady) {
            if (onExtensionReady.isEmpty()) onExtensionReady.add { if (session == null) openSession(lastSpotifyUrl) }
            return
        }
        openSession(lastSpotifyUrl)
    }

    private fun openSession(url: String) {
        val rt = ensureRuntime()
        val s = GeckoSession(
            GeckoSessionSettings.Builder()
                .usePrivateMode(false)
                // Document load only — see the progress delegate.
                .userAgentOverride(Engine.DESKTOP_FIREFOX_UA)
                // NOT VIEWPORT_MODE_DESKTOP: desktop feature detection, phone-width layout.
                .build()
        )
        session = s
        pageAlive = false
        installDelegates(s)

        s.open(rt)
        // Keeps the content process on a foreground binding while we are.
        s.setPriorityHint(GeckoSession.PRIORITY_HIGH)
        attachedView?.setSession(s)
        if (attachedView == null || resumePending()) s.setActive(true)
        s.settings.userAgentOverride = Engine.DESKTOP_FIREFOX_UA
        s.loadUri(url)
        Log.i(TAG, "Web player opened (${if (attachedView == null) "headless" else "with view"})")
    }

    private fun installDelegates(s: GeckoSession) {
        // Widevine needs a media-key grant; nothing else is ever requested.
        s.permissionDelegate = object : GeckoSession.PermissionDelegate {
            override fun onContentPermissionRequest(
                session: GeckoSession,
                perm: GeckoSession.PermissionDelegate.ContentPermission
            ): GeckoResult<Int> =
                GeckoResult.fromValue(GeckoSession.PermissionDelegate.ContentPermission.VALUE_ALLOW)
        }

        /*
         * The UA override must be live for the top-level document (Spotify serves
         * different HTML to desktop) but gone before API calls: GeckoView sends it
         * as an author header, which drags `user-agent` into every CORS preflight
         * and Spotify rejects them all. Set per navigation, cleared on page start;
         * the injector spoofs navigator.userAgent from there. TECHNICAL_SPECS §2.
         */
        s.progressDelegate = object : GeckoSession.ProgressDelegate {
            override fun onPageStart(session: GeckoSession, url: String) {
                session.settings.userAgentOverride = null
            }
        }

        s.navigationDelegate = object : GeckoSession.NavigationDelegate {
            override fun onCanGoBack(session: GeckoSession, canGoBack: Boolean) {
                if (session === this@PlayerHost.session) this@PlayerHost.canGoBack = canGoBack
            }

            override fun onLocationChange(
                session: GeckoSession,
                url: String?,
                perms: List<GeckoSession.PermissionDelegate.ContentPermission>,
                hasUserGesture: Boolean
            ) {
                if (url != null && url.startsWith(SPOTIFY_URL)) {
                    lastSpotifyUrl = url
                    store.lastUrl = url
                    showingOfflinePage = false
                }
            }

            override fun onLoadRequest(
                session: GeckoSession,
                request: GeckoSession.NavigationDelegate.LoadRequest
            ): GeckoResult<AllowOrDeny>? {
                session.settings.userAgentOverride = Engine.DESKTOP_FIREFOX_UA
                return null
            }

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

        s.contentDelegate = object : GeckoSession.ContentDelegate {
            override fun onCrash(session: GeckoSession) {
                Log.e(TAG, "Content process crashed")
                recoverSession(session, "crash")
            }

            override fun onKill(session: GeckoSession) {
                Log.w(TAG, "Content process killed")
                recoverSession(session, "kill")
            }
        }
    }

    // ── Recovery ─────────────────────────────────────────────────────────────

    private fun recoverSession(dead: GeckoSession, reason: String) {
        main.post {
            if (dead !== session) return@post

            val wasPlaying = PlaybackService.instance?.isWebPlaying() == true
            // Killed mid-song (LMK under pressure): bring the music back. Set before
            // the reset so the notification keeps showing "playing" through the
            // rebuild — dropping out of foreground and back is not always allowed.
            if (wasPlaying) requestResume(currentPosition())

            if (attachedView?.session === dead) attachedView?.releaseSession()
            try { dead.close() } catch (_: Exception) {}
            session = null
            pageAlive = false
            PlaybackService.instance?.onWebPlayerReset()

            /*
             * Backgrounded and paused: the low-memory killer reclaiming a cached
             * app. Reloading the ~400 MB page straight away only got it killed
             * again a minute later (verified on device), so wait until the user
             * returns or presses play — both call ensurePlayer().
             */
            if (!uiVisible && !wasPlaying) {
                Log.w(TAG, "Web player $reason while idle in background — deferring rebuild")
                return@post
            }

            val now = SystemClock.elapsedRealtime()
            while (recoveryTimes.isNotEmpty() && now - recoveryTimes.first() > RECOVERY_WINDOW_MS) {
                recoveryTimes.removeFirst()
            }
            recoveryTimes.addLast(now)
            val delayMs = RECOVERY_BACKOFF_MS[minOf(recoveryTimes.size - 1, RECOVERY_BACKOFF_MS.lastIndex)]
            Log.w(TAG, "Recovering web player after $reason in ${delayMs}ms (#${recoveryTimes.size})")
            main.postDelayed({ ensurePlayer() }, delayMs)
        }
    }

    /** Reload Spotify, re-arming the desktop UA first (a page `location.reload()` can't). */
    private fun reloadSpotify(reason: String) {
        main.post {
            val s = session ?: return@post
            val now = SystemClock.elapsedRealtime()
            if (now - lastReloadAt < MIN_RELOAD_INTERVAL_MS) return@post
            lastReloadAt = now
            Log.w(TAG, "Reloading Spotify: $reason")
            showingOfflinePage = false
            pageAlive = false
            s.settings.userAgentOverride = Engine.DESKTOP_FIREFOX_UA
            s.loadUri(lastSpotifyUrl)
        }
    }

    private fun registerNetworkCallback() {
        val cm = app.getSystemService(ConnectivityManager::class.java) ?: return
        try {
            cm.registerDefaultNetworkCallback(object : ConnectivityManager.NetworkCallback() {
                override fun onCapabilitiesChanged(network: Network, caps: NetworkCapabilities) {
                    if (showingOfflinePage && caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)) {
                        reloadSpotify("network validated")
                    }
                }
            })
        } catch (e: Exception) {
            Log.w(TAG, "Network callback unavailable: ${e.message}")
        }
    }

    // ── Resume ───────────────────────────────────────────────────────────────

    fun resumePending(): Boolean = resumeUntil != 0L

    /**
     * @param seekTo the track and position to land on. A rebuilt page restores the
     * right track but from 0:00 (verified on device after a mid-song kill) — the
     * real app carries on where it was.
     */
    private fun requestResume(seekTo: Pair<String, Long>?) {
        resumeUntil = SystemClock.elapsedRealtime() + RESUME_WINDOW_MS
        lastResumeAttemptAt = 0L
        seekTarget = seekTo?.takeIf { it.first.isNotBlank() }
        main.removeCallbacks(resumeTimeout)
        main.postDelayed(resumeTimeout, RESUME_WINDOW_MS)
    }

    private fun cancelResume() {
        resumeUntil = 0L
        seekTarget = null
        main.removeCallbacks(resumeTimeout)
    }

    /** Where playback was, extrapolated to now — the target for a resume. */
    private fun currentPosition(): Pair<String, Long>? {
        if (lastTitle.isBlank()) return null
        val elapsed = if (lastPlaying) SystemClock.elapsedRealtime() - lastReportAt else 0L
        return lastTitle to lastPositionMs + elapsed
    }

    /** Once the rebuilt page plays the same track, jump back to where it was. */
    private fun maybeRestorePosition(isPlaying: Boolean, title: String, positionMs: Long) {
        val (targetTitle, targetMs) = seekTarget ?: return
        if (!isPlaying || title.isBlank()) return
        seekTarget = null
        if (title != targetTitle) return // Spotify moved on; don't drag it back
        if (targetMs > POSITION_SLACK_MS && positionMs < targetMs - POSITION_SLACK_MS) {
            Log.i(TAG, "Restoring position ${targetMs / 1000}s after rebuild")
            postToPort(JSONObject().apply { put("action", "seek"); put("value", targetMs) })
        }
    }

    /** The rebuild never got back to playing — stop claiming it is. */
    private val resumeTimeout = Runnable {
        if (!resumePending()) return@Runnable
        Log.w(TAG, "Auto-resume gave up")
        cancelResume()
        PlaybackService.instance?.onWebPlayerReset()
    }

    /**
     * A rebuilt page restores the last track paused, and Spotify takes a few
     * seconds before its play button responds — retry until it reports playing.
     */
    private fun maybeResume(isPlaying: Boolean, title: String) {
        if (!resumePending()) return
        if (isPlaying) {
            // Resumed. Not cancelResume(): the seek target is still needed next.
            resumeUntil = 0L
            main.removeCallbacks(resumeTimeout)
            return
        }
        if (title.isBlank()) return
        val now = SystemClock.elapsedRealtime()
        if (now - lastResumeAttemptAt < RESUME_RETRY_MS) return
        lastResumeAttemptAt = now
        Log.i(TAG, "Resuming playback after web player rebuild")
        session?.setActive(true)
        postToPort(JSONObject().apply { put("action", "play"); put("value", 0L) })
    }

    // ── Commands ─────────────────────────────────────────────────────────────

    /** Transport action from the notification, lock screen, Bluetooth, Auto or the native UI. */
    fun sendMediaAction(action: String, arg: Long = 0L, text: String = "") {
        main.post {
            when (action) {
                // An explicit pause (user, noisy audio, BT disconnect) cancels auto-resume.
                "pause" -> cancelResume()
                "play", "toggle" -> {
                    if (session == null || !pageAlive) {
                        // Nothing alive to receive it: build the player and play once
                        // loaded, from where the last track was (saved across process death).
                        requestResume(currentPosition() ?: store.load()?.let { it.title to it.positionMs })
                        ensurePlayer()
                    }
                    // Wake a session left inactive while paused in the background.
                    session?.setActive(true)
                }
            }
            postToPort(JSONObject().apply {
                put("action", action)
                put("value", arg)
                if (text.isNotEmpty()) put("arg", text)
            })
        }
    }

    fun closeOverlay() {
        overlayOpen = false
        postToPort(JSONObject().apply { put("type", "CLOSE_OVERLAY") })
    }

    fun goBack(): Boolean {
        val s = session ?: return false
        if (!canGoBack) return false
        s.goBack()
        return true
    }

    fun setNavBarHeight(cssPx: Int) {
        navBarHeightCssPx = cssPx
        sendNavHeight()
    }

    private fun sendNavHeight() {
        postToPort(JSONObject().apply {
            put("type", "SET_NAV_HEIGHT")
            put("height", maxOf(navBarHeightCssPx, 44))
        })
    }

    // ── Extension bridge ─────────────────────────────────────────────────────

    private val portDelegate = object : WebExtension.MessageDelegate {
        override fun onConnect(port: WebExtension.Port) {
            if (port.name != Engine.PORT_NAME) return
            extensionPort = port
            postToPort(JSONObject().apply {
                put("type", "CONFIG")
                put("debug", BuildConfig.INJECTOR_DEBUG)
            })
            sendNavHeight()
            port.setDelegate(object : WebExtension.PortDelegate {
                override fun onPortMessage(message: Any, port: WebExtension.Port) {
                    main.post { handlePortMessage(message) }
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
                "UPDATE_METADATA" -> onMetadata(json)
                "RELOAD" -> reloadSpotify(json.optString("reason", "injector request"))
                "MENU", "MENU_DONE", "MENU_DIALOG" -> menuListener?.invoke(json)
                // Only while the player screen is up (listener set in onStart); a share
                // sheet must never pop over another app.
                "SHARE_TEXT" -> shareListener?.invoke(json.optString("text"))
                "OVERLAY" -> overlayOpen = json.optBoolean("open", false)
                "DEBUG_DUMP", "PAGE_LOG" ->
                    if (BuildConfig.INJECTOR_DEBUG) logChunked("${json.optString("type")} ${json.optString("text")}")
                else -> if (BuildConfig.INJECTOR_DEBUG) logChunked("port → $json")
            }
        } catch (e: Exception) {
            Log.w(TAG, "Bad port message: ${e.message}")
        }
    }

    private fun onMetadata(json: JSONObject) {
        if (BuildConfig.INJECTOR_DEBUG) logChunked("port → $json")
        pageAlive = true
        val isPlaying = json.optBoolean("isPlaying", false)
        val track = PlayerStateStore.Track(
            title = json.optString("title", ""),
            artist = json.optString("artist", ""),
            artwork = json.optString("artwork", ""),
            durationMs = json.optLong("duration", 0L),
            positionMs = json.optLong("position", 0L),
        )

        // onStop's re-activations can lose to a late surface teardown; every
        // playing report while backgrounded re-asserts it (idempotent).
        if (!uiVisible && isPlaying) session?.setActive(true)

        maybeResume(isPlaying, track.title)
        maybeRestorePosition(isPlaying, track.title, track.positionMs)
        if (track.title.isNotBlank()) {
            lastTitle = track.title
            lastPositionMs = track.positionMs
            lastReportAt = SystemClock.elapsedRealtime()
            lastPlaying = isPlaying
        }
        if (track.title.isNotBlank()) store.save(track, isPlaying)

        PlaybackService.instance?.updateModes(
            WebPlayer.Modes(
                saved = json.optInt("saved", -1),
                repeat = json.optInt("repeat", 0),
                shuffle = json.optInt("shuffle", -1),
            )
        )
        PlaybackService.instance?.updateMetadata(
            title = track.title.ifBlank { "SpotiLIE" },
            artist = track.artist,
            artworkUrl = track.artwork,
            // While a resume is pending, keep reporting playing: the rebuilt page
            // briefly reports its restored track as paused, and flapping the
            // notification out of foreground and back can be refused.
            isPlaying = isPlaying || resumePending(),
            durationMs = track.durationMs,
            positionMs = track.positionMs
        )
    }

    private fun postToPort(json: JSONObject) {
        val port = extensionPort ?: return
        main.post {
            try {
                port.postMessage(json)
            } catch (e: Exception) {
                Log.e(TAG, "Failed to post ${json.optString("type", json.optString("action"))}: ${e.message}")
            }
        }
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
        ContextCompat.registerReceiver(app, object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                val b64 = intent?.getStringExtra("b64") ?: return
                val js = String(Base64.decode(b64, Base64.DEFAULT), Charsets.UTF_8)
                postToPort(JSONObject().apply {
                    put("type", "DEBUG_EVAL")
                    put("js", js)
                })
            }
        }, IntentFilter("com.spotilie.app.DEBUG_EVAL"), ContextCompat.RECEIVER_EXPORTED)
    }

    /** Consecutive crashes inside this window escalate the backoff. */
    private const val RECOVERY_WINDOW_MS = 5L * 60 * 1000
    private val RECOVERY_BACKOFF_MS = longArrayOf(500, 2_000, 5_000, 15_000, 30_000)
    private const val MIN_RELOAD_INTERVAL_MS = 10_000L
    private const val RESUME_WINDOW_MS = 60_000L
    private const val RESUME_RETRY_MS = 4_000L
    /** Don't seek for small drifts; a few seconds back is fine. */
    private const val POSITION_SLACK_MS = 5_000L
    private const val POSITION_CHECKPOINT_MS = 10_000L
}
