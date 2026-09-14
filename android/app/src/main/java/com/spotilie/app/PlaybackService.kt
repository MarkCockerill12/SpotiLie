package com.spotilie.app

import android.annotation.SuppressLint
import android.bluetooth.BluetoothClass
import android.bluetooth.BluetoothDevice
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.media.AudioManager
import android.os.Build
import android.os.Looper
import android.util.Log
import androidx.core.content.IntentCompat
import androidx.media3.common.util.UnstableApi
import androidx.media3.session.DefaultMediaNotificationProvider
import androidx.media3.session.MediaSession
import androidx.media3.session.MediaSessionService

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
                MainActivity.instance?.sendMediaAction("pause", 0L)
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
                MainActivity.instance?.sendMediaAction("pause", 0L)
            }
        }
    }

    override fun onCreate() {
        super.onCreate()

        val webPlayer = WebPlayer(Looper.getMainLooper()).apply {
            actionSink = { action, arg -> MainActivity.instance?.sendMediaAction(action, arg) }
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

    private fun receiverFlags(): Int =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) Context.RECEIVER_EXPORTED else 0

    /** Called from [MainActivity] when the injector reports a track change. */
    fun updateMetadata(
        title: String,
        artist: String,
        artworkUrl: String?,
        isPlaying: Boolean,
        durationMs: Long,
        positionMs: Long
    ) {
        player?.updateFromWeb(title, artist, artworkUrl, isPlaying, durationMs, positionMs)
    }

    /** Whether the web player last reported that it is playing. */
    fun isWebPlaying(): Boolean = player?.isPlayingNow() == true

    /** The web player's process died and is being rebuilt; stop claiming it plays. */
    fun onWebPlayerReset() {
        player?.markPaused()
    }

    override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaSession? = mediaSession

    /**
     * Swiping the app away kills playback instantly. Gecko keeps audio decoding in
     * the same process, so stopping the session isn't enough on its own.
     */
    override fun onTaskRemoved(rootIntent: Intent?) {
        Log.d(TAG, "Task removed — killing playback")
        MainActivity.instance?.stopSession()
        stopSelf()
        super.onTaskRemoved(rootIntent)
        android.os.Process.killProcess(android.os.Process.myPid())
    }

    override fun onDestroy() {
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

        @Volatile
        var instance: PlaybackService? = null
            private set
    }
}
