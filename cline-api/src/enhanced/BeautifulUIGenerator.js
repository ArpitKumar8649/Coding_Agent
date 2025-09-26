/**
 * BeautifulUIGenerator - Specialized generator for beautiful UI components
 * Creates advanced, production-ready UI with modern design patterns
 */

class BeautifulUIGenerator {
    constructor(aiHandler) {
        this.aiHandler = aiHandler;
        this.designSystems = {
            modern: {
                colors: {
                    primary: 'blue-600',
                    secondary: 'gray-600',
                    accent: 'purple-500',
                    success: 'green-500',
                    warning: 'yellow-500',
                    error: 'red-500'
                },
                spacing: ['2', '4', '6', '8', '12', '16', '20', '24'],
                borderRadius: ['md', 'lg', 'xl', '2xl'],
                shadows: ['sm', 'md', 'lg', 'xl', '2xl']
            },
            minimalist: {
                colors: {
                    primary: 'gray-900',
                    secondary: 'gray-600',
                    accent: 'blue-500',
                    success: 'green-600',
                    warning: 'orange-500',
                    error: 'red-600'
                }
            },
            vibrant: {
                colors: {
                    primary: 'indigo-600',
                    secondary: 'pink-500',
                    accent: 'yellow-400',
                    success: 'emerald-500',
                    warning: 'amber-500',
                    error: 'rose-500'
                }
            }
        };
    }

    // Generate beautiful React component with advanced styling
    generateBeautifulComponent(componentName, description, features = [], designSystem = 'modern') {
        const design = this.designSystems[designSystem];
        
        return `import React, { useState, useEffect } from 'react';

const ${componentName} = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className={\`min-h-screen bg-gradient-to-br from-${design.colors.primary} to-${design.colors.accent} p-6 transition-all duration-500 \${isVisible ? 'opacity-100' : 'opacity-0'}\`}>
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 animate-fade-in">
            ${description}
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
            Experience the perfect blend of functionality and beautiful design
          </p>
        </header>

        {/* Main Content */}
        <main className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Feature Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
            <div className="space-y-6">
              ${this.generateFeatureList(features, design)}
            </div>
          </div>

          {/* Interactive Panel */}
          <div className="bg-white rounded-2xl p-8 shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Interactive Panel</h3>
            ${this.generateInteractiveElements(design)}
          </div>
        </main>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
          <button
            onClick={() => setIsLoading(!isLoading)}
            className={\`px-8 py-4 bg-white text-${design.colors.primary} rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 \${isLoading ? 'animate-pulse' : ''}\`}
          >
            {isLoading ? 'Loading...' : 'Get Started'}
          </button>
          <button className={\`px-8 py-4 border-2 border-white text-white rounded-xl font-semibold hover:bg-white hover:text-${design.colors.primary} transition-all duration-200\`}>
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
};

export default ${componentName};`;
    }

    // Generate feature list with beautiful styling
    generateFeatureList(features, design) {
        if (features.length === 0) {
            features = ['Modern Design', 'Responsive Layout', 'Interactive Elements', 'Performance Optimized'];
        }

        return features.map((feature, index) => `
              <div className="flex items-center space-x-4 p-4 rounded-xl bg-white/10 hover:bg-white/20 transition-colors duration-200">
                <div className="w-12 h-12 bg-gradient-to-r from-${design.colors.accent} to-${design.colors.primary} rounded-full flex items-center justify-center text-white font-bold">
                  ${index + 1}
                </div>
                <div>
                  <h4 className="text-white font-semibold text-lg">${feature}</h4>
                  <p className="text-white/70">Advanced ${feature.toLowerCase()} implementation</p>
                </div>
              </div>`).join('');
    }

    // Generate interactive elements
    generateInteractiveElements(design) {
        return `
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 text-center hover:bg-gray-100 transition-colors cursor-pointer">
                  <div className={\`w-16 h-16 bg-${design.colors.primary} rounded-full mx-auto mb-2 flex items-center justify-center\`}>
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h5 className="font-semibold text-gray-900">Fast</h5>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center hover:bg-gray-100 transition-colors cursor-pointer">
                  <div className={\`w-16 h-16 bg-${design.colors.success} rounded-full mx-auto mb-2 flex items-center justify-center\`}>
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h5 className="font-semibold text-gray-900">Reliable</h5>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-${design.colors.primary} to-${design.colors.accent} rounded-xl p-6 text-white">
                <h4 className="text-xl font-bold mb-2">Premium Features</h4>
                <p className="text-white/90">Unlock advanced functionality with beautiful animations and interactions.</p>
                <button className="mt-4 bg-white text-gray-900 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                  Explore Now
                </button>
              </div>
            </div>`;
    }

    // Generate beautiful CSS with advanced features
    generateBeautifulCSS(componentName, designSystem = 'modern') {
        const design = this.designSystems[designSystem];
        
        return `/* Beautiful CSS for ${componentName} */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

:root {
  --primary-color: theme('colors.${design.colors.primary}');
  --secondary-color: theme('colors.${design.colors.secondary}');
  --accent-color: theme('colors.${design.colors.accent}');
  --gradient-primary: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  --shadow-soft: 0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-medium: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  --shadow-large: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.${componentName.toLowerCase()} {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: var(--gradient-primary);
  min-height: 100vh;
  overflow-x: hidden;
}

/* Custom Animations */
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

.animate-fade-in {
  animation: fade-in 0.8s ease-out;
}

.animate-slide-up {
  animation: slide-up 0.6s ease-out;
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

/* Glass morphism effect */
.glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: var(--shadow-soft);
}

/* Gradient text */
.gradient-text {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Interactive elements */
.interactive-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.interactive-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: var(--shadow-large);
}

/* Button styles */
.btn-primary {
  background: var(--gradient-primary);
  color: white;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-soft);
  border: none;
  cursor: pointer;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-medium);
}

.btn-secondary {
  background: transparent;
  color: white;
  padding: 1rem 2rem;
  border: 2px solid white;
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.3s ease;
  cursor: pointer;
}

.btn-secondary:hover {
  background: white;
  color: var(--primary-color);
  transform: translateY(-2px);
}

/* Responsive design */
@media (max-width: 768px) {
  .${componentName.toLowerCase()} {
    padding: 1rem;
  }
  
  .glass {
    backdrop-filter: blur(5px);
  }
  
  .interactive-card:hover {
    transform: translateY(-4px) scale(1.01);
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  :root {
    --text-primary: #ffffff;
    --text-secondary: #e5e5e5;
    --background-primary: #1a1a1a;
    --background-secondary: #2d2d2d;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Focus styles for accessibility */
.interactive-card:focus,
.btn-primary:focus,
.btn-secondary:focus {
  outline: 2px solid white;
  outline-offset: 2px;
}`;
    }

    // Generate complete package.json with all modern dependencies
    generateAdvancedPackageJson(projectName, framework = 'React') {
        const baseConfig = {
            name: projectName.toLowerCase().replace(/\s+/g, '-'),
            version: "1.0.0",
            private: true,
            description: "Beautiful, modern web application built with advanced technologies"
        };

        const reactConfig = {
            ...baseConfig,
            dependencies: {
                "react": "^18.2.0",
                "react-dom": "^18.2.0",
                "react-router-dom": "^6.8.1",
                "framer-motion": "^10.12.4",
                "lucide-react": "^0.263.1",
                "@headlessui/react": "^1.7.14",
                "clsx": "^1.2.1",
                "tailwind-merge": "^1.12.0"
            },
            devDependencies: {
                "react-scripts": "5.0.1",
                "tailwindcss": "^3.3.2",
                "postcss": "^8.4.24",
                "autoprefixer": "^10.4.14",
                "@types/react": "^18.2.6",
                "@types/react-dom": "^18.2.4",
                "eslint": "^8.42.0",
                "prettier": "^2.8.8"
            },
            scripts: {
                "start": "react-scripts start",
                "build": "react-scripts build",
                "test": "react-scripts test",
                "eject": "react-scripts eject",
                "lint": "eslint src --ext .js,.jsx,.ts,.tsx",
                "format": "prettier --write src/**/*.{js,jsx,ts,tsx,css,md}"
            },
            browserslist: {
                "production": [
                    ">0.2%",
                    "not dead",
                    "not op_mini all"
                ],
                "development": [
                    "last 1 chrome version",
                    "last 1 firefox version",
                    "last 1 safari version"
                ]
            }
        };

        return JSON.stringify(reactConfig, null, 2);
    }

    // Generate Tailwind config with custom design system
    generateAdvancedTailwindConfig(designSystem = 'modern') {
        const design = this.designSystems[designSystem];
        
        return `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.8s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(50px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'soft': '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'medium': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'large': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.3)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}`;
    }
}

module.exports = BeautifulUIGenerator;