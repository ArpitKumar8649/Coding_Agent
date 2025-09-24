const { Anthropic } = require('@anthropic-ai/sdk');
const { OpenAI } = require('openai');
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
 * Google (Gemini) Provider
 */
class GoogleProvider {
  constructor() {
    this.name = 'google';
    this.client = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  }

  async generateCode(prompt, options = {}) {
    try {
      const model = options.model || 'gemini-pro';
      const genModel = this.client.getGenerativeModel({ model: model });
      
      const result = await genModel.generateContent(prompt);
      const response = await result.response;
      
      return {
        content: response.text(),
        model: model,
        tokensUsed: 0 // Gemini doesn't provide token usage in the same way
      };
    } catch (error) {
      throw new LLMError(`Google API Error: ${error.message}`, 'google');
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