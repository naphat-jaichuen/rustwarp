#!/usr/bin/env node

/**
 * Extension Installation and Usage Demonstration
 * 
 * This script demonstrates how the RustWarp extension system works
 * in practice, showing the complete lifecycle from installation to usage.
 */

// Simulating the frontend ExtensionsManager API
class ExtensionsManagerDemo {
    constructor() {
        this.extensions = [
            {
                name: "findall",
                version: "0.1.0", 
                description: "File content search utility with recursive and case-sensitive options",
                executable: "findall",
                type: "subprocess"
            },
            {
                name: "fileops",
                version: "0.1.0",
                description: "File operations utility for copy, move, delete, mkdir, and list operations", 
                executable: "fileops",
                type: "subprocess"
            },
            {
                name: "sysinfo",
                version: "0.1.0",
                description: "System information utility displaying CPU, memory, disk, and environment data",
                executable: "sysinfo", 
                type: "subprocess"
            }
        ];
    }

    // Simulate the actual Tauri invoke calls with real subprocess execution
    async executeExtension(name, args = []) {
        const { spawn } = require('child_process');
        const path = require('path');
        
        const extensionPath = path.join(__dirname, 'src-tauri', 'target', 'release', 'extensions', name);
        
        return new Promise((resolve, reject) => {
            const process = spawn(extensionPath, args);
            let stdout = '';
            let stderr = '';
            
            process.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            
            process.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            
            process.on('close', (code) => {
                if (code === 0) {
                    resolve(stdout.trim());
                } else {
                    reject(new Error(`Extension ${name} failed with code ${code}: ${stderr}`));
                }
            });
            
            process.on('error', (error) => {
                reject(new Error(`Failed to execute extension ${name}: ${error.message}`));
            });
        });
    }

    async getAvailableExtensions() {
        return this.extensions;
    }

    async hasExtension(name) {
        return this.extensions.some(ext => ext.name === name);
    }

    // High-level convenience methods
    async findAll(pattern, options = {}) {
        const args = [pattern];
        
        if (options.recursive) {
            args.push('-r');
        }
        
        if (options.caseSensitive) {
            args.push('-c');
        }
        
        if (options.path) {
            args.push('in', options.path);
        }
        
        return this.executeExtension('findall', args);
    }

    async fileOps(operation, ...args) {
        return this.executeExtension('fileops', [operation, ...args]);
    }

    async sysInfo() {
        return this.executeExtension('sysinfo', []);
    }
}

// Demonstration scenarios
async function demonstrateExtensions() {
    console.log("🚀 RustWarp Extension System Demonstration");
    console.log("=" .repeat(50));
    
    const manager = new ExtensionsManagerDemo();
    
    try {
        // 1. Extension Discovery
        console.log("\n📋 1. Extension Discovery");
        console.log("-" .repeat(25));
        const extensions = await manager.getAvailableExtensions();
        console.log(`Found ${extensions.length} available extensions:`);
        extensions.forEach(ext => {
            console.log(`  ✓ ${ext.name} v${ext.version} - ${ext.description}`);
        });

        // 2. System Information Extension
        console.log("\n💻 2. System Information Extension");
        console.log("-" .repeat(35));
        try {
            const sysInfo = await manager.sysInfo();
            console.log("System Information:");
            console.log(sysInfo);
        } catch (error) {
            console.log("❌ System info failed:", error.message);
        }

        // 3. File Operations Extension  
        console.log("\n📁 3. File Operations Extension");
        console.log("-" .repeat(30));
        try {
            const listResult = await manager.fileOps('list', '.');
            console.log("Current directory contents:");
            console.log(listResult);
        } catch (error) {
            console.log("❌ File operations failed:", error.message);
        }

        // 4. Find All Extension
        console.log("\n🔍 4. Find All Extension");
        console.log("-" .repeat(25));
        try {
            const findResult = await manager.findAll('Makefile', { recursive: false });
            console.log("Search results for 'Makefile':");
            console.log(findResult);
        } catch (error) {
            console.log("❌ Find all failed:", error.message);
        }

        // 5. Extension Status Check
        console.log("\n✅ 5. Extension Status Check");
        console.log("-" .repeat(28));
        const testExtensions = ['findall', 'fileops', 'sysinfo', 'nonexistent'];
        for (const extName of testExtensions) {
            const exists = await manager.hasExtension(extName);
            console.log(`  ${exists ? '✓' : '✗'} ${extName}: ${exists ? 'Available' : 'Not found'}`);
        }

    } catch (error) {
        console.error("❌ Demonstration failed:", error);
    }
}

// Extension Installation Workflow
function showInstallationWorkflow() {
    console.log("\n🔧 Extension Installation Workflow");
    console.log("=" .repeat(50));
    
    console.log(`
📦 STEP 1: Build Extensions
   cargo make build-release
   
   This compiles all extension binaries:
   ✓ src-tauri/target/release/findall
   ✓ src-tauri/target/release/fileops  
   ✓ src-tauri/target/release/sysinfo

📋 STEP 2: Package Extensions
   cargo make package-extensions-release
   
   This creates the distribution package:
   ✓ dist/extensions/findall
   ✓ dist/extensions/fileops
   ✓ dist/extensions/sysinfo
   ✓ dist/extensions/extensions.json

🚀 STEP 3: Install Extensions
   cargo make post-build-release
   
   This places extensions alongside main binary:
   ✓ src-tauri/target/release/extensions/findall
   ✓ src-tauri/target/release/extensions/fileops
   ✓ src-tauri/target/release/extensions/sysinfo
   ✓ src-tauri/target/release/extensions/extensions.json

🎯 STEP 4: Runtime Discovery
   The ExtensionManager automatically discovers extensions by:
   1. Looking for 'extensions' folder next to the main executable
   2. Loading extensions.json manifest
   3. Validating each extension binary exists
   4. Exposing extensions via Tauri commands

💻 STEP 5: Frontend Usage
   JavaScript can now use extensions via:
   - extensionsManager.findAll('pattern')
   - extensionsManager.fileOps('list', '.')
   - extensionsManager.sysInfo()
   - extensionsManager.executeExtension('name', ['args'])
`);
}

// Real-world use cases
function showUseCases() {
    console.log("\n🌟 Real-World Use Cases");
    console.log("=" .repeat(50));
    
    console.log(`
🔍 USE CASE 1: Project Search Tool
   Frontend: Search input -> findall extension -> Display results
   Example: Find all TODO comments in codebase
   
   await extensionsManager.findAll('TODO', { 
       recursive: true, 
       caseSensitive: false 
   });

📁 USE CASE 2: File Manager Integration  
   Frontend: File browser -> fileops extension -> File operations
   Example: Copy files, create directories, list contents
   
   await extensionsManager.fileOps('copy', 'source.txt', 'backup.txt');
   await extensionsManager.fileOps('mkdir', 'new-folder');

💻 USE CASE 3: System Dashboard
   Frontend: Dashboard -> sysinfo extension -> System metrics
   Example: Display CPU, memory, environment info
   
   const systemInfo = await extensionsManager.sysInfo();
   // Parse and display in UI components

🔧 USE CASE 4: Development Tools
   Frontend: Dev tools -> Multiple extensions -> Enhanced workflow
   Example: Search files, manage project structure, monitor system
   
   // Search for configuration files
   const configs = await extensionsManager.findAll('\.config', { recursive: true });
   
   // Check system resources  
   const sysInfo = await extensionsManager.sysInfo();
   
   // Organize project files
   await extensionsManager.fileOps('mkdir', 'organized');

📱 USE CASE 5: Cross-Platform Automation
   Same JavaScript code works on Windows/macOS/Linux
   Extensions handle platform-specific operations
   
   // Works the same on all platforms
   await extensionsManager.listDirectory('/home/user');  // Linux
   await extensionsManager.listDirectory('C:\\\\Users');    // Windows  
   await extensionsManager.listDirectory('/Users');       // macOS
`);
}

// Main execution
async function main() {
    showInstallationWorkflow();
    showUseCases();
    await demonstrateExtensions();
    
    console.log("\n🎉 Extension System Demonstration Complete!");
    console.log("\nThe extension system provides:");
    console.log("✓ Cross-platform subprocess execution");
    console.log("✓ Automatic extension discovery and loading");
    console.log("✓ Type-safe frontend API integration");
    console.log("✓ Comprehensive build and packaging automation");
    console.log("✓ Production-ready distribution support");
}

if (require.main === module) {
    main().catch(console.error);
}
