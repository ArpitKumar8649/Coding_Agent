import React from 'react';
import UserMessage from './UserMessage';
import AssistantMessage from './AssistantMessage';
import ToolExecutionMessage from './ToolExecutionMessage';
import SystemMessage from './SystemMessage';

const MessageList = ({ messages, isStreaming, currentMode }) => {
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-gray-400">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full flex items-center justify-center mb-4 mx-auto">
            <span className="text-2xl">🤖</span>
          </div>
          <h3 className="text-lg font-medium mb-2">Welcome to Cline</h3>
          <p className="text-sm text-gray-500 max-w-xs">
            {currentMode === 'PLAN' 
              ? "Let's plan your project together. Describe what you want to build."
              : "I'm ready to help you code. What would you like me to build or fix?"
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="space-y-1 p-4">
        {messages.map((message, index) => {
          const key = message.id || index;
          
          switch (message.type) {
            case 'user':
              return (
                <UserMessage 
                  key={key}
                  content={message.content}
                  timestamp={message.timestamp}
                  attachments={message.attachments}
                />
              );
              
            case 'assistant':
              return (
                <AssistantMessage 
                  key={key}
                  content={message.content}
                  timestamp={message.timestamp}
                  isStreaming={isStreaming && index === messages.length - 1}
                  mode={message.mode || currentMode}
                />
              );
              
            case 'tool_execution':
              return (
                <ToolExecutionMessage 
                  key={key}
                  toolName={message.toolName}
                  parameters={message.parameters}
                  result={message.result}
                  status={message.status}
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
              return null;
          }
        })}
      </div>
    </div>
  );
};

export default MessageList;