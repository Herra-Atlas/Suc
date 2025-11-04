// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        // TÄMÄ ON TÄRKEIN OSA: REKISTERÖIDÄÄN PLUGINIT
        // Tämä rivi kertoo Taurin ytimelle, että se käyttää shell- ja deep-link-toimintoja.
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_deep_link::init()) // TÄMÄ OTTAA VASTAAN 127.0.0.1-PYYNNÖT
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
