import { useState, useEffect, useRef, useCallback } from 'react';
import DirectWebSocketService from '../services/DirectWebSocketService';
import DirectClineAPIService from '../services/DirectClineAPIService';
import StreamingResponseService from '../services/StreamingResponseService';

const useDirectClineChat = () => {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentMode, setCurrentMode] = useState('ACT'); // PLAN or ACT
  const [agentStatus, setAgentStatus] = useState('idle'); // idle, thinking, executing
  const [currentProject, setCurrentProject] = useState(null);
  const [connectionError, setConnectionError] = useState(null);
  const [toolExecutions, setToolExecutions] = useState([]);

  const wsService = useRef(null);
  const apiService = useRef(null);
  const streamingService = useRef(null);
  const streamingContent = useRef('');
  const currentMessageId = useRef(null);

  // Initialize services
  useEffect(() => {
    wsService.current = new DirectWebSocketService();
    apiService.current = new DirectClineAPIService();
    streamingService.current = new StreamingResponseService();

    // Make API service globally available for WebSocket fallback
    window.__clineAPIService = apiService.current;

    // Setup WebSocket event listeners
    const setupWebSocketListeners = () => {
      wsService.current.on('connected', handleConnected);
      wsService.current.on('disconnected', handleDisconnected);
      wsService.current.on('error', handleConnectionError);
      wsService.current.on('project_created', handleProjectCreated);
      wsService.current.on('project_progress', handleProjectProgress);
      wsService.current.on('agent_thinking', handleAgentThinking);
      wsService.current.on('tool_execution', handleToolExecution);
      wsService.current.on('file_change', handleFileChange);
      wsService.current.on('project_completed', handleProjectCompleted);
      wsService.current.on('stream_chunk', handleStreamChunk);
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
      console.log('🔵 Testing Cline API connection...');
      const connectionTest = await apiService.current.testConnection();
      
      if (!connectionTest.success) {
        console.error('❌ API Connection Test Failed:', connectionTest);
        throw new Error(`Cannot connect to Cline API: ${connectionTest.error || 'Unknown error'}`);
      }
      
      console.log('✅ API Connection Test Success:', connectionTest);

      // Connect WebSocket
      await wsService.current.connect();
      
      console.log('✅ Connected to Cline API directly');

    } catch (error) {
      console.error('❌ Failed to initialize connection:', error);
      setConnectionError(`Connection Failed: ${error.message}`);
      
      // Add detailed error to chat
      addMessage({
        type: 'system',
        content: `❌ **Connection Error**\n\n${error.message}\n\n**API URL:** ${apiService.current.baseURL}\n**API Key:** ${apiService.current.apiKey ? 'Present' : 'Missing'}\n\n**Time:** ${new Date().toLocaleTimeString()}`,
        variant: 'error',
        timestamp: Date.now(),
        isError: true
      });
    }
  };

  // WebSocket Event Handlers
  const handleConnected = useCallback(() => {
    setIsConnected(true);
    setConnectionError(null);
    console.log('✅ Connected to Cline API WebSocket');
    addSystemMessage('Connected to Cline Agent', 'success');
  }, []);

  const handleDisconnected = useCallback(() => {
    setIsConnected(false);
    setAgentStatus('idle');
    setIsStreaming(false);
    console.log('❌ Disconnected from Cline API WebSocket');
  }, []);

  const handleConnectionError = useCallback((error) => {
    console.error('❌ WebSocket connection error:', error);
    const errorMessage = error?.message || error?.error?.message || 'WebSocket connection failed';
    setConnectionError(`WebSocket Error: ${errorMessage}`);
    setIsConnected(false);
    setIsStreaming(false);
    
    // Add detailed error to chat
    addMessage({
      type: 'system',
      content: `❌ **WebSocket Connection Failed**\n\n${errorMessage}\n\n**Falling back to HTTP-only mode**\n\n**WebSocket URL:** ${error?.url || 'Unknown'}\n\n**Time:** ${new Date().toLocaleTimeString()}`,
      variant: 'error',
      timestamp: Date.now(),
      isError: true
    });
    
    // Set connected to true for HTTP-only mode
    setTimeout(() => {
      console.log('🔄 Enabling HTTP-only mode (no WebSocket)');
      setIsConnected(true);
      setConnectionError(null);
      addMessage({
        type: 'system',
        content: `✅ **HTTP-only Mode Enabled**\n\nWebSocket unavailable, but HTTP API is working.\nYou can still create projects, but real-time updates may be limited.`,
        variant: 'warning',
        timestamp: Date.now()
      });
    }, 2000);
  }, []);

  const handleProjectCreated = useCallback((data) => {
    console.log('🎆 Project created:', data.projectId);
    setCurrentProject({
      id: data.projectId,
      description: data.description,
      status: 'active',
      createdAt: Date.now()
    });
    
    // Subscribe to project updates
    wsService.current.subscribeToProject(data.projectId);
    
    addSystemMessage(`Project started: ${data.projectId}`, 'success');
  }, []);

  const handleProjectProgress = useCallback((data) => {
    console.log('📈 Project progress:', data);
    
    // Update agent status based on progress
    if (data.stage === 'planning') {
      setAgentStatus('thinking');
      setCurrentMode('PLAN');
    } else if (data.stage === 'executing') {
      setAgentStatus('executing');
      setCurrentMode('ACT');
    }
    
    // Add progress message
    if (data.message || data.content) {
      addMessage({
        type: 'assistant',
        content: data.message || data.content,
        timestamp: data.timestamp || Date.now(),
        mode: data.stage === 'planning' ? 'PLAN' : 'ACT',
        isProgress: true
      });
    }
  }, []);

  const handleAgentThinking = useCallback((data) => {
    console.log('🧠 Agent thinking:', data);
    setAgentStatus('thinking');
    setIsStreaming(true);
    
    if (data.content) {
      handleStreamContent(data.content, false);
    }
  }, []);

  const handleToolExecution = useCallback((data) => {
    console.log('🔧 Tool execution:', data);
    setAgentStatus('executing');
    
    const toolExecution = {
      id: data.executionId || Date.now(),
      toolName: data.toolName || data.tool,
      parameters: data.parameters || data.args,
      result: data.result,
      status: data.status || 'running',
      timestamp: data.timestamp || Date.now()
    };
    
    setToolExecutions(prev => {
      const existing = prev.find(t => t.id === toolExecution.id);
      if (existing) {
        return prev.map(t => t.id === toolExecution.id ? { ...t, ...toolExecution } : t);
      }
      return [...prev, toolExecution];
    });
    
    addMessage({
      type: 'tool_execution',
      ...toolExecution
    });
  }, []);

  const handleFileChange = useCallback((data) => {
    console.log('📁 File change:', data);
    
    addMessage({
      type: 'file_change',
      action: data.type, // 'file_created' or 'file_updated'
      filePath: data.filePath || data.path,
      content: data.content,
      diff: data.diff,
      timestamp: data.timestamp || Date.now()
    });
  }, []);

  const handleProjectCompleted = useCallback((data) => {
    console.log('✅ Project completed:', data);
    setAgentStatus('idle');
    setIsStreaming(false);
    
    if (currentProject) {
      setCurrentProject(prev => ({ ...prev, status: 'completed' }));
    }
    
    addSystemMessage('Project completed successfully!', 'success');
    
    if (data.summary) {
      addMessage({
        type: 'assistant',
        content: data.summary,
        timestamp: data.timestamp || Date.now(),
        mode: 'ACT',
        isCompletion: true
      });
    }
  }, [currentProject]);

  const handleStreamChunk = useCallback((data) => {
    if (data.complete) {
      setIsStreaming(false);
      streamingContent.current = '';
      currentMessageId.current = null;
    } else {
      handleStreamContent(data.content || data.chunk, data.complete);
    }
  }, []);

  const handleStreamContent = useCallback((content, isComplete) => {
    setIsStreaming(!isComplete);
    
    if (isComplete) {
      streamingContent.current = '';
      currentMessageId.current = null;
      return;
    }
    
    streamingContent.current += content;
    
    setMessages(prev => {
      const lastMessage = prev[prev.length - 1];
      const messageId = currentMessageId.current || Date.now();
      
      if (lastMessage && lastMessage.id === messageId && lastMessage.isStreaming) {
        // Update existing streaming message
        return [
          ...prev.slice(0, -1),
          {
            ...lastMessage,
            content: streamingContent.current,
            timestamp: Date.now()
          }
        ];
      } else {
        // Add new streaming message
        const newMessage = {
          id: messageId,
          type: 'assistant',
          content: streamingContent.current,
          timestamp: Date.now(),
          mode: currentMode,
          isStreaming: true
        };
        
        currentMessageId.current = messageId;
        return [...prev, newMessage];
      }
    });
  }, [currentMode]);

  // Public Methods
  const sendMessage = useCallback(async (content) => {
    if (!isConnected) {
      console.warn('Cannot send message: not connected to Cline API');
      return false;
    }

    // Add user message immediately
    addMessage({
      type: 'user',
      content,
      timestamp: Date.now(),
      mode: currentMode
    });

    try {
      if (currentProject && currentProject.status === 'active') {
        // Continue existing project
        const result = await apiService.current.continueProject(currentProject.id, content);
        console.log('Project continued:', result);
      } else {
        // Create new project
        const result = await apiService.current.createProject(content, {
          mode: currentMode,
          framework: 'React',
          styling: 'Tailwind CSS'
        });
        console.log('Project created:', result);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Add detailed error message to chat
      addMessage({
        type: 'system',
        content: `❌ **API Error Details:**\n\n**Error:** ${error.message}\n\n**Endpoint:** ${currentProject ? 'continue-project' : 'create-project'}\n\n**API URL:** ${apiService.current.baseURL}\n\n**Time:** ${new Date().toLocaleTimeString()}`,
        variant: 'error',
        timestamp: Date.now(),
        isError: true
      });
      
      setConnectionError(error.message);
      return false;
    }
  }, [isConnected, currentProject, currentMode]);

  const switchMode = useCallback((mode) => {
    if (!['PLAN', 'ACT'].includes(mode)) {
      console.warn('Invalid mode:', mode);
      return false;
    }
    
    setCurrentMode(mode);
    addSystemMessage(`Switched to ${mode} mode`, 'mode');
    return true;
  }, []);

  const cancelCurrentProject = useCallback(async () => {
    if (currentProject && currentProject.status === 'active') {
      try {
        await apiService.current.cancelProject(currentProject.id);
        setCurrentProject(prev => ({ ...prev, status: 'cancelled' }));
        setAgentStatus('idle');
        setIsStreaming(false);
        addSystemMessage('Project cancelled', 'warning');
        return true;
      } catch (error) {
        console.error('Failed to cancel project:', error);
        return false;
      }
    }
    return false;
  }, [currentProject]);

  const reconnect = useCallback(() => {
    if (wsService.current) {
      initializeConnection();
    }
  }, []);

  // Helper methods
  const addMessage = (message) => {
    setMessages(prev => [...prev, { id: message.id || Date.now(), ...message }]);
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
    setToolExecutions([]);
  };

  const getConnectionStatus = () => {
    return wsService.current ? wsService.current.getStatus() : {
      isConnected: false,
      projectId: null,
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
    currentProject,
    connectionError,
    toolExecutions,

    // Actions
    sendMessage,
    switchMode,
    cancelCurrentProject,
    reconnect,
    clearMessages,

    // Utils
    getConnectionStatus,
    addSystemMessage
  };
};

export default useDirectClineChat;