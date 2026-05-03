use std::fs;
use tauri::Manager;
use tauri::WebviewWindowBuilder;

#[cfg(target_os = "android")]
use jni::{objects::JValue, sys::jboolean};

#[tauri::command]
async fn get_blocklist(app_handle: tauri::AppHandle) -> Result<Vec<String>, String> {
    let cache_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    let cache_path = cache_dir.join("blocklist.txt");
    let url = "https://raw.githubusercontent.com/Isaaker/Spotify-Ads-List/main/Spotify-Ads-List.txt";
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

fn parse_blocklist(text: &str) -> Vec<String> {
    text.lines()
        .filter(|line| !line.starts_with('#') && !line.is_empty())
        .map(|line| {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() > 1 { parts[1].to_string() } else { parts[0].to_string() }
        })
        .collect()
}

#[tauri::command]
async fn update_media_info(app_handle: tauri::AppHandle, title: String, artist: String, is_playing: bool) -> Result<(), String> {
    #[cfg(target_os = "android")]
    {
        let window = app_handle.get_webview_window("main").ok_or_else(|| "Main window not found".to_string())?;
        window.with_webview(move |webview| {
            webview.jni_handle().exec(move |env, activity, _webview| {
                let _ = (|| -> Result<(), Box<dyn std::error::Error>> {
                    // Use sendBroadcast with a string action — no class lookup needed.
                    // env.find_class() uses the boot class loader from JNI native threads,
                    // which cannot see app classes like MediaForegroundService.
                    // sendBroadcast only needs android.content.Intent (a framework class).
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
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_deep_link::init())
        .invoke_handler(tauri::generate_handler![get_blocklist, update_media_info])
        .setup(|app| {
            let injector = include_str!("../../src/injector.js");
            
            let _window = WebviewWindowBuilder::new(app, "main", tauri::WebviewUrl::External("https://open.spotify.com".parse().unwrap()))
                .title("SpotiLIE")
                .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                .initialization_script(injector)
                .build()?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}