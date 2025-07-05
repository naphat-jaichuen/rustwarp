# fileops - File Operations Utility

A comprehensive file operations utility for managing files and directories with cross-platform support.

## Features

- **File Operations**: Copy, move, and delete files
- **Directory Operations**: Create directories, delete directory trees, list contents
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Safe Operations**: Proper error handling and user feedback
- **Detailed Output**: Clear success/error messages

## Usage

```bash
fileops <operation> [args...]
```

### Operations

#### copy
Copy a file from source to destination.
```bash
fileops copy <source> <destination>
```

#### move
Move/rename a file or directory.
```bash
fileops move <source> <destination>
```

#### delete
Delete a file or directory (recursive for directories).
```bash
fileops delete <file_or_directory>
```

#### mkdir
Create a directory and any necessary parent directories.
```bash
fileops mkdir <directory>
```

#### list
List the contents of a directory.
```bash
fileops list [directory]
```

### Examples

```bash
# Copy a file
fileops copy document.txt backup/document_backup.txt

# Move/rename a file
fileops move old_name.txt new_name.txt

# Delete a file
fileops delete temp_file.txt

# Delete a directory and all contents
fileops delete temp_directory/

# Create a directory structure
fileops mkdir project/src/components

# List current directory
fileops list

# List specific directory
fileops list /home/user/documents
```

## Output Format

### Successful Operations
```
Copied 'file.txt' to 'backup/file.txt'
Moved 'old.txt' to 'new.txt'
Deleted file 'temp.txt'
Created directory 'new_folder'
```

### Directory Listings
```
Contents of '/home/user':
  DIR Documents
  DIR Downloads
  FILE .bashrc
  FILE .profile
```

## Building

From the subprocess/fileops directory:
```bash
cargo build
cargo run -- list .
```

From the main project:
```bash
# Built automatically with main project
cd src-tauri && cargo build
./target/debug/fileops list .
```
