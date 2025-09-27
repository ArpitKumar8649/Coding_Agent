import React, { useState } from 'react';
import { 
  Brain, 
  Zap, 
  FileText, 
  Code, 
  Layers,
  Settings,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Download
} from 'lucide-react';

const AdvancedFeaturesPanel = ({ 
  onAdvancedGenerate,
  onStreamGenerate,
  onBulkFileGenerate,
  onEnhancePrompt,
  isConnected = false,
  isStreaming = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAdvancedForm, setShowAdvancedForm] = useState(false);
  const [activeFeature, setActiveFeature] = useState(null);
  
  // Form states for different features
  const [advancedForm, setAdvancedForm] = useState({
    description: '',
    framework: 'react',
    features: [],
    qualityLevel: 'advanced'
  });
  
  const [bulkForm, setBulkForm] = useState({
    files: [{ path: '', type: '', description: '' }],
    generateDependencies: true,
    qualityLevel: 'advanced'
  });
  
  const [promptForm, setPromptForm] = useState({
    basePrompt: '',
    context: { framework: 'react', technologies: ['react'] },
    qualityLevel: 'advanced',
    projectType: 'web-application',
    features: []
  });

  const availableFeatures = [
    'responsive-design', 'animations', 'accessibility', 'dark-mode', 
    'state-management', 'routing', 'api-integration', 'testing'
  ];

  const availableFrameworks = ['react', 'vue', 'angular', 'svelte', 'vanilla'];
  
  const availableFileTypes = [
    'react-component', 'stylesheet', 'config', 'api-route', 
    'model', 'test', 'documentation'
  ];

  const handleAdvancedGenerate = async () => {
    if (!isConnected || isStreaming || !advancedForm.description.trim()) return;
    
    try {
      const result = await onAdvancedGenerate({
        ...advancedForm,
        streaming: false
      });
      console.log('Advanced generation result:', result);
      setActiveFeature(null);
    } catch (error) {
      console.error('Advanced generation failed:', error);
    }
  };

  const handleStreamGenerate = async () => {
    if (!isConnected || isStreaming || !advancedForm.description.trim()) return;
    
    try {
      await onStreamGenerate({
        description: advancedForm.description,
        qualityLevel: advancedForm.qualityLevel,
        realTimeValidation: true,
        autoCorrection: true
      });
      setActiveFeature(null);
    } catch (error) {
      console.error('Stream generation failed:', error);
    }
  };

  const handleBulkGenerate = async () => {
    if (!isConnected || isStreaming || bulkForm.files.some(f => !f.path.trim())) return;
    
    try {
      const result = await onBulkFileGenerate({
        files: bulkForm.files.filter(f => f.path.trim()),
        generateDependencies: bulkForm.generateDependencies,
        qualityLevel: bulkForm.qualityLevel
      });
      console.log('Bulk generation result:', result);
      setActiveFeature(null);
    } catch (error) {
      console.error('Bulk generation failed:', error);
    }
  };

  const handleEnhancePrompt = async () => {
    if (!isConnected) return;
    
    try {
      const result = await onEnhancePrompt(promptForm);
      console.log('Enhanced prompt result:', result);
      // You could display the enhanced prompt in a modal or copy to clipboard
      navigator.clipboard?.writeText(result.enhancedPrompt);
      alert('Enhanced prompt copied to clipboard!');
      setActiveFeature(null);
    } catch (error) {
      console.error('Prompt enhancement failed:', error);
    }
  };

  const addFileToForm = () => {
    setBulkForm(prev => ({
      ...prev,
      files: [...prev.files, { path: '', type: '', description: '' }]
    }));
  };

  const updateFile = (index, field, value) => {
    setBulkForm(prev => ({
      ...prev,
      files: prev.files.map((file, i) => 
        i === index ? { ...file, [field]: value } : file
      )
    }));
  };

  const removeFile = (index) => {
    if (bulkForm.files.length > 1) {
      setBulkForm(prev => ({
        ...prev,
        files: prev.files.filter((_, i) => i !== index)
      }));
    }
  };

  const toggleFeature = (feature) => {
    setAdvancedForm(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const renderAdvancedGenerateForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Description *
        </label>
        <textarea
          value={advancedForm.description}
          onChange={(e) => setAdvancedForm(prev => ({ ...prev, description: e.target.value }))}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          placeholder="Describe what you want to generate..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Framework
          </label>
          <select
            value={advancedForm.framework}
            onChange={(e) => setAdvancedForm(prev => ({ ...prev, framework: e.target.value }))}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            {availableFrameworks.map(framework => (
              <option key={framework} value={framework}>
                {framework.charAt(0).toUpperCase() + framework.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Quality Level
          </label>
          <select
            value={advancedForm.qualityLevel}
            onChange={(e) => setAdvancedForm(prev => ({ ...prev, qualityLevel: e.target.value }))}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="poor">Basic</option>
            <option value="medium">Standard</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Features
        </label>
        <div className="grid grid-cols-2 gap-2">
          {availableFeatures.map(feature => (
            <label key={feature} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={advancedForm.features.includes(feature)}
                onChange={() => toggleFeature(feature)}
                className="rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-300 capitalize">
                {feature.replace('-', ' ')}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={handleAdvancedGenerate}
          disabled={!advancedForm.description.trim() || !isConnected || isStreaming}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          <Code className="w-4 h-4" />
          <span>Generate Files</span>
        </button>
        
        <button
          onClick={handleStreamGenerate}
          disabled={!advancedForm.description.trim() || !isConnected || isStreaming}
          className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          <Zap className="w-4 h-4" />
          <span>Stream Generate</span>
        </button>
      </div>
    </div>
  );

  const renderBulkGenerateForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Files to Generate
        </label>
        {bulkForm.files.map((file, index) => (
          <div key={index} className="grid grid-cols-12 gap-2 mb-2">
            <input
              type="text"
              value={file.path}
              onChange={(e) => updateFile(index, 'path', e.target.value)}
              placeholder="File path"
              className="col-span-4 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
            />
            <select
              value={file.type}
              onChange={(e) => updateFile(index, 'type', e.target.value)}
              className="col-span-3 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">Select type</option>
              {availableFileTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <input
              type="text"
              value={file.description}
              onChange={(e) => updateFile(index, 'description', e.target.value)}
              placeholder="Description"
              className="col-span-4 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={() => removeFile(index)}
              disabled={bulkForm.files.length === 1}
              className="col-span-1 px-2 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded text-sm"
            >
              ×
            </button>
          </div>
        ))}
        <button
          onClick={addFileToForm}
          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
        >
          + Add File
        </button>
      </div>

      <div className="flex items-center space-x-4">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={bulkForm.generateDependencies}
            onChange={(e) => setBulkForm(prev => ({ ...prev, generateDependencies: e.target.checked }))}
            className="rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-300">Generate Dependencies</span>
        </label>
        
        <select
          value={bulkForm.qualityLevel}
          onChange={(e) => setBulkForm(prev => ({ ...prev, qualityLevel: e.target.value }))}
          className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="poor">Basic</option>
          <option value="medium">Standard</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      <button
        onClick={handleBulkGenerate}
        disabled={!isConnected || isStreaming || bulkForm.files.some(f => !f.path.trim())}
        className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
      >
        <Layers className="w-4 h-4" />
        <span>Bulk Generate</span>
      </button>
    </div>
  );

  const renderPromptEnhanceForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Base Prompt (optional)
        </label>
        <textarea
          value={promptForm.basePrompt}
          onChange={(e) => setPromptForm(prev => ({ ...prev, basePrompt: e.target.value }))}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          placeholder="Enter existing prompt to enhance (leave empty for new prompt)"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Project Type
          </label>
          <select
            value={promptForm.projectType}
            onChange={(e) => setPromptForm(prev => ({ ...prev, projectType: e.target.value }))}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="web-application">Web Application</option>
            <option value="mobile-app">Mobile App</option>
            <option value="api-service">API Service</option>
            <option value="desktop-app">Desktop App</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Quality Level
          </label>
          <select
            value={promptForm.qualityLevel}
            onChange={(e) => setPromptForm(prev => ({ ...prev, qualityLevel: e.target.value }))}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="poor">Basic</option>
            <option value="medium">Standard</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      <button
        onClick={handleEnhancePrompt}
        disabled={!isConnected}
        className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
      >
        <Sparkles className="w-4 h-4" />
        <span>Enhance Prompt</span>
      </button>
    </div>
  );

  if (!isExpanded) {
    return (
      <div className="px-4 py-2 bg-gray-800 border-t border-gray-700">
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full flex items-center justify-between text-gray-300 hover:text-white transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Brain className="w-4 h-4" />
            <span className="text-sm font-medium">Advanced Features</span>
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
            </div>
          </div>
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 bg-gray-800 border-t border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-blue-400" />
          <h3 className="text-white font-semibold">Advanced Features</h3>
        </div>
        <button
          onClick={() => {
            setIsExpanded(false);
            setActiveFeature(null);
          }}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Feature Buttons */}
      {!activeFeature && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <button
            onClick={() => setActiveFeature('advanced-generate')}
            disabled={!isConnected || isStreaming}
            className="p-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex flex-col items-center space-y-1">
              <Code className="w-5 h-5 text-blue-400" />
              <span className="text-xs text-blue-300 font-medium">Advanced Generate</span>
            </div>
          </button>

          <button
            onClick={() => setActiveFeature('stream-generate')}
            disabled={!isConnected || isStreaming}
            className="p-3 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex flex-col items-center space-y-1">
              <Zap className="w-5 h-5 text-purple-400" />
              <span className="text-xs text-purple-300 font-medium">Stream Generate</span>
            </div>
          </button>

          <button
            onClick={() => setActiveFeature('bulk-generate')}
            disabled={!isConnected || isStreaming}
            className="p-3 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex flex-col items-center space-y-1">
              <Layers className="w-5 h-5 text-green-400" />
              <span className="text-xs text-green-300 font-medium">Bulk Generate</span>
            </div>
          </button>

          <button
            onClick={() => setActiveFeature('enhance-prompt')}
            disabled={!isConnected}
            className="p-3 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex flex-col items-center space-y-1">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <span className="text-xs text-yellow-300 font-medium">Enhance Prompt</span>
            </div>
          </button>
        </div>
      )}

      {/* Active Feature Form */}
      {activeFeature && (
        <div className="mt-4 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-white font-medium capitalize">
              {activeFeature.replace('-', ' ')}
            </h4>
            <button
              onClick={() => setActiveFeature(null)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ×
            </button>
          </div>

          {activeFeature === 'advanced-generate' && renderAdvancedGenerateForm()}
          {activeFeature === 'stream-generate' && renderAdvancedGenerateForm()}
          {activeFeature === 'bulk-generate' && renderBulkGenerateForm()}
          {activeFeature === 'enhance-prompt' && renderPromptEnhanceForm()}
        </div>
      )}
    </div>
  );
};

export default AdvancedFeaturesPanel;