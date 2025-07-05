use std::path::Path;
use std::fs;
use base64::{Engine as _, engine::general_purpose};

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

// Read binary file and return as base64 string
#[tauri::command]
fn read_image_file(path: &str) -> Result<String, String> {
    let path_obj = Path::new(path);
    
    if !path_obj.exists() {
        return Err(format!("File does not exist: {}", path));
    }
    
    if path_obj.is_dir() {
        return Err(format!("Path is a directory, not a file: {}", path));
    }
    
    // Check file size (limit to 10MB for safety)
    match fs::metadata(path) {
        Ok(metadata) => {
            let file_size = metadata.len();
            if file_size > 10 * 1024 * 1024 {
                return Err(format!("File too large: {} bytes (max 10MB)", file_size));
            }
        },
        Err(e) => return Err(format!("Failed to get file metadata: {}", e))
    }
    
    // Read the binary file
    match fs::read(path) {
        Ok(bytes) => {
            // Convert to base64 using base64 crate
            let base64_string = general_purpose::STANDARD.encode(&bytes);
            Ok(base64_string)
        },
        Err(e) => Err(format!("Failed to read file: {}", e))
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![greet, is_directory, handle_directory, read_image_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
