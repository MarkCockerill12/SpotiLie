package com.spotilie.app

import android.net.Uri
import android.os.Looper
import androidx.media3.common.MediaMetadata
import androidx.media3.common.Player
import androidx.media3.common.SimpleBasePlayer
import androidx.media3.common.util.UnstableApi
import com.google.common.util.concurrent.Futures
import com.google.common.util.concurrent.ListenableFuture

/**
 * A [Player] facade over the Spotify web player running inside GeckoView.
 *
 * media3 needs a Player to drive the media notification, lock screen, Bluetooth
 * metadata and Android Auto. We don't own the audio pipeline — Gecko does — so
 * this reports state pushed up from the injector and forwards transport commands
 * back down through the WebExtension port.
 *
 * [SimpleBasePlayer] exists precisely for this "player we don't control directly"
 * case: we implement a state snapshot plus a handler per command.
 */
@UnstableApi
class WebPlayer(looper: Looper) : SimpleBasePlayer(looper) {

    /** Sends a transport action down to the web player. Set by [PlaybackService]. */
    var actionSink: ((action: String, arg: Long) -> Unit)? = null

    private var title: String = "SpotiLIE"
    private var artist: String = ""
    private var artworkUri: Uri? = null
    private var playing: Boolean = false
    private var durationMs: Long = C_TIME_UNSET
    private var positionMs: Long = 0L

    /** True once the web player has reported a real track, not just the shell. */
    private var hasTrack: Boolean = false

    private val commands: Player.Commands = Player.Commands.Builder()
        .addAll(
            Player.COMMAND_PLAY_PAUSE,
            Player.COMMAND_SEEK_TO_NEXT,
            Player.COMMAND_SEEK_TO_NEXT_MEDIA_ITEM,
            Player.COMMAND_SEEK_TO_PREVIOUS,
            Player.COMMAND_SEEK_TO_PREVIOUS_MEDIA_ITEM,
            Player.COMMAND_SEEK_IN_CURRENT_MEDIA_ITEM,
            Player.COMMAND_GET_CURRENT_MEDIA_ITEM,
            Player.COMMAND_GET_METADATA,
            Player.COMMAND_GET_TIMELINE,
            Player.COMMAND_STOP
        )
        .build()

    /**
     * Push new state from the injector. Only triggers a media3 state rebuild when
     * something actually changed — this is called on every metadata tick.
     */
    fun updateFromWeb(
        title: String,
        artist: String,
        artworkUrl: String?,
        isPlaying: Boolean,
        durationMs: Long,
        positionMs: Long
    ) {
        val newArtwork = artworkUrl?.takeIf { it.isNotBlank() }?.let(Uri::parse)
        val changed = title != this.title ||
            artist != this.artist ||
            newArtwork != this.artworkUri ||
            isPlaying != this.playing ||
            durationMs != this.durationMs ||
            kotlin.math.abs(positionMs - this.positionMs) > 1_000L

        this.title = title
        this.artist = artist
        this.artworkUri = newArtwork
        this.playing = isPlaying
        this.durationMs = durationMs
        this.positionMs = positionMs
        this.hasTrack = true

        if (changed) invalidateState()
    }

    fun isPlayingNow(): Boolean = playing

    /** The web player went away (content process died); show paused until it reports again. */
    fun markPaused() {
        if (!playing) return
        playing = false
        invalidateState()
    }

    override fun getState(): State {
        val builder = State.Builder()
            .setAvailableCommands(commands)
            .setPlaybackState(if (hasTrack) Player.STATE_READY else Player.STATE_IDLE)
            .setPlayWhenReady(playing, Player.PLAY_WHEN_READY_CHANGE_REASON_REMOTE)

        if (!hasTrack) return builder.build()

        val metadata = MediaMetadata.Builder()
            .setTitle(title)
            .setArtist(artist)
            .setDisplayTitle(title)
            .setSubtitle(artist)
            .setArtworkUri(artworkUri)
            .setIsBrowsable(false)
            .setIsPlayable(true)
            .build()

        val item = MediaItemData.Builder(MEDIA_ITEM_UID)
            .setMediaMetadata(metadata)
            .setDurationUs(if (durationMs > 0) durationMs * 1_000L else C_TIME_UNSET)
            .setIsSeekable(durationMs > 0)
            .setIsDynamic(false)
            .build()

        // Extrapolate between metadata ticks so the notification scrubber moves
        // smoothly instead of stepping once per update.
        val position =
            if (playing) PositionSupplier.getExtrapolating(positionMs, 1.0f)
            else PositionSupplier.getConstant(positionMs)

        return builder
            .setPlaylist(listOf(item))
            .setCurrentMediaItemIndex(0)
            .setContentPositionMs(position)
            .build()
    }

    override fun handleSetPlayWhenReady(playWhenReady: Boolean): ListenableFuture<*> {
        actionSink?.invoke(if (playWhenReady) "play" else "pause", 0L)
        return Futures.immediateVoidFuture()
    }

    override fun handleSeek(
        mediaItemIndex: Int,
        positionMs: Long,
        seekCommand: Int
    ): ListenableFuture<*> {
        when (seekCommand) {
            Player.COMMAND_SEEK_TO_NEXT,
            Player.COMMAND_SEEK_TO_NEXT_MEDIA_ITEM -> actionSink?.invoke("next", 0L)

            Player.COMMAND_SEEK_TO_PREVIOUS,
            Player.COMMAND_SEEK_TO_PREVIOUS_MEDIA_ITEM -> actionSink?.invoke("prev", 0L)

            else -> if (positionMs >= 0) {
                // Reflect the seek immediately. SimpleBasePlayer re-reads getState()
                // once this handler completes; without this the scrubber snapped back
                // to the old time until the web player's next report arrived.
                this.positionMs = positionMs
                actionSink?.invoke("seek", positionMs)
            }
        }
        return Futures.immediateVoidFuture()
    }

    override fun handleStop(): ListenableFuture<*> {
        actionSink?.invoke("pause", 0L)
        return Futures.immediateVoidFuture()
    }

    private companion object {
        const val MEDIA_ITEM_UID = "spotilie-current"
        const val C_TIME_UNSET = androidx.media3.common.C.TIME_UNSET
    }
}
