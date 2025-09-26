/**
 * Workspace Service - File system management for Advanced Cline API
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class WorkspaceService {
    constructor() {
        this.baseWorkspaceDir = process.env.WORKSPACE_DIR || './workspaces';
        this.ensureBaseDirectory();
    }

    async ensureBaseDirectory() {
        try {
            await fs.mkdir(this.baseWorkspaceDir, { recursive: true });
            console.log(`📁 Workspace base directory ready: ${this.baseWorkspaceDir}`);
        } catch (error) {
            console.error('❌ Failed to create workspace directory:', error);
        }
    }

    // Session workspace management
    async createSessionWorkspace(sessionId) {
        const workspacePath = path.join(this.baseWorkspaceDir, sessionId);
        
        try {
            await fs.mkdir(workspacePath, { recursive: true });
            console.log(`📁 Created workspace for session: ${sessionId}`);
            
            // Initialize git repository if enabled
            if (process.env.ENABLE_GIT === 'true') {
                await this.initializeGitRepository(workspacePath);
            }
            
            return workspacePath;
        } catch (error) {
            console.error(`❌ Failed to create workspace for ${sessionId}:`, error);
            throw error;
        }
    }

    async getSessionWorkspace(sessionId) {
        const workspacePath = path.join(this.baseWorkspaceDir, sessionId);
        
        try {
            await fs.access(workspacePath);
            return workspacePath;
        } catch (error) {
            // Workspace doesn't exist, create it
            return await this.createSessionWorkspace(sessionId);
        }
    }

    async deleteSessionWorkspace(sessionId) {
        const workspacePath = path.join(this.baseWorkspaceDir, sessionId);
        
        try {
            await fs.rm(workspacePath, { recursive: true, force: true });
            console.log(`🗑️  Deleted workspace for session: ${sessionId}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to delete workspace for ${sessionId}:`, error);
            return false;
        }
    }

    // File operations
    async writeFile(sessionId, filePath, content) {
        const workspacePath = await this.getSessionWorkspace(sessionId);
        const fullPath = path.join(workspacePath, filePath);
        const directory = path.dirname(fullPath);
        
        try {
            // Ensure directory exists
            await fs.mkdir(directory, { recursive: true });
            
            // Write file
            await fs.writeFile(fullPath, content, 'utf8');
            
            const stats = await fs.stat(fullPath);
            
            return {
                success: true,
                path: filePath,
                fullPath: fullPath,
                size: stats.size,
                lines: content.split('\n').length,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error(`❌ Failed to write file ${filePath}:`, error);
            throw error;
        }
    }

    async readFile(sessionId, filePath) {
        const workspacePath = await this.getSessionWorkspace(sessionId);
        const fullPath = path.join(workspacePath, filePath);
        
        try {
            const content = await fs.readFile(fullPath, 'utf8');
            const stats = await fs.stat(fullPath);
            
            return {
                success: true,
                path: filePath,
                content,
                size: stats.size,
                lines: content.split('\n').length,
                lastModified: stats.mtime.toISOString()
            };
        } catch (error) {
            console.error(`❌ Failed to read file ${filePath}:`, error);
            throw new Error(`File not found: ${filePath}`);
        }
    }

    async listFiles(sessionId, directoryPath = '', recursive = false) {
        const workspacePath = await this.getSessionWorkspace(sessionId);
        const fullPath = path.join(workspacePath, directoryPath);
        
        try {
            const files = await this.scanDirectory(fullPath, recursive);
            return {
                success: true,
                path: directoryPath,
                files,
                count: files.length
            };
        } catch (error) {
            console.error(`❌ Failed to list files in ${directoryPath}:`, error);
            throw error;
        }
    }

    async scanDirectory(dirPath, recursive) {
        const files = [];
        
        try {
            const entries = await fs.readdir(dirPath);
            
            for (const entry of entries) {
                if (entry.startsWith('.') && entry !== '.env') continue; // Skip hidden files except .env
                
                const fullPath = path.join(dirPath, entry);
                const stats = await fs.stat(fullPath);
                
                if (stats.isFile()) {
                    files.push({
                        name: entry,
                        path: fullPath,
                        type: 'file',
                        size: stats.size,
                        extension: path.extname(entry),
                        lastModified: stats.mtime.toISOString()
                    });
                } else if (stats.isDirectory() && recursive) {
                    const subFiles = await this.scanDirectory(fullPath, true);
                    files.push(...subFiles);
                    
                    files.push({
                        name: entry,
                        path: fullPath,
                        type: 'directory',
                        lastModified: stats.mtime.toISOString()
                    });
                }
            }
        } catch (error) {
            console.error(`Error scanning directory ${dirPath}:`, error);
        }
        
        return files;
    }

    // Git operations
    async initializeGitRepository(workspacePath) {
        try {
            execSync('git init', { cwd: workspacePath, stdio: 'ignore' });
            execSync('git config user.name "Cline Advanced API"', { cwd: workspacePath, stdio: 'ignore' });
            execSync('git config user.email "cline@api.local"', { cwd: workspacePath, stdio: 'ignore' });
            
            // Create initial .gitignore
            const gitignoreContent = `# Dependencies
node_modules/
.npm
.yarn

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Build outputs
build/
dist/
.next/
.nuxt/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
`;
            
            await fs.writeFile(path.join(workspacePath, '.gitignore'), gitignoreContent);
            console.log(`🔧 Git repository initialized: ${workspacePath}`);
            
            return true;
        } catch (error) {
            console.error('❌ Git initialization failed:', error);
            return false;
        }
    }

    async commitChanges(sessionId, message) {
        const workspacePath = await this.getSessionWorkspace(sessionId);
        
        try {
            execSync('git add .', { cwd: workspacePath, stdio: 'ignore' });
            execSync(`git commit -m "${message}"`, { cwd: workspacePath, stdio: 'ignore' });
            
            const commitHash = execSync('git rev-parse HEAD', { 
                cwd: workspacePath, 
                encoding: 'utf8' 
            }).trim();
            
            console.log(`📝 Git commit created: ${commitHash.substring(0, 8)}`);
            
            return {
                success: true,
                hash: commitHash,
                message,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Git commit failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getGitStatus(sessionId) {
        const workspacePath = await this.getSessionWorkspace(sessionId);
        
        try {
            const status = execSync('git status --porcelain', { 
                cwd: workspacePath, 
                encoding: 'utf8' 
            });
            
            const branch = execSync('git rev-parse --abbrev-ref HEAD', { 
                cwd: workspacePath, 
                encoding: 'utf8' 
            }).trim();
            
            return {
                branch,
                hasChanges: status.trim().length > 0,
                changes: status.trim().split('\n').filter(line => line.trim()),
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                branch: 'main',
                hasChanges: false,
                changes: [],
                error: 'Git not initialized'
            };
        }
    }

    // Project structure analysis
    async analyzeProjectStructure(sessionId) {
        const workspacePath = await this.getSessionWorkspace(sessionId);
        const files = await this.scanDirectory(workspacePath, true);
        
        const structure = {
            totalFiles: files.length,
            directories: files.filter(f => f.type === 'directory').length,
            fileTypes: {},
            hasPackageJson: false,
            framework: 'unknown',
            technologies: []
        };
        
        for (const file of files) {
            if (file.type === 'file') {
                const ext = file.extension || 'no-extension';
                structure.fileTypes[ext] = (structure.fileTypes[ext] || 0) + 1;
                
                // Detect framework and technologies
                if (file.name === 'package.json') {
                    structure.hasPackageJson = true;
                    try {
                        const packageContent = await this.readFile(sessionId, 
                            path.relative(workspacePath, file.path)
                        );
                        const pkg = JSON.parse(packageContent.content);
                        
                        // Detect framework
                        if (pkg.dependencies?.react) structure.framework = 'React';
                        else if (pkg.dependencies?.vue) structure.framework = 'Vue';
                        else if (pkg.dependencies?.angular) structure.framework = 'Angular';
                        
                        // Detect technologies
                        if (pkg.dependencies?.tailwindcss || pkg.devDependencies?.tailwindcss) {
                            structure.technologies.push('Tailwind CSS');
                        }
                        if (pkg.dependencies?.typescript || pkg.devDependencies?.typescript) {
                            structure.technologies.push('TypeScript');
                        }
                    } catch (error) {
                        console.error('Error parsing package.json:', error);
                    }
                }
            }
        }
        
        return structure;
    }

    // Cleanup old workspaces
    async cleanupOldWorkspaces(maxAge = 24 * 60 * 60 * 1000) { // 24 hours default
        try {
            const entries = await fs.readdir(this.baseWorkspaceDir);
            let cleanedCount = 0;
            
            for (const entry of entries) {
                const entryPath = path.join(this.baseWorkspaceDir, entry);
                const stats = await fs.stat(entryPath);
                
                if (stats.isDirectory() && Date.now() - stats.mtime.getTime() > maxAge) {
                    await fs.rm(entryPath, { recursive: true, force: true });
                    cleanedCount++;
                }
            }
            
            console.log(`🧹 Cleaned up ${cleanedCount} old workspaces`);
            return cleanedCount;
        } catch (error) {
            console.error('❌ Workspace cleanup failed:', error);
            return 0;
        }
    }
}

module.exports = WorkspaceService;