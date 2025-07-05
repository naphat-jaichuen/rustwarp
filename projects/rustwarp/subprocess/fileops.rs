use std::env;
use std::fs;
use std::path::Path;
use std::process;

fn main() {
    let args: Vec<String> = env::args().collect();
    
    if args.len() < 2 {
        eprintln!("Usage: fileops <operation> [args...]");
        eprintln!("Operations: copy, move, delete, mkdir, list");
        process::exit(1);
    }
    
    let operation = &args[1];
    
    match operation.as_str() {
        "copy" => handle_copy(&args[2..]),
        "move" => handle_move(&args[2..]),
        "delete" => handle_delete(&args[2..]),
        "mkdir" => handle_mkdir(&args[2..]),
        "list" => handle_list(&args[2..]),
        _ => {
            eprintln!("Unknown operation: {}", operation);
            eprintln!("Available operations: copy, move, delete, mkdir, list");
            process::exit(1);
        }
    }
}

fn handle_copy(args: &[String]) {
    if args.len() < 2 {
        eprintln!("Usage: fileops copy <source> <destination>");
        process::exit(1);
    }
    
    let source = &args[0];
    let destination = &args[1];
    
    match fs::copy(source, destination) {
        Ok(_) => println!("Copied '{}' to '{}'", source, destination),
        Err(e) => {
            eprintln!("Error copying file: {}", e);
            process::exit(1);
        }
    }
}

fn handle_move(args: &[String]) {
    if args.len() < 2 {
        eprintln!("Usage: fileops move <source> <destination>");
        process::exit(1);
    }
    
    let source = &args[0];
    let destination = &args[1];
    
    match fs::rename(source, destination) {
        Ok(_) => println!("Moved '{}' to '{}'", source, destination),
        Err(e) => {
            eprintln!("Error moving file: {}", e);
            process::exit(1);
        }
    }
}

fn handle_delete(args: &[String]) {
    if args.is_empty() {
        eprintln!("Usage: fileops delete <file_or_directory>");
        process::exit(1);
    }
    
    let path = &args[0];
    let path_obj = Path::new(path);
    
    if path_obj.is_file() {
        match fs::remove_file(path) {
            Ok(_) => println!("Deleted file '{}'", path),
            Err(e) => {
                eprintln!("Error deleting file: {}", e);
                process::exit(1);
            }
        }
    } else if path_obj.is_dir() {
        match fs::remove_dir_all(path) {
            Ok(_) => println!("Deleted directory '{}'", path),
            Err(e) => {
                eprintln!("Error deleting directory: {}", e);
                process::exit(1);
            }
        }
    } else {
        eprintln!("Path '{}' does not exist", path);
        process::exit(1);
    }
}

fn handle_mkdir(args: &[String]) {
    if args.is_empty() {
        eprintln!("Usage: fileops mkdir <directory>");
        process::exit(1);
    }
    
    let directory = &args[0];
    
    match fs::create_dir_all(directory) {
        Ok(_) => println!("Created directory '{}'", directory),
        Err(e) => {
            eprintln!("Error creating directory: {}", e);
            process::exit(1);
        }
    }
}

fn handle_list(args: &[String]) {
    let path = if args.is_empty() {
        "."
    } else {
        &args[0]
    };
    
    match fs::read_dir(path) {
        Ok(entries) => {
            println!("Contents of '{}':", path);
            for entry in entries {
                match entry {
                    Ok(entry) => {
                        let path = entry.path();
                        let file_type = if path.is_dir() { "DIR" } else { "FILE" };
                        let file_name = path.file_name().unwrap_or_default().to_string_lossy();
                        println!("  {} {}", file_type, file_name);
                    }
                    Err(e) => eprintln!("Error reading entry: {}", e),
                }
            }
        }
        Err(e) => {
            eprintln!("Error listing directory: {}", e);
            process::exit(1);
        }
    }
}
