import React from 'react';
import { 
  Info, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Settings,
  GitBranch
} from 'lucide-react';
import { formatTimestamp } from '../../utils/timeUtils';

const SystemMessage = ({ 
  content, 
  timestamp, 
  variant = 'info' // info, warning, success, error, git, mode
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return {
          bg: 'bg-yellow-500/10 border-yellow-500/30',
          text: 'text-yellow-300',
          icon: AlertTriangle
        };
      case 'success':
        return {
          bg: 'bg-green-500/10 border-green-500/30',
          text: 'text-green-300',
          icon: CheckCircle
        };
      case 'error':
        return {
          bg: 'bg-red-500/10 border-red-500/30',
          text: 'text-red-300',
          icon: XCircle
        };
      case 'git':
        return {
          bg: 'bg-purple-500/10 border-purple-500/30',
          text: 'text-purple-300',
          icon: GitBranch
        };
      case 'mode':
        return {
          bg: 'bg-blue-500/10 border-blue-500/30',
          text: 'text-blue-300',
          icon: Settings
        };
      default:
        return {
          bg: 'bg-gray-500/10 border-gray-500/30',
          text: 'text-gray-300',
          icon: Info
        };
    }
  };

  const { bg, text, icon: Icon } = getVariantStyles();

  return (
    <div className={`system-message flex items-center justify-center py-2 mb-4`}>
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-full border ${bg}`}>
        <Icon className={`w-3 h-3 ${text}`} />
        <span className={`text-xs ${text}`}>
          {content}
        </span>
        <span className="text-xs text-gray-500">
          {formatTimestamp(timestamp)}
        </span>
      </div>
    </div>
  );
};

export default SystemMessage;