/**
 * Project Dashboard Component
 * Manages autonomous coding projects with glass morphism design
 */

import React, { useState, useEffect } from 'react';
import GlassMorphismCard from './GlassMorphismCard';
import { 
  FolderOpenIcon, 
  PlusIcon, 
  PlayIcon, 
  PauseIcon, 
  StopIcon,
  DocumentTextIcon,
  CogIcon,
  ChartBarIcon,
  SparklesIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';

const ProjectDashboard = ({ apiService, onProjectSelect }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProject, setNewProject] = useState({
    description: '',
    framework: 'react',
    features: [],
    qualityLevel: 'advanced'
  });

  const frameworks = ['react', 'vue', 'angular', 'svelte', 'nextjs', 'nuxt'];
  const qualityLevels = ['poor', 'medium', 'advanced'];
  const availableFeatures = [
    'responsive-design', 'animations', 'accessibility', 'dark-mode',
    'authentication', 'api-integration', 'real-time', 'offline-support'
  ];

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await apiService.listProjects();
      setProjects(response.projects || []);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.description.trim()) return;
    
    try {
      setCreating(true);
      const response = await apiService.createProject({
        description: newProject.description,
        preferences: {
          framework: newProject.framework,
          features: newProject.features,
          qualityLevel: newProject.qualityLevel
        },
        streaming: true
      });
      
      if (response.success) {
        await loadProjects();
        setShowCreateForm(false);
        setNewProject({ description: '', framework: 'react', features: [], qualityLevel: 'advanced' });
        
        // Optionally select the new project
        if (onProjectSelect) {
          onProjectSelect(response.projectId);
        }
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleCancelProject = async (projectId) => {
    try {
      await apiService.cancelProject(projectId);
      await loadProjects();
    } catch (error) {
      console.error('Failed to cancel project:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green';
      case 'completed': return 'blue';
      case 'cancelled': return 'red';
      case 'error': return 'red';
      default: return 'cyan';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <PlayIcon className="w-4 h-4" />;
      case 'completed': return <SparklesIcon className="w-4 h-4" />;
      case 'cancelled': return <StopIcon className="w-4 h-4" />;
      case 'error': return <StopIcon className="w-4 h-4" />;
      default: return <CogIcon className="w-4 h-4 animate-spin" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <RocketLaunchIcon className="w-8 h-8 text-blue-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Project Dashboard</h1>
            <p className="text-gray-400">Manage your autonomous coding projects</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-colors shadow-lg"
        >
          <PlusIcon className="w-5 h-5" />
          <span>New Project</span>
        </button>
      </div>

      {/* Create Project Form */}
      {showCreateForm && (
        <GlassMorphismCard glowColor="blue" className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <SparklesIcon className="w-5 h-5 mr-2 text-blue-400" />
            Create New Project
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Project Description
              </label>
              <textarea
                value={newProject.description}
                onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your project in detail..."
                className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Framework
                </label>
                <select
                  value={newProject.framework}
                  onChange={(e) => setNewProject(prev => ({ ...prev, framework: e.target.value }))}
                  className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm"
                >
                  {frameworks.map(fw => (
                    <option key={fw} value={fw} className="bg-gray-800">
                      {fw.charAt(0).toUpperCase() + fw.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Quality Level
                </label>
                <select
                  value={newProject.qualityLevel}
                  onChange={(e) => setNewProject(prev => ({ ...prev, qualityLevel: e.target.value }))}
                  className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm"
                >
                  {qualityLevels.map(level => (
                    <option key={level} value={level} className="bg-gray-800">
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Features
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {availableFeatures.map(feature => (
                  <label key={feature} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newProject.features.includes(feature)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewProject(prev => ({ 
                            ...prev, 
                            features: [...prev.features, feature] 
                          }));
                        } else {
                          setNewProject(prev => ({ 
                            ...prev, 
                            features: prev.features.filter(f => f !== feature) 
                          }));
                        }
                      }}
                      className="rounded border-white/20 bg-black/30 text-blue-400 focus:ring-blue-400"
                    />
                    <span className="text-sm text-gray-300">
                      {feature.replace('-', ' ')}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="flex space-x-3 pt-4">
              <button
                onClick={handleCreateProject}
                disabled={creating || !newProject.description.trim()}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? (
                  <CogIcon className="w-5 h-5 animate-spin" />
                ) : (
                  <RocketLaunchIcon className="w-5 h-5" />
                )}
                <span>{creating ? 'Creating...' : 'Create Project'}</span>
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

      {/* Projects Grid */}
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
      ) : projects.length === 0 ? (
        <GlassMorphismCard className="p-12 text-center">
          <FolderOpenIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl text-white mb-2">No Projects Yet</h3>
          <p className="text-gray-400 mb-4">Create your first autonomous coding project</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-colors"
          >
            Get Started
          </button>
        </GlassMorphismCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <GlassMorphismCard 
              key={project.id} 
              glowColor={getStatusColor(project.status)}
              className="p-6 cursor-pointer"
              onClick={() => onProjectSelect?.(project.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(project.status)}
                  <span className={`text-sm font-medium text-${getStatusColor(project.status)}-400`}>
                    {project.status?.toUpperCase()}
                  </span>
                </div>
                
                {project.status === 'active' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancelProject(project.id);
                    }}
                    className="p-1 text-red-400 hover:text-red-300 transition-colors"
                  >
                    <StopIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                {project.description || 'Untitled Project'}
              </h3>
              
              <div className="space-y-2 text-sm text-gray-400">
                {project.framework && (
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Framework:</span>
                    <span className="capitalize">{project.framework}</span>
                  </div>
                )}
                
                {project.created && (
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Created:</span>
                    <span>{new Date(project.created).toLocaleDateString()}</span>
                  </div>
                )}
                
                {project.progress && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Progress</span>
                      <span>{Math.round(project.progress * 100)}%</span>
                    </div>
                    <div className="w-full bg-black/30 rounded-full h-1.5">
                      <div 
                        className={`bg-gradient-to-r from-${getStatusColor(project.status)}-400 to-${getStatusColor(project.status)}-500 h-1.5 rounded-full transition-all duration-300`}
                        style={{ width: `${project.progress * 100}%` }}
                      ></div>
                    </div>
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

export default ProjectDashboard;