package com.spotilie.app

import android.annotation.SuppressLint
import android.bluetooth.BluetoothClass
import android.bluetooth.BluetoothDevice
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.media.AudioManager
import android.net.wifi.WifiManager
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import android.util.Log
import androidx.core.content.IntentCompat
import androidx.media3.common.util.UnstableApi
import androidx.media3.session.CommandButton
import androidx.media3.session.DefaultMediaNotificationProvider
import androidx.media3.session.MediaSession
import androidx.media3.session.MediaSessionService
import androidx.media3.session.SessionCommand
import androidx.media3.session.SessionResult
import com.google.common.util.concurrent.Futures
import com.google.common.util.concurrent.ListenableFuture

/**
 * Hosts the media session. media3 builds the MediaStyle notification, loads
 * artwork, publishes the seek bar, and exposes the session to Bluetooth,
 * Android Auto and Wear — none of which we have to write by hand.
 *
 * The service is promoted to foreground automatically while the player reports
 * playing, which is what keeps Gecko's audio alive in the background.
 */
@UnstableApi
class PlaybackService : MediaSessionService() {

    private var mediaSession: MediaSession? = null
    private var player: WebPlayer? = null

    /** Headphones unplugged / A2DP dropped — pause rather than blast out loud. */
    private val becomingNoisyReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == AudioManager.ACTION_AUDIO_BECOMING_NOISY) {
                Log.d(TAG, "Audio becoming noisy — pausing")
                PlayerHost.sendMediaAction("pause")
            }
        }
    }

    /**
     * Backup for TWS earbuds, which sometimes drop ACL without going noisy.
     *
     * Only for audio devices: this broadcast fires for *every* Bluetooth device,
     * so a watch or fitness band walking out of range used to pause the music.
     * If the device class can't be read (BLUETOOTH_CONNECT not granted), stay
     * out of it — ACTION_AUDIO_BECOMING_NOISY above still covers audio routes.
     */
    private val bluetoothDisconnectReceiver = object : BroadcastReceiver() {
        @SuppressLint("MissingPermission")
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action != BluetoothDevice.ACTION_ACL_DISCONNECTED) return
            val device = IntentCompat.getParcelableExtra(
                intent, BluetoothDevice.EXTRA_DEVICE, BluetoothDevice::class.java
            )
            val isAudio = try {
                device?.bluetoothClass?.majorDeviceClass == BluetoothClass.Device.Major.AUDIO_VIDEO
            } catch (_: SecurityException) {
                false
            }
            if (isAudio) {
                Log.d(TAG, "Bluetooth audio device disconnected — pausing")
                PlayerHost.sendMediaAction("pause")
            }
        }
    }

    override fun onCreate() {
        super.onCreate()
        PlayerHost.init(this)

        val webPlayer = WebPlayer(Looper.getMainLooper()).apply {
            actionSink = { action, arg ->
                // Hold the locks from the press: a headless rebuild with the screen
                // off has to load the page before it reports playing.
                if (action == "play") setPlaybackLocks(true)
                PlayerHost.sendMediaAction(action, arg)
            }
            // After a process restart there is no page yet: show the last track
            // (paused) so the lock screen, notification and earbuds have something
            // to resume — play builds the player headless and continues.
            PlayerHost.store.load()?.let {
                restore(it.title, it.artist, it.artwork, it.durationMs, it.positionMs)
            }
            // The notification's save button mirrors Spotify's save state.
            onModesChanged = { m ->
                mediaSession?.setMediaButtonPreferences(saveButtons(m.saved == 1))
            }
        }
        player = webPlayer
        instance = this

        setMediaNotificationProvider(
            DefaultMediaNotificationProvider.Builder(this).build().apply {
                setSmallIcon(R.drawable.ic_spotilie_notification)
            }
        )

        mediaSession = MediaSession.Builder(this, webPlayer)
            .setId("SpotiLIE")
            .setSessionActivity(
                android.app.PendingIntent.getActivity(
                    this,
                    0,
                    Intent(this, MainActivity::class.java),
                    android.app.PendingIntent.FLAG_IMMUTABLE
                )
            )
            .setCallback(sessionCallback)
            .setMediaButtonPreferences(saveButtons(saved = false))
            .build()
            .also { session ->
                /*
                 * Without this there is no media notification and the service is
                 * never promoted to foreground. media3's notification manager only
                 * tracks sessions that were added to the service — either returned
                 * from onGetSession() to a binding controller, or added here.
                 * Nothing binds to us (the system UI only reads the platform
                 * session), so the session was built but never shown, and a
                 * backgrounded app with no foreground service is fair game for
                 * Samsung's app freezer: playback stopped and the websocket dropped.
                 */
                addSession(session)
            }

        registerReceiver(
            becomingNoisyReceiver,
            IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY),
            receiverFlags()
        )
        try {
            registerReceiver(
                bluetoothDisconnectReceiver,
                IntentFilter(BluetoothDevice.ACTION_ACL_DISCONNECTED),
                receiverFlags()
            )
        } catch (e: Exception) {
            Log.w(TAG, "Could not register BT ACL receiver: ${e.message}")
        }
    }

    // ── Notification save (like) button ─────────────────────────────────────

    private val saveCommand = SessionCommand(COMMAND_SAVE, Bundle.EMPTY)

    /**
     * Spotify's own "+" / "✓": + saves to Liked Songs, ✓ removes it again.
     *
     * SLOT_OVERFLOW, not SLOT_FORWARD_SECONDARY: media3 1.10 only turns overflow
     * buttons into platform custom actions when back/forward are taken by
     * previous/next — a secondary-slot button never reached the notification
     * or the lock screen (verified: platform `custom actions=[]`).
     */
    private fun saveButtons(saved: Boolean): List<CommandButton> = listOf(
        CommandButton.Builder(if (saved) CommandButton.ICON_CHECK_CIRCLE_FILLED else CommandButton.ICON_PLUS_CIRCLE_UNFILLED)
            .setDisplayName(if (saved) "Remove from Liked Songs" else "Save to Liked Songs")
            .setSessionCommand(saveCommand)
            .setSlots(CommandButton.SLOT_OVERFLOW)
            .build()
    )

    private val sessionCallback = object : MediaSession.Callback {
        override fun onConnect(
            session: MediaSession,
            controller: MediaSession.ControllerInfo
        ): MediaSession.ConnectionResult {
            return MediaSession.ConnectionResult.AcceptedResultBuilder(session)
                .setAvailableSessionCommands(
                    MediaSession.ConnectionResult.DEFAULT_SESSION_COMMANDS.buildUpon()
                        .add(saveCommand)
                        .build()
                )
                .build()
        }

        override fun onCustomCommand(
            session: MediaSession,
            controller: MediaSession.ControllerInfo,
            customCommand: SessionCommand,
            args: Bundle
        ): ListenableFuture<SessionResult> {
            if (customCommand.customAction == COMMAND_SAVE) {
                // Toggle Liked Songs for the current track.
                PlayerHost.sendMediaAction("like-toggle")
                return Futures.immediateFuture(SessionResult(SessionResult.RESULT_SUCCESS))
            }
            return super.onCustomCommand(session, controller, customCommand, args)
        }
    }

    /** From [PlayerHost] with each metadata report. */
    fun updateModes(modes: WebPlayer.Modes) {
        player?.updateModes(modes)
    }

    private fun receiverFlags(): Int =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) Context.RECEIVER_EXPORTED else 0

    /** Called from [PlayerHost] when the injector reports a track change. */
    fun updateMetadata(
        title: String,
        artist: String,
        artworkUrl: String?,
        isPlaying: Boolean,
        durationMs: Long,
        positionMs: Long
    ) {
        player?.updateFromWeb(title, artist, artworkUrl, isPlaying, durationMs, positionMs)
        setPlaybackLocks(isPlaying)
    }

    // ── Wake / Wi-Fi locks ───────────────────────────────────────────────────

    /*
     * We don't own the audio pipeline, so nothing did what ExoPlayer's
     * WAKE_MODE_NETWORK does for a native player. With the screen off:
     *  - Wi-Fi drops into power-save, and Spotify's MediaSource segment fetches
     *    and dealer websocket stall or time out ("loses connection");
     *  - the CPU may suspend in any silent gap — between tracks, during an ad
     *    break, while rebuffering — when AudioFlinger isn't holding it awake,
     *    and the next stream never gets fetched.
     * Held while playing, plus a grace period after a pause so track changes
     * and ad transitions (which briefly report paused) don't let go.
     */
    private val wakeLock: PowerManager.WakeLock by lazy {
        (getSystemService(Context.POWER_SERVICE) as PowerManager)
            .newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "SpotiLIE:playback")
            .apply { setReferenceCounted(false) }
    }

    @Suppress("DEPRECATION")
    private val wifiLock: WifiManager.WifiLock? by lazy {
        (applicationContext.getSystemService(Context.WIFI_SERVICE) as? WifiManager)
            ?.createWifiLock(WifiManager.WIFI_MODE_FULL_HIGH_PERF, "SpotiLIE:playback")
            ?.apply { setReferenceCounted(false) }
    }

    private val lockHandler = Handler(Looper.getMainLooper())
    private val releaseLocks = Runnable {
        try { if (wakeLock.isHeld) wakeLock.release() } catch (_: Exception) {}
        try { wifiLock?.let { if (it.isHeld) it.release() } } catch (_: Exception) {}
        Log.d(TAG, "Playback locks released")
    }

    @SuppressLint("WakelockTimeout")
    private fun setPlaybackLocks(playing: Boolean) {
        if (playing) {
            lockHandler.removeCallbacks(releaseLocks)
            try {
                if (!wakeLock.isHeld) {
                    wakeLock.acquire()
                    Log.d(TAG, "Playback locks acquired")
                }
                wifiLock?.let { if (!it.isHeld) it.acquire() }
            } catch (e: Exception) {
                Log.w(TAG, "Could not acquire playback locks: ${e.message}")
            }
        } else if (wakeLock.isHeld) {
            lockHandler.removeCallbacks(releaseLocks)
            lockHandler.postDelayed(releaseLocks, LOCK_GRACE_MS)
        }
    }

    /** Whether the web player last reported that it is playing. */
    fun isWebPlaying(): Boolean = player?.isPlayingNow() == true

    /** The web player's process died and is being rebuilt; stop claiming it plays. */
    fun onWebPlayerReset() {
        // Mid-song kill: keep showing playing (and keep the locks) while it rebuilds.
        if (PlayerHost.resumePending()) return
        player?.markPaused()
        // Keep the locks through the grace period.
        setPlaybackLocks(false)
    }

    override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaSession? = mediaSession

    /**
     * Swiping the app away kills playback instantly. Gecko keeps audio decoding in
     * the same process, so stopping the session isn't enough on its own.
     */
    override fun onTaskRemoved(rootIntent: Intent?) {
        Log.d(TAG, "Task removed — killing playback")
        PlayerHost.stop()
        stopSelf()
        super.onTaskRemoved(rootIntent)
        android.os.Process.killProcess(android.os.Process.myPid())
    }

    override fun onDestroy() {
        lockHandler.removeCallbacks(releaseLocks)
        releaseLocks.run()
        try { unregisterReceiver(becomingNoisyReceiver) } catch (_: Exception) {}
        try { unregisterReceiver(bluetoothDisconnectReceiver) } catch (_: Exception) {}
        mediaSession?.release()
        mediaSession = null
        player = null
        instance = null
        super.onDestroy()
    }

    companion object {
        private const val TAG = "SpotiLIE"
        const val COMMAND_SAVE = "spotilie.SAVE"

        /** Locks outlive a pause by this much: covers track changes, ad breaks, rebuffers. */
        private const val LOCK_GRACE_MS = 2L * 60 * 1000

        @Volatile
        var instance: PlaybackService? = null
            private set
    }
}
