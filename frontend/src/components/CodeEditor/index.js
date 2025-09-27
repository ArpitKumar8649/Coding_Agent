/**
 * Code Editor Components Export
 */

export { default as MonacoEditor } from './MonacoEditor';
export { default as FileTabManager } from './FileTabManager';
export { default as DiffViewer } from './DiffViewer';
export { default as ComprehensiveCodeEditor } from './ComprehensiveCodeEditor';

// Export additional utilities
export const getLanguageFromExtension = (filename) => {
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

export const createFileFromGeneration = (generatedFile, index = 0) => {
  return {
    id: `generated_${Date.now()}_${index}`,
    name: generatedFile.path || `generated_${index + 1}.js`,
    content: generatedFile.content || '',
    language: getLanguageFromExtension(generatedFile.path || 'file.js'),
    modified: false,
    created: new Date().toISOString(),
    generated: true,
    metadata: generatedFile.metadata || {}
  };
};