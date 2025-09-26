/**
 * AdvancedClineAPI - Main enhanced API integrating all Cline-level capabilities
 * Combines sophisticated system prompts, Plan vs Act modes, advanced tools, and git awareness
 */

const SystemPromptEngine = require('./SystemPromptEngine');
const PlanActModeManager = require('./PlanActModeManager');
const AdvancedToolExecutor = require('./AdvancedToolExecutor');
const GitAwarenessEngine = require('./GitAwarenessEngine');
const ContextManager = require('./ContextManager');
const ValidationEngine = require('./ValidationEngine');
const StreamingEngine = require('./StreamingEngine');
const { getLLMProvider } = require('../services/llmService');

class AdvancedClineAPI {
    constructor(config = {}) {
        this.config = {
            workspaceDir: config.workspaceDir || '/tmp/cline-workspace',
            llmProvider: config.llmProvider || 'openai',
            qualityLevel: config.qualityLevel || 'advanced',
            enableGit: config.enableGit !== false,
            enableValidation: config.enableValidation !== false,
            enableStreaming: config.enableStreaming !== false,
            ...config
        };
        
        // Initialize core systems
        this.systemPromptEngine = new SystemPromptEngine({
            cwd: this.config.workspaceDir,
            ...this.config
        });
        
        this.llmProvider = getLLMProvider(this.config.llmProvider);
        this.planActManager = new PlanActModeManager(this.llmProvider);
        
        this.toolExecutor = new AdvancedToolExecutor({
            workingDirectory: this.config.workspaceDir,
            validationEnabled: this.config.enableValidation
        });
        
        this.contextManager = new ContextManager();
        this.validationEngine = new ValidationEngine();
        
        if (this.config.enableStreaming) {
            this.streamingEngine = new StreamingEngine();
        }
        
        if (this.config.enableGit) {
            this.gitEngine = new GitAwarenessEngine(this.config.workspaceDir);
        }
        
        // Session management
        this.sessions = new Map();
        this.currentSession = null;
        
        console.log('🚀 Advanced Cline API initialized with enhanced capabilities');
    }

    // Create new session
    async createSession(sessionConfig = {}) {
        const sessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        
        const session = {
            id: sessionId,
            created: new Date().toISOString(),
            config: { ...this.config, ...sessionConfig },
            mode: sessionConfig.startMode || 'PLAN',
            context: {},
            conversationHistory: [],
            currentTask: null,
            executionPlan: null,
            gitState: null
        };
        
        // Initialize git state if enabled
        if (this.config.enableGit && this.gitEngine) {
            session.gitState = this.gitEngine.getProjectInfo();
        }
        
        // Set mode in plan-act manager
        if (session.mode === 'PLAN') {
            this.planActManager.switchToPlanMode();
        } else {
            this.planActManager.switchToActMode();
        }
        
        this.sessions.set(sessionId, session);
        this.currentSession = session;
        
        console.log(`📋 Created new session ${sessionId} in ${session.mode} mode`);
        
        return {
            success: true,
            sessionId,
            mode: session.mode,
            capabilities: this.getSessionCapabilities(session),
            workspace: this.config.workspaceDir,
            gitEnabled: this.config.enableGit,
            qualityLevel: this.config.qualityLevel
        };
    }

    // Process user message
    async processMessage(sessionId, message, options = {}) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }
        
        this.currentSession = session;
        
        try {
            // Add user message to history
            session.conversationHistory.push({
                type: 'user',
                content: message,
                timestamp: new Date().toISOString(),
                mode: session.mode
            });
            
            let response;
            
            if (session.mode === 'PLAN') {
                response = await this.processPlanModeMessage(session, message, options);
            } else {
                response = await this.processActModeMessage(session, message, options);
            }
            
            // Add assistant response to history
            session.conversationHistory.push({
                type: 'assistant',
                content: response.content,
                timestamp: new Date().toISOString(),
                mode: session.mode,
                toolUsed: response.toolUsed,
                executionResult: response.executionResult
            });
            
            return response;
            
        } catch (error) {
            console.error(`Error processing message in session ${sessionId}:`, error);
            throw error;
        }
    }

    // Process message in PLAN mode
    async processPlanModeMessage(session, message, options) {
        console.log('🔄 Processing message in PLAN mode');
        
        // Analyze the message for project context
        const projectContext = await this.contextManager.analyzeProject(session.id, {
            description: message,
            requirements: options.requirements || {},
            workspace: this.config.workspaceDir
        });
        
        session.context = projectContext;
        
        // Generate enhanced system prompt for planning
        const systemPrompt = this.planActManager.generateModePrompt(projectContext);
        
        // Create planning request
        const planningPrompt = `${systemPrompt}

USER MESSAGE: ${message}

CURRENT SESSION CONTEXT:
${JSON.stringify(session.context, null, 2)}

Please respond appropriately for PLAN mode. Use the plan_mode_respond tool to communicate with the user.`;

        try {
            // Generate AI response
            const aiResponse = await this.llmProvider.generateResponse(planningPrompt, {
                temperature: 0.1,
                maxTokens: 2000
            });
            
            // Extract tool usage if any
            const toolMatch = aiResponse.content.match(/<plan_mode_respond>\s*<response>(.*?)<\/response>\s*<\/plan_mode_respond>/s);
            
            if (toolMatch) {
                const planResponse = toolMatch[1].trim();
                
                return {
                    success: true,
                    mode: 'PLAN',
                    content: planResponse,
                    toolUsed: 'plan_mode_respond',
                    sessionId: session.id,
                    context: session.context,
                    planningState: this.planActManager.getPlanningState()
                };
            } else {
                return {
                    success: true,
                    mode: 'PLAN',
                    content: aiResponse.content,
                    sessionId: session.id,
                    context: session.context,
                    planningState: this.planActManager.getPlanningState()
                };
            }
            
        } catch (error) {
            throw new Error(`Planning mode processing failed: ${error.message}`);
        }
    }

    // Process message in ACT mode
    async processActModeMessage(session, message, options) {
        console.log('🚀 Processing message in ACT mode');
        
        // Generate enhanced system prompt for implementation
        const systemPrompt = this.systemPromptEngine.generateQualityEnhancedPrompt(
            this.config.qualityLevel,
            session.context?.projectType || 'web-application',
            session.context?.features || []
        );
        
        // Add execution context
        const executionPrompt = `${systemPrompt}

USER MESSAGE: ${message}

CURRENT EXECUTION CONTEXT:
- Session ID: ${session.id}
- Workspace: ${this.config.workspaceDir}
- Quality Level: ${this.config.qualityLevel}
- Git Enabled: ${this.config.enableGit}

PROJECT CONTEXT:
${JSON.stringify(session.context, null, 2)}

EXECUTION PLAN:
${session.executionPlan ? JSON.stringify(session.executionPlan, null, 2) : 'No execution plan available'}

Please analyze the user's request and execute the appropriate tool to accomplish the task. Follow the step-by-step iterative approach.`;

        try {
            // Generate AI response
            const aiResponse = await this.llmProvider.generateResponse(executionPrompt, {
                temperature: 0.1,
                maxTokens: 3000
            });
            
            // Extract and execute tool if present
            const toolExecution = await this.extractAndExecuteTool(aiResponse.content, session);
            
            if (toolExecution) {
                return {
                    success: true,
                    mode: 'ACT',
                    content: this.formatToolResponse(toolExecution),
                    toolUsed: toolExecution.toolName,
                    executionResult: toolExecution.result,
                    sessionId: session.id,
                    context: session.context
                };
            } else {
                return {
                    success: true,
                    mode: 'ACT',
                    content: aiResponse.content,
                    sessionId: session.id,
                    context: session.context
                };
            }
            
        } catch (error) {
            throw new Error(`Act mode processing failed: ${error.message}`);
        }
    }

    // Extract and execute tool from AI response
    async extractAndExecuteTool(aiResponse, session) {
        // Parse XML tool calls
        const toolMatches = aiResponse.matchAll(/<(\w+)>(.*?)<\/\1>/gs);
        
        for (const match of toolMatches) {
            const toolName = match[1];
            const toolContent = match[2];
            
            // Skip non-tool elements
            if (['thinking', 'response'].includes(toolName)) {
                continue;
            }
            
            // Parse tool parameters
            const parameters = {};
            const paramMatches = toolContent.matchAll(/<(\w+)>(.*?)<\/\1>/gs);
            
            for (const paramMatch of paramMatches) {
                const paramName = paramMatch[1];
                const paramValue = paramMatch[2].trim();
                parameters[paramName] = paramValue;
            }
            
            try {
                console.log(`🔧 Executing tool: ${toolName}`);
                const result = await this.toolExecutor.executeTool(toolName, parameters, {
                    sessionId: session.id,
                    workspace: this.config.workspaceDir,
                    quality: this.config.qualityLevel
                });
                
                // Handle git operations if enabled
                if (this.config.enableGit && this.shouldAutoCommit(toolName, parameters)) {
                    await this.handleGitOperations(toolName, parameters, result);
                }
                
                return {
                    toolName,
                    parameters,
                    result,
                    timestamp: new Date().toISOString()
                };
                
            } catch (error) {
                console.error(`Tool execution failed for ${toolName}:`, error);
                return {
                    toolName,
                    parameters,
                    error: error.message,
                    timestamp: new Date().toISOString()
                };
            }
        }
        
        return null;
    }

    // Format tool response for user
    formatToolResponse(toolExecution) {
        if (toolExecution.error) {
            return `❌ Tool execution failed: ${toolExecution.error}`;
        }
        
        const { toolName, result } = toolExecution;
        
        switch (toolName) {
            case 'write_to_file':
                return `✅ Successfully created/updated file: ${result.path}\nSize: ${result.size} bytes, Lines: ${result.lines}`;
                
            case 'replace_in_file':
                return `✅ Successfully modified file: ${result.path}\nReplacements: ${result.replacements}, New size: ${result.newSize} bytes`;
                
            case 'execute_command':
                return `✅ Command executed successfully: ${result.command}\nOutput: ${result.output || 'No output'}`;
                
            case 'read_file':
                return `📄 File content (${result.size} bytes, ${result.lines} lines):\n\n${result.content}`;
                
            case 'attempt_completion':
                return `🎉 Task completed!\n\n${result.result}${result.command ? `\n\nTo view the result, run: ${result.command}` : ''}`;
                
            default:
                return `✅ Tool ${toolName} executed successfully\n\n${JSON.stringify(result, null, 2)}`;
        }
    }

    // Switch session mode
    async switchMode(sessionId, targetMode) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }
        
        let result;
        
        if (targetMode === 'PLAN') {
            result = this.planActManager.switchToPlanMode();
        } else if (targetMode === 'ACT') {
            result = this.planActManager.switchToActMode();
        } else {
            throw new Error(`Invalid mode: ${targetMode}. Must be 'PLAN' or 'ACT'`);
        }
        
        if (result.error) {
            throw new Error(result.error);
        }
        
        session.mode = targetMode;
        
        console.log(`🔄 Session ${sessionId} switched to ${targetMode} mode`);
        
        return {
            success: true,
            sessionId,
            previousMode: session.mode,
            currentMode: targetMode,
            message: result.message,
            capabilities: this.getSessionCapabilities(session)
        };
    }

    // Handle git operations
    async handleGitOperations(toolName, parameters, result) {
        if (!this.gitEngine || !this.gitEngine.isGitRepo) {
            return;
        }
        
        try {
            // Auto-commit file changes
            if (['write_to_file', 'replace_in_file'].includes(toolName) && result.success) {
                await this.gitEngine.autoCommitChanges({
                    message: `${toolName}: ${parameters.path || 'Update project files'}`
                });
                console.log('📝 Auto-committed changes to git');
            }
        } catch (error) {
            console.warn('Git auto-commit failed:', error.message);
        }
    }

    // Check if tool should trigger auto-commit
    shouldAutoCommit(toolName, parameters) {
        const autoCommitTools = [
            'write_to_file',
            'replace_in_file'
        ];
        
        return autoCommitTools.includes(toolName);
    }

    // Get session capabilities
    getSessionCapabilities(session) {
        const baseCapabilities = [
            'File operations (read, write, replace)',
            'Directory listing and search',
            'Command execution',
            'Code definition analysis',
            'Quality-enhanced code generation'
        ];
        
        if (session.mode === 'PLAN') {
            return [
                ...baseCapabilities,
                'Interactive planning and discussion',
                'Requirements gathering',
                'Architecture design',
                'Mermaid diagram generation',
                'Implementation strategy creation'
            ];
        } else {
            return [
                ...baseCapabilities,
                'Step-by-step implementation',
                'Real-time error handling',
                'Progress tracking',
                'Task completion'
            ];
        }
    }

    // Get session status
    getSessionStatus(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }
        
        return {
            sessionId: session.id,
            created: session.created,
            mode: session.mode,
            conversationLength: session.conversationHistory.length,
            context: session.context,
            executionPlan: session.executionPlan ? {
                id: session.executionPlan.id,
                steps: session.executionPlan.steps?.length || 0,
                approved: session.executionPlan.approved
            } : null,
            gitState: this.config.enableGit ? this.gitEngine?.getProjectInfo() : null,
            toolExecutionStats: this.toolExecutor.getExecutionStats()
        };
    }
}

module.exports = AdvancedClineAPI;