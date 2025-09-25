/**
 * Response formatting utilities for the agent
 * Extracted from Cline's response formatting logic
 */

const formatResponse = {
    // Tool execution results
    toolResult: (content, images = null, fileContentString = null) => {
        if (images && images.length > 0) {
            return [
                { type: "text", text: content },
                ...images.map(image => ({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: image } }))
            ];
        }
        
        if (fileContentString) {
            return `${content}\n\n${fileContentString}`;
        }
        
        return content;
    },

    // Tool error responses
    toolError: (error) => {
        return `Error: ${error}`;
    },

    // Tool denied by user
    toolDenied: () => {
        return "The user denied this operation.";
    },

    // Tool already used in this message
    toolAlreadyUsed: (toolName) => {
        return `Tool ${toolName} was already used in this message. Only one tool can be used per message.`;
    },

    // Missing parameter error
    missingParameter: (toolName, paramName) => {
        return `Missing required parameter '${paramName}' for tool '${toolName}'.`;
    },

    // File access denied
    accessDenied: (filePath) => {
        return `Access denied to file: ${filePath}. File is outside workspace or restricted.`;
    },

    // Diff application error
    diffError: (filePath, originalContent) => {
        return `Failed to apply diff to ${filePath}. Please verify the search text matches exactly what's in the file.\n\nOriginal content:\n${originalContent}`;
    },

    // Cline ignore error
    clineIgnoreError: (filePath) => {
        return `Access to ${filePath} is restricted by .cline-ignore rules.`;
    },

    // Invalid MCP tool argument
    invalidMcpToolArgumentError: (serverName, toolName) => {
        return `Invalid JSON argument provided for MCP tool '${toolName}' on server '${serverName}'.`;
    },

    // Success responses
    success: (message, data = null) => {
        return {
            success: true,
            message,
            data,
            timestamp: new Date().toISOString()
        };
    },

    // Error responses
    error: (message, details = null) => {
        return {
            success: false,
            error: message,
            details,
            timestamp: new Date().toISOString()
        };
    },

    // File operation responses
    fileCreated: (filePath, size, lines) => {
        return formatResponse.success(`Created file: ${filePath}`, {
            operation: 'create',
            path: filePath,
            size,
            lines
        });
    },

    fileModified: (filePath, changes) => {
        return formatResponse.success(`Modified file: ${filePath}`, {
            operation: 'modify',
            path: filePath,
            changes
        });
    },

    fileRead: (filePath, content) => {
        return formatResponse.success(`Read file: ${filePath}`, {
            operation: 'read',
            path: filePath,
            content,
            size: content.length,
            lines: content.split('\n').length
        });
    },

    // Task responses
    taskStarted: (taskId, description) => {
        return formatResponse.success('Task started', {
            taskId,
            description,
            status: 'started'
        });
    },

    taskCompleted: (taskId, summary) => {
        return formatResponse.success('Task completed successfully', {
            taskId,
            summary,
            status: 'completed'
        });
    },

    taskFailed: (taskId, error) => {
        return formatResponse.error('Task failed', {
            taskId,
            error: error.message || error,
            status: 'failed'
        });
    },

    // Step responses
    stepStarted: (stepId, description) => {
        return formatResponse.success(`Step ${stepId} started: ${description}`, {
            stepId,
            description,
            status: 'started'
        });
    },

    stepCompleted: (stepId, result) => {
        return formatResponse.success(`Step ${stepId} completed`, {
            stepId,
            result,
            status: 'completed'
        });
    },

    stepFailed: (stepId, error) => {
        return formatResponse.error(`Step ${stepId} failed`, {
            stepId,
            error: error.message || error,
            status: 'failed'
        });
    },

    // Analysis responses
    analysisComplete: (analysis) => {
        return formatResponse.success('Requirements analysis completed', {
            projectType: analysis.projectType,
            framework: analysis.framework,
            complexity: analysis.complexity,
            features: analysis.features,
            estimatedFiles: analysis.estimatedFiles
        });
    },

    planningComplete: (plan) => {
        return formatResponse.success('Execution plan created', {
            totalSteps: plan.steps.length,
            estimatedTime: plan.estimatedTotalTime,
            phases: plan.phases || []
        });
    },

    // Validation responses
    validationComplete: (validation) => {
        return formatResponse.success('Project validation completed', {
            isValid: validation.isValid,
            score: validation.score,
            issues: validation.issues,
            improvements: validation.improvements || []
        });
    },

    // Stream responses
    streamStart: (streamId, type) => {
        return {
            type: 'stream_start',
            streamId,
            requestType: type,
            timestamp: new Date().toISOString()
        };
    },

    streamProgress: (streamId, progress, message) => {
        return {
            type: 'stream_progress',
            streamId,
            progress,
            message,
            timestamp: new Date().toISOString()
        };
    },

    streamComplete: (streamId, result) => {
        return {
            type: 'stream_complete',
            streamId,
            result,
            timestamp: new Date().toISOString()
        };
    },

    streamError: (streamId, error) => {
        return {
            type: 'stream_error',
            streamId,
            error: error.message || error,
            timestamp: new Date().toISOString()
        };
    }
};

module.exports = { formatResponse };