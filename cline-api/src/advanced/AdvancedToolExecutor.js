/**
 * AdvancedToolExecutor - Enhanced tool execution system based on Cline's ToolExecutor
 * Extracted from: /app/src/core/task/ToolExecutor.ts
 * Provides sophisticated tool orchestration with error recovery and validation
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class AdvancedToolExecutor {
    constructor(config = {}) {
        this.config = config;
        this.executionHistory = [];
        this.toolRegistry = new Map();
        this.workingDirectory = config.workingDirectory || process.cwd();
        this.maxRetries = config.maxRetries || 3;
        this.validationEnabled = config.validationEnabled !== false;
        
        this.initializeTools();
    }

    // Initialize tool implementations
    initializeTools() {
        this.toolRegistry.set('read_file', this.readFile.bind(this));
        this.toolRegistry.set('write_to_file', this.writeToFile.bind(this));
        this.toolRegistry.set('replace_in_file', this.replaceInFile.bind(this));
        this.toolRegistry.set('list_files', this.listFiles.bind(this));
        this.toolRegistry.set('search_files', this.searchFiles.bind(this));
        this.toolRegistry.set('list_code_definition_names', this.listCodeDefinitionNames.bind(this));
        this.toolRegistry.set('execute_command', this.executeCommand.bind(this));
        this.toolRegistry.set('ask_followup_question', this.askFollowupQuestion.bind(this));
        this.toolRegistry.set('attempt_completion', this.attemptCompletion.bind(this));
        this.toolRegistry.set('new_task', this.newTask.bind(this));
        this.toolRegistry.set('plan_mode_respond', this.planModeRespond.bind(this));
    }

    // Execute tool with validation and error handling
    async executeTool(toolName, parameters, context = {}) {
        const execution = {
            toolName,
            parameters,
            context,
            timestamp: new Date().toISOString(),
            attempts: 0,
            success: false,
            result: null,
            errors: []
        };

        try {
            // Validate tool exists
            if (!this.toolRegistry.has(toolName)) {
                throw new Error(`Unknown tool: ${toolName}`);
            }

            // Validate parameters
            this.validateToolParameters(toolName, parameters);

            // Execute with retry logic
            let lastError;
            for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
                execution.attempts = attempt;
                
                try {
                    console.log(`🔧 Executing ${toolName} (attempt ${attempt}/${this.maxRetries})`);
                    
                    const toolFunction = this.toolRegistry.get(toolName);
                    const result = await toolFunction(parameters, context);
                    
                    // Validate result if enabled
                    if (this.validationEnabled) {
                        await this.validateToolResult(toolName, parameters, result);
                    }
                    
                    execution.success = true;
                    execution.result = result;
                    break;
                    
                } catch (error) {
                    lastError = error;
                    execution.errors.push({
                        attempt,
                        error: error.message,
                        timestamp: new Date().toISOString()
                    });
                    
                    console.error(`❌ Tool execution failed (attempt ${attempt}):`, error.message);
                    
                    // Don't retry for certain types of errors
                    if (this.shouldNotRetry(error)) {
                        break;
                    }
                    
                    // Wait before retry
                    if (attempt < this.maxRetries) {
                        await this.sleep(1000 * attempt);
                    }
                }
            }

            if (!execution.success && lastError) {
                throw lastError;
            }

            this.executionHistory.push(execution);
            return execution.result;

        } catch (error) {
            execution.errors.push({
                error: error.message,
                timestamp: new Date().toISOString(),
                isFinal: true
            });
            this.executionHistory.push(execution);
            throw error;
        }
    }

    // Validate tool parameters
    validateToolParameters(toolName, parameters) {
        const requiredParams = this.getRequiredParameters(toolName);
        
        for (const param of requiredParams) {
            if (!(param in parameters) || parameters[param] === undefined || parameters[param] === '') {
                throw new Error(`Missing required parameter '${param}' for tool '${toolName}'`);
            }
        }
    }

    // Get required parameters for a tool
    getRequiredParameters(toolName) {
        const requirements = {
            'read_file': ['path'],
            'write_to_file': ['path', 'content'],
            'replace_in_file': ['path', 'diff'],
            'list_files': ['path'],
            'search_files': ['path', 'regex'],
            'list_code_definition_names': ['path'],
            'execute_command': ['command', 'requires_approval'],
            'ask_followup_question': ['question'],
            'attempt_completion': ['result'],
            'new_task': ['context'],
            'plan_mode_respond': ['response']
        };
        
        return requirements[toolName] || [];
    }

    // Validate tool execution result
    async validateToolResult(toolName, parameters, result) {
        switch (toolName) {
            case 'write_to_file':
                await this.validateFileWrite(parameters.path, parameters.content);
                break;
                
            case 'replace_in_file':
                await this.validateFileReplace(parameters.path, parameters.diff, result);
                break;
                
            case 'execute_command':
                await this.validateCommandExecution(parameters.command, result);
                break;
        }
    }

    // Check if error should not trigger retry
    shouldNotRetry(error) {
        const noRetryPatterns = [
            /file not found/i,
            /permission denied/i,
            /invalid syntax/i,
            /missing required parameter/i,
            /unknown tool/i
        ];
        
        return noRetryPatterns.some(pattern => pattern.test(error.message));
    }

    // Tool implementations
    async readFile(parameters) {
        const filePath = this.resolvePath(parameters.path);
        
        try {
            const content = await fs.readFile(filePath, 'utf8');
            return {
                success: true,
                content,
                path: filePath,
                size: content.length,
                lines: content.split('\n').length
            };
        } catch (error) {
            throw new Error(`Failed to read file ${filePath}: ${error.message}`);
        }
    }

    async writeToFile(parameters) {
        const filePath = this.resolvePath(parameters.path);
        const directory = path.dirname(filePath);
        
        try {
            // Ensure directory exists
            await fs.mkdir(directory, { recursive: true });
            
            // Write file
            await fs.writeFile(filePath, parameters.content, 'utf8');
            
            return {
                success: true,
                path: filePath,
                size: parameters.content.length,
                lines: parameters.content.split('\n').length,
                message: `File written successfully to ${filePath}`
            };
        } catch (error) {
            throw new Error(`Failed to write file ${filePath}: ${error.message}`);
        }
    }

    async replaceInFile(parameters) {
        const filePath = this.resolvePath(parameters.path);
        
        try {
            // Read current content
            const originalContent = await fs.readFile(filePath, 'utf8');
            let modifiedContent = originalContent;
            
            // Parse SEARCH/REPLACE blocks
            const blocks = this.parseSearchReplaceBlocks(parameters.diff);
            const appliedReplacements = [];
            
            for (const block of blocks) {
                const { search, replace } = block;
                
                if (modifiedContent.includes(search)) {
                    modifiedContent = modifiedContent.replace(search, replace);
                    appliedReplacements.push({
                        search: search.substring(0, 50) + '...',
                        replace: replace.substring(0, 50) + '...',
                        success: true
                    });
                } else {
                    throw new Error(`Search text not found in file: ${search.substring(0, 100)}...`);
                }
            }
            
            // Write modified content
            await fs.writeFile(filePath, modifiedContent, 'utf8');
            
            return {
                success: true,
                path: filePath,
                replacements: appliedReplacements.length,
                appliedReplacements,
                originalSize: originalContent.length,
                newSize: modifiedContent.length,
                message: `Successfully applied ${appliedReplacements.length} replacements to ${filePath}`
            };
        } catch (error) {
            throw new Error(`Failed to replace in file ${filePath}: ${error.message}`);
        }
    }

    async listFiles(parameters) {
        const dirPath = this.resolvePath(parameters.path);
        const recursive = parameters.recursive === true || parameters.recursive === 'true';
        
        try {
            const files = await this.scanDirectory(dirPath, recursive);
            return {
                success: true,
                path: dirPath,
                files,
                count: files.length,
                recursive
            };
        } catch (error) {
            throw new Error(`Failed to list files in ${dirPath}: ${error.message}`);
        }
    }

    async searchFiles(parameters) {
        const dirPath = this.resolvePath(parameters.path);
        const regex = new RegExp(parameters.regex, 'gi');
        const filePattern = parameters.file_pattern || '*';
        
        try {
            const files = await this.scanDirectory(dirPath, true);
            const matches = [];
            
            for (const file of files) {
                if (this.matchesFilePattern(file.name, filePattern)) {
                    try {
                        const content = await fs.readFile(file.path, 'utf8');
                        const lines = content.split('\n');
                        
                        lines.forEach((line, index) => {
                            const match = regex.exec(line);
                            if (match) {
                                matches.push({
                                    file: file.path,
                                    line: index + 1,
                                    content: line.trim(),
                                    match: match[0],
                                    context: this.getLineContext(lines, index)
                                });
                            }
                        });
                    } catch (error) {
                        // Skip files that can't be read
                    }
                }
            }
            
            return {
                success: true,
                path: dirPath,
                regex: parameters.regex,
                filePattern,
                matches,
                matchCount: matches.length,
                filesScanned: files.length
            };
        } catch (error) {
            throw new Error(`Failed to search files in ${dirPath}: ${error.message}`);
        }
    }

    async listCodeDefinitionNames(parameters) {
        const dirPath = this.resolvePath(parameters.path);
        
        try {
            const files = await this.scanDirectory(dirPath, false);
            const definitions = [];
            
            for (const file of files) {
                if (this.isCodeFile(file.name)) {
                    try {
                        const content = await fs.readFile(file.path, 'utf8');
                        const fileDefs = this.extractCodeDefinitions(content, file.name);
                        definitions.push(...fileDefs);
                    } catch (error) {
                        // Skip files that can't be read
                    }
                }
            }
            
            return {
                success: true,
                path: dirPath,
                definitions,
                count: definitions.length,
                files: files.filter(f => this.isCodeFile(f.name)).length
            };
        } catch (error) {
            throw new Error(`Failed to list code definitions in ${dirPath}: ${error.message}`);
        }
    }

    async executeCommand(parameters) {
        const { command, requires_approval } = parameters;
        
        try {
            console.log(`Executing command: ${command}`);
            
            // Note: In a real implementation, you might want to handle approval logic
            if (requires_approval === 'true' || requires_approval === true) {
                console.log('⚠️  Command requires approval (auto-approving for API)');
            }
            
            const result = execSync(command, {
                cwd: this.workingDirectory,
                encoding: 'utf8',
                timeout: 30000 // 30 second timeout
            });
            
            return {
                success: true,
                command,
                output: result.trim(),
                exitCode: 0,
                workingDirectory: this.workingDirectory
            };
        } catch (error) {
            return {
                success: false,
                command,
                error: error.message,
                exitCode: error.status || 1,
                output: error.stdout ? error.stdout.toString() : '',
                stderr: error.stderr ? error.stderr.toString() : '',
                workingDirectory: this.workingDirectory
            };
        }
    }

    async askFollowupQuestion(parameters) {
        // In API context, this would typically be handled by the calling system
        return {
            success: true,
            question: parameters.question,
            options: parameters.options || [],
            timestamp: new Date().toISOString(),
            requiresUserResponse: true
        };
    }

    async attemptCompletion(parameters) {
        return {
            success: true,
            result: parameters.result,
            command: parameters.command || null,
            timestamp: new Date().toISOString(),
            taskCompleted: true
        };
    }

    async newTask(parameters) {
        return {
            success: true,
            context: parameters.context,
            timestamp: new Date().toISOString(),
            newTaskRequested: true
        };
    }

    async planModeRespond(parameters) {
        return {
            success: true,
            response: parameters.response,
            mode: 'PLAN',
            timestamp: new Date().toISOString()
        };
    }

    // Utility methods
    resolvePath(relativePath) {
        if (path.isAbsolute(relativePath)) {
            return relativePath;
        }
        return path.resolve(this.workingDirectory, relativePath);
    }

    async scanDirectory(dirPath, recursive) {
        const files = [];
        
        try {
            const entries = await fs.readdir(dirPath);
            
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry);
                const stats = await fs.stat(fullPath);
                
                if (stats.isFile()) {
                    files.push({
                        name: entry,
                        path: fullPath,
                        size: stats.size,
                        type: 'file',
                        extension: path.extname(entry)
                    });
                } else if (stats.isDirectory() && recursive && !entry.startsWith('.')) {
                    const subFiles = await this.scanDirectory(fullPath, true);
                    files.push(...subFiles);
                }
            }
        } catch (error) {
            throw new Error(`Failed to scan directory ${dirPath}: ${error.message}`);
        }
        
        return files;
    }

    parseSearchReplaceBlocks(diff) {
        const blocks = [];
        const parts = diff.split('------- SEARCH');
        
        for (let i = 1; i < parts.length; i++) {
            const block = parts[i];
            const replaceIndex = block.indexOf('=======');
            const endIndex = block.indexOf('+++++++ REPLACE');
            
            if (replaceIndex === -1 || endIndex === -1) {
                throw new Error('Invalid SEARCH/REPLACE block format');
            }
            
            const search = block.substring(0, replaceIndex).trim();
            const replace = block.substring(replaceIndex + 7, endIndex).trim();
            
            blocks.push({ search, replace });
        }
        
        return blocks;
    }

    matchesFilePattern(fileName, pattern) {
        if (pattern === '*') return true;
        
        const regex = new RegExp(
            pattern.replace(/\./g, '\\.').replace(/\*/g, '.*').replace(/\?/g, '.'),
            'i'
        );
        
        return regex.test(fileName);
    }

    getLineContext(lines, lineIndex, contextSize = 2) {
        const start = Math.max(0, lineIndex - contextSize);
        const end = Math.min(lines.length - 1, lineIndex + contextSize);
        
        return {
            before: lines.slice(start, lineIndex),
            after: lines.slice(lineIndex + 1, end + 1)
        };
    }

    isCodeFile(fileName) {
        const codeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.h', '.cs', '.php', '.rb', '.go', '.rs', '.swift'];
        return codeExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
    }

    extractCodeDefinitions(content, fileName) {
        const definitions = [];
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
            const trimmed = line.trim();
            
            // Function definitions
            const funcMatch = trimmed.match(/(?:function|const|let|var)\s+(\w+)|(?:class|interface)\s+(\w+)|(\w+)\s*:\s*function/);
            if (funcMatch) {
                const name = funcMatch[1] || funcMatch[2] || funcMatch[3];
                definitions.push({
                    name,
                    type: 'function',
                    file: fileName,
                    line: index + 1,
                    context: trimmed
                });
            }
        });
        
        return definitions;
    }

    async validateFileWrite(filePath, content) {
        try {
            const writtenContent = await fs.readFile(filePath, 'utf8');
            if (writtenContent !== content) {
                throw new Error('File content validation failed - written content does not match expected content');
            }
        } catch (error) {
            throw new Error(`File write validation failed: ${error.message}`);
        }
    }

    async validateFileReplace(filePath, diff, result) {
        if (!result.success) {
            throw new Error('File replacement was not successful');
        }
        
        if (result.replacements === 0) {
            throw new Error('No replacements were made - search text may not exist');
        }
    }

    async validateCommandExecution(command, result) {
        if (result.exitCode !== 0) {
            throw new Error(`Command execution failed with exit code ${result.exitCode}: ${result.stderr || result.error}`);
        }
    }

    // Get execution statistics
    getExecutionStats() {
        const successful = this.executionHistory.filter(e => e.success).length;
        const failed = this.executionHistory.length - successful;
        
        return {
            totalExecutions: this.executionHistory.length,
            successful,
            failed,
            successRate: this.executionHistory.length > 0 ? (successful / this.executionHistory.length) * 100 : 0,
            averageAttempts: this.executionHistory.length > 0 
                ? this.executionHistory.reduce((sum, e) => sum + e.attempts, 0) / this.executionHistory.length 
                : 0
        };
    }

    // Helper method for sleep
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = AdvancedToolExecutor;