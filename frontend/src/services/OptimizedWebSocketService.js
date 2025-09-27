/**
 * Optimized WebSocket Service for Enhanced Cline API
 * Supports streaming, file transfer, collaboration, and performance optimizations
 */

class OptimizedWebSocketService {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000;
    this.isConnected = false;
    this.messageQueue = [];
    this.httpFallbackMode = false;
    this.connectionTimeout = 15000; // 15 second timeout
    
    // Enhanced features
    this.compressionEnabled = true;
    this.batchingEnabled = true;
    this.fileTransferSupport = true;
    this.collaborationEnabled = true;
    
    // Performance tracking
    this.stats = {
      messagesSent: 0,
      messagesReceived: 0,
      bytesTransferred: 0,
      reconnections: 0,
      errors: 0
    };
    
    // Active streams and transfers
    this.activeStreams = new Map();
    this.fileTransfers = new Map();
    this.collaborationRooms = new Set();
  }

  async connect(url = null) {
    const wsUrl = url || process.env.REACT_APP_CLINE_WS_URL || 'ws://localhost:3000/ws';
    console.log(`🚀 Attempting optimized WebSocket connection to: ${wsUrl}`);
    
    return new Promise((resolve, reject) => {
      const connectionTimeout = setTimeout(() => {
        console.warn('⚠️ WebSocket connection timeout, enabling HTTP fallback mode');
        this.httpFallbackMode = true;
        this.emit('connected', { fallbackMode: true });
        resolve({ fallbackMode: true });
      }, this.connectionTimeout);

      try {
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
          clearTimeout(connectionTimeout);
          console.log('✅ Optimized WebSocket connected to Cline API');
          this.isConnected = true;
          this.httpFallbackMode = false;
          this.reconnectAttempts = 0;
          
          // Authenticate with enhanced features
          this.authenticate();
          
          this.emit('connected', { 
            fallbackMode: false,
            features: {
              streaming: true,
              fileTransfer: this.fileTransferSupport,
              collaboration: this.collaborationEnabled,
              compression: this.compressionEnabled
            }
          });
          
          // Send queued messages
          this.processMessageQueue();
          
          resolve({ fallbackMode: false });
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
          this.stats.messagesReceived++;
        };

        this.ws.onclose = (event) => {
          clearTimeout(connectionTimeout);
          console.log(`❌ WebSocket connection closed: ${event.code} - ${event.reason || 'No reason'}`);
          this.isConnected = false;
          
          if (!this.httpFallbackMode && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnect();
          } else if (!this.httpFallbackMode) {
            console.log('🔄 Enabling HTTP fallback mode after max reconnect attempts');
            this.httpFallbackMode = true;
            this.emit('connected', { fallbackMode: true });
          } else {
            this.emit('disconnected', { 
              code: event.code, 
              reason: event.reason,
              wasClean: event.wasClean,
              url: wsUrl
            });
          }
        };

        this.ws.onerror = (error) => {
          clearTimeout(connectionTimeout);
          console.error('❌ WebSocket error:', error);
          this.stats.errors++;
          
          if (!this.httpFallbackMode) {
            console.log('🔄 WebSocket failed, enabling HTTP fallback mode');
            this.httpFallbackMode = true;
            this.emit('connected', { fallbackMode: true });
            resolve({ fallbackMode: true });
          }
        };

      } catch (error) {
        console.error('❌ Failed to create WebSocket:', error);
        this.stats.errors++;
        reject(error);
      }
    });
  }

  /**
   * Enhanced authentication with feature negotiation
   */
  authenticate() {
    const apiKey = process.env.REACT_APP_CLINE_API_KEY || 'development-key';
    
    this.send({
      type: 'authenticate',
      apiKey,
      userId: this.getUserId(),
      features: {
        compression: this.compressionEnabled,
        fileTransfer: this.fileTransferSupport,
        collaboration: this.collaborationEnabled,
        batching: this.batchingEnabled
      }
    });
  }

  /**
   * Enhanced message handling with compression and batching support
   */
  handleMessage(data) {
    try {
      let message;
      
      // Handle compressed messages
      if (data instanceof ArrayBuffer || (data instanceof Uint8Array)) {
        // Decompress if needed (for future compression support)
        message = JSON.parse(new TextDecoder().decode(data));
      } else {
        message = JSON.parse(data);
      }
      
      const messageType = message.type;
      
      // Update stats
      if (typeof data === 'string') {
        this.stats.bytesTransferred += data.length;
      }
      
      switch (messageType) {
        case 'authenticated':
          this.handleAuthenticated(message);
          break;
          
        case 'batched_updates':
          this.handleBatchedUpdates(message);
          break;
          
        case 'stream_started':
          this.handleStreamStarted(message);
          break;
          
        case 'stream_update':
          this.handleStreamUpdate(message);
          break;
          
        case 'stream_complete':
          this.handleStreamComplete(message);
          break;
          
        case 'file_transfer_ready':
          this.handleFileTransferReady(message);
          break;
          
        case 'collaboration_joined':
          this.handleCollaborationJoined(message);
          break;
          
        case 'participant_joined':
        case 'participant_left':
          this.handleParticipantChange(message);
          break;
          
        // Legacy support
        case 'project_created':
        case 'project_progress':
        case 'agent_thinking':
        case 'tool_execution':
        case 'file_created':
        case 'file_updated':
        case 'project_completed':
        case 'error':
          this.emit(messageType, message);
          break;
          
        default:
          this.emit(messageType, message);
          break;
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
      this.stats.errors++;
    }
  }

  /**
   * Handle authentication response
   */
  handleAuthenticated(message) {
    if (message.success) {
      console.log('🔐 Authentication successful with enhanced features:', message.features);
      this.emit('authenticated', message);
    } else {
      console.error('🔐 Authentication failed:', message.message);
      this.emit('authentication_failed', message);
    }
  }

  /**
   * Handle batched updates for performance
   */
  handleBatchedUpdates(message) {
    const { streamId, chunks } = message;
    
    chunks.forEach(chunk => {
      this.emit('stream_chunk', {
        streamId,
        ...chunk
      });
    });
    
    this.emit('batch_processed', {
      streamId,
      chunkCount: chunks.length,
      timestamp: message.timestamp
    });
  }

  /**
   * Start optimized streaming
   */
  async startOptimizedStream(requestType, request, options = {}) {
    const streamId = this.generateStreamId();
    
    const streamConfig = {
      type: 'start_stream',
      streamId,
      requestType,
      request,
      compression: options.compression !== false,
      quality: options.quality || 'medium',
      batchSize: options.batchSize || 5,
      realTimeValidation: options.realTimeValidation !== false
    };
    
    this.activeStreams.set(streamId, {
      id: streamId,
      type: requestType,
      started: Date.now(),
      status: 'starting'
    });
    
    this.send(streamConfig);
    return streamId;
  }

  /**
   * Handle stream lifecycle events
   */
  handleStreamStarted(message) {
    const { streamId } = message;
    const stream = this.activeStreams.get(streamId);
    
    if (stream) {
      stream.status = 'active';
      stream.optimizations = message.optimizations;
    }
    
    this.emit('stream_started', message);
  }

  handleStreamUpdate(message) {
    this.emit('stream_update', message);
  }

  handleStreamComplete(message) {
    const { streamId } = message;
    this.activeStreams.delete(streamId);
    this.emit('stream_complete', message);
  }

  /**
   * File transfer support
   */
  async startFileTransfer(file, options = {}) {
    const transferId = this.generateTransferId();
    const chunkSize = options.chunkSize || 64 * 1024; // 64KB
    
    const transferConfig = {
      type: 'start_file_transfer',
      transferId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      chunkSize
    };
    
    this.fileTransfers.set(transferId, {
      file,
      chunkSize,
      totalChunks: Math.ceil(file.size / chunkSize),
      sentChunks: 0,
      status: 'preparing'
    });
    
    this.send(transferConfig);
    return transferId;
  }

  handleFileTransferReady(message) {
    const { transferId } = message;
    const transfer = this.fileTransfers.get(transferId);
    
    if (transfer) {
      transfer.status = 'active';
      this.startChunkedTransfer(transferId);
    }
    
    this.emit('file_transfer_ready', message);
  }

  async startChunkedTransfer(transferId) {
    const transfer = this.fileTransfers.get(transferId);
    if (!transfer) return;
    
    const { file, chunkSize } = transfer;
    
    for (let i = 0; i < transfer.totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);
      
      const reader = new FileReader();
      reader.onload = () => {
        this.send({
          type: 'file_chunk',
          transferId,
          chunkIndex: i,
          data: reader.result,
          isLast: i === transfer.totalChunks - 1
        });
        
        transfer.sentChunks++;
        this.emit('file_transfer_progress', {
          transferId,
          progress: transfer.sentChunks / transfer.totalChunks,
          sentChunks: transfer.sentChunks,
          totalChunks: transfer.totalChunks
        });
      };
      
      reader.readAsArrayBuffer(chunk);
      
      // Small delay to prevent overwhelming the connection
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  /**
   * Collaboration support
   */
  joinCollaboration(roomId, userInfo = {}) {
    const userId = this.getUserId();
    
    this.send({
      type: 'join_collaboration',
      roomId,
      userId,
      userInfo: {
        name: userInfo.name || 'Anonymous',
        avatar: userInfo.avatar,
        role: userInfo.role || 'participant',
        ...userInfo
      }
    });
    
    this.collaborationRooms.add(roomId);
  }

  handleCollaborationJoined(message) {
    this.emit('collaboration_joined', message);
  }

  handleParticipantChange(message) {
    this.emit('participant_change', message);
  }

  /**
   * Enhanced send method with fallback support
   */
  send(data) {
    const message = {
      timestamp: Date.now(),
      ...data
    };

    if (this.httpFallbackMode) {
      return this.sendHTTPFallback(data.type, data);
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        const serialized = JSON.stringify(message);
        this.ws.send(serialized);
        this.stats.messagesSent++;
        this.stats.bytesTransferred += serialized.length;
        return true;
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
        this.stats.errors++;
        return false;
      }
    } else {
      // Queue message for when connection is established
      this.messageQueue.push(message);
      console.warn('WebSocket not connected, message queued');
      return false;
    }
  }

  /**
   * HTTP fallback implementation
   */
  async sendHTTPFallback(type, data) {
    const apiService = window.__optimizedClineAPIService;
    if (!apiService) {
      console.error('No optimized API service available for HTTP fallback');
      return false;
    }

    try {
      switch (type) {
        case 'start_stream':
          const streamResult = await apiService.startStream(data.requestType, data.request);
          this.emit('stream_started', streamResult);
          return true;

        default:
          console.warn(`HTTP fallback not implemented for type: ${type}`);
          return false;
      }
    } catch (error) {
      console.error('HTTP fallback error:', error);
      this.emit('error', error);
      return false;
    }
  }

  /**
   * Reconnection logic
   */
  async attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    this.stats.reconnections++;
    
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
    console.log(`🔄 Reconnecting to WebSocket (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Process queued messages
   */
  processMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Utility methods
   */
  getUserId() {
    return localStorage.getItem('cline_user_id') || `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  }

  generateStreamId() {
    return `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateTransferId() {
    return `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Event listener management
   */
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

  /**
   * Get connection status and statistics
   */
  getStatus() {
    return {
      isConnected: this.isConnected || this.httpFallbackMode,
      httpFallbackMode: this.httpFallbackMode,
      reconnectAttempts: this.reconnectAttempts,
      readyState: this.ws ? this.ws.readyState : WebSocket.CLOSED,
      queuedMessages: this.messageQueue.length,
      stats: this.stats,
      activeStreams: this.activeStreams.size,
      fileTransfers: this.fileTransfers.size,
      collaborationRooms: this.collaborationRooms.size,
      features: {
        streaming: true,
        fileTransfer: this.fileTransferSupport,
        collaboration: this.collaborationEnabled,
        compression: this.compressionEnabled,
        batching: this.batchingEnabled
      }
    };
  }

  /**
   * Cleanup and disconnect
   */
  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
      this.isConnected = false;
    }
    
    // Clear all active streams and transfers
    this.activeStreams.clear();
    this.fileTransfers.clear();
    this.collaborationRooms.clear();
  }

  // Legacy compatibility methods
  subscribeToProject(projectId) {
    return this.send({ type: 'subscribe_project', projectId });
  }

  sendChatMessage(message, projectId = null) {
    if (projectId) {
      return this.send({ type: 'continue_project', projectId, instruction: message });
    } else {
      return this.send({ type: 'create_project', description: message });
    }
  }

  cancelProject(projectId) {
    return this.send({ type: 'cancel_project', projectId });
  }
}

export default OptimizedWebSocketService;