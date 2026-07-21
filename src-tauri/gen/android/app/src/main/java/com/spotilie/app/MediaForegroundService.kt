package com.spotilie.app

import android.app.*
import android.bluetooth.BluetoothDevice
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.media.AudioManager
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import android.support.v4.media.MediaMetadataCompat
import android.support.v4.media.session.MediaSessionCompat
import android.support.v4.media.session.PlaybackStateCompat
import androidx.core.app.NotificationCompat
import android.util.Log

class MediaForegroundService : Service() {
    private var wakeLock: PowerManager.WakeLock? = null
    private var mediaSession: MediaSessionCompat? = null
    private var currentIsPlaying: Boolean = false

    override fun onBind(intent: Intent?): IBinder? = null

    // ── BroadcastReceiver: Bluetooth / headphone disconnect ──────────
    private val noisyAudioReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == AudioManager.ACTION_AUDIO_BECOMING_NOISY) {
                Log.d("SpotiLIE", "Audio becoming noisy — pausing")
                MainActivity.instance?.handleMediaAction("pause")
            }
        }
    }

    // ── BroadcastReceiver: Bluetooth ACL disconnect (backup) ─────────
    private val bluetoothDisconnectReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == BluetoothDevice.ACTION_ACL_DISCONNECTED) {
                Log.d("SpotiLIE", "Bluetooth ACL disconnected — pausing playback")
                MainActivity.instance?.handleMediaAction("pause")
            }
        }
    }

    override fun onCreate() {
        super.onCreate()
        Log.d("SpotiLIE", "MediaForegroundService onCreate")
        createNotificationChannel()

        // Setup MediaSession for hardware / BT / OS media keys
        mediaSession = MediaSessionCompat(this, "SpotiLIEMediaSession").apply {
            setCallback(object : MediaSessionCompat.Callback() {
                override fun onPlay() { MainActivity.instance?.handleMediaAction("play") }
                override fun onPause() { MainActivity.instance?.handleMediaAction("pause") }
                override fun onSkipToNext() { MainActivity.instance?.handleMediaAction("next") }
                override fun onSkipToPrevious() { MainActivity.instance?.handleMediaAction("prev") }
            })
            isActive = true
        }

        // REQUIRED on Android 12+: Call startForeground in onCreate to prevent ForegroundServiceDidNotStartInTimeException
        val notification = createNotification("SpotiLIE", "Ready", false)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(1, notification, android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK)
        } else {
            startForeground(1, notification)
        }

        // Register headphone/bluetooth disconnect receiver
        val noisyFilter = IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(noisyAudioReceiver, noisyFilter, Context.RECEIVER_EXPORTED)
        } else {
            registerReceiver(noisyAudioReceiver, noisyFilter)
        }

        try {
            val btFilter = IntentFilter(BluetoothDevice.ACTION_ACL_DISCONNECTED)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                registerReceiver(bluetoothDisconnectReceiver, btFilter, Context.RECEIVER_EXPORTED)
            } else {
                registerReceiver(bluetoothDisconnectReceiver, btFilter)
            }
        } catch (e: Exception) {
            Log.w("SpotiLIE", "Could not register BT ACL receiver: ${e.message}")
        }

        val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "SpotiLIE::BackgroundPlayback")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action
        Log.d("SpotiLIE", "Service onStartCommand action=$action")

        when (action) {
            ACTION_PLAY -> MainActivity.instance?.handleMediaAction("play")
            ACTION_PAUSE -> MainActivity.instance?.handleMediaAction("pause")
            ACTION_NEXT -> MainActivity.instance?.handleMediaAction("next")
            ACTION_PREV -> MainActivity.instance?.handleMediaAction("prev")
            ACTION_TOGGLE -> {
                val act = if (currentIsPlaying) "pause" else "play"
                MainActivity.instance?.handleMediaAction(act)
            }
            ACTION_UPDATE_MEDIA -> {
                val title = intent.getStringExtra("title") ?: "SpotiLIE"
                val artist = intent.getStringExtra("artist") ?: "Active"
                val isPlaying = intent.getBooleanExtra("isPlaying", false)
                currentIsPlaying = isPlaying

                updateMetadata(title, artist, isPlaying)

                val notification = createNotification(title, artist, isPlaying)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    startForeground(1, notification, android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK)
                } else {
                    startForeground(1, notification)
                }
            }
        }
        return START_STICKY
    }

    private fun renewWakeLock() {
        wakeLock?.let {
            if (it.isHeld) it.release()
            it.acquire(10 * 60 * 1000L)
        }
    }

    private fun updateMetadata(title: String, artist: String, isPlaying: Boolean) {
        renewWakeLock()
        mediaSession?.let { session ->
            session.setMetadata(
                MediaMetadataCompat.Builder()
                    .putString(MediaMetadataCompat.METADATA_KEY_TITLE, title)
                    .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, artist)
                    .build()
            )

            val state = if (isPlaying) PlaybackStateCompat.STATE_PLAYING else PlaybackStateCompat.STATE_PAUSED
            session.setPlaybackState(
                PlaybackStateCompat.Builder()
                    .setState(state, PlaybackStateCompat.PLAYBACK_POSITION_UNKNOWN, 1.0f)
                    .setActions(
                        PlaybackStateCompat.ACTION_PLAY or
                        PlaybackStateCompat.ACTION_PAUSE or
                        PlaybackStateCompat.ACTION_PLAY_PAUSE or
                        PlaybackStateCompat.ACTION_SKIP_TO_NEXT or
                        PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS
                    )
                    .build()
            )
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val serviceChannel = NotificationChannel(
                CHANNEL_ID,
                "Background Playback",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(serviceChannel)
        }
    }

    // ── Build PendingIntent targeting this Service directly for button actions ──────
    private fun buildActionPendingIntent(action: String, requestCode: Int): PendingIntent {
        val intent = Intent(this, MediaForegroundService::class.java).apply {
            this.action = action
        }
        val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }
        return PendingIntent.getService(this, requestCode, intent, flags)
    }

    private fun createNotification(title: String, artist: String, isPlaying: Boolean): Notification {
        val notificationIntent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, notificationIntent,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
        )

        val prevPendingIntent = buildActionPendingIntent(ACTION_PREV, 1)
        val togglePendingIntent = buildActionPendingIntent(ACTION_TOGGLE, 2)
        val nextPendingIntent = buildActionPendingIntent(ACTION_NEXT, 3)

        val playPauseIcon = if (isPlaying) R.drawable.ic_pause else R.drawable.ic_play
        val playPauseLabel = if (isPlaying) "Pause" else "Play"

        val builder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(artist)
            .setSmallIcon(android.R.drawable.stat_sys_headset)
            .setContentIntent(pendingIntent)
            .setOngoing(isPlaying)
            .setSilent(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setCategory(NotificationCompat.CATEGORY_TRANSPORT)
            .addAction(R.drawable.ic_skip_previous, "Previous", prevPendingIntent)
            .addAction(playPauseIcon, playPauseLabel, togglePendingIntent)
            .addAction(R.drawable.ic_skip_next, "Next", nextPendingIntent)
            .setStyle(androidx.media.app.NotificationCompat.MediaStyle()
                .setMediaSession(mediaSession?.sessionToken)
                .setShowActionsInCompactView(0, 1, 2))

        val notification = builder.build()
        if (isPlaying) {
            notification.flags = notification.flags or Notification.FLAG_ONGOING_EVENT or Notification.FLAG_NO_CLEAR
        } else {
            notification.flags = notification.flags and (Notification.FLAG_ONGOING_EVENT or Notification.FLAG_NO_CLEAR).inv()
        }
        return notification
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        Log.d("SpotiLIE", "Task removed — stopping playback and killing process")
        super.onTaskRemoved(rootIntent)
        try {
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.cancel(1)
        } catch (_: Exception) {}
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_REMOVE)
        } else {
            @Suppress("DEPRECATION")
            stopForeground(true)
        }
        stopSelf()
        android.os.Process.killProcess(android.os.Process.myPid())
    }

    override fun onDestroy() {
        Log.d("SpotiLIE", "SERVICE_ON_DESTROY")
        mediaSession?.release()
        wakeLock?.let { if (it.isHeld) it.release() }
        try { unregisterReceiver(noisyAudioReceiver) } catch (e: Exception) {}
        try { unregisterReceiver(bluetoothDisconnectReceiver) } catch (e: Exception) {}
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_REMOVE)
        } else {
            @Suppress("DEPRECATION")
            stopForeground(true)
        }
        super.onDestroy()
    }

    companion object {
        const val CHANNEL_ID = "SpotiLIE_Playback"
        const val ACTION_UPDATE_MEDIA = "com.spotilie.app.UPDATE_MEDIA"
        const val ACTION_PLAY = "com.spotilie.app.PLAY"
        const val ACTION_PAUSE = "com.spotilie.app.PAUSE"
        const val ACTION_NEXT = "com.spotilie.app.NEXT"
        const val ACTION_PREV = "com.spotilie.app.PREV"
        const val ACTION_TOGGLE = "com.spotilie.app.TOGGLE"
    }
}
