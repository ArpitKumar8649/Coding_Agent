/**
 * Enhanced LLM Service - Updated for Advanced Cline API
 */

const OpenRouterService = require('./openrouterService');

class LLMService {
    constructor() {
        this.provider = process.env.DEFAULT_LLM_PROVIDER || 'openrouter';
        this.openrouter = new OpenRouterService();
        this.currentProvider = this.openrouter; // Default to OpenRouter
    }

    async generateResponse(prompt, options = {}) {
        try {
            console.log('🤖 Generating LLM response...');
            
            const response = await this.currentProvider.generateResponse(prompt, options);
            
            console.log(`✅ Response generated (${response.usage?.total_tokens || 'unknown'} tokens)`);
            
            return response;
        } catch (error) {
            console.error('❌ LLM generation failed:', error.message);
            throw error;
        }
    }

    async generateStream(prompt, options = {}) {
        try {
            console.log('🌊 Starting LLM stream...');
            
            const stream = await this.currentProvider.generateStream(prompt, options);
            
            return stream;
        } catch (error) {
            console.error('❌ LLM streaming failed:', error.message);
            throw error;
        }
    }

    async generateWithContext(systemPrompt, conversationHistory = [], userMessage = '', options = {}) {
        try {
            // Build conversation messages
            const messages = [];
            
            if (systemPrompt) {
                messages.push({
                    role: 'system',
                    content: systemPrompt
                });
            }
            
            // Add conversation history
            messages.push(...conversationHistory);
            
            // Add current user message
            if (userMessage) {
                messages.push({
                    role: 'user',
                    content: userMessage
                });
            }
            
            const response = await this.currentProvider.generateWithContext(messages, options);
            
            return response;
        } catch (error) {
            console.error('❌ Context generation failed:', error.message);
            throw error;
        }
    }

    async listAvailableModels() {
        return await this.currentProvider.listAvailableModels();
    }

    async getModelInfo(modelId) {
        return await this.currentProvider.getModelInfo(modelId);
    }

    // Factory method for getting provider instance
    static getLLMProvider(providerName = 'openrouter') {
        switch (providerName) {
            case 'openrouter':
                return new OpenRouterService();
            default:
                return new OpenRouterService();
        }
    }
}

// Export both class and factory function
module.exports = LLMService;
module.exports.getLLMProvider = LLMService.getLLMProvider;