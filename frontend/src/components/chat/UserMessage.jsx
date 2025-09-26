import React from 'react';
import { User, Paperclip } from 'lucide-react';
import { formatTime } from '../../utils/timeUtils';

const UserMessage = ({ content, timestamp, attachments = [] }) => {
  return (
    <div className="message-container mb-6">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-sm font-medium text-gray-300">You</span>
            <span className="text-xs text-gray-500">{formatTime(timestamp)}</span>
          </div>
          
          <div className="bg-gray-700 rounded-2xl rounded-tl-md px-4 py-3 text-gray-100">
            <div className="whitespace-pre-wrap break-words">{content}</div>
            
            {attachments && attachments.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-600">
                <div className="flex items-center space-x-2 text-xs text-gray-400 mb-2">
                  <Paperclip className="w-3 h-3" />
                  <span>{attachments.length} attachment{attachments.length > 1 ? 's' : ''}</span>
                </div>
                <div className="space-y-1">
                  {attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center space-x-2 text-xs">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span className="text-gray-300">{attachment.name}</span>
                      <span className="text-gray-500">({attachment.size})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserMessage;