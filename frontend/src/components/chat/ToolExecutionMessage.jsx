import React, { useState } from 'react';
import { 
  Terminal, 
  FileText, 
  Search, 
  Folder, 
  Code, 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { formatTime } from '../../utils/timeUtils';
import CodeBlock from './CodeBlock';

const ToolExecutionMessage = ({ 
  toolName, 
  parameters, 
  result, 
  status = 'pending', // pending, executing, completed, failed
  timestamp 
}) => {
  const [expanded, setExpanded] = useState(false);

  const getToolIcon = (tool) => {
    const icons = {
      'write_to_file': FileText,
      'replace_in_file': FileText,
      'read_file': FileText,
      'execute_command': Terminal,
      'search_files': Search,
      'list_files': Folder,
      'list_code_definition_names': Code,
      default: Play
    };
    return icons[tool] || icons.default;
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'executing':
        return <Clock className="w-4 h-4 text-yellow-400 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'executing':
        return 'border-yellow-500/30 bg-yellow-500/5';
      case 'completed':
        return 'border-green-500/30 bg-green-500/5';
      case 'failed':
        return 'border-red-500/30 bg-red-500/5';
      default:
        return 'border-gray-600/30 bg-gray-800/30';
    }
  };

  const ToolIcon = getToolIcon(toolName);

  const formatToolName = (name) => {
    return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const renderParameters = () => {
    if (!parameters) return null;
    
    return (
      <div className="mt-3 space-y-2">
        {Object.entries(parameters).map(([key, value]) => (
          <div key={key} className="text-sm">
            <span className="text-gray-400 font-medium">{key}:</span>
            <span className="text-gray-200 ml-2">
              {typeof value === 'string' && value.length > 100 
                ? `${value.substring(0, 100)}...`
                : String(value)
              }
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderResult = () => {
    if (!result) return null;

    if (typeof result === 'string') {
      // Check if it looks like code or output
      if (result.includes('\n') && result.length > 50) {
        return (
          <CodeBlock 
            language="text" 
            code={result} 
            className="mt-3"
          />
        );
      }
      return (
        <div className="mt-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
          <pre className="text-sm text-gray-200 whitespace-pre-wrap">{result}</pre>
        </div>
      );
    }

    return (
      <div className="mt-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
        <pre className="text-sm text-gray-200">
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <div className={`tool-execution-message border rounded-lg p-4 mb-4 ${getStatusColor()}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 p-1.5 bg-gray-700 rounded-lg">
            <ToolIcon className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-200">
                {formatToolName(toolName)}
              </span>
              {getStatusIcon()}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {formatTime(timestamp)}
            </div>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1 text-gray-400 hover:text-gray-300 rounded"
        >
          {expanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 border-t border-gray-700 pt-4">
          {parameters && (
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Parameters:</h4>
              {renderParameters()}
            </div>
          )}

          {result && status === 'completed' && (
            <div className={parameters ? 'mt-4' : ''}>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Result:</h4>
              {renderResult()}
            </div>
          )}

          {status === 'failed' && result && (
            <div className={parameters ? 'mt-4' : ''}>
              <h4 className="text-sm font-medium text-red-400 mb-2">Error:</h4>
              <div className="p-3 bg-red-900/20 border border-red-700/50 rounded-lg">
                <pre className="text-sm text-red-300 whitespace-pre-wrap">{result}</pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ToolExecutionMessage;