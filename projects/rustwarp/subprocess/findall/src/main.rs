use std::env;
use std::fs;
use std::path::Path;
use std::process;

fn main() {
    let args: Vec<String> = env::args().collect();
    
    if args.len() < 2 {
        eprintln!("Usage: findall <pattern> [options]");
        process::exit(1);
    }
    
    let pattern = &args[1];
    let mut recursive = false;
    let mut case_sensitive = false;
    let mut search_path = ".".to_string();
    
    // Parse additional arguments
    for i in 2..args.len() {
        match args[i].as_str() {
            "recursive" => recursive = true,
            "case-sensitive" => case_sensitive = true,
            "in" => {
                if i + 1 < args.len() {
                    search_path = args[i + 1].clone();
                }
            }
            _ => {}
        }
    }
    
    println!("Finding pattern '{}' in path '{}'", pattern, search_path);
    println!("Recursive: {}, Case sensitive: {}", recursive, case_sensitive);
    
    // Simple file search implementation
    if let Err(e) = search_files(&search_path, pattern, recursive, case_sensitive) {
        eprintln!("Error: {}", e);
        process::exit(1);
    }
}

fn search_files(path: &str, pattern: &str, recursive: bool, case_sensitive: bool) -> Result<(), Box<dyn std::error::Error>> {
    let path = Path::new(path);
    
    if !path.exists() {
        return Err(format!("Path '{}' does not exist", path.display()).into());
    }
    
    let search_pattern = if case_sensitive {
        pattern.to_string()
    } else {
        pattern.to_lowercase()
    };
    
    if path.is_file() {
        search_in_file(path, &search_pattern, case_sensitive)?;
    } else if path.is_dir() {
        search_in_directory(path, &search_pattern, recursive, case_sensitive)?;
    }
    
    Ok(())
}

fn search_in_directory(dir: &Path, pattern: &str, recursive: bool, case_sensitive: bool) -> Result<(), Box<dyn std::error::Error>> {
    let entries = fs::read_dir(dir)?;
    
    for entry in entries {
        let entry = entry?;
        let path = entry.path();
        
        if path.is_file() {
            search_in_file(&path, pattern, case_sensitive)?;
        } else if path.is_dir() && recursive {
            search_in_directory(&path, pattern, recursive, case_sensitive)?;
        }
    }
    
    Ok(())
}

fn search_in_file(file: &Path, pattern: &str, case_sensitive: bool) -> Result<(), Box<dyn std::error::Error>> {
    let content = fs::read_to_string(file)?;
    
    let search_content = if case_sensitive {
        content.clone()
    } else {
        content.to_lowercase()
    };
    
    if search_content.contains(pattern) {
        println!("Found in: {}", file.display());
        
        // Show matching lines
        for (line_num, line) in content.lines().enumerate() {
            let search_line = if case_sensitive {
                line.to_string()
            } else {
                line.to_lowercase()
            };
            
            if search_line.contains(pattern) {
                println!("  Line {}: {}", line_num + 1, line);
            }
        }
    }
    
    Ok(())
}
