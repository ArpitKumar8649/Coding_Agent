import React, { useEffect, useRef } from 'react';
import EnhancedUserMessage from './EnhancedUserMessage';
import EnhancedAssistantMessage from './EnhancedAssistantMessage';
import EnhancedToolExecutionMessage from './EnhancedToolExecutionMessage';
import FileChangeMessage from './FileChangeMessage';
import SystemMessage from './SystemMessage';
import { Bot, MessageSquare } from 'lucide-react';

const EnhancedMessageList = ({ messages, isStreaming, currentMode, currentProject }) => {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'end'
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-gray-400 max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-2xl flex items-center justify-center mb-6 mx-auto">
            <Bot className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold mb-3 text-gray-300">Welcome to Cline</h3>
          <p className="text-sm text-gray-500 leading-relaxed mb-4">
            {currentMode === 'PLAN' 
              ? "I'm in planning mode. Let's discuss your project requirements, architecture, and approach before diving into implementation."
              : "I'm ready to help you build something amazing! Tell me what you'd like to create and I'll get started right away."
            }
          </p>
          <div className="flex items-center justify-center space-x-4 text-xs text-gray-600">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span>Direct API Connection</span>
            </div>
            <span>•</span>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                currentMode === 'PLAN' ? 'bg-blue-400' : 'bg-green-400'
              }`}></div>
              <span>{currentMode} Mode</span>
            </div>
          </div>
          {currentProject && (
            <div className="mt-4 p-3 bg-gray-800 rounded-lg border border-gray-700">
              <div className="text-xs font-medium text-gray-400 mb-1">Active Project</div>
              <div className="text-sm text-gray-300">{currentProject.id}</div>
              <div className="text-xs text-gray-500 mt-1">
                Status: <span className="capitalize">{currentProject.status}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto overflow-x-hidden w-full"
      style={{ scrollBehavior: 'smooth' }}
    >
      <div className="px-3 sm:px-4 py-4 sm:py-6 space-y-2 min-h-full w-full max-w-4xl mx-auto">
        {messages.map((message, index) => {
          const key = message.id || `${message.type}-${index}`;
          
          switch (message.type) {
            case 'user':
              return (
                <EnhancedUserMessage 
                  key={key}
                  content={message.content}
                  timestamp={message.timestamp}
                  mode={message.mode || currentMode}
                  attachments={message.attachments}
                />
              );
              
            case 'assistant':
              return (
                <EnhancedAssistantMessage 
                  key={key}
                  content={message.content}
                  timestamp={message.timestamp}
                  isStreaming={message.isStreaming || (isStreaming && index === messages.length - 1)}
                  mode={message.mode || currentMode}
                  isProgress={message.isProgress}
                  isCompletion={message.isCompletion}
                />
              );
              
            case 'tool_execution':
              return (
                <EnhancedToolExecutionMessage 
                  key={key}
                  toolName={message.toolName}
                  parameters={message.parameters}
                  result={message.result}
                  status={message.status}
                  timestamp={message.timestamp}
                />
              );
              
            case 'file_change':
              return (
                <FileChangeMessage
                  key={key}
                  action={message.action}
                  filePath={message.filePath}
                  content={message.content}
                  diff={message.diff}
                  timestamp={message.timestamp}
                />
              );
              
            case 'system':
              return (
                <SystemMessage 
                  key={key}
                  content={message.content}
                  timestamp={message.timestamp}
                  variant={message.variant}
                />
              );
              
            default:
              // Fallback for unknown message types
              return (
                <div key={key} className="mb-4 p-3 bg-gray-800 border border-gray-700 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Unknown message type: {message.type}</div>
                  <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                    {JSON.stringify(message, null, 2)}
                  </pre>
                </div>
              );
          }
        })}n        
        {/* Invisible element for scrolling */}
        <div ref={messagesEndRef} className="h-1" />
      </div>
    </div>
  );
};

export default EnhancedMessageList;