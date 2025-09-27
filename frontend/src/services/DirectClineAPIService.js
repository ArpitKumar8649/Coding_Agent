/**
 * Direct Cline API Service
 * Connects directly to the Cline API service (port 3000) instead of the FastAPI backend
 */

class DirectClineAPIService {
  constructor(baseURL = null, apiKey = null) {
    this.baseURL = baseURL || process.env.REACT_APP_CLINE_API_URL || 'http://localhost:3000';
    this.apiKey = apiKey || process.env.REACT_APP_CLINE_API_KEY || 'development-key';
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log(`🔵 API Request: ${options.method || 'GET'} ${url}`);
      const response = await fetch(url, config);
      
      if (!response.ok) {
        let errorDetails;
        try {
          errorDetails = await response.json();
        } catch {
          errorDetails = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        
        console.error(`❌ API Error Response:`, errorDetails);
        throw new Error(`API Error: ${JSON.stringify(errorDetails)}`);
      }
      
      const result = await response.json();
      console.log(`✅ API Success:`, result);
      return result;
    } catch (error) {
      console.error(`❌ API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Health check
  async checkHealth() {
    return this.request('/health');
  }

  // Agent health check
  async checkAgentHealth() {
    return this.request('/api/agent/health');
  }

  // Create a new project (chat session)
  async createProject(description, preferences = {}) {
    return this.request('/api/agent/create-project', {
      method: 'POST',
      body: JSON.stringify({
        description,
        preferences,
        streaming: true,
        userId: 'chat-user'
      })
    });
  }

  // Continue project with new instruction
  async continueProject(projectId, instruction) {
    return this.request('/api/agent/continue-project', {
      method: 'POST',
      body: JSON.stringify({
        projectId,
        instruction,
        streaming: true,
        userId: 'chat-user'
      })
    });
  }

  // Get project status
  async getProjectStatus(projectId) {
    return this.request(`/api/agent/projects/${projectId}/status`);
  }

  // Get project files
  async getProjectFiles(projectId, filePath = null) {
    const params = filePath ? `?filePath=${encodeURIComponent(filePath)}` : '';
    return this.request(`/api/agent/projects/${projectId}/files${params}`);
  }

  // List active projects
  async listProjects() {
    return this.request('/api/agent/projects');
  }

  // Cancel project
  async cancelProject(projectId) {
    return this.request(`/api/agent/projects/${projectId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({})
    });
  }

  // Get service stats
  async getStats() {
    return this.request('/api/agent/stats');
  }

  // Test connection
  async testConnection() {
    try {
      const health = await this.checkHealth();
      const agentHealth = await this.checkAgentHealth();
      return {
        success: true,
        connected: true,
        health,
        agentHealth
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

export default DirectClineAPIService;