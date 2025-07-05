# Subprocess Binaries

This directory contains standalone Rust binaries that are compiled as part of the main Tauri application. These binaries can be executed as subprocesses from the main application.

## Available Binaries

### findall
A file content search utility.

**Usage:**
```bash
findall <pattern> [options]
```

**Options:**
- `recursive` - Search recursively in subdirectories
- `case-sensitive` - Perform case-sensitive matching
- `in <path>` - Specify the search path

**Examples:**
```bash
findall "TODO" recursive in src/
findall "main" case-sensitive
findall "error" recursive case-sensitive in logs/
```

### fileops
A file operations utility.

**Usage:**
```bash
fileops <operation> [args...]
```

**Operations:**
- `copy <source> <destination>` - Copy a file
- `move <source> <destination>` - Move/rename a file
- `delete <file_or_directory>` - Delete a file or directory
- `mkdir <directory>` - Create a directory
- `list [directory]` - List contents of a directory

**Examples:**
```bash
fileops copy file1.txt file2.txt
fileops move old_name.txt new_name.txt
fileops delete temp_file.txt
fileops mkdir new_folder
fileops list /home/user/documents
```

### sysinfo
A system information utility.

**Usage:**
```bash
sysinfo [cpu|memory|disk|env|all]
```

**Options:**
- `cpu` - Show CPU information
- `memory` - Show memory information
- `disk` - Show disk information
- `env` - Show environment information
- `all` - Show all information (default)

**Examples:**
```bash
sysinfo cpu
sysinfo memory
sysinfo env
sysinfo
```

## Building

These binaries are automatically built when you build the main Tauri application:

```bash
cd src-tauri
cargo build
```

The compiled binaries will be available in `src-tauri/target/debug/` (or `src-tauri/target/release/` for release builds).

## Project Structure

Each subprocess is organized as its own mini-project:

```
subprocess/
├── README.md
├── findall/
│   ├── Cargo.toml
│   └── src/
│       └── main.rs
├── fileops/
│   ├── Cargo.toml
│   └── src/
│       └── main.rs
└── sysinfo/
    ├── Cargo.toml
    └── src/
        └── main.rs
```

## Adding New Subprocess Binaries

1. Create a new directory: `subprocess/your_binary_name/`
2. Create `subprocess/your_binary_name/Cargo.toml`:
   ```toml
   [package]
   name = "your_binary_name"
   version = "0.1.0"
   edition = "2021"
   description = "Your binary description"
   authors = ["Your Name"]
   
   [[bin]]
   name = "your_binary_name"
   path = "src/main.rs"
   ```
3. Create `subprocess/your_binary_name/src/main.rs` with your code
4. Add a `[[bin]]` section to `src-tauri/Cargo.toml`:
   ```toml
   [[bin]]
   name = "your_binary_name"
   path = "../subprocess/your_binary_name/src/main.rs"
   ```
5. Rebuild the project

## Usage from Main Application

These binaries can be executed from the main Tauri application using process spawning:

```rust
use std::process::Command;

let output = Command::new("./target/debug/findall")
    .arg("pattern")
    .arg("recursive")
    .output()
    .expect("Failed to execute process");
```
