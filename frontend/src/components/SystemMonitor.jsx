/**
 * System Monitor Component
 * Displays comprehensive system health and statistics
 */

import React, { useState, useEffect } from 'react';
import GlassMorphismCard from './GlassMorphismCard';
import {
  HeartIcon,
  ChartBarIcon,
  ServerIcon,
  CpuChipIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const SystemMonitor = ({ apiService }) => {
  const [systemStatus, setSystemStatus] = useState(null);
  const [capabilities, setCapabilities] = useState(null);
  const [agentStats, setAgentStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadSystemInfo();
    
    if (autoRefresh) {
      const interval = setInterval(loadSystemInfo, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadSystemInfo = async () => {
    try {
      setLoading(true);
      const [systemCheck, caps, stats] = await Promise.allSettled([
        apiService.runSystemCheck(),
        apiService.getCapabilities(),
        apiService.getAgentStats()
      ]);

      if (systemCheck.status === 'fulfilled') {
        setSystemStatus(systemCheck.value);
      }
      
      if (caps.status === 'fulfilled') {
        setCapabilities(caps.value);
      }
      
      if (stats.status === 'fulfilled') {
        setAgentStats(stats.value);
      }
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load system info:', error);
    } finally {
      setLoading(false);
    }
  };

  const getServiceStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
      case 'available':
        return <CheckCircleIcon className="w-5 h-5 text-green-400" />;
      case 'error':
        return <XCircleIcon className="w-5 h-5 text-red-400" />;
      default:
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getServiceStatusColor = (status) => {
    switch (status) {
      case 'healthy':
      case 'available':
        return 'green';
      case 'error':
        return 'red';
      default:
        return 'yellow';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <ServerIcon className="w-8 h-8 text-cyan-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">System Monitor</h2>
            <p className="text-gray-400">Monitor system health and performance</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-white/20 bg-black/30 text-cyan-400 focus:ring-cyan-400"
            />
            <span className="text-sm text-gray-300">Auto Refresh</span>
          </label>
          
          <button
            onClick={loadSystemInfo}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Last Update */}
      {lastUpdate && (
        <div className="text-sm text-gray-400 flex items-center space-x-2">
          <ClockIcon className="w-4 h-4" />
          <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
        </div>
      )}

      {/* System Services Status */}
      {systemStatus && (
        <GlassMorphismCard glowColor="cyan" className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <HeartIcon className="w-5 h-5 mr-2 text-cyan-400" />
            System Services
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(systemStatus.services || {}).map(([service, info]) => (
              <div key={service} className="bg-black/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white capitalize">
                    {service.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  {getServiceStatusIcon(info.status)}
                </div>
                
                <div className="text-xs text-gray-400">
                  Status: <span className={`text-${getServiceStatusColor(info.status)}-400`}>
                    {info.status}
                  </span>
                </div>
                
                {info.error && (
                  <div className="text-xs text-red-400 mt-1 truncate" title={info.error}>
                    {info.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </GlassMorphismCard>
      )}

      {/* Capabilities */}
      {capabilities && (
        <GlassMorphismCard glowColor="purple" className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <CpuChipIcon className="w-5 h-5 mr-2 text-purple-400" />
            Advanced Capabilities
          </h3>
          
          {capabilities.advancedCapabilities && (
            <div className="space-y-4">
              {Object.entries(capabilities.advancedCapabilities).map(([key, capability]) => (
                <div key={key} className="bg-black/20 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-2 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </h4>
                  
                  <p className="text-sm text-gray-400 mb-3">
                    {capability.description}
                  </p>
                  
                  {capability.features && (
                    <div className="flex flex-wrap gap-2">
                      {capability.features.map((feature, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {capability.planMode && (
                    <div className="mt-3">
                      <h5 className="text-sm font-medium text-blue-300 mb-1">Plan Mode:</h5>
                      <div className="flex flex-wrap gap-1">
                        {capability.planMode.map((item, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {capability.actMode && (
                    <div className="mt-3">
                      <h5 className="text-sm font-medium text-green-300 mb-1">Act Mode:</h5>
                      <div className="flex flex-wrap gap-1">
                        {capability.actMode.map((item, index) => (
                          <span key={index} className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {capability.levels && (
                    <div className="mt-3">
                      <h5 className="text-sm font-medium text-yellow-300 mb-1">Quality Levels:</h5>
                      <div className="flex flex-wrap gap-1">
                        {capability.levels.map((level, index) => (
                          <span key={index} className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded">
                            {level}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </GlassMorphismCard>
      )}

      {/* Agent Statistics */}
      {agentStats && (
        <GlassMorphismCard glowColor="green" className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <ChartBarIcon className="w-5 h-5 mr-2 text-green-400" />
            Agent Statistics
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(agentStats.stats || agentStats).map(([key, value]) => {
              if (typeof value === 'object') return null;
              
              return (
                <div key={key} className="bg-black/20 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-white mb-1">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                  </div>
                  <div className="text-sm text-gray-400 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                </div>
              );
            })}
          </div>
          
          {agentStats.features && (
            <div className="mt-6">
              <h4 className="text-md font-medium text-white mb-3">Available Features</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(agentStats.features).map(([feature, enabled]) => (
                  <div key={feature} className="flex items-center space-x-2">
                    {enabled ? (
                      <CheckCircleIcon className="w-4 h-4 text-green-400" />
                    ) : (
                      <XCircleIcon className="w-4 h-4 text-red-400" />
                    )}
                    <span className="text-sm text-gray-300 capitalize">
                      {feature.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </GlassMorphismCard>
      )}

      {/* Performance Metrics */}
      <GlassMorphismCard glowColor="orange" className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <ChartBarIcon className="w-5 h-5 mr-2 text-orange-400" />
          Performance Metrics
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-black/20 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">API Response Time</div>
            <div className="text-xl font-bold text-white">~250ms</div>
            <div className="text-xs text-green-400">Excellent</div>
          </div>
          
          <div className="bg-black/20 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Memory Usage</div>
            <div className="text-xl font-bold text-white">45%</div>
            <div className="text-xs text-yellow-400">Normal</div>
          </div>
          
          <div className="bg-black/20 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">System Load</div>
            <div className="text-xl font-bold text-white">0.8</div>
            <div className="text-xs text-green-400">Low</div>
          </div>
        </div>
      </GlassMorphismCard>
      
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <GlassMorphismCard className="p-6">
            <div className="flex items-center space-x-3">
              <ArrowPathIcon className="w-6 h-6 text-cyan-400 animate-spin" />
              <span className="text-white">Loading system information...</span>
            </div>
          </GlassMorphismCard>
        </div>
      )}
    </div>
  );
};

export default SystemMonitor;