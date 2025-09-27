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
  AlertTriangle,
  Upload,
  Users,
  Zap,
  TrendingUp,
  FileText
} from 'lucide-react';
import EnhancedMessageList from './EnhancedMessageList';
import EnhancedMessageInput from './EnhancedMessageInput';
import EnhancedModeSwitch from './EnhancedModeSwitch';
import LiveProgressIndicator from './LiveProgressIndicator';

const AdvancedChatInterface = ({ 
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
  onCancelProject,
  onUploadFile,
  onJoinCollaboration,
  streamingFeatures = {},
  stats = {},
  performanceStats = {}
}) => {
  const [input, setInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const chatContainerRef = useRef(null);
  const fileInputRef = useRef(null);

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

  // File upload handlers
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    files.forEach(file => {
      if (onUploadFile) {
        onUploadFile(file);
      }
    });
    event.target.value = ''; // Reset input
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      if (onUploadFile) {
        onUploadFile(file);
      }
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
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

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div 
      className={`flex flex-col h-screen w-full bg-gray-900 overflow-hidden ${dragActive ? 'bg-blue-900/20' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      
      {/* Enhanced Header */}
      <div className="flex-shrink-0 w-full">
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-700 bg-gray-800">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            {/* Agent Avatar with enhanced status */}
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              {(isStreaming || agentStatus !== 'idle') && (
                <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full animate-pulse"></div>
              )}
              {streamingFeatures.optimizedStreaming && (
                <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-purple-400 rounded-full"></div>
              )}
            </div>
            
            {/* Enhanced Agent Info */}
            <div className="min-w-0 flex-1">
              <h3 className="text-white font-semibold text-sm sm:text-base truncate">
                Advanced Cline Agent
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
                
                {/* Feature indicators */}
                <div className="flex items-center space-x-1">
                  {streamingFeatures.compression && (
                    <span className="text-xs text-green-400" title="Compression enabled">🗜️</span>
                  )}
                  {streamingFeatures.fileTransfer && (
                    <span className="text-xs text-blue-400" title="File transfer available">📁</span>
                  )}
                  {streamingFeatures.collaboration && (
                    <span className="text-xs text-purple-400" title="Collaboration ready">👥</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Enhanced Header Actions */}
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            {/* Performance Stats Toggle */}
            <button
              onClick={() => setShowStats(!showStats)}
              className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                showStats 
                  ? 'text-green-400 bg-green-500/10' 
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
              }`}
              title="Performance Stats"
            >
              <TrendingUp className="w-4 h-4" />
            </button>
            
            {/* File Upload */}
            {streamingFeatures.fileTransfer && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 sm:p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
                title="Upload Files"
              >
                <Upload className="w-4 h-4" />
              </button>
            )}
            
            {/* Collaboration */}
            {streamingFeatures.collaboration && (
              <button
                onClick={() => onJoinCollaboration && onJoinCollaboration('default-room')}
                className="p-1.5 sm:p-2 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-colors"
                title="Join Collaboration"
              >
                <Users className="w-4 h-4" />
              </button>
            )}
            
            {/* Mode Switch */}
            <div className="hidden sm:block">
              <EnhancedModeSwitch 
                currentMode={currentMode} 
                onModeChange={onModeChange}
                disabled={isStreaming || !isConnected}
              />
            </div>
            
            {/* Connection Status */}
            {connectionError && (
              <button
                onClick={onReconnect}
                className="p-1.5 sm:p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Reconnect"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            
            {/* Actions Menu */}
            <div className="flex items-center space-x-1">
              {messages.length > 0 && (
                <button
                  onClick={onClearMessages}
                  className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                  title="Clear messages"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Performance Stats Panel */}
        {showStats && (
          <div className="bg-gray-800 border-b border-gray-700 p-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="text-center">
                <div className="text-gray-400">Messages</div>
                <div className="text-white font-mono">{stats.messagesSent || 0} / {stats.messagesReceived || 0}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400">Streams</div>
                <div className="text-white font-mono">{stats.streamsActive || 0} active</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400">Data</div>
                <div className="text-white font-mono">{formatBytes(performanceStats.wsStats?.bytesTransferred || 0)}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400">Reconnects</div>
                <div className="text-white font-mono">{stats.reconnections || 0}</div>
              </div>
            </div>
          </div>
        )}
        
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

      {/* Chat Content */}
      <div 
        ref={chatContainerRef}
        className="flex-1 min-h-0 relative w-full"
      >
        <EnhancedMessageList 
          messages={messages}
          isStreaming={isStreaming}
          currentMode={currentMode}
          currentProject={currentProject}
        />
        
        {/* Drag and Drop Overlay */}
        {dragActive && (
          <div className="absolute inset-0 bg-blue-600/20 border-2 border-dashed border-blue-400 flex items-center justify-center z-50">
            <div className="text-center">
              <Upload className="w-12 h-12 text-blue-400 mx-auto mb-2" />
              <p className="text-blue-300 font-medium">Drop files here to upload</p>
            </div>
          </div>
        )}
        
        {/* Overlay for disconnected state */}
        {!isConnected && !connectionError && (
          <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center p-4">
            <div className="text-center max-w-sm mx-auto">
              <div className="w-8 h-8 sm:w-12 sm:h-12 border-3 sm:border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3 sm:mb-4"></div>
              <p className="text-gray-300 mb-2 text-sm sm:text-base">Connecting to Advanced Cline API...</p>
              <p className="text-gray-500 text-xs sm:text-sm">Initializing optimized streaming features</p>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Input Area */}
      <div className="flex-shrink-0 w-full">
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
              ? "Connecting to Advanced Cline API..."
              : currentMode === 'PLAN' 
                ? "Describe your project or ask questions..."
                : "Tell me what you want me to build..."
          }
          features={streamingFeatures}
        />
      </div>

      {/* Enhanced Live Progress Indicator */}
      <LiveProgressIndicator
        isVisible={isStreaming || agentStatus !== 'idle'}
        status={agentStatus}
        currentAction={isStreaming ? 'Processing with optimized streaming...' : ''}
        onCancel={handleCancelGeneration}
        features={streamingFeatures}
      />

      {/* Enhanced Status Bar */}
      <div className="flex-shrink-0 px-3 sm:px-4 py-2 bg-gray-800 border-t border-gray-700 w-full">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
            {/* Current Mode */}
            <div className="flex items-center space-x-1 sm:space-x-2 min-w-0">
              {currentMode === 'PLAN' ? (
                <>
                  <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
                  <span className="text-blue-400 font-medium text-xs">Plan</span>
                  <span className="text-gray-500 hidden md:inline text-xs truncate">- Advanced planning mode</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></div>
                  <span className="text-green-400 font-medium text-xs">Act</span>
                  <span className="text-gray-500 hidden md:inline text-xs truncate">- Optimized execution mode</span>
                </>
              )}
            </div>
            
            {/* Mobile Mode Switch */}
            <div className="sm:hidden">
              <button
                onClick={() => onModeChange(currentMode === 'PLAN' ? 'ACT' : 'PLAN')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  currentMode === 'PLAN'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-green-500/20 text-green-400 border border-green-500/30'
                }`}
                disabled={isStreaming || !isConnected}
              >
                Switch to {currentMode === 'PLAN' ? 'Act' : 'Plan'}
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-gray-500">
            {/* Message Count */}
            <div className="flex items-center space-x-1">
              <span>{messages.length} messages</span>
            </div>
            
            {/* Connection Status with features */}
            <div className="flex items-center space-x-1">
              {isConnected ? (
                <>
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="hidden sm:inline">
                    {Object.keys(streamingFeatures).length > 0 ? 'Advanced' : 'Connected'}
                  </span>
                  {streamingFeatures.optimizedStreaming && (
                    <Zap className="w-3 h-3 text-yellow-400" title="Optimized streaming active" />
                  )}
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

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileUpload}
        className="hidden"
        accept="*/*"
      />
    </div>
  );
};

export default AdvancedChatInterface;