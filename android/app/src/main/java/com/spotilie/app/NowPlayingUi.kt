package com.spotilie.app

import android.animation.ValueAnimator
import android.content.ComponentName
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.Outline
import android.graphics.drawable.GradientDrawable
import android.net.Uri
import android.text.TextUtils
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.ViewOutlineProvider
import android.widget.FrameLayout
import android.widget.ImageButton
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.SeekBar
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.media3.common.MediaMetadata
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.datasource.DataSourceBitmapLoader
import androidx.media3.session.MediaController
import androidx.media3.session.SessionToken
import com.google.common.util.concurrent.ListenableFuture
import kotlin.math.abs

/**
 * Native mini player + full-screen player, drawn over the web page.
 *
 * A [MediaController] of our own media session — the same source of truth as
 * the notification, lock screen and earbuds. So it shows the saved last track
 * and stays responsive while the page is loading, reloading or dead, and play
 * goes through the same auto-resume path as everything else.
 *
 * Sits exactly where the web mini player used to (above the injected tab bar);
 * the injector hides Spotify's own bar but keeps it in the DOM, because its
 * buttons and text are what the injector reads and drives.
 */
@UnstableApi
class NowPlayingUi(private val activity: AppCompatActivity, root: FrameLayout) : Player.Listener {

    private val density = activity.resources.displayMetrics.density
    private fun dp(v: Int) = (v * density).toInt()
    private val main = ContextCompat.getMainExecutor(activity)

    private var controllerFuture: ListenableFuture<MediaController>? = null
    private var controller: MediaController? = null
    private val bitmapLoader = DataSourceBitmapLoader.Builder(activity).build()
    private var artUri: Uri? = null

    private var sysNavDp = 44
    private var imeVisible = false
    private var dragging = false

    var sheetOpen = false
        private set

    private val menuSheet: MenuSheet

    // ── Mini bar ─────────────────────────────────────────────────────────────

    private val barArt = roundedImage(4)
    private val barTitle = text(14f, Color.WHITE, bold = true)
    private val barArtist = text(12f, SUBTLE)
    private val barPlay = iconButton(R.drawable.ic_np_play, 40, "Play")
    private val barNext = iconButton(R.drawable.ic_np_next, 40, "Next")
    private val barSave = iconButton(R.drawable.ic_np_add, 40, "Save to Liked Songs")
    private val barProgress = View(activity).apply { setBackgroundColor(Color.WHITE); pivotX = 0f; scaleX = 0f }

    private val bar = FrameLayout(activity).apply {
        background = GradientDrawable().apply { setColor(0xFF2A2A2A.toInt()); cornerRadius = dp(8).toFloat() }
        clipToOutline = true
        elevation = dp(4).toFloat()
        visibility = View.GONE
        val row = LinearLayout(activity).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(dp(8), 0, dp(4), 0)
            addView(barArt, LinearLayout.LayoutParams(dp(48), dp(48)))
            addView(LinearLayout(activity).apply {
                orientation = LinearLayout.VERTICAL
                setPadding(dp(10), 0, dp(6), 0)
                addView(barTitle); addView(barArtist)
            }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
            addView(barSave); addView(barPlay); addView(barNext)
        }
        addView(row, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
        addView(barProgress, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(2), Gravity.BOTTOM))
        setOnClickListener { openSheet() }
    }

    // ── Full-screen sheet ────────────────────────────────────────────────────

    // Declared before `sheet`: its initializer assigns this, and a later
    // `= null` initializer would run afterwards and wipe it.
    private var artParams: LinearLayout.LayoutParams? = null
    private val sheetBg = GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM, intArrayOf(BASE, BASE))
    private val sheetArt = roundedImage(8)
    private val sheetTitle = text(22f, Color.WHITE, bold = true)
    private val sheetArtist = text(16f, SUBTLE)
    private val elapsed = text(12f, SUBTLE)
    private val remaining = text(12f, SUBTLE).apply { gravity = Gravity.END }
    private val seek = SeekBar(activity).apply {
        max = 1000
        progressTintList = android.content.res.ColorStateList.valueOf(Color.WHITE)
        thumbTintList = android.content.res.ColorStateList.valueOf(Color.WHITE)
        progressBackgroundTintList = android.content.res.ColorStateList.valueOf(0x4DFFFFFF)
    }
    private val sheetSave = iconButton(R.drawable.ic_np_add, 48, "Save to Liked Songs")
    private val sheetMore = iconButton(R.drawable.ic_np_more, 48, "More options")
    private val shuffleBtn = iconButton(R.drawable.ic_np_shuffle, 48, "Shuffle")
    /** Smart Shuffle badge on the shuffle button. */
    private val shuffleBadge = ImageView(activity).apply {
        setImageResource(R.drawable.ic_np_sparkle); setColorFilter(GREEN); visibility = View.GONE
    }
    private val repeatBtn = iconButton(R.drawable.ic_np_repeat, 48, "Repeat")
    private val sheetPrev = iconButton(R.drawable.ic_np_prev, 64, "Previous")
    private val sheetNext = iconButton(R.drawable.ic_np_next, 64, "Next")
    private val sheetPlay = iconButton(R.drawable.ic_np_play, 72, "Play").apply {
        background = GradientDrawable().apply { shape = GradientDrawable.OVAL; setColor(Color.WHITE) }
        setColorFilter(Color.BLACK)
    }

    private val sheet = FrameLayout(activity).apply {
        background = sheetBg
        elevation = dp(8).toFloat() // above the mini bar (4 dp) whatever the add order
        visibility = View.GONE
        isClickable = true // swallow touches meant for the page underneath
        val column = LinearLayout(activity).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(24), dp(16), dp(24), dp(24))
            addView(LinearLayout(activity).apply {
                gravity = Gravity.CENTER_VERTICAL
                addView(iconButton(R.drawable.ic_np_collapse, 48, "Close player").apply {
                    setOnClickListener { closeSheet() }
                })
                addView(View(activity), LinearLayout.LayoutParams(0, 1, 1f))
                addView(sheetMore)
            }, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(48)).apply {
                leftMargin = -dp(12); rightMargin = -dp(12)
            })
            addView(View(activity), LinearLayout.LayoutParams(1, 0, 1f))
            addView(sheetArt, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0).also { artParams = it })
            addView(View(activity), LinearLayout.LayoutParams(1, 0, 1f))
            addView(LinearLayout(activity).apply {
                gravity = Gravity.CENTER_VERTICAL
                addView(LinearLayout(activity).apply {
                    orientation = LinearLayout.VERTICAL
                    addView(sheetTitle); addView(sheetArtist)
                }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
                addView(sheetSave)
            }, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply {
                rightMargin = -dp(10)
            })
            addView(seek, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(40)).apply {
                topMargin = dp(16); leftMargin = -dp(16); rightMargin = -dp(16)
            })
            addView(LinearLayout(activity).apply {
                addView(elapsed, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
                addView(remaining, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
            })
            addView(LinearLayout(activity).apply {
                gravity = Gravity.CENTER_VERTICAL
                addView(FrameLayout(activity).apply {
                    addView(shuffleBtn)
                    addView(shuffleBadge, FrameLayout.LayoutParams(dp(12), dp(12), Gravity.TOP or Gravity.END).apply {
                        topMargin = dp(8); rightMargin = dp(6)
                    })
                }, LinearLayout.LayoutParams(dp(48), dp(48)))
                addView(View(activity), LinearLayout.LayoutParams(0, 1, 1f))
                addView(sheetPrev)
                addView(sheetPlay, LinearLayout.LayoutParams(dp(72), dp(72)).apply { leftMargin = dp(12); rightMargin = dp(12) })
                addView(sheetNext)
                addView(View(activity), LinearLayout.LayoutParams(0, 1, 1f))
                addView(repeatBtn)
            }, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(96)).apply {
                topMargin = dp(8); leftMargin = -dp(12); rightMargin = -dp(12)
            })
            addView(View(activity), LinearLayout.LayoutParams(1, 0, 0.6f))
        }
        addView(column, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
        // Square artwork, sized once the sheet knows its width.
        addOnLayoutChangeListener { _, l, _, r, _, _, _, _, _ ->
            val side = (r - l) - dp(48)
            if (artParams?.height != side) { artParams?.height = side; sheetArt.requestLayout() }
        }
        setOnTouchListener(SwipeDown())
    }

    init {
        root.addView(bar, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(64), Gravity.BOTTOM))
        root.addView(sheet, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
        menuSheet = MenuSheet(activity, root) { closeSheet() }
        layoutBar()

        barPlay.setOnClickListener { togglePlay() }
        sheetPlay.setOnClickListener { togglePlay() }
        barNext.setOnClickListener { controller?.seekToNext() }
        sheetNext.setOnClickListener { controller?.seekToNext() }
        sheetPrev.setOnClickListener { controller?.seekToPrevious() }
        barSave.setOnClickListener { onSave() }
        sheetSave.setOnClickListener { onSave() }
        // Spotify's own cycle: off → shuffle → Smart Shuffle → off (the page picks
        // the next step, since only it knows whether Smart Shuffle is offered).
        shuffleBtn.setOnClickListener { PlayerHost.sendMediaAction("shuffle-cycle") }
        repeatBtn.setOnClickListener {
            val c = controller ?: return@setOnClickListener
            c.repeatMode = when (c.repeatMode) {
                Player.REPEAT_MODE_OFF -> Player.REPEAT_MODE_ALL
                Player.REPEAT_MODE_ALL -> Player.REPEAT_MODE_ONE
                else -> Player.REPEAT_MODE_OFF
            }
        }
        sheetMore.setOnClickListener { openMenu() }
        seek.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(sb: SeekBar, value: Int, fromUser: Boolean) {
                if (fromUser) showTimes(durationMs() * value / 1000, durationMs())
            }
            override fun onStartTrackingTouch(sb: SeekBar) { dragging = true }
            override fun onStopTrackingTouch(sb: SeekBar) {
                dragging = false
                controller?.seekTo(durationMs() * sb.progress / 1000)
            }
        })
    }

    // ── Lifecycle ────────────────────────────────────────────────────────────

    fun connect() {
        PlayerHost.shareListener = { share(it) }
        if (controllerFuture != null) return
        val token = SessionToken(activity, ComponentName(activity, PlaybackService::class.java))
        val future = MediaController.Builder(activity, token).buildAsync()
        controllerFuture = future
        future.addListener({
            val c = try { future.get() } catch (_: Exception) { null } ?: return@addListener
            controller = c
            c.addListener(this)
            render()
        }, main)
        bar.post(ticker)
    }

    fun disconnect() {
        PlayerHost.shareListener = null
        menuSheet.close()
        bar.removeCallbacks(ticker)
        controller?.removeListener(this)
        controllerFuture?.let { MediaController.releaseFuture(it) }
        controllerFuture = null
        controller = null
    }

    /** System nav bar height (dp, as the injector uses) and keyboard state, from window insets. */
    fun setInsets(sysNavDp: Int, imeVisible: Boolean) {
        this.sysNavDp = maxOf(sysNavDp, 44)
        this.imeVisible = imeVisible
        layoutBar()
        sheet.setPadding(0, 0, 0, dp(this.sysNavDp) - dp(24))
        menuSheet.setBottomInset(dp(this.sysNavDp))
        render()
    }

    /** Back: the Save sheet first, then the player sheet. */
    fun handleBack(): Boolean {
        if (menuSheet.handleBack()) return true
        if (!sheetOpen) return false
        closeSheet()
        return true
    }

    override fun onEvents(player: Player, events: Player.Events) = render()

    // ── Rendering ────────────────────────────────────────────────────────────

    private fun durationMs(): Long = controller?.duration?.takeIf { it > 0 } ?: 0L

    private fun render() {
        val c = controller
        val meta = c?.mediaMetadata ?: MediaMetadata.EMPTY
        val hasTrack = c != null && c.currentMediaItem != null && !meta.title.isNullOrBlank()

        bar.visibility = if (hasTrack && !imeVisible && !sheetOpen) View.VISIBLE else View.GONE
        if (!hasTrack && sheetOpen) closeSheet()
        if (!hasTrack) return

        barTitle.text = meta.title; sheetTitle.text = meta.title
        barArtist.text = meta.artist; sheetArtist.text = meta.artist

        val playing = c.playWhenReady
        val icon = if (playing) R.drawable.ic_np_pause else R.drawable.ic_np_play
        val label = if (playing) "Pause" else "Play"
        barPlay.setImageResource(icon); barPlay.contentDescription = label
        sheetPlay.setImageResource(icon); sheetPlay.contentDescription = label

        renderModes(c, meta)
        loadArtwork(meta.artworkUri)
        renderProgress()
    }

    private fun renderProgress() {
        val c = controller ?: return
        val duration = durationMs()
        val position = c.currentPosition.coerceIn(0L, maxOf(duration, 0L))
        barProgress.scaleX = if (duration > 0) position.toFloat() / duration else 0f
        if (!dragging) {
            seek.isEnabled = duration > 0
            seek.progress = if (duration > 0) (position * 1000 / duration).toInt() else 0
            showTimes(position, duration)
        }
    }

    private fun showTimes(position: Long, duration: Long) {
        elapsed.text = clock(position)
        remaining.text = if (duration > 0) "-${clock(duration - position)}" else ""
    }

    /** media3 extrapolates position between page reports; repaint it twice a second. */
    private val ticker = object : Runnable {
        override fun run() {
            if (controller?.playWhenReady == true && bar.visibility == View.VISIBLE) renderProgress()
            bar.postDelayed(this, 500)
        }
    }

    private fun loadArtwork(uri: Uri?) {
        if (uri == artUri) return
        artUri = uri
        if (uri == null) { setArtwork(null); return }
        val future = bitmapLoader.loadBitmap(uri)
        future.addListener({
            if (artUri != uri) return@addListener
            setArtwork(try { future.get() } catch (_: Exception) { null })
        }, main)
    }

    private fun setArtwork(bitmap: Bitmap?) {
        barArt.setImageBitmap(bitmap); sheetArt.setImageBitmap(bitmap)
        val tint = bitmap?.let(::dominantColor) ?: BASE
        sheetBg.colors = intArrayOf(tint, BASE)
    }

    /** Average of a downscaled artwork, darkened so white text stays readable. */
    private fun dominantColor(bitmap: Bitmap): Int {
        val px = Bitmap.createScaledBitmap(bitmap, 1, 1, true).getPixel(0, 0)
        val hsv = FloatArray(3)
        Color.colorToHSV(px, hsv)
        hsv[2] = minOf(hsv[2], 0.45f)
        return Color.HSVToColor(hsv)
    }

    // ── Actions ──────────────────────────────────────────────────────────────

    private var saved = -1

    private fun renderModes(c: MediaController, meta: MediaMetadata) {
        val extras = meta.extras
        saved = extras?.getInt(WebPlayer.EXTRA_SAVED, -1) ?: -1
        val shuffle = extras?.getInt(WebPlayer.EXTRA_SHUFFLE, -1) ?: -1

        for (b in listOf(barSave, sheetSave)) {
            // Spotify's button: "+" saves to Liked Songs; a green tick opens "Save to".
            b.visibility = if (saved < 0) View.INVISIBLE else View.VISIBLE
            b.setImageResource(if (saved == 1) R.drawable.ic_np_saved else R.drawable.ic_np_add)
            b.setColorFilter(if (saved == 1) GREEN else Color.WHITE)
            b.contentDescription = if (saved == 1) "Saved — change playlists" else "Save to Liked Songs"
        }

        shuffleBtn.visibility = if (shuffle < 0) View.INVISIBLE else View.VISIBLE
        shuffleBtn.setColorFilter(if (shuffle > 0) GREEN else Color.WHITE)
        shuffleBadge.visibility = if (shuffle == 2) View.VISIBLE else View.GONE
        shuffleBtn.contentDescription = when (shuffle) {
            2 -> "Smart Shuffle on"; 1 -> "Shuffle on"; else -> "Shuffle off"
        }

        val repeat = c.repeatMode
        repeatBtn.setImageResource(if (repeat == Player.REPEAT_MODE_ONE) R.drawable.ic_np_repeat_one else R.drawable.ic_np_repeat)
        repeatBtn.setColorFilter(if (repeat == Player.REPEAT_MODE_OFF) Color.WHITE else GREEN)
        repeatBtn.contentDescription = when (repeat) {
            Player.REPEAT_MODE_ONE -> "Repeat one"; Player.REPEAT_MODE_ALL -> "Repeat all"; else -> "Repeat off"
        }
    }

    /**
     * Exactly Spotify's save button: "+" → Liked Songs; a tick → Spotify's menu
     * for this song (Liked Songs, playlists — add and remove).
     */
    private fun onSave() {
        if (saved == 1) openMenu() else PlayerHost.sendMediaAction("save")
    }

    private fun openMenu() {
        val meta = controller?.mediaMetadata ?: return
        menuSheet.open(meta.title?.toString().orEmpty(), meta.artist?.toString().orEmpty())
    }

    /** Spotify's Share → Copy link, handed to Android's share sheet. */
    private fun share(link: String) {
        val meta = controller?.mediaMetadata
        val text = if (meta?.title != null) "${meta.title} — ${meta.artist}\n$link" else link
        activity.startActivity(
            Intent.createChooser(
                Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_TEXT, text),
                "Share"
            )
        )
    }

    private fun togglePlay() {
        val c = controller ?: return
        if (c.playWhenReady) c.pause() else c.play()
    }

    private fun openSheet() {
        if (sheetOpen) return
        sheetOpen = true
        bar.visibility = View.GONE // it has elevation and would draw over the sheet
        sheet.visibility = View.VISIBLE
        sheet.translationY = sheet.height.toFloat().takeIf { it > 0 } ?: activity.resources.displayMetrics.heightPixels.toFloat()
        sheet.animate().translationY(0f).setDuration(260).start()
        renderProgress()
    }

    private fun closeSheet() {
        if (!sheetOpen) return
        sheetOpen = false
        sheet.animate().translationY(sheet.height.toFloat()).setDuration(220)
            .withEndAction { if (!sheetOpen) sheet.visibility = View.GONE }.start()
        render() // bring the mini bar back
    }

    /** Drag the sheet down to dismiss it, like a native bottom sheet. */
    private inner class SwipeDown : View.OnTouchListener {
        private var startY = 0f
        private var startT = 0L
        override fun onTouch(v: View, e: MotionEvent): Boolean {
            when (e.actionMasked) {
                MotionEvent.ACTION_DOWN -> { startY = e.rawY; startT = e.eventTime }
                MotionEvent.ACTION_MOVE -> sheet.translationY = maxOf(0f, e.rawY - startY)
                MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                    val dy = e.rawY - startY
                    val fast = dy > dp(60) && e.eventTime - startT < 250
                    if (dy > sheet.height / 4f || fast) closeSheet()
                    else if (abs(sheet.translationY) > 0f) {
                        ValueAnimator.ofFloat(sheet.translationY, 0f).apply {
                            duration = 180
                            addUpdateListener { sheet.translationY = it.animatedValue as Float }
                        }.start()
                    }
                }
            }
            return true
        }
    }

    // ── View helpers ─────────────────────────────────────────────────────────

    /** Same slot as the web mini player: above the injected 52 dp tab bar. */
    private fun layoutBar() {
        (bar.layoutParams as? FrameLayout.LayoutParams)?.let {
            it.leftMargin = dp(8); it.rightMargin = dp(8)
            it.bottomMargin = dp(sysNavDp + 6 + 52 + 4)
            bar.layoutParams = it
        }
    }

    private fun text(sizeSp: Float, color: Int, bold: Boolean = false) = TextView(activity).apply {
        textSize = sizeSp
        setTextColor(color)
        maxLines = 1
        ellipsize = TextUtils.TruncateAt.END
        if (bold) setTypeface(typeface, android.graphics.Typeface.BOLD)
    }

    private fun iconButton(icon: Int, sizeDp: Int, label: String) = ImageButton(activity).apply {
        setImageResource(icon)
        contentDescription = label
        scaleType = ImageView.ScaleType.CENTER_INSIDE
        val pad = dp(sizeDp / 5)
        setPadding(pad, pad, pad, pad)
        background = null
        layoutParams = LinearLayout.LayoutParams(dp(sizeDp), dp(sizeDp))
    }

    private fun roundedImage(radiusDp: Int) = ImageView(activity).apply {
        scaleType = ImageView.ScaleType.CENTER_CROP
        setBackgroundColor(0xFF333333.toInt())
        outlineProvider = object : ViewOutlineProvider() {
            override fun getOutline(view: View, outline: Outline) {
                outline.setRoundRect(0, 0, view.width, view.height, dp(radiusDp).toFloat())
            }
        }
        clipToOutline = true
    }

    private companion object {
        val SUBTLE = 0xFFB3B3B3.toInt()
        val GREEN = 0xFF1ED760.toInt()
        val BASE = 0xFF121212.toInt()

        fun clock(ms: Long): String {
            val s = maxOf(0L, ms / 1000)
            return if (s >= 3600) "%d:%02d:%02d".format(s / 3600, s / 60 % 60, s % 60)
            else "%d:%02d".format(s / 60, s % 60)
        }
    }
}
