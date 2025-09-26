import React from 'react';
import { Brain, Play } from 'lucide-react';

const ModeSwitch = ({ currentMode, onModeChange }) => {
  return (
    <div className="flex items-center bg-gray-700 rounded-lg p-1">
      <button
        onClick={() => onModeChange('PLAN')}
        className={`flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
          currentMode === 'PLAN'
            ? 'bg-blue-600 text-white shadow-md'
            : 'text-gray-400 hover:text-gray-300 hover:bg-gray-600'
        }`}
      >
        <Brain className="w-3 h-3" />
        <span>Plan</span>
      </button>
      
      <button
        onClick={() => onModeChange('ACT')}
        className={`flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
          currentMode === 'ACT'
            ? 'bg-green-600 text-white shadow-md'
            : 'text-gray-400 hover:text-gray-300 hover:bg-gray-600'
        }`}
      >
        <Play className="w-3 h-3" />
        <span>Act</span>
      </button>
    </div>
  );
};

export default ModeSwitch;