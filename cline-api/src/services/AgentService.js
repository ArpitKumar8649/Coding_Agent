/**
 * AgentService - Main service that integrates all agent components
 * This is the primary interface for using the Cline Agent system via API
 */

const { createAgent } = require('../agent');
const WorkspaceManager = require('../workspace/WorkspaceManager');
const AgentFileManager = require('../workspace/AgentFileManager');
// Removed cache and context services - using simplified approach
const StreamingService = require('./streamingService');
const SystemPromptEngine = require('../advanced/SystemPromptEngine');
const StreamingEngine = require('../advanced/StreamingEngine');
const LLMService = require('./llmService');

class AgentService {
    constructor(options = {}) {
        this.streamingService = options.streamingService || null;
        this.defaultWorkspace = options.defaultWorkspace || '/tmp/cline-projects';
        
        // Active agents by workspace
        this.agents = new Map();
        
        // Service statistics
        this.stats = {
            totalProjects: 0,
            completedProjects: 0,
            failedProjects: 0,
            totalFiles: 0,
            startTime: new Date()
        };
        
        console.log('🤖 Agent Service initialized');
    }

    /**
     * Create a complete project using the agent
     */
    async createProject(request) {
        const {
            description,
            workspace = null,
            preferences = {},
            userId = 'anonymous',
            streaming = false
        } = request;

        // Generate workspace path if not provided
        const workspacePath = workspace || this.generateWorkspacePath(description);
        
        console.log(`🚀 Creating project: ${workspacePath}`);
        
        try {
            // Initialize workspace and file manager
            const workspaceManager = new WorkspaceManager(workspacePath);
            const fileManager = new AgentFileManager(workspacePath);
            
            await workspaceManager.initialize();
            await fileManager.initialize();

            // Create agent controller
            const agentController = createAgent({
                workspaceManager,
                fileManager,
                contextManager: null, // Simplified for API use
                streamingService: streaming ? this.streamingService : null,
                apiConfiguration: this.getApiConfiguration()
            });

            await agentController.initialize();

            // Store agent for this workspace
            this.agents.set(workspacePath, {
                controller: agentController,
                workspaceManager,
                fileManager,
                createdAt: new Date(),
                userId
            });

            // Create task with preferences
            const taskOptions = {
                userId,
                streaming,
                autoApprovalSettings: { enabled: true },
                ...preferences
            };

            const taskResult = await agentController.createTask(description, taskOptions);

            // Update statistics
            this.stats.totalProjects++;
            if (taskResult.summary?.validationScore > 7) {
                this.stats.completedProjects++;
            }
            this.stats.totalFiles += taskResult.summary?.filesCreated?.length || 0;

            console.log(`✅ Project created successfully: ${workspacePath}`);

            return {
                success: true,
                projectId: this.generateProjectId(workspacePath),
                workspace: workspacePath,
                task: taskResult,
                files: fileManager.getProjectState(),
                projectInfo: workspaceManager.getWorkspaceInfo(),
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error(`❌ Project creation failed: ${workspacePath}`, error);
            
            this.stats.failedProjects++;
            
            throw {
                success: false,
                error: error.message,
                workspace: workspacePath,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Continue development on an existing project
     */
    async continueProject(request) {
        const {
            projectId,
            workspace: providedWorkspace,
            instruction,
            userId = 'anonymous',
            streaming = false
        } = request;

        const workspace = providedWorkspace || this.resolveWorkspaceFromProjectId(projectId);
        
        console.log(`🔄 Continuing project: ${workspace}`);

        try {
            let agentData = this.agents.get(workspace);

            // If agent doesn't exist, reinitialize for existing workspace
            if (!agentData) {
                const workspaceManager = new WorkspaceManager(workspace);
                const fileManager = new AgentFileManager(workspace);
                
                await workspaceManager.initialize();
                await fileManager.initialize();

                const agentController = createAgent({
                    workspaceManager,
                    fileManager,
                    contextManager: null, // Simplified for API use
                    streamingService: streaming ? this.streamingService : null,
                    apiConfiguration: this.getApiConfiguration()
                });

                await agentController.initialize();

                agentData = {
                    controller: agentController,
                    workspaceManager,
                    fileManager,
                    createdAt: new Date(),
                    userId
                };

                this.agents.set(workspace, agentData);
            }

            // Continue task
            const result = await agentData.controller.continueTask(
                projectId || workspace,
                instruction,
                { userId, streaming }
            );

            console.log(`✅ Project instruction completed: ${workspace}`);

            return {
                success: true,
                projectId: projectId || this.generateProjectId(workspace),
                workspace,
                result,
                files: agentData.fileManager.getProjectState(),
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error(`❌ Project continuation failed: ${workspace}`, error);
            throw error;
        }
    }

    /**
     * Get project status and information
     */
    async getProjectStatus(projectId, workspace = null) {
        const workspacePath = workspace || this.resolveWorkspaceFromProjectId(projectId);
        const agentData = this.agents.get(workspacePath);

        if (!agentData) {
            return {
                success: false,
                error: 'Project not found or not active',
                projectId,
                workspace: workspacePath
            };
        }

        const taskStatus = await agentData.controller.getTaskStatus(projectId);
        const projectState = agentData.fileManager.getProjectState();
        const workspaceInfo = agentData.workspaceManager.getWorkspaceInfo();

        return {
            success: true,
            projectId,
            workspace: workspacePath,
            task: taskStatus,
            files: projectState,
            workspace: workspaceInfo,
            agent: {
                createdAt: agentData.createdAt,
                userId: agentData.userId
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * List all active projects
     */
    getActiveProjects(userId = null) {
        const projects = [];

        for (const [workspace, agentData] of this.agents.entries()) {
            if (!userId || agentData.userId === userId) {
                const activeTasks = agentData.controller.getActiveTasks();
                const projectState = agentData.fileManager.getProjectState();
                
                projects.push({
                    projectId: this.generateProjectId(workspace),
                    workspace,
                    userId: agentData.userId,
                    createdAt: agentData.createdAt,
                    activeTasks: activeTasks.length,
                    totalFiles: projectState.totalFiles,
                    framework: projectState.framework,
                    features: projectState.features
                });
            }
        }

        return {
            success: true,
            projects,
            total: projects.length,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Get project files and their contents
     */
    async getProjectFiles(projectId, workspace = null, filePath = null) {
        const workspacePath = workspace || this.resolveWorkspaceFromProjectId(projectId);
        const agentData = this.agents.get(workspacePath);

        if (!agentData) {
            throw new Error('Project not found');
        }

        if (filePath) {
            // Get specific file
            const content = await agentData.fileManager.readFile(filePath);
            const analysis = agentData.fileManager.getFileAnalysis(filePath);

            return {
                success: true,
                file: {
                    path: filePath,
                    content,
                    analysis
                },
                timestamp: new Date().toISOString()
            };
        } else {
            // Get all files
            const projectState = agentData.fileManager.getProjectState();
            
            return {
                success: true,
                files: projectState,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Cancel a project/task
     */
    async cancelProject(projectId, workspace = null) {
        const workspacePath = workspace || this.resolveWorkspaceFromProjectId(projectId);
        const agentData = this.agents.get(workspacePath);

        if (!agentData) {
            throw new Error('Project not found');
        }

        await agentData.controller.cancelTask(projectId);
        
        return {
            success: true,
            message: 'Project cancelled',
            projectId,
            workspace: workspacePath,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Clean up completed or old projects
     */
    async cleanupProjects(olderThanHours = 24) {
        const cutoffTime = new Date(Date.now() - (olderThanHours * 60 * 60 * 1000));
        let cleaned = 0;

        for (const [workspace, agentData] of this.agents.entries()) {
            if (agentData.createdAt < cutoffTime) {
                const activeTasks = agentData.controller.getActiveTasks();
                
                // Only cleanup if no active tasks
                if (activeTasks.length === 0) {
                    try {
                        await agentData.controller.cleanup();
                        this.agents.delete(workspace);
                        cleaned++;
                        
                        console.log(`🧹 Cleaned up project: ${workspace}`);
                    } catch (error) {
                        console.error(`Error cleaning up project ${workspace}:`, error);
                    }
                }
            }
        }

        return {
            success: true,
            cleaned,
            remaining: this.agents.size,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Get service statistics
     */
    getServiceStats() {
        return {
            ...this.stats,
            activeProjects: this.agents.size,
            uptime: Date.now() - this.stats.startTime.getTime(),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Validate project request
     */
    validateProjectRequest(request) {
        const errors = [];

        if (!request.description || typeof request.description !== 'string') {
            errors.push('Description is required and must be a string');
        }

        if (request.description && request.description.length < 10) {
            errors.push('Description must be at least 10 characters long');
        }

        if (request.workspace && typeof request.workspace !== 'string') {
            errors.push('Workspace must be a string');
        }

        if (request.preferences && typeof request.preferences !== 'object') {
            errors.push('Preferences must be an object');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Generate workspace path from description
     */
    generateWorkspacePath(description) {
        const projectName = description
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 50);
        
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        
        return `${this.defaultWorkspace}/${projectName}-${timestamp}-${random}`;
    }

    /**
     * Generate project ID from workspace path
     */
    generateProjectId(workspacePath) {
        return Buffer.from(workspacePath).toString('base64').substring(0, 16);
    }

    /**
     * Resolve workspace path from project ID
     */
    resolveWorkspaceFromProjectId(projectId) {
        try {
            return Buffer.from(projectId, 'base64').toString('utf-8');
        } catch {
            // Fallback: search in active agents
            for (const workspace of this.agents.keys()) {
                if (this.generateProjectId(workspace) === projectId) {
                    return workspace;
                }
            }
            throw new Error('Invalid project ID');
        }
    }

    /**
     * Get API configuration for agents
     */
    getApiConfiguration() {
        return {
            provider: process.env.DEFAULT_LLM_PROVIDER || 'anthropic',
            apiKey: process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY,
            model: process.env.DEFAULT_MODEL || 'claude-3-5-sonnet-20241022'
        };
    }

    /**
     * Cleanup all resources
     */
    async cleanup() {
        console.log('🧹 Cleaning up Agent Service...');

        for (const [workspace, agentData] of this.agents.entries()) {
            try {
                await agentData.controller.cleanup();
            } catch (error) {
                console.error(`Error cleaning up agent for ${workspace}:`, error);
            }
        }

        this.agents.clear();
        console.log('✅ Agent Service cleanup complete');
    }
}

module.exports = AgentService;