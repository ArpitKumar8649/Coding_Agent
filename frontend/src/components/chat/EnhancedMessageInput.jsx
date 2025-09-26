import React, { useState, useRef, useEffect } from 'react';
import { Send, Square, Mic, Paperclip, Code, Zap, Brain } from 'lucide-react';

const EnhancedMessageInput = ({ 
  value, 
  onChange, 
  onSend, 
  disabled = false, 
  placeholder = 'Type your message...', 
  currentMode = 'ACT',
  isStreaming = false,
  onCancel
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [rows, setRows] = useState(1);
  const textareaRef = useRef(null);
  const maxRows = 6;

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const lineHeight = 24; // Approximate line height
      const newRows = Math.min(Math.max(1, Math.ceil(scrollHeight / lineHeight)), maxRows);
      setRows(newRows);
      textarea.style.height = `${Math.min(scrollHeight, lineHeight * maxRows)}px`;
    }
  }, [value]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled && !isStreaming) {
        onSend();
      }
    }
  };

  const handleSend = () => {
    if (value.trim() && !disabled && !isStreaming) {
      onSend();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  const getModeColor = () => {
    switch (currentMode) {
      case 'PLAN':
        return 'border-blue-500/50 focus-within:border-blue-400';
      case 'ACT':
        return 'border-green-500/50 focus-within:border-green-400';
      default:
        return 'border-gray-600 focus-within:border-gray-500';
    }
  };

  const getModeIcon = () => {
    switch (currentMode) {
      case 'PLAN':
        return <Brain className="w-4 h-4 text-blue-400" />;
      case 'ACT':
        return <Zap className="w-4 h-4 text-green-400" />;
      default:
        return <Code className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="px-4 py-4 bg-gray-800 border-t border-gray-700">
      {/* Input Container */}
      <div className={`relative border-2 rounded-xl transition-colors ${
        isFocused ? getModeColor() : 'border-gray-700'
      } ${disabled ? 'opacity-50' : ''}`}>
        
        {/* Mode Indicator */}
        <div className="absolute left-3 top-3 z-10">
          {getModeIcon()}
        </div>
        
        {/* Text Input */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled || isStreaming}
          className={`w-full pl-12 pr-20 py-3 bg-transparent text-gray-100 placeholder-gray-500 border-0 outline-none resize-none ${
            rows > 1 ? 'leading-6' : ''
          }`}
          rows={rows}
          style={{ minHeight: '48px' }}
        />
        
        {/* Action Buttons */}
        <div className="absolute right-2 top-2 bottom-2 flex items-center space-x-1">
          {/* Additional Actions (hidden on mobile) */}
          <div className="hidden sm:flex items-center space-x-1">
            <button
              type="button"
              className="p-2 text-gray-500 hover:text-gray-400 hover:bg-gray-700 rounded-lg transition-colors"
              title="Attach file"
              disabled={disabled}
            >
              <Paperclip className="w-4 h-4" />
            </button>
            
            <button
              type="button"
              className="p-2 text-gray-500 hover:text-gray-400 hover:bg-gray-700 rounded-lg transition-colors"
              title="Voice input"
              disabled={disabled}
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>
          
          {/* Send/Cancel Button */}
          {isStreaming ? (
            <button
              onClick={handleCancel}
              className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              title="Stop generation"
            >
              <Square className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!value.trim() || disabled}
              className={`p-2 rounded-lg transition-colors ${
                value.trim() && !disabled
                  ? currentMode === 'PLAN'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      
      {/* Helper Text */}
      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
        <div className="flex items-center space-x-4">
          <span>Press Enter to send, Shift+Enter for new line</span>
          {value.length > 0 && (
            <span>{value.length} characters</span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {currentMode === 'PLAN' && (
            <span className="text-blue-400">Planning Mode</span>
          )}
          {currentMode === 'ACT' && (
            <span className="text-green-400">Action Mode</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedMessageInput;