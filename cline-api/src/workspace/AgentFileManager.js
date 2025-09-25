/**
 * AgentFileManager - Advanced file management for coding agent
 * Tracks, analyzes, and manages all files created and modified by the agent
 */

const fs = require('fs').promises;
const path = require('path');

class AgentFileManager {
    constructor(workspacePath, contextTracker = null) {
        this.workspacePath = workspacePath;
        this.contextTracker = contextTracker;
        
        // File tracking
        this.createdFiles = new Map();
        this.modifiedFiles = new Map();
        this.fileRelationships = new Map();
        this.fileAnalysis = new Map();
        
        // Project state
        this.projectDependencies = new Set();
        this.projectFramework = null;
        this.projectFeatures = new Set();
        
        this.initialized = false;
    }

    // Initialize the file manager
    async initialize() {
        if (this.initialized) return;
        
        console.log('📁 Initializing Agent File Manager...');
        
        // Ensure workspace exists
        await this.ensureWorkspaceExists();
        
        // Scan existing files
        await this.scanExistingFiles();
        
        this.initialized = true;
        console.log('✅ Agent File Manager initialized');
    }

    // Ensure workspace directory exists
    async ensureWorkspaceExists() {
        try {
            await fs.access(this.workspacePath);
        } catch {
            await fs.mkdir(this.workspacePath, { recursive: true });
            console.log(`📁 Created workspace: ${this.workspacePath}`);
        }
    }

    // Scan existing files in workspace
    async scanExistingFiles() {
        try {
            const files = await this.listFilesRecursively(this.workspacePath);
            
            for (const file of files) {
                // Add to tracking as existing (not created by agent)
                const content = await this.readFile(file);
                if (content) {
                    await this.analyzeAndTrackFile(file, content, false);
                }
            }
            
            console.log(`📄 Scanned ${files.length} existing files`);
        } catch (error) {
            console.log('📁 No existing files found or error scanning workspace');
        }
    }

    // Create file with comprehensive tracking
    async createFileWithTracking(filePath, content) {
        const absolutePath = this.getAbsolutePath(filePath);
        const directory = path.dirname(absolutePath);
        
        // Ensure directory exists
        await fs.mkdir(directory, { recursive: true });
        
        // Write file
        await fs.writeFile(absolutePath, content, 'utf-8');
        
        // Track creation
        const fileInfo = {
            path: filePath,
            absolutePath,
            content,
            created: new Date(),
            type: this.detectFileType(filePath),
            size: content.length,
            lines: content.split('\n').length,
            dependencies: this.extractDependencies(content),
            exports: this.extractExports(content),
            imports: this.extractImports(content)
        };
        
        this.createdFiles.set(filePath, fileInfo);
        
        // Analyze file and update project context
        await this.analyzeAndTrackFile(filePath, content, true);
        
        console.log(`📝 Created file: ${filePath} (${content.length} chars)`);
        
        return fileInfo;
    }

    // Edit file with context tracking
    async editFileWithContext(filePath, changes) {
        const currentContent = await this.readFile(filePath);
        if (!currentContent) {
            throw new Error(`File not found: ${filePath}`);
        }

        let newContent;
        
        switch (changes.type) {
            case 'replace':
                // Apply diff or replace content
                newContent = changes.newContent;
                break;
            case 'edit':
                newContent = changes.newContent;
                break;
            case 'modify':
                newContent = changes.newContent;
                break;
            default:
                newContent = changes.newContent || currentContent;
        }

        // Write updated content
        const absolutePath = this.getAbsolutePath(filePath);
        await fs.writeFile(absolutePath, newContent, 'utf-8');
        
        // Track modification
        const changeInfo = {
            path: filePath,
            originalContent: currentContent,
            newContent,
            changes,
            modified: new Date(),
            type: changes.type,
            diff: this.createDiff(currentContent, newContent)
        };
        
        this.modifiedFiles.set(filePath, changeInfo);
        
        // Re-analyze file
        await this.analyzeAndTrackFile(filePath, newContent, false);
        
        console.log(`✏️ Modified file: ${filePath}`);
        
        return changeInfo;
    }

    // Read file content
    async readFile(filePath) {
        try {
            const absolutePath = this.getAbsolutePath(filePath);
            const content = await fs.readFile(absolutePath, 'utf-8');
            return content;
        } catch (error) {
            return null;
        }
    }

    // List files in directory
    async listFiles(dirPath = '.', recursive = false) {
        const absoluteDirPath = this.getAbsolutePath(dirPath);
        
        try {
            if (recursive) {
                return await this.listFilesRecursively(absoluteDirPath);
            } else {
                const items = await fs.readdir(absoluteDirPath);
                const files = [];
                
                for (const item of items) {
                    const itemPath = path.join(absoluteDirPath, item);
                    const stat = await fs.stat(itemPath);
                    
                    if (stat.isFile()) {
                        files.push(path.relative(this.workspacePath, itemPath));
                    }
                }
                
                return files;
            }
        } catch (error) {
            return [];
        }
    }

    // List files recursively
    async listFilesRecursively(dirPath) {
        const files = [];
        
        try {
            const items = await fs.readdir(dirPath);
            
            for (const item of items) {
                // Skip hidden files and common ignore patterns
                if (item.startsWith('.') || ['node_modules', '__pycache__', 'dist', 'build'].includes(item)) {
                    continue;
                }
                
                const itemPath = path.join(dirPath, item);
                const relativePath = path.relative(this.workspacePath, itemPath);
                
                try {
                    const stat = await fs.stat(itemPath);
                    
                    if (stat.isDirectory()) {
                        const subFiles = await this.listFilesRecursively(itemPath);
                        files.push(...subFiles);
                    } else {
                        files.push(relativePath);
                    }
                } catch {
                    // Skip inaccessible files
                }
            }
        } catch {
            // Skip inaccessible directories
        }
        
        return files;
    }

    // Search files for pattern
    async searchFiles(pattern, filePattern = null) {
        const regex = new RegExp(pattern, 'gi');
        const results = [];
        
        // Get files to search
        let filesToSearch = await this.listFiles('.', true);
        
        // Filter by file pattern if provided
        if (filePattern) {
            const fileRegex = new RegExp(filePattern, 'i');
            filesToSearch = filesToSearch.filter(file => fileRegex.test(file));
        }
        
        // Search each file
        for (const file of filesToSearch) {
            try {
                const content = await this.readFile(file);
                if (content) {
                    const lines = content.split('\n');
                    
                    lines.forEach((line, lineIndex) => {
                        const matches = [...line.matchAll(regex)];
                        
                        matches.forEach(match => {
                            results.push({
                                file,
                                line: lineIndex + 1,
                                column: match.index + 1,
                                match: match[0],
                                context: line.trim(),
                                fullLine: line
                            });
                        });
                    });
                }
            } catch {
                // Skip files that can't be read
            }
        }
        
        return results;
    }

    // Analyze file and track in project context
    async analyzeAndTrackFile(filePath, content, isNewFile) {
        const analysis = {
            path: filePath,
            type: this.detectFileType(filePath),
            size: content.length,
            lines: content.split('\n').length,
            dependencies: this.extractDependencies(content),
            exports: this.extractExports(content),
            imports: this.extractImports(content),
            functions: this.extractFunctions(content),
            classes: this.extractClasses(content),
            components: this.extractComponents(content),
            isNewFile,
            analyzedAt: new Date()
        };
        
        this.fileAnalysis.set(filePath, analysis);
        
        // Update project dependencies
        analysis.dependencies.forEach(dep => this.projectDependencies.add(dep));
        
        // Update file relationships
        this.updateFileRelationships(filePath, analysis);
        
        // Detect project features
        this.detectProjectFeatures(content, filePath);
        
        return analysis;
    }

    // Detect file type from path and content
    detectFileType(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const fileName = path.basename(filePath).toLowerCase();
        
        // Configuration files
        if (['package.json', 'tsconfig.json', 'webpack.config.js', '.env'].includes(fileName)) {
            return 'config';
        }
        
        // Based on extension
        switch (ext) {
            case '.js': return 'javascript';
            case '.jsx': return 'react-component';
            case '.ts': return 'typescript';
            case '.tsx': return 'typescript-react';
            case '.vue': return 'vue-component';
            case '.py': return 'python';
            case '.html': return 'html';
            case '.css': return 'stylesheet';
            case '.scss': case '.sass': return 'sass';
            case '.json': return 'json';
            case '.md': return 'markdown';
            case '.yml': case '.yaml': return 'yaml';
            default: return 'text';
        }
    }

    // Extract dependencies from file content
    extractDependencies(content) {
        const dependencies = [];
        
        // JavaScript/TypeScript imports
        const importRegex = /import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g;
        let match;
        
        while ((match = importRegex.exec(content)) !== null) {
            const dep = match[1];
            if (!dep.startsWith('.') && !dep.startsWith('/')) {
                dependencies.push(dep);
            }
        }
        
        // Require statements
        const requireRegex = /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
        
        while ((match = requireRegex.exec(content)) !== null) {
            const dep = match[1];
            if (!dep.startsWith('.') && !dep.startsWith('/')) {
                dependencies.push(dep);
            }
        }
        
        // Python imports
        const pythonImportRegex = /(?:from\s+(\w+)|import\s+(\w+))/g;
        
        while ((match = pythonImportRegex.exec(content)) !== null) {
            const dep = match[1] || match[2];
            if (dep && !dep.includes('.')) {
                dependencies.push(dep);
            }
        }
        
        return [...new Set(dependencies)]; // Remove duplicates
    }

    // Extract exports from file content
    extractExports(content) {
        const exports = [];
        
        // ES6 exports
        const exportRegex = /export\s+(?:default\s+)?(?:class|function|const|let|var)?\s*([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
        let match;
        
        while ((match = exportRegex.exec(content)) !== null) {
            exports.push(match[1]);
        }
        
        // module.exports
        const moduleExportRegex = /module\.exports\s*=\s*([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
        
        while ((match = moduleExportRegex.exec(content)) !== null) {
            exports.push(match[1]);
        }
        
        return [...new Set(exports)];
    }

    // Extract imports from file content (local files)
    extractImports(content) {
        const imports = [];
        
        // Local imports (starting with . or /)
        const importRegex = /import\s+.*?\s+from\s+['"`]([./][^'"`]+)['"`]/g;
        let match;
        
        while ((match = importRegex.exec(content)) !== null) {
            imports.push(match[1]);
        }
        
        // Local requires
        const requireRegex = /require\s*\(\s*['"`]([./][^'"`]+)['"`]\s*\)/g;
        
        while ((match = requireRegex.exec(content)) !== null) {
            imports.push(match[1]);
        }
        
        return [...new Set(imports)];
    }

    // Extract function names from content
    extractFunctions(content) {
        const functions = [];
        
        // JavaScript/TypeScript functions
        const funcRegex = /(?:function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)|const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:\([^)]*\)\s*=>|function))/g;
        let match;
        
        while ((match = funcRegex.exec(content)) !== null) {
            functions.push(match[1] || match[2]);
        }
        
        // Python functions
        const pythonFuncRegex = /def\s+([a-zA-Z_][a-zA-Z0-9_]*)/g;
        
        while ((match = pythonFuncRegex.exec(content)) !== null) {
            functions.push(match[1]);
        }
        
        return [...new Set(functions)];
    }

    // Extract class names from content
    extractClasses(content) {
        const classes = [];
        
        // JavaScript/TypeScript classes
        const classRegex = /class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
        let match;
        
        while ((match = classRegex.exec(content)) !== null) {
            classes.push(match[1]);
        }
        
        // Python classes
        const pythonClassRegex = /class\s+([a-zA-Z_][a-zA-Z0-9_]*)/g;
        
        while ((match = pythonClassRegex.exec(content)) !== null) {
            classes.push(match[1]);
        }
        
        return [...new Set(classes)];
    }

    // Extract React components from content
    extractComponents(content) {
        const components = [];
        
        // React functional components
        const funcComponentRegex = /(?:const\s+([A-Z][a-zA-Z0-9]*)\s*=\s*\([^)]*\)\s*=>|function\s+([A-Z][a-zA-Z0-9]*)\s*\([^)]*\))/g;
        let match;
        
        while ((match = funcComponentRegex.exec(content)) !== null) {
            components.push(match[1] || match[2]);
        }
        
        // React class components
        const classComponentRegex = /class\s+([A-Z][a-zA-Z0-9]*)\s+extends\s+(?:React\.)?Component/g;
        
        while ((match = classComponentRegex.exec(content)) !== null) {
            components.push(match[1]);
        }
        
        return [...new Set(components)];
    }

    // Update file relationships
    updateFileRelationships(filePath, analysis) {
        const relationships = {
            imports: analysis.imports,
            dependencies: analysis.dependencies,
            exports: analysis.exports,
            type: analysis.type
        };
        
        this.fileRelationships.set(filePath, relationships);
        
        // Update reverse relationships (what files use this file)
        this.updateReverseRelationships(filePath);
    }

    // Update reverse relationships
    updateReverseRelationships(targetFile) {
        // Find files that import the target file
        for (const [filePath, relationships] of this.fileRelationships.entries()) {
            if (relationships.imports.some(imp => this.resolveImportPath(imp, filePath) === targetFile)) {
                if (!relationships.usedBy) {
                    relationships.usedBy = [];
                }
                if (!relationships.usedBy.includes(targetFile)) {
                    relationships.usedBy.push(targetFile);
                }
            }
        }
    }

    // Resolve import path relative to importing file
    resolveImportPath(importPath, importingFile) {
        if (importPath.startsWith('./') || importPath.startsWith('../')) {
            const dir = path.dirname(importingFile);
            return path.normalize(path.join(dir, importPath));
        }
        return importPath;
    }

    // Detect project features from content
    detectProjectFeatures(content, filePath) {
        const lower = content.toLowerCase();
        
        // Authentication
        if (lower.includes('auth') || lower.includes('login') || lower.includes('jwt')) {
            this.projectFeatures.add('authentication');
        }
        
        // API integration
        if (lower.includes('fetch') || lower.includes('axios') || lower.includes('api')) {
            this.projectFeatures.add('api-integration');
        }
        
        // State management
        if (lower.includes('usestate') || lower.includes('redux') || lower.includes('context')) {
            this.projectFeatures.add('state-management');
        }
        
        // Styling
        if (lower.includes('tailwind') || lower.includes('bootstrap') || filePath.includes('.css')) {
            this.projectFeatures.add('styling');
        }
        
        // Database
        if (lower.includes('database') || lower.includes('mongodb') || lower.includes('sql')) {
            this.projectFeatures.add('database');
        }
        
        // Testing
        if (lower.includes('test') || lower.includes('jest') || lower.includes('spec')) {
            this.projectFeatures.add('testing');
        }
    }

    // Create simple diff between old and new content
    createDiff(oldContent, newContent) {
        const oldLines = oldContent.split('\n');
        const newLines = newContent.split('\n');
        
        return {
            linesAdded: Math.max(0, newLines.length - oldLines.length),
            linesRemoved: Math.max(0, oldLines.length - newLines.length),
            totalChanges: Math.abs(newLines.length - oldLines.length),
            sizeChange: newContent.length - oldContent.length
        };
    }

    // Get absolute path from relative path
    getAbsolutePath(filePath) {
        if (path.isAbsolute(filePath)) {
            return filePath;
        }
        return path.resolve(this.workspacePath, filePath);
    }

    // Get project state
    getProjectState() {
        return {
            createdFiles: Array.from(this.createdFiles.keys()),
            modifiedFiles: Array.from(this.modifiedFiles.keys()),
            totalFiles: this.createdFiles.size + this.modifiedFiles.size,
            dependencies: Array.from(this.projectDependencies),
            features: Array.from(this.projectFeatures),
            framework: this.projectFramework,
            fileTypes: this.getFileTypeDistribution(),
            relationships: this.getFileRelationshipSummary()
        };
    }

    // Get file type distribution
    getFileTypeDistribution() {
        const distribution = {};
        
        for (const analysis of this.fileAnalysis.values()) {
            distribution[analysis.type] = (distribution[analysis.type] || 0) + 1;
        }
        
        return distribution;
    }

    // Get file relationship summary
    getFileRelationshipSummary() {
        const summary = {
            totalRelationships: this.fileRelationships.size,
            componentsWithDependencies: 0,
            mostConnectedFiles: []
        };
        
        const connectionCounts = [];
        
        for (const [filePath, relationships] of this.fileRelationships.entries()) {
            const connectionCount = relationships.imports.length + relationships.dependencies.length;
            
            if (connectionCount > 0) {
                summary.componentsWithDependencies++;
                connectionCounts.push({ file: filePath, connections: connectionCount });
            }
        }
        
        // Sort by connection count and get top 5
        connectionCounts.sort((a, b) => b.connections - a.connections);
        summary.mostConnectedFiles = connectionCounts.slice(0, 5);
        
        return summary;
    }

    // Get file analysis
    getFileAnalysis(filePath) {
        return this.fileAnalysis.get(filePath);
    }

    // Get file dependencies
    getFileDependencies(filePath) {
        const relationships = this.fileRelationships.get(filePath);
        return relationships ? relationships.dependencies : [];
    }

    // Get related files
    getRelatedFiles(filePath) {
        const relationships = this.fileRelationships.get(filePath);
        if (!relationships) return [];
        
        return [
            ...relationships.imports,
            ...(relationships.usedBy || [])
        ];
    }

    // Get statistics
    getStats() {
        return {
            workspace: this.workspacePath,
            initialized: this.initialized,
            filesCreated: this.createdFiles.size,
            filesModified: this.modifiedFiles.size,
            totalFiles: this.fileAnalysis.size,
            projectDependencies: this.projectDependencies.size,
            projectFeatures: Array.from(this.projectFeatures),
            fileTypes: this.getFileTypeDistribution()
        };
    }
}

module.exports = AgentFileManager;