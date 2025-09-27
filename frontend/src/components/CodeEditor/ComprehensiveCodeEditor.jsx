/**
 * Comprehensive Code Editor Component
 * Integrates Monaco Editor with file management, diff viewing, and AI code generation
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import GlassMorphismCard from '../GlassMorphismCard';
import MonacoEditor from './MonacoEditor';
import FileTabManager from './FileTabManager';
import DiffViewer from './DiffViewer';
import {
  FolderIcon,
  DocumentTextIcon,
  PlusIcon,
  SparklesIcon,
  ArrowsRightLeftIcon,
  CodeBracketIcon,
  CloudArrowUpIcon,
  CloudArrowDownIcon,
  CommandLineIcon,
  BugAntIcon,
  WrenchScrewdriverIcon,
  EyeIcon,
  RocketLaunchIcon,
  ShareIcon
} from '@heroicons/react/24/outline';

const ComprehensiveCodeEditor = ({ 
  apiService, 
  onCodeGenerated,
  onFilesSaved,
  initialFiles = [],
  projectContext = {},
  className = '' 
}) => {
  const [files, setFiles] = useState(initialFiles);
  const [activeFileId, setActiveFileId] = useState(null);
  const [showDiffView, setShowDiffView] = useState(false);
  const [diffData, setDiffData] = useState({ original: '', modified: '' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState('editor'); // 'editor', 'diff', 'preview'
  const [editorSettings, setEditorSettings] = useState({
    theme: 'vs-dark',
    fontSize: 14,
    wordWrap: 'on',
    minimap: true
  });
  const [projectStats, setProjectStats] = useState({
    totalFiles: 0,
    totalLines: 0,
    totalChars: 0,
    languages: []
  });
  
  const editorRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  // Initialize with a welcome file if no files provided
  useEffect(() => {
    if (files.length === 0) {
      const welcomeFile = {
        id: 'welcome',
        name: 'Welcome.md',
        content: `# Welcome to Advanced Code Editor

This is a comprehensive Monaco Editor integration with:

## Features
- 🎨 Syntax highlighting for 50+ languages
- 💡 IntelliSense and code completion
- 🔍 Advanced find and replace
- 📁 Multi-file tab management
- 🔄 Real-time diff viewing
- 🤖 AI-powered code generation
- 🎯 Collaborative editing features
- 📊 Code analysis and stats

## Getting Started
1. Click the "New" button to create a file
2. Or use AI generation to create code
3. Use Ctrl+S to save files
4. Use Ctrl+H for find and replace

Happy coding! 🚀
`,
        language: 'markdown',
        modified: false,
        created: new Date().toISOString()
      };
      
      setFiles([welcomeFile]);
      setActiveFileId('welcome');
    } else if (files.length > 0 && !activeFileId) {
      setActiveFileId(files[0].id);
    }
  }, [files.length, activeFileId]);

  // Update project statistics
  useEffect(() => {
    const stats = {
      totalFiles: files.length,
      totalLines: files.reduce((acc, file) => acc + (file.content?.split('\n').length || 0), 0),
      totalChars: files.reduce((acc, file) => acc + (file.content?.length || 0), 0),
      languages: [...new Set(files.map(f => f.language).filter(Boolean))]
    };
    setProjectStats(stats);
  }, [files]);

  const handleFileSelect = useCallback((fileId) => {
    setActiveFileId(fileId);
    setCurrentView('editor');
  }, []);

  const handleFileClose = useCallback((fileId) => {
    setFiles(prev => {
      const newFiles = prev.filter(f => f.id !== fileId);
      
      // If closing active file, select another
      if (fileId === activeFileId) {
        const currentIndex = prev.findIndex(f => f.id === fileId);
        if (newFiles.length > 0) {
          const nextFile = newFiles[currentIndex] || newFiles[currentIndex - 1] || newFiles[0];
          setActiveFileId(nextFile.id);
        } else {
          setActiveFileId(null);
        }
      }
      
      return newFiles;
    });
  }, [activeFileId]);

  const handleFileAdd = useCallback((newFile) => {
    setFiles(prev => [...prev, newFile]);
    setActiveFileId(newFile.id);
  }, []);

  const handleFileContentChange = useCallback((content) => {
    if (activeFileId) {
      setFiles(prev => prev.map(file => 
        file.id === activeFileId 
          ? { ...file, content, modified: true }
          : file
      ));
      
      // Auto-save after 2 seconds of inactivity
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        handleFileSave(activeFileId, content);
      }, 2000);
    }
  }, [activeFileId]);

  const handleFileSave = useCallback(async (fileId, content) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;
    
    try {
      // Mark as saved
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, modified: false, lastSaved: new Date().toISOString() }
          : f
      ));
      
      // Notify parent component
      onFilesSaved?.({
        file: { ...file, content },
        allFiles: files
      });
      
      console.log(`✅ Saved ${file.name}`);
    } catch (error) {
      console.error('Failed to save file:', error);
    }
  }, [files, onFilesSaved]);

  const handleGenerateCode = useCallback(async (prompt, options = {}) => {
    if (!apiService) return;
    
    setIsGenerating(true);
    setGenerationProgress(0);
    
    try {
      // Use streaming generation for real-time updates
      const result = await apiService.streamGenerate({
        description: prompt,
        projectType: projectContext.type || 'web-application',
        framework: projectContext.framework || 'react',
        qualityLevel: 'advanced',
        fileSpecs: options.fileSpecs || [],
        ...options
      }, {
        onChunk: (chunk) => {
          setGenerationProgress(prev => Math.min(prev + 10, 90));
          console.log('Generation chunk:', chunk);
        },
        onComplete: (result) => {
          setGenerationProgress(100);
          
          // Add generated files to editor
          if (result.files && result.files.length > 0) {
            const newFiles = result.files.map((file, index) => ({
              id: `generated_${Date.now()}_${index}`,
              name: file.path || `generated_${index + 1}.js`,
              content: file.content || '',
              language: file.language || 'javascript',
              modified: false,
              created: new Date().toISOString(),
              generated: true
            }));
            
            setFiles(prev => [...prev, ...newFiles]);
            
            // Select first generated file
            if (newFiles.length > 0) {
              setActiveFileId(newFiles[0].id);
            }
            
            onCodeGenerated?.(result);
          }
          
          setTimeout(() => {
            setIsGenerating(false);
            setGenerationProgress(0);
          }, 1000);
        },
        onError: (error) => {
          console.error('Generation failed:', error);
          setIsGenerating(false);
          setGenerationProgress(0);
        }
      });
    } catch (error) {
      console.error('Code generation failed:', error);
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  }, [apiService, projectContext, onCodeGenerated]);

  const handleShowDiff = useCallback((originalContent, modifiedContent, title = 'Code Changes') => {
    setDiffData({
      original: originalContent,
      modified: modifiedContent,
      title
    });
    setShowDiffView(true);
    setCurrentView('diff');
  }, []);

  const handleFormatCode = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run();
    }
  }, []);

  const handleRunCode = useCallback(async () => {
    const activeFile = files.find(f => f.id === activeFileId);
    if (!activeFile) return;
    
    // Basic code execution simulation
    console.log('🚀 Running code:', activeFile.name);
    // In a real implementation, this would execute the code in a sandbox
  }, [files, activeFileId]);

  const activeFile = files.find(f => f.id === activeFileId);

  return (
    <div className={`h-full flex ${className}`}>
      {/* Sidebar */}
      {sidebarOpen && (
        <div className="w-64 flex-shrink-0">
          <GlassMorphismCard className="h-full rounded-none rounded-l-xl" intensity="medium">
            <div className="p-4">
              {/* Project Info */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
                  <FolderIcon className="w-5 h-5 mr-2 text-blue-400" />
                  Code Editor
                </h3>
                
                {/* Project Stats */}
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex justify-between">
                    <span>Files:</span>
                    <span className="text-blue-400">{projectStats.totalFiles}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Lines:</span>
                    <span className="text-green-400">{projectStats.totalLines.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Characters:</span>
                    <span className="text-purple-400">{projectStats.totalChars.toLocaleString()}</span>
                  </div>
                  {projectStats.languages.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs text-gray-400 mb-1">Languages:</div>
                      <div className="flex flex-wrap gap-1">
                        {projectStats.languages.map(lang => (
                          <span key={lang} className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="space-y-2">
                <button
                  onClick={() => handleGenerateCode('Create a new React component')}
                  disabled={isGenerating}
                  className="w-full flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors disabled:opacity-50"
                >
                  <SparklesIcon className="w-4 h-4" />
                  <span className="text-sm">AI Generate</span>
                </button>
                
                <button
                  onClick={handleFormatCode}
                  className="w-full flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <WrenchScrewdriverIcon className="w-4 h-4" />
                  <span className="text-sm">Format Code</span>
                </button>
                
                <button
                  onClick={handleRunCode}
                  disabled={!activeFile}
                  className="w-full flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <RocketLaunchIcon className="w-4 h-4" />
                  <span className="text-sm">Run Code</span>
                </button>
                
                <button
                  onClick={() => setCurrentView(currentView === 'diff' ? 'editor' : 'diff')}
                  className="w-full flex items-center space-x-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <ArrowsRightLeftIcon className="w-4 h-4" />
                  <span className="text-sm">Diff View</span>
                </button>
              </div>
              
              {/* Generation Progress */}
              {isGenerating && (
                <div className="mt-4 p-3 bg-black/20 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <SparklesIcon className="w-4 h-4 text-purple-400 animate-pulse" />
                    <span className="text-sm text-white">Generating Code...</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${generationProgress}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{generationProgress}%</div>
                </div>
              )}
            </div>
          </GlassMorphismCard>
        </div>
      )}
      
      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        <GlassMorphismCard className="h-full rounded-none rounded-r-xl" intensity="low">
          {/* File Tabs */}
          <FileTabManager
            files={files}
            activeFileId={activeFileId}
            onFileSelect={handleFileSelect}
            onFileClose={handleFileClose}
            onFileAdd={handleFileAdd}
          />
          
          {/* Editor Content */}
          <div className="flex-1 relative">
            {currentView === 'editor' && activeFile ? (
              <MonacoEditor
                ref={editorRef}
                value={activeFile.content || ''}
                language={activeFile.language}
                theme={editorSettings.theme}
                onChange={handleFileContentChange}
                onSave={(content) => handleFileSave(activeFileId, content)}
                fontSize={editorSettings.fontSize}
                wordWrap={editorSettings.wordWrap}
                minimap={editorSettings.minimap}
                height="100%"
              />
            ) : currentView === 'diff' && diffData.original !== undefined ? (
              <DiffViewer
                originalValue={diffData.original}
                modifiedValue={diffData.modified}
                language={activeFile?.language || 'javascript'}
                theme={editorSettings.theme}
                title={diffData.title || 'Code Comparison'}
                height="100%"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <DocumentTextIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">No file selected</p>
                  <p className="text-sm">Create a new file or select an existing one to start coding</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Bottom Status Bar */}
          <div className="flex items-center justify-between px-4 py-2 bg-black/20 backdrop-blur-sm border-t border-white/10 text-sm">
            <div className="flex items-center space-x-4">
              {activeFile && (
                <>
                  <span className="text-gray-300">
                    {activeFile.name}
                  </span>
                  <span className="text-gray-400">
                    {activeFile.language?.toUpperCase()}
                  </span>
                  {activeFile.modified && (
                    <span className="text-orange-400">• Modified</span>
                  )}
                  <span className="text-gray-400">
                    {activeFile.content?.split('\n').length || 0} lines
                  </span>
                </>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1 text-gray-400 hover:text-white transition-colors"
                title="Toggle Sidebar"
              >
                <FolderIcon className="w-4 h-4" />
              </button>
              
              <span className="text-gray-400">
                {editorSettings.theme === 'vs-dark' ? '🌙' : '☀️'}
              </span>
            </div>
          </div>
        </GlassMorphismCard>
      </div>
    </div>
  );
};

export default ComprehensiveCodeEditor;