import { useState, useEffect, useRef, useCallback } from 'react';
import WebSocketService from '../services/WebSocketService';
import ClineAPIService from '../services/ClineAPIService';

const useClineChat = (initialMode = 'ACT') => {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentMode, setCurrentMode] = useState(initialMode);
  const [agentStatus, setAgentStatus] = useState('idle'); // idle, thinking, executing
  const [sessionId, setSessionId] = useState(null);
  const [connectionError, setConnectionError] = useState(null);

  const wsService = useRef(null);
  const apiService = useRef(null);
  const streamingContent = useRef('');

  // Initialize services
  useEffect(() => {
    wsService.current = new WebSocketService();
    apiService.current = new ClineAPIService();

    // Setup WebSocket event listeners
    const setupWebSocketListeners = () => {
      wsService.current.on('connected', handleConnected);
      wsService.current.on('disconnected', handleDisconnected);
      wsService.current.on('error', handleConnectionError);
      wsService.current.on('session_joined', handleSessionJoined);
      wsService.current.on('user_message', handleUserMessage);
      wsService.current.on('agent_response', handleAgentResponse);
      wsService.current.on('agent_stream', handleAgentStream);
      wsService.current.on('agent_status', handleAgentStatus);
      wsService.current.on('tool_execution', handleToolExecution);
      wsService.current.on('mode_switched', handleModeSwitch);
    };

    setupWebSocketListeners();

    // Initialize connection
    initializeConnection();

    return () => {
      if (wsService.current) {
        wsService.current.disconnect();
      }
    };
  }, []);

  const initializeConnection = async () => {
    try {
      // Test API connection first
      const connectionTest = await apiService.current.testConnection();
      if (!connectionTest.success) {
        throw new Error('Cannot connect to Cline API service');
      }

      // Create chat session
      const session = await apiService.current.createChatSession({
        mode: initialMode,
        qualityLevel: 'advanced'
      });

      setSessionId(session.sessionId);

      // Connect WebSocket
      await wsService.current.connect();
      
      // Join session
      wsService.current.joinSession(session.sessionId);

    } catch (error) {
      console.error('Failed to initialize connection:', error);
      setConnectionError(error.message);
    }
  };

  // WebSocket Event Handlers
  const handleConnected = useCallback(() => {
    setIsConnected(true);
    setConnectionError(null);
    console.log('✅ Connected to Cline Chat API');
  }, []);

  const handleDisconnected = useCallback(() => {
    setIsConnected(false);
    setAgentStatus('idle');
    console.log('❌ Disconnected from Cline Chat API');
  }, []);

  const handleConnectionError = useCallback((error) => {
    setConnectionError(error.message || 'Connection error');
    setIsConnected(false);
  }, []);

  const handleSessionJoined = useCallback((data) => {
    console.log('🎯 Joined chat session:', data.sessionId);
    addSystemMessage('Connected to Cline agent', 'success');
  }, []);

  const handleUserMessage = useCallback((data) => {
    addMessage({
      type: 'user',
      content: data.content,
      timestamp: data.timestamp,
      mode: data.mode
    });
  }, []);

  const handleAgentResponse = useCallback((data) => {
    setIsStreaming(false);
    streamingContent.current = '';
    
    addMessage({
      type: 'assistant', 
      content: data.content,
      timestamp: data.timestamp,
      mode: data.mode,
      toolsUsed: data.toolsUsed
    });
  }, []);

  const handleAgentStream = useCallback((data) => {
    setIsStreaming(!data.complete);
    
    if (data.complete) {
      // Streaming complete
      streamingContent.current = '';
    } else {
      // Update streaming content
      streamingContent.current += data.content;
      
      // Update or add streaming message
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.type === 'assistant' && lastMessage.isStreaming) {
          // Update existing streaming message
          return [
            ...prev.slice(0, -1),
            {
              ...lastMessage,
              content: streamingContent.current,
              timestamp: data.timestamp
            }
          ];
        } else {
          // Add new streaming message
          return [
            ...prev,
            {
              id: Date.now(),
              type: 'assistant',
              content: streamingContent.current,
              timestamp: data.timestamp,
              mode: currentMode,
              isStreaming: true
            }
          ];
        }
      });
    }
  }, [currentMode]);

  const handleAgentStatus = useCallback((data) => {
    setAgentStatus(data.status);
    
    if (data.status === 'thinking') {
      setIsStreaming(true);
    } else if (data.status === 'idle') {
      setIsStreaming(false);
    }
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

  const handleModeSwitch = useCallback((data) => {
    setCurrentMode(data.mode);
    addSystemMessage(`Switched to ${data.mode} mode`, 'mode');
  }, []);

  // Public Methods
  const sendMessage = useCallback((content) => {
    if (!isConnected || !sessionId) {
      console.warn('Cannot send message: not connected to chat service');
      return false;
    }

    return wsService.current.sendChatMessage(content, currentMode);
  }, [isConnected, sessionId, currentMode]);

  const switchMode = useCallback((mode) => {
    if (!isConnected || !sessionId) {
      console.warn('Cannot switch mode: not connected to chat service');
      return false;
    }

    return wsService.current.switchMode(mode);
  }, [isConnected, sessionId]);

  const approveOrRejectTool = useCallback((executionId, approved, feedback = '') => {
    if (!isConnected || !sessionId) {
      return false;
    }

    return wsService.current.approveOrRejectTool(executionId, approved, feedback);
  }, [isConnected, sessionId]);

  const reconnect = useCallback(() => {
    if (wsService.current) {
      initializeConnection();
    }
  }, []);

  // Helper methods
  const addMessage = (message) => {
    setMessages(prev => [...prev, { id: Date.now(), ...message }]);
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
  };

  const getConnectionStatus = () => {
    return wsService.current ? wsService.current.getStatus() : {
      isConnected: false,
      sessionId: null,
      reconnectAttempts: 0,
      readyState: WebSocket.CLOSED
    };
  };

  return {
    // State
    messages,
    isConnected,
    isStreaming,
    currentMode,
    agentStatus,
    sessionId,
    connectionError,

    // Actions
    sendMessage,
    switchMode,
    approveOrRejectTool,
    reconnect,
    clearMessages,

    // Utils
    getConnectionStatus,
    addSystemMessage
  };
};

export default useClineChat;