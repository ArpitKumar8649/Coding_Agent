/**
 * Advanced Generation Panel Component
 * Interface for advanced code generation with quality controls
 */

import React, { useState } from 'react';
import GlassMorphismCard from './GlassMorphismCard';
import {
  SparklesIcon,
  CodeBracketIcon,
  CogIcon,
  PlayIcon,
  DocumentDuplicateIcon,
  AdjustmentsHorizontalIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';

const AdvancedGenerationPanel = ({ apiService, onGenerated }) => {
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [formData, setFormData] = useState({
    description: '',
    projectType: 'web-application',
    framework: 'react',
    features: [],
    qualityLevel: 'advanced',
    streaming: false,
    fileSpecs: []
  });
  const [result, setResult] = useState(null);

  const projectTypes = [
    'web-application', 'mobile-app', 'desktop-app', 'api-service',
    'library', 'component', 'utility', 'full-stack'
  ];

  const frameworks = [
    'react', 'vue', 'angular', 'svelte', 'nextjs', 'nuxt',
    'express', 'fastapi', 'django', 'flask', 'node'
  ];

  const availableFeatures = [
    'responsive-design', 'animations', 'accessibility', 'dark-mode',
    'authentication', 'api-integration', 'real-time', 'offline-support',
    'testing', 'documentation', 'error-handling', 'performance-optimization'
  ];

  const qualityLevels = [
    { value: 'poor', label: 'Basic', description: 'Simple, functional code' },
    { value: 'medium', label: 'Standard', description: 'Well-structured with best practices' },
    { value: 'advanced', label: 'Advanced', description: 'Production-ready with optimizations' }
  ];

  const handleGenerate = async () => {
    if (!formData.description.trim()) return;

    try {
      setLoading(true);
      setResult(null);
      setStreamingContent('');

      if (formData.streaming) {
        setStreaming(true);
        const response = await apiService.streamGenerate(formData, {
          onChunk: (chunk) => {
            setStreamingContent(prev => prev + (chunk.content || ''));
          },
          onComplete: (result) => {
            setResult(result);
            setStreaming(false);
            onGenerated?.(result);
          },
          onError: (error) => {
            console.error('Streaming generation error:', error);
            setStreaming(false);
          }
        });
      } else {
        const response = await apiService.advancedGenerate(formData);
        setResult(response);
        onGenerated?.(response);
      }
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkGenerate = async () => {
    if (formData.fileSpecs.length === 0) {
      // Add default file specs
      setFormData(prev => ({
        ...prev,
        fileSpecs: [
          { path: 'src/App.js', description: 'Main application component' },
          { path: 'src/components/MainComponent.js', description: 'Primary feature component' },
          { path: 'src/styles/App.css', description: 'Application styles' }
        ]
      }));
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.bulkFileGenerate({
        files: formData.fileSpecs,
        projectContext: {
          description: formData.description,
          framework: formData.framework,
          features: formData.features
        },
        qualityLevel: formData.qualityLevel
      });
      setResult(response);
      onGenerated?.(response);
    } catch (error) {
      console.error('Bulk generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const addFileSpec = () => {
    setFormData(prev => ({
      ...prev,
      fileSpecs: [...prev.fileSpecs, { path: '', description: '' }]
    }));
  };

  const updateFileSpec = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      fileSpecs: prev.fileSpecs.map((spec, i) => 
        i === index ? { ...spec, [field]: value } : spec
      )
    }));
  };

  const removeFileSpec = (index) => {
    setFormData(prev => ({
      ...prev,
      fileSpecs: prev.fileSpecs.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <SparklesIcon className="w-8 h-8 text-purple-400" />
        <div>
          <h2 className="text-2xl font-bold text-white">Advanced Code Generation</h2>
          <p className="text-gray-400">Create high-quality code with AI assistance</p>
        </div>
      </div>

      {/* Generation Form */}
      <GlassMorphismCard glowColor="purple" className="p-6">
        <div className="space-y-6">
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Project Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what you want to build in detail..."
              className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm resize-none"
              rows={4}
            />
          </div>

          {/* Project Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Project Type
              </label>
              <select
                value={formData.projectType}
                onChange={(e) => setFormData(prev => ({ ...prev, projectType: e.target.value }))}
                className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm"
              >
                {projectTypes.map(type => (
                  <option key={type} value={type} className="bg-gray-800">
                    {type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Framework
              </label>
              <select
                value={formData.framework}
                onChange={(e) => setFormData(prev => ({ ...prev, framework: e.target.value }))}
                className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm"
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
                value={formData.qualityLevel}
                onChange={(e) => setFormData(prev => ({ ...prev, qualityLevel: e.target.value }))}
                className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm"
              >
                {qualityLevels.map(level => (
                  <option key={level.value} value={level.value} className="bg-gray-800">
                    {level.label} - {level.description}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Features */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Features
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {availableFeatures.map(feature => (
                <label key={feature} className="flex items-center space-x-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.features.includes(feature)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData(prev => ({ 
                          ...prev, 
                          features: [...prev.features, feature] 
                        }));
                      } else {
                        setFormData(prev => ({ 
                          ...prev, 
                          features: prev.features.filter(f => f !== feature) 
                        }));
                      }
                    }}
                    className="rounded border-white/20 bg-black/30 text-purple-400 focus:ring-purple-400"
                  />
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                    {feature.replace('-', ' ')}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* File Specifications */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-300">
                File Specifications (Optional)
              </label>
              <button
                onClick={addFileSpec}
                className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                + Add File
              </button>
            </div>
            
            {formData.fileSpecs.map((spec, index) => (
              <div key={index} className="flex space-x-3 mb-3">
                <input
                  type="text"
                  placeholder="File path (e.g., src/components/Button.js)"
                  value={spec.path}
                  onChange={(e) => updateFileSpec(index, 'path', e.target.value)}
                  className="flex-1 px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={spec.description}
                  onChange={(e) => updateFileSpec(index, 'description', e.target.value)}
                  className="flex-1 px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm"
                />
                <button
                  onClick={() => removeFileSpec(index)}
                  className="px-3 py-2 text-red-400 hover:text-red-300 transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* Options */}
          <div className="flex items-center space-x-6">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.streaming}
                onChange={(e) => setFormData(prev => ({ ...prev, streaming: e.target.checked }))}
                className="rounded border-white/20 bg-black/30 text-purple-400 focus:ring-purple-400"
              />
              <span className="text-sm text-gray-300">Enable Real-time Streaming</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4 border-t border-white/10">
            <button
              onClick={handleGenerate}
              disabled={loading || !formData.description.trim()}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? (
                <CogIcon className="w-5 h-5 animate-spin" />
              ) : (
                <SparklesIcon className="w-5 h-5" />
              )}
              <span>{loading ? 'Generating...' : 'Generate Code'}</span>
            </button>

            <button
              onClick={handleBulkGenerate}
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? (
                <CogIcon className="w-5 h-5 animate-spin" />
              ) : (
                <DocumentDuplicateIcon className="w-5 h-5" />
              )}
              <span>Bulk Generate</span>
            </button>
          </div>
        </div>
      </GlassMorphismCard>

      {/* Streaming Content */}
      {streaming && (
        <GlassMorphismCard glowColor="cyan" className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <CogIcon className="w-5 h-5 text-cyan-400 animate-spin" />
            <span className="text-lg font-semibold text-white">Streaming Generation...</span>
          </div>
          <div className="bg-black/30 rounded-lg p-4 max-h-96 overflow-y-auto">
            <pre className="text-sm text-gray-300 whitespace-pre-wrap">
              {streamingContent}
            </pre>
          </div>
        </GlassMorphismCard>
      )}

      {/* Results */}
      {result && (
        <GlassMorphismCard glowColor="green" className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <SparklesIcon className="w-5 h-5 text-green-400" />
            <span className="text-lg font-semibold text-white">Generation Complete</span>
          </div>
          
          {result.files && result.files.length > 0 && (
            <div className="space-y-4">
              <div className="text-sm text-gray-400">
                Generated {result.files.length} file(s)
              </div>
              
              {result.files.map((file, index) => (
                <div key={index} className="bg-black/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">{file.path}</span>
                    <span className="text-xs text-gray-400">
                      {file.content?.length || 0} characters
                    </span>
                  </div>
                  
                  {file.content && (
                    <div className="max-h-48 overflow-y-auto">
                      <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                        {file.content}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {result.metadata && (
            <div className="mt-4 pt-4 border-t border-white/10 text-sm text-gray-400">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {result.metadata.model && (
                  <div>
                    <span className="font-medium">Model:</span> {result.metadata.model}
                  </div>
                )}
                {result.metadata.tokensUsed && (
                  <div>
                    <span className="font-medium">Tokens:</span> {result.metadata.tokensUsed}
                  </div>
                )}
                {result.metadata.processingTime && (
                  <div>
                    <span className="font-medium">Time:</span> {result.metadata.processingTime}ms
                  </div>
                )}
                {result.metadata.qualityLevel && (
                  <div>
                    <span className="font-medium">Quality:</span> {result.metadata.qualityLevel}
                  </div>
                )}
              </div>
            </div>
          )}
        </GlassMorphismCard>
      )}
    </div>
  );
};

export default AdvancedGenerationPanel;