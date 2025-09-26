import React, { useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, Square } from 'lucide-react';

const MessageInput = ({ 
  value, 
  onChange, 
  onSend, 
  onKeyPress, 
  disabled = false, 
  placeholder = "Type your message..." 
}) => {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [value]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    } else if (onKeyPress) {
      onKeyPress(e);
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-end space-x-2">
        {/* Attachment button */}
        <button className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded-lg transition-colors">
          <Paperclip className="w-4 h-4" />
        </button>

        {/* Input area */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full min-h-[44px] max-h-[120px] px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-gray-100 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            rows={1}
          />
          
          {/* Character count or other indicators */}
          {value && (
            <div className="absolute bottom-1 right-2 text-xs text-gray-500">
              {value.length}
            </div>
          )}
        </div>

        {/* Voice input button */}
        <button className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded-lg transition-colors">
          <Mic className="w-4 h-4" />
        </button>

        {/* Send button */}
        <button
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className={`flex-shrink-0 p-2 rounded-lg transition-all ${
            disabled || !value.trim()
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 active:scale-95'
          }`}
        >
          {disabled ? (
            <Square className="w-4 h-4" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Input hints */}
      <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
        <span>
          Press <kbd className="px-1 py-0.5 bg-gray-700 rounded border border-gray-600">Enter</kbd> to send, 
          <kbd className="px-1 py-0.5 bg-gray-700 rounded border border-gray-600 ml-1">Shift + Enter</kbd> for new line
        </span>
        {disabled && (
          <span className="text-yellow-400 flex items-center space-x-1">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            <span>Agent is processing...</span>
          </span>
        )}
      </div>
    </div>
  );
};

export default MessageInput;