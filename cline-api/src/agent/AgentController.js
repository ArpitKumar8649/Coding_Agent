/**
 * AgentController - Main controller for managing agent tasks and state
 * Extracted from: /app/src/core/controller/index.ts
 * Adapted for API use without VS Code dependencies
 */

const { v4: uuidv4 } = require('uuid');
const Task = require('./Task');

class AgentController {
    constructor({
        workspaceManager,
        fileManager,
        contextManager,
        streamingService = null,
        apiConfiguration
    }) {
        // Core services
        this.workspaceManager = workspaceManager;
        this.fileManager = fileManager;
        this.contextManager = contextManager;
        this.streamingService = streamingService;
        this.apiConfiguration = apiConfiguration;

        // Task management
        this.activeTasks = new Map();
        this.taskHistory = [];
        
        // Controller state
        this.initialized = false;
        this.createdAt = new Date().toISOString();
    }

    // Initialize the controller
    async initialize() {
        if (this.initialized) return;
        
        console.log('🤖 Initializing Agent Controller...');
        
        // Initialize services
        await this.workspaceManager.initialize?.();
        await this.fileManager.initialize?.();
        await this.contextManager?.initialize?.();
        
        this.initialized = true;
        console.log('✅ Agent Controller initialized successfully');
    }

    // Create and start a new task
    async createTask(instruction, options = {}) {
        await this.ensureInitialized();
        
        const taskId = options.taskId || uuidv4();
        const userId = options.userId || 'anonymous';
        
        console.log(`📝 Creating new task: ${taskId}`);
        
        // Create task instance
        const task = new Task({
            workspaceManager: this.workspaceManager,
            fileManager: this.fileManager,
            contextManager: this.contextManager,
            updateTaskHistory: this.updateTaskHistory.bind(this),
            postStateToAPI: this.createPostStateHandler(taskId),
            postMessageToAPI: this.createPostMessageHandler(taskId),
            apiConfiguration: this.apiConfiguration,
            autoApprovalSettings: options.autoApprovalSettings || { enabled: true },
            taskId,
            userId
        });

        // Store active task
        this.activeTasks.set(taskId, task);
        
        // Setup streaming if available
        if (this.streamingService && options.streaming) {
            this.setupTaskStreaming(taskId, task);
        }

        try {
            // Start the task
            await task.startTask(instruction, options);
            
            // Add to history
            await this.updateTaskHistory({
                id: taskId,
                userId: userId,
                instruction: instruction,
                status: 'completed',
                createdAt: task.createdAt,
                completedAt: new Date().toISOString(),
                summary: task.getStatus()
            });

            console.log(`✅ Task completed successfully: ${taskId}`);
            
            return task.getStatus();
            
        } catch (error) {
            console.error(`❌ Task failed: ${taskId}`, error);
            
            // Update task status  
            await this.updateTaskHistory({
                id: taskId,
                userId: userId,
                instruction: instruction,
                status: 'failed',
                createdAt: task.createdAt,
                failedAt: new Date().toISOString(),
                error: error.message,
                summary: task.getStatus()
            });
            
            throw error;
        } finally {
            // Clean up completed task after some delay
            setTimeout(() => {
                this.activeTasks.delete(taskId);
            }, 30000); // Keep for 30 seconds for status queries
        }
    }

    // Continue development on an existing task/project
    async continueTask(taskId, instruction, options = {}) {
        await this.ensureInitialized();
        
        let task = this.activeTasks.get(taskId);
        
        // If task doesn't exist, create a new one in the same workspace
        if (!task) {
            console.log(`📝 Creating continuation task for: ${taskId}`);
            
            task = new Task({
                workspaceManager: this.workspaceManager,
                fileManager: this.fileManager,
                contextManager: this.contextManager,
                updateTaskHistory: this.updateTaskHistory.bind(this),
                postStateToAPI: this.createPostStateHandler(taskId),
                postMessageToAPI: this.createPostMessageHandler(taskId),
                apiConfiguration: this.apiConfiguration,
                autoApprovalSettings: options.autoApprovalSettings || { enabled: true },
                taskId,
                userId: options.userId || 'anonymous'
            });
            
            this.activeTasks.set(taskId, task);
            
            // Setup streaming if available
            if (this.streamingService && options.streaming) {
                this.setupTaskStreaming(taskId, task);
            }
        }

        try {
            // Handle the instruction
            const result = await task.handleInstruction(instruction, options);
            
            console.log(`✅ Task instruction completed: ${taskId}`);
            return result;
            
        } catch (error) {
            console.error(`❌ Task instruction failed: ${taskId}`, error);
            throw error;
        }
    }

    // Get task status
    async getTaskStatus(taskId) {
        const task = this.activeTasks.get(taskId);
        if (!task) {
            // Check task history
            const historicalTask = this.taskHistory.find(t => t.id === taskId);
            if (historicalTask) {
                return {
                    ...historicalTask,
                    isActive: false,
                    isHistorical: true
                };
            }
            return null;
        }
        
        return task.getStatus();
    }

    // List all active tasks
    getActiveTasks() {
        const tasks = [];
        for (const [taskId, task] of this.activeTasks.entries()) {
            tasks.push(task.getStatus());
        }
        return tasks;
    }

    // Get task history
    getTaskHistory(userId = null, limit = 50) {
        let history = [...this.taskHistory];
        
        if (userId) {
            history = history.filter(task => task.userId === userId);
        }
        
        return history
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, limit);
    }

    // Cancel a task
    async cancelTask(taskId) {
        const task = this.activeTasks.get(taskId);
        if (!task) {
            throw new Error(`Task not found: ${taskId}`);
        }
        
        await task.cancelTask();
        
        // Update history
        await this.updateTaskHistory({
            id: taskId,
            status: 'cancelled',
            cancelledAt: new Date().toISOString()
        });
        
        return true;
    }

    // Clear completed tasks
    clearCompletedTasks() {
        const activeTasks = new Map();
        
        for (const [taskId, task] of this.activeTasks.entries()) {
            if (task.taskState.isInitialized) {
                activeTasks.set(taskId, task);
            }
        }
        
        this.activeTasks = activeTasks;
        
        return {
            cleared: this.activeTasks.size,
            remaining: activeTasks.size
        };
    }

    // Setup streaming for a task
    setupTaskStreaming(taskId, task) {
        if (!this.streamingService) return;
        
        console.log(`🔄 Setting up streaming for task: ${taskId}`);
        
        // Stream task messages to connected clients
        const originalPostMessage = task.postMessageToAPI;
        task.postMessageToAPI = async (message) => {
            // Call original handler
            await originalPostMessage(message);
            
            // Stream to WebSocket clients
            this.streamingService.sendTaskUpdate(taskId, {
                type: 'message',
                data: message
            });
        };
        
        // Stream task state updates
        const originalPostState = task.postStateToAPI;
        task.postStateToAPI = async () => {
            // Call original handler
            await originalPostState();
            
            // Stream state to WebSocket clients
            this.streamingService.sendTaskUpdate(taskId, {
                type: 'state',
                data: task.getStatus()
            });
        };
    }

    // Create post state handler for a task
    createPostStateHandler(taskId) {
        return async () => {
            // This would normally update a webview in VS Code
            // For API, we can emit events or update caches
            console.log(`📊 Task state updated: ${taskId}`);
        };
    }

    // Create post message handler for a task
    createPostMessageHandler(taskId) {
        return async (message) => {
            // This would normally send messages to webview in VS Code
            // For API, we can emit events, log, or handle differently
            console.log(`📨 Task message: ${taskId}`, message.type, message.text?.substring(0, 100) + '...');
        };
    }

    // Update task history
    async updateTaskHistory(historyItem) {
        const existingIndex = this.taskHistory.findIndex(item => item.id === historyItem.id);
        
        if (existingIndex !== -1) {
            // Update existing item
            this.taskHistory[existingIndex] = {
                ...this.taskHistory[existingIndex],
                ...historyItem,
                updatedAt: new Date().toISOString()
            };
        } else {
            // Add new item
            this.taskHistory.push({
                ...historyItem,
                createdAt: historyItem.createdAt || new Date().toISOString()
            });
        }
        
        // Keep only last 1000 items
        if (this.taskHistory.length > 1000) {
            this.taskHistory = this.taskHistory.slice(-1000);
        }
        
        return this.taskHistory;
    }

    // Ensure controller is initialized
    async ensureInitialized() {
        if (!this.initialized) {
            await this.initialize();
        }
    }

    // Get controller statistics
    getStats() {
        return {
            initialized: this.initialized,
            activeTasks: this.activeTasks.size,
            totalTasksInHistory: this.taskHistory.length,
            successfulTasks: this.taskHistory.filter(t => t.status === 'completed').length,
            failedTasks: this.taskHistory.filter(t => t.status === 'failed').length,
            cancelledTasks: this.taskHistory.filter(t => t.status === 'cancelled').length,
            createdAt: this.createdAt,
            uptime: Date.now() - new Date(this.createdAt).getTime()
        };
    }

    // Cleanup resources
    async cleanup() {
        console.log('🧹 Cleaning up Agent Controller...');
        
        // Cancel all active tasks
        for (const [taskId, task] of this.activeTasks.entries()) {
            try {
                await task.cancelTask();
            } catch (error) {
                console.error(`Error cancelling task ${taskId}:`, error);
            }
        }
        
        this.activeTasks.clear();
        this.initialized = false;
        
        console.log('✅ Agent Controller cleanup complete');
    }
}

module.exports = AgentController;