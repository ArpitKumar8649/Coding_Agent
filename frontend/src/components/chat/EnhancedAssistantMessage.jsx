import React, { useState, useEffect } from 'react';
import { Bot, Clock, Zap, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import CodeBlock from './CodeBlock';
import { formatDistanceToNow } from '../../utils/timeUtils';

const EnhancedAssistantMessage = ({ 
  content, 
  timestamp, 
  isStreaming = false, 
  mode = 'ACT',
  isProgress = false,
  isCompletion = false
}) => {
  const [displayContent, setDisplayContent] = useState('');
  const [codeBlocks, setCodeBlocks] = useState([]);

  useEffect(() => {
    if (content) {
      parseContentWithCodeBlocks(content);
    }
  }, [content]);

  const parseContentWithCodeBlocks = (text) => {
    if (!text || typeof text !== 'string') {
      setDisplayContent('');
      setCodeBlocks([]);
      return;
    }
    
    // Parse code blocks from markdown-style content
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)\n```/g;
    const blocks = [];
    let lastIndex = 0;
    let match;
    let parsedContent = '';

    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Add text before code block
      parsedContent += text.slice(lastIndex, match.index);
      
      // Add placeholder for code block
      const blockId = blocks.length;
      parsedContent += `[CODE_BLOCK_${blockId}]`;
      
      // Store code block
      blocks.push({
        id: blockId,
        language: match[1] || 'text',
        code: match[2].trim()
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    parsedContent += text.slice(lastIndex);
    
    setDisplayContent(parsedContent);
    setCodeBlocks(blocks);
  };

  const renderContentWithCodeBlocks = (text) => {
    const parts = text.split(/\[CODE_BLOCK_(\d+)\]/);
    const result = [];
    
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        // Regular text
        if (parts[i]) {
          result.push(
            <div key={`text-${i}`} className="prose prose-invert max-w-none">
              {parts[i].split('\n').map((line, lineIndex) => (
                <p key={lineIndex} className="mb-2 last:mb-0">
                  {line}
                </p>
              ))}
            </div>
          );
        }
      } else {
        // Code block placeholder
        const blockIndex = parseInt(parts[i]);
        const block = codeBlocks[blockIndex];
        if (block) {
          result.push(
            <CodeBlock
              key={`code-${i}`}
              language={block.language}
              code={block.code}
              className="my-4"
            />
          );
        }
      }
    }
    
    return result;
  };

  const getModeIcon = () => {
    switch (mode) {
      case 'PLAN':
        return <FileText className="w-4 h-4 text-blue-400" />;
      case 'ACT':
        return <Zap className="w-4 h-4 text-green-400" />;
      default:
        return <Bot className="w-4 h-4 text-purple-400" />;
    }
  };

  const getModeColor = () => {
    switch (mode) {
      case 'PLAN':
        return 'border-blue-500/20 bg-blue-500/5';
      case 'ACT':
        return 'border-green-500/20 bg-green-500/5';
      default:
        return 'border-purple-500/20 bg-purple-500/5';
    }
  };

  const getMessageIcon = () => {
    if (isProgress) {
      return <Clock className="w-4 h-4 text-yellow-400 animate-pulse" />;
    }
    if (isCompletion) {
      return <CheckCircle className="w-4 h-4 text-green-400" />;
    }
    return getModeIcon();
  };

  return (
    <div className="message-assistant mb-6 animate-fadeIn">
      <div className="flex items-start space-x-3">
        {/* Avatar */}
        <div className="flex-shrink-0 mt-1">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${getModeColor()}`}>
            {getMessageIcon()}
          </div>
        </div>
        
        {/* Message Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm font-medium text-gray-300">
              Cline Agent
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${getModeColor()}`}>
              {mode}
            </span>
            {isStreaming && (
              <div className="flex items-center space-x-1 text-xs text-gray-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Typing...</span>
              </div>
            )}
          </div>
          
          {/* Message Body */}
          <div className={`message-content bg-gray-800 rounded-lg border ${getModeColor()} p-4`}>
            {displayContent ? (
              <div className="space-y-4">
                {renderContentWithCodeBlocks(displayContent)}
              </div>
            ) : (
              <div className="text-gray-300">
                {content || (
                  <div className="flex items-center space-x-2 text-gray-400">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                )}
              </div>
            )}
            
            {isStreaming && content && (
              <div className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1"></div>
            )}
          </div>
          
          {/* Timestamp */}
          <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{formatDistanceToNow(timestamp)}</span>
            {isProgress && (
              <span className="text-yellow-400 font-medium">• In Progress</span>
            )}
            {isCompletion && (
              <span className="text-green-400 font-medium">• Completed</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAssistantMessage;