use std::collections::HashSet;
use std::fs;
use std::sync::{Arc, RwLock};
use tauri::Manager;
use tauri::WebviewWindowBuilder;

#[cfg(target_os = "android")]
use jni::{objects::JValue, sys::jboolean};

#[tauri::command]
async fn get_blocklist(app_handle: tauri::AppHandle) -> Result<HashSet<String>, String> {
    let cache_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    let cache_path = cache_dir.join("blocklist.txt");
    let url = "https://raw.githubusercontent.com/x0uid/SpotifyAdBlock/master/hosts";
    let client = reqwest::Client::new();
    match client.get(url).send().await {
        Ok(response) => {
            if let Ok(text) = response.text().await {
                let _ = fs::create_dir_all(&cache_dir);
                let _ = fs::write(&cache_path, &text);
                return Ok(parse_blocklist(&text));
            }
        }
        Err(_) => {
            if let Ok(text) = fs::read_to_string(&cache_path) {
                return Ok(parse_blocklist(&text));
            }
        }
    }
    Err("Could not fetch or load blocklist".to_string())
}

fn parse_blocklist(text: &str) -> HashSet<String> {
    text.lines()
        .filter(|line| !line.starts_with('#') && !line.is_empty())
        .map(|line| {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() > 1 {
                parts[1].to_string()
            } else {
                parts[0].to_string()
            }
        })
        .filter(|domain| !domain.is_empty() && *domain != "0.0.0.0" && *domain != "127.0.0.1")
        // CRITICAL: Never block Spotify infrastructure (causes "playback paused" / freezes)
        // These domains handle WebSocket connections, audio streaming, and session management.
        .filter(|domain| {
            !domain.contains("dealer.spotify.com")
                && !domain.contains("apresolve.spotify.com")
                && !domain.contains("audio")
                && !domain.contains("spclient.spotify.com")
                && !domain.contains("gslb.spotify.com")
                && !domain.contains("open.scdn.co")
                && !domain.contains("open.spotify.com")
                && !domain.contains("play.spotify.com")
                && !domain.contains("wg.spotify.com")
                && !domain.contains("api.spotify.com")
                && !domain.contains("api-partner.spotify.com")
                && !domain.contains("pscdn.co")
                && !domain.contains("i.scdn.co")
                && !domain.contains("t.scdn.co")
        })
        .collect()
}

/// Hardcoded ad/tracking URL patterns for instant blocking without waiting for remote blocklist.
/// IMPORTANT: These are SAFE to block — they are pure ad/tracking endpoints only.
/// Do NOT add spclient.wg.spotify.com (general), analytics.spotify.com, log.spotify.com,
/// exp.spotify.com, or dealer endpoints — blocking those breaks playback.
const BUILTIN_AD_PATTERNS: &[&str] = &[
    // Pure Spotify ad endpoints (safe to block)
    "/ad-logic/",
    "spclient.wg.spotify.com/ads",
    "spclient.wg.spotify.com/ad-logic",
    "api.spotify.com/v1/ads",
    "audio-ads.spotify.com",
    "adeventtracker.spotify.com",
    "adgen.spotify.com",
    "ad-proxy.spotify.com",
    "adstudio.spotify.com",
    "ads-fa.spotify.com",
    "ads.spotify.com",
    "pixel.spotify.com",
    "video-ak.cdn.spotify.com",
    // Third-party ad networks (always safe)
    "doubleclick.net",
    "googleadservices.com",
    "googletagservices.com",
    "googlesyndication.com",
    "pagead2.googlesyndication.com",
    "securepubads.g.doubleclick.net",
    "moatads.com",
    "comscore.com",
    "scorecardresearch.com",
    "admob.com",
    // More ad networks
    "adsrvr.org",
    "adnxs.com",
    "casalemedia.com",
    "criteo.com",
    "rubiconproject.com",
    "openx.net",
    "pubmatic.com",
    "taboola.com",
    "outbrain.com",
    "spotxchange.com",
    "freewheel.tv",
    "smartadserver.com",
    "liveramp.com",
    "rlcdn.com",
    "contextweb.com",
    "lijit.com",
    "tremorhub.com",
    "yieldmo.com",
    "sharethrough.com",
];

/// Fast check: does the URI match any built-in pattern?
/// Returns empty-200 rather than 403 to avoid anti-adblock detection.
#[inline]
fn matches_builtin_patterns(uri: &str) -> bool {
    BUILTIN_AD_PATTERNS.iter().any(|pattern| uri.contains(pattern))
}

/// Fast check: does the URI's domain match any blocklist domain?
/// Extracts domain from URI and checks exact HashSet membership for O(1) lookup.
#[allow(dead_code)]
fn matches_blocklist_domain(uri: &str, blocklist: &HashSet<String>) -> bool {
    // Extract domain from URI: "https://foo.bar.com/path" → "foo.bar.com"
    if let Some(start) = uri.find("://") {
        let rest = &uri[start + 3..];
        let domain = rest.split('/').next().unwrap_or("");
        let domain = domain.split(':').next().unwrap_or(""); // strip port

        // Check exact match
        if blocklist.contains(domain) {
            return true;
        }
        // Check parent domains (e.g. "sub.ads.spotify.com" → "ads.spotify.com")
        let mut parts: &str = domain;
        while let Some(idx) = parts.find('.') {
            parts = &parts[idx + 1..];
            if blocklist.contains(parts) {
                return true;
            }
        }
    }
    false
}

#[tauri::command]
async fn update_media_info(app_handle: tauri::AppHandle, title: String, artist: String, is_playing: bool) -> Result<(), String> {
    #[cfg(target_os = "android")]
    {
        let window = app_handle.get_webview_window("main").ok_or_else(|| "Main window not found".to_string())?;
        window.with_webview(move |webview| {
            webview.jni_handle().exec(move |env, activity, _webview| {
                let _ = (|| -> Result<(), Box<dyn std::error::Error>> {
                    let intent_class = env.find_class("android/content/Intent")?;
                    let action = env.new_string("com.spotilie.app.UPDATE_MEDIA")?;
                    let intent = env.new_object(
                        intent_class,
                        "(Ljava/lang/String;)V",
                        &[JValue::Object(&action.into())]
                    )?;

                    let pkg_name = env.call_method(activity, "getPackageName", "()Ljava/lang/String;", &[])?;
                    let pkg_name_obj = pkg_name.l()?;
                    env.call_method(&intent, "setPackage", "(Ljava/lang/String;)Landroid/content/Intent;", &[JValue::Object(&pkg_name_obj)])?;

                    let t_key = env.new_string("title")?;
                    let t_val = env.new_string(&title)?;
                    env.call_method(&intent, "putExtra", "(Ljava/lang/String;Ljava/lang/String;)Landroid/content/Intent;", &[JValue::Object(&t_key.into()), JValue::Object(&t_val.into())])?;

                    let a_key = env.new_string("artist")?;
                    let a_val = env.new_string(&artist)?;
                    env.call_method(&intent, "putExtra", "(Ljava/lang/String;Ljava/lang/String;)Landroid/content/Intent;", &[JValue::Object(&a_key.into()), JValue::Object(&a_val.into())])?;

                    let p_key = env.new_string("isPlaying")?;
                    env.call_method(&intent, "putExtra", "(Ljava/lang/String;Z)Landroid/content/Intent;", &[JValue::Object(&p_key.into()), JValue::Bool(is_playing as jboolean)])?;

                    env.call_method(activity, "sendBroadcast", "(Landroid/content/Intent;)V", &[JValue::Object(&intent)])?;
                    Ok(())
                })();
            });
        }).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let blocklist = Arc::new(RwLock::new(HashSet::<String>::new()));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_deep_link::init())
        .invoke_handler(tauri::generate_handler![get_blocklist, update_media_info])
        .setup(move |app| {
            let app_handle = app.handle().clone();
            let blocklist_for_fetch = blocklist.clone();
            tauri::async_runtime::spawn(async move {
                if let Ok(list) = get_blocklist(app_handle).await {
                    let mut lock = blocklist_for_fetch.write().unwrap();
                    *lock = list;
                }
            });

            let injector = include_str!("../../src/injector.js");

            let mut wb = WebviewWindowBuilder::new(app, "main", tauri::WebviewUrl::External("https://open.spotify.com".parse().unwrap()))
                .title("SpotiLIE Mobile Player")
                .inner_size(412.0, 915.0)
                .resizable(true)
                .visible(true)
                .focused(true)
                .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")
                .initialization_script(injector);

            wb = wb.on_web_resource_request(move |request, response| {
                let uri = request.uri().to_string();
                if matches_builtin_patterns(&uri) {
                    *response.status_mut() = tauri::http::StatusCode::OK;
                    response.headers_mut().insert(
                        tauri::http::header::CONTENT_TYPE,
                        tauri::http::HeaderValue::from_static("application/json"),
                    );
                    *response.body_mut() = b"{}".to_vec().into();
                }
            });

            wb.build()?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}