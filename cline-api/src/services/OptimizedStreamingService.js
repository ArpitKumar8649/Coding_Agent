/**
 * Optimized Streaming Service - Enhanced WebSocket + SSE with performance optimizations
 * Supports large file transfers, chunking, compression, and real-time collaboration
 */

const WebSocket = require('ws');
const { EventEmitter } = require('events');
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

class OptimizedStreamingService extends EventEmitter {
  constructor(server) {
    super();
    this.connections = new Map();
    this.activeStreams = new Map();
    this.fileTransfers = new Map();
    this.collaborationSessions = new Map();
    
    // Performance optimizations
    this.chunkBatcher = new ChunkBatcher();
    this.compressionEnabled = true;
    this.maxBufferSize = 1024 * 1024; // 1MB
    
    // Initialize WebSocket server with optimizations
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws',
      perMessageDeflate: true, // Enable compression
      maxPayload: 10 * 1024 * 1024, // 10MB max message size
      verifyClient: (info) => {
        // Add authentication logic here if needed
        return true;
      }
    });

    this.wss.on('connection', (ws, request) => {
      this.handleConnection(ws, request);
    });

    // Cleanup timer
    setInterval(() => this.cleanup(), 300000); // 5 minutes

    console.log('🚀 Optimized Streaming service initialized (WebSocket + SSE + File Transfer)');
  }

  /**
   * Handle new WebSocket connection with optimization
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
      collaborationRooms: new Set(),
      authenticated: false,
      compressionSupported: true,
      maxChunkSize: 8192 // 8KB chunks for optimal performance
    };

    this.connections.set(connectionId, connection);

    // Set up ping/pong for connection health
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
      connection.lastActivity = new Date();
    });

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
      features: {
        streaming: true,
        fileTransfer: true,
        compression: true,
        collaboration: true
      },
      timestamp: new Date().toISOString()
    });

    console.log(`💫 Optimized WebSocket connection established: ${connectionId}`);
  }

  /**
   * Handle WebSocket message with batching and compression
   */
  async handleMessage(connectionId, data) {
    try {
      const connection = this.connections.get(connectionId);
      if (!connection) return;

      connection.lastActivity = new Date();

      let message;
      
      // Handle compressed messages
      if (data instanceof Buffer && data[0] === 0x78) { // zlib header
        const decompressed = zlib.inflateSync(data);
        message = JSON.parse(decompressed.toString());
      } else {
        message = JSON.parse(data.toString());
      }
      
      switch (message.type) {
        case 'authenticate':
          await this.handleAuthentication(connectionId, message);
          break;
          
        case 'start_stream':
          await this.startOptimizedStream(connectionId, message);
          break;
          
        case 'start_file_transfer':
          await this.startFileTransfer(connectionId, message);
          break;
          
        case 'join_collaboration':
          await this.joinCollaboration(connectionId, message);
          break;
          
        case 'stream_chunk':
          await this.handleStreamChunk(connectionId, message);
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
        message: 'Invalid message format or processing error'
      });
    }
  }

  /**
   * Start optimized streaming with performance enhancements
   */
  async startOptimizedStream(connectionId, message) {
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
      status: 'active',
      buffer: '',
      chunks: [],
      compression: message.compression !== false,
      batchSize: message.batchSize || 5,
      quality: message.quality || 'medium'
    };

    this.activeStreams.set(streamId, stream);
    connection.activeStreams.add(streamId);

    // Send stream started confirmation
    this.sendToConnection(connectionId, {
      type: 'stream_started',
      streamId,
      requestType: stream.type,
      optimizations: {
        compression: stream.compression,
        batching: true,
        fileTransfer: true
      },
      timestamp: stream.started
    });

    // Emit event for processing with advanced features
    this.emit('optimized_stream_request', {
      streamId,
      connectionId,
      type: stream.type,
      request: message.request,
      options: {
        compression: stream.compression,
        quality: stream.quality,
        realTimeValidation: true
      },
      callback: (data) => this.sendOptimizedStreamUpdate(streamId, data)
    });
  }

  /**
   * Send optimized stream update with compression and batching
   */
  sendOptimizedStreamUpdate(streamId, data) {
    const stream = this.activeStreams.get(streamId);
    if (!stream) return;

    const connection = this.connections.get(stream.connectionId);
    if (!connection || connection.ws.readyState !== WebSocket.OPEN) {
      this.stopStream(stream.connectionId, streamId);
      return;
    }

    // Add to batch queue
    this.chunkBatcher.addChunk(streamId, {
      type: 'stream_update',
      streamId,
      data,
      timestamp: new Date().toISOString()
    }, (batchedData) => {
      this.sendToConnectionOptimized(stream.connectionId, batchedData, stream.compression);
    });
  }

  /**
   * Start file transfer with chunking support
   */
  async startFileTransfer(connectionId, message) {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.authenticated) {
      return this.sendError(connectionId, 'Not authenticated');
    }

    const transferId = this.generateTransferId();
    const { fileName, fileSize, fileType, chunkSize = 64 * 1024 } = message; // 64KB default

    const transfer = {
      id: transferId,
      connectionId,
      fileName,
      fileSize,
      fileType,
      chunkSize,
      chunks: new Map(),
      totalChunks: Math.ceil(fileSize / chunkSize),
      receivedChunks: 0,
      started: new Date().toISOString(),
      status: 'receiving'
    };

    this.fileTransfers.set(transferId, transfer);

    this.sendToConnection(connectionId, {
      type: 'file_transfer_ready',
      transferId,
      fileName,
      totalChunks: transfer.totalChunks,
      chunkSize
    });
  }

  /**
   * Handle collaboration features
   */
  async joinCollaboration(connectionId, message) {
    const { roomId, userId, userInfo } = message;
    const connection = this.connections.get(connectionId);
    
    if (!connection) return;

    let room = this.collaborationSessions.get(roomId);
    if (!room) {
      room = {
        id: roomId,
        participants: new Map(),
        created: new Date().toISOString(),
        lastActivity: new Date()
      };
      this.collaborationSessions.set(roomId, room);
    }

    room.participants.set(connectionId, {
      userId,
      userInfo,
      joinedAt: new Date().toISOString()
    });

    connection.collaborationRooms.add(roomId);

    // Notify all participants
    this.broadcastToRoom(roomId, {
      type: 'participant_joined',
      roomId,
      participant: { userId, userInfo },
      totalParticipants: room.participants.size
    }, connectionId);

    this.sendToConnection(connectionId, {
      type: 'collaboration_joined',
      roomId,
      participants: Array.from(room.participants.values())
    });
  }

  /**
   * Send message to connection with compression support
   */
  sendToConnectionOptimized(connectionId, message, useCompression = false) {
    const connection = this.connections.get(connectionId);
    if (!connection || connection.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      let data = JSON.stringify(message);
      
      // Apply compression for large messages
      if (useCompression && data.length > 1024) {
        data = zlib.deflateSync(Buffer.from(data));
      }
      
      connection.ws.send(data);
      return true;
    } catch (error) {
      console.error(`Failed to send to ${connectionId}:`, error);
      return false;
    }
  }

  /**
   * Broadcast to collaboration room
   */
  broadcastToRoom(roomId, message, excludeConnectionId = null) {
    const room = this.collaborationSessions.get(roomId);
    if (!room) return;

    for (const [connectionId] of room.participants) {
      if (connectionId !== excludeConnectionId) {
        this.sendToConnection(connectionId, message);
      }
    }
  }

  /**
   * Enhanced cleanup for optimized features
   */
  cleanup() {
    const now = new Date();
    let cleaned = 0;

    // Cleanup inactive connections
    for (const [connectionId, connection] of this.connections.entries()) {
      const inactiveTime = now - connection.lastActivity;
      if (inactiveTime > 1800000) { // 30 minutes
        if (connection.ws && connection.ws.readyState === WebSocket.OPEN) {
          connection.ws.close();
        }
        this.connections.delete(connectionId);
        cleaned++;
      }
    }

    // Cleanup old file transfers
    for (const [transferId, transfer] of this.fileTransfers.entries()) {
      const age = now - new Date(transfer.started);
      if (age > 3600000) { // 1 hour
        this.fileTransfers.delete(transferId);
      }
    }

    // Ping all connections
    this.wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });

    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} inactive optimized connections`);
    }
  }

  /**
   * Regular send method (backwards compatibility)
   */
  sendToConnection(connectionId, message) {
    return this.sendToConnectionOptimized(connectionId, message, false);
  }

  // Generate unique IDs
  generateConnectionId() {
    return `opt_conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateStreamId() {
    return `opt_stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateTransferId() {
    return `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Authentication handler
   */
  async handleAuthentication(connectionId, message) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    // Enhanced authentication
    const apiKey = message.apiKey;
    const validApiKey = process.env.API_KEY || 'development-key';
    
    if (apiKey === validApiKey) {
      connection.authenticated = true;
      connection.userId = message.userId || 'anonymous';
      
      this.sendToConnection(connectionId, {
        type: 'authenticated',
        success: true,
        features: {
          optimizedStreaming: true,
          fileTransfer: true,
          collaboration: true,
          compression: true
        },
        message: 'Authentication successful - Optimized features enabled'
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
   * Get enhanced service stats
   */
  getStats() {
    return {
      connections: {
        total: this.connections.size,
        authenticated: Array.from(this.connections.values()).filter(c => c.authenticated).length,
        websocket: this.connections.size
      },
      streams: {
        active: this.activeStreams.size,
        byType: this.getStreamsByType()
      },
      fileTransfers: {
        active: this.fileTransfers.size,
        totalSize: this.getTotalTransferSize()
      },
      collaboration: {
        rooms: this.collaborationSessions.size,
        totalParticipants: this.getTotalParticipants()
      },
      performance: {
        compressionEnabled: this.compressionEnabled,
        maxBufferSize: this.maxBufferSize,
        batchingEnabled: true
      }
    };
  }

  getTotalTransferSize() {
    let total = 0;
    for (const transfer of this.fileTransfers.values()) {
      total += transfer.fileSize;
    }
    return total;
  }

  getTotalParticipants() {
    let total = 0;
    for (const room of this.collaborationSessions.values()) {
      total += room.participants.size;
    }
    return total;
  }

  getStreamsByType() {
    const byType = {};
    for (const stream of this.activeStreams.values()) {
      byType[stream.type] = (byType[stream.type] || 0) + 1;
    }
    return byType;
  }

  // Enhanced error handling
  sendError(connectionId, message, details = null) {
    this.sendToConnection(connectionId, {
      type: 'error',
      message,
      details,
      timestamp: new Date().toISOString()
    });
  }

  handleDisconnect(connectionId) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    // Stop all active streams for this connection
    for (const streamId of connection.activeStreams) {
      this.cleanupStream(streamId);
    }

    // Leave all collaboration rooms
    for (const roomId of connection.collaborationRooms) {
      this.leaveCollaboration(connectionId, roomId);
    }

    this.connections.delete(connectionId);
    console.log(`🔌 Optimized WebSocket disconnected: ${connectionId}`);
  }

  leaveCollaboration(connectionId, roomId) {
    const room = this.collaborationSessions.get(roomId);
    if (!room) return;

    const participant = room.participants.get(connectionId);
    room.participants.delete(connectionId);

    // Notify remaining participants
    if (room.participants.size > 0) {
      this.broadcastToRoom(roomId, {
        type: 'participant_left',
        roomId,
        participant,
        totalParticipants: room.participants.size
      });
    } else {
      // Remove empty room
      this.collaborationSessions.delete(roomId);
    }
  }

  cleanupStream(streamId) {
    const stream = this.activeStreams.get(streamId);
    if (!stream) return;

    const connection = this.connections.get(stream.connectionId);
    if (connection) {
      connection.activeStreams.delete(streamId);
    }

    this.activeStreams.delete(streamId);
  }

  stopStream(connectionId, streamId) {
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
}

/**
 * Chunk Batcher for performance optimization
 */
class ChunkBatcher {
  constructor(maxSize = 5, maxDelay = 50) {
    this.batches = new Map();
    this.maxSize = maxSize;
    this.maxDelay = maxDelay;
  }

  addChunk(streamId, data, callback) {
    if (!this.batches.has(streamId)) {
      this.batches.set(streamId, {
        chunks: [],
        callback,
        timer: null
      });
    }

    const batch = this.batches.get(streamId);
    batch.chunks.push(data);

    if (batch.chunks.length >= this.maxSize) {
      this.flushBatch(streamId);
    } else if (!batch.timer) {
      batch.timer = setTimeout(() => this.flushBatch(streamId), this.maxDelay);
    }
  }

  flushBatch(streamId) {
    const batch = this.batches.get(streamId);
    if (!batch || batch.chunks.length === 0) return;

    if (batch.timer) {
      clearTimeout(batch.timer);
      batch.timer = null;
    }

    // Send batched data
    batch.callback({
      type: 'batched_updates',
      streamId,
      chunks: batch.chunks,
      count: batch.chunks.length,
      timestamp: new Date().toISOString()
    });

    // Reset batch
    batch.chunks = [];
  }
}

module.exports = OptimizedStreamingService;