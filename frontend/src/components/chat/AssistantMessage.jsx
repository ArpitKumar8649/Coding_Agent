import React from 'react';
import { Brain, Play, Copy, Check } from 'lucide-react';
import { formatTime } from '../../utils/timeUtils';
import CodeBlock from './CodeBlock';
import StreamingText from './StreamingText';

const AssistantMessage = ({ 
  content, 
  timestamp, 
  isStreaming = false,
  mode = 'ACT'
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const renderContent = () => {
    if (isStreaming) {
      return <StreamingText content={content} />;
    }

    // Parse content for code blocks and regular text
    const parts = content.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        // Extract language and code
        const lines = part.slice(3, -3).split('\n');
        const language = lines[0].trim() || 'text';
        const code = lines.slice(1).join('\n');
        
        return (
          <CodeBlock 
            key={index}
            language={language}
            code={code}
            className="my-3"
          />
        );
      }
      
      // Regular text with markdown-like formatting
      return (
        <div key={index} className="whitespace-pre-wrap break-words">
          {formatText(part)}
        </div>
      );
    });
  };

  const formatText = (text) => {
    // Simple markdown-like formatting
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-700 px-1 py-0.5 rounded text-sm font-mono text-blue-300">$1</code>')
      .split('\n')
      .map((line, i) => (
        <div key={i} dangerouslySetInnerHTML={{ __html: line || '<br>' }} />
      ));
  };

  return (
    <div className="message-container mb-6">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            mode === 'PLAN' 
              ? 'bg-gradient-to-br from-blue-500 to-blue-600'
              : 'bg-gradient-to-br from-green-500 to-green-600'
          }`}>
            {mode === 'PLAN' ? (
              <Brain className="w-4 h-4 text-white" />
            ) : (
              <Play className="w-4 h-4 text-white" />
            )}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-300">
                Cline
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                mode === 'PLAN' 
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'bg-green-500/20 text-green-300 border border-green-500/30'
              }`}>
                {mode}
              </span>
              <span className="text-xs text-gray-500">{formatTime(timestamp)}</span>
            </div>
            
            <button
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-300 transition-all"
            >
              {copied ? (
                <Check className="w-3 h-3 text-green-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
          
          <div className="group bg-gray-800/50 rounded-2xl rounded-tl-md px-4 py-3 text-gray-200 border border-gray-700/50">
            {renderContent()}
            
            {isStreaming && (
              <div className="flex items-center space-x-1 mt-2 text-xs text-gray-400">
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
                  <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span>Thinking...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssistantMessage;