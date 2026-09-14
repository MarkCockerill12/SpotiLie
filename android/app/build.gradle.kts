import java.util.Properties
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
        versionCode = 1002
        versionName = "3.0.0"

        // Diagnostics (verbose port logging, network verdicts, the adb JS-eval
        // receiver) are opt-in via `build.ps1 -Debug`, NOT tied to the debug
        // variant: everyday installs are debug APKs too and shouldn't carry them.
        val injectorDebug = (project.findProperty("spotilieDebug") as String?) == "true"
        buildConfigField("boolean", "INJECTOR_DEBUG", injectorDebug.toString())
    }

    // Release signing comes from android/keystore.properties (gitignored). Without
    // it, release APKs are built unsigned — fine for CI, but they won't install.
    val keystoreProps = rootProject.file("keystore.properties")
    signingConfigs {
        if (keystoreProps.exists()) {
            val props = Properties().apply { keystoreProps.inputStream().use { load(it) } }
            create("release") {
                storeFile = file(props.getProperty("storeFile"))
                storePassword = props.getProperty("storePassword")
                keyAlias = props.getProperty("keyAlias")
                keyPassword = props.getProperty("keyPassword")
            }
        }
    }

    buildTypes {
        getByName("debug") {
            isDebuggable = true
            isMinifyEnabled = false
            // Day-to-day builds target the dev phone only; all three ABIs would
            // triple the APK and the install time.
            ndk { abiFilters += "arm64-v8a" }
        }
        getByName("release") {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfigs.findByName("release")?.let { signingConfig = it }
            // `-PreleaseTest=true`: identical release build under a separate package,
            // so it can be installed next to an existing (differently signed) copy
            // for on-device verification without wiping that copy's login.
            if ((project.findProperty("releaseTest") as String?) == "true") {
                applicationIdSuffix = ".releasetest"
            }
        }
    }

    // Release: one APK per ABI plus a universal APK. arm64-v8a covers practically
    // every phone from the last several years; armeabi-v7a is for older/Android Go
    // devices with a 32-bit userspace; x86_64 for emulators and Chromebooks.
    // Split only for release tasks, so debug keeps its single app-debug.apk.
    val isReleaseBuild = gradle.startParameter.taskNames.any { it.contains("Release", ignoreCase = true) }
    splits {
        abi {
            isEnable = isReleaseBuild
            reset()
            include("arm64-v8a", "armeabi-v7a", "x86_64")
            isUniversalApk = true
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
        // Store GeckoView's native libraries compressed. Uncompressed (the modern
        // default) made the universal APK ~500 MB and arm64 ~183 MB — far too much
        // for a sideloaded download. Android extracts them once at install instead.
        jniLibs.useLegacyPackaging = true
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
    // The multi-ABI artifact; ABI selection happens in splits/abiFilters above.
    implementation("org.mozilla.geckoview:geckoview:153.0.20260803132010")

    implementation("androidx.appcompat:appcompat:1.7.1")

    // Media session + notification. media3 supplies the MediaStyle notification,
    // artwork loading and Android Auto / Wear / Bluetooth metadata for free.
    implementation("androidx.media3:media3-session:1.10.1")
    implementation("androidx.media3:media3-datasource:1.10.1")
}
