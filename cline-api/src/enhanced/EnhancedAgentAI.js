/**
 * EnhancedAgentAI - Advanced AI handler with beautiful UI generation
 * Provides high-quality code generation for complex projects
 */

const { getLLMProvider } = require('../services/llmService');

class EnhancedAgentAI {
    constructor(config) {
        this.config = config;
        this.provider = getLLMProvider(config.provider);
        this.conversationHistory = [];
        this.qualityThreshold = 8; // Target quality score 8-10
    }

    // Generate enhanced system prompt for beautiful UI generation
    buildEnhancedSystemPrompt(quality = 'advanced') {
        const qualityPrompts = {
            poor: `Generate basic functional code. Focus on accuracy and simplicity.`,
            medium: `Generate clean, well-structured code with normal styling and proper functionality.`,
            advanced: `Generate production-ready, beautiful code with:
- Advanced UI components with modern design patterns
- Comprehensive Tailwind CSS styling with responsive design
- Interactive elements and smooth animations
- Beautiful color schemes and typography
- Professional layouts and spacing
- Accessibility features and semantic HTML
- Modern React patterns (hooks, context, custom hooks)
- TypeScript support where applicable
- Performance optimizations
- Comprehensive error handling`
        };

        return `You are an expert full-stack developer creating ${quality} quality applications.

${qualityPrompts[quality]}

CRITICAL RULES FOR FILE GENERATION:
1. NEVER include markdown code blocks (no \`\`\`)
2. Return pure, clean code only
3. Include ALL necessary imports and exports
4. Use proper file extensions and content types
5. CSS files must contain CSS, not React components
6. HTML files must contain HTML, not React components
7. JS/JSX files contain JavaScript/React code only

QUALITY STANDARDS:
- Beautiful, modern UI design
- Responsive layouts that work on all devices
- Professional color schemes and typography
- Smooth animations and transitions
- Intuitive user interactions
- Clean, readable code structure
- Proper component organization
- Performance optimized

REACT COMPONENT PATTERNS:
- Use functional components with hooks
- Implement proper state management
- Add loading states and error handling
- Include interactive animations
- Use modern CSS-in-JS or Tailwind
- Implement proper accessibility

STYLING EXCELLENCE:
- Use advanced Tailwind CSS features
- Implement responsive design (sm:, md:, lg:, xl:)
- Add hover states and transitions
- Use proper spacing and typography scales
- Implement dark mode support where relevant
- Add subtle shadows and borders for depth`;
    }

    // Generate high-quality file content
    async generateAdvancedFileContent(fileSpec, projectContext, quality = 'advanced') {
        const enhancedPrompt = `${this.buildEnhancedSystemPrompt(quality)}

GENERATE FILE: ${fileSpec.path}
DESCRIPTION: ${fileSpec.description}
QUALITY LEVEL: ${quality}

PROJECT CONTEXT:
- Framework: ${projectContext.framework}
- Features: ${projectContext.features.join(', ')}
- Technologies: ${projectContext.technologies.join(', ')}
- UI Style: Modern, professional, beautiful

SPECIFIC REQUIREMENTS FOR ${fileSpec.path}:
${this.getFileSpecificRequirements(fileSpec.path, quality)}

Generate complete, ${quality}-quality file content now (NO markdown, NO explanations):`;

        try {
            const response = await this.provider.generateCode(enhancedPrompt, {
                temperature: quality === 'advanced' ? 0.2 : 0.1,
                maxTokens: 4000
            });

            let content = this.cleanAndEnhanceContent(response.content, fileSpec.path);
            
            // Quality validation and enhancement
            if (quality === 'advanced') {
                content = await this.enhanceCodeQuality(content, fileSpec.path, projectContext);
            }
            
            return content;
        } catch (error) {
            console.error('Error generating enhanced file content:', error);
            throw error;
        }
    }

    // Get file-specific requirements based on quality level
    getFileSpecificRequirements(filePath, quality) {
        const ext = filePath.split('.').pop();
        const fileName = filePath.split('/').pop();
        
        const requirements = {
            poor: {
                'js': 'Basic functional component with minimal styling',
                'jsx': 'Simple React component that works',
                'css': 'Basic CSS styles for functionality',
                'html': 'Clean HTML structure',
                'json': 'Correct JSON configuration'
            },
            medium: {
                'js': 'Well-structured component with proper styling and basic interactivity',
                'jsx': 'Clean React component with hooks and proper state management',
                'css': 'Organized CSS with responsive design basics',
                'html': 'Semantic HTML with proper structure',
                'json': 'Complete configuration with all necessary dependencies'
            },
            advanced: {
                'js': `Advanced JavaScript/React component with:
- Beautiful UI design with Tailwind CSS
- Interactive elements with smooth animations
- Responsive design for all screen sizes
- Loading states and error handling
- Accessibility features (ARIA labels, keyboard navigation)
- Performance optimizations`,
                'jsx': `Premium React component featuring:
- Modern component architecture with custom hooks
- Beautiful animations using Framer Motion or CSS transitions
- Advanced Tailwind CSS styling with gradients, shadows, and effects
- Interactive states (hover, focus, active)
- Responsive design with mobile-first approach
- TypeScript-ready prop handling`,
                'css': `Professional CSS with:
- Advanced Tailwind utilities and custom classes
- Beautiful color schemes and typography
- Smooth transitions and micro-animations
- Responsive design patterns
- CSS Grid and Flexbox layouts
- Modern CSS features (custom properties, calc)`,
                'html': `Semantic HTML5 with:
- Proper document structure and meta tags
- Accessibility features and ARIA labels
- SEO optimization
- Performance optimizations (preload, prefetch)
- Modern HTML features`,
                'json': `Complete configuration with:
- All necessary dependencies for advanced features
- Development and production scripts
- Linting and formatting configurations
- Type definitions and build optimizations`
            }
        };

        return requirements[quality][ext] || requirements[quality]['js'];
    }

    // Clean and enhance generated content
    cleanAndEnhanceContent(content, filePath) {
        // Remove markdown formatting
        content = content.replace(/^```[\w]*\n/gm, '');
        content = content.replace(/\n```$/gm, '');
        content = content.replace(/^```[\w]*$/gm, '');
        content = content.replace(/^```$/gm, '');
        
        // Remove explanatory text
        const lines = content.split('\n');
        let startIndex = 0;
        let endIndex = lines.length - 1;
        
        // Find code start
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.match(/^(import|export|const|let|var|function|class|<|{|\/\*|\*|\/\/|<!DOCTYPE)/)) {
                startIndex = i;
                break;
            }
        }
        
        // Find code end
        for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i].trim();
            if (line && !line.match(/^(Here|The|This|Generated|File|Code|Note:|```)/i)) {
                endIndex = i;
                break;
            }
        }
        
        content = lines.slice(startIndex, endIndex + 1).join('\n').trim();
        
        // Ensure proper file type content
        const ext = filePath.split('.').pop();
        
        if (ext === 'css' && content.includes('import React')) {
            // If CSS file contains React code, generate proper CSS
            content = this.generateProperCSS();
        }
        
        if (ext === 'html' && content.includes('import React')) {
            // If HTML file contains React code, generate proper HTML
            content = this.generateProperHTML();
        }
        
        return content;
    }

    // Generate proper CSS content
    generateProperCSS() {
        return `/* Modern CSS with Tailwind-inspired utilities */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

:root {
  --primary: #3b82f6;
  --primary-dark: #1d4ed8;
  --secondary: #64748b;
  --background: #f8fafc;
  --surface: #ffffff;
  --text: #0f172a;
  --text-muted: #64748b;
  --border: #e2e8f0;
  --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  line-height: 1.6;
  color: var(--text);
  background-color: var(--background);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s ease-in-out;
  cursor: pointer;
  border: none;
}

.btn-primary {
  background-color: var(--primary);
  color: white;
}

.btn-primary:hover {
  background-color: var(--primary-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow);
}

.card {
  background: var(--surface);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
}

.fade-in {
  animation: fadeIn 0.6s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 768px) {
  .container {
    padding: 0 0.5rem;
  }
  
  .card {
    padding: 1rem;
  }
}`;
    }

    // Generate proper HTML content
    generateProperHTML() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Modern web application with beautiful UI">
    <title>Beautiful Web App</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
        .gradient-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    </style>
</head>
<body class="bg-gray-50">
    <div id="root">
        <header class="bg-white shadow-lg">
            <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16">
                    <div class="flex items-center">
                        <h1 class="text-xl font-bold text-gray-900">Beautiful App</h1>
                    </div>
                    <div class="flex items-center space-x-4">
                        <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200">
                            Get Started
                        </button>
                    </div>
                </div>
            </nav>
        </header>

        <main class="min-h-screen">
            <section class="gradient-bg py-20">
                <div class="max-w-4xl mx-auto text-center px-4">
                    <h2 class="text-4xl md:text-6xl font-bold text-white mb-6">
                        Welcome to the Future
                    </h2>
                    <p class="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                        Experience the next generation of web applications with beautiful design and seamless functionality.
                    </p>
                    <div class="flex flex-col sm:flex-row gap-4 justify-center">
                        <button class="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition duration-200">
                            Explore Features
                        </button>
                        <button class="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition duration-200">
                            Learn More
                        </button>
                    </div>
                </div>
            </section>

            <section class="py-16 bg-white">
                <div class="max-w-6xl mx-auto px-4">
                    <div class="grid md:grid-cols-3 gap-8">
                        <div class="text-center p-6 rounded-xl bg-gray-50 hover:bg-gray-100 transition duration-200">
                            <div class="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                                </svg>
                            </div>
                            <h3 class="text-xl font-semibold mb-2">Lightning Fast</h3>
                            <p class="text-gray-600">Optimized for speed and performance on all devices.</p>
                        </div>
                        <div class="text-center p-6 rounded-xl bg-gray-50 hover:bg-gray-100 transition duration-200">
                            <div class="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                            <h3 class="text-xl font-semibold mb-2">Reliable</h3>
                            <p class="text-gray-600">Built with modern technologies for maximum reliability.</p>
                        </div>
                        <div class="text-center p-6 rounded-xl bg-gray-50 hover:bg-gray-100 transition duration-200">
                            <div class="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                                </svg>
                            </div>
                            <h3 class="text-xl font-semibold mb-2">User Friendly</h3>
                            <p class="text-gray-600">Designed with user experience as the top priority.</p>
                        </div>
                    </div>
                </div>
            </section>
        </main>

        <footer class="bg-gray-900 text-white py-8">
            <div class="max-w-6xl mx-auto text-center px-4">
                <p>&copy; 2024 Beautiful App. All rights reserved.</p>
            </div>
        </footer>
    </div>

    <script>
        // Add smooth scrolling and animations
        document.addEventListener('DOMContentLoaded', function() {
            // Fade in animation for elements
            const elements = document.querySelectorAll('.fade-in');
            elements.forEach(el => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    el.style.transition = 'all 0.6s ease-in-out';
                    el.style.opacity = '1';
                    el.style.transform = 'translateY(0)';
                }, 100);
            });
        });
    </script>
</body>
</html>`;
    }

    // Enhance code quality with additional passes
    async enhanceCodeQuality(content, filePath, projectContext) {
        // Add type checking, accessibility, and performance optimizations
        if (filePath.includes('.jsx') || filePath.includes('.js')) {
            content = this.enhanceReactComponent(content);
        }
        
        if (filePath.includes('.css')) {
            content = this.enhanceCSSStyles(content);
        }
        
        return content;
    }

    // Enhance React components
    enhanceReactComponent(content) {
        // Add proper React imports if missing
        if (!content.includes('import React') && content.includes('JSX')) {
            content = `import React, { useState, useEffect } from 'react';\n${content}`;
        }
        
        // Ensure proper export
        if (!content.includes('export default') && !content.includes('module.exports')) {
            const componentMatch = content.match(/(?:function|const)\s+(\w+)/);
            if (componentMatch) {
                content += `\n\nexport default ${componentMatch[1]};`;
            }
        }
        
        return content;
    }

    // Enhance CSS styles
    enhanceCSSStyles(content) {
        // Add modern CSS features if basic styles detected
        if (!content.includes('@import') && !content.includes('font-family')) {
            const enhancedHeader = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

/* Enhanced styles */
* {
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

`;
            content = enhancedHeader + content;
        }
        
        return content;
    }

    // Test project creation with different quality levels
    async testQualityLevels() {
        const testDescription = "Create a beautiful todo app with React and Tailwind CSS";
        const projectContext = {
            framework: 'React',
            features: ['todo-management', 'beautiful-ui'],
            technologies: ['Tailwind CSS', 'React Hooks']
        };

        const results = {};
        
        for (const quality of ['poor', 'medium', 'advanced']) {
            console.log(`Testing ${quality} quality generation...`);
            
            try {
                const content = await this.generateAdvancedFileContent(
                    { path: 'src/App.js', description: 'Main todo app component' },
                    projectContext,
                    quality
                );
                
                results[quality] = {
                    success: true,
                    length: content.length,
                    hasImports: content.includes('import'),
                    hasExports: content.includes('export'),
                    hasTailwind: content.includes('className'),
                    hasModernFeatures: content.includes('useState') || content.includes('useEffect')
                };
            } catch (error) {
                results[quality] = { success: false, error: error.message };
            }
        }
        
        return results;
    }
}

module.exports = EnhancedAgentAI;