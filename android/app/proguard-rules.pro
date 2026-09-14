# GeckoView uses JNI and reflection throughout; shrinking its entry points
# breaks the runtime at startup rather than at build time.
-keep class org.mozilla.geckoview.** { *; }
-keep class org.mozilla.gecko.** { *; }

# media3 session/service classes are resolved by name from the platform.
-keep class androidx.media3.session.** { *; }

# Referenced by the extension bridge via JSON round-trips.
-keep class com.spotilie.app.** { *; }

-dontwarn org.mozilla.**
