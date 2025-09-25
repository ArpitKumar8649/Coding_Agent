/**
 * ToolExecutor - Handles tool execution for agent operations
 * Extracted from: /app/src/core/task/ToolExecutor.ts
 * Adapted for API use without VS Code dependencies
 */

const fs = require('fs').promises;
const path = require('path');
const { formatResponse } = require('../utils/responses');

class ToolExecutor {
    constructor({
        taskState,
        messageStateHandler,
        aiHandler,
        fileManager,
        workspaceManager,
        contextManager,
        autoApprovalSettings = { enabled: true },
        cwd,
        taskId
    }) {
        this.taskState = taskState;
        this.messageStateHandler = messageStateHandler;
        this.aiHandler = aiHandler;
        this.fileManager = fileManager;
        this.workspaceManager = workspaceManager;
        this.contextManager = contextManager;
        this.autoApprovalSettings = autoApprovalSettings;
        this.cwd = cwd;
        this.taskId = taskId;
    }

    // Execute a tool based on its type and parameters
    async executeTool(toolUse) {
        if (this.taskState.didRejectTool || this.taskState.didAlreadyUseTool) {
            return this.handleSkippedTool(toolUse);
        }

        try {
            switch (toolUse.name) {
                case 'write_to_file':
                    return await this.executeWriteToFile(toolUse);
                case 'replace_in_file':
                    return await this.executeReplaceInFile(toolUse);
                case 'read_file':
                    return await this.executeReadFile(toolUse);
                case 'list_files':
                    return await this.executeListFiles(toolUse);
                case 'search_files':
                    return await this.executeSearchFiles(toolUse);
                case 'execute_command':
                    return await this.executeCommand(toolUse);
                case 'ask_followup_question':
                    return await this.executeAskFollowup(toolUse);
                case 'attempt_completion':
                    return await this.executeAttemptCompletion(toolUse);
                default:
                    throw new Error(`Unknown tool: ${toolUse.name}`);
            }
        } catch (error) {
            await this.handleToolError(toolUse.name, error);
            return this.createErrorResult(error.message);
        }
    }

    // Execute write_to_file tool
    async executeWriteToFile(toolUse) {
        const { path: filePath, content } = toolUse.params;
        
        if (!filePath || content === undefined) {
            throw new Error('Missing required parameters: path and content');
        }

        // Validate file access
        const accessAllowed = await this.validateFileAccess(filePath);
        if (!accessAllowed) {
            throw new Error(`Access denied to file: ${filePath}`);
        }

        // Check if file exists
        const absolutePath = path.resolve(this.cwd, filePath);
        const fileExists = await this.fileExists(absolutePath);
        
        // Create file with tracking
        await this.fileManager.createFileWithTracking(filePath, content);
        
        // Update task state
        this.taskState.didEditFile = true;
        this.taskState.consecutiveMistakeCount = 0;

        // Log the operation
        await this.messageStateHandler.addSystemMessage('file_operation', 
            `${fileExists ? 'Modified' : 'Created'} file: ${filePath}`
        );

        return this.createSuccessResult({
            operation: fileExists ? 'modified' : 'created',
            path: filePath,
            size: content.length,
            lines: content.split('\n').length
        });
    }

    // Execute replace_in_file tool  
    async executeReplaceInFile(toolUse) {
        const { path: filePath, diff } = toolUse.params;
        
        if (!filePath || !diff) {
            throw new Error('Missing required parameters: path and diff');
        }

        // Validate file access
        const accessAllowed = await this.validateFileAccess(filePath);
        if (!accessAllowed) {
            throw new Error(`Access denied to file: ${filePath}`);
        }

        // Read current file content
        const currentContent = await this.fileManager.readFile(filePath);
        if (!currentContent) {
            throw new Error(`File not found: ${filePath}`);
        }

        // Apply diff using AI handler
        const newContent = await this.applyDiffToContent(currentContent, diff, filePath);
        
        // Save updated content
        await this.fileManager.editFileWithContext(filePath, {
            type: 'replace',
            diff: diff,
            newContent: newContent
        });

        // Update task state
        this.taskState.didEditFile = true;
        this.taskState.consecutiveMistakeCount = 0;

        // Log the operation
        await this.messageStateHandler.addSystemMessage('file_operation', 
            `Applied changes to file: ${filePath}`
        );

        return this.createSuccessResult({
            operation: 'replaced',
            path: filePath,
            changes: this.analyzeDiff(currentContent, newContent)
        });
    }

    // Execute read_file tool
    async executeReadFile(toolUse) {
        const { path: filePath } = toolUse.params;
        
        if (!filePath) {
            throw new Error('Missing required parameter: path');
        }

        // Validate file access
        const accessAllowed = await this.validateFileAccess(filePath);
        if (!accessAllowed) {
            throw new Error(`Access denied to file: ${filePath}`);
        }

        // Read file content
        const content = await this.fileManager.readFile(filePath);
        
        if (!content) {
            throw new Error(`File not found: ${filePath}`);
        }

        // Log the operation
        await this.messageStateHandler.addSystemMessage('file_operation', 
            `Read file: ${filePath} (${content.length} characters)`
        );

        return this.createSuccessResult({
            operation: 'read',
            path: filePath,
            content: content,
            size: content.length,
            lines: content.split('\n').length
        });
    }

    // Execute list_files tool
    async executeListFiles(toolUse) {
        const { path: dirPath = '.', recursive = false } = toolUse.params;
        
        // List files in directory
        const files = await this.fileManager.listFiles(dirPath, recursive);
        
        // Log the operation
        await this.messageStateHandler.addSystemMessage('file_operation', 
            `Listed ${files.length} files in: ${dirPath}`
        );

        return this.createSuccessResult({
            operation: 'list',
            path: dirPath,
            files: files,
            count: files.length,
            recursive: recursive
        });
    }

    // Execute search_files tool
    async executeSearchFiles(toolUse) {
        const { regex, file_pattern } = toolUse.params;
        
        if (!regex) {
            throw new Error('Missing required parameter: regex');
        }

        // Search files using file manager
        const results = await this.fileManager.searchFiles(regex, file_pattern);
        
        // Log the operation
        await this.messageStateHandler.addSystemMessage('file_operation', 
            `Search completed: found ${results.length} matches for "${regex}"`
        );

        return this.createSuccessResult({
            operation: 'search',
            pattern: regex,
            filePattern: file_pattern,
            results: results,
            matchCount: results.length
        });
    }

    // Execute command (limited for API use)
    async executeCommand(toolUse) {
        const { command } = toolUse.params;
        
        if (!command) {
            throw new Error('Missing required parameter: command');
        }

        // For API use, we limit command execution to safe operations
        const safeCommands = ['ls', 'pwd', 'cat', 'head', 'tail', 'grep', 'find'];
        const commandWord = command.trim().split(' ')[0];
        
        if (!safeCommands.includes(commandWord)) {
            return this.createSuccessResult({
                operation: 'command_blocked',
                command: command,
                message: 'Command execution is limited in API mode for security reasons',
                output: 'Command blocked for security'
            });
        }

        // For now, return a simulated response
        // TODO: Implement safe command execution in Phase 3
        return this.createSuccessResult({
            operation: 'command_simulated',
            command: command,
            output: `Simulated output for: ${command}`,
            exitCode: 0
        });
    }

    // Execute ask_followup_question tool
    async executeAskFollowup(toolUse) {
        const { question } = toolUse.params;
        
        if (!question) {
            throw new Error('Missing required parameter: question');
        }

        // Add question to message history
        await this.messageStateHandler.addSystemMessage('followup_question', question);

        return this.createSuccessResult({
            operation: 'question_asked',
            question: question,
            status: 'waiting_for_response'
        });
    }

    // Execute attempt_completion tool
    async executeAttemptCompletion(toolUse) {
        const { result, command } = toolUse.params;
        
        if (!result) {
            throw new Error('Missing required parameter: result');
        }

        // Mark task as completed
        this.taskState.isInitialized = false;
        
        // Add completion to message history
        await this.messageStateHandler.addSystemMessage('task_completion', result, {
            command: command,
            completedAt: new Date().toISOString()
        });

        return this.createSuccessResult({
            operation: 'completion',
            result: result,
            command: command,
            taskCompleted: true
        });
    }

    // Validate file access permissions
    async validateFileAccess(filePath) {
        // Basic validation - in API mode we're more permissive within workspace
        const absolutePath = path.resolve(this.cwd, filePath);
        const normalizedCwd = path.resolve(this.cwd);
        
        // Ensure file is within workspace
        return absolutePath.startsWith(normalizedCwd);
    }

    // Check if file exists
    async fileExists(absolutePath) {
        try {
            await fs.access(absolutePath);
            return true;
        } catch {
            return false;
        }
    }

    // Apply diff to content using AI
    async applyDiffToContent(currentContent, diff, filePath) {
        // Parse diff and apply changes
        // This is a simplified version - in production, use proper diff parsing
        const lines = currentContent.split('\n');
        const diffLines = diff.split('\n');
        
        // For now, we'll use AI to apply the diff properly
        try {
            const projectContext = await this.getProjectContext();
            const editInstructions = `Apply this diff to the file:\n${diff}`;
            
            return await this.aiHandler.editFileWithContext(
                filePath,
                currentContent,
                editInstructions,
                projectContext
            );
        } catch (error) {
            // Fallback: return original content if AI edit fails
            console.warn('AI diff application failed, returning original content:', error.message);
            return currentContent;
        }
    }

    // Get current project context
    async getProjectContext() {
        const projectState = this.fileManager.getProjectState();
        return {
            framework: this.taskState.projectContext.get('framework') || 'HTML/CSS/JS',
            features: Array.from(this.taskState.projectContext.get('features') || []),
            technologies: Array.from(this.taskState.projectContext.get('technologies') || []),
            relatedFiles: projectState.createdFiles.slice(0, 10) // limit for context
        };
    }

    // Analyze diff changes
    analyzeDiff(oldContent, newContent) {
        const oldLines = oldContent.split('\n');
        const newLines = newContent.split('\n');
        
        return {
            linesAdded: Math.max(0, newLines.length - oldLines.length),
            linesRemoved: Math.max(0, oldLines.length - newLines.length),
            totalChanges: Math.abs(newLines.length - oldLines.length)
        };
    }

    // Handle skipped tool execution
    handleSkippedTool(toolUse) {
        const reason = this.taskState.didRejectTool ? 'tool_rejected' : 'tool_already_used';
        
        return this.createSuccessResult({
            operation: 'skipped',
            tool: toolUse.name,
            reason: reason,
            message: `Tool ${toolUse.name} was skipped: ${reason}`
        });
    }

    // Handle tool execution errors
    async handleToolError(toolName, error) {
        this.taskState.consecutiveMistakeCount++;
        
        await this.messageStateHandler.addSystemMessage('tool_error', 
            `Error executing ${toolName}: ${error.message}`
        );
        
        console.error(`Tool execution error [${toolName}]:`, error);
    }

    // Create success result
    createSuccessResult(data) {
        return {
            success: true,
            ...data,
            timestamp: new Date().toISOString()
        };
    }

    // Create error result
    createErrorResult(message) {
        return {
            success: false,
            error: message,
            timestamp: new Date().toISOString()
        };
    }

    // Push tool result to task state
    pushToolResult(result) {
        this.taskState.stepResults.push(result);
        this.taskState.didAlreadyUseTool = true;
        return result;
    }
}

module.exports = ToolExecutor;