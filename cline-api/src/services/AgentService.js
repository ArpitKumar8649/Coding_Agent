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
        
        // Advanced components
        this.systemPromptEngine = new SystemPromptEngine({
            currentWorkingDirectory: this.defaultWorkspace,
            supportsBrowserUse: false,
            mcpEnabled: false
        });
        
        this.streamingEngine = new StreamingEngine();
        this.llmService = new LLMService();
        
        // Active streaming sessions
        this.activeStreams = new Map();
        
        // Service statistics
        this.stats = {
            totalProjects: 0,
            completedProjects: 0,
            failedProjects: 0,
            totalFiles: 0,
            advancedGenerations: 0,
            streamingSessions: 0,
            startTime: new Date()
        };
        
        console.log('🤖 Agent Service initialized with Advanced Features');
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
     * Advanced code generation with enhanced system prompts
     */
    async advancedGenerate(request) {
        const {
            description,
            projectType = 'web-application',
            framework = 'react',
            features = [],
            qualityLevel = 'advanced',
            streaming = false,
            fileSpecs = [],
            contextAware = true,
            userId = 'anonymous'
        } = request;

        console.log(`🧠 Advanced Generate: ${description.substring(0, 50)}... (${qualityLevel})`);
        
        try {
            // Generate enhanced system prompt
            const systemPrompt = contextAware 
                ? this.systemPromptEngine.generateContextAwarePrompt({
                    framework,
                    technologies: [framework, ...features],
                    features,
                    complexity: qualityLevel,
                    qualityLevel
                })
                : this.systemPromptEngine.generateQualityEnhancedPrompt(qualityLevel, projectType, features);

            // Prepare project context
            const projectContext = {
                description,
                projectType,
                framework,
                features,
                qualityLevel,
                fileSpecs,
                systemPrompt
            };

            // Generate files based on specs or infer from description
            const filesToGenerate = fileSpecs.length > 0 
                ? fileSpecs 
                : this.inferFileSpecsFromDescription(description, framework, features);

            const results = [];
            const generationId = `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            for (const fileSpec of filesToGenerate) {
                console.log(`📝 Generating: ${fileSpec.path} (${fileSpec.type})`);
                
                const enhancedPrompt = this.buildFileGenerationPrompt(
                    fileSpec, 
                    projectContext, 
                    systemPrompt
                );

                const generationResult = await this.llmService.generateCode(enhancedPrompt, {
                    maxTokens: 4000,
                    temperature: qualityLevel === 'advanced' ? 0.2 : 0.4,
                    model: this.getModelForQuality(qualityLevel)
                });

                const processedResult = this.processGeneratedContent(
                    generationResult.content,
                    fileSpec,
                    projectContext
                );

                results.push({
                    file: fileSpec,
                    content: processedResult.content,
                    analysis: processedResult.analysis,
                    quality: processedResult.quality,
                    metadata: {
                        tokensUsed: generationResult.tokensUsed,
                        model: generationResult.model,
                        processingTime: generationResult.processingTime
                    }
                });
            }

            this.stats.advancedGenerations++;
            this.stats.totalFiles += results.length;

            return {
                success: true,
                generationId,
                results,
                projectContext,
                summary: {
                    filesGenerated: results.length,
                    totalTokens: results.reduce((sum, r) => sum + (r.metadata.tokensUsed || 0), 0),
                    averageQuality: results.reduce((sum, r) => sum + (r.quality || 5), 0) / results.length,
                    framework,
                    features,
                    qualityLevel
                },
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error(`❌ Advanced generation failed:`, error);
            throw {
                success: false,
                error: error.message,
                description,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Create streaming generation session
     */
    async createStreamingGeneration(request) {
        const {
            description,
            fileSpecs = [],
            qualityLevel = 'advanced',
            realTimeValidation = true,
            autoCorrection = true,
            onChunk,
            onComplete,
            onError
        } = request;

        const streamId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        console.log(`🌊 Creating streaming session: ${streamId}`);

        try {
            // Infer file specs if not provided
            const filesToGenerate = fileSpecs.length > 0 
                ? fileSpecs 
                : this.inferFileSpecsFromDescription(description, 'react', []);

            // Create streaming session
            const streamingSession = {
                id: streamId,
                description,
                fileSpecs: filesToGenerate,
                qualityLevel,
                realTimeValidation,
                autoCorrection,
                status: 'active',
                startTime: new Date(),
                callbacks: { onChunk, onComplete, onError },
                currentFileIndex: 0,
                results: []
            };

            this.activeStreams.set(streamId, streamingSession);
            this.stats.streamingSessions++;

            // Start streaming generation
            this.processStreamingGeneration(streamingSession);

            return streamId;

        } catch (error) {
            console.error(`❌ Streaming session creation failed:`, error);
            throw error;
        }
    }

    /**
     * Process streaming generation
     */
    async processStreamingGeneration(session) {
        try {
            for (let i = 0; i < session.fileSpecs.length; i++) {
                session.currentFileIndex = i;
                const fileSpec = session.fileSpecs[i];
                
                console.log(`🌊 Streaming: ${fileSpec.path}`);

                // Create file stream
                const fileStream = this.streamingEngine.createStream(
                    session.id,
                    fileSpec,
                    {
                        description: session.description,
                        qualityLevel: session.qualityLevel,
                        realTimeValidation: session.realTimeValidation,
                        autoCorrection: session.autoCorrection
                    }
                );

                // Set up stream handlers
                fileStream.on('content-chunk', (data) => {
                    if (session.callbacks.onChunk) {
                        session.callbacks.onChunk({
                            type: 'file-chunk',
                            streamId: session.id,
                            fileIndex: i,
                            file: fileSpec,
                            ...data
                        });
                    }
                });

                fileStream.on('generation-complete', (data) => {
                    session.results.push({
                        file: fileSpec,
                        ...data
                    });
                });

                // Start file generation
                await fileStream.start(null); // No socket for API mode

                // Brief pause between files
                if (i < session.fileSpecs.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            // Complete session
            session.status = 'completed';
            session.endTime = new Date();

            if (session.callbacks.onComplete) {
                session.callbacks.onComplete({
                    streamId: session.id,
                    results: session.results,
                    summary: {
                        filesGenerated: session.results.length,
                        totalTime: session.endTime - session.startTime,
                        averageQuality: session.results.reduce((sum, r) => sum + (r.quality || 5), 0) / session.results.length
                    }
                });
            }

            // Cleanup
            this.activeStreams.delete(session.id);

        } catch (error) {
            console.error(`❌ Streaming generation error:`, error);
            session.status = 'error';
            
            if (session.callbacks.onError) {
                session.callbacks.onError(error);
            }
        }
    }

    /**
     * Bulk file generation
     */
    async bulkFileGenerate(request) {
        const {
            files = [],
            projectContext = {},
            generateDependencies = true,
            qualityLevel = 'advanced',
            streaming = false,
            userId = 'anonymous'
        } = request;

        console.log(`📁 Bulk generating ${files.length} files`);

        try {
            const results = [];
            const dependencies = generateDependencies ? this.analyzeDependencies(files) : [];
            
            // Generate system prompt for bulk generation
            const bulkPrompt = this.systemPromptEngine.generateContextAwarePrompt({
                framework: projectContext.framework || 'react',
                technologies: projectContext.technologies || ['react'],
                features: projectContext.features || [],
                complexity: qualityLevel,
                qualityLevel
            });

            // Process files in dependency order
            const sortedFiles = [...dependencies, ...files.filter(f => !dependencies.find(d => d.path === f.path))];

            for (const fileSpec of sortedFiles) {
                console.log(`📝 Bulk generating: ${fileSpec.path}`);
                
                const filePrompt = this.buildFileGenerationPrompt(fileSpec, {
                    ...projectContext,
                    qualityLevel,
                    generatedFiles: results.map(r => ({ path: r.file.path, content: r.content }))
                }, bulkPrompt);

                const generationResult = await this.llmService.generateCode(filePrompt, {
                    maxTokens: 4000,
                    temperature: 0.2,
                    model: this.getModelForQuality(qualityLevel)
                });

                const processedResult = this.processGeneratedContent(
                    generationResult.content,
                    fileSpec,
                    projectContext
                );

                results.push({
                    file: fileSpec,
                    content: processedResult.content,
                    analysis: processedResult.analysis,
                    quality: processedResult.quality,
                    isDependency: dependencies.includes(fileSpec),
                    metadata: {
                        tokensUsed: generationResult.tokensUsed,
                        model: generationResult.model,
                        processingTime: generationResult.processingTime
                    }
                });
            }

            this.stats.totalFiles += results.length;

            return {
                success: true,
                results,
                dependencies: dependencies.map(d => d.path),
                summary: {
                    filesGenerated: results.length,
                    dependenciesGenerated: dependencies.length,
                    totalTokens: results.reduce((sum, r) => sum + (r.metadata.tokensUsed || 0), 0),
                    averageQuality: results.reduce((sum, r) => sum + (r.quality || 5), 0) / results.length
                },
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error(`❌ Bulk file generation failed:`, error);
            throw error;
        }
    }

    /**
     * Enhance system prompt for specific context
     */
    async enhanceSystemPrompt(request) {
        const {
            basePrompt = '',
            context = {},
            qualityLevel = 'advanced',
            projectType = 'web-application',
            features = []
        } = request;

        console.log(`✨ Enhancing prompt for ${projectType} (${qualityLevel})`);

        try {
            let enhancedPrompt;
            
            if (basePrompt) {
                // Enhance existing prompt
                enhancedPrompt = basePrompt + '\n\n' + this.systemPromptEngine.generateQualityEnhancedPrompt(
                    qualityLevel, 
                    projectType, 
                    features
                );
            } else {
                // Generate new enhanced prompt
                enhancedPrompt = this.systemPromptEngine.generateContextAwarePrompt({
                    framework: context.framework || 'react',
                    technologies: context.technologies || ['react'],
                    features,
                    complexity: qualityLevel,
                    qualityLevel,
                    projectType
                });
            }

            const enhancement = {
                originalLength: basePrompt.length,
                enhancedLength: enhancedPrompt.length,
                qualityLevel,
                projectType,
                features,
                addedSections: [
                    'Quality Standards',
                    'Advanced Patterns',
                    'Context Awareness',
                    'Code Standards'
                ]
            };

            return {
                prompt: enhancedPrompt,
                enhancement,
                metadata: {
                    version: '1.0',
                    generatedAt: new Date().toISOString(),
                    engine: 'SystemPromptEngine'
                }
            };

        } catch (error) {
            console.error(`❌ Prompt enhancement failed:`, error);
            throw error;
        }
    }

    /**
     * Helper methods for advanced features
     */

    inferFileSpecsFromDescription(description, framework = 'react', features = []) {
        const fileSpecs = [];
        const lowerDesc = description.toLowerCase();

        if (lowerDesc.includes('react') || framework === 'react') {
            fileSpecs.push(
                { path: 'src/App.js', type: 'react-component', description: 'Main application component' },
                { path: 'src/App.css', type: 'stylesheet', description: 'Main application styles' },
                { path: 'src/index.js', type: 'react-entry', description: 'React application entry point' },
                { path: 'public/index.html', type: 'html', description: 'HTML template' }
            );
        }

        if (lowerDesc.includes('api') || lowerDesc.includes('backend')) {
            fileSpecs.push(
                { path: 'server.js', type: 'node-server', description: 'Backend server' },
                { path: 'package.json', type: 'package-config', description: 'Node.js dependencies' }
            );
        }

        if (lowerDesc.includes('database') || lowerDesc.includes('mongo')) {
            fileSpecs.push(
                { path: 'models/index.js', type: 'database-model', description: 'Database models' }
            );
        }

        return fileSpecs;
    }

    buildFileGenerationPrompt(fileSpec, projectContext, systemPrompt) {
        return `${systemPrompt}

====

CURRENT TASK: Generate ${fileSpec.path}

FILE SPECIFICATION:
- Path: ${fileSpec.path}
- Type: ${fileSpec.type}
- Description: ${fileSpec.description}

PROJECT CONTEXT:
- Framework: ${projectContext.framework || 'React'}
- Quality Level: ${projectContext.qualityLevel || 'advanced'}
- Features: ${projectContext.features ? projectContext.features.join(', ') : 'Standard features'}

REQUIREMENTS:
${projectContext.description}

EXISTING FILES:
${projectContext.generatedFiles ? projectContext.generatedFiles.map(f => `- ${f.path}`).join('\n') : 'None'}

Generate high-quality, production-ready code for ${fileSpec.path} that integrates well with the project structure and follows modern best practices.`;
    }

    processGeneratedContent(content, fileSpec, projectContext) {
        const analysis = {
            lines: content.split('\n').length,
            hasImports: content.includes('import '),
            hasExports: content.includes('export '),
            hasComments: content.includes('//') || content.includes('/*'),
            hasTypeScript: content.includes(': ') && fileSpec.path.endsWith('.ts'),
            framework: this.detectFramework(content)
        };

        const quality = this.assessContentQuality(content, fileSpec, analysis);

        return {
            content,
            analysis,
            quality
        };
    }

    detectFramework(content) {
        if (content.includes('React') || content.includes('useState')) return 'react';
        if (content.includes('Vue') || content.includes('createApp')) return 'vue';
        if (content.includes('Angular') || content.includes('@Component')) return 'angular';
        return 'vanilla';
    }

    assessContentQuality(content, fileSpec, analysis) {
        let score = 5; // Base score

        if (analysis.hasComments) score += 1;
        if (analysis.hasImports && analysis.hasExports) score += 1;
        if (content.includes('PropTypes') || content.includes('interface ')) score += 1;
        if (content.includes('aria-') || content.includes('role=')) score += 1;
        if (content.includes('try {') || content.includes('catch')) score += 1;
        if (content.length > 200) score += 1; // Substantial content

        return Math.min(score, 10);
    }

    analyzeDependencies(files) {
        // Simple dependency analysis - should be more sophisticated in production
        const dependencies = [];
        
        for (const file of files) {
            if (file.path.includes('package.json') || file.path.includes('index.')) {
                dependencies.unshift(file); // Add to beginning
            }
        }

        return dependencies;
    }

    getModelForQuality(qualityLevel) {
        switch (qualityLevel) {
            case 'poor': return 'gpt-3.5-turbo';
            case 'medium': return 'gpt-4';
            case 'advanced': return 'claude-3-5-sonnet-20241022';
            default: return 'gpt-4';
        }
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
        this.activeStreams.clear();
        console.log('✅ Agent Service cleanup complete');
    }
}

module.exports = AgentService;