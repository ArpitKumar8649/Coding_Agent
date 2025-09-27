import React, { useState } from 'react';
import { 
  Settings, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  ChevronDown, 
  ChevronRight,
  Code,
  FileText,
  Terminal,
  Folder
} from 'lucide-react';
import CodeBlock from './CodeBlock';
import { formatDistanceToNow } from '../../utils/timeUtils';

const EnhancedToolExecutionMessage = ({ 
  toolName, 
  parameters, 
  result, 
  status = 'running', 
  timestamp 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'failed':
      case 'error':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'running':
      case 'executing':
        return <AlertCircle className="w-4 h-4 text-yellow-400 animate-pulse" />;
      default:
        return <Tool className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
      case 'success':
        return 'border-green-500/20 bg-green-500/5';
      case 'failed':
      case 'error':
        return 'border-red-500/20 bg-red-500/5';
      case 'running':
      case 'executing':
        return 'border-yellow-500/20 bg-yellow-500/5';
      default:
        return 'border-gray-500/20 bg-gray-500/5';
    }
  };

  const getToolIcon = (tool) => {
    const toolIcons = {
      'create_file': <FileText className="w-4 h-4" />,
      'edit_file': <Code className="w-4 h-4" />,
      'execute_command': <Terminal className="w-4 h-4" />,
      'read_file': <FileText className="w-4 h-4" />,
      'list_files': <Folder className="w-4 h-4" />,
      'write_file': <FileText className="w-4 h-4" />
    };
    
    return toolIcons[tool] || <Tool className="w-4 h-4" />;
  };

  const formatParameters = (params) => {
    if (!params) return null;
    
    try {
      return JSON.stringify(params, null, 2);
    } catch (e) {
      return String(params);
    }
  };

  const formatResult = (res) => {
    if (!res) return null;
    
    if (typeof res === 'string') {
      return res;
    }
    
    try {
      return JSON.stringify(res, null, 2);
    } catch (e) {
      return String(res);
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'completed':
      case 'success':
        return 'Completed';
      case 'failed':
      case 'error':
        return 'Failed';
      case 'running':
      case 'executing':
        return 'Executing...';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="tool-execution-message mb-4 animate-fadeIn">
      <div className="flex items-start space-x-3">
        {/* Tool Icon */}
        <div className="flex-shrink-0 mt-1">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border-2 ${getStatusColor()}`}>
            {getToolIcon(toolName)}
          </div>
        </div>
        
        {/* Tool Execution Content */}
        <div className="flex-1 min-w-0">
          {/* Tool Header */}
          <div 
            className={`cursor-pointer border rounded-lg p-3 ${getStatusColor()} hover:bg-opacity-20 transition-colors`}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon()}
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-300">
                      {toolName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      status === 'completed' || status === 'success' ? 'bg-green-500/20 text-green-400' :
                      status === 'failed' || status === 'error' ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {getStatusText()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{formatDistanceToNow(timestamp)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </div>
          </div>
          
          {/* Expanded Details */}
          {isExpanded && (
            <div className={`mt-2 border rounded-lg ${getStatusColor()} overflow-hidden`}>
              {/* Parameters */}
              {parameters && (
                <div className="p-3 border-b border-gray-700">
                  <div className="text-xs font-medium text-gray-400 mb-2">Parameters:</div>
                  <CodeBlock
                    language="json"
                    code={formatParameters(parameters)}
                    className="text-xs"
                  />
                </div>
              )}
              
              {/* Result */}
              {result && (
                <div className="p-3">
                  <div className="text-xs font-medium text-gray-400 mb-2">Result:</div>
                  <div className="bg-gray-800 rounded p-3 text-sm text-gray-300 font-mono">
                    <pre className="whitespace-pre-wrap break-words">
                      {formatResult(result)}
                    </pre>
                  </div>
                </div>
              )}
              
              {/* No result yet for running tools */}
              {(status === 'running' || status === 'executing') && !result && (
                <div className="p-3 text-center text-gray-400 text-sm italic">
                  Tool is still executing...
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedToolExecutionMessage;