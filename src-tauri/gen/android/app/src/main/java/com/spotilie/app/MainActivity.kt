package com.spotilie.app

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceError

class MainActivity : TauriActivity() {
  companion object {
    var instance: MainActivity? = null
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    instance = this
    
    val windowInsetsController = WindowCompat.getInsetsController(window, window.decorView)
    windowInsetsController.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
    windowInsetsController.hide(WindowInsetsCompat.Type.systemBars())

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

    // Set up WebView error handling after a short delay to ensure Tauri has initialized the WebView
    window.decorView.postDelayed({
        findWebView(window.decorView)?.let { webView ->
            webView.webViewClient = object : WebViewClient() {
                override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
                    if (request.isForMainFrame) {
                        view.loadUrl("file:///android_asset/offline.html")
                    }
                }

                // Fallback for older APIs if necessary
                @Suppress("deprecation")
                override fun onReceivedError(view: WebView, errorCode: Int, description: String, failingUrl: String) {
                    if (failingUrl == view.url || failingUrl.contains("spotify.com")) {
                        view.loadUrl("file:///android_asset/offline.html")
                    }
                }
            }
        }
    }, 2000)
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
    super.onDestroy()
  }
}
