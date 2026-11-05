package com.spotilie.app

import android.content.Context
import android.os.SystemClock

/**
 * The last track, saved to disk, so the lock screen, notification and Bluetooth
 * metadata survive the web player — or the whole process — being killed.
 *
 * Without it, a killed page left a blank session behind, and after a full
 * process death (seen on device: `cch+99 SVC has died`) the restarted service
 * had nothing to show and play did nothing.
 */
class PlayerStateStore(context: Context) {

    data class Track(
        val title: String,
        val artist: String,
        val artwork: String,
        val durationMs: Long,
        val positionMs: Long,
    )

    private val prefs = context.getSharedPreferences("player_state", Context.MODE_PRIVATE)
    private var lastKey = ""
    private var lastPositionWriteAt = 0L

    fun load(): Track? {
        val title = prefs.getString(KEY_TITLE, null)?.takeIf { it.isNotBlank() } ?: return null
        return Track(
            title = title,
            artist = prefs.getString(KEY_ARTIST, "") ?: "",
            artwork = prefs.getString(KEY_ARTWORK, "") ?: "",
            durationMs = prefs.getLong(KEY_DURATION, 0L),
            positionMs = prefs.getLong(KEY_POSITION, 0L),
        )
    }

    /** Called on every metadata tick; only touches disk on a change or every few seconds. */
    fun save(track: Track, isPlaying: Boolean) {
        val key = "${track.title}|${track.artist}|${track.artwork}|${track.durationMs}"
        val now = SystemClock.elapsedRealtime()
        val trackChanged = key != lastKey
        if (!trackChanged && isPlaying && now - lastPositionWriteAt < POSITION_WRITE_MS) return
        lastKey = key
        lastPositionWriteAt = now
        prefs.edit().apply {
            if (trackChanged) {
                putString(KEY_TITLE, track.title)
                putString(KEY_ARTIST, track.artist)
                putString(KEY_ARTWORK, track.artwork)
                putLong(KEY_DURATION, track.durationMs)
            }
            putLong(KEY_POSITION, track.positionMs)
        }.apply()
    }

    /**
     * Steady playback sends no metadata (the page only reports changes), so
     * without a checkpoint the saved position froze at the last play/seek —
     * verified: killed at 50 s, saved 31 s.
     */
    fun savePosition(positionMs: Long) {
        prefs.edit().putLong(KEY_POSITION, positionMs).apply()
    }

    var lastUrl: String?
        get() = prefs.getString(KEY_URL, null)
        set(value) { prefs.edit().putString(KEY_URL, value).apply() }

    private companion object {
        const val KEY_TITLE = "title"
        const val KEY_ARTIST = "artist"
        const val KEY_ARTWORK = "artwork"
        const val KEY_DURATION = "duration"
        const val KEY_POSITION = "position"
        const val KEY_URL = "url"
        const val POSITION_WRITE_MS = 5_000L
    }
}
