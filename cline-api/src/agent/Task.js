/**
 * Task - Main task orchestration class for agent operations
 * Extracted from: /app/src/core/task/index.ts
 * Adapted for API use without VS Code dependencies
 */

const { v4: uuidv4 } = require('uuid');
const TaskState = require('./TaskState');
const MessageStateHandler = require('./MessageStateHandler');
const PlanningEngine = require('./PlanningEngine');
const AgentAIHandler = require('./AgentAIHandler');
const ToolExecutor = require('./ToolExecutor');

class Task {
    constructor({
        workspaceManager,
        fileManager,
        contextManager,
        updateTaskHistory,
        postStateToAPI,
        postMessageToAPI,
        apiConfiguration,
        autoApprovalSettings = { enabled: true },
        taskId = null,
        userId = null
    }) {
        // Generate unique task ID
        this.taskId = taskId || Date.now().toString();
        this.userId = userId;

        // Initialize core state
        this.taskState = new TaskState();
        
        // Core dependencies
        this.workspaceManager = workspaceManager;
        this.fileManager = fileManager;
        this.contextManager = contextManager;
        this.updateTaskHistory = updateTaskHistory;
        this.postStateToAPI = postStateToAPI;
        this.postMessageToAPI = postMessageToAPI;
        this.autoApprovalSettings = autoApprovalSettings;

        // Initialize message handler
        this.messageStateHandler = new MessageStateHandler({
            taskId: this.taskId,
            taskState: this.taskState,
            updateTaskHistory: this.updateTaskHistory
        });

        // Initialize AI handler
        this.aiHandler = new AgentAIHandler(apiConfiguration);

        // Initialize planning engine
        this.planningEngine = new PlanningEngine(this.aiHandler);

        // Initialize tool executor
        this.toolExecutor = new ToolExecutor({
            taskState: this.taskState,
            messageStateHandler: this.messageStateHandler,
            aiHandler: this.aiHandler,
            fileManager: this.fileManager,
            workspaceManager: this.workspaceManager,
            contextManager: this.contextManager,
            autoApprovalSettings: this.autoApprovalSettings,
            cwd: this.workspaceManager.workspacePath,
            taskId: this.taskId
        });

        // Task metadata
        this.createdAt = new Date().toISOString();
        this.lastActivity = this.createdAt;
    }

    // Start a new task with the given instruction
    async startTask(instruction, options = {}) {
        try {
            this.taskState.isInitialized = true;
            this.taskState.currentWorkspace = this.workspaceManager.workspacePath;
            
            // Add initial user message
            await this.messageStateHandler.addUserMessage(instruction, options.images, options.files);
            
            // Post initial state
            await this.postStateToAPI();

            // Phase 1: Analysis
            await this.say('analysis_started', 'Analyzing project requirements...');
            const analysis = await this.planningEngine.analyzeRequirements(instruction, options);
            
            // Store analysis in project context
            this.taskState.projectContext.set('analysis', analysis);
            this.taskState.projectContext.set('framework', analysis.framework);
            this.taskState.projectContext.set('features', analysis.features);
            this.taskState.projectContext.set('technologies', analysis.technologies);

            await this.say('analysis_complete', `Analysis complete: ${analysis.projectType} project using ${analysis.framework}`, null, null, false, {
                analysis: analysis
            });

            // Phase 2: Planning  
            await this.say('planning_started', 'Creating execution plan...');
            const executionPlan = await this.planningEngine.createExecutionPlan(analysis, this.workspaceManager.workspacePath);
            this.taskState.executionPlan = executionPlan;

            await this.say('planning_complete', `Execution plan created with ${executionPlan.steps.length} steps`, null, null, false, {
                plan: {
                    totalSteps: executionPlan.steps.length,
                    estimatedTime: executionPlan.estimatedTotalTime,
                    phases: this.groupStepsByPhase(executionPlan.steps)
                }
            });

            // Phase 3: Execution
            await this.executeSteps(executionPlan.steps);

            // Phase 4: Validation and Completion
            await this.validateAndCompleteTask();

        } catch (error) {
            await this.handleError('task execution', error);
            throw error;
        }
    }

    // Execute all steps in the execution plan
    async executeSteps(steps) {
        await this.say('execution_started', `Starting execution of ${steps.length} steps...`);
        
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            this.taskState.currentStepIndex = i;
            
            try {
                // Update progress
                const progress = Math.round((i / steps.length) * 100);
                await this.postStateToAPI();

                // Execute step
                await this.say('step_started', `Step ${i + 1}/${steps.length}: ${step.description}`, null, null, false, {
                    step: step,
                    progress: progress
                });

                const result = await this.executeStep(step);
                
                // Store result
                this.taskState.addStepResult(result);

                await this.say('step_completed', `Completed: ${step.description}`, null, null, false, {
                    stepResult: result,
                    progress: Math.round(((i + 1) / steps.length) * 100)
                });

            } catch (error) {
                await this.handleStepError(step, error);
                // Continue with next step unless it's a critical error
                if (error.critical) {
                    throw error;
                }
            }
        }

        await this.say('execution_complete', `All ${steps.length} steps completed successfully!`);
    }

    // Execute a single step
    async executeStep(step) {
        switch (step.type) {
            case 'create_workspace':
                return await this.createWorkspaceStep(step);
            
            case 'create_file':
                return await this.createFileStep(step);
            
            case 'edit_file':
                return await this.editFileStep(step);
            
            case 'validate_syntax':
                return await this.validateSyntaxStep(step);
            
            case 'analyze_dependencies':
                return await this.analyzeDependenciesStep(step);
            
            default:
                throw new Error(`Unknown step type: ${step.type}`);
        }
    }

    // Create workspace step
    async createWorkspaceStep(step) {
        await this.workspaceManager.ensureDirectoryExists(step.path);
        return {
            type: 'workspace_created',
            path: step.path,
            success: true
        };
    }

    // Create file step  
    async createFileStep(step) {
        // Get project context for AI
        const projectContext = this.getProjectContext();
        
        // Generate file content using AI
        let content;
        if (step.template) {
            content = await this.generateFromTemplate(step.template, projectContext);
        } else {
            content = await this.aiHandler.generateFileContent(step, projectContext);
        }

        // Create file with tracking
        await this.fileManager.createFileWithTracking(step.path, content);
        
        return {
            type: 'file_created',
            path: step.path,
            size: content.length,
            lines: content.split('\n').length,
            success: true
        };
    }

    // Edit file step
    async editFileStep(step) {
        const currentContent = await this.fileManager.readFile(step.path);
        const projectContext = this.getProjectContext();
        
        const newContent = await this.aiHandler.editFileWithContext(
            step.path,
            currentContent,
            step.instructions || step.description,
            projectContext
        );

        await this.fileManager.editFileWithContext(step.path, {
            type: 'edit',
            newContent: newContent,
            instructions: step.instructions
        });

        return {
            type: 'file_edited',
            path: step.path,
            changes: this.analyzeDiff(currentContent, newContent),
            success: true
        };
    }

    // Validate syntax step
    async validateSyntaxStep(step) {
        const projectState = this.fileManager.getProjectState();
        const validation = await this.aiHandler.validateProject(projectState);
        
        if (!validation.isValid) {
            // Auto-fix issues if possible
            for (const issue of validation.issues) {
                if (issue.type === 'error' && issue.suggestion) {
                    await this.fixIssue(issue);
                }
            }
        }

        return {
            type: 'validation_complete',
            isValid: validation.isValid,
            issues: validation.issues,
            score: validation.score,
            success: true
        };
    }

    // Analyze dependencies step
    async analyzeDependenciesStep(step) {
        const projectState = this.fileManager.getProjectState();
        const dependencies = projectState.dependencies || [];
        
        return {
            type: 'dependencies_analyzed',
            dependencies: dependencies,
            count: dependencies.length,
            success: true
        };
    }

    // Validate and complete task
    async validateAndCompleteTask() {
        await this.say('validation_started', 'Validating project structure and functionality...');
        
        // Get final project state
        const projectState = this.fileManager.getProjectState();
        const validation = await this.aiHandler.validateProject(projectState);
        
        // Generate completion summary
        const completionSummary = this.generateCompletionSummary(projectState, validation);
        
        await this.say('task_completed', 'Project completed successfully!', null, null, false, {
            summary: completionSummary,
            validation: validation
        });

        // Mark task as completed
        this.taskState.isInitialized = false;
        this.lastActivity = new Date().toISOString();
        
        return completionSummary;
    }

    // Handle instruction after task is running (for iterative development)
    async handleInstruction(instruction, options = {}) {
        try {
            // Add user message
            await this.messageStateHandler.addUserMessage(instruction, options.images, options.files);

            // Use AI to decide what action to take
            const projectState = this.fileManager.getProjectState();
            const decision = await this.aiHandler.makeDecision(instruction, projectState, options);

            await this.say('instruction_received', `Processing instruction: ${instruction}`, null, null, false, {
                decision: decision
            });

            // Execute decision
            switch (decision.action) {
                case 'create_files':
                    return await this.handleCreateFiles(decision.files, instruction);
                
                case 'modify_files':
                    return await this.handleModifyFiles(decision.files, instruction);
                
                case 'analyze_project':
                    return await this.handleAnalyzeProject(instruction);
                
                default:
                    throw new Error(`Unknown action: ${decision.action}`);
            }

        } catch (error) {
            await this.handleError('instruction processing', error);
            throw error;
        }
    }

    // Handle create files action
    async handleCreateFiles(files, instruction) {
        await this.say('creating_files', `Creating ${files.length} files...`);
        
        const results = [];
        for (const fileSpec of files) {
            const result = await this.createFileFromSpec(fileSpec, instruction);
            results.push(result);
        }

        await this.say('files_created', `Successfully created ${files.length} files`);
        return results;
    }

    // Handle modify files action  
    async handleModifyFiles(files, instruction) {
        await this.say('modifying_files', `Modifying ${files.length} files...`);
        
        const results = [];
        for (const fileSpec of files) {
            const result = await this.modifyFileFromSpec(fileSpec, instruction);
            results.push(result);
        }

        await this.say('files_modified', `Successfully modified ${files.length} files`);
        return results;
    }

    // Create file from specification
    async createFileFromSpec(fileSpec, context) {
        const projectContext = this.getProjectContext();
        projectContext.context = context;
        
        const content = await this.aiHandler.generateFileContent(fileSpec, projectContext);
        await this.fileManager.createFileWithTracking(fileSpec.path, content);
        
        return {
            path: fileSpec.path,
            action: 'created',
            size: content.length,
            success: true
        };
    }

    // Modify file from specification
    async modifyFileFromSpec(fileSpec, context) {
        const currentContent = await this.fileManager.readFile(fileSpec.path);
        const projectContext = this.getProjectContext();
        projectContext.context = context;
        
        const newContent = await this.aiHandler.editFileWithContext(
            fileSpec.path,
            currentContent,
            fileSpec.reason || context,
            projectContext
        );

        await this.fileManager.editFileWithContext(fileSpec.path, {
            type: 'modify',
            newContent: newContent,
            reason: fileSpec.reason
        });

        return {
            path: fileSpec.path,
            action: 'modified',
            changes: this.analyzeDiff(currentContent, newContent),
            success: true
        };
    }

    // Get current project context
    getProjectContext() {
        const projectState = this.fileManager.getProjectState();
        return {
            framework: this.taskState.projectContext.get('framework') || 'HTML/CSS/JS',
            features: Array.from(this.taskState.projectContext.get('features') || []),
            technologies: Array.from(this.taskState.projectContext.get('technologies') || []),
            existingFiles: projectState.createdFiles,
            totalFiles: projectState.totalFiles,
            dependencies: projectState.dependencies
        };
    }

    // Generate content from template
    async generateFromTemplate(templateName, projectContext) {
        // Template generation logic - simplified for now
        const templates = {
            'react-package': () => JSON.stringify({
                name: "react-app",
                version: "1.0.0",
                dependencies: {
                    "react": "^18.2.0",
                    "react-dom": "^18.2.0",
                    "react-scripts": "5.0.1"
                },
                scripts: {
                    "start": "react-scripts start",
                    "build": "react-scripts build",
                    "test": "react-scripts test",
                    "eject": "react-scripts eject"
                }
            }, null, 2),
            
            'html-index': () => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Application</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div id="app">
        <h1>Welcome to My Application</h1>
    </div>
    <script src="script.js"></script>
</body>
</html>`
        };

        const generator = templates[templateName];
        if (generator) {
            return generator();
        }

        // Fallback to AI generation
        return await this.aiHandler.generateFileContent({
            template: templateName,
            description: `Generate ${templateName} content`
        }, projectContext);
    }

    // Group steps by phase for progress tracking
    groupStepsByPhase(steps) {
        const phases = {};
        steps.forEach(step => {
            if (!phases[step.phase]) {
                phases[step.phase] = [];
            }
            phases[step.phase].push(step);
        });
        return phases;
    }

    // Generate completion summary
    generateCompletionSummary(projectState, validation) {
        return {
            taskId: this.taskId,
            workspace: this.workspaceManager.workspacePath,
            filesCreated: projectState.createdFiles,
            filesModified: projectState.modifiedFiles,
            totalFiles: projectState.totalFiles,
            framework: this.taskState.projectContext.get('framework'),
            features: Array.from(this.taskState.projectContext.get('features') || []),
            validationScore: validation.score,
            completedAt: new Date().toISOString(),
            duration: Date.now() - new Date(this.createdAt).getTime()
        };
    }

    // Analyze diff between old and new content
    analyzeDiff(oldContent, newContent) {
        const oldLines = oldContent.split('\n');
        const newLines = newContent.split('\n');
        
        return {
            linesAdded: Math.max(0, newLines.length - oldLines.length),
            linesRemoved: Math.max(0, oldLines.length - newLines.length),
            totalChanges: Math.abs(newLines.length - oldLines.length)
        };
    }

    // Handle step execution errors
    async handleStepError(step, error) {
        this.taskState.consecutiveMistakeCount++;
        
        await this.say('step_error', `Error in step ${step.id}: ${error.message}`, null, null, false, {
            step: step,
            error: error.message,
            attempt: this.taskState.consecutiveMistakeCount
        });

        // Try to recover from error
        if (this.taskState.consecutiveMistakeCount < 3) {
            await this.say('step_retry', `Attempting to retry step ${step.id}...`);
            // Could implement retry logic here
        } else {
            error.critical = true;
        }
    }

    // Handle general task errors
    async handleError(operation, error) {
        await this.messageStateHandler.addSystemMessage('error', `Error during ${operation}: ${error.message}`);
        console.error(`Task ${this.taskId} error during ${operation}:`, error);
    }

    // Send message to API clients
    async say(type, message, images = null, files = null, partial = false, metadata = {}) {
        const messageData = {
            type,
            text: message,
            images,
            files,
            partial,
            metadata,
            timestamp: new Date().toISOString(),
            taskId: this.taskId
        };

        // Add to message history
        await this.messageStateHandler.addSystemMessage(type, message, metadata);

        // Post to API clients
        await this.postMessageToAPI(messageData);

        this.lastActivity = new Date().toISOString();
        return messageData;
    }

    // Fix validation issue
    async fixIssue(issue) {
        try {
            if (issue.file && issue.suggestion) {
                const currentContent = await this.fileManager.readFile(issue.file);
                const projectContext = this.getProjectContext();
                
                const fixedContent = await this.aiHandler.editFileWithContext(
                    issue.file,
                    currentContent,
                    `Fix this issue: ${issue.description}. Suggestion: ${issue.suggestion}`,
                    projectContext
                );

                await this.fileManager.editFileWithContext(issue.file, {
                    type: 'fix',
                    newContent: fixedContent,
                    issue: issue
                });

                await this.say('issue_fixed', `Fixed issue in ${issue.file}: ${issue.description}`);
                return true;
            }
        } catch (error) {
            console.error('Error fixing issue:', error);
            return false;
        }
    }

    // Get task status
    getStatus() {
        return {
            taskId: this.taskId,
            userId: this.userId,
            isActive: this.taskState.isInitialized,
            progress: this.taskState.getProgress(),
            summary: this.taskState.getSummary(),
            conversation: this.messageStateHandler.getConversationSummary(),
            createdAt: this.createdAt,
            lastActivity: this.lastActivity
        };
    }

    // Cancel task
    async cancelTask() {
        this.taskState.abort = true;
        this.taskState.abandoned = true;
        this.taskState.isInitialized = false;
        
        await this.say('task_cancelled', 'Task has been cancelled');
    }
}

module.exports = Task;