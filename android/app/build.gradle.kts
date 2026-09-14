import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.spotilie.app"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.spotilie.app"
        minSdk = 26
        targetSdk = 36
        // Stays above the 1000 the old Tauri-generated build shipped, so the
        // app updates in place and keeps its Spotify session cookies.
        versionCode = 1001
        versionName = "2.0"
        // GeckoView is pulled in per-ABI; the app ships arm64 only.
        ndk { abiFilters += "arm64-v8a" }

        // Diagnostics (verbose port logging, network verdicts, the adb JS-eval
        // receiver) are opt-in via `build.ps1 -Debug`, NOT tied to the debug
        // variant: everyday installs are debug APKs too and shouldn't carry them.
        val injectorDebug = (project.findProperty("spotilieDebug") as String?) == "true"
        buildConfigField("boolean", "INJECTOR_DEBUG", injectorDebug.toString())
    }

    buildTypes {
        getByName("debug") {
            isDebuggable = true
            isMinifyEnabled = false
        }
        getByName("release") {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildFeatures {
        buildConfig = true
    }

    packaging {
        resources.excludes += setOf(
            "META-INF/*.version",
            "META-INF/proguard/*",
            "kotlin/**",
            "DebugProbesKt.bin"
        )
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(JvmTarget.JVM_17)
    }
}

dependencies {
    // Browser engine. GeckoView is used instead of Android WebView because Chromium
    // WebView revokes the Widevine DRM HAL session, which breaks Spotify playback.
    implementation("org.mozilla.geckoview:geckoview-arm64-v8a:153.0.20260803132010")

    implementation("androidx.appcompat:appcompat:1.7.1")

    // Media session + notification. media3 supplies the MediaStyle notification,
    // artwork loading and Android Auto / Wear / Bluetooth metadata for free.
    implementation("androidx.media3:media3-session:1.10.1")
    implementation("androidx.media3:media3-datasource:1.10.1")
}
