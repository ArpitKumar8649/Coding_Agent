/**
 * OpenRouter Service - LLM integration for Advanced Cline API
 */

const axios = require('axios');

class OpenRouterService {
    constructor() {
        this.apiKey = process.env.OPENROUTER_API_KEY;
        this.baseURL = 'https://openrouter.ai/api/v1';
        this.defaultModel = process.env.DEFAULT_MODEL || 'x-ai/grok-4-fast:free';
        
        if (!this.apiKey) {
            console.warn('⚠️  OpenRouter API key not provided');
        }
        
        this.client = axios.create({
            baseURL: this.baseURL,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:3001',
                'X-Title': 'Advanced Cline API'
            }
        });
    }

    async generateResponse(prompt, options = {}) {
        try {
            const requestData = {
                model: options.model || this.defaultModel,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: options.temperature || 0.1,
                max_tokens: options.maxTokens || 3000,
                top_p: options.topP || 1,
                top_k: options.topK || 0,
                frequency_penalty: options.frequencyPenalty || 0,
                presence_penalty: options.presencePenalty || 0,
                stream: options.stream || false
            };

            console.log(`🤖 Generating response with ${requestData.model}`);
            
            const response = await this.client.post('/chat/completions', requestData);
            
            if (response.data.choices && response.data.choices.length > 0) {
                const content = response.data.choices[0].message.content;
                const usage = response.data.usage;
                
                return {
                    content,
                    usage,
                    model: requestData.model,
                    timestamp: new Date().toISOString()
                };
            } else {
                throw new Error('No response generated from OpenRouter');
            }
        } catch (error) {
            console.error('❌ OpenRouter API error:', error.response?.data || error.message);
            throw new Error(`OpenRouter API failed: ${error.response?.data?.error || error.message}`);
        }
    }

    async generateStream(prompt, options = {}) {
        try {
            const requestData = {
                model: options.model || this.defaultModel,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: options.temperature || 0.1,
                max_tokens: options.maxTokens || 3000,
                stream: true
            };

            console.log(`🌊 Starting stream with ${requestData.model}`);
            
            const response = await this.client.post('/chat/completions', requestData, {
                responseType: 'stream'
            });

            return this.createStreamIterator(response.data);
            
        } catch (error) {
            console.error('❌ OpenRouter streaming error:', error.response?.data || error.message);
            throw new Error(`OpenRouter streaming failed: ${error.response?.data?.error || error.message}`);
        }
    }

    async *createStreamIterator(stream) {
        let buffer = '';
        
        for await (const chunk of stream) {
            buffer += chunk.toString();
            const lines = buffer.split('\n');
            buffer = lines.pop(); // Keep incomplete line in buffer
            
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('data: ')) {
                    const data = trimmed.substring(6);
                    
                    if (data === '[DONE]') {
                        return;
                    }
                    
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.choices && parsed.choices[0].delta.content) {
                            yield {
                                type: 'content',
                                content: parsed.choices[0].delta.content,
                                timestamp: Date.now()
                            };
                        }
                    } catch (parseError) {
                        // Skip malformed JSON
                        continue;
                    }
                }
            }
        }
    }

    async listAvailableModels() {
        try {
            const response = await this.client.get('/models');
            return response.data.data.filter(model => 
                model.id.includes('free') || model.pricing?.prompt === '0'
            );
        } catch (error) {
            console.error('❌ Failed to list models:', error.message);
            return [];
        }
    }

    async getModelInfo(modelId) {
        try {
            const models = await this.listAvailableModels();
            return models.find(model => model.id === modelId);
        } catch (error) {
            console.error('❌ Failed to get model info:', error.message);
            return null;
        }
    }

    // Create context-aware conversation
    async createConversation(systemPrompt, conversationHistory = []) {
        const messages = [];
        
        if (systemPrompt) {
            messages.push({
                role: 'system',
                content: systemPrompt
            });
        }
        
        // Add conversation history
        messages.push(...conversationHistory);
        
        return messages;
    }

    // Generate with conversation context
    async generateWithContext(messages, options = {}) {
        try {
            const requestData = {
                model: options.model || this.defaultModel,
                messages,
                temperature: options.temperature || 0.1,
                max_tokens: options.maxTokens || 3000
            };

            const response = await this.client.post('/chat/completions', requestData);
            
            if (response.data.choices && response.data.choices.length > 0) {
                return {
                    content: response.data.choices[0].message.content,
                    usage: response.data.usage,
                    model: requestData.model,
                    timestamp: new Date().toISOString()
                };
            } else {
                throw new Error('No response generated');
            }
        } catch (error) {
            console.error('❌ Context generation error:', error.response?.data || error.message);
            throw new Error(`Context generation failed: ${error.response?.data?.error || error.message}`);
        }
    }
}

module.exports = OpenRouterService;