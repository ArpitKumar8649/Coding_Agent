import React from 'react';
import { User, Clock, Brain, Zap } from 'lucide-react';
import { formatDistanceToNow } from '../../utils/timeUtils';

const EnhancedUserMessage = ({ content, timestamp, mode = 'ACT', attachments }) => {
  const getModeIcon = () => {
    switch (mode) {
      case 'PLAN':
        return <Brain className="w-3 h-3 text-blue-400" />;
      case 'ACT':
        return <Zap className="w-3 h-3 text-green-400" />;
      default:
        return null;
    }
  };

  const getModeColor = () => {
    switch (mode) {
      case 'PLAN':
        return 'border-blue-500/30';
      case 'ACT':
        return 'border-green-500/30';
      default:
        return 'border-gray-600';
    }
  };

  return (
    <div className="message-user mb-6 animate-fadeIn">
      <div className="flex items-start space-x-3">
        {/* Avatar */}
        <div className="flex-shrink-0 mt-1">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
        </div>
        
        {/* Message Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm font-medium text-gray-300">
              You
            </span>
            {getModeIcon() && (
              <div className="flex items-center space-x-1">
                {getModeIcon()}
                <span className="text-xs text-gray-400">{mode}</span>
              </div>
            )}
          </div>
          
          {/* Message Body */}
          <div className={`message-content bg-gray-700 rounded-lg border ${getModeColor()} p-4`}>
            <div className="text-gray-100">
              {content.split('\n').map((line, index) => (
                <p key={index} className="mb-2 last:mb-0">
                  {line}
                </p>
              ))}
            </div>
            
            {/* Attachments */}
            {attachments && attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="text-xs text-gray-400 font-medium">Attachments:</div>
                {attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 bg-gray-600 rounded text-sm">
                    <span className="text-gray-300">{attachment.name}</span>
                    <span className="text-xs text-gray-400">({attachment.size})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Timestamp */}
          <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{formatDistanceToNow(timestamp)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedUserMessage;