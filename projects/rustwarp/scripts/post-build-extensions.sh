#!/bin/bash

# Post-build script to set up extensions alongside the main binary
# This script should be run after building the Tauri application

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TAURI_TARGET_DIR="src-tauri/target"
EXTENSIONS_SOURCE="dist/extensions"
APP_NAME="rustwarp"

echo -e "${BLUE}=== Post-Build Extensions Setup ===${NC}"

# Function to set up extensions for a specific build mode
setup_extensions() {
    local build_mode=$1
    local target_dir="$TAURI_TARGET_DIR/$build_mode"
    
    echo -e "${YELLOW}Setting up extensions for $build_mode build...${NC}"
    
    # Check if the main binary exists
    if [[ ! -f "$target_dir/$APP_NAME" ]]; then
        echo -e "${RED}Error: Main binary not found at $target_dir/$APP_NAME${NC}"
        return 1
    fi
    
    # Create extensions directory alongside the main binary
    local extensions_target="$target_dir/extensions"
    mkdir -p "$extensions_target"
    
    # Copy extension binaries
    if [[ -d "$EXTENSIONS_SOURCE" ]]; then
        echo -e "${YELLOW}Copying extensions to $extensions_target${NC}"
        
        # Copy all extension binaries
        for binary in findall fileops sysinfo; do
            if [[ -f "$EXTENSIONS_SOURCE/$binary" ]]; then
                cp "$EXTENSIONS_SOURCE/$binary" "$extensions_target/"
                echo -e "  ${GREEN}✓${NC} Copied $binary"
            else
                echo -e "  ${RED}✗${NC} $binary not found in $EXTENSIONS_SOURCE"
            fi
        done
        
        # Copy extensions manifest
        if [[ -f "$EXTENSIONS_SOURCE/extensions.json" ]]; then
            cp "$EXTENSIONS_SOURCE/extensions.json" "$extensions_target/"
            echo -e "  ${GREEN}✓${NC} Copied extensions.json"
        else
            echo -e "  ${RED}✗${NC} extensions.json not found"
        fi
        
        echo -e "${GREEN}Extensions setup complete for $build_mode build${NC}"
    else
        echo -e "${RED}Error: Extensions source directory not found: $EXTENSIONS_SOURCE${NC}"
        return 1
    fi
}

# Function to set up extensions for macOS app bundle
setup_macos_bundle() {
    local build_mode=$1
    local bundle_dir="$TAURI_TARGET_DIR/$build_mode/bundle/macos/$APP_NAME.app"
    
    if [[ -d "$bundle_dir" ]]; then
        echo -e "${YELLOW}Setting up extensions for macOS app bundle...${NC}"
        
        local contents_dir="$bundle_dir/Contents"
        local macos_dir="$contents_dir/MacOS"
        local resources_dir="$contents_dir/Resources"
        
        # Create extensions directory in the app bundle
        local extensions_target="$macos_dir/extensions"
        mkdir -p "$extensions_target"
        
        # Copy extension binaries to the app bundle
        if [[ -d "$EXTENSIONS_SOURCE" ]]; then
            for binary in findall fileops sysinfo; do
                if [[ -f "$EXTENSIONS_SOURCE/$binary" ]]; then
                    cp "$EXTENSIONS_SOURCE/$binary" "$extensions_target/"
                    chmod +x "$extensions_target/$binary"
                    echo -e "  ${GREEN}✓${NC} Copied $binary to app bundle"
                fi
            done
            
            # Copy extensions manifest
            if [[ -f "$EXTENSIONS_SOURCE/extensions.json" ]]; then
                cp "$EXTENSIONS_SOURCE/extensions.json" "$extensions_target/"
                echo -e "  ${GREEN}✓${NC} Copied extensions.json to app bundle"
            fi
            
            echo -e "${GREEN}macOS app bundle extensions setup complete${NC}"
        fi
    fi
}

# Parse command line arguments
BUILD_MODE=""
BUNDLE_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --debug)
            BUILD_MODE="debug"
            shift
            ;;
        --release)
            BUILD_MODE="release"
            shift
            ;;
        --bundle-only)
            BUNDLE_ONLY=true
            shift
            ;;
        --help)
            echo "Usage: $0 [--debug|--release] [--bundle-only] [--help]"
            echo "  --debug:       Set up extensions for debug build"
            echo "  --release:     Set up extensions for release build"
            echo "  --bundle-only: Only set up extensions for app bundles"
            echo "  --help:        Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Determine build modes to process
if [[ -z "$BUILD_MODE" ]]; then
    # Auto-detect available builds
    MODES=()
    if [[ -f "$TAURI_TARGET_DIR/debug/$APP_NAME" ]]; then
        MODES+=("debug")
    fi
    if [[ -f "$TAURI_TARGET_DIR/release/$APP_NAME" ]]; then
        MODES+=("release")
    fi
    
    if [[ ${#MODES[@]} -eq 0 ]]; then
        echo -e "${RED}Error: No built binaries found. Please build the application first.${NC}"
        exit 1
    fi
else
    MODES=("$BUILD_MODE")
fi

# Process each build mode
for mode in "${MODES[@]}"; do
    if [[ "$BUNDLE_ONLY" == "false" ]]; then
        setup_extensions "$mode"
    fi
    
    # Set up macOS app bundle if it exists
    setup_macos_bundle "$mode"
done

# Create distribution package if release build exists
if [[ " ${MODES[@]} " =~ " release " ]]; then
    echo -e "${YELLOW}Creating distribution package...${NC}"
    
    DIST_PACKAGE="dist/rustwarp-with-extensions"
    mkdir -p "$DIST_PACKAGE"
    
    # Copy main binary
    cp "$TAURI_TARGET_DIR/release/$APP_NAME" "$DIST_PACKAGE/"
    
    # Copy extensions directory
    if [[ -d "$TAURI_TARGET_DIR/release/extensions" ]]; then
        cp -r "$TAURI_TARGET_DIR/release/extensions" "$DIST_PACKAGE/"
    fi
    
    # Create a launch script
    cat > "$DIST_PACKAGE/launch.sh" << 'EOF'
#!/bin/bash
# Launch script for RustWarp with extensions

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Set the working directory to the script directory
cd "$SCRIPT_DIR"

# Launch the application
./rustwarp
EOF
    
    chmod +x "$DIST_PACKAGE/launch.sh"
    
    echo -e "${GREEN}Distribution package created at: $DIST_PACKAGE${NC}"
fi

echo -e "${BLUE}=== Extensions Setup Complete ===${NC}"
echo -e "${GREEN}Extensions are now available alongside the main binary!${NC}"

# Show final structure
echo -e "\n${YELLOW}Final structure:${NC}"
for mode in "${MODES[@]}"; do
    echo -e "${BLUE}$mode build:${NC}"
    if [[ -d "$TAURI_TARGET_DIR/$mode/extensions" ]]; then
        ls -la "$TAURI_TARGET_DIR/$mode/extensions" | sed 's/^/  /'
    fi
    echo
done
