import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Zap,
  FileText,
  Terminal,
  Code
} from 'lucide-react';

const LiveProgressIndicator = ({ 
  isVisible = false, 
  status = 'idle', // idle, thinking, executing, completed, error
  currentAction = '',
  progress = 0,
  toolName = '',
  onCancel 
}) => {
  const [dots, setDots] = useState('');

  // Animated dots for thinking state
  useEffect(() => {
    if (status === 'thinking') {
      const interval = setInterval(() => {
        setDots(prev => {
          if (prev === '...') return '';
          return prev + '.';
        });
      }, 500);
      return () => clearInterval(interval);
    } else {
      setDots('');
    }
  }, [status]);

  if (!isVisible) return null;

  const getStatusIcon = () => {
    switch (status) {
      case 'thinking':
        return <Activity className="w-4 h-4 text-blue-400 animate-pulse" />;
      case 'executing':
        return getToolIcon();
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getToolIcon = () => {
    switch (toolName) {
      case 'write_to_file':
      case 'replace_in_file':
        return <FileText className="w-4 h-4 text-green-400" />;
      case 'execute_command':
        return <Terminal className="w-4 h-4 text-blue-400" />;
      case 'read_file':
        return <Code className="w-4 h-4 text-yellow-400" />;
      default:
        return <Zap className="w-4 h-4 text-purple-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'thinking':
        return 'border-blue-500/30 bg-blue-500/5';
      case 'executing':
        return 'border-green-500/30 bg-green-500/5';
      case 'completed':
        return 'border-green-500/30 bg-green-500/10';
      case 'error':
        return 'border-red-500/30 bg-red-500/5';
      default:
        return 'border-gray-500/30 bg-gray-500/5';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'thinking':
        return `Thinking${dots}`;
      case 'executing':
        return currentAction || `Executing ${toolName || 'tool'}...`;
      case 'completed':
        return 'Completed successfully';
      case 'error':
        return 'Error occurred';
      default:
        return 'Ready';
    }
  };

  return (
    <div className={`fixed top-20 right-4 z-50 max-w-sm transition-all duration-300 animate-fadeIn`}>
      <div className={`border rounded-lg p-4 backdrop-blur-sm ${getStatusColor()}`}>
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {getStatusIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-300">
              {getStatusText()}
            </div>
            
            {toolName && status === 'executing' && (
              <div className="text-xs text-gray-500 mt-1">
                Tool: {toolName}
              </div>
            )}
            
            {progress > 0 && status === 'executing' && (
              <div className="mt-2">
                <div className="w-full bg-gray-700 rounded-full h-1">
                  <div 
                    className="bg-green-500 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {Math.round(progress)}% complete
                </div>
              </div>
            )}
          </div>
          
          {onCancel && (status === 'thinking' || status === 'executing') && (
            <button
              onClick={onCancel}
              className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded transition-colors"
              title="Cancel"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveProgressIndicator;