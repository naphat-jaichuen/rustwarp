// Extensions API for frontend
import { invoke } from '@tauri-apps/api/tauri';

/**
 * Extension type definition
 * @typedef {Object} Extension
 * @property {string} name - Extension name
 * @property {string} version - Extension version
 * @property {string} description - Extension description
 * @property {string} executable - Executable name
 * @property {string} type - Extension type (usually "subprocess")
 */

/**
 * Extensions Manager for frontend
 */
export class ExtensionsManager {
    constructor() {
        this.cache = new Map();
        this.extensions = [];
    }

    /**
     * Initialize the extensions manager
     * @returns {Promise<void>}
     */
    async initialize() {
        try {
            this.extensions = await this.getAvailableExtensions();
            console.log(`Loaded ${this.extensions.length} extensions:`, this.extensions.map(e => e.name));
        } catch (error) {
            console.warn('Failed to initialize extensions:', error);
            this.extensions = [];
        }
    }

    /**
     * Get all available extensions
     * @returns {Promise<Extension[]>}
     */
    async getAvailableExtensions() {
        try {
            return await invoke('get_available_extensions');
        } catch (error) {
            console.error('Failed to get available extensions:', error);
            return [];
        }
    }

    /**
     * Execute an extension command
     * @param {string} name - Extension name
     * @param {string[]} args - Command arguments
     * @returns {Promise<string>}
     */
    async executeExtension(name, args = []) {
        try {
            return await invoke('execute_extension_command', { name, args });
        } catch (error) {
            console.error(`Failed to execute extension '${name}':`, error);
            throw error;
        }
    }

    /**
     * Check if an extension exists
     * @param {string} name - Extension name
     * @returns {Promise<boolean>}
     */
    async hasExtension(name) {
        try {
            return await invoke('check_extension_exists', { name });
        } catch (error) {
            console.error(`Failed to check extension '${name}':`, error);
            return false;
        }
    }

    /**
     * Get extension by name
     * @param {string} name - Extension name
     * @returns {Extension|null}
     */
    getExtension(name) {
        return this.extensions.find(ext => ext.name === name) || null;
    }

    /**
     * Execute findall extension
     * @param {string} pattern - Search pattern
     * @param {Object} options - Search options
     * @param {boolean} options.recursive - Recursive search
     * @param {boolean} options.caseSensitive - Case sensitive search
     * @param {string} options.path - Search path
     * @returns {Promise<string>}
     */
    async findAll(pattern, options = {}) {
        const args = [pattern];
        
        if (options.recursive) {
            args.push('recursive');
        }
        
        if (options.caseSensitive) {
            args.push('case-sensitive');
        }
        
        if (options.path) {
            args.push('in', options.path);
        }
        
        return this.executeExtension('findall', args);
    }

    /**
     * Execute fileops extension
     * @param {string} operation - Operation (copy, move, delete, mkdir, list)
     * @param {...string} args - Operation arguments
     * @returns {Promise<string>}
     */
    async fileOps(operation, ...args) {
        return this.executeExtension('fileops', [operation, ...args]);
    }

    /**
     * Execute sysinfo extension
     * @param {string} infoType - Info type (cpu, memory, disk, env, all)
     * @returns {Promise<string>}
     */
    async sysInfo(infoType = 'all') {
        return this.executeExtension('sysinfo', [infoType]);
    }

    /**
     * Get system environment information
     * @returns {Promise<string>}
     */
    async getSystemEnv() {
        return this.sysInfo('env');
    }

    /**
     * Get system CPU information
     * @returns {Promise<string>}
     */
    async getSystemCpu() {
        return this.sysInfo('cpu');
    }

    /**
     * Get system memory information
     * @returns {Promise<string>}
     */
    async getSystemMemory() {
        return this.sysInfo('memory');
    }

    /**
     * Get system disk information
     * @returns {Promise<string>}
     */
    async getSystemDisk() {
        return this.sysInfo('disk');
    }

    /**
     * List directory contents
     * @param {string} path - Directory path
     * @returns {Promise<string>}
     */
    async listDirectory(path = '.') {
        return this.fileOps('list', path);
    }

    /**
     * Copy file
     * @param {string} source - Source path
     * @param {string} destination - Destination path
     * @returns {Promise<string>}
     */
    async copyFile(source, destination) {
        return this.fileOps('copy', source, destination);
    }

    /**
     * Move/rename file
     * @param {string} source - Source path
     * @param {string} destination - Destination path
     * @returns {Promise<string>}
     */
    async moveFile(source, destination) {
        return this.fileOps('move', source, destination);
    }

    /**
     * Delete file or directory
     * @param {string} path - Path to delete
     * @returns {Promise<string>}
     */
    async deleteFile(path) {
        return this.fileOps('delete', path);
    }

    /**
     * Create directory
     * @param {string} path - Directory path to create
     * @returns {Promise<string>}
     */
    async createDirectory(path) {
        return this.fileOps('mkdir', path);
    }
}

// Create a global instance
export const extensionsManager = new ExtensionsManager();

// Auto-initialize when module is imported
extensionsManager.initialize().catch(console.error);

export default extensionsManager;
