import React from 'react';
import { Brain, Zap, ChevronDown } from 'lucide-react';

const EnhancedModeSwitch = ({ currentMode, onModeChange, disabled = false }) => {
  const modes = [
    {
      value: 'PLAN',
      label: 'Plan',
      icon: <Brain className="w-4 h-4" />,
      description: 'Discuss and plan before building',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30'
    },
    {
      value: 'ACT',
      label: 'Act', 
      icon: <Zap className="w-4 h-4" />,
      description: 'Build and execute immediately',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30'
    }
  ];

  const currentModeData = modes.find(mode => mode.value === currentMode) || modes[1];

  return (
    <div className="relative group">
      {/* Current Mode Button */}
      <button
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
          disabled 
            ? 'opacity-50 cursor-not-allowed bg-gray-800 border-gray-600' 
            : `${currentModeData.bgColor} ${currentModeData.borderColor} hover:bg-opacity-20`
        }`}
        disabled={disabled}
      >
        <div className={currentModeData.color}>
          {currentModeData.icon}
        </div>
        <span className={`text-sm font-medium ${currentModeData.color}`}>
          {currentModeData.label}
        </span>
        <ChevronDown className={`w-3 h-3 transition-transform group-hover:rotate-180 ${
          disabled ? 'text-gray-600' : currentModeData.color
        }`} />
      </button>

      {/* Dropdown Menu */}
      {!disabled && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
          <div className="p-2">
            {modes.map((mode) => {
              const isActive = mode.value === currentMode;
              
              return (
                <button
                  key={mode.value}
                  onClick={() => onModeChange(mode.value)}
                  className={`w-full flex items-start space-x-3 p-3 rounded-lg transition-colors text-left ${
                    isActive 
                      ? `${mode.bgColor} ${mode.borderColor} border` 
                      : 'hover:bg-gray-700'
                  }`}
                >
                  <div className={`mt-0.5 ${isActive ? mode.color : 'text-gray-400'}`}>
                    {mode.icon}
                  </div>
                  <div className="flex-1">
                    <div className={`text-sm font-medium mb-1 ${
                      isActive ? mode.color : 'text-gray-300'
                    }`}>
                      {mode.label} Mode
                      {isActive && (
                        <span className="ml-2 text-xs px-2 py-1 bg-gray-700 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {mode.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          
          <div className="px-4 py-3 border-t border-gray-700 bg-gray-750">
            <div className="text-xs text-gray-500">
              <strong>Tip:</strong> Use Plan mode to discuss requirements first, then switch to Act mode for implementation.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedModeSwitch;