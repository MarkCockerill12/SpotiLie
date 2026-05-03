package com.spotilie.app

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import android.webkit.WebView
import android.content.BroadcastReceiver

class MainActivity : TauriActivity() {
  companion object {
    var instance: MainActivity? = null
  }

  private val mediaReceiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
      val action = intent?.action ?: return
      
      val jsAction = when (action) {
        "com.spotilie.app.PLAY" -> "play"
        "com.spotilie.app.PAUSE" -> "pause"
        "com.spotilie.app.NEXT" -> "next"
        "com.spotilie.app.PREV" -> "prev"
        else -> return
      }
      handleMediaAction(jsAction)
    }
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    instance = this
    
    val windowInsetsController = WindowCompat.getInsetsController(window, window.decorView)
    windowInsetsController.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
    windowInsetsController.hide(WindowInsetsCompat.Type.systemBars())

    val filter = IntentFilter().apply {
        addAction("com.spotilie.app.PLAY")
        addAction("com.spotilie.app.PAUSE")
        addAction("com.spotilie.app.NEXT")
        addAction("com.spotilie.app.PREV")
    }
    
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        registerReceiver(mediaReceiver, filter, Context.RECEIVER_EXPORTED)
    } else {
        registerReceiver(mediaReceiver, filter)
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
        if (!pm.isIgnoringBatteryOptimizations(packageName)) {
            try {
                val intent = Intent().apply {
                    action = Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS
                    data = Uri.parse("package:$packageName")
                }
                startActivity(intent)
            } catch (e: Exception) {}
        }
    }

    startService(Intent(this, MediaForegroundService::class.java))
  }

  fun handleMediaAction(action: String) {
    val script = "if (window.spotilieMediaAction) { window.spotilieMediaAction('$action'); }"
    this.runOnUiThread {
        try {
            findWebView(window.decorView)?.evaluateJavascript(script, null)
        } catch (e: Exception) {}
    }
  }

  private fun findWebView(view: android.view.View): WebView? {
    if (view is WebView) return view
    if (view is android.view.ViewGroup) {
        for (i in 0 until view.childCount) {
            val child = findWebView(view.getChildAt(i))
            if (child != null) return child
        }
    }
    return null
  }

  override fun onDestroy() {
    instance = null
    try {
        unregisterReceiver(mediaReceiver)
    } catch (e: Exception) {}
    super.onDestroy()
  }
}
