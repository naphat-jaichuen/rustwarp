# findall - File Content Search Utility

A powerful file content search utility with recursive search capabilities and flexible matching options.

## Features

- **Recursive Search**: Search through directory trees
- **Case Sensitivity Control**: Toggle case-sensitive or case-insensitive matching
- **Custom Search Paths**: Specify where to search
- **Line Number Display**: Shows matching lines with their line numbers
- **Pattern Highlighting**: Displays the exact matches found

## Usage

```bash
findall <pattern> [options]
```

### Options

- `recursive` - Search recursively in subdirectories
- `case-sensitive` - Perform case-sensitive matching (default: case-insensitive)
- `in <path>` - Specify the search path (default: current directory)

### Examples

```bash
# Basic search in current directory
findall "TODO"

# Recursive search
findall "function" recursive

# Case-sensitive search
findall "Main" case-sensitive

# Search in specific directory
findall "error" in /var/log

# Combined options
findall "import" recursive case-sensitive in src/
```

## Output Format

When matches are found, the output shows:
- File path where matches were found
- Line numbers and content of matching lines

```
Found in: src/main.rs
  Line 5: use std::process;
  Line 15: let process = Command::new("ls");
```

## Building

From the subprocess/findall directory:
```bash
cargo build
cargo run -- "pattern" recursive
```

From the main project:
```bash
# Built automatically with main project
cd src-tauri && cargo build
./target/debug/findall "pattern" recursive
```
