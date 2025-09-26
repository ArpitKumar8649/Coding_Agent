import React, { useState } from 'react';
import { 
  FileText, 
  FilePlus, 
  FileEdit, 
  Clock, 
  ChevronDown, 
  ChevronRight,
  Copy,
  Check
} from 'lucide-react';
import { formatDistanceToNow } from '../../utils/timeUtils';

const FileChangeMessage = ({ action, filePath, content, diff, timestamp }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const getActionIcon = () => {
    switch (action) {
      case 'file_created':
        return <FilePlus className="w-4 h-4 text-green-400" />;
      case 'file_updated':
        return <FileEdit className="w-4 h-4 text-blue-400" />;
      default:
        return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  const getActionColor = () => {
    switch (action) {
      case 'file_created':
        return 'border-green-500/20 bg-green-500/5';
      case 'file_updated':
        return 'border-blue-500/20 bg-blue-500/5';
      default:
        return 'border-gray-500/20 bg-gray-500/5';
    }
  };

  const getActionText = () => {
    switch (action) {
      case 'file_created':
        return 'Created';
      case 'file_updated':
        return 'Updated';
      default:
        return 'Modified';
    }
  };

  const handleCopyPath = async () => {
    try {
      await navigator.clipboard.writeText(filePath);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy path:', err);
    }
  };

  const getFileName = (path) => {
    return path.split('/').pop() || path;
  };

  const getFileExtension = (path) => {
    const extension = path.split('.').pop();
    return extension !== path ? extension : '';
  };

  const renderDiff = (diffText) => {
    if (!diffText) return null;
    
    const lines = diffText.split('\n');
    return (
      <div className="bg-gray-900 rounded p-3 font-mono text-sm overflow-x-auto">
        {lines.map((line, index) => {
          let className = 'whitespace-pre';
          if (line.startsWith('+')) {
            className += ' text-green-400 bg-green-400/10';
          } else if (line.startsWith('-')) {
            className += ' text-red-400 bg-red-400/10';
          } else if (line.startsWith('@@')) {
            className += ' text-blue-400 bg-blue-400/10 font-bold';
          } else {
            className += ' text-gray-300';
          }
          
          return (
            <div key={index} className={className}>
              {line || ' '}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="file-change-message mb-4 animate-fadeIn">
      <div className="flex items-start space-x-3">
        {/* File Icon */}
        <div className="flex-shrink-0 mt-1">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border-2 ${getActionColor()}`}>
            {getActionIcon()}
          </div>
        </div>
        
        {/* File Change Content */}
        <div className="flex-1 min-w-0">
          {/* File Header */}
          <div 
            className={`cursor-pointer border rounded-lg p-3 ${getActionColor()} hover:bg-opacity-20 transition-colors`}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      action === 'file_created' ? 'bg-green-500/20 text-green-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {getActionText()}
                    </span>
                    <span className="text-sm font-medium text-gray-300 truncate">
                      {getFileName(filePath)}
                    </span>
                    {getFileExtension(filePath) && (
                      <span className="text-xs text-gray-500 uppercase">
                        {getFileExtension(filePath)}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyPath();
                      }}
                      className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-400 transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3 text-green-400" />
                          <span className="text-green-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span className="truncate max-w-xs">{filePath}</span>
                        </>
                      )}
                    </button>
                    <span className="text-gray-600">•</span>
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatDistanceToNow(timestamp)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {(content || diff) && (
                  <>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Expanded Content */}
          {isExpanded && (content || diff) && (
            <div className={`mt-2 border rounded-lg ${getActionColor()} overflow-hidden`}>
              {diff && (
                <div className="p-3">
                  <div className="text-xs font-medium text-gray-400 mb-2">Changes:</div>
                  {renderDiff(diff)}
                </div>
              )}
              
              {content && !diff && (
                <div className="p-3">
                  <div className="text-xs font-medium text-gray-400 mb-2">Content:</div>
                  <div className="bg-gray-900 rounded p-3 text-sm text-gray-300 font-mono max-h-64 overflow-y-auto">
                    <pre className="whitespace-pre-wrap break-words">
                      {content}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileChangeMessage;