/**
 * Main Dashboard Component
 * Central hub with navigation and integrated panels
 */

import React, { useState, useEffect } from 'react';
import GlassMorphismCard from './GlassMorphismCard';
import ProjectDashboard from './ProjectDashboard';
import AdvancedGenerationPanel from './AdvancedGenerationPanel';
import SessionManager from './SessionManager';
import SystemMonitor from './SystemMonitor';
import CodeWorkspace from './CodeWorkspace';
import ComprehensiveAPIService from '../services/ComprehensiveAPIService';
import {
  HomeIcon,
  RocketLaunchIcon,
  SparklesIcon,
  ChatBubbleLeftIcon,
  ServerIcon,
  Bars3Icon,
  XMarkIcon,
  BoltIcon,
  ChartBarIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';

const MainDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [apiService] = useState(() => new ComprehensiveAPIService());
  const [systemStatus, setSystemStatus] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);
  const [currentProject, setCurrentProject] = useState(null);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: HomeIcon, color: 'blue' },
    { id: 'workspace', label: 'Code Workspace', icon: CodeBracketIcon, color: 'indigo' },
    { id: 'projects', label: 'Projects', icon: RocketLaunchIcon, color: 'green' },
    { id: 'generation', label: 'Code Generation', icon: SparklesIcon, color: 'purple' },
    { id: 'sessions', label: 'Sessions', icon: ChatBubbleLeftIcon, color: 'blue' },
    { id: 'monitor', label: 'System Monitor', icon: ServerIcon, color: 'cyan' }
  ];

  useEffect(() => {
    loadSystemStatus();
  }, []);

  const loadSystemStatus = async () => {
    try {
      const status = await apiService.runSystemCheck();
      setSystemStatus(status);
    } catch (error) {
      console.error('Failed to load system status:', error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'projects':
        return (
          <ProjectDashboard 
            apiService={apiService} 
            onProjectSelect={setCurrentProject}
          />
        );
      
      case 'generation':
        return (
          <AdvancedGenerationPanel 
            apiService={apiService}
            onGenerated={(result) => console.log('Generated:', result)}
          />
        );
      
      case 'sessions':
        return (
          <SessionManager 
            apiService={apiService}
            onSessionSelect={setCurrentSession}
            currentSessionId={currentSession}
          />
        );
      
      case 'monitor':
        return <SystemMonitor apiService={apiService} />;
      
      default:
        return (
          <div className="space-y-6">
            {/* Welcome Header */}
            <div className="text-center py-12">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <BoltIcon className="w-12 h-12 text-white" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
                </div>
              </div>
              
              <h1 className="text-4xl font-bold text-white mb-4">
                Advanced Cline Dashboard
              </h1>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Comprehensive AI-powered development platform with autonomous coding, 
                advanced generation, and intelligent session management.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <GlassMorphismCard glowColor="blue" className="p-6 text-center">
                <RocketLaunchIcon className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                <div className="text-2xl font-bold text-white mb-1">0</div>
                <div className="text-sm text-gray-400">Active Projects</div>
              </GlassMorphismCard>
              
              <GlassMorphismCard glowColor="purple" className="p-6 text-center">
                <SparklesIcon className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                <div className="text-2xl font-bold text-white mb-1">0</div>
                <div className="text-sm text-gray-400">Generations</div>
              </GlassMorphismCard>
              
              <GlassMorphismCard glowColor="green" className="p-6 text-center">
                <ChatBubbleLeftIcon className="w-8 h-8 text-green-400 mx-auto mb-3" />
                <div className="text-2xl font-bold text-white mb-1">0</div>
                <div className="text-sm text-gray-400">Active Sessions</div>
              </GlassMorphismCard>
              
              <GlassMorphismCard glowColor="cyan" className="p-6 text-center">
                <ChartBarIcon className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
                <div className="text-2xl font-bold text-white mb-1">
                  {systemStatus?.success ? '✓' : '?'}
                </div>
                <div className="text-sm text-gray-400">System Status</div>
              </GlassMorphismCard>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GlassMorphismCard glowColor="blue" className="p-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <RocketLaunchIcon className="w-6 h-6 mr-2 text-blue-400" />
                  Autonomous Project Creation
                </h3>
                <p className="text-gray-400 mb-4">
                  Create complete projects with AI assistance. Specify your requirements 
                  and let the system build everything from components to API integrations.
                </p>
                <button 
                  onClick={() => setActiveTab('projects')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Project
                </button>
              </GlassMorphismCard>
              
              <GlassMorphismCard glowColor="purple" className="p-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <SparklesIcon className="w-6 h-6 mr-2 text-purple-400" />
                  Advanced Code Generation
                </h3>
                <p className="text-gray-400 mb-4">
                  Generate high-quality code with multiple quality levels, streaming 
                  generation, and bulk file creation with dependency management.
                </p>
                <button 
                  onClick={() => setActiveTab('generation')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Generate Code
                </button>
              </GlassMorphismCard>
              
              <GlassMorphismCard glowColor="green" className="p-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <ChatBubbleLeftIcon className="w-6 h-6 mr-2 text-green-400" />
                  Enhanced Sessions
                </h3>
                <p className="text-gray-400 mb-4">
                  Manage intelligent sessions with PLAN/ACT modes, git awareness, 
                  real-time validation, and sophisticated system prompts.
                </p>
                <button 
                  onClick={() => setActiveTab('sessions')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Manage Sessions
                </button>
              </GlassMorphismCard>
              
              <GlassMorphismCard glowColor="cyan" className="p-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <ServerIcon className="w-6 h-6 mr-2 text-cyan-400" />
                  System Monitoring
                </h3>
                <p className="text-gray-400 mb-4">
                  Monitor system health, service status, advanced capabilities, 
                  and performance metrics in real-time.
                </p>
                <button 
                  onClick={() => setActiveTab('monitor')}
                  className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
                >
                  View Monitor
                </button>
              </GlassMorphismCard>
            </div>

            {/* System Status Overview */}
            {systemStatus && (
              <GlassMorphismCard glowColor="orange" className="p-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <CpuChipIcon className="w-6 h-6 mr-2 text-orange-400" />
                  System Status Overview
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(systemStatus.services || {}).map(([service, info]) => (
                    <div key={service} className="bg-black/20 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white capitalize">
                          {service.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <div className={`w-3 h-3 rounded-full ${
                          info.status === 'healthy' || info.status === 'available' 
                            ? 'bg-green-400' 
                            : 'bg-red-400'
                        }`}></div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {info.status === 'healthy' || info.status === 'available' ? 'Online' : 'Offline'}
                      </div>
                    </div>
                  ))}
                </div>
              </GlassMorphismCard>
            )}
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 flex-shrink-0`}>
        <GlassMorphismCard className="h-full rounded-none rounded-r-xl" intensity="high">
          <div className="p-6">
            {/* Logo/Header */}
            <div className="flex items-center justify-between mb-8">
              <div className={`flex items-center space-x-3 ${!sidebarOpen && 'justify-center'}`}>
                {sidebarOpen ? (
                  <>
                    <BoltIcon className="w-8 h-8 text-blue-400" />
                    <span className="text-xl font-bold text-white">Cline AI</span>
                  </>
                ) : (
                  <BoltIcon className="w-8 h-8 text-blue-400" />
                )}
              </div>
              
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                {sidebarOpen ? (
                  <XMarkIcon className="w-5 h-5" />
                ) : (
                  <Bars3Icon className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Navigation */}
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? `bg-${tab.color}-500/20 text-${tab.color}-400 border border-${tab.color}-400/30`
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    } ${!sidebarOpen && 'justify-center'}`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {sidebarOpen && (
                      <span className="font-medium">{tab.label}</span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </GlassMorphismCard>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default MainDashboard;