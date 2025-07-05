use std::path::{Path, PathBuf};
use std::process::Command;
use std::fs;
use serde::{Deserialize, Serialize};
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Extension {
    pub name: String,
    pub version: String,
    pub description: String,
    pub executable: String,
    #[serde(rename = "type")]
    pub extension_type: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExtensionManifest {
    pub extensions: Vec<Extension>,
}

#[derive(Debug)]
pub struct ExtensionManager {
    extensions_path: PathBuf,
    manifest: Option<ExtensionManifest>,
}

impl ExtensionManager {
    /// Create a new ExtensionManager
    pub fn new() -> Result<Self, Box<dyn std::error::Error>> {
        let extensions_path = Self::get_extensions_directory()?;
        
        let mut manager = ExtensionManager {
            extensions_path,
            manifest: None,
        };
        
        manager.load_manifest()?;
        Ok(manager)
    }
    
    /// Create an empty ExtensionManager for fallback
    pub fn empty() -> Self {
        ExtensionManager {
            extensions_path: PathBuf::new(),
            manifest: None,
        }
    }
    
    /// Get the extensions directory path
    fn get_extensions_directory() -> Result<PathBuf, Box<dyn std::error::Error>> {
        // Priority 1: Check if running from bundled app (production)
        if let Ok(exe_path) = std::env::current_exe() {
            if let Some(parent) = exe_path.parent() {
                let extensions_path = parent.join("extensions");
                if extensions_path.exists() {
                    eprintln!("[Extensions] Using bundled extensions at: {:?}", extensions_path);
                    return Ok(extensions_path);
                }
            }
        }
        
        // Priority 2: Check target/debug/extensions (development with post-build)
        let current_dir = std::env::current_dir()?;
        let debug_extensions = current_dir
            .join("src-tauri")
            .join("target")
            .join("debug")
            .join("extensions");
        
        if debug_extensions.exists() {
            eprintln!("[Extensions] Using debug build extensions at: {:?}", debug_extensions);
            return Ok(debug_extensions);
        }
        
        // Priority 3: Check target/release/extensions (release build)
        let release_extensions = current_dir
            .join("src-tauri")
            .join("target")
            .join("release")
            .join("extensions");
        
        if release_extensions.exists() {
            eprintln!("[Extensions] Using release build extensions at: {:?}", release_extensions);
            return Ok(release_extensions);
        }
        
        // Priority 4: Create development fallback using built binaries
        let target_debug = current_dir.join("src-tauri").join("target").join("debug");
        
        if target_debug.exists() {
            eprintln!("[Extensions] Creating development extensions from built binaries");
            return Self::create_dev_extensions_directory(target_debug);
        }
        
        Err("Extensions directory not found and cannot create development fallback".into())
    }
    
    /// Create a development extensions directory using built binaries
    fn create_dev_extensions_directory(target_debug: PathBuf) -> Result<PathBuf, Box<dyn std::error::Error>> {
        let extensions_path = target_debug.join("extensions");
        
        // Create extensions directory if it doesn't exist
        if !extensions_path.exists() {
            fs::create_dir_all(&extensions_path)?;
        }
        
        // Define extension binaries to copy
        let extensions = [("findall", "findall"), ("fileops", "fileops"), ("sysinfo", "sysinfo")];
        
        // Copy extension binaries if they exist
        for (name, binary) in &extensions {
            let source = target_debug.join(binary);
            let dest = extensions_path.join(binary);
            
            if source.exists() && (!dest.exists() || 
                fs::metadata(&source)?.modified()? > fs::metadata(&dest)?.modified()?) {
                fs::copy(&source, &dest)?;
                eprintln!("[Extensions] Copied {} to development extensions", name);
            }
        }
        
        // Create or update extensions manifest
        let manifest_path = extensions_path.join("extensions.json");
        if !manifest_path.exists() {
            let manifest = ExtensionManifest {
                extensions: vec![
                    Extension {
                        name: "findall".to_string(),
                        version: "0.1.0".to_string(),
                        description: "File content search utility with recursive and case-sensitive options".to_string(),
                        executable: "findall".to_string(),
                        extension_type: "subprocess".to_string(),
                    },
                    Extension {
                        name: "fileops".to_string(),
                        version: "0.1.0".to_string(),
                        description: "File operations utility for copy, move, delete, mkdir, and list operations".to_string(),
                        executable: "fileops".to_string(),
                        extension_type: "subprocess".to_string(),
                    },
                    Extension {
                        name: "sysinfo".to_string(),
                        version: "0.1.0".to_string(),
                        description: "System information utility displaying CPU, memory, disk, and environment data".to_string(),
                        executable: "sysinfo".to_string(),
                        extension_type: "subprocess".to_string(),
                    },
                ],
            };
            
            let manifest_json = serde_json::to_string_pretty(&manifest)?;
            fs::write(&manifest_path, manifest_json)?;
            eprintln!("[Extensions] Created development extensions manifest");
        }
        
        Ok(extensions_path)
    }
    
    /// Load the extensions manifest
    pub fn load_manifest(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        let manifest_path = self.extensions_path.join("extensions.json");
        
        if manifest_path.exists() {
            let manifest_content = fs::read_to_string(manifest_path)?;
            self.manifest = Some(serde_json::from_str(&manifest_content)?);
        }
        
        Ok(())
    }
    
    /// Get all available extensions
    pub fn get_extensions(&self) -> Vec<Extension> {
        self.manifest
            .as_ref()
            .map(|m| m.extensions.clone())
            .unwrap_or_default()
    }
    
    /// Get a specific extension by name
    pub fn get_extension(&self, name: &str) -> Option<Extension> {
        self.get_extensions()
            .into_iter()
            .find(|ext| ext.name == name)
    }
    
    /// Execute an extension with arguments
    pub fn execute_extension(&self, name: &str, args: Vec<&str>) -> Result<std::process::Output, Box<dyn std::error::Error>> {
        let extension = self.get_extension(name)
            .ok_or_else(|| format!("Extension '{}' not found", name))?;
        
        let executable_path = self.extensions_path.join(&extension.executable);
        
        if !executable_path.exists() {
            return Err(format!("Extension executable '{}' not found at {:?}", extension.executable, executable_path).into());
        }
        
        let output = Command::new(executable_path)
            .args(args)
            .output()?;
        
        Ok(output)
    }
    
    /// Execute an extension and return the output as a string
    pub fn execute_extension_string(&self, name: &str, args: Vec<&str>) -> Result<String, Box<dyn std::error::Error>> {
        let output = self.execute_extension(name, args)?;
        
        if output.status.success() {
            Ok(String::from_utf8_lossy(&output.stdout).to_string())
        } else {
            let error_msg = String::from_utf8_lossy(&output.stderr);
            Err(format!("Extension execution failed: {}", error_msg).into())
        }
    }
    
    /// Check if an extension exists
    pub fn has_extension(&self, name: &str) -> bool {
        self.get_extension(name).is_some()
    }
    
    /// Get the path to an extension executable
    pub fn get_extension_path(&self, name: &str) -> Option<PathBuf> {
        self.get_extension(name)
            .map(|ext| self.extensions_path.join(ext.executable))
    }
    
    /// Get extensions directory path
    pub fn get_extensions_path(&self) -> &Path {
        &self.extensions_path
    }
}

// Tauri commands for frontend integration
#[tauri::command]
pub fn get_available_extensions(manager: tauri::State<ExtensionManager>) -> Vec<Extension> {
    manager.get_extensions()
}

#[tauri::command]
pub fn execute_extension_command(
    manager: tauri::State<ExtensionManager>,
    name: String,
    args: Vec<String>
) -> Result<String, String> {
    let args_refs: Vec<&str> = args.iter().map(|s| s.as_str()).collect();
    
    manager.execute_extension_string(&name, args_refs)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn check_extension_exists(
    manager: tauri::State<ExtensionManager>,
    name: String
) -> bool {
    manager.has_extension(&name)
}
