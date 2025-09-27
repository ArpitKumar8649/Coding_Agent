/**
 * Direct WebSocket Service for Cline API
 * Connects directly to Cline API WebSocket (port 3000)
 */

class DirectWebSocketService {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3; // Reduced for faster fallback
    this.reconnectDelay = 1000;
    this.projectId = null;
    this.isConnected = false;
    this.messageQueue = [];
    this.httpFallbackMode = false;
    this.connectionTimeout = 10000; // 10 second timeout
  }

  connect(url = null) {
    const wsUrl = url || process.env.REACT_APP_CLINE_WS_URL || 'ws://localhost:3000/ws';
    console.log(`🔌 Attempting WebSocket connection to: ${wsUrl}`);
    
    return new Promise((resolve, reject) => {
      // Set connection timeout
      const connectionTimeout = setTimeout(() => {
        console.warn('⚠️ WebSocket connection timeout, enabling HTTP fallback mode');
        this.httpFallbackMode = true;
        this.emit('connected'); // Emit connected for HTTP fallback
        resolve();
      }, this.connectionTimeout);

      try {
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
          clearTimeout(connectionTimeout);
          console.log('✅ WebSocket connected to Cline API');
          this.isConnected = true;
          this.httpFallbackMode = false;
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
          console.log(`❌ WebSocket connection closed: ${event.code} - ${event.reason || 'No reason'}`);
          this.isConnected = false;
          this.emit('disconnected', { 
            code: event.code, 
            reason: event.reason,
            wasClean: event.wasClean,
            url: wsUrl
          });
          
          // Auto-reconnect if not a manual close
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            console.log(`🔄 Scheduling reconnect attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts}`);
            setTimeout(() => {
              this.reconnect();
            }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts));
          } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ Max reconnection attempts reached');
            this.emit('error', new Error(`Failed to connect to WebSocket after ${this.maxReconnectAttempts} attempts. URL: ${wsUrl}`));
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          console.error(`WebSocket URL: ${wsUrl}`);
          this.emit('error', { 
            error, 
            url: wsUrl,
            message: `WebSocket connection failed to ${wsUrl}. This could be due to: 1) WebSocket not supported on server 2) CORS issues 3) Network connectivity` 
          });
          reject(error);
        };

      } catch (error) {
        console.error('❌ Failed to create WebSocket:', error);
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