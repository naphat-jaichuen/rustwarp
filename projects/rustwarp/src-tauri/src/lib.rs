use std::path::Path;
use std::fs;
use std::time::SystemTime;
use base64::{Engine as _, engine::general_purpose};
use serde::Serialize;
use encoding_rs::{SHIFT_JIS, UTF_8};

mod extensions;
use extensions::{ExtensionManager, get_available_extensions, execute_extension_command, check_extension_exists};

#[derive(Serialize)]
struct FileMetadata {
    modified_time: u64,
    size: u64,
    is_file: bool,
    is_dir: bool,
}

#[derive(Serialize)]
struct FileContent {
    content: String,
    encoding: String,
    size: u64,
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// Get file metadata including modification time
#[tauri::command]
fn get_file_metadata(path: &str) -> Result<FileMetadata, String> {
    let path_obj = Path::new(path);
    
    if !path_obj.exists() {
        return Err(format!("Path does not exist: {}", path));
    }
    
    match fs::metadata(path) {
        Ok(metadata) => {
            let modified_time = metadata.modified()
                .unwrap_or(SystemTime::UNIX_EPOCH)
                .duration_since(SystemTime::UNIX_EPOCH)
                .unwrap_or_default()
                .as_millis() as u64;
                
            Ok(FileMetadata {
                modified_time,
                size: metadata.len(),
                is_file: metadata.is_file(),
                is_dir: metadata.is_dir(),
            })
        },
        Err(e) => Err(format!("Failed to read file metadata: {}", e))
    }
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

// Read text file with automatic Shift-JIS detection
#[tauri::command]
fn read_text_file_with_encoding(path: &str) -> Result<FileContent, String> {
    let path_obj = Path::new(path);
    
    if !path_obj.exists() {
        return Err(format!("File does not exist: {}", path));
    }
    
    if path_obj.is_dir() {
        return Err(format!("Path is a directory, not a file: {}", path));
    }
    
    // Read the raw bytes
    let bytes = match fs::read(path) {
        Ok(bytes) => bytes,
        Err(e) => return Err(format!("Failed to read file: {}", e))
    };
    
    let file_size = bytes.len() as u64;
    
    // First try UTF-8
    if let Ok(utf8_content) = std::str::from_utf8(&bytes) {
        // Check if it looks like valid UTF-8 (no replacement characters)
        if !utf8_content.contains('\u{FFFD}') {
            return Ok(FileContent {
                content: utf8_content.to_string(),
                encoding: "UTF-8".to_string(),
                size: file_size,
            });
        }
    }
    
    // Try Shift-JIS
    let (shift_jis_content, encoding_used, had_errors) = SHIFT_JIS.decode(&bytes);
    if !had_errors {
        return Ok(FileContent {
            content: shift_jis_content.to_string(),
            encoding: "Shift-JIS".to_string(),
            size: file_size,
        });
    }
    
    // Fallback to UTF-8 with replacement
    let (utf8_content, _, _) = UTF_8.decode(&bytes);
    Ok(FileContent {
        content: utf8_content.to_string(),
        encoding: "UTF-8 (lossy)".to_string(),
        size: file_size,
    })
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
    // Initialize extension manager
    let extension_manager = ExtensionManager::new().unwrap_or_else(|e| {
        eprintln!("Warning: Failed to initialize extension manager: {}", e);
        ExtensionManager::empty()
    });
    
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .manage(extension_manager)
        .invoke_handler(tauri::generate_handler![
            greet, 
            get_file_metadata,
            is_directory, 
            handle_directory, 
            read_text_file_with_encoding,
            read_image_file,
            get_available_extensions,
            execute_extension_command,
            check_extension_exists
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
