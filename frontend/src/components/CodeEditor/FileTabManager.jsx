/**
 * File Tab Manager Component
 * Manages multiple file tabs with Monaco Editor integration
 */

import React, { useState, useCallback } from 'react';
import {
  XMarkIcon,
  PlusIcon,
  DocumentIcon,
  FolderIcon,
  CodeBracketIcon
} from '@heroicons/react/24/outline';

const FileTabManager = ({ 
  files = [], 
  activeFileId, 
  onFileSelect, 
  onFileClose, 
  onFileAdd, 
  onFileRename,
  onFileSave,
  className = '' 
}) => {
  const [draggedTab, setDraggedTab] = useState(null);
  const [isAddingFile, setIsAddingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    
    switch (ext) {
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return <CodeBracketIcon className="w-4 h-4 text-yellow-400" />;
      case 'css':
      case 'scss':
      case 'less':
        return <DocumentIcon className="w-4 h-4 text-blue-400" />;
      case 'html':
      case 'htm':
        return <DocumentIcon className="w-4 h-4 text-orange-400" />;
      case 'json':
        return <DocumentIcon className="w-4 h-4 text-green-400" />;
      case 'md':
      case 'mdx':
        return <DocumentIcon className="w-4 h-4 text-gray-400" />;
      case 'py':
        return <CodeBracketIcon className="w-4 h-4 text-blue-500" />;
      case 'java':
      case 'kt':
        return <CodeBracketIcon className="w-4 h-4 text-red-500" />;
      case 'go':
        return <CodeBracketIcon className="w-4 h-4 text-cyan-400" />;
      case 'rs':
        return <CodeBracketIcon className="w-4 h-4 text-orange-500" />;
      case 'php':
        return <CodeBracketIcon className="w-4 h-4 text-purple-400" />;
      default:
        return <DocumentIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  const getLanguageFromExtension = (filename) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    
    const languageMap = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'css': 'css',
      'scss': 'scss',
      'less': 'less',
      'html': 'html',
      'htm': 'html',
      'json': 'json',
      'md': 'markdown',
      'mdx': 'markdown',
      'py': 'python',
      'java': 'java',
      'kt': 'kotlin',
      'go': 'go',
      'rs': 'rust',
      'php': 'php',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'sql': 'sql',
      'sh': 'shell',
      'bash': 'shell',
      'zsh': 'shell',
      'dockerfile': 'dockerfile',
      'r': 'r',
      'swift': 'swift',
      'c': 'c',
      'cpp': 'cpp',
      'cs': 'csharp',
      'rb': 'ruby',
      'scala': 'scala',
      'dart': 'dart'
    };
    
    return languageMap[ext] || 'plaintext';
  };

  const handleDragStart = (e, fileId) => {
    setDraggedTab(fileId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetFileId) => {
    e.preventDefault();
    
    if (draggedTab && draggedTab !== targetFileId) {
      // Reorder tabs logic would go here
      console.log('Reorder tabs:', draggedTab, 'to', targetFileId);
    }
    
    setDraggedTab(null);
  };

  const handleAddFile = () => {
    if (newFileName.trim()) {
      const fileId = Date.now().toString();
      const newFile = {
        id: fileId,
        name: newFileName.trim(),
        content: '',
        language: getLanguageFromExtension(newFileName.trim()),
        modified: false,
        created: new Date().toISOString()
      };
      
      onFileAdd?.(newFile);
      setNewFileName('');
      setIsAddingFile(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddFile();
    } else if (e.key === 'Escape') {
      setIsAddingFile(false);
      setNewFileName('');
    }
  };

  return (
    <div className={`flex items-center bg-black/20 backdrop-blur-sm border-b border-white/10 ${className}`}>
      {/* File Tabs */}
      <div className="flex-1 flex items-center overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
        {files.map((file) => (
          <div
            key={file.id}
            draggable
            onDragStart={(e) => handleDragStart(e, file.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, file.id)}
            className={`
              flex items-center space-x-2 px-4 py-2 border-r border-white/10 cursor-pointer
              transition-colors duration-200 group relative min-w-0 max-w-48
              ${
                activeFileId === file.id
                  ? 'bg-white/10 text-white border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }
              ${draggedTab === file.id ? 'opacity-50' : ''}
            `}
            onClick={() => onFileSelect?.(file.id)}
          >
            {getFileIcon(file.name)}
            
            <span className="text-sm font-medium truncate flex-1">
              {file.name}
              {file.modified && (
                <span className="ml-1 text-orange-400">•</span>
              )}
            </span>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFileClose?.(file.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all"
            >
              <XMarkIcon className="w-3 h-3" />
            </button>
            
            {/* Drag indicator */}
            {draggedTab === file.id && (
              <div className="absolute top-0 left-0 w-full h-0.5 bg-blue-400"></div>
            )}
          </div>
        ))}
        
        {/* Add File Input */}
        {isAddingFile && (
          <div className="flex items-center space-x-2 px-4 py-2 border-r border-white/10 bg-white/5">
            <DocumentIcon className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={handleKeyPress}
              onBlur={() => {
                if (!newFileName.trim()) {
                  setIsAddingFile(false);
                }
              }}
              placeholder="filename.ext"
              className="bg-transparent text-white text-sm outline-none border-b border-blue-400 min-w-24"
              autoFocus
            />
          </div>
        )}
      </div>
      
      {/* Add File Button */}
      <button
        onClick={() => setIsAddingFile(true)}
        className="flex items-center space-x-1 px-3 py-2 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
        title="Add New File"
      >
        <PlusIcon className="w-4 h-4" />
        <span className="text-sm font-medium hidden sm:block">New</span>
      </button>
      
      {/* File Count */}
      <div className="px-3 py-2 text-xs text-gray-500 border-l border-white/10">
        {files.length} file{files.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

export default FileTabManager;