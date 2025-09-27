/**
 * Advanced Monaco Editor Component
 * Full-featured code editor with IntelliSense, multi-language support, and collaborative features
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import {
  DocumentDuplicateIcon,
  EyeIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon
} from '@heroicons/react/24/outline';

const MonacoEditor = ({
  value = '',
  language = 'javascript',
  theme = 'vs-dark',
  readOnly = false,
  onChange,
  onSave,
  options = {},
  minimap = true,
  wordWrap = 'on',
  fontSize = 14,
  tabSize = 2,
  insertSpaces = true,
  className = '',
  height = '100%',
  width = '100%'
}) => {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editorSettings, setEditorSettings] = useState({
    fontSize,
    tabSize,
    wordWrap,
    minimap,
    lineNumbers: 'on',
    folding: true,
    bracketMatching: 'always',
    autoIndent: 'advanced',
    formatOnPaste: true,
    formatOnType: true
  });

  const handleEditorDidMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setIsLoading(false);

    // Configure IntelliSense for JavaScript/TypeScript
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      reactNamespace: 'React',
      allowJs: true,
      typeRoots: ['node_modules/@types']
    });

    // Add React types
    monaco.languages.typescript.javascriptDefaults.addExtraLib(
      `
      declare module 'react' {
        export interface ComponentProps<T> {
          className?: string;
          children?: React.ReactNode;
        }
        export function useState<T>(initialState: T): [T, (value: T) => void];
        export function useEffect(callback: () => void, deps?: any[]): void;
        export function useCallback<T extends Function>(callback: T, deps: any[]): T;
        export function useMemo<T>(factory: () => T, deps: any[]): T;
        export const Component: any;
        export const Fragment: any;
        export default React;
      }
      `,
      'file:///node_modules/@types/react/index.d.ts'
    );

    // Custom key bindings
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave?.(editor.getValue());
    });

    // Add custom actions
    editor.addAction({
      id: 'format-document',
      label: 'Format Document',
      keybindings: [
        monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF
      ],
      run: () => {
        editor.getAction('editor.action.formatDocument').run();
      }
    });

    editor.addAction({
      id: 'toggle-minimap',
      label: 'Toggle Minimap',
      run: () => {
        const currentOptions = editor.getOptions();
        const minimapEnabled = currentOptions.get(monaco.editor.EditorOption.minimap).enabled;
        editor.updateOptions({
          minimap: { enabled: !minimapEnabled }
        });
        setEditorSettings(prev => ({ ...prev, minimap: !minimapEnabled }));
      }
    });

    // Setup change detection
    editor.onDidChangeModelContent(() => {
      const value = editor.getValue();
      onChange?.(value);
    });

    // Setup cursor position tracking
    editor.onDidChangeCursorPosition((e) => {
      // Could emit cursor position for collaborative editing
      console.log('Cursor position:', e.position);
    });
  }, [onChange, onSave]);

  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
  };

  const copyToClipboard = () => {
    if (editorRef.current) {
      const value = editorRef.current.getValue();
      navigator.clipboard.writeText(value);
    }
  };

  const formatCode = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument').run();
    }
  };

  const findAndReplace = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.startFindReplaceAction').run();
    }
  };

  const updateEditorSettings = (newSettings) => {
    setEditorSettings(prev => ({ ...prev, ...newSettings }));
    if (editorRef.current) {
      editorRef.current.updateOptions(newSettings);
    }
  };

  const editorOptions = {
    selectOnLineNumbers: true,
    roundedSelection: false,
    readOnly,
    cursorStyle: 'line',
    automaticLayout: true,
    glyphMargin: true,
    useTabStops: true,
    fontSize: editorSettings.fontSize,
    tabSize: editorSettings.tabSize,
    insertSpaces,
    wordWrap: editorSettings.wordWrap,
    minimap: { enabled: editorSettings.minimap },
    lineNumbers: editorSettings.lineNumbers,
    folding: editorSettings.folding,
    bracketMatching: editorSettings.bracketMatching,
    autoIndent: editorSettings.autoIndent,
    formatOnPaste: editorSettings.formatOnPaste,
    formatOnType: editorSettings.formatOnType,
    scrollBeyondLastLine: false,
    smoothScrolling: true,
    cursorBlinking: 'blink',
    renderWhitespace: 'selection',
    renderControlCharacters: false,
    fontLigatures: true,
    suggest: {
      showKeywords: true,
      showSnippets: true,
      showClasses: true,
      showFunctions: true,
      showConstructors: true,
      showFields: true,
      showVariables: true,
      showInterfaces: true,
      showModules: true,
      showProperties: true,
      showEvents: true,
      showOperators: true,
      showUnits: true,
      showValues: true,
      showConstants: true,
      showEnums: true,
      showEnumMembers: true,
      showReferences: true,
      showWords: true,
      showColors: true,
      showFiles: true,
      showFolders: true
    },
    quickSuggestions: {
      other: true,
      comments: true,
      strings: true
    },
    parameterHints: {
      enabled: true,
      cycle: true
    },
    ...options
  };

  return (
    <div className={`relative h-full w-full ${className} ${isFullscreen ? 'fixed inset-0 z-50 bg-gray-900' : ''}`}>
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-300">
            {language.toUpperCase()}
          </span>
          <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
          <span className="text-xs text-gray-400">
            {value.split('\n').length} lines
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={findAndReplace}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
            title="Find and Replace (Ctrl+H)"
          >
            <MagnifyingGlassIcon className="w-4 h-4" />
          </button>
          
          <button
            onClick={copyToClipboard}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
            title="Copy to Clipboard"
          >
            <DocumentDuplicateIcon className="w-4 h-4" />
          </button>
          
          <button
            onClick={formatCode}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
            title="Format Code (Shift+Alt+F)"
          >
            <EyeIcon className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
            title="Editor Settings"
          >
            <Cog6ToothIcon className="w-4 h-4" />
          </button>
          
          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? (
              <ArrowsPointingInIcon className="w-4 h-4" />
            ) : (
              <ArrowsPointingOutIcon className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-12 right-4 z-10 w-80 bg-black/80 backdrop-blur-lg border border-white/20 rounded-lg p-4">
          <h3 className="text-white font-medium mb-3">Editor Settings</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Font Size</label>
              <input
                type="range"
                min="10"
                max="24"
                value={editorSettings.fontSize}
                onChange={(e) => updateEditorSettings({ fontSize: parseInt(e.target.value) })}
                className="w-full"
              />
              <span className="text-xs text-gray-400">{editorSettings.fontSize}px</span>
            </div>
            
            <div>
              <label className="block text-sm text-gray-300 mb-1">Tab Size</label>
              <select
                value={editorSettings.tabSize}
                onChange={(e) => updateEditorSettings({ tabSize: parseInt(e.target.value) })}
                className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm"
              >
                <option value={2}>2 spaces</option>
                <option value={4}>4 spaces</option>
                <option value={8}>8 spaces</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-gray-300 mb-1">Word Wrap</label>
              <select
                value={editorSettings.wordWrap}
                onChange={(e) => updateEditorSettings({ wordWrap: e.target.value })}
                className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm"
              >
                <option value="off">Off</option>
                <option value="on">On</option>
                <option value="wordWrapColumn">Word Wrap Column</option>
                <option value="bounded">Bounded</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editorSettings.minimap}
                  onChange={(e) => updateEditorSettings({ minimap: e.target.checked })}
                  className="rounded border-gray-600 bg-gray-800 text-blue-400 focus:ring-blue-400"
                />
                <span className="text-sm text-gray-300">Minimap</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editorSettings.folding}
                  onChange={(e) => updateEditorSettings({ folding: e.target.checked })}
                  className="rounded border-gray-600 bg-gray-800 text-blue-400 focus:ring-blue-400"
                />
                <span className="text-sm text-gray-300">Code Folding</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <div className="text-gray-400 text-sm">Loading Monaco Editor...</div>
          </div>
        </div>
      )}

      {/* Monaco Editor */}
      <div className="h-full">
        <Editor
          height={isFullscreen ? 'calc(100vh - 48px)' : height}
          width={width}
          language={language}
          theme={theme}
          value={value}
          options={editorOptions}
          onMount={handleEditorDidMount}
          loading={<div className="flex items-center justify-center h-full">Loading...</div>}
        />
      </div>
    </div>
  );
};

export default MonacoEditor;