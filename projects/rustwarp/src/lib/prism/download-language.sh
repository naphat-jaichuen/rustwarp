#!/bin/bash

# Prism.js Language Component Downloader
# Usage: ./download-language.sh <language-name>
# Example: ./download-language.sh ruby

if [ -z "$1" ]; then
    echo "Usage: $0 <language-name>"
    echo "Example: $0 ruby"
    echo ""
    echo "Available languages you can download:"
    echo "  ruby, php, swift, kotlin, dart, scala, clojure"
    echo "  haskell, elm, ocaml, fsharp, lua, perl, powershell"
    echo "  xml, html, scss, sass, vim, r, matlab, julia"
    echo "  docker, nginx, apache, latex, toml, ini"
    echo "  and many more..."
    exit 1
fi

LANGUAGE=$1
BASE_URL="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components"
COMPONENTS_DIR="$(dirname "$0")/components"

# Ensure components directory exists
mkdir -p "$COMPONENTS_DIR"

echo "🔽 Downloading Prism.js component for: $LANGUAGE"

# Download the language component
curl -f -o "$COMPONENTS_DIR/prism-$LANGUAGE.min.js" "$BASE_URL/prism-$LANGUAGE.min.js"

if [ $? -eq 0 ]; then
    echo "✅ Successfully downloaded prism-$LANGUAGE.min.js"
    echo ""
    echo "📝 To use this language component, add this line to your HTML:"
    echo "    <script src=\"lib/prism/components/prism-$LANGUAGE.min.js\"></script>"
    echo ""
    echo "🔧 Also update your language presets in main.js if needed:"
    echo "    '.ext': { ..., prismLang: '$LANGUAGE' }"
else
    echo "❌ Failed to download prism-$LANGUAGE.min.js"
    echo "   Check if the language name is correct or if the component exists."
    echo "   See: https://prismjs.com/#supported-languages"
    exit 1
fi
