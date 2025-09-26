import React, { useState, useRef, useEffect } from 'react';
import { Send, Settings, Zap, Brain, Play } from 'lucide-react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ModeSwitch from './ModeSwitch';
import './ChatInterface.css';

const ChatInterface = ({ 
  onSendMessage, 
  messages = [], 
  isStreaming = false, 
  currentMode = 'ACT',
  onModeChange,
  agentStatus = 'idle' // idle, thinking, executing
}) => {
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (input.trim() && onSendMessage) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getStatusColor = () => {
    switch (agentStatus) {
      case 'thinking': return 'text-blue-400';
      case 'executing': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusText = () => {
    switch (agentStatus) {
      case 'thinking': return 'Thinking...';
      case 'executing': return 'Executing tools...';
      default: return 'Ready';
    }
  };

  return (
    <div className="chat-interface flex flex-col h-full bg-gray-900 border-l border-gray-700">
      {/* Header */}
      <div className="chat-header flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            {agentStatus !== 'idle' && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            )}
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">Cline Agent</h3>
            <p className={`text-xs ${getStatusColor()}`}>
              {getStatusText()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <ModeSwitch 
            currentMode={currentMode} 
            onModeChange={onModeChange}
          />
          <button className="p-1.5 text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 flex flex-col min-h-0">
        <MessageList 
          messages={messages} 
          isStreaming={isStreaming}
          currentMode={currentMode}
        />
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="chat-input-container border-t border-gray-700 bg-gray-800">
        <MessageInput
          value={input}
          onChange={setInput}
          onSend={handleSendMessage}
          onKeyPress={handleKeyPress}
          disabled={isStreaming}
          placeholder={
            currentMode === 'PLAN' 
              ? "Describe what you want to build or discuss the approach..."
              : "Tell me what you want me to do..."
          }
        />
      </div>

      {/* Mode Indicator */}
      <div className="px-4 py-2 bg-gray-800 border-t border-gray-700">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            {currentMode === 'PLAN' ? (
              <>
                <Brain className="w-3 h-3 text-blue-400" />
                <span className="text-blue-400">Planning Mode</span>
                <span className="text-gray-500">- Discuss and plan before implementation</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 text-green-400" />
                <span className="text-green-400">Action Mode</span>
                <span className="text-gray-500">- Ready to execute and build</span>
              </>
            )}
          </div>
          <div className="text-gray-500">
            {messages.length} messages
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;