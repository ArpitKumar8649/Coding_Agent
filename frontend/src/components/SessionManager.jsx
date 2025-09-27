/**
 * Session Manager Component
 * Manage enhanced Cline sessions with PLAN/ACT modes
 */

import React, { useState, useEffect } from 'react';
import GlassMorphismCard from './GlassMorphismCard';
import {
  ChatBubbleLeftIcon,
  PlusIcon,
  TrashIcon,
  SwitchHorizontalIcon,
  UserIcon,
  CpuChipIcon,
  ClockIcon,
  PlayIcon,
  PauseIcon,
  Cog6ToothIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const SessionManager = ({ apiService, onSessionSelect, currentSessionId }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSession, setNewSession] = useState({
    startMode: 'ACT',
    qualityLevel: 'advanced',
    enableGit: true,
    enableValidation: true,
    enableStreaming: true,
    description: ''
  });

  const modes = [
    { value: 'PLAN', label: 'Plan Mode', description: 'Interactive planning and discussion', color: 'blue' },
    { value: 'ACT', label: 'Act Mode', description: 'Step-by-step implementation', color: 'green' }
  ];

  const qualityLevels = [
    { value: 'poor', label: 'Basic', color: 'gray' },
    { value: 'medium', label: 'Standard', color: 'yellow' },
    { value: 'advanced', label: 'Advanced', color: 'purple' }
  ];

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const response = await apiService.listEnhancedSessions();
      setSessions(response.sessions || []);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      // Fallback to regular chat sessions
      try {
        const fallbackResponse = await apiService.listChatSessions();
        setSessions(fallbackResponse.sessions || []);
      } catch (fallbackError) {
        console.error('Failed to load fallback sessions:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async () => {
    try {
      setCreating(true);
      const response = await apiService.createEnhancedSession(newSession);
      
      if (response.success) {
        await loadSessions();
        setShowCreateForm(false);
        setNewSession({
          startMode: 'ACT',
          qualityLevel: 'advanced',
          enableGit: true,
          enableValidation: true,
          enableStreaming: true,
          description: ''
        });
        
        // Optionally select the new session
        if (onSessionSelect && response.sessionId) {
          onSessionSelect(response.sessionId);
        }
      }
    } catch (error) {
      console.error('Failed to create session:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this session?')) return;
    
    try {
      await apiService.deleteEnhancedSession(sessionId);
      await loadSessions();
      
      // If this was the current session, clear selection
      if (currentSessionId === sessionId && onSessionSelect) {
        onSessionSelect(null);
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const handleSwitchMode = async (sessionId, newMode) => {
    try {
      await apiService.switchEnhancedMode(sessionId, newMode);
      await loadSessions();
    } catch (error) {
      console.error('Failed to switch mode:', error);
    }
  };

  const getModeIcon = (mode) => {
    return mode === 'PLAN' ? <UserIcon className="w-4 h-4" /> : <CpuChipIcon className="w-4 h-4" />;
  };

  const getModeColor = (mode) => {
    return mode === 'PLAN' ? 'blue' : 'green';
  };

  const getQualityColor = (level) => {
    const colors = { poor: 'gray', medium: 'yellow', advanced: 'purple' };
    return colors[level] || 'gray';
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <ChatBubbleLeftIcon className="w-8 h-8 text-blue-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">Session Manager</h2>
            <p className="text-gray-400">Manage enhanced Cline sessions with PLAN/ACT modes</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-colors shadow-lg"
        >
          <PlusIcon className="w-5 h-5" />
          <span>New Session</span>
        </button>
      </div>

      {/* Create Session Form */}
      {showCreateForm && (
        <GlassMorphismCard glowColor="blue" className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <SparklesIcon className="w-5 h-5 mr-2 text-blue-400" />
            Create Enhanced Session
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Session Description (Optional)
              </label>
              <input
                type="text"
                value={newSession.description}
                onChange={(e) => setNewSession(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the purpose of this session..."
                className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Start Mode
                </label>
                <div className="space-y-2">
                  {modes.map(mode => (
                    <label key={mode.value} className="flex items-center space-x-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="startMode"
                        value={mode.value}
                        checked={newSession.startMode === mode.value}
                        onChange={(e) => setNewSession(prev => ({ ...prev, startMode: e.target.value }))}
                        className="border-white/20 bg-black/30 text-blue-400 focus:ring-blue-400"
                      />
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full bg-${mode.color}-400`}></div>
                        <div>
                          <div className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors">
                            {mode.label}
                          </div>
                          <div className="text-xs text-gray-400">{mode.description}</div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Quality Level
                </label>
                <div className="space-y-2">
                  {qualityLevels.map(level => (
                    <label key={level.value} className="flex items-center space-x-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="qualityLevel"
                        value={level.value}
                        checked={newSession.qualityLevel === level.value}
                        onChange={(e) => setNewSession(prev => ({ ...prev, qualityLevel: e.target.value }))}
                        className="border-white/20 bg-black/30 text-purple-400 focus:ring-purple-400"
                      />
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full bg-${level.color}-400`}></div>
                        <span className="text-sm text-white group-hover:text-purple-300 transition-colors">
                          {level.label}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Advanced Features
              </label>
              <div className="space-y-2">
                {[
                  { key: 'enableGit', label: 'Git Awareness', description: 'Auto-commit changes with smart messages' },
                  { key: 'enableValidation', label: 'Real-time Validation', description: 'Validate code as it\'s generated' },
                  { key: 'enableStreaming', label: 'Streaming Generation', description: 'Real-time code generation updates' }
                ].map(feature => (
                  <label key={feature.key} className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={newSession[feature.key]}
                      onChange={(e) => setNewSession(prev => ({ ...prev, [feature.key]: e.target.checked }))}
                      className="rounded border-white/20 bg-black/30 text-green-400 focus:ring-green-400"
                    />
                    <div>
                      <div className="text-sm font-medium text-white group-hover:text-green-300 transition-colors">
                        {feature.label}
                      </div>
                      <div className="text-xs text-gray-400">{feature.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="flex space-x-3 pt-4">
              <button
                onClick={handleCreateSession}
                disabled={creating}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? (
                  <Cog6ToothIcon className="w-5 h-5 animate-spin" />
                ) : (
                  <SparklesIcon className="w-5 h-5" />
                )}
                <span>{creating ? 'Creating...' : 'Create Session'}</span>
              </button>
              
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </GlassMorphismCard>
      )}

      {/* Sessions List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <GlassMorphismCard key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-white/20 rounded mb-3"></div>
              <div className="h-3 bg-white/10 rounded mb-2"></div>
              <div className="h-3 bg-white/10 rounded w-2/3"></div>
            </GlassMorphismCard>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <GlassMorphismCard className="p-12 text-center">
          <ChatBubbleLeftIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl text-white mb-2">No Sessions Yet</h3>
          <p className="text-gray-400 mb-4">Create your first enhanced session</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-colors"
          >
            Get Started
          </button>
        </GlassMorphismCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => (
            <GlassMorphismCard 
              key={session.sessionId || session.id} 
              glowColor={getModeColor(session.mode)}
              className={`p-6 cursor-pointer transition-all ${
                currentSessionId === (session.sessionId || session.id) 
                  ? 'ring-2 ring-blue-400 bg-white/15' 
                  : ''
              }`}
              onClick={() => onSessionSelect?.(session.sessionId || session.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2">
                  {getModeIcon(session.mode)}
                  <span className={`text-sm font-medium text-${getModeColor(session.mode)}-400`}>
                    {session.mode} MODE
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  {session.mode && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSwitchMode(
                          session.sessionId || session.id, 
                          session.mode === 'PLAN' ? 'ACT' : 'PLAN'
                        );
                      }}
                      className="p-1 text-gray-400 hover:text-white transition-colors"
                      title={`Switch to ${session.mode === 'PLAN' ? 'ACT' : 'PLAN'} mode`}
                    >
                      <SwitchHorizontalIcon className="w-4 h-4" />
                    </button>
                  )}
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSession(session.sessionId || session.id);
                    }}
                    className="p-1 text-red-400 hover:text-red-300 transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {session.description || `Session ${(session.sessionId || session.id)?.slice(0, 8)}...`}
                  </h3>
                </div>
                
                <div className="space-y-2 text-sm">
                  {session.qualityLevel && (
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full bg-${getQualityColor(session.qualityLevel)}-400`}></div>
                      <span className="text-gray-400">Quality:</span>
                      <span className={`text-${getQualityColor(session.qualityLevel)}-400 capitalize`}>
                        {session.qualityLevel}
                      </span>
                    </div>
                  )}
                  
                  {session.created && (
                    <div className="flex items-center space-x-2 text-gray-400">
                      <ClockIcon className="w-4 h-4" />
                      <span>Created: {formatTimestamp(session.created)}</span>
                    </div>
                  )}
                  
                  {session.conversationLength !== undefined && (
                    <div className="flex items-center space-x-2 text-gray-400">
                      <ChatBubbleLeftIcon className="w-4 h-4" />
                      <span>Messages: {session.conversationLength}</span>
                    </div>
                  )}
                </div>
                
                {/* Features */}
                {(session.gitEnabled || session.enableGit || session.streamingEnabled || session.enableStreaming) && (
                  <div className="flex flex-wrap gap-1 pt-2 border-t border-white/10">
                    {(session.gitEnabled || session.enableGit) && (
                      <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full">
                        Git
                      </span>
                    )}
                    {(session.streamingEnabled || session.enableStreaming) && (
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                        Streaming
                      </span>
                    )}
                    {(session.validationEnabled || session.enableValidation) && (
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                        Validation
                      </span>
                    )}
                  </div>
                )}
              </div>
            </GlassMorphismCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default SessionManager;