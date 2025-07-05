# RustWarp Cargo Makefile

This project uses `cargo-make` for cross-platform build automation. The `Makefile.toml` provides a comprehensive set of tasks for building, testing, and distributing the RustWarp application with its extension system.

## Prerequisites

Install `cargo-make`:

```bash
cargo install cargo-make
```

## Quick Start

### Basic Commands

```bash
# Show project information and available tasks
cargo make info

# Build debug version (default)
cargo make build

# Build release version
cargo make build-release

# Start development server with hot reload
cargo make dev

# Run tests
cargo make test

# Create distribution package
cargo make dist

# Clean build artifacts
cargo make clean
```

## Available Tasks

### Build Tasks

- `cargo make build` - Build main application and all subprocess binaries (debug)
- `cargo make build-release` - Build everything in release mode
- `cargo make build-main` - Build only the main Tauri application
- `cargo make build-subprocesses` - Build only the subprocess binaries

### Development Tasks

- `cargo make dev` - Start development server with extensions setup
- `cargo make full-dev` - Complete development workflow with testing
- `cargo make test` - Run all tests
- `cargo make test-extensions` - Test extension binaries specifically
- `cargo make check` - Check code for errors without building
- `cargo make clippy` - Run Clippy linter
- `cargo make fmt` - Format code
- `cargo make fmt-check` - Check code formatting

### Tauri-Specific Tasks

- `cargo make tauri-dev` - Run Tauri in development mode
- `cargo make tauri-build` - Build Tauri application for production
- `cargo make tauri-build-debug` - Build Tauri application in debug mode

### Extension Management

- `cargo make setup-extensions` - Set up extensions directory structure
- `cargo make copy-extensions` - Copy extension binaries (debug)
- `cargo make copy-extensions-release` - Copy extension binaries (release)
- `cargo make package-extensions` - Package extensions with manifest (debug)
- `cargo make package-extensions-release` - Package extensions with manifest (release)

### Post-Build Tasks

- `cargo make post-build` - Set up extensions alongside main binary (debug)
- `cargo make post-build-release` - Set up extensions alongside main binary (release)

### Distribution Tasks

- `cargo make dist` - Create cross-platform distribution package
- `cargo make dist-mac` - Create macOS distribution with app bundle (macOS only)
- `cargo make dist-windows` - Create Windows distribution (Windows only)

### Platform-Specific Tasks

**macOS:**
- `cargo make setup-macos-bundle` - Set up extensions in macOS app bundle
- `cargo make mac-release` - Complete macOS release workflow

**Windows:**
- `cargo make setup-windows-bundle` - Set up extensions for Windows distribution
- `cargo make windows-release` - Complete Windows release workflow

### Utility Tasks

- `cargo make info` - Show project information and available tasks
- `cargo make list-binaries` - List all built binaries with their sizes
- `cargo make clean` - Clean build artifacts
- `cargo make clean-all` - Clean all build artifacts and distribution files

### Workflow Tasks

- `cargo make full-build` - Complete build workflow with extensions and binary listing
- `cargo make ci` - Continuous integration workflow (format check, lint, test, build)
- `cargo make release` - Full release workflow (CI + distribution)

## Cross-Platform Support

The Makefile automatically detects the platform and adjusts behavior:

### Environment Variables

- **Windows**: `BINARY_EXTENSION=".exe"`, `SCRIPT_EXTENSION=".bat"`
- **macOS/Linux**: `BINARY_EXTENSION=""`, `SCRIPT_EXTENSION=".sh"`

### Platform-Specific Features

- **macOS**: Automatic app bundle creation and extension packaging
- **Windows**: MSI installer support and standalone distribution creation
- **Linux**: Standard binary distribution

## Project Structure

The Makefile assumes the following project structure:

```
project-root/
├── Makefile.toml           # This cargo-make configuration
├── src-tauri/              # Tauri application source
│   ├── Cargo.toml          # Main Cargo manifest
│   └── src/                # Rust source code
├── subprocess/             # Subprocess binaries source
│   ├── findall/            # File search utility
│   ├── fileops/            # File operations utility
│   └── sysinfo/            # System information utility
├── dist/                   # Distribution artifacts (created)
│   ├── extensions/         # Packaged extensions
│   ├── macos/              # macOS-specific distribution
│   ├── windows-standalone/ # Windows standalone distribution
│   └── rustwarp-with-extensions/ # Cross-platform distribution
└── scripts/                # Build scripts
    └── post-build-extensions.sh
```

## Extension System

The Makefile includes comprehensive support for the extension system:

### Extension Binaries

Three subprocess binaries are built and packaged:

1. **findall** - File content search utility
2. **fileops** - File operations utility  
3. **sysinfo** - System information utility

### Extension Packaging

- Extensions are copied to `dist/extensions/`
- A manifest file (`extensions.json`) is automatically generated
- Extensions are placed alongside the main binary for runtime discovery
- macOS app bundles include extensions in `Contents/MacOS/extensions/`

### Extension Manifest

The automatically generated `extensions.json` includes:

```json
{
  "extensions": [
    {
      "name": "findall",
      "version": "0.1.0",
      "description": "File content search utility with recursive and case-sensitive options",
      "executable": "findall",
      "type": "subprocess"
    }
    // ... other extensions
  ]
}
```

## Development Workflow

### Recommended Development Cycle

1. **Start Development**:
   ```bash
   cargo make dev
   ```
   This builds everything, sets up extensions, and starts the development server.

2. **Make Changes**: Edit your code

3. **Test Extensions**:
   ```bash
   cargo make test-extensions
   ```

4. **Run Full Tests**:
   ```bash
   cargo make test
   ```

5. **Format and Lint**:
   ```bash
   cargo make fmt
   cargo make clippy
   ```

### Release Workflow

1. **Run CI Checks**:
   ```bash
   cargo make ci
   ```

2. **Create Release**:
   ```bash
   cargo make release
   ```

3. **Platform-Specific Release** (if needed):
   ```bash
   # macOS
   cargo make mac-release
   
   # Windows  
   cargo make windows-release
   ```

## Customization

### Environment Variables

You can override default values by setting environment variables:

```bash
# Custom app name
export APP_NAME="my-rustwarp"

# Custom directories
export DIST_DIR="build"
export EXTENSIONS_DIR="build/plugins"

# Run build
cargo make build
```

### Adding New Extensions

To add a new extension binary:

1. Add the binary to `src-tauri/Cargo.toml`:
   ```toml
   [[bin]]
   name = "mynewext"
   path = "../subprocess/mynewext/src/main.rs"
   ```

2. Update the copy tasks in `Makefile.toml` to include your new binary

3. Update the manifest creation task to include your extension metadata

## Troubleshooting

### Common Issues

1. **cargo-make not found**:
   ```bash
   cargo install cargo-make
   ```

2. **Extension binaries not found**:
   - Ensure subprocess binaries are defined in `src-tauri/Cargo.toml`
   - Run `cargo make build` before `cargo make copy-extensions`

3. **Platform-specific issues**:
   - Check that you're using the correct task for your platform
   - Verify platform-specific dependencies are installed

### Debug Information

Show detailed project information:
```bash
cargo make info
```

List built binaries:
```bash
cargo make list-binaries
```

## Contributing

When adding new tasks or modifying existing ones:

1. Follow the existing naming conventions
2. Add appropriate dependencies between tasks
3. Include platform-specific conditions when needed
4. Update this README with any new tasks or workflows
5. Test on multiple platforms when possible

## License

This Makefile configuration is part of the RustWarp project and follows the same license terms.
