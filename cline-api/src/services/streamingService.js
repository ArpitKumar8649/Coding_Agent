const WebSocket = require('ws');
const { EventEmitter } = require('events');

class StreamingService extends EventEmitter {
  constructor(server) {
    super();
    this.connections = new Map();
    this.activeStreams = new Map();
    
    // Initialize WebSocket server
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws',
      verifyClient: (info) => {
        // Add authentication logic here if needed
        return true;
      }
    });

    this.wss.on('connection', (ws, request) => {
      this.handleConnection(ws, request);
    });

    console.log('🔌 Streaming service initialized (WebSocket + SSE)');
  }

  /**
   * Handle new WebSocket connection
   */
  handleConnection(ws, request) {
    const connectionId = this.generateConnectionId();
    
    const connection = {
      id: connectionId,
      ws,
      ip: request.socket.remoteAddress,
      userAgent: request.headers['user-agent'],
      connected: new Date().toISOString(),
      lastActivity: new Date(),
      activeStreams: new Set(),
      authenticated: false
    };

    this.connections.set(connectionId, connection);

    ws.on('message', (data) => {
      this.handleMessage(connectionId, data);
    });

    ws.on('close', () => {
      this.handleDisconnect(connectionId);
    });

    ws.on('error', (error) => {
      console.error(`WebSocket error for ${connectionId}:`, error);
      this.handleDisconnect(connectionId);
    });

    // Send connection established message
    this.sendToConnection(connectionId, {
      type: 'connection_established',
      connectionId,
      timestamp: new Date().toISOString()
    });

    console.log(`🔗 WebSocket connection established: ${connectionId}`);
  }

  /**
   * Handle WebSocket message
   */
  async handleMessage(connectionId, data) {
    try {
      const connection = this.connections.get(connectionId);
      if (!connection) return;

      connection.lastActivity = new Date();

      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'authenticate':
          await this.handleAuthentication(connectionId, message);
          break;
          
        case 'start_stream':
          await this.startStream(connectionId, message);
          break;
          
        case 'stop_stream':
          await this.stopStream(connectionId, message.streamId);
          break;
          
        default:
          this.sendToConnection(connectionId, {
            type: 'error',
            message: `Unknown message type: ${message.type}`
          });
      }
    } catch (error) {
      console.error(`Message handling error for ${connectionId}:`, error);
      this.sendToConnection(connectionId, {
        type: 'error',
        message: 'Invalid message format'
      });
    }
  }

  /**
   * Handle authentication
   */
  async handleAuthentication(connectionId, message) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    // Verify API key (you can enhance this with more robust auth)
    const apiKey = message.apiKey;
    const validApiKey = process.env.API_KEY;
    
    if (apiKey === validApiKey) {
      connection.authenticated = true;
      connection.userId = message.userId || 'anonymous';
      
      this.sendToConnection(connectionId, {
        type: 'authenticated',
        success: true,
        message: 'Authentication successful'
      });
    } else {
      this.sendToConnection(connectionId, {
        type: 'authentication_failed',
        success: false,
        message: 'Invalid API key'
      });
    }
  }

  /**
   * Start streaming a request
   */
  async startStream(connectionId, message) {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.authenticated) {
      this.sendToConnection(connectionId, {
        type: 'error',
        message: 'Not authenticated'
      });
      return;
    }

    const streamId = this.generateStreamId();
    
    const stream = {
      id: streamId,
      connectionId,
      type: message.requestType || 'generate',
      request: message.request,
      started: new Date().toISOString(),
      status: 'active'
    };

    this.activeStreams.set(streamId, stream);
    connection.activeStreams.add(streamId);

    // Send stream started confirmation
    this.sendToConnection(connectionId, {
      type: 'stream_started',
      streamId,
      requestType: stream.type,
      timestamp: stream.started
    });

    // Emit event for processing
    this.emit('stream_request', {
      streamId,
      connectionId,
      type: stream.type,
      request: message.request,
      callback: (data) => this.sendStreamUpdate(streamId, data)
    });
  }

  /**
   * Send stream update
   */
  sendStreamUpdate(streamId, data) {
    const stream = this.activeStreams.get(streamId);
    if (!stream) return;

    const connection = this.connections.get(stream.connectionId);
    if (!connection || connection.ws.readyState !== WebSocket.OPEN) {
      this.stopStream(stream.connectionId, streamId);
      return;
    }

    this.sendToConnection(stream.connectionId, {
      type: 'stream_update',
      streamId,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Complete stream
   */
  completeStream(streamId, result) {
    const stream = this.activeStreams.get(streamId);
    if (!stream) return;

    stream.status = 'completed';
    stream.completed = new Date().toISOString();
    stream.result = result;

    this.sendStreamUpdate(streamId, {
      type: 'completed',
      result,
      duration: new Date() - new Date(stream.started)
    });

    // Clean up after delay
    setTimeout(() => {
      this.cleanupStream(streamId);
    }, 30000); // 30 seconds
  }

  /**
   * Handle stream error
   */
  errorStream(streamId, error) {
    const stream = this.activeStreams.get(streamId);
    if (!stream) return;

    stream.status = 'error';
    stream.error = error;
    stream.completed = new Date().toISOString();

    this.sendStreamUpdate(streamId, {
      type: 'error',
      error: {
        message: error.message,
        code: error.code
      }
    });

    this.cleanupStream(streamId);
  }

  /**
   * Stop stream
   */
  async stopStream(connectionId, streamId) {
    const stream = this.activeStreams.get(streamId);
    if (!stream || stream.connectionId !== connectionId) return;

    stream.status = 'stopped';
    stream.stopped = new Date().toISOString();

    this.sendToConnection(connectionId, {
      type: 'stream_stopped',
      streamId,
      timestamp: stream.stopped
    });

    this.cleanupStream(streamId);
  }

  /**
   * Clean up stream
   */
  cleanupStream(streamId) {
    const stream = this.activeStreams.get(streamId);
    if (!stream) return;

    const connection = this.connections.get(stream.connectionId);
    if (connection) {
      connection.activeStreams.delete(streamId);
    }

    this.activeStreams.delete(streamId);
  }

  /**
   * Handle disconnect
   */
  handleDisconnect(connectionId) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    // Stop all active streams for this connection
    for (const streamId of connection.activeStreams) {
      this.cleanupStream(streamId);
    }

    this.connections.delete(connectionId);
    console.log(`🔌 WebSocket disconnected: ${connectionId}`);
  }

  /**
   * Send message to specific connection
   */
  sendToConnection(connectionId, message) {
    const connection = this.connections.get(connectionId);
    if (!connection || connection.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      connection.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error(`Failed to send to ${connectionId}:`, error);
      return false;
    }
  }

  /**
   * Server-Sent Events handler
   */
  handleSSE(req, res, streamId) {
    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    const connectionId = this.generateConnectionId();
    
    // Create virtual connection for SSE
    const connection = {
      id: connectionId,
      type: 'sse',
      res,
      streamId,
      connected: new Date().toISOString(),
      lastActivity: new Date()
    };

    this.connections.set(connectionId, connection);

    // Send initial connection message
    this.sendSSEMessage(res, 'connected', {
      connectionId,
      streamId,
      timestamp: new Date().toISOString()
    });

    // Handle client disconnect
    req.on('close', () => {
      this.connections.delete(connectionId);
      console.log(`📡 SSE disconnected: ${connectionId}`);
    });

    return connectionId;
  }

  /**
   * Send SSE message
   */
  sendSSEMessage(res, type, data) {
    try {
      const message = {
        type,
        data,
        timestamp: new Date().toISOString()
      };
      
      res.write(`data: ${JSON.stringify(message)}\n\n`);
      return true;
    } catch (error) {
      console.error('SSE send error:', error);
      return false;
    }
  }

  /**
   * Send update to SSE connection by streamId
   */
  sendSSEUpdate(streamId, type, data) {
    for (const [connectionId, connection] of this.connections.entries()) {
      if (connection.type === 'sse' && connection.streamId === streamId) {
        this.sendSSEMessage(connection.res, type, data);
      }
    }
  }

  /**
   * Generate unique IDs
   */
  generateConnectionId() {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateStreamId() {
    return `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get service stats
   */
  getStats() {
    return {
      connections: {
        total: this.connections.size,
        websocket: Array.from(this.connections.values()).filter(c => c.type !== 'sse').length,
        sse: Array.from(this.connections.values()).filter(c => c.type === 'sse').length
      },
      streams: {
        active: this.activeStreams.size,
        byType: this.getStreamsByType()
      }
    };
  }

  /**
   * Get streams grouped by type
   */
  getStreamsByType() {
    const byType = {};
    for (const stream of this.activeStreams.values()) {
      byType[stream.type] = (byType[stream.type] || 0) + 1;
    }
    return byType;
  }

  /**
   * Cleanup inactive connections
   */
  cleanup() {
    const now = new Date();
    let cleaned = 0;

    for (const [connectionId, connection] of this.connections.entries()) {
      // Remove connections inactive for more than 30 minutes
      const inactiveTime = now - connection.lastActivity;
      if (inactiveTime > 1800000) { // 30 minutes
        if (connection.ws) {
          connection.ws.close();
        }
        this.connections.delete(connectionId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} inactive streaming connections`);
    }
  }
}

module.exports = StreamingService;