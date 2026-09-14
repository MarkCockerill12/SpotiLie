plugins {
    id("com.android.application") version "8.11.0" apply false
    // Must track the kotlin-stdlib that GeckoView/media3 pull in, or the
    // compiler rejects their metadata version.
    id("org.jetbrains.kotlin.android") version "2.3.21" apply false
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
