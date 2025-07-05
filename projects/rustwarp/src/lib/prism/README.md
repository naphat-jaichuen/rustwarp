# Prism.js Local Deployment

This directory contains a local deployment of Prism.js syntax highlighting library for RustWarp.

## 📁 Structure

```
lib/prism/
├── README.md                    # This file
├── prism.min.css               # Core Prism.js CSS (dark theme)
├── prism.min.js                # Core Prism.js JavaScript
├── download-language.sh        # Utility script to download additional languages
└── components/                 # Language-specific components
    ├── prism-bash.min.js
    ├── prism-c.min.js
    ├── prism-cpp.min.js
    ├── prism-css.min.js
    ├── prism-go.min.js
    ├── prism-java.min.js
    ├── prism-javascript.min.js
    ├── prism-json.min.js
    ├── prism-jsx.min.js
    ├── prism-markdown.min.js
    ├── prism-python.min.js
    ├── prism-rust.min.js
    ├── prism-sql.min.js
    ├── prism-tsx.min.js
    ├── prism-typescript.min.js
    └── prism-yaml.min.js
```

## 🎯 Currently Supported Languages

The following language components are already downloaded and ready to use:

| Language     | File                        | Status |
|-------------|----------------------------|--------|
| Bash/Shell  | `prism-bash.min.js`       | ✅ Ready |
| C           | `prism-c.min.js`          | ✅ Ready |
| C++         | `prism-cpp.min.js`        | ✅ Ready |
| CSS         | `prism-css.min.js`        | ✅ Ready |
| Go          | `prism-go.min.js`         | ✅ Ready |
| Java        | `prism-java.min.js`       | ✅ Ready |
| JavaScript  | `prism-javascript.min.js` | ✅ Ready |
| JSON        | `prism-json.min.js`       | ✅ Ready |
| JSX         | `prism-jsx.min.js`        | ✅ Ready |
| Markdown    | `prism-markdown.min.js`   | ✅ Ready |
| Python      | `prism-python.min.js`     | ✅ Ready |
| Rust        | `prism-rust.min.js`       | ✅ Ready |
| SQL         | `prism-sql.min.js`        | ✅ Ready |
| TSX         | `prism-tsx.min.js`        | ✅ Ready |
| TypeScript  | `prism-typescript.min.js` | ✅ Ready |
| YAML        | `prism-yaml.min.js`       | ✅ Ready |

## 🔽 Adding New Languages

To add support for additional programming languages:

### Option 1: Use the download script

```bash
cd src/lib/prism
./download-language.sh ruby
./download-language.sh php
./download-language.sh swift
```

### Option 2: Manual download

```bash
cd src/lib/prism/components
curl -o prism-ruby.min.js "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-ruby.min.js"
```

### Option 3: Update HTML and language presets

1. **Add to HTML** (`src/index.html`):
   ```html
   <script src="lib/prism/components/prism-ruby.min.js"></script>
   ```

2. **Update language presets** (`src/main.js`):
   ```javascript
   '.rb': { 
     name: 'Ruby', 
     icon: '💎', 
     color: '#CC342D', 
     bgColor: 'rgba(204, 52, 45, 0.1)', 
     prismLang: 'ruby' 
   }
   ```

## 🌐 Available Languages

You can download components for these languages (and many more):

- **Web**: `html`, `css`, `scss`, `sass`, `less`, `stylus`
- **Mobile**: `swift`, `kotlin`, `dart`, `objective-c`
- **Scripting**: `ruby`, `php`, `perl`, `lua`, `powershell`
- **Functional**: `haskell`, `elm`, `ocaml`, `fsharp`, `clojure`, `scala`
- **Data**: `xml`, `toml`, `ini`, `csv`, `properties`
- **Scientific**: `r`, `matlab`, `julia`, `latex`
- **DevOps**: `docker`, `nginx`, `apache`, `vim`
- **And many more...**

See the complete list at: https://prismjs.com/#supported-languages

## 🔧 Maintenance

To update Prism.js to a newer version:

1. Update the version number in the download URLs
2. Re-download the core files:
   ```bash
   curl -o prism.min.css "https://cdnjs.cloudflare.com/ajax/libs/prism/NEW_VERSION/themes/prism-tomorrow.min.css"
   curl -o prism.min.js "https://cdnjs.cloudflare.com/ajax/libs/prism/NEW_VERSION/prism.min.js"
   ```
3. Re-download all language components using the same version

## 📝 License

Prism.js is released under the MIT License. See [Prism.js GitHub repository](https://github.com/PrismJS/prism) for more details.

## 🔗 Resources

- **Prism.js Official Website**: https://prismjs.com/
- **GitHub Repository**: https://github.com/PrismJS/prism
- **Language Support**: https://prismjs.com/#supported-languages
- **Themes**: https://prismjs.com/#themes
