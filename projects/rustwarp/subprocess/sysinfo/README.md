# sysinfo - System Information Utility

A comprehensive system information utility that displays detailed information about CPU, memory, disk, and environment.

## Features

- **CPU Information**: Model, architecture, and core count
- **Memory Information**: Total, available, and used memory
- **Disk Information**: Mounted filesystems and storage devices
- **Environment Information**: Environment variables and system paths
- **Platform Support**: Cross-platform with platform-specific optimizations
- **Flexible Output**: Display specific information or everything

## Usage

```bash
sysinfo [cpu|memory|disk|env|all]
```

### Options

- `cpu` - Show CPU information only
- `memory` - Show memory information only
- `disk` - Show disk information only
- `env` - Show environment information only
- `all` - Show all information (default)

### Examples

```bash
# Show all system information
sysinfo
sysinfo all

# Show only CPU information
sysinfo cpu

# Show only memory information
sysinfo memory

# Show disk information
sysinfo disk

# Show environment variables
sysinfo env
```

## Output Format

### CPU Information
```
=== CPU Information ===
Model: Apple M1 Pro
Cores: 8
Architecture: aarch64
OS: macos
Family: unix
```

### Memory Information
```
=== Memory Information ===
Total Memory: 16384 MB
Available Memory: 8192 MB
Used Memory: 8192 MB
```

### Disk Information
```
=== Disk Information ===
Mounted Filesystems:
  /dev/disk1s1 -> / (apfs)
  /dev/disk1s2 -> /System/Volumes/Data (apfs)
```

### Environment Information
```
=== Environment Information ===
HOME: /Users/username
PATH: /usr/local/bin:/usr/bin:/bin
USER: username
SHELL: /bin/zsh
TERM: xterm-256color
Current Directory: /path/to/current/directory
```

## Platform-Specific Features

### Linux
- Reads from `/proc/cpuinfo` for detailed CPU information
- Reads from `/proc/meminfo` for precise memory statistics
- Reads from `/proc/mounts` for filesystem information

### macOS/Windows
- Uses Rust's `std::env::consts` for basic system information
- Provides fallback information when proc filesystem is unavailable

## Building

From the subprocess/sysinfo directory:
```bash
cargo build
cargo run -- cpu
```

From the main project:
```bash
# Built automatically with main project
cd src-tauri && cargo build
./target/debug/sysinfo env
```

## Use Cases

- System monitoring and diagnostics
- Environment validation for applications
- Hardware inventory and reporting
- Debugging system-specific issues
- Performance monitoring setup
