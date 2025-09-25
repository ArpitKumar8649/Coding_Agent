/**
 * TaskState - Manages the state of an agent task execution
 * Extracted from: /app/src/core/task/TaskState.ts
 * Adapted for API use (removed VS Code dependencies)
 */

class TaskState {
    constructor() {
        // Streaming flags
        this.isStreaming = false;
        this.isWaitingForFirstChunk = false;
        this.didCompleteReadingStream = false;

        // Content processing
        this.currentStreamingContentIndex = 0;
        this.assistantMessageContent = [];
        this.userMessageContent = [];
        this.userMessageContentReady = false;

        // Presentation locks
        this.presentAssistantMessageLocked = false;
        this.presentAssistantMessageHasPendingUpdates = false;

        // Claude 4 experimental JSON streaming
        this.streamingJsonReplacer = undefined;
        this.lastProcessedJsonLength = 0;

        // Ask/Response handling
        this.askResponse = undefined;
        this.askResponseText = undefined;
        this.askResponseImages = undefined;
        this.askResponseFiles = undefined;
        this.lastMessageTs = undefined;

        // Plan mode specific state
        this.isAwaitingPlanResponse = false;
        this.didRespondToPlanAskBySwitchingMode = false;

        // Context and history
        this.conversationHistoryDeletedRange = undefined;

        // Tool execution flags
        this.didRejectTool = false;
        this.didAlreadyUseTool = false;
        this.didEditFile = false;

        // Consecutive request tracking
        this.consecutiveAutoApprovedRequestsCount = 0;

        // Error tracking
        this.consecutiveMistakeCount = 0;
        this.didAutomaticallyRetryFailedApiRequest = false;
        this.checkpointTrackerErrorMessage = undefined;

        // Task Initialization
        this.isInitialized = false;

        // Task Abort / Cancellation
        this.abort = false;
        this.didFinishAbortingStream = false;
        this.abandoned = false;

        // API-specific state
        this.currentWorkspace = null;
        this.projectContext = new Map();
        this.executionPlan = null;
        this.currentStepIndex = 0;
        this.stepResults = [];
    }

    // Reset task state for new execution
    reset() {
        this.isStreaming = false;
        this.isWaitingForFirstChunk = false;
        this.didCompleteReadingStream = false;
        this.currentStreamingContentIndex = 0;
        this.assistantMessageContent = [];
        this.userMessageContent = [];
        this.userMessageContentReady = false;
        this.didRejectTool = false;
        this.didAlreadyUseTool = false;
        this.didEditFile = false;
        this.consecutiveAutoApprovedRequestsCount = 0;
        this.consecutiveMistakeCount = 0;
        this.abort = false;
        this.didFinishAbortingStream = false;
        this.abandoned = false;
        this.currentStepIndex = 0;
        this.stepResults = [];
    }

    // Get current execution progress
    getProgress() {
        if (!this.executionPlan || !this.executionPlan.steps) {
            return 0;
        }
        return Math.round((this.currentStepIndex / this.executionPlan.steps.length) * 100);
    }

    // Add step result
    addStepResult(result) {
        this.stepResults.push({
            ...result,
            timestamp: new Date().toISOString(),
            stepIndex: this.currentStepIndex
        });
    }

    // Get task summary
    getSummary() {
        return {
            isActive: this.isStreaming || this.isInitialized,
            progress: this.getProgress(),
            totalSteps: this.executionPlan ? this.executionPlan.steps.length : 0,
            completedSteps: this.currentStepIndex,
            hasErrors: this.consecutiveMistakeCount > 0,
            isAbandoned: this.abandoned,
            workspace: this.currentWorkspace
        };
    }
}

module.exports = TaskState;