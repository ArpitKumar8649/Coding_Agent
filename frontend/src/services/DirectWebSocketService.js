/**
 * Direct WebSocket Service for Cline API
 * Connects directly to Cline API WebSocket (port 3000)
 */

class DirectWebSocketService {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.projectId = null;
    this.isConnected = false;
    this.messageQueue = [];
  }

  connect(url = null) {
    const wsUrl = url || process.env.REACT_APP_CLINE_WS_URL || 'ws://localhost:3000/ws';
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
          console.log('🔌 WebSocket connected to Cline API');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.emit('connected');
          
          // Send queued messages
          this.processMessageQueue();
          
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('📨 WebSocket message received:', data.type || data.event);
            
            // Handle different message types
            this.handleMessage(data);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('🔌 WebSocket connection closed:', event.code);
          this.isConnected = false;
          this.emit('disconnected', event);
          
          // Auto-reconnect if not a manual close
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            setTimeout(() => {
              this.reconnect();
            }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts));
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.emit('error', error);
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  handleMessage(data) {
    const messageType = data.type || data.event;
    
    switch (messageType) {
      case 'project_created':
        this.emit('project_created', data);
        break;
      case 'project_progress':
        this.emit('project_progress', data);
        break;
      case 'agent_thinking':
        this.emit('agent_thinking', data);
        break;
      case 'tool_execution':
        this.emit('tool_execution', data);
        break;
      case 'file_created':
      case 'file_updated':
        this.emit('file_change', data);
        break;
      case 'project_completed':
        this.emit('project_completed', data);
        break;
      case 'error':
        this.emit('error', data);
        break;
      case 'stream_chunk':
        this.emit('stream_chunk', data);
        break;
      default:
        this.emit(messageType, data);
        break;
    }
  }

  reconnect() {
    this.reconnectAttempts++;
    console.log(`🔄 Reconnecting to WebSocket (attempt ${this.reconnectAttempts})`);
    this.connect();
  }

  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
      this.isConnected = false;
    }
  }

  send(type, data = {}) {
    const message = {
      type,
      timestamp: Date.now(),
      ...data
    };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      return true;
    } else {
      // Queue message for when connection is established
      this.messageQueue.push(message);
      console.warn('WebSocket not connected, message queued');
      return false;
    }
  }

  processMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.ws.send(JSON.stringify(message));
    }
  }

  // Subscribe to project updates
  subscribeToProject(projectId) {
    this.projectId = projectId;
    return this.send('subscribe_project', { projectId });
  }

  // Unsubscribe from project
  unsubscribeFromProject(projectId) {
    return this.send('unsubscribe_project', { projectId });
  }

  // Send chat message (create or continue project)
  sendChatMessage(message, projectId = null) {
    if (projectId) {
      return this.send('continue_project', {
        projectId,
        instruction: message
      });
    } else {
      return this.send('create_project', {
        description: message
      });
    }
  }

  // Cancel project
  cancelProject(projectId) {
    return this.send('cancel_project', { projectId });
  }

  // Event listener management
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WebSocket event listener for ${event}:`, error);
        }
      });
    }
  }

  // Get connection status
  getStatus() {
    return {
      isConnected: this.isConnected,
      projectId: this.projectId,
      reconnectAttempts: this.reconnectAttempts,
      readyState: this.ws ? this.ws.readyState : WebSocket.CLOSED,
      queuedMessages: this.messageQueue.length
    };
  }
}

export default DirectWebSocketService;