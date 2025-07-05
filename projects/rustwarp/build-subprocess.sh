#!/bin/bash

# Build script for subprocess binaries
# This script builds the subprocess binaries and optionally copies them to a distribution directory

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SRC_TAURI_DIR="src-tauri"
SUBPROCESS_DIR="subprocess"
DIST_DIR="dist/subprocess"
EXTENSIONS_DIR="dist/extensions"

echo -e "${YELLOW}Building subprocess binaries...${NC}"

# Change to src-tauri directory
cd "$SRC_TAURI_DIR" || exit 1

# Build mode (default to debug, can be changed to release)
BUILD_MODE="debug"
CARGO_FLAGS=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --release)
            BUILD_MODE="release"
            CARGO_FLAGS="--release"
            shift
            ;;
        --debug)
            BUILD_MODE="debug"
            CARGO_FLAGS=""
            shift
            ;;
        --copy)
            COPY_TO_DIST=true
            shift
            ;;
        --extensions)
            COPY_TO_EXTENSIONS=true
            shift
            ;;
        --help)
            echo "Usage: $0 [--release|--debug] [--copy] [--extensions] [--help]"
            echo "  --release:    Build in release mode (optimized)"
            echo "  --debug:      Build in debug mode (default)"
            echo "  --copy:       Copy binaries to dist directory"
            echo "  --extensions: Copy binaries to extensions directory for bundling"
            echo "  --help:       Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

echo -e "${YELLOW}Building in $BUILD_MODE mode...${NC}"

# Build the project
if cargo build $CARGO_FLAGS; then
    echo -e "${GREEN}Build successful!${NC}"
else
    echo -e "${RED}Build failed!${NC}"
    exit 1
fi

# List the built binaries
echo -e "${YELLOW}Built binaries:${NC}"
BINARY_DIR="target/$BUILD_MODE"
for binary in findall fileops sysinfo; do
    if [[ -f "$BINARY_DIR/$binary" ]]; then
        echo -e "  ${GREEN}✓${NC} $binary"
        # Show binary size
        size=$(ls -lh "$BINARY_DIR/$binary" | awk '{print $5}')
        echo -e "    Size: $size"
    else
        echo -e "  ${RED}✗${NC} $binary (not found)"
    fi
done

# Copy binaries to distribution directory if requested
if [[ "$COPY_TO_DIST" == "true" ]]; then
    echo -e "${YELLOW}Copying binaries to distribution directory...${NC}"
    
    # Go back to project root
    cd ..
    
    # Create distribution directory
    mkdir -p "$DIST_DIR"
    
    # Copy binaries
    for binary in findall fileops sysinfo; do
        if [[ -f "$SRC_TAURI_DIR/$BINARY_DIR/$binary" ]]; then
            cp "$SRC_TAURI_DIR/$BINARY_DIR/$binary" "$DIST_DIR/"
            echo -e "  ${GREEN}✓${NC} Copied $binary"
        fi
    done
    
    # Copy README
    if [[ -f "$SUBPROCESS_DIR/README.md" ]]; then
        cp "$SUBPROCESS_DIR/README.md" "$DIST_DIR/"
        echo -e "  ${GREEN}✓${NC} Copied README.md"
    fi
    
    echo -e "${GREEN}Distribution ready in $DIST_DIR/${NC}"
fi

# Copy binaries to extensions directory if requested
if [[ "$COPY_TO_EXTENSIONS" == "true" ]]; then
    echo -e "${YELLOW}Copying binaries to extensions directory for bundling...${NC}"
    
    # Go back to project root if not already there
    if [[ "$(basename "$(pwd)")" == "src-tauri" ]]; then
        cd ..
    fi
    
    # Create extensions directory
    mkdir -p "$EXTENSIONS_DIR"
    
    # Copy binaries
    for binary in findall fileops sysinfo; do
        if [[ -f "$SRC_TAURI_DIR/$BINARY_DIR/$binary" ]]; then
            cp "$SRC_TAURI_DIR/$BINARY_DIR/$binary" "$EXTENSIONS_DIR/"
            echo -e "  ${GREEN}✓${NC} Copied $binary to extensions"
        fi
    done
    
    # Create extension manifest
    cat > "$EXTENSIONS_DIR/extensions.json" << EOF
{
  "extensions": [
    {
      "name": "findall",
      "version": "0.1.0",
      "description": "File content search utility with recursive and case-sensitive options",
      "executable": "findall",
      "type": "subprocess"
    },
    {
      "name": "fileops",
      "version": "0.1.0",
      "description": "File operations utility for copy, move, delete, mkdir, and list operations",
      "executable": "fileops",
      "type": "subprocess"
    },
    {
      "name": "sysinfo",
      "version": "0.1.0",
      "description": "System information utility displaying CPU, memory, disk, and environment data",
      "executable": "sysinfo",
      "type": "subprocess"
    }
  ]
}
EOF
    echo -e "  ${GREEN}✓${NC} Created extensions manifest"
    
    echo -e "${GREEN}Extensions ready for bundling in $EXTENSIONS_DIR/${NC}"
fi

echo -e "${GREEN}Done!${NC}"
