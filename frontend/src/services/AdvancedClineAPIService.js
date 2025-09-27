/**
 * Advanced Cline API Service
 * Connects to enhanced Cline API server with streaming and advanced features
 */

class AdvancedClineAPIService {
  constructor(baseURL = null, apiKey = null) {
    this.baseURL = baseURL || process.env.REACT_APP_CLINE_API_URL || 'http://localhost:3001';
    this.apiKey = apiKey || process.env.REACT_APP_CLINE_API_KEY || 'development-key';
    this.requestId = 0;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const requestId = ++this.requestId;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'X-Request-ID': requestId,
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log(`🔵 Advanced API Request [${requestId}]: ${options.method || 'GET'} ${url}`);
      const response = await fetch(url, config);
      
      if (!response.ok) {
        let errorDetails;
        try {
          errorDetails = await response.json();
        } catch {
          errorDetails = { 
            error: `HTTP ${response.status}: ${response.statusText}`,
            status: response.status
          };
        }
        
        console.error(`❌ Advanced API Error [${requestId}]:`, errorDetails);
        throw new Error(`Advanced API Error: ${JSON.stringify(errorDetails)}`);
      }
      
      const result = await response.json();
      console.log(`✅ Advanced API Success [${requestId}]:`, result.success ? 'OK' : result);
      return result;
    } catch (error) {
      console.error(`❌ Advanced API request failed [${requestId}] for ${endpoint}:`, error);
      throw error;
    }
  }

  // Health and capability checks
  async checkHealth() {
    return this.request('/health');
  }

  async getCapabilities() {
    return this.request('/api/capabilities');
  }

  // Advanced session management
  async createAdvancedSession(config = {}) {
    return this.request('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({
        startMode: 'ACT',
        qualityLevel: 'advanced',
        enableGit: true,
        enableValidation: true,
        enableStreaming: true,
        ...config
      })
    });
  }

  async getSession(sessionId) {
    return this.request(`/api/sessions/${sessionId}`);
  }

  async listSessions() {
    return this.request('/api/sessions');
  }

  async deleteSession(sessionId) {
    return this.request(`/api/sessions/${sessionId}`, {
      method: 'DELETE'
    });
  }

  // Advanced message processing
  async processMessage(sessionId, message, options = {}) {
    return this.request(`/api/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ 
        message, 
        options: {
          streaming: true,
          realTimeValidation: true,
          qualityLevel: 'advanced',
          ...options
        }
      })
    });
  }

  // Mode switching (PLAN <-> ACT)
  async switchMode(sessionId, mode) {
    return this.request(`/api/sessions/${sessionId}/mode`, {
      method: 'POST',
      body: JSON.stringify({ mode })
    });
  }

  // Quality testing
  async testQuality(description, quality = 'advanced') {
    return this.request('/api/test/quality', {
      method: 'POST',
      body: JSON.stringify({ description, quality })
    });
  }

  // Streaming support
  async startStream(sessionId, streamConfig) {
    return this.request(`/api/sessions/${sessionId}/stream`, {
      method: 'POST',
      body: JSON.stringify({
        compression: true,
        realTimeValidation: true,
        batchSize: 5,
        ...streamConfig
      })
    });
  }

  // Server-Sent Events for HTTP streaming fallback
  createEventSource(sessionId, options = {}) {
    const url = `${this.baseURL}/api/sessions/${sessionId}/events`;
    const eventSource = new EventSource(url);
    
    eventSource.addEventListener('stream_chunk', (event) => {
      const data = JSON.parse(event.data);
      options.onChunk?.(data);
    });
    
    eventSource.addEventListener('stream_complete', (event) => {
      const data = JSON.parse(event.data);
      options.onComplete?.(data);
      eventSource.close();
    });
    
    eventSource.addEventListener('error', (event) => {
      console.error('SSE Error:', event);
      options.onError?.(event);
      eventSource.close();
    });
    
    return eventSource;
  }

  // File transfer support for large files
  async uploadFile(sessionId, file, options = {}) {
    const chunkSize = options.chunkSize || 1024 * 1024; // 1MB chunks
    const totalChunks = Math.ceil(file.size / chunkSize);
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Initialize upload
    await this.request(`/api/sessions/${sessionId}/upload`, {
      method: 'POST',
      body: JSON.stringify({
        uploadId,
        fileName: file.name,
        fileSize: file.size,
        totalChunks,
        chunkSize
      })
    });
    
    // Upload chunks
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);
      
      const formData = new FormData();
      formData.append('uploadId', uploadId);
      formData.append('chunkIndex', i.toString());
      formData.append('chunk', chunk);
      formData.append('isLast', (i === totalChunks - 1).toString());
      
      await this.request(`/api/sessions/${sessionId}/upload/chunk`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          // Remove Content-Type to let browser set it with boundary
        },
        body: formData
      });
      
      // Report progress
      options.onProgress?.({ 
        uploaded: i + 1, 
        total: totalChunks, 
        progress: (i + 1) / totalChunks 
      });
    }
    
    return { uploadId, fileName: file.name, fileSize: file.size };
  }

  // Advanced error handling with retry logic
  async requestWithRetry(endpoint, options = {}, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.request(endpoint, options);
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ Request attempt ${attempt}/${maxRetries} failed:`, error.message);
        
        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  // Comprehensive connection test
  async testConnection() {
    try {
      const [health, capabilities] = await Promise.all([
        this.checkHealth(),
        this.getCapabilities()
      ]);
      
      return {
        success: true,
        connected: true,
        health,
        capabilities,
        features: {
          advancedPrompts: true,
          planActModes: true,
          gitAwareness: true,
          qualityGeneration: true,
          streaming: true,
          fileTransfer: true
        }
      };
    } catch (error) {
      return {
        success: false,
        connected: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Batch request support for performance
  async batchRequest(requests) {
    const promises = requests.map(({ endpoint, options }) => 
      this.request(endpoint, options).catch(error => ({ error: error.message }))
    );
    
    return Promise.all(promises);
  }

  // WebSocket URL helper
  getWebSocketURL() {
    return this.baseURL.replace('http://', 'ws://').replace('https://', 'wss://') + '/ws';
  }

  // Request caching for performance
  enableCaching(ttl = 300000) { // 5 minutes default
    this.cache = new Map();
    this.cacheTTL = ttl;
    
    const originalRequest = this.request.bind(this);
    this.request = async (endpoint, options = {}) => {
      // Only cache GET requests
      if (!options.method || options.method === 'GET') {
        const cacheKey = `${endpoint}_${JSON.stringify(options)}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp) < this.cacheTTL) {
          console.log(`💾 Cache hit for ${endpoint}`);
          return cached.data;
        }
        
        const result = await originalRequest(endpoint, options);
        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });
        
        return result;
      }
      
      return originalRequest(endpoint, options);
    };
  }

  // Clear cache
  clearCache() {
    if (this.cache) {
      this.cache.clear();
    }
  }

  // ============ ENHANCED API ENDPOINTS ============

  /**
   * Advanced code generation with enhanced system prompts
   */
  async advancedGenerate(request) {
    return this.request('/api/agent/advanced-generate', {
      method: 'POST',
      body: JSON.stringify({
        description: request.description,
        projectType: request.projectType || 'web-application',
        framework: request.framework || 'react',
        features: request.features || [],
        qualityLevel: request.qualityLevel || 'advanced',
        streaming: request.streaming || false,
        fileSpecs: request.fileSpecs || [],
        contextAware: request.contextAware !== false
      })
    });
  }

  /**
   * Streaming generation with real-time updates
   */
  async streamGenerate(request, callbacks = {}) {
    const { onChunk, onComplete, onError } = callbacks;
    
    try {
      const response = await fetch(`${this.baseURL}/api/agent/stream-generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({
          description: request.description,
          fileSpecs: request.fileSpecs || [],
          qualityLevel: request.qualityLevel || 'advanced',
          realTimeValidation: request.realTimeValidation !== false,
          autoCorrection: request.autoCorrection !== false
        })
      });

      if (!response.ok) {
        throw new Error(`Stream generation failed: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'started') {
                console.log('🌊 Stream started:', data.streamId);
              } else if (data.type === 'complete') {
                onComplete?.(data.result);
                return data.result;
              } else if (data.type === 'error') {
                onError?.(new Error(data.error));
                throw new Error(data.error);
              } else {
                onChunk?.(data);
              }
            } catch (parseError) {
              console.warn('Failed to parse stream data:', line);
            }
          }
        }
      }
      
    } catch (error) {
      console.error('Stream generation failed:', error);
      onError?.(error);
      throw error;
    }
  }

  /**
   * Bulk file generation
   */
  async bulkFileGenerate(request) {
    return this.request('/api/agent/bulk-file-generate', {
      method: 'POST',
      body: JSON.stringify({
        files: request.files || [],
        projectContext: request.projectContext || {},
        generateDependencies: request.generateDependencies !== false,
        qualityLevel: request.qualityLevel || 'advanced',
        streaming: request.streaming || false
      })
    });
  }

  /**
   * Enhance system prompt
   */
  async enhancePrompt(request) {
    return this.request('/api/agent/enhance-prompt', {
      method: 'POST',
      body: JSON.stringify({
        basePrompt: request.basePrompt || '',
        context: request.context || {},
        qualityLevel: request.qualityLevel || 'advanced',
        projectType: request.projectType || 'web-application',
        features: request.features || []
      })
    });
  }

  /**
   * Get agent service stats
   */
  async getAgentStats() {
    return this.request('/api/agent/stats');
  }

  /**
   * Test advanced features
   */
  async testAdvancedFeatures() {
    try {
      const [health, stats] = await Promise.all([
        this.request('/health'),
        this.request('/api/agent/health')
      ]);
      
      return {
        success: true,
        health,
        agentStats: stats,
        features: {
          advancedGenerate: true,
          streamGenerate: true,
          bulkFileGenerate: true,
          enhancePrompt: true,
          realTimeValidation: true,
          autoCorrection: true
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Quick generate method for simple use cases
   */
  async quickGenerate(description, options = {}) {
    return this.advancedGenerate({
      description,
      qualityLevel: options.quality || 'advanced',
      framework: options.framework || 'react',
      features: options.features || ['responsive-design', 'animations', 'accessibility'],
      streaming: options.streaming || false
    });
  }

  // Get service statistics
  getStats() {
    return {
      baseURL: this.baseURL,
      requestCount: this.requestId,
      cacheEnabled: !!this.cache,
      cacheSize: this.cache ? this.cache.size : 0,
      features: {
        advancedSessions: true,
        streaming: true,
        fileTransfer: true,
        qualityTesting: true,
        planActModes: true,
        caching: !!this.cache,
        // Enhanced features
        advancedGenerate: true,
        streamGenerate: true,
        bulkFileGenerate: true,
        enhancePrompt: true,
        realTimeValidation: true,
        autoCorrection: true
      }
    };
  }
}

export default AdvancedClineAPIService;