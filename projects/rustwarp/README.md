# RustWarp - Tauri Terminal Application

A modern terminal application built with Tauri, featuring expandable content buffers, language-specific syntax highlighting, and subprocess command execution.

## Features

- **Expandable Content Buffers**: View file contents and command outputs in collapsible sections
- **Language-Specific Decoration**: Automatic syntax highlighting and visual cues for different file types
- **Subprocess Commands**: Built-in utilities for file operations, search, and system information
- **Dynamic Terminal Interface**: Interactive terminal with command suggestions and auto-completion

## Project Structure

- `src/` - Frontend JavaScript, HTML, and CSS
- `src-tauri/` - Tauri backend Rust code
- `subprocess/` - Standalone Rust binaries for subprocess execution
- `dist/` - Built distribution files

## Subprocess Binaries

The project includes several useful subprocess binaries:

- **findall**: File content search utility with recursive and case-sensitive options
- **fileops**: File operations (copy, move, delete, mkdir, list)
- **sysinfo**: System information display (CPU, memory, disk, environment)

See `subprocess/README.md` for detailed usage instructions.

## Building

### Prerequisites

- [Rust](https://rustup.rs/)
- [Node.js](https://nodejs.org/)

### Build the Application

```bash
# Install dependencies
npm install

# Build for development
npm run tauri dev

# Build for production
npm run tauri build
```

### Build Subprocess Binaries

```bash
# Build subprocess binaries (debug mode)
./build-subprocess.sh

# Build subprocess binaries (release mode) and copy to distribution
./build-subprocess.sh --release --copy
```

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
