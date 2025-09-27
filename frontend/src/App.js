import React, { useState } from 'react';
import MainDashboard from './components/MainDashboard';
import AdvancedChatInterface from './components/chat/AdvancedChatInterface';
import useAdvancedClineChat from './hooks/useAdvancedClineChat';
import { 
  HomeIcon,
  ChatBubbleLeftRightIcon,
  ArrowsRightLeftIcon 
} from '@heroicons/react/24/outline';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' or 'chat'
  
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
    <div className="App h-screen w-screen overflow-hidden relative">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(34,197,94,0.1),transparent_50%)]"></div>
      </div>

      {/* View Toggle */}
      <div className="fixed top-4 right-4 z-50 flex items-center space-x-2">
        <div className="bg-black/20 backdrop-blur-md border border-white/20 rounded-lg p-1 flex">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
              currentView === 'dashboard'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <HomeIcon className="w-4 h-4" />
            <span className="text-sm font-medium">Dashboard</span>
          </button>
          
          <button
            onClick={() => setCurrentView('chat')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
              currentView === 'chat'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <ChatBubbleLeftRightIcon className="w-4 h-4" />
            <span className="text-sm font-medium">Chat</span>
          </button>
        </div>
        
        {/* Connection Status Indicator */}
        <div className={`px-3 py-2 rounded-lg backdrop-blur-md border ${
          connectionError 
            ? 'bg-red-500/20 border-red-400/30 text-red-300' 
            : isConnected 
              ? 'bg-green-500/20 border-green-400/30 text-green-300' 
              : 'bg-yellow-500/20 border-yellow-400/30 text-yellow-300'
        }`}>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionError ? 'bg-red-400' : isConnected ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'
            }`}></div>
            <span className="text-xs font-medium">
              {connectionError ? 'Error' : isConnected ? 'Connected' : 'Connecting'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 h-full">
        {currentView === 'dashboard' ? (
          <MainDashboard />
        ) : (
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
        )}
      </div>

      {/* Development Debug Panel */}
      {process.env.NODE_ENV === 'development' && currentView === 'chat' && (
        <div className="fixed bottom-4 left-4 p-3 bg-black/40 backdrop-blur-md text-gray-300 text-xs rounded-lg border border-white/20 max-w-xs z-40">
          <div className="font-semibold mb-2 text-blue-400">Debug Info</div>
          <div className="space-y-1">
            <div>View: <span className="text-purple-400">{currentView}</span></div>
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
              <div>Project: {currentProject.id?.substring(0, 8)}...</div>
            )}
          </div>
          <div className="mt-2 pt-2 border-t border-white/20 space-x-1">
            <button 
              onClick={handleClearMessages}
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