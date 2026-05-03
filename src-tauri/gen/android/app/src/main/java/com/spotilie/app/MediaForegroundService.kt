package com.spotilie.app

import android.app.*
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

    // ── BroadcastReceiver: catches notification button taps ──────────
    private val notificationActionReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            val action = intent?.action ?: return
            Log.d("SpotiLIE", "Notification action received: $action")
            when (action) {
                ACTION_UPDATE_MEDIA -> {
                    // Metadata update from Rust/JNI via sendBroadcast
                    val title = intent?.getStringExtra("title") ?: "SpotiLIE"
                    val artist = intent?.getStringExtra("artist") ?: "Active"
                    val isPlaying = intent?.getBooleanExtra("isPlaying", false) ?: false
                    currentIsPlaying = isPlaying
                    updateMetadata(title, artist, isPlaying)
                    val notification = createNotification(title, artist, isPlaying)
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        startForeground(1, notification, android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK)
                    } else {
                        startForeground(1, notification)
                    }
                }
                ACTION_PLAY -> {
                    mediaSession?.controller?.transportControls?.play()
                }
                ACTION_PAUSE -> {
                    mediaSession?.controller?.transportControls?.pause()
                }
                ACTION_NEXT -> {
                    mediaSession?.controller?.transportControls?.skipToNext()
                }
                ACTION_PREV -> {
                    mediaSession?.controller?.transportControls?.skipToPrevious()
                }
                ACTION_TOGGLE -> {
                    // Toggle: if playing → pause, else play
                    if (currentIsPlaying) {
                        mediaSession?.controller?.transportControls?.pause()
                    } else {
                        mediaSession?.controller?.transportControls?.play()
                    }
                }
            }
        }
    }

    // ── BroadcastReceiver: Bluetooth / headphone disconnect ──────────
    private val noisyAudioReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == AudioManager.ACTION_AUDIO_BECOMING_NOISY) {
                Log.d("SpotiLIE", "Audio becoming noisy (headphone disconnect) — pausing")
                MainActivity.instance?.handleMediaAction("pause")
            }
        }
    }

    override fun onCreate() {
        super.onCreate()
        Log.e("SpotiLIE", "SERVICE_ON_CREATE")
        createNotificationChannel()

        // Setup MediaSession
        mediaSession = MediaSessionCompat(this, "SpotiLIEMediaSession").apply {
            setCallback(object : MediaSessionCompat.Callback() {
                override fun onPlay() { MainActivity.instance?.handleMediaAction("play") }
                override fun onPause() { MainActivity.instance?.handleMediaAction("pause") }
                override fun onSkipToNext() { MainActivity.instance?.handleMediaAction("next") }
                override fun onSkipToPrevious() { MainActivity.instance?.handleMediaAction("prev") }
            })
            isActive = true
        }

        // REQUIRED: Immediate startForeground to satisfy Android 12+
        val notification = createNotification("SpotiLIE", "Ready to play", false)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(1, notification, android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK)
        } else {
            startForeground(1, notification)
        }

        // Register notification action receiver (also handles UPDATE_MEDIA from Rust/JNI)
        val actionFilter = IntentFilter().apply {
            addAction(ACTION_UPDATE_MEDIA)
            addAction(ACTION_PLAY)
            addAction(ACTION_PAUSE)
            addAction(ACTION_NEXT)
            addAction(ACTION_PREV)
            addAction(ACTION_TOGGLE)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(notificationActionReceiver, actionFilter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            registerReceiver(notificationActionReceiver, actionFilter)
        }

        // Register headphone/bluetooth disconnect receiver
        // ACTION_AUDIO_BECOMING_NOISY is a system broadcast, needs RECEIVER_EXPORTED
        val noisyFilter = IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(noisyAudioReceiver, noisyFilter, Context.RECEIVER_EXPORTED)
        } else {
            registerReceiver(noisyAudioReceiver, noisyFilter)
        }

        val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "SpotiLIE::BackgroundPlayback")
        wakeLock?.acquire()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_UPDATE_MEDIA) {
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
        return START_STICKY
    }

    private fun updateMetadata(title: String, artist: String, isPlaying: Boolean) {
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

    // ── Build PendingIntent for each notification button action ──────
    private fun buildActionPendingIntent(action: String, requestCode: Int): PendingIntent {
        val intent = Intent(action).apply {
            setPackage(packageName)
        }
        val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }
        return PendingIntent.getBroadcast(this, requestCode, intent, flags)
    }

    private fun createNotification(title: String, artist: String, isPlaying: Boolean): Notification {
        val notificationIntent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, notificationIntent,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
        )

        // Build PendingIntents for each action button
        val prevPendingIntent = buildActionPendingIntent(ACTION_PREV, 1)
        val togglePendingIntent = buildActionPendingIntent(ACTION_TOGGLE, 2)
        val nextPendingIntent = buildActionPendingIntent(ACTION_NEXT, 3)

        val playPauseIcon = if (isPlaying) R.drawable.ic_pause else R.drawable.ic_play
        val playPauseLabel = if (isPlaying) "Pause" else "Play"

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(artist)
            .setSmallIcon(android.R.drawable.stat_sys_headset)
            .setContentIntent(pendingIntent)
            .setOngoing(isPlaying)
            .setSilent(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .addAction(R.drawable.ic_skip_previous, "Previous", prevPendingIntent)
            .addAction(playPauseIcon, playPauseLabel, togglePendingIntent)
            .addAction(R.drawable.ic_skip_next, "Next", nextPendingIntent)
            .setStyle(androidx.media.app.NotificationCompat.MediaStyle()
                .setMediaSession(mediaSession?.sessionToken)
                .setShowActionsInCompactView(0, 1, 2))
            .build()
    }

    override fun onDestroy() {
        mediaSession?.release()
        wakeLock?.let { if (it.isHeld) it.release() }
        try { unregisterReceiver(notificationActionReceiver) } catch (e: Exception) {}
        try { unregisterReceiver(noisyAudioReceiver) } catch (e: Exception) {}
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
