use std::env;
use std::fs;
use std::process;

fn main() {
    let args: Vec<String> = env::args().collect();
    
    let info_type = if args.len() > 1 {
        &args[1]
    } else {
        "all"
    };
    
    match info_type {
        "cpu" => show_cpu_info(),
        "memory" => show_memory_info(),
        "disk" => show_disk_info(),
        "env" => show_env_info(),
        "all" => {
            show_cpu_info();
            println!();
            show_memory_info();
            println!();
            show_disk_info();
            println!();
            show_env_info();
        }
        _ => {
            eprintln!("Usage: sysinfo [cpu|memory|disk|env|all]");
            process::exit(1);
        }
    }
}

fn show_cpu_info() {
    println!("=== CPU Information ===");
    
    // Try to read CPU info from /proc/cpuinfo (Linux)
    if let Ok(content) = fs::read_to_string("/proc/cpuinfo") {
        let mut model_name = String::new();
        let mut cores = 0;
        
        for line in content.lines() {
            if line.starts_with("model name") {
                if let Some(name) = line.split(':').nth(1) {
                    model_name = name.trim().to_string();
                }
            } else if line.starts_with("processor") {
                cores += 1;
            }
        }
        
        if !model_name.is_empty() {
            println!("Model: {}", model_name);
        }
        if cores > 0 {
            println!("Cores: {}", cores);
        }
    } else {
        // Fallback for other systems
        println!("Architecture: {}", env::consts::ARCH);
        println!("OS: {}", env::consts::OS);
        println!("Family: {}", env::consts::FAMILY);
    }
}

fn show_memory_info() {
    println!("=== Memory Information ===");
    
    // Try to read memory info from /proc/meminfo (Linux)
    if let Ok(content) = fs::read_to_string("/proc/meminfo") {
        let mut total_mem = 0;
        let mut available_mem = 0;
        
        for line in content.lines() {
            if line.starts_with("MemTotal:") {
                if let Some(value) = extract_kb_value(line) {
                    total_mem = value;
                }
            } else if line.starts_with("MemAvailable:") {
                if let Some(value) = extract_kb_value(line) {
                    available_mem = value;
                }
            }
        }
        
        if total_mem > 0 {
            println!("Total Memory: {} MB", total_mem / 1024);
        }
        if available_mem > 0 {
            println!("Available Memory: {} MB", available_mem / 1024);
            println!("Used Memory: {} MB", (total_mem - available_mem) / 1024);
        }
    } else {
        println!("Memory information not available on this system");
    }
}

fn show_disk_info() {
    println!("=== Disk Information ===");
    
    // Try to read disk info from /proc/mounts (Linux)
    if let Ok(content) = fs::read_to_string("/proc/mounts") {
        let mut filesystems = Vec::new();
        
        for line in content.lines() {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 3 {
                let device = parts[0];
                let mount_point = parts[1];
                let fs_type = parts[2];
                
                // Skip virtual filesystems
                if !device.starts_with("/dev/") {
                    continue;
                }
                
                filesystems.push((device.to_string(), mount_point.to_string(), fs_type.to_string()));
            }
        }
        
        if !filesystems.is_empty() {
            println!("Mounted Filesystems:");
            for (device, mount, fs_type) in filesystems {
                println!("  {} -> {} ({})", device, mount, fs_type);
            }
        }
    } else {
        println!("Disk information not available on this system");
    }
}

fn show_env_info() {
    println!("=== Environment Information ===");
    
    // Show important environment variables
    let important_vars = [
        "HOME", "PATH", "USER", "SHELL", "TERM", "PWD", "LANG", "LC_ALL"
    ];
    
    for var in &important_vars {
        if let Ok(value) = env::var(var) {
            println!("{}: {}", var, value);
        }
    }
    
    // Show current directory
    if let Ok(current_dir) = env::current_dir() {
        println!("Current Directory: {}", current_dir.display());
    }
}

fn extract_kb_value(line: &str) -> Option<u64> {
    let parts: Vec<&str> = line.split_whitespace().collect();
    if parts.len() >= 2 {
        if let Ok(value) = parts[1].parse::<u64>() {
            return Some(value);
        }
    }
    None
}
