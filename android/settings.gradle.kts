pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
        // GeckoView is published by Mozilla, not on Maven Central
        maven { url = uri("https://maven.mozilla.org/maven2/") }
    }
}

rootProject.name = "SpotiLIE"
include(":app")
