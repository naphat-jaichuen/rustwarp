use std::path::Path;
use std::fs;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// Check if a path is a directory
#[tauri::command]
fn is_directory(path: &str) -> Result<bool, String> {
    match fs::metadata(path) {
        Ok(metadata) => Ok(metadata.is_dir()),
        Err(e) => Err(format!("Failed to read path metadata: {}", e))
    }
}

// Handle directory operations - you can expand this function for your specific needs
#[tauri::command]
fn handle_directory(path: &str) -> Result<String, String> {
    let path_obj = Path::new(path);
    
    if !path_obj.exists() {
        return Err(format!("Path does not exist: {}", path));
    }
    
    if !path_obj.is_dir() {
        return Err(format!("Path is not a directory: {}", path));
    }
    
    // You can add your custom directory handling logic here
    // For now, just return a success message with directory info
    match fs::read_dir(path) {
        Ok(entries) => {
            let mut file_count = 0;
            let mut dir_count = 0;
            
            for entry in entries {
                if let Ok(entry) = entry {
                    if let Ok(metadata) = entry.metadata() {
                        if metadata.is_dir() {
                            dir_count += 1;
                        } else {
                            file_count += 1;
                        }
                    }
                }
            }
            
            Ok(format!("Directory processed: {} ({} files, {} subdirectories)", path, file_count, dir_count))
        },
        Err(e) => Err(format!("Failed to read directory contents: {}", e))
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![greet, is_directory, handle_directory])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
