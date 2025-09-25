/**
 * Agent Module - Main exports for the Cline Agent system
 * Provides all core agent components for API use
 */

const Task = require('./Task');
const TaskState = require('./TaskState');
const AgentController = require('./AgentController');
const MessageStateHandler = require('./MessageStateHandler');
const PlanningEngine = require('./PlanningEngine');
const AgentAIHandler = require('./AgentAIHandler');
const ToolExecutor = require('./ToolExecutor');

module.exports = {
    // Core classes
    Task,
    TaskState,
    AgentController,
    MessageStateHandler,
    PlanningEngine,
    AgentAIHandler,
    ToolExecutor,

    // Convenience factory methods
    createAgent: ({
        workspaceManager,
        fileManager,
        contextManager,
        streamingService,
        apiConfiguration
    }) => {
        return new AgentController({
            workspaceManager,
            fileManager,
            contextManager,
            streamingService,
            apiConfiguration
        });
    },

    createTask: (options) => {
        return new Task(options);
    }
};