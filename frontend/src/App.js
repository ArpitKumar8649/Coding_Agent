import React, { useState, useEffect } from 'react';
import ChatInterface from './components/chat/ChatInterface';
import useClineChat from './hooks/useClineChat';
import './App.css';

function App() {
  const {
    messages,
    isConnected,
    isStreaming,
    currentMode,
    agentStatus,
    sessionId,
    connectionError,
    sendMessage,
    switchMode,
    reconnect,
    clearMessages,
    getConnectionStatus
  } = useClineChat('ACT');

  const [showConnectionStatus, setShowConnectionStatus] = useState(false);

  // Show connection status on mount
  useEffect(() => {
    setShowConnectionStatus(true);
    const timer = setTimeout(() => setShowConnectionStatus(false), 3000);
    return () => clearTimeout(timer);
  }, [isConnected]);

  const handleSendMessage = (message) => {
    const success = sendMessage(message);
    if (!success) {
      console.error('Failed to send message');
      // Could show user notification here
    }
  };

  const handleModeChange = (mode) => {
    switchMode(mode);
  };

  return (
    <div className="App">
      {/* Connection Status Banner */}
      {(showConnectionStatus || connectionError) && (
        <div className={`fixed top-0 left-0 right-0 z-50 p-3 text-center text-sm font-medium transition-all duration-300 ${
          connectionError 
            ? 'bg-red-600 text-white' 
            : isConnected 
              ? 'bg-green-600 text-white' 
              : 'bg-yellow-600 text-white'
        }`}>
          {connectionError ? (
            <span>
              ❌ Connection Error: {connectionError} 
              <button 
                onClick={reconnect}
                className="ml-2 px-2 py-1 bg-white/20 rounded hover:bg-white/30 transition-colors"
              >
                Retry
              </button>
            </span>
          ) : isConnected ? (
            <span>
              ✅ Connected to Cline API {sessionId && `(Session: ${sessionId.substring(0, 8)}...)`}
            </span>
          ) : (
            <span>🔄 Connecting to Cline API...</span>
          )}
        </div>
      )}

      {/* Main Chat Interface */}
      <div className={`h-screen bg-gray-900 transition-all duration-300 ${
        (showConnectionStatus || connectionError) ? 'pt-12' : ''
      }`}>
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          isStreaming={isStreaming}
          currentMode={currentMode}
          onModeChange={handleModeChange}
          agentStatus={agentStatus}
          isConnected={isConnected}
          sessionId={sessionId}
        />
      </div>

      {/* Debug Panel (Development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 p-3 bg-gray-800 text-gray-300 text-xs rounded-lg border border-gray-600 max-w-xs">
          <div className="font-semibold mb-1">Debug Info</div>
          <div>Connected: {isConnected ? '✅' : '❌'}</div>
          <div>Session: {sessionId?.substring(0, 8) || 'None'}</div>
          <div>Mode: {currentMode}</div>
          <div>Agent: {agentStatus}</div>
          <div>Messages: {messages.length}</div>
          <div className="mt-2 space-x-1">
            <button 
              onClick={clearMessages}
              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
            >
              Clear
            </button>
            <button 
              onClick={() => console.log(getConnectionStatus())}
              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs"
            >
              Status
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;