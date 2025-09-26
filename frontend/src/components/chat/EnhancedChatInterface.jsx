import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Settings, 
  Maximize2, 
  Minimize2, 
  RotateCcw,
  Trash2,
  Wifi,
  WifiOff,
  Activity,
  Clock,
  AlertTriangle
} from 'lucide-react';
import EnhancedMessageList from './EnhancedMessageList';
import EnhancedMessageInput from './EnhancedMessageInput';
import EnhancedModeSwitch from './EnhancedModeSwitch';

const EnhancedChatInterface = ({ 
  messages = [], 
  onSendMessage, 
  isConnected = false,
  isStreaming = false, 
  currentMode = 'ACT',
  onModeChange,
  agentStatus = 'idle',
  currentProject = null,
  connectionError = null,
  onReconnect,
  onClearMessages,
  onCancelProject
}) => {
  const [input, setInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const chatContainerRef = useRef(null);

  const handleSendMessage = () => {
    if (input.trim() && onSendMessage && isConnected) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleCancelGeneration = () => {
    if (onCancelProject && currentProject) {
      onCancelProject();
    }
  };

  const getStatusColor = () => {
    if (connectionError) return 'text-red-400';
    if (!isConnected) return 'text-gray-400';
    
    switch (agentStatus) {
      case 'thinking': return 'text-blue-400';
      case 'executing': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusText = () => {
    if (connectionError) return 'Connection Error';
    if (!isConnected) return 'Disconnected';
    
    switch (agentStatus) {
      case 'thinking': return 'Thinking...';
      case 'executing': return 'Executing...';
      default: return 'Ready';
    }
  };

  const getStatusIcon = () => {
    if (connectionError) return <AlertTriangle className="w-4 h-4 animate-pulse" />;
    if (!isConnected) return <WifiOff className="w-4 h-4" />;
    if (agentStatus === 'thinking' || agentStatus === 'executing') {
      return <Activity className="w-4 h-4 animate-pulse" />;
    }
    return <Wifi className="w-4 h-4" />;
  };

  // Mobile responsive breakpoints
  const isMobile = window.innerWidth < 768;
  const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;

  return (
    <div className="flex flex-col h-screen w-full bg-gray-900 overflow-hidden">
      
      {/* Header */}
      <div className="flex-shrink-0 w-full">
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-700 bg-gray-800">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            {/* Agent Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              {(isStreaming || agentStatus !== 'idle') && (
                <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full animate-pulse"></div>
              )}
            </div>
            
            {/* Agent Info */}
            <div className="min-w-0 flex-1">
              <h3 className="text-white font-semibold text-sm sm:text-base truncate">
                Cline Agent
                {currentProject && (
                  <span className="ml-1 sm:ml-2 text-xs text-gray-400">
                    ({currentProject.id.substring(0, 6)}...)
                  </span>
                )}
              </h3>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <div className={`flex items-center space-x-1 text-xs ${getStatusColor()}`}>
                  {getStatusIcon()}
                  <span className="sm:inline">{getStatusText()}</span>
                </div>
                {currentProject && (
                  <>
                    <span className="text-gray-600 hidden sm:inline">•</span>
                    <span className="text-xs text-gray-500 capitalize hidden sm:inline">
                      {currentProject.status}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Header Actions */}
          <div className="flex items-center space-x-2">
            {/* Mode Switch - Hidden on mobile when minimized */}
            {(!isMobile || !isMinimized) && (
              <EnhancedModeSwitch 
                currentMode={currentMode} 
                onModeChange={onModeChange}
                disabled={isStreaming || !isConnected}
              />
            )}
            
            {/* Connection Status - Mobile */}
            {connectionError && (
              <button
                onClick={onReconnect}
                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Reconnect"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            
            {/* Actions Menu */}
            <div className="flex items-center space-x-1">
              {/* Clear Messages */}
              {messages.length > 0 && (
                <button
                  onClick={onClearMessages}
                  className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                  title="Clear messages"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              
              {/* Settings */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
              
              {/* Minimize/Maximize - Mobile only */}
              {isMobile && (
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                  title={isMinimized ? 'Maximize' : 'Minimize'}
                >
                  {isMinimized ? (
                    <Maximize2 className="w-4 h-4" />
                  ) : (
                    <Minimize2 className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Connection Error Banner */}
        {connectionError && (
          <div className="bg-red-600 text-white px-4 py-2 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Connection Error: {connectionError}</span>
              </div>
              <button 
                onClick={onReconnect}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-medium transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Chat Content - Hidden when minimized on mobile */}
      {(!isMobile || !isMinimized) && (
        <>
          {/* Messages Container */}
          <div 
            ref={chatContainerRef}
            className="flex-1 min-h-0 relative"
          >
            <EnhancedMessageList 
              messages={messages}
              isStreaming={isStreaming}
              currentMode={currentMode}
              currentProject={currentProject}
            />
            
            {/* Overlay for disconnected state */}
            {!isConnected && !connectionError && (
              <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-300 mb-2">Connecting to Cline API...</p>
                  <p className="text-gray-500 text-sm">Please wait while we establish connection</p>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="flex-shrink-0">
            <EnhancedMessageInput
              value={input}
              onChange={setInput}
              onSend={handleSendMessage}
              disabled={!isConnected}
              isStreaming={isStreaming}
              currentMode={currentMode}
              onCancel={handleCancelGeneration}
              placeholder={
                !isConnected 
                  ? "Connecting to Cline API..."
                  : currentMode === 'PLAN' 
                    ? "Describe your project or ask questions about the approach..."
                    : "Tell me what you want me to build..."
              }
            />
          </div>
        </>
      )}

      {/* Mode & Status Bar - Always visible */}
      <div className="flex-shrink-0 px-4 py-2 bg-gray-800 border-t border-gray-700">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-4">
            {/* Current Mode */}
            <div className="flex items-center space-x-2">
              {currentMode === 'PLAN' ? (
                <>
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-blue-400 font-medium">Planning Mode</span>
                  <span className="text-gray-500 hidden sm:inline">- Discuss approach and requirements</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-green-400 font-medium">Action Mode</span>
                  <span className="text-gray-500 hidden sm:inline">- Ready to build and execute</span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-gray-500">
            {/* Message Count */}
            <div className="flex items-center space-x-1">
              <span>{messages.length} messages</span>
            </div>
            
            {/* Connection Status */}
            <div className="flex items-center space-x-1">
              {isConnected ? (
                <>
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="hidden sm:inline">Connected</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span className="hidden sm:inline">Disconnected</span>
                </>
              )}
            </div>
            
            {/* Timestamp */}
            <div className="hidden md:flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedChatInterface;