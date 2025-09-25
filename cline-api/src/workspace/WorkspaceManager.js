/**
 * WorkspaceManager - Manages project workspace and file operations
 * Extracted from: /app/src/integrations/workspace/WorkspaceTracker.ts
 * Adapted for API use without VS Code dependencies
 */

const fs = require('fs').promises;
const path = require('path');

class WorkspaceManager {
    constructor(workspacePath) {
        this.workspacePath = workspacePath;
        this.filePaths = new Set();
        this.projectType = null;
        this.framework = null;
        this.initialized = false;
    }

    // Initialize the workspace
    async initialize() {
        if (this.initialized) return;
        
        console.log(`📁 Initializing workspace: ${this.workspacePath}`);
        
        // Ensure workspace directory exists
        await this.ensureDirectoryExists(this.workspacePath);
        
        // Populate existing files
        await this.populateFilePaths();
        
        // Detect project type and framework
        await this.detectProjectInfo();
        
        this.initialized = true;
        console.log(`✅ Workspace initialized: ${this.projectType} project`);
    }

    // Ensure directory exists
    async ensureDirectoryExists(dirPath) {
        try {
            await fs.access(dirPath);
        } catch {
            await fs.mkdir(dirPath, { recursive: true });
            console.log(`📁 Created directory: ${dirPath}`);
        }
    }

    // Populate file paths from existing workspace
    async populateFilePaths() {
        try {
            const files = await this.listFilesRecursively(this.workspacePath);
            files.forEach(file => this.filePaths.add(this.normalizeFilePath(file)));
            console.log(`📄 Found ${files.length} existing files in workspace`);
        } catch (error) {
            console.log('📁 Empty or new workspace, starting fresh');
        }
    }

    // Detect project type and framework from existing files
    async detectProjectInfo() {
        const files = Array.from(this.filePaths);
        
        // Check for package.json (Node.js project)
        if (files.some(f => f.endsWith('package.json'))) {
            try {
                const packagePath = path.join(this.workspacePath, 'package.json');
                const packageContent = await fs.readFile(packagePath, 'utf-8');
                const packageJson = JSON.parse(packageContent);
                
                this.projectType = 'node';
                
                // Detect framework from dependencies
                const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
                if (deps.react) this.framework = 'React';
                else if (deps.vue) this.framework = 'Vue.js';
                else if (deps.angular) this.framework = 'Angular';
                else if (deps.express) this.framework = 'Express';
                else this.framework = 'Node.js';
                
            } catch (error) {
                this.framework = 'Node.js';
            }
        }
        // Check for Python files
        else if (files.some(f => f.endsWith('.py'))) {
            this.projectType = 'python';
            
            if (files.some(f => f.includes('requirements.txt'))) {
                this.framework = 'Python';
            }
        }
        // Check for HTML files (web project)
        else if (files.some(f => f.endsWith('.html'))) {
            this.projectType = 'web';
            this.framework = 'HTML/CSS/JS';
        }
        // Default to web project for new workspaces
        else {
            this.projectType = 'web';
            this.framework = 'HTML/CSS/JS';
        }
    }

    // List files recursively
    async listFilesRecursively(dirPath, maxDepth = 10) {
        if (maxDepth <= 0) return [];
        
        try {
            const items = await fs.readdir(dirPath);
            const files = [];
            
            for (const item of items) {
                // Skip hidden files and common ignored directories
                if (item.startsWith('.') || ['node_modules', '__pycache__', 'dist', 'build'].includes(item)) {
                    continue;
                }
                
                const fullPath = path.join(dirPath, item);
                const relativePath = path.relative(this.workspacePath, fullPath);
                
                try {
                    const stat = await fs.stat(fullPath);
                    
                    if (stat.isDirectory()) {
                        // Recursively get files from subdirectory
                        const subFiles = await this.listFilesRecursively(fullPath, maxDepth - 1);
                        files.push(...subFiles);
                    } else {
                        files.push(relativePath);
                    }
                } catch (error) {
                    // Skip files that can't be accessed
                    continue;
                }
            }
            
            return files;
        } catch (error) {
            return [];
        }
    }

    // Normalize file path
    normalizeFilePath(filePath) {
        return path.resolve(this.workspacePath, filePath);
    }

    // Add file path to tracking
    addFilePath(filePath) {
        const normalized = this.normalizeFilePath(filePath);
        this.filePaths.add(normalized);
        console.log(`📄 Tracking new file: ${filePath}`);
    }

    // Remove file path from tracking
    removeFilePath(filePath) {
        const normalized = this.normalizeFilePath(filePath);
        const removed = this.filePaths.delete(normalized);
        if (removed) {
            console.log(`🗑️ Stopped tracking file: ${filePath}`);
        }
        return removed;
    }

    // Get all tracked files
    getTrackedFiles() {
        return Array.from(this.filePaths).map(fullPath => 
            path.relative(this.workspacePath, fullPath)
        );
    }

    // Get workspace info
    getWorkspaceInfo() {
        return {
            path: this.workspacePath,
            projectType: this.projectType,
            framework: this.framework,
            fileCount: this.filePaths.size,
            initialized: this.initialized
        };
    }

    // Analyze workspace structure
    async analyzeStructure() {
        const files = this.getTrackedFiles();
        
        const structure = {
            totalFiles: files.length,
            directories: new Set(),
            fileTypes: {},
            hasConfigFiles: false,
            hasSourceFiles: false,
            hasTestFiles: false
        };

        files.forEach(file => {
            // Track directories
            const dir = path.dirname(file);
            if (dir !== '.') {
                structure.directories.add(dir);
            }

            // Track file types
            const ext = path.extname(file).toLowerCase();
            structure.fileTypes[ext] = (structure.fileTypes[ext] || 0) + 1;

            // Check for special file types
            const fileName = path.basename(file).toLowerCase();
            
            if (['package.json', 'requirements.txt', 'config.js', '.env'].includes(fileName)) {
                structure.hasConfigFiles = true;
            }
            
            if (['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c'].includes(ext)) {
                structure.hasSourceFiles = true;
            }
            
            if (fileName.includes('test') || fileName.includes('spec')) {
                structure.hasTestFiles = true;
            }
        });

        structure.directories = Array.from(structure.directories);
        
        return structure;
    }

    // Get project capabilities
    getProjectCapabilities() {
        const capabilities = [];
        
        switch (this.framework) {
            case 'React':
                capabilities.push('component-development', 'jsx-support', 'npm-scripts');
                break;
            case 'Vue.js':
                capabilities.push('component-development', 'vue-templates', 'npm-scripts');
                break;
            case 'Node.js':
            case 'Express':
                capabilities.push('server-development', 'api-development', 'npm-scripts');
                break;
            case 'Python':
                capabilities.push('script-execution', 'package-management', 'testing');
                break;
            case 'HTML/CSS/JS':
                capabilities.push('web-development', 'static-sites', 'client-side-js');
                break;
        }
        
        return capabilities;
    }

    // Validate workspace
    async validateWorkspace() {
        const issues = [];
        
        try {
            // Check if workspace directory exists and is writable
            await fs.access(this.workspacePath, fs.constants.W_OK);
        } catch {
            issues.push({
                type: 'error',
                message: 'Workspace directory is not writable',
                path: this.workspacePath
            });
        }

        // Check for conflicting files
        const files = this.getTrackedFiles();
        const duplicates = this.findDuplicateFiles(files);
        
        duplicates.forEach(duplicate => {
            issues.push({
                type: 'warning',
                message: `Potential duplicate file: ${duplicate}`,
                path: duplicate
            });
        });

        return {
            isValid: issues.filter(i => i.type === 'error').length === 0,
            issues: issues
        };
    }

    // Find duplicate files (same name, different paths)
    findDuplicateFiles(files) {
        const fileNames = {};
        const duplicates = [];
        
        files.forEach(file => {
            const fileName = path.basename(file);
            if (!fileNames[fileName]) {
                fileNames[fileName] = [];
            }
            fileNames[fileName].push(file);
        });
        
        Object.entries(fileNames).forEach(([name, paths]) => {
            if (paths.length > 1) {
                duplicates.push(...paths);
            }
        });
        
        return duplicates;
    }

    // Clean up workspace (remove empty directories, etc.)
    async cleanup() {
        console.log('🧹 Cleaning up workspace...');
        
        // Remove empty directories
        const structure = await this.analyzeStructure();
        
        for (const dir of structure.directories) {
            const fullDirPath = path.join(this.workspacePath, dir);
            try {
                const items = await fs.readdir(fullDirPath);
                if (items.length === 0) {
                    await fs.rmdir(fullDirPath);
                    console.log(`🗑️ Removed empty directory: ${dir}`);
                }
            } catch {
                // Directory might not exist or not be empty
            }
        }
        
        console.log('✅ Workspace cleanup complete');
    }

    // Get workspace statistics
    getStats() {
        return {
            workspacePath: this.workspacePath,
            projectType: this.projectType,
            framework: this.framework,
            totalFiles: this.filePaths.size,
            initialized: this.initialized,
            capabilities: this.getProjectCapabilities()
        };
    }
}

module.exports = WorkspaceManager;