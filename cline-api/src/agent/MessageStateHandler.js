/**
 * MessageStateHandler - Manages conversation and message state for agent tasks
 * Extracted from: /app/src/core/task/message-state.ts
 * Adapted for API use
 */

const { v4: uuidv4 } = require('uuid');

class MessageStateHandler {
    constructor({ taskId, taskState, updateTaskHistory }) {
        this.taskId = taskId;
        this.taskState = taskState;
        this.updateTaskHistory = updateTaskHistory;
        this.clineMessages = [];
        this.apiConversationHistory = [];
        this.conversationHistoryIndex = 0;
    }

    // Add message to conversation history
    async addMessage(type, content, metadata = {}) {
        const message = {
            id: uuidv4(),
            type,
            content,
            metadata,
            timestamp: new Date().toISOString(),
            taskId: this.taskId
        };

        this.clineMessages.push(message);
        
        // Update API conversation history for LLM
        if (type === 'user' || type === 'assistant') {
            this.apiConversationHistory.push({
                role: type === 'user' ? 'user' : 'assistant',
                content: content
            });
        }

        return message;
    }

    // Add user message
    async addUserMessage(content, images = [], files = []) {
        return await this.addMessage('user', content, { images, files });
    }

    // Add assistant message
    async addAssistantMessage(content, toolUse = null) {
        return await this.addMessage('assistant', content, { toolUse });
    }

    // Add system message (for internal agent communication)
    async addSystemMessage(type, content, metadata = {}) {
        return await this.addMessage('system', content, { type, ...metadata });
    }

    // Get conversation history for LLM
    getApiConversationHistory() {
        return this.apiConversationHistory;
    }

    // Get all messages
    getClineMessages() {
        return this.clineMessages;
    }

    // Update message by ID
    async updateMessage(messageId, updates) {
        const messageIndex = this.clineMessages.findIndex(m => m.id === messageId);
        if (messageIndex !== -1) {
            this.clineMessages[messageIndex] = {
                ...this.clineMessages[messageIndex],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            return this.clineMessages[messageIndex];
        }
        return null;
    }

    // Clear conversation history
    clearHistory() {
        this.clineMessages = [];
        this.apiConversationHistory = [];
        this.conversationHistoryIndex = 0;
    }

    // Get conversation summary
    getConversationSummary() {
        return {
            totalMessages: this.clineMessages.length,
            userMessages: this.clineMessages.filter(m => m.type === 'user').length,
            assistantMessages: this.clineMessages.filter(m => m.type === 'assistant').length,
            systemMessages: this.clineMessages.filter(m => m.type === 'system').length,
            lastMessage: this.clineMessages[this.clineMessages.length - 1],
            conversationStart: this.clineMessages[0]?.timestamp,
            conversationDuration: this.clineMessages.length > 0 ? 
                Date.now() - new Date(this.clineMessages[0].timestamp).getTime() : 0
        };
    }

    // Save conversation state (for API persistence)
    saveState() {
        return {
            taskId: this.taskId,
            clineMessages: this.clineMessages,
            apiConversationHistory: this.apiConversationHistory,
            conversationHistoryIndex: this.conversationHistoryIndex,
            savedAt: new Date().toISOString()
        };
    }

    // Restore conversation state
    restoreState(state) {
        if (state.taskId === this.taskId) {
            this.clineMessages = state.clineMessages || [];
            this.apiConversationHistory = state.apiConversationHistory || [];
            this.conversationHistoryIndex = state.conversationHistoryIndex || 0;
            return true;
        }
        return false;
    }
}

module.exports = MessageStateHandler;