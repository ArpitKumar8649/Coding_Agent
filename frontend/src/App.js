import React, { useState, useEffect } from 'react';
import AdvancedChatInterface from './components/chat/AdvancedChatInterface';
import useAdvancedClineChat from './hooks/useAdvancedClineChat';
import './App.css';

function App() {
  const {
    messages,
    isConnected,
    isStreaming,
    currentMode,
    agentStatus,
    currentProject,
    connectionError,
    streamingFeatures,
    stats,
    sendMessage,
    switchMode,
    uploadFile,
    joinCollaboration,
    cancelCurrentStream,
    reconnect,
    clearMessages,
    getPerformanceStats
  } = useAdvancedClineChat();

  const [showConnectionStatus, setShowConnectionStatus] = useState(false);

  // Show connection status on connection changes
  useEffect(() => {
    if (isConnected || connectionError) {
      setShowConnectionStatus(true);
      const timer = setTimeout(() => setShowConnectionStatus(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isConnected, connectionError]);

  const handleSendMessage = (message) => {
    const success = sendMessage(message);
    if (!success) {
      console.error('Failed to send message');
    }
  };

  const handleModeChange = (mode) => {
    switchMode(mode);
  };

  const handleClearMessages = () => {
    if (window.confirm('Are you sure you want to clear all messages?')) {
      clearMessages();
    }
  };

  const handleCancelProject = () => {
    if (window.confirm('Are you sure you want to cancel the current stream?')) {
      cancelCurrentStream();
    }
  };

  const handleUploadFile = async (file) => {
    console.log('📎 Uploading file:', file.name);
    try {
      await uploadFile(file);
    } catch (error) {
      console.error('File upload failed:', error);
    }
  };

  const handleJoinCollaboration = (roomId) => {
    const userInfo = {
      name: 'User',
      role: 'developer'
    };
    joinCollaboration(roomId, userInfo);
  };

  return (
    <div className="App h-screen w-screen bg-gray-900 overflow-hidden">
      {/* Main Chat Interface */}
      <div className="h-full w-full flex flex-col">
        <AdvancedChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          isConnected={isConnected}
          isStreaming={isStreaming}
          currentMode={currentMode}
          onModeChange={handleModeChange}
          agentStatus={agentStatus}
          currentProject={currentProject}
          connectionError={connectionError}
          onReconnect={reconnect}
          onClearMessages={handleClearMessages}
          onCancelProject={handleCancelProject}
          onUploadFile={handleUploadFile}
          onJoinCollaboration={handleJoinCollaboration}
          streamingFeatures={streamingFeatures}
          stats={stats}
          performanceStats={getPerformanceStats()}
        />
      </div>

      {/* Global Notifications */}
      {showConnectionStatus && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transition-all duration-300 ${
          connectionError 
            ? 'bg-red-600 text-white' 
            : isConnected 
              ? 'bg-green-600 text-white' 
              : 'bg-yellow-600 text-white'
        }`}>
          <div className="flex items-center space-x-2">
            {connectionError ? (
              <>
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span className="text-sm font-medium">Connection Error</span>
              </>
            ) : isConnected ? (
              <>
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Connected to Advanced Cline API</span>
                {streamingFeatures.optimizedStreaming && (
                  <span className="text-xs ml-1">⚡</span>
                )}
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Connecting...</span>
              </>
            )}
          </div>
          {connectionError && (
            <p className="text-xs mt-1 opacity-90">{connectionError}</p>
          )}
        </div>
      )}

      {/* Development Debug Panel */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 p-3 bg-gray-800 text-gray-300 text-xs rounded-lg border border-gray-600 max-w-xs z-40">
          <div className="font-semibold mb-2 text-blue-400">Debug Info</div>
          <div className="space-y-1">
            <div>Connected: {isConnected ? '✅' : '❌'}</div>
            <div>Mode: <span className={currentMode === 'PLAN' ? 'text-blue-400' : 'text-green-400'}>{currentMode}</span></div>
            <div>Agent: <span className={
              agentStatus === 'thinking' ? 'text-blue-400' :
              agentStatus === 'executing' ? 'text-green-400' :
              'text-gray-400'
            }>{agentStatus}</span></div>
            <div>Messages: {messages.length}</div>
            <div>Streaming: {isStreaming ? '✅' : '❌'}</div>
            {currentProject && (
              <div>Project: {currentProject.id.substring(0, 8)}...</div>
            )}
            {connectionError && (
              <div className="text-red-400">Error: {connectionError}</div>
            )}
          </div>
          <div className="mt-2 pt-2 border-t border-gray-700 space-x-1">
            <button 
              onClick={clearMessages}
              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
            >
              Clear
            </button>
            <button 
              onClick={reconnect}
              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs"
            >
              Reconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;