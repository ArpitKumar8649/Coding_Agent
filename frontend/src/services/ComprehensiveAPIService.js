/**
 * Comprehensive API Service
 * Integrates all advanced Cline API endpoints with proper error handling
 */

class ComprehensiveAPIService {
  constructor() {
    this.backendURL = process.env.REACT_APP_BACKEND_URL;
    this.clineAPIURL = process.env.REACT_APP_CLINE_API_URL;
    this.apiKey = process.env.REACT_APP_CLINE_API_KEY || '38a4fe1bddaa7d54a6e97b1da38343807a113da35601df4a3cfae3392f8aeed8';
    this.requestId = 0;
  }

  async request(endpoint, options = {}, useBackend = false) {
    const baseURL = useBackend ? this.backendURL : this.clineAPIURL;
    const url = `${baseURL}${endpoint}`;
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
      console.log(`🚀 API Request [${requestId}]: ${options.method || 'GET'} ${url}`);
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
        
        console.error(`❌ API Error [${requestId}]:`, errorDetails);
        throw new Error(`API Error: ${JSON.stringify(errorDetails)}`);
      }
      
      const result = await response.json();
      console.log(`✅ API Success [${requestId}]:`, result.success ? 'OK' : 'Response received');
      return result;
    } catch (error) {
      console.error(`❌ API request failed [${requestId}] for ${endpoint}:`, error);
      throw error;
    }
  }

  // ============ BACKEND ENDPOINTS (FastAPI) ============

  // Health Check
  async getBackendHealth() {
    return this.request('/health', {}, true);
  }

  // Chat Sessions (Backend)
  async createChatSession(config = {}) {
    return this.request('/api/chat/sessions', {
      method: 'POST',
      body: JSON.stringify({
        mode: 'ACT',
        qualityLevel: 'advanced',
        ...config
      })
    }, true);
  }

  async getChatSession(sessionId) {
    return this.request(`/api/chat/sessions/${sessionId}`, {}, true);
  }

  async listChatSessions() {
    return this.request('/api/chat/sessions', {}, true);
  }

  async sendChatMessage(sessionId, message, mode = 'ACT') {
    return this.request(`/api/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message, mode })
    }, true);
  }

  async switchChatMode(sessionId, mode) {
    return this.request(`/api/chat/sessions/${sessionId}/mode`, {
      method: 'POST',
      body: JSON.stringify({ mode })
    }, true);
  }

  // ============ CLINE API ENDPOINTS (Node.js) ============

  // Health & Capabilities
  async getClineHealth() {
    return this.request('/health');
  }

  async getCapabilities() {
    return this.request('/api/capabilities');
  }

  // Agent Project Management
  async createProject(projectData) {
    return this.request('/api/agent/create-project', {
      method: 'POST',
      body: JSON.stringify({
        description: projectData.description,
        workspace: projectData.workspace,
        preferences: projectData.preferences || {},
        userId: projectData.userId || 'user',
        streaming: projectData.streaming || false
      })
    });
  }

  async continueProject(projectData) {
    return this.request('/api/agent/continue-project', {
      method: 'POST',
      body: JSON.stringify({
        projectId: projectData.projectId,
        workspace: projectData.workspace,
        instruction: projectData.instruction,
        userId: projectData.userId || 'user',
        streaming: projectData.streaming || false
      })
    });
  }

  async getProjectStatus(projectId, workspace) {
    const params = workspace ? `?workspace=${encodeURIComponent(workspace)}` : '';
    return this.request(`/api/agent/projects/${projectId}/status${params}`);
  }

  async getProjectFiles(projectId, workspace, filePath) {
    const params = new URLSearchParams();
    if (workspace) params.append('workspace', workspace);
    if (filePath) params.append('filePath', filePath);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/api/agent/projects/${projectId}/files${queryString}`);
  }

  async listProjects(userId) {
    const params = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    return this.request(`/api/agent/projects${params}`);
  }

  async cancelProject(projectId, workspace) {
    return this.request(`/api/agent/projects/${projectId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ workspace })
    });
  }

  async cleanupProjects(olderThanHours = 24) {
    return this.request('/api/agent/cleanup', {
      method: 'POST',
      body: JSON.stringify({ olderThanHours })
    });
  }

  // Advanced Code Generation
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

  async streamGenerate(request, callbacks = {}) {
    const { onChunk, onComplete, onError } = callbacks;
    
    try {
      const response = await fetch(`${this.clineAPIURL}/api/agent/stream-generate`, {
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
        buffer = lines.pop();
        
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

  async validateRequest(request) {
    return this.request('/api/agent/validate-request', {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }

  // Enhanced Sessions
  async createEnhancedSession(config = {}) {
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

  async getEnhancedSession(sessionId) {
    return this.request(`/api/sessions/${sessionId}`);
  }

  async listEnhancedSessions() {
    return this.request('/api/sessions');
  }

  async deleteEnhancedSession(sessionId) {
    return this.request(`/api/sessions/${sessionId}`, {
      method: 'DELETE'
    });
  }

  async processEnhancedMessage(sessionId, message, options = {}) {
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

  async switchEnhancedMode(sessionId, mode) {
    return this.request(`/api/sessions/${sessionId}/mode`, {
      method: 'POST',
      body: JSON.stringify({ mode })
    });
  }

  async testQuality(description, quality = 'advanced') {
    return this.request('/api/test/quality', {
      method: 'POST',
      body: JSON.stringify({ description, quality })
    });
  }

  // Statistics & Monitoring
  async getAgentStats() {
    return this.request('/api/agent/stats');
  }

  async getAgentHealth() {
    return this.request('/api/agent/health');
  }

  // Comprehensive System Check
  async runSystemCheck() {
    try {
      const [backendHealth, clineHealth, capabilities, agentStats] = await Promise.allSettled([
        this.getBackendHealth(),
        this.getClineHealth(),
        this.getCapabilities(),
        this.getAgentStats()
      ]);

      return {
        success: true,
        timestamp: new Date().toISOString(),
        services: {
          backend: {
            status: backendHealth.status === 'fulfilled' ? 'healthy' : 'error',
            data: backendHealth.status === 'fulfilled' ? backendHealth.value : null,
            error: backendHealth.status === 'rejected' ? backendHealth.reason?.message : null
          },
          clineAPI: {
            status: clineHealth.status === 'fulfilled' ? 'healthy' : 'error',
            data: clineHealth.status === 'fulfilled' ? clineHealth.value : null,
            error: clineHealth.status === 'rejected' ? clineHealth.reason?.message : null
          },
          capabilities: {
            status: capabilities.status === 'fulfilled' ? 'available' : 'error',
            data: capabilities.status === 'fulfilled' ? capabilities.value : null,
            error: capabilities.status === 'rejected' ? capabilities.reason?.message : null
          },
          agentStats: {
            status: agentStats.status === 'fulfilled' ? 'available' : 'error',
            data: agentStats.status === 'fulfilled' ? agentStats.value : null,
            error: agentStats.status === 'rejected' ? agentStats.reason?.message : null
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // WebSocket Connection Helper
  createWebSocket(sessionId, callbacks = {}) {
    const wsURL = process.env.REACT_APP_CLINE_WS_URL || this.clineAPIURL.replace('http', 'ws') + '/ws';
    const ws = new WebSocket(wsURL);
    
    ws.onopen = () => {
      console.log('🔌 WebSocket connected');
      ws.send(JSON.stringify({
        type: 'join_session',
        sessionId: sessionId,
        apiKey: this.apiKey
      }));
      callbacks.onOpen?.();
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        callbacks.onMessage?.(data);
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };
    
    ws.onclose = () => {
      console.log('🔌 WebSocket disconnected');
      callbacks.onClose?.();
    };
    
    ws.onerror = (error) => {
      console.error('🔌 WebSocket error:', error);
      callbacks.onError?.(error);
    };
    
    return ws;
  }

  // Utility Methods
  getServiceInfo() {
    return {
      backendURL: this.backendURL,
      clineAPIURL: this.clineAPIURL,
      hasAPIKey: !!this.apiKey,
      requestCount: this.requestId,
      features: {
        chatSessions: true,
        projectManagement: true,
        advancedGeneration: true,
        streamingGeneration: true,
        bulkFileGeneration: true,
        enhancedSessions: true,
        qualityTesting: true,
        systemMonitoring: true,
        webSocketSupport: true
      }
    };
  }
}

export default ComprehensiveAPIService;