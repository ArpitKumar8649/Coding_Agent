/**
 * Diff Viewer Component
 * Shows before/after code comparisons using Monaco Editor
 */

import React, { useRef, useEffect, useState } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import {
  ArrowsRightLeftIcon,
  EyeIcon,
  EyeSlashIcon,
  DocumentDuplicateIcon,
  ArrowDownIcon,
  ArrowUpIcon
} from '@heroicons/react/24/outline';

const DiffViewer = ({
  originalValue = '',
  modifiedValue = '',
  language = 'javascript',
  theme = 'vs-dark',
  height = '500px',
  readOnly = true,
  renderSideBySide = true,
  className = '',
  title = 'Code Comparison',
  originalTitle = 'Original',
  modifiedTitle = 'Modified'
}) => {
  const diffEditorRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showInline, setShowInline] = useState(!renderSideBySide);
  const [showWhitespace, setShowWhitespace] = useState(false);
  const [currentDiff, setCurrentDiff] = useState(0);
  const [totalDiffs, setTotalDiffs] = useState(0);
  const [diffStats, setDiffStats] = useState({ additions: 0, deletions: 0, changes: 0 });

  const handleEditorDidMount = (editor, monaco) => {
    diffEditorRef.current = editor;
    setIsLoading(false);
    
    // Configure diff editor options
    editor.updateOptions({
      renderSideBySide: !showInline,
      renderWhitespace: showWhitespace ? 'all' : 'none',
      diffWordWrap: 'on',
      scrollBeyondLastLine: false,
      readOnly,
      automaticLayout: true,
      minimap: { enabled: true },
      scrollbar: {
        verticalScrollbarSize: 8,
        horizontalScrollbarSize: 8
      }
    });
    
    // Calculate diff statistics
    const lineChanges = editor.getLineChanges();
    if (lineChanges) {
      let additions = 0;
      let deletions = 0;
      let changes = 0;
      
      lineChanges.forEach(change => {
        if (change.originalEndLineNumber === 0) {
          additions += change.modifiedEndLineNumber - change.modifiedStartLineNumber + 1;
        } else if (change.modifiedEndLineNumber === 0) {
          deletions += change.originalEndLineNumber - change.originalStartLineNumber + 1;
        } else {
          changes += Math.max(
            change.originalEndLineNumber - change.originalStartLineNumber + 1,
            change.modifiedEndLineNumber - change.modifiedStartLineNumber + 1
          );
        }
      });
      
      setDiffStats({ additions, deletions, changes });
      setTotalDiffs(lineChanges.length);
    }
    
    // Setup navigation for changes
    editor.onDidUpdateDiff(() => {
      const lineChanges = editor.getLineChanges();
      setTotalDiffs(lineChanges ? lineChanges.length : 0);
    });
  };

  const toggleInlineView = () => {
    setShowInline(prev => {
      const newValue = !prev;
      if (diffEditorRef.current) {
        diffEditorRef.current.updateOptions({
          renderSideBySide: !newValue
        });
      }
      return newValue;
    });
  };

  const toggleWhitespace = () => {
    setShowWhitespace(prev => {
      const newValue = !prev;
      if (diffEditorRef.current) {
        diffEditorRef.current.updateOptions({
          renderWhitespace: newValue ? 'all' : 'none'
        });
      }
      return newValue;
    });
  };

  const navigateToNextDiff = () => {
    if (diffEditorRef.current && totalDiffs > 0) {
      diffEditorRef.current.getAction('editor.action.diffReview.next')?.run();
      setCurrentDiff(prev => Math.min(prev + 1, totalDiffs - 1));
    }
  };

  const navigateToPrevDiff = () => {
    if (diffEditorRef.current && totalDiffs > 0) {
      diffEditorRef.current.getAction('editor.action.diffReview.prev')?.run();
      setCurrentDiff(prev => Math.max(prev - 1, 0));
    }
  };

  const copyOriginal = () => {
    navigator.clipboard.writeText(originalValue);
  };

  const copyModified = () => {
    navigator.clipboard.writeText(modifiedValue);
  };

  const diffOptions = {
    selectOnLineNumbers: true,
    roundedSelection: false,
    readOnly,
    automaticLayout: true,
    glyphMargin: true,
    useTabStops: true,
    fontSize: 14,
    tabSize: 2,
    wordWrap: 'on',
    scrollBeyondLastLine: false,
    smoothScrolling: true,
    renderSideBySide: !showInline,
    renderWhitespace: showWhitespace ? 'all' : 'none',
    diffWordWrap: 'on',
    ignoreTrimWhitespace: false,
    renderIndicators: true,
    originalEditable: false,
    modifiedEditable: !readOnly,
    diffCodeLens: true
  };

  return (
    <div className={`relative h-full w-full ${className}`}>
      {/* Diff Viewer Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          
          {/* Diff Statistics */}
          <div className="flex items-center space-x-4 text-sm">
            {diffStats.additions > 0 && (
              <div className="flex items-center space-x-1 text-green-400">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                <span>+{diffStats.additions}</span>
              </div>
            )}
            
            {diffStats.deletions > 0 && (
              <div className="flex items-center space-x-1 text-red-400">
                <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                <span>-{diffStats.deletions}</span>
              </div>
            )}
            
            {diffStats.changes > 0 && (
              <div className="flex items-center space-x-1 text-yellow-400">
                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                <span>~{diffStats.changes}</span>
              </div>
            )}
            
            {totalDiffs > 0 && (
              <div className="text-gray-400">
                {totalDiffs} change{totalDiffs !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex items-center space-x-2">
          {/* Navigation */}
          {totalDiffs > 0 && (
            <div className="flex items-center space-x-1 mr-2">
              <button
                onClick={navigateToPrevDiff}
                disabled={currentDiff === 0}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Previous Change"
              >
                <ArrowUpIcon className="w-4 h-4" />
              </button>
              
              <span className="text-xs text-gray-400 px-2">
                {currentDiff + 1} / {totalDiffs}
              </span>
              
              <button
                onClick={navigateToNextDiff}
                disabled={currentDiff === totalDiffs - 1}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Next Change"
              >
                <ArrowDownIcon className="w-4 h-4" />
              </button>
            </div>
          )}
          
          <button
            onClick={toggleInlineView}
            className={`p-1.5 rounded transition-colors ${
              showInline 
                ? 'text-blue-400 bg-blue-400/20' 
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
            title={showInline ? 'Side by Side View' : 'Inline View'}
          >
            <ArrowsRightLeftIcon className="w-4 h-4" />
          </button>
          
          <button
            onClick={toggleWhitespace}
            className={`p-1.5 rounded transition-colors ${
              showWhitespace 
                ? 'text-purple-400 bg-purple-400/20' 
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
            title={showWhitespace ? 'Hide Whitespace' : 'Show Whitespace'}
          >
            {showWhitespace ? (
              <EyeSlashIcon className="w-4 h-4" />
            ) : (
              <EyeIcon className="w-4 h-4" />
            )}
          </button>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={copyOriginal}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
              title="Copy Original"
            >
              <DocumentDuplicateIcon className="w-4 h-4" />
            </button>
            
            <button
              onClick={copyModified}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
              title="Copy Modified"
            >
              <DocumentDuplicateIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Diff Headers */}
      {!showInline && (
        <div className="flex">
          <div className="flex-1 px-4 py-2 bg-red-900/20 border-r border-white/10">
            <span className="text-sm font-medium text-red-300">{originalTitle}</span>
          </div>
          <div className="flex-1 px-4 py-2 bg-green-900/20">
            <span className="text-sm font-medium text-green-300">{modifiedTitle}</span>
          </div>
        </div>
      )}
      
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <div className="text-gray-400 text-sm">Loading Diff Viewer...</div>
          </div>
        </div>
      )}
      
      {/* Monaco Diff Editor */}
      <div className="h-full">
        <DiffEditor
          height={height}
          language={language}
          theme={theme}
          original={originalValue}
          modified={modifiedValue}
          options={diffOptions}
          onMount={handleEditorDidMount}
          loading={<div className="flex items-center justify-center h-full">Loading...</div>}
        />
      </div>
    </div>
  );
};

export default DiffViewer;