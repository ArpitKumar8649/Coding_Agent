import { useState, useEffect, useRef, useCallback } from 'react';
import OptimizedWebSocketService from '../services/OptimizedWebSocketService';
import AdvancedClineAPIService from '../services/AdvancedClineAPIService';
import StreamingResponseService from '../services/StreamingResponseService';

const useAdvancedClineChat = (initialMode = 'ACT') => {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentMode, setCurrentMode] = useState(initialMode);
  const [currentProject, setCurrentProject] = useState(null);
  const [agentStatus, setAgentStatus] = useState('idle'); // idle, thinking, executing
  const [sessionId, setSessionId] = useState(null);
  const [connectionError, setConnectionError] = useState(null);
  const [streamingFeatures, setStreamingFeatures] = useState({});

  const wsService = useRef(null);
  const apiService = useRef(null);
  const streamingService = useRef(null);
  const streamingContent = useRef('');
  const activeStreamId = useRef(null);

  // Performance tracking
  const [stats, setStats] = useState({
    messagesSent: 0,
    messagesReceived: 0,
    streamsActive: 0,
    reconnections: 0
  });

  // Initialize services
  useEffect(() => {
    wsService.current = new OptimizedWebSocketService();
    apiService.current = new AdvancedClineAPIService();
    streamingService.current = new StreamingResponseService();
    
    // Enable caching for better performance
    apiService.current.enableCaching();

    // Setup WebSocket event listeners
    const setupWebSocketListeners = () => {
      // Connection events
      wsService.current.on('connected', handleConnected);
      wsService.current.on('disconnected', handleDisconnected);
      wsService.current.on('authenticated', handleAuthenticated);
      wsService.current.on('authentication_failed', handleAuthFailed);
      
      // Streaming events
      wsService.current.on('stream_started', handleStreamStarted);
      wsService.current.on('stream_update', handleStreamUpdate);
      wsService.current.on('stream_complete', handleStreamComplete);
      wsService.current.on('batch_processed', handleBatchProcessed);
      
      // Legacy events for compatibility
      wsService.current.on('project_created', handleProjectCreated);
      wsService.current.on('project_progress', handleProjectProgress);
      wsService.current.on('agent_thinking', handleAgentThinking);
      wsService.current.on('tool_execution', handleToolExecution);
      wsService.current.on('project_completed', handleProjectCompleted);
      
      // File transfer events
      wsService.current.on('file_transfer_ready', handleFileTransferReady);
      wsService.current.on('file_transfer_progress', handleFileTransferProgress);
      
      // Collaboration events
      wsService.current.on('collaboration_joined', handleCollaborationJoined);
      wsService.current.on('participant_change', handleParticipantChange);
      
      // Error handling
      wsService.current.on('error', handleError);
    };

    setupWebSocketListeners();

    // Initialize connection
    initializeConnection();

    return () => {
      if (wsService.current) {
        wsService.current.disconnect();
      }
      if (streamingService.current) {
        streamingService.current.cleanup();
      }
    };
  }, []);

  const initializeConnection = async () => {
    try {
      // Test API connection first
      const connectionTest = await apiService.current.testConnection();
      if (!connectionTest.success) {
        throw new Error('Cannot connect to Advanced Cline API service');
      }

      console.log('🚀 Advanced Cline API connected:', connectionTest.features);

      // Create advanced session
      const session = await apiService.current.createAdvancedSession({
        startMode: initialMode,
        qualityLevel: 'advanced',
        enableStreaming: true,
        enableGit: true
      });

      setSessionId(session.sessionId);
      setCurrentProject({ id: session.sessionId, status: 'active' });

      // Connect WebSocket with optimizations
      const wsConnection = await wsService.current.connect();
      
      if (wsConnection.fallbackMode) {
        console.log('🔄 Using HTTP fallback mode');
        addSystemMessage('Connected via HTTP fallback - some features may be limited', 'warning');
      }
      
      // Store reference for HTTP fallback
      window.__optimizedClineAPIService = apiService.current;

    } catch (error) {
      console.error('Failed to initialize advanced connection:', error);
      setConnectionError(error.message);
    }
  };

  // Enhanced WebSocket Event Handlers
  const handleConnected = useCallback((data) => {
    setIsConnected(true);
    setConnectionError(null);
    setStreamingFeatures(data.features || {});
    
    const statusMsg = data.fallbackMode 
      ? 'Connected to Cline API (HTTP Fallback Mode)'
      : 'Connected to Advanced Cline API with optimized streaming';
    
    console.log(`✅ ${statusMsg}`);
    addSystemMessage(statusMsg, 'success');
  }, []);

  const handleDisconnected = useCallback(() => {
    setIsConnected(false);
    setAgentStatus('idle');
    setIsStreaming(false);
    console.log('❌ Disconnected from Advanced Cline API');
  }, []);

  const handleAuthenticated = useCallback((data) => {
    console.log('🔐 Advanced authentication successful:', data.features);
    setStreamingFeatures(data.features);
    addSystemMessage('Advanced features enabled: ' + Object.keys(data.features).join(', '), 'success');
  }, []);

  const handleAuthFailed = useCallback((data) => {
    setConnectionError('Authentication failed: ' + data.message);
    console.error('🔐 Authentication failed:', data.message);
  }, []);

  // Enhanced Streaming Handlers
  const handleStreamStarted = useCallback((data) => {
    const { streamId, optimizations } = data;
    activeStreamId.current = streamId;
    setIsStreaming(true);
    setStats(prev => ({ ...prev, streamsActive: prev.streamsActive + 1 }));
    
    console.log('💫 Stream started with optimizations:', optimizations);
    
    // Create streaming message placeholder
    addMessage({
      id: streamId,
      type: 'assistant',
      content: '',
      timestamp: Date.now(),
      mode: currentMode,
      isStreaming: true,
      streamId
    });
  }, [currentMode]);

  const handleStreamUpdate = useCallback((data) => {
    const { streamId, data: streamData } = data;
    
    if (streamData.content) {
      streamingContent.current += streamData.content;
      
      // Update streaming message
      setMessages(prev => {
        return prev.map(msg => {
          if (msg.streamId === streamId && msg.isStreaming) {
            return {
              ...msg,
              content: streamingContent.current,
              timestamp: Date.now(),
              quality: streamData.quality,
              errors: streamData.errors || []
            };
          }
          return msg;
        });
      });
    }
    
    // Handle real-time validation feedback
    if (streamData.errors && streamData.errors.length > 0) {
      console.warn('⚠️ Real-time validation errors:', streamData.errors);
    }
  }, []);

  const handleBatchProcessed = useCallback((data) => {
    const { streamId, chunkCount } = data;
    console.log(`📦 Processed batch of ${chunkCount} chunks for stream ${streamId}`);
  }, []);

  const handleStreamComplete = useCallback((data) => {
    const { streamId } = data;
    setIsStreaming(false);
    activeStreamId.current = null;
    streamingContent.current = '';
    setStats(prev => ({ ...prev, streamsActive: Math.max(0, prev.streamsActive - 1) }));
    
    // Finalize streaming message
    setMessages(prev => {
      return prev.map(msg => {
        if (msg.streamId === streamId && msg.isStreaming) {
          return {
            ...msg,
            isStreaming: false,
            content: data.result?.content || msg.content,
            completed: true,
            timestamp: Date.now()
          };
        }
        return msg;
      });
    });
    
    console.log('✅ Stream completed:', streamId);
  }, []);

  // Legacy event handlers for compatibility
  const handleProjectCreated = useCallback((data) => {
    console.log('🎆 Project created:', data);
    setCurrentProject(data);
    addMessage({
      type: 'system',
      content: `Project created: ${data.projectId}`,
      timestamp: data.timestamp
    });
  }, []);

  const handleProjectProgress = useCallback((data) => {
    console.log('🛠️ Project progress:', data);
    setAgentStatus('executing');
    
    if (data.content) {
      addMessage({
        type: 'assistant',
        content: data.content,
        timestamp: data.timestamp,
        mode: currentMode,
        toolsUsed: data.toolsUsed,
        projectId: data.projectId
      });
    }
  }, [currentMode]);

  const handleAgentThinking = useCallback((data) => {
    setAgentStatus('thinking');
    console.log('🧮 Agent thinking:', data.thought);
  }, []);

  const handleToolExecution = useCallback((data) => {
    addMessage({
      type: 'tool_execution',
      toolName: data.toolName || data.tool,
      parameters: data.parameters,
      result: data.result,
      status: data.status,
      timestamp: data.timestamp
    });
  }, []);

  const handleProjectCompleted = useCallback((data) => {
    setAgentStatus('idle');
    setIsStreaming(false);
    console.log('🎉 Project completed:', data);
    
    addMessage({
      type: 'system',
      content: 'Project completed successfully!',
      variant: 'success',
      timestamp: data.timestamp
    });
  }, []);

  // File transfer handlers
  const handleFileTransferReady = useCallback((data) => {
    console.log('📤 File transfer ready:', data);
    addSystemMessage(`File transfer ready: ${data.fileName}`, 'info');
  }, []);

  const handleFileTransferProgress = useCallback((data) => {
    const { progress, sentChunks, totalChunks } = data;
    console.log(`📤 File transfer progress: ${Math.round(progress * 100)}% (${sentChunks}/${totalChunks})`);
  }, []);

  // Collaboration handlers
  const handleCollaborationJoined = useCallback((data) => {
    console.log('🤝 Joined collaboration room:', data);
    addSystemMessage(`Joined collaboration room with ${data.participants.length} participants`, 'info');
  }, []);

  const handleParticipantChange = useCallback((data) => {
    const action = data.type === 'participant_joined' ? 'joined' : 'left';
    addSystemMessage(`${data.participant.userInfo.name} ${action} the collaboration`, 'info');
  }, []);

  const handleError = useCallback((error) => {
    console.error('❌ WebSocket error:', error);
    setConnectionError(error.message || 'Connection error');
    setStats(prev => ({ ...prev, errors: (prev.errors || 0) + 1 }));
  }, []);

  // Public Methods
  const sendMessage = useCallback(async (content, options = {}) => {
    if (!isConnected || !sessionId) {
      console.warn('Cannot send message: not connected to advanced chat service');
      return false;
    }

    try {
      // Add user message
      addMessage({
        type: 'user',
        content,
        timestamp: Date.now(),
        mode: currentMode
      });
      
      setStats(prev => ({ ...prev, messagesSent: prev.messagesSent + 1 }));
      setAgentStatus('thinking');
      
      // Start optimized streaming
      const streamId = await wsService.current.startOptimizedStream('chat_message', {
        sessionId,
        message: content,
        mode: currentMode
      }, {
        compression: true,
        quality: 'advanced',
        realTimeValidation: true,
        ...options
      });
      
      console.log('💫 Started optimized stream:', streamId);
      return streamId;
      
    } catch (error) {
      console.error('Failed to send message:', error);
      setConnectionError(error.message);
      setAgentStatus('idle');
      return false;
    }
  }, [isConnected, sessionId, currentMode]);

  const switchMode = useCallback(async (mode) => {
    if (!isConnected || !sessionId) {
      console.warn('Cannot switch mode: not connected to advanced chat service');
      return false;
    }

    try {
      const result = await apiService.current.switchMode(sessionId, mode);
      if (result.success) {
        setCurrentMode(mode);
        addSystemMessage(`Switched to ${mode} mode`, 'mode');
        return true;
      }
    } catch (error) {
      console.error('Failed to switch mode:', error);
      setConnectionError(error.message);
    }
    return false;
  }, [isConnected, sessionId]);

  // File upload with chunking
  const uploadFile = useCallback(async (file, options = {}) => {
    if (!isConnected || !sessionId) {
      console.warn('Cannot upload file: not connected');
      return false;
    }

    try {
      addSystemMessage(`Uploading file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`, 'info');
      
      const result = await apiService.current.uploadFile(sessionId, file, {
        onProgress: (progress) => {
          console.log(`📤 Upload progress: ${Math.round(progress.progress * 100)}%`);
        },
        ...options
      });
      
      addSystemMessage(`File uploaded successfully: ${result.fileName}`, 'success');
      return result;
      
    } catch (error) {
      console.error('File upload failed:', error);
      addSystemMessage(`File upload failed: ${error.message}`, 'error');
      return false;
    }
  }, [isConnected, sessionId]);

  // Join collaboration room
  const joinCollaboration = useCallback((roomId, userInfo = {}) => {
    if (!isConnected) {
      console.warn('Cannot join collaboration: not connected');
      return false;
    }

    wsService.current.joinCollaboration(roomId, userInfo);
    return true;
  }, [isConnected]);

  const reconnect = useCallback(() => {
    if (wsService.current) {
      setStats(prev => ({ ...prev, reconnections: prev.reconnections + 1 }));
      initializeConnection();
    }
  }, []);

  // Helper methods
  const addMessage = (message) => {
    setMessages(prev => [...prev, { id: Date.now(), ...message }]);
    setStats(prev => ({ ...prev, messagesReceived: prev.messagesReceived + 1 }));
  };

  const addSystemMessage = (content, variant = 'info') => {
    addMessage({
      type: 'system',
      content,
      variant,
      timestamp: Date.now()
    });
  };

  const clearMessages = () => {
    setMessages([]);
    if (streamingService.current) {
      streamingService.current.cleanup();
    }
  };

  const cancelCurrentStream = () => {
    if (activeStreamId.current && wsService.current) {
      wsService.current.send({
        type: 'stop_stream',
        streamId: activeStreamId.current
      });
      setIsStreaming(false);
      activeStreamId.current = null;
    }
  };

  const getConnectionStatus = () => {
    const wsStatus = wsService.current ? wsService.current.getStatus() : {
      isConnected: false,
      httpFallbackMode: false,
      features: {}
    };
    
    return {
      ...wsStatus,
      sessionId,
      currentProject,
      streamingFeatures,
      apiStats: apiService.current ? apiService.current.getStats() : {}
    };
  };

  const getPerformanceStats = () => {
    const wsStatus = wsService.current ? wsService.current.getStatus() : {};
    return {
      ...stats,
      wsStats: wsStatus.stats || {},
      features: streamingFeatures,
      cacheEnabled: apiService.current?.cache ? true : false
    };
  };

  return {
    // State
    messages,
    isConnected,
    isStreaming,
    currentMode,
    currentProject,
    agentStatus,
    sessionId,
    connectionError,
    streamingFeatures,
    stats,

    // Actions
    sendMessage,
    switchMode,
    uploadFile,
    joinCollaboration,
    reconnect,
    clearMessages,
    cancelCurrentStream,

    // Utils
    getConnectionStatus,
    getPerformanceStats,
    addSystemMessage
  };
};

export default useAdvancedClineChat;