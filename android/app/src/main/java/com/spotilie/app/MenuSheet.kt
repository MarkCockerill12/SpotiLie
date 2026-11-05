package com.spotilie.app

import android.app.AlertDialog
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.text.Editable
import android.text.InputType
import android.text.TextUtils
import android.text.TextWatcher
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.ImageButton
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.media3.common.util.UnstableApi
import org.json.JSONObject

/**
 * Spotify's own track menu for the current song, shown natively.
 *
 * The page (menu.ts) opens Spotify's real menu and reports its items; picking
 * one clicks the real item. So this offers exactly what Spotify offers — Add to
 * playlist (with search and New playlist), Liked Songs, Add to queue, song
 * radio, artist / album, credits, share — with Spotify's behaviour and wording.
 * One native addition: "Remove from playlist…", which Spotify only offers on
 * the playlist's own page (menu.ts does that walk).
 */
@UnstableApi
class MenuSheet(
    private val activity: AppCompatActivity,
    root: FrameLayout,
    /** A chosen option changed the page (Go to artist, radio…): show it. */
    private val onNavigated: () -> Unit,
) {
    private val density = activity.resources.displayMetrics.density
    private fun dp(v: Int) = (v * density).toInt()

    var isOpen = false
        private set

    private enum class Mode { MENU, REMOVE }

    private var mode = Mode.MENU
    private var level = 0
    private var busy = false
    /** Key of Spotify's "Add to playlist" item: the playlist list for removal. */
    private var addToPlaylistKey: String? = null
    private var lastSubTitle = ""

    private val back = ImageButton(activity).apply {
        setImageResource(R.drawable.ic_np_collapse)
        rotation = 90f
        background = null
        contentDescription = "Back"
        setOnClickListener { goBack() }
    }
    private val title = TextView(activity).apply {
        textSize = 20f; setTextColor(Color.WHITE); maxLines = 2
        ellipsize = TextUtils.TruncateAt.END
        setTypeface(typeface, android.graphics.Typeface.BOLD)
    }
    private val subtitle = TextView(activity).apply { textSize = 14f; setTextColor(SUBTLE); maxLines = 1 }
    private val searchBox = EditText(activity).apply {
        hint = "Find a playlist"
        setHintTextColor(SUBTLE); setTextColor(Color.WHITE); textSize = 15f
        inputType = InputType.TYPE_CLASS_TEXT
        background = GradientDrawable().apply { setColor(0xFF2A2A2A.toInt()); cornerRadius = dp(6).toFloat() }
        setPadding(dp(12), dp(10), dp(12), dp(10))
        visibility = View.GONE
    }
    private val status = TextView(activity).apply {
        setTextColor(SUBTLE); textSize = 14f; gravity = Gravity.CENTER
        setPadding(0, dp(32), 0, dp(32))
    }
    private val list = LinearLayout(activity).apply { orientation = LinearLayout.VERTICAL }

    private val view = FrameLayout(activity).apply {
        setBackgroundColor(0xFF121212.toInt())
        elevation = dp(16).toFloat()
        visibility = View.GONE
        isClickable = true
        addView(LinearLayout(activity).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(16), dp(16), dp(16), dp(12))
            addView(LinearLayout(activity).apply {
                gravity = Gravity.CENTER_VERTICAL
                addView(back, LinearLayout.LayoutParams(dp(48), dp(48)))
                addView(LinearLayout(activity).apply {
                    orientation = LinearLayout.VERTICAL
                    setPadding(dp(4), 0, 0, 0)
                    addView(title); addView(subtitle)
                }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
            })
            addView(searchBox, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply {
                topMargin = dp(12)
            })
            addView(ScrollView(activity).apply {
                addView(LinearLayout(activity).apply {
                    orientation = LinearLayout.VERTICAL
                    addView(status); addView(list)
                })
            }, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f).apply { topMargin = dp(8) })
            addView(TextView(activity).apply {
                text = "Close"; textSize = 15f; gravity = Gravity.CENTER; setTextColor(Color.WHITE)
                setTypeface(typeface, android.graphics.Typeface.BOLD)
                setPadding(dp(28), 0, dp(28), 0)
                background = GradientDrawable().apply { cornerRadius = dp(24).toFloat(); setStroke(dp(1), SUBTLE) }
                setOnClickListener { close() }
            }, LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, dp(44)).apply {
                gravity = Gravity.CENTER_HORIZONTAL; topMargin = dp(8)
            })
        }, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
    }

    init {
        root.addView(view, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
        searchBox.addTextChangedListener(object : TextWatcher {
            private val run = Runnable { PlayerHost.sendMediaAction("menu-search", text = searchBox.text.toString()) }
            override fun afterTextChanged(s: Editable?) {
                if (searchBox.visibility != View.VISIBLE) return
                searchBox.removeCallbacks(run)
                searchBox.postDelayed(run, 350)
            }
            override fun beforeTextChanged(s: CharSequence?, a: Int, b: Int, c: Int) {}
            override fun onTextChanged(s: CharSequence?, a: Int, b: Int, c: Int) {}
        })
    }

    fun setBottomInset(px: Int) = view.setPadding(0, 0, 0, px)

    // ── Lifecycle ────────────────────────────────────────────────────────────

    fun open(trackTitle: String, trackArtist: String) {
        if (isOpen) return
        isOpen = true
        title.text = trackTitle
        subtitle.text = trackArtist
        // Read the bars now: the inset callback can run before this view exists.
        ViewCompat.getRootWindowInsets(view)?.getInsets(WindowInsetsCompat.Type.systemBars())?.let {
            view.setPadding(0, it.top, 0, it.bottom)
        }
        view.visibility = View.VISIBLE
        view.alpha = 0f
        view.animate().alpha(1f).setDuration(150).start()
        PlayerHost.menuListener = { onMessage(it) }
        loadTop()
    }

    fun close() {
        if (!isOpen) return
        isOpen = false
        PlayerHost.menuListener = null
        PlayerHost.sendMediaAction("menu-close")
        hideKeyboard()
        view.animate().alpha(0f).setDuration(120).withEndAction { if (!isOpen) view.visibility = View.GONE }.start()
    }

    fun handleBack(): Boolean {
        if (!isOpen) return false
        goBack()
        return true
    }

    private fun goBack() {
        if (level > 0) loadTop() else close()
    }

    private fun loadTop() {
        mode = Mode.MENU
        level = 0
        back.rotation = 90f
        searchBox.visibility = View.GONE // first, so clearing it doesn't send a search
        searchBox.setText("")
        showLoading()
        PlayerHost.sendMediaAction("menu-open")
    }

    // ── Page messages ────────────────────────────────────────────────────────

    private fun onMessage(json: JSONObject) {
        if (!isOpen) return
        busy = false
        when (json.optString("type")) {
            "MENU" -> if (json.optString("state") == "error") showStatus(json.optString("message")) else showMenu(json)
            "MENU_DIALOG" -> showDialog(json)
            "MENU_DONE" -> done(json)
        }
    }

    private fun showMenu(json: JSONObject) {
        level = json.optInt("level")
        val items = json.optJSONArray("items") ?: return
        list.removeAllViews()
        status.visibility = View.GONE
        if (level == 0) {
            subtitle.visibility = View.VISIBLE
            for (i in 0 until items.length()) {
                val it = items.getJSONObject(i)
                val key = it.optString("key")
                val label = it.optString("label")
                list.addView(row(label, it.optBoolean("sub")) { select(key, label) })
                // Spotify only removes from a playlist on that playlist's page; offer it here.
                if (ADD_TO_PLAYLIST.containsMatchIn(label)) {
                    addToPlaylistKey = key
                    list.addView(row("Remove from playlist", sub = true) { startRemove() })
                }
            }
            return
        }

        lastSubTitle = json.optString("title")
        title.text = if (mode == Mode.REMOVE) "Remove from playlist" else lastSubTitle
        back.rotation = 90f
        searchBox.visibility = if (json.optBoolean("search")) View.VISIBLE else View.GONE
        for (i in 0 until items.length()) {
            val it = items.getJSONObject(i)
            val label = it.optString("label")
            val uri = it.optString("uri")
            if (mode == Mode.REMOVE) {
                if (uri.isEmpty()) continue // "New playlist" and anything that isn't a playlist
                list.addView(row(label, sub = false) { remove(uri, label) })
            } else {
                val key = it.optString("key")
                list.addView(row(label, sub = false) { select(key, label) })
            }
        }
        if (list.childCount == 0) showStatus("Nothing here.")
    }

    private fun select(key: String, label: String) {
        if (busy) return
        busy = true
        pendingLabel = label
        showLoading()
        PlayerHost.sendMediaAction("menu-select", text = key)
    }

    private fun startRemove() {
        val key = addToPlaylistKey ?: return
        mode = Mode.REMOVE
        busy = true
        showLoading()
        PlayerHost.sendMediaAction("menu-select", text = key)
    }

    private fun remove(uri: String, name: String) {
        if (busy) return
        busy = true
        showStatus("Removing from “$name”…")
        list.removeAllViews()
        PlayerHost.sendMediaAction("playlist-remove", text = "$uri\n$name")
    }

    private var pendingLabel = ""

    private fun done(json: JSONObject) {
        val message = json.optString("message").ifBlank {
            when {
                level == 1 && ADD_TO_PLAYLIST.containsMatchIn(lastSubTitle) && !NEW_PLAYLIST.containsMatchIn(pendingLabel) -> "Added to $pendingLabel"
                level == 1 && NEW_PLAYLIST.containsMatchIn(pendingLabel) -> "Added to a new playlist"
                else -> ""
            }
        }
        if (message.isNotEmpty()) Toast.makeText(activity, message, Toast.LENGTH_SHORT).show()
        val navigated = json.optBoolean("navigated")
        close()
        if (navigated || NAVIGATES.containsMatchIn(json.optString("label"))) onNavigated()
    }

    /** Spotify's own confirmation (e.g. "already in this playlist"), with its own buttons. */
    private fun showDialog(json: JSONObject) {
        val buttons = json.optJSONArray("buttons") ?: return
        val labels = (0 until buttons.length()).map { buttons.getString(it) }.filter { it.isNotBlank() }
        val builder = AlertDialog.Builder(activity).setMessage(json.optString("text"))
        labels.getOrNull(0)?.let { l -> builder.setPositiveButton(l) { _, _ -> PlayerHost.sendMediaAction("menu-dialog", text = l) } }
        labels.getOrNull(1)?.let { l -> builder.setNegativeButton(l) { _, _ -> PlayerHost.sendMediaAction("menu-dialog", text = l) } }
        labels.getOrNull(2)?.let { l -> builder.setNeutralButton(l) { _, _ -> PlayerHost.sendMediaAction("menu-dialog", text = l) } }
        builder.setOnCancelListener { close() }
        builder.show()
    }

    // ── Views ────────────────────────────────────────────────────────────────

    private fun showLoading() {
        list.removeAllViews()
        showStatus("Loading…")
    }

    private fun showStatus(text: String) {
        status.text = text
        status.visibility = View.VISIBLE
    }

    private fun row(label: String, sub: Boolean, onClick: () -> Unit): View =
        LinearLayout(activity).apply {
            gravity = Gravity.CENTER_VERTICAL
            minimumHeight = dp(52)
            setPadding(dp(8), 0, dp(8), 0)
            background = android.graphics.drawable.RippleDrawable(
                android.content.res.ColorStateList.valueOf(0x33FFFFFF), null, null
            )
            addView(TextView(activity).apply {
                text = label; textSize = 16f; setTextColor(Color.WHITE)
                maxLines = 1; ellipsize = TextUtils.TruncateAt.END
            }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
            if (sub) addView(TextView(activity).apply { text = "›"; textSize = 22f; setTextColor(SUBTLE) })
            setOnClickListener { onClick() }
        }

    private fun hideKeyboard() {
        val imm = activity.getSystemService(android.view.inputmethod.InputMethodManager::class.java)
        imm?.hideSoftInputFromWindow(searchBox.windowToken, 0)
    }

    private companion object {
        val SUBTLE = 0xFFB3B3B3.toInt()
        val ADD_TO_PLAYLIST = Regex("add to playlist", RegexOption.IGNORE_CASE)
        val NEW_PLAYLIST = Regex("new playlist", RegexOption.IGNORE_CASE)
        /** Options that take you somewhere in the web player. */
        val NAVIGATES = Regex("go to|radio|credits", RegexOption.IGNORE_CASE)
    }
}
