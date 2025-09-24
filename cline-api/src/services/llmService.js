const { Anthropic } = require('@anthropic-ai/sdk');
const { OpenAI } = require('openai');
const axios = require('axios');
// const { GoogleGenerativeAI } = require('@google/genai'); // Removed for compatibility

class LLMError extends Error {
  constructor(message, provider) {
    super(message);
    this.name = 'LLMError';
    this.provider = provider;
  }
}

/**
 * Anthropic (Claude) Provider
 */
class AnthropicProvider {
  constructor() {
    this.name = 'anthropic';
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async generateCode(prompt, options = {}) {
    try {
      const model = options.model || process.env.DEFAULT_MODEL || 'claude-3-5-sonnet-20241022';
      
      const response = await this.client.messages.create({
        model: model,
        max_tokens: options.maxTokens || 4000,
        temperature: options.temperature || 0.1,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      return {
        content: response.content[0].text,
        model: model,
        tokensUsed: response.usage?.total_tokens || 0
      };
    } catch (error) {
      throw new LLMError(`Anthropic API Error: ${error.message}`, 'anthropic');
    }
  }

  async editCode(prompt, options = {}) {
    return this.generateCode(prompt, options);
  }
}

/**
 * OpenAI Provider
 */
class OpenAIProvider {
  constructor() {
    this.name = 'openai';
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateCode(prompt, options = {}) {
    try {
      const model = options.model || 'gpt-4';
      
      const response = await this.client.chat.completions.create({
        model: model,
        max_tokens: options.maxTokens || 4000,
        temperature: options.temperature || 0.1,
        messages: [
          {
            role: 'system',
            content: 'You are an expert software developer. Generate clean, well-structured code.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      return {
        content: response.choices[0].message.content,
        model: model,
        tokensUsed: response.usage?.total_tokens || 0
      };
    } catch (error) {
      throw new LLMError(`OpenAI API Error: ${error.message}`, 'openai');
    }
  }

  async editCode(prompt, options = {}) {
    return this.generateCode(prompt, options);
  }
}

/**
 * OpenRouter Provider (supports multiple models including xAI Grok)
 */
class OpenRouterProvider {
  constructor() {
    this.name = 'openrouter';
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.baseUrl = 'https://openrouter.ai/api/v1';
  }

  async generateCode(prompt, options = {}) {
    try {
      const model = options.model || 'x-ai/grok-beta'; // Default to free xAI Grok model
      
      const response = await axios.post(`${this.baseUrl}/chat/completions`, {
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert software developer. Generate clean, well-structured code based on requirements.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: options.maxTokens || 4000,
        temperature: options.temperature || 0.1,
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.HTTP_REFERER || 'http://localhost:3000',
          'X-Title': 'Cline API Service'
        }
      });

      return {
        content: response.data.choices[0].message.content,
        model: model,
        tokensUsed: response.data.usage?.total_tokens || 0
      };
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      throw new LLMError(`OpenRouter API Error: ${errorMessage}`, 'openrouter');
    }
  }

  async editCode(prompt, options = {}) {
    return this.generateCode(prompt, options);
  }
}

/**
 * Get the appropriate LLM provider
 */
const getLLMProvider = (providerName) => {
  const provider = providerName || process.env.DEFAULT_LLM_PROVIDER || 'anthropic';
  
  switch (provider.toLowerCase()) {
    case 'anthropic':
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY environment variable is required');
      }
      return new AnthropicProvider();
    
    case 'openai':
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY environment variable is required');
      }
      return new OpenAIProvider();
    
    case 'google':
      if (!process.env.GOOGLE_API_KEY) {
        throw new Error('GOOGLE_API_KEY environment variable is required');
      }
      return new GoogleProvider();
    
    default:
      throw new Error(`Unsupported LLM provider: ${provider}. Supported providers: anthropic, openai, google`);
  }
};

module.exports = {
  getLLMProvider,
  LLMError,
  AnthropicProvider,
  OpenAIProvider,
  GoogleProvider
};