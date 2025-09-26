/**
 * Advanced Interactive Agent API - Cline-level quality code generation
 * Implements continuous user interaction, real-time streaming, and context awareness
 */

const express = require('express');
const { Server } = require('socket.io');
const http = require('http');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');

class InteractiveAgentAPI {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = new Server(this.server, {
            cors: { origin: "*" }
        });
        
        // Core systems
        this.sessionManager = new SessionManager();
        this.contextManager = new ContextManager();
        this.toolOrchestrator = new ToolOrchestrator();
        this.streamingEngine = new StreamingEngine();
        this.validationEngine = new ValidationEngine();
        
        this.setupRoutes();
        this.setupWebSocketHandlers();
    }

    setupRoutes() {
        this.app.use(express.json());
        this.app.use(express.static('public'));

        // Create interactive session
        this.app.post('/api/sessions', async (req, res) => {
            const sessionId = uuidv4();
            const session = await this.sessionManager.createSession(sessionId, req.body);
            
            res.json({
                success: true,
                sessionId,
                websocketUrl: `/socket.io/?sessionId=${sessionId}`,
                session: session.getPublicData()
            });
        });

        // Session status
        this.app.get('/api/sessions/:sessionId', async (req, res) => {
            const session = this.sessionManager.getSession(req.params.sessionId);
            if (!session) {
                return res.status(404).json({ error: 'Session not found' });
            }
            
            res.json({
                success: true,
                session: session.getPublicData(),
                context: await this.contextManager.getContextSummary(req.params.sessionId)
            });
        });
    }

    setupWebSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`🔌 Client connected: ${socket.id}`);

            // Join session room
            socket.on('join-session', async (data) => {
                const { sessionId } = data;
                const session = this.sessionManager.getSession(sessionId);
                
                if (!session) {
                    socket.emit('error', { message: 'Invalid session' });
                    return;
                }

                socket.join(sessionId);
                socket.sessionId = sessionId;
                
                socket.emit('session-joined', {
                    sessionId,
                    context: await this.contextManager.getContextSummary(sessionId)
                });
            });

            // Start interactive coding task
            socket.on('start-task', async (data) => {
                await this.handleInteractiveTask(socket, data);
            });

            // User feedback/approval
            socket.on('user-feedback', async (data) => {
                await this.handleUserFeedback(socket, data);
            });

            // File validation request
            socket.on('validate-file', async (data) => {
                await this.handleFileValidation(socket, data);
            });

            socket.on('disconnect', () => {
                console.log(`🔌 Client disconnected: ${socket.id}`);
            });
        });
    }

    async handleInteractiveTask(socket, data) {
        const { sessionId, description, requirements } = data;
        const session = this.sessionManager.getSession(sessionId);
        
        try {
            // 1. CONTINUOUS USER INTERACTION & VALIDATION LOOPS
            socket.emit('task-started', { 
                message: 'Starting interactive code generation...',
                phase: 'analysis'
            });

            // 2. ADVANCED CONTEXTUAL UNDERSTANDING
            const projectContext = await this.contextManager.analyzeProject(sessionId, {
                description,
                requirements,
                workspace: session.workspace
            });

            socket.emit('context-analysis', {
                phase: 'context-complete',
                context: projectContext,
                needsApproval: true
            });

            // Wait for user approval of context analysis
            const contextApproval = await this.waitForUserApproval(socket, 'context-approval');
            if (!contextApproval.approved) {
                socket.emit('task-cancelled', { reason: 'Context analysis not approved' });
                return;
            }

            // 3. REAL-TIME STREAMING WITH IMMEDIATE ERROR CORRECTION
            await this.generateCodeWithStreamingValidation(socket, sessionId, projectContext, description);

        } catch (error) {
            console.error('Interactive task error:', error);
            socket.emit('task-error', {
                error: error.message,
                canRetry: true
            });
        }
    }

    async generateCodeWithStreamingValidation(socket, sessionId, context, description) {
        const session = this.sessionManager.getSession(sessionId);
        let currentStep = 1;
        const totalSteps = context.requiredFiles.length;

        for (const fileSpec of context.requiredFiles) {
            socket.emit('streaming-update', {
                phase: 'generating',
                step: currentStep,
                totalSteps,
                file: fileSpec.path,
                status: 'starting'
            });

            try {
                // 4. SOPHISTICATED TOOL ORCHESTRATION
                const generator = this.toolOrchestrator.createFileGenerator(fileSpec, context);
                
                // Stream content generation with real-time validation
                const stream = generator.generateWithValidation();
                
                let accumulatedContent = '';
                let validationErrors = [];

                for await (const chunk of stream) {
                    switch (chunk.type) {
                        case 'content':
                            accumulatedContent += chunk.data;
                            
                            // Real-time streaming to user
                            socket.emit('streaming-content', {
                                file: fileSpec.path,
                                content: chunk.data,
                                accumulated: accumulatedContent,
                                partial: true
                            });
                            break;

                        case 'validation':
                            if (chunk.errors && chunk.errors.length > 0) {
                                validationErrors.push(...chunk.errors);
                                
                                socket.emit('validation-errors', {
                                    file: fileSpec.path,
                                    errors: chunk.errors,
                                    canAutoFix: chunk.canAutoFix
                                });

                                // Immediate error correction
                                if (chunk.canAutoFix) {
                                    socket.emit('auto-fixing', {
                                        file: fileSpec.path,
                                        fixing: chunk.errors
                                    });
                                    
                                    // Apply auto-fixes and continue streaming
                                    accumulatedContent = await generator.applyAutoFixes(
                                        accumulatedContent, 
                                        chunk.errors
                                    );
                                } else {
                                    // Request user intervention
                                    const userDecision = await this.requestUserDecision(socket, {
                                        type: 'validation-failed',
                                        file: fileSpec.path,
                                        errors: chunk.errors,
                                        options: ['retry', 'manual-fix', 'skip']
                                    });

                                    if (userDecision.action === 'retry') {
                                        // Restart generation with improved prompt
                                        generator.retryWithImprovedPrompt(chunk.errors);
                                        continue;
                                    }
                                }
                            }
                            break;

                        case 'complete':
                            socket.emit('streaming-content', {
                                file: fileSpec.path,
                                content: accumulatedContent,
                                partial: false,
                                complete: true,
                                quality: chunk.qualityScore
                            });

                            // Final validation and user approval
                            const approval = await this.requestFileApproval(socket, {
                                file: fileSpec.path,
                                content: accumulatedContent,
                                quality: chunk.qualityScore,
                                errors: validationErrors
                            });

                            if (approval.approved) {
                                await session.saveFile(fileSpec.path, accumulatedContent);
                                socket.emit('file-saved', {
                                    file: fileSpec.path,
                                    status: 'completed'
                                });
                            } else {
                                // Handle rejection - offer improvements
                                await this.handleFileRejection(socket, fileSpec, approval.feedback);
                            }
                            break;
                    }
                }

            } catch (fileError) {
                socket.emit('file-error', {
                    file: fileSpec.path,
                    error: fileError.message,
                    canRetry: true
                });

                const retryDecision = await this.requestUserDecision(socket, {
                    type: 'file-generation-failed',
                    file: fileSpec.path,
                    error: fileError.message,
                    options: ['retry-with-fixes', 'skip-file', 'abort-task']
                });

                if (retryDecision.action === 'abort-task') {
                    socket.emit('task-aborted', { reason: 'User requested abort' });
                    return;
                }
            }

            currentStep++;
        }

        // Final project validation and testing
        await this.performFinalValidation(socket, sessionId, context);
    }

    async performFinalValidation(socket, sessionId, context) {
        socket.emit('final-validation', {
            phase: 'testing',
            message: 'Running final project validation...'
        });

        const session = this.sessionManager.getSession(sessionId);
        const validationResults = await this.validationEngine.validateProject(
            session.workspace,
            context
        );

        socket.emit('validation-complete', {
            results: validationResults,
            projectReady: validationResults.allTestsPassed,
            issues: validationResults.issues,
            suggestions: validationResults.suggestions
        });

        if (!validationResults.allTestsPassed) {
            const fixDecision = await this.requestUserDecision(socket, {
                type: 'validation-issues',
                issues: validationResults.issues,
                options: ['auto-fix', 'manual-review', 'accept-as-is']
            });

            if (fixDecision.action === 'auto-fix') {
                await this.autoFixValidationIssues(socket, sessionId, validationResults.issues);
            }
        }

        socket.emit('task-complete', {
            sessionId,
            workspace: session.workspace,
            files: session.getGeneratedFiles(),
            quality: validationResults.overallQuality,
            summary: validationResults.summary
        });
    }

    // Utility methods for user interaction
    async waitForUserApproval(socket, eventType) {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                resolve({ approved: false, timeout: true });
            }, 300000); // 5 minute timeout

            socket.once(eventType, (data) => {
                clearTimeout(timeout);
                resolve(data);
            });
        });
    }

    async requestUserDecision(socket, decision) {
        socket.emit('user-decision-required', decision);
        return this.waitForUserApproval(socket, 'user-decision');
    }

    async requestFileApproval(socket, fileData) {
        socket.emit('file-approval-required', fileData);
        return this.waitForUserApproval(socket, 'file-approval');
    }

    async handleUserFeedback(socket, data) {
        const { sessionId, type, feedback } = data;
        const session = this.sessionManager.getSession(sessionId);
        
        // 5. STATE PERSISTENCE & LEARNING
        await session.addFeedback(type, feedback);
        await this.contextManager.updateFromFeedback(sessionId, feedback);

        socket.emit('feedback-received', {
            message: 'Feedback processed and applied to future generations',
            updatedContext: await this.contextManager.getContextSummary(sessionId)
        });
    }

    async handleFileValidation(socket, data) {
        const { sessionId, file, content } = data;
        
        const validationResult = await this.validationEngine.validateFile(
            file,
            content,
            await this.contextManager.getContext(sessionId)
        );

        socket.emit('file-validation-result', {
            file,
            valid: validationResult.isValid,
            errors: validationResult.errors,
            suggestions: validationResult.suggestions,
            quality: validationResult.qualityScore
        });
    }

    start(port = 3003) {
        this.server.listen(port, () => {
            console.log(`🚀 Advanced Interactive Agent API running on port ${port}`);
            console.log(`📊 Real-time streaming: ws://localhost:${port}`);
            console.log(`🔄 Interactive sessions: http://localhost:${port}/api/sessions`);
        });
    }
}

// Session Management System
class SessionManager {
    constructor() {
        this.sessions = new Map();
    }

    async createSession(sessionId, config) {
        const session = new InteractiveSession(sessionId, config);
        await session.initialize();
        this.sessions.set(sessionId, session);
        return session;
    }

    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }
}

class InteractiveSession {
    constructor(sessionId, config) {
        this.sessionId = sessionId;
        this.config = config;
        this.workspace = config.workspace || `/tmp/cline-sessions/${sessionId}`;
        this.state = {
            phase: 'initialized',
            generatedFiles: [],
            feedback: [],
            context: {},
            errors: []
        };
        this.startTime = Date.now();
    }

    async initialize() {
        // Create workspace directory
        await fs.mkdir(this.workspace, { recursive: true });
        
        // Initialize git if needed
        if (this.config.enableGit) {
            // Git initialization logic
        }
    }

    getPublicData() {
        return {
            sessionId: this.sessionId,
            phase: this.state.phase,
            workspace: this.workspace,
            generatedFiles: this.state.generatedFiles.length,
            duration: Date.now() - this.startTime,
            status: 'active'
        };
    }

    async saveFile(filePath, content) {
        const fullPath = path.join(this.workspace, filePath);
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, content);
        
        this.state.generatedFiles.push({
            path: filePath,
            size: content.length,
            timestamp: Date.now()
        });
    }

    async addFeedback(type, feedback) {
        this.state.feedback.push({
            type,
            feedback,
            timestamp: Date.now()
        });
    }

    getGeneratedFiles() {
        return this.state.generatedFiles;
    }
}

module.exports = InteractiveAgentAPI;