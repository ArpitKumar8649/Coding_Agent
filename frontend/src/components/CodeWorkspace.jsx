/**
 * Code Workspace Component
 * Integrates comprehensive code editor with generation and agent functionality
 */

import React, { useState, useEffect, useCallback } from 'react';
import GlassMorphismCard from './GlassMorphismCard';
import { ComprehensiveCodeEditor } from './CodeEditor';
import AdvancedGenerationPanel from './AdvancedGenerationPanel';
import {
  CodeBracketIcon,
  SparklesIcon,
  FolderOpenIcon,
  DocumentTextIcon,
  ArrowsRightLeftIcon,
  CloudArrowUpIcon,
  PlayIcon,
  StopIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';

const CodeWorkspace = ({ apiService }) => {
  const [activeView, setActiveView] = useState('editor'); // 'editor', 'generation', 'split'
  const [currentProject, setCurrentProject] = useState(null);
  const [generatedFiles, setGeneratedFiles] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionOutput, setExecutionOutput] = useState('');
  const [projectFiles, setProjectFiles] = useState([]);
  const [workspaceStats, setWorkspaceStats] = useState({
    totalProjects: 0,
    totalFiles: 0,
    totalLines: 0,
    lastActivity: null
  });

  const views = [
    { id: 'editor', label: 'Code Editor', icon: CodeBracketIcon, color: 'blue' },
    { id: 'generation', label: 'AI Generation', icon: SparklesIcon, color: 'purple' },
    { id: 'split', label: 'Split View', icon: ArrowsRightLeftIcon, color: 'green' }
  ];

  // Load existing project files
  useEffect(() => {
    loadProjectFiles();
  }, []);

  const loadProjectFiles = async () => {
    try {
      // In a real implementation, this would load files from the current project
      const sampleFiles = [
        {
          id: 'sample_1',
          name: 'App.jsx',
          content: `import React, { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="App">
      <h1>Counter App</h1>
      <div className="counter">
        <button onClick={() => setCount(count - 1)}>-</button>
        <span className="count">{count}</span>
        <button onClick={() => setCount(count + 1)}>+</button>
      </div>
    </div>
  );
}

export default App;`,
          language: 'javascript',
          modified: false,
          created: new Date().toISOString()
        },
        {
          id: 'sample_2',
          name: 'styles.css',
          content: `.App {
  text-align: center;
  padding: 2rem;
  font-family: Arial, sans-serif;
}

.counter {
  margin: 2rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.count {
  font-size: 2rem;
  font-weight: bold;
  min-width: 3rem;
  padding: 0.5rem;
  background: #f0f0f0;
  border-radius: 0.5rem;
}

button {
  padding: 0.5rem 1rem;
  font-size: 1.2rem;
  border: none;
  border-radius: 0.5rem;
  background: #007bff;
  color: white;
  cursor: pointer;
  transition: background 0.2s;
}

button:hover {
  background: #0056b3;
}`,
          language: 'css',
          modified: false,
          created: new Date().toISOString()
        }
      ];
      
      setProjectFiles(sampleFiles);
      
      // Update stats
      setWorkspaceStats({
        totalProjects: 1,
        totalFiles: sampleFiles.length,
        totalLines: sampleFiles.reduce((acc, file) => acc + (file.content?.split('\n').length || 0), 0),
        lastActivity: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to load project files:', error);
    }
  };

  const handleCodeGenerated = useCallback((result) => {
    console.log('🎨 Code generated:', result);
    
    if (result.files && result.files.length > 0) {
      const newFiles = result.files.map((file, index) => ({
        id: `generated_${Date.now()}_${index}`,
        name: file.path || `generated_${index + 1}.js`,
        content: file.content || '',
        language: file.language || 'javascript',
        modified: false,
        created: new Date().toISOString(),
        generated: true,
        metadata: result.metadata || {}
      }));
      
      setGeneratedFiles(prev => [...prev, ...newFiles]);
      setProjectFiles(prev => [...prev, ...newFiles]);
      
      // Switch to editor view to show generated code
      if (activeView === 'generation') {
        setActiveView('split');
      }
    }
  }, [activeView]);

  const handleFilesSaved = useCallback((data) => {
    console.log('💾 Files saved:', data);
    
    // Update workspace stats
    setWorkspaceStats(prev => ({
      ...prev,
      lastActivity: new Date().toISOString()
    }));
  }, []);

  const handleExecuteCode = async () => {
    setIsExecuting(true);
    setExecutionOutput('🚀 Starting execution...\n');
    
    try {
      // Simulate code execution
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setExecutionOutput(prev => prev + '✅ Execution completed successfully!\n');
      setExecutionOutput(prev => prev + 'Output: Hello, World!\n');
    } catch (error) {
      setExecutionOutput(prev => prev + `❌ Execution failed: ${error.message}\n`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleStopExecution = () => {
    setIsExecuting(false);
    setExecutionOutput(prev => prev + '⏹️ Execution stopped by user\n');
  };

  const renderContent = () => {
    switch (activeView) {
      case 'editor':
        return (
          <ComprehensiveCodeEditor
            apiService={apiService}
            onCodeGenerated={handleCodeGenerated}
            onFilesSaved={handleFilesSaved}
            initialFiles={projectFiles}
            projectContext={{
              type: 'web-application',
              framework: 'react',
              features: ['responsive-design', 'animations']
            }}
            className="h-full"
          />
        );
      
      case 'generation':
        return (
          <div className="h-full overflow-auto p-6">
            <AdvancedGenerationPanel
              apiService={apiService}
              onGenerated={handleCodeGenerated}
            />
          </div>
        );
      
      case 'split':
        return (
          <div className="h-full flex">
            <div className="flex-1 border-r border-white/10">
              <ComprehensiveCodeEditor
                apiService={apiService}
                onCodeGenerated={handleCodeGenerated}
                onFilesSaved={handleFilesSaved}
                initialFiles={projectFiles}
                projectContext={{
                  type: 'web-application',
                  framework: 'react',
                  features: ['responsive-design', 'animations']
                }}
                className="h-full"
              />
            </div>
            <div className="w-96 h-full overflow-auto">
              <div className="p-4">
                <AdvancedGenerationPanel
                  apiService={apiService}
                  onGenerated={handleCodeGenerated}
                />
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-4">
        <div className="flex items-center space-x-3">
          <CodeBracketIcon className="w-8 h-8 text-blue-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Code Workspace</h1>
            <p className="text-gray-400">Advanced Monaco Editor with AI Integration</p>
          </div>
        </div>
        
        {/* Stats */}
        <div className="flex items-center space-x-6 text-sm text-gray-400">
          <div className="flex items-center space-x-1">
            <FolderOpenIcon className="w-4 h-4" />
            <span>{workspaceStats.totalFiles} files</span>
          </div>
          <div className="flex items-center space-x-1">
            <DocumentTextIcon className="w-4 h-4" />
            <span>{workspaceStats.totalLines} lines</span>
          </div>
          {workspaceStats.lastActivity && (
            <div className="text-xs">
              Last: {new Date(workspaceStats.lastActivity).toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
      
      {/* View Tabs */}
      <div className="flex items-center space-x-1 px-6 mb-4">
        {views.map((view) => {
          const Icon = view.icon;
          const isActive = activeView === view.id;
          
          return (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                isActive
                  ? `bg-${view.color}-500/20 text-${view.color}-400 border border-${view.color}-400/30`
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">{view.label}</span>
            </button>
          );
        })}
        
        {/* Execution Controls */}
        <div className="flex items-center space-x-2 ml-auto">
          {!isExecuting ? (
            <button
              onClick={handleExecuteCode}
              className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <PlayIcon className="w-4 h-4" />
              <span className="text-sm">Run</span>
            </button>
          ) : (
            <button
              onClick={handleStopExecution}
              className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <StopIcon className="w-4 h-4" />
              <span className="text-sm">Stop</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 px-6 pb-6">
        <GlassMorphismCard className="h-full" glowColor="blue">
          {renderContent()}
        </GlassMorphismCard>
      </div>
      
      {/* Execution Output */}
      {executionOutput && (
        <div className="px-6 pb-6">
          <GlassMorphismCard className="p-4" glowColor="green">
            <div className="flex items-center space-x-2 mb-2">
              <CpuChipIcon className="w-5 h-5 text-green-400" />
              <span className="text-white font-medium">Execution Output</span>
            </div>
            <div className="bg-black/30 rounded-lg p-3 font-mono text-sm text-gray-300 max-h-32 overflow-y-auto">
              <pre className="whitespace-pre-wrap">{executionOutput}</pre>
            </div>
          </GlassMorphismCard>
        </div>
      )}
    </div>
  );
};

export default CodeWorkspace;