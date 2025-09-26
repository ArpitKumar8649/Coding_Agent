import React, { useState } from 'react';
import { Copy, Check, FileText } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const CodeBlock = ({ language, code, className = '', filename }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code: ', err);
    }
  };

  const getLanguageColor = (lang) => {
    const colors = {
      javascript: 'text-yellow-400',
      typescript: 'text-blue-400',
      jsx: 'text-cyan-400',
      tsx: 'text-cyan-400',
      python: 'text-green-400',
      css: 'text-purple-400',
      html: 'text-orange-400',
      json: 'text-yellow-300',
      bash: 'text-gray-400',
      shell: 'text-gray-400',
      sql: 'text-pink-400',
      default: 'text-gray-400'
    };
    return colors[lang.toLowerCase()] || colors.default;
  };

  return (
    <div className={`code-block bg-gray-900 rounded-lg border border-gray-700 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-gray-400" />
          {filename && (
            <span className="text-sm text-gray-300 font-medium">{filename}</span>
          )}
          <span className={`text-xs font-medium ${getLanguageColor(language)}`}>
            {language.toUpperCase()}
          </span>
        </div>
        
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-green-400" />
              <span className="text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <div className="relative">
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: 'transparent',
            fontSize: '0.875rem',
            lineHeight: '1.5'
          }}
          showLineNumbers={code.split('\n').length > 1}
          lineNumberStyle={{
            color: '#6b7280',
            paddingRight: '1rem',
            minWidth: '2rem'
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export default CodeBlock;