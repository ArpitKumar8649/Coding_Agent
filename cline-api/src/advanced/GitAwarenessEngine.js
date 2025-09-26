/**
 * GitAwarenessEngine - Git integration and version control awareness
 * Provides intelligent git operations and project state tracking
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class GitAwarenessEngine {
    constructor(workspaceDir) {
        this.workspaceDir = workspaceDir;
        this.gitDir = path.join(workspaceDir, '.git');
        this.isGitRepo = false;
        this.currentBranch = null;
        this.lastCommit = null;
        
        this.initializeGitAwareness();
    }

    // Initialize git awareness
    async initializeGitAwareness() {
        try {
            await this.checkGitRepository();
            if (this.isGitRepo) {
                await this.loadGitState();
            }
        } catch (error) {
            console.warn('Git awareness initialization failed:', error.message);
        }
    }

    // Check if directory is a git repository
    async checkGitRepository() {
        try {
            await fs.access(this.gitDir);
            this.isGitRepo = true;
            console.log('✅ Git repository detected');
        } catch (error) {
            this.isGitRepo = false;
            console.log('ℹ️  No git repository found');
        }
    }

    // Load current git state
    async loadGitState() {
        try {
            this.currentBranch = this.getCurrentBranch();
            this.lastCommit = this.getLastCommit();
            
            console.log(`🔧 Git state loaded - Branch: ${this.currentBranch}, Last commit: ${this.lastCommit?.hash?.substring(0, 8)}`);
        } catch (error) {
            console.warn('Failed to load git state:', error.message);
        }
    }

    // Get current branch name
    getCurrentBranch() {
        try {
            const branch = execSync('git rev-parse --abbrev-ref HEAD', {
                cwd: this.workspaceDir,
                encoding: 'utf8'
            }).trim();
            return branch;
        } catch (error) {
            return null;
        }
    }

    // Get last commit information
    getLastCommit() {
        try {
            const hash = execSync('git rev-parse HEAD', {
                cwd: this.workspaceDir,
                encoding: 'utf8'
            }).trim();
            
            const message = execSync('git log -1 --pretty=%s', {
                cwd: this.workspaceDir,
                encoding: 'utf8'
            }).trim();
            
            const author = execSync('git log -1 --pretty=%an', {
                cwd: this.workspaceDir,
                encoding: 'utf8'
            }).trim();
            
            const date = execSync('git log -1 --pretty=%ci', {
                cwd: this.workspaceDir,
                encoding: 'utf8'
            }).trim();
            
            return {
                hash,
                message,
                author,
                date: new Date(date)
            };
        } catch (error) {
            return null;
        }
    }

    // Auto-commit changes with smart message
    async autoCommitChanges(options = {}) {
        if (!this.isGitRepo) {
            throw new Error('Not a git repository');
        }
        
        try {
            // Stage all changes
            execSync('git add .', {
                cwd: this.workspaceDir,
                encoding: 'utf8'
            });
            
            // Generate commit message
            const message = options.message || await this.generateSmartCommitMessage();
            
            // Create commit
            execSync(`git commit -m "${message}"`, {
                cwd: this.workspaceDir,
                encoding: 'utf8'
            });
            
            // Update git state
            await this.loadGitState();
            
            return {
                success: true,
                message: 'Auto-commit successful',
                commitHash: this.lastCommit?.hash,
                commitMessage: message
            };
        } catch (error) {
            throw new Error(`Auto-commit failed: ${error.message}`);
        }
    }

    // Generate smart commit message
    async generateSmartCommitMessage() {
        try {
            const status = execSync('git status --porcelain', {
                cwd: this.workspaceDir,
                encoding: 'utf8'
            });
            
            const files = status.trim().split('\n').filter(line => line.trim());
            
            if (files.length === 0) {
                return 'Update project files';
            }
            
            const addedFiles = files.filter(line => line.startsWith('A')).length;
            const modifiedFiles = files.filter(line => line.startsWith('M')).length;
            
            let message = '';
            
            if (addedFiles > 0 && modifiedFiles === 0) {
                message = `Add ${addedFiles} new file${addedFiles > 1 ? 's' : ''}`;
            } else if (modifiedFiles > 0 && addedFiles === 0) {
                message = `Update ${modifiedFiles} file${modifiedFiles > 1 ? 's' : ''}`;
            } else {
                message = `Update project with ${files.length} changes`;
            }
            
            return message;
        } catch (error) {
            return 'Update project files';
        }
    }

    // Get project info
    getProjectInfo() {
        return {
            isGitRepo: this.isGitRepo,
            currentBranch: this.currentBranch,
            lastCommit: this.lastCommit,
            workspaceDir: this.workspaceDir,
            gitDir: this.gitDir
        };
    }
}

module.exports = GitAwarenessEngine;