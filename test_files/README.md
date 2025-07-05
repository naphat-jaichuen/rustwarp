# RustWarp Language Decoration System

This document demonstrates the **language decoration system** implemented in RustWarp, which provides visual styling and icons for different file types.

## Features

### 🎨 Language Detection
- Automatic detection based on file extensions
- Support for 50+ programming languages and file types
- Customizable icons and color schemes

### 🦀 Supported Languages

#### Systems Programming
- **Rust** (.rs) - 🦀 Orange theme
- **C** (.c, .h) - 🔧 Gray theme  
- **C++** (.cpp, .hpp, .cc) - 🔧 Blue theme
- **Go** (.go) - 🐹 Cyan theme
- **Zig** (.zig) - ⚡ Yellow theme

#### Web Technologies
- **JavaScript** (.js) - 🟨 Yellow theme
- **TypeScript** (.ts) - 🔷 Blue theme
- **React JSX** (.jsx) - ⚛️ Cyan theme
- **React TSX** (.tsx) - ⚛️ Cyan theme
- **HTML** (.html) - 🌐 Red theme
- **CSS** (.css, .scss, .sass) - 🎨 Blue theme
- **Vue.js** (.vue) - 💚 Green theme

#### Data & Config
- **JSON** (.json) - 📋 Black theme
- **YAML** (.yaml, .yml) - 📝 Red theme
- **TOML** (.toml) - ⚙️ Brown theme
- **XML** (.xml) - 📄 Blue theme

#### Documentation
- **Markdown** (.md) - 📖 Blue theme
- **LaTeX** (.tex) - 📜 Teal theme
- **Text** (.txt) - 📄 Gray theme

## Usage

### File Display
When you drag and drop files into RustWarp, each file will be displayed with:

1. **Language Icon** - Visual indicator of the file type
2. **File Name** - Original filename with extension
3. **File Size** - Human-readable size (KB, MB, etc.)
4. **Line Count** - Number of lines in the file
5. **Language Name** - Detected programming language

### Expandable Content
Click the expand button (▶) to view the file contents with:

- **Syntax-aware styling** - Different background colors and borders
- **Language information** - Icon and name in the header
- **Scrollable content** - For large files
- **Proper formatting** - Preserved indentation and line breaks

## Example

```bash
🟨 example.js (2.1 KB, 33 lines) - JavaScript
▶ File Content: example.js JavaScript
```

When expanded, you'll see the file content with JavaScript-specific styling (yellow border and background tint).

## Configuration

The language presets are defined in the JavaScript configuration:

```javascript
const languagePresets = {
  '.js': { 
    name: 'JavaScript', 
    icon: '🟨', 
    color: '#F7DF1E', 
    bgColor: 'rgba(247, 223, 30, 0.1)' 
  },
  // ... more languages
};
```

## Future Enhancements

- [ ] Full syntax highlighting with Prism.js or similar
- [ ] Custom theme support
- [ ] User-defined language mappings
- [ ] Code folding and line numbers
- [ ] Search within file content
