#!/bin/bash
# Unix shell helper for cargo-make commands
# Usage: ./make.sh [task] [args...]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if cargo-make is installed
if ! command -v cargo-make &> /dev/null; then
    echo -e "${RED}Error: cargo-make is not installed or not in PATH${NC}"
    echo -e "${YELLOW}Please install it with: cargo install cargo-make${NC}"
    exit 1
fi

# If no arguments provided, show help
if [ $# -eq 0 ]; then
    echo -e "${BLUE}RustWarp Build Helper (Unix)${NC}"
    echo "================================"
    echo ""
    echo "Usage: ./make.sh [task]"
    echo ""
    echo "Common tasks:"
    echo "  info           - Show project information"
    echo "  build          - Build debug version" 
    echo "  build-release  - Build release version"
    echo "  dev            - Start development server"
    echo "  test           - Run tests"
    echo "  dist           - Create distribution package"
    echo "  clean          - Clean build artifacts"
    echo ""
    echo "For complete list of tasks:"
    echo "  ./make.sh --list-all-steps"
    echo ""
    echo "Examples:"
    echo "  ./make.sh build"
    echo "  ./make.sh build-release"
    echo "  ./make.sh dev"
    exit 0
fi

# Handle special cases
case "$1" in
    --list-all-steps)
        cargo make --list-all-steps
        exit 0
        ;;
    --help)
        cargo make info
        exit 0
        ;;
esac

# Execute the cargo-make command with all arguments
echo -e "${GREEN}Running: cargo make $*${NC}"
cargo make "$@"
