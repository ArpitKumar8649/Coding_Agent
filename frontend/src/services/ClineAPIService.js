class ClineAPIService {
  constructor(baseURL = 'http://localhost:8001') {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Health check
  async checkHealth() {
    return this.request('/health');
  }

  // Session Management
  async createChatSession(config = {}) {
    return this.request('/api/chat/sessions', {
      method: 'POST',
      body: JSON.stringify({
        mode: 'ACT',
        qualityLevel: 'advanced',
        ...config
      })
    });
  }

  async getChatSession(sessionId) {
    return this.request(`/api/chat/sessions/${sessionId}`);
  }

  async listChatSessions() {
    return this.request('/api/chat/sessions');
  }

  // HTTP Message sending (alternative to WebSocket)
  async sendMessage(sessionId, message, mode = 'ACT') {
    return this.request(`/api/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message, mode })
    });
  }

  // Mode switching via HTTP
  async switchMode(sessionId, mode) {
    return this.request(`/api/chat/sessions/${sessionId}/mode`, {
      method: 'POST',
      body: JSON.stringify({ mode })
    });
  }

  // Test connection
  async testConnection() {
    try {
      const health = await this.checkHealth();
      return {
        success: true,
        connected: true,
        ...health
      };
    } catch (error) {
      return {
        success: false,
        connected: false,
        error: error.message
      };
    }
  }
}

export default ClineAPIService;