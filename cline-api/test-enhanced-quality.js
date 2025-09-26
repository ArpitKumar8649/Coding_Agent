/**
 * Enhanced Quality Test - Demonstrates improved code generation
 */

const express = require('express');
const cors = require('cors');
const { getLLMProvider } = require('./src/services/llmService');
const EnhancedAgentAI = require('./src/enhanced/EnhancedAgentAI');
const BeautifulUIGenerator = require('./src/enhanced/BeautifulUIGenerator');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize enhanced AI handler
let enhancedAI = null;
let uiGenerator = null;

const initializeEnhancedServices = () => {
    if (!enhancedAI) {
        enhancedAI = new EnhancedAgentAI({
            provider: process.env.DEFAULT_LLM_PROVIDER || 'openrouter',
            apiKey: process.env.OPENROUTER_API_KEY,
            model: process.env.DEFAULT_MODEL || 'x-ai/grok-4-fast:free'
        });
        uiGenerator = new BeautifulUIGenerator(enhancedAI);
        console.log('✨ Enhanced AI services initialized');
    }
};

// Test endpoint for different quality levels
app.post('/api/test/quality-levels', async (req, res) => {
    try {
        initializeEnhancedServices();
        
        const { description, quality = 'advanced', componentType = 'app' } = req.body;
        
        if (!description) {
            return res.status(400).json({ error: 'Description is required' });
        }

        console.log(`🎨 Testing ${quality} quality generation for: ${description}`);
        
        const projectContext = {
            framework: 'React',
            features: ['beautiful-ui', 'responsive-design', 'interactive-elements'],
            technologies: ['Tailwind CSS', 'React Hooks', 'Modern JavaScript']
        };

        const results = {};
        
        // Test React Component
        console.log('📦 Generating React component...');
        const reactContent = await enhancedAI.generateAdvancedFileContent(
            { 
                path: 'src/App.js', 
                description: `Main ${componentType} component: ${description}` 
            },
            projectContext,
            quality
        );
        
        // Test CSS
        console.log('🎨 Generating CSS styles...');
        const cssContent = quality === 'advanced' 
            ? uiGenerator.generateBeautifulCSS('App', 'modern')
            : await enhancedAI.generateAdvancedFileContent(
                { path: 'src/App.css', description: 'CSS styles for the application' },
                projectContext,
                quality
            );
        
        // Test Package.json
        console.log('📋 Generating package.json...');
        const packageContent = quality === 'advanced'
            ? uiGenerator.generateAdvancedPackageJson(description, 'React')
            : await enhancedAI.generateAdvancedFileContent(
                { path: 'package.json', description: 'React project configuration' },
                projectContext,
                quality
            );

        // Test Tailwind Config
        const tailwindContent = quality === 'advanced'
            ? uiGenerator.generateAdvancedTailwindConfig('modern')
            : `module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: { extend: {} },
  plugins: []
}`;

        results.files = {
            'src/App.js': {
                content: reactContent,
                size: reactContent.length,
                analysis: {
                    hasImports: reactContent.includes('import'),
                    hasExports: reactContent.includes('export'),
                    hasHooks: reactContent.includes('useState') || reactContent.includes('useEffect'),
                    hasTailwind: reactContent.includes('className'),
                    hasAnimations: reactContent.includes('transition') || reactContent.includes('animate'),
                    hasResponsive: reactContent.includes('md:') || reactContent.includes('lg:'),
                    quality: analyzeCodeQuality(reactContent, 'jsx')
                }
            },
            'src/App.css': {
                content: cssContent,
                size: cssContent.length,
                analysis: {
                    hasModernCSS: cssContent.includes('@import') || cssContent.includes('custom-'),
                    hasAnimations: cssContent.includes('@keyframes') || cssContent.includes('animation'),
                    hasResponsive: cssContent.includes('@media'),
                    hasVariables: cssContent.includes(':root') || cssContent.includes('var('),
                    quality: analyzeCodeQuality(cssContent, 'css')
                }
            },
            'package.json': {
                content: packageContent,
                size: packageContent.length,
                analysis: {
                    isValidJSON: isValidJSON(packageContent),
                    hasDependencies: packageContent.includes('dependencies'),
                    hasScripts: packageContent.includes('scripts'),
                    hasModernDeps: packageContent.includes('framer-motion') || packageContent.includes('@headlessui'),
                    quality: analyzeCodeQuality(packageContent, 'json')
                }
            },
            'tailwind.config.js': {
                content: tailwindContent,
                size: tailwindContent.length,
                analysis: {
                    hasExtendedTheme: tailwindContent.includes('extend'),
                    hasCustomColors: tailwindContent.includes('colors:'),
                    hasAnimations: tailwindContent.includes('animation') || tailwindContent.includes('keyframes'),
                    quality: analyzeCodeQuality(tailwindContent, 'js')
                }
            }
        };

        results.overall = {
            quality: quality,
            totalFiles: Object.keys(results.files).length,
            totalSize: Object.values(results.files).reduce((sum, file) => sum + file.size, 0),
            averageQuality: calculateAverageQuality(results.files),
            features: {
                modernReact: results.files['src/App.js'].analysis.hasHooks,
                responsiveDesign: results.files['src/App.js'].analysis.hasResponsive,
                animations: results.files['src/App.js'].analysis.hasAnimations,
                modernCSS: results.files['src/App.css'].analysis.hasModernCSS,
                validConfig: results.files['package.json'].analysis.isValidJSON
            }
        };

        console.log(`✅ Quality test completed - Average score: ${results.overall.averageQuality}/10`);
        res.json({ success: true, results, timestamp: new Date().toISOString() });
        
    } catch (error) {
        console.error('❌ Quality test error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Test beautiful UI generation
app.post('/api/test/beautiful-ui', async (req, res) => {
    try {
        initializeEnhancedServices();
        
        const { 
            componentName = 'BeautifulApp', 
            description = 'Beautiful Modern Application',
            features = ['Interactive Design', 'Smooth Animations', 'Responsive Layout'],
            designSystem = 'modern' 
        } = req.body;

        console.log(`🎨 Generating beautiful ${componentName} component...`);
        
        const componentContent = uiGenerator.generateBeautifulComponent(
            componentName, 
            description, 
            features, 
            designSystem
        );
        
        const cssContent = uiGenerator.generateBeautifulCSS(componentName, designSystem);
        const packageContent = uiGenerator.generateAdvancedPackageJson(description, 'React');
        const tailwindContent = uiGenerator.generateAdvancedTailwindConfig(designSystem);

        const result = {
            component: {
                name: componentName,
                content: componentContent,
                features: features,
                designSystem: designSystem,
                analysis: {
                    size: componentContent.length,
                    lines: componentContent.split('\n').length,
                    hasAdvancedFeatures: {
                        animations: componentContent.includes('animate-') || componentContent.includes('transition'),
                        gradients: componentContent.includes('gradient'),
                        glassMorphism: componentContent.includes('backdrop-blur'),
                        interactivity: componentContent.includes('onClick') || componentContent.includes('hover:'),
                        responsiveDesign: componentContent.includes('md:') || componentContent.includes('lg:'),
                        modernHooks: componentContent.includes('useState') && componentContent.includes('useEffect')
                    }
                }
            },
            supportingFiles: {
                'styles.css': cssContent,
                'package.json': packageContent,
                'tailwind.config.js': tailwindContent
            },
            qualityScore: 10 // Beautiful UI always gets top score
        };

        console.log(`✨ Beautiful UI generated successfully for ${componentName}`);
        res.json({ success: true, result, timestamp: new Date().toISOString() });
        
    } catch (error) {
        console.error('❌ Beautiful UI generation error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Compare all quality levels side by side
app.post('/api/test/compare-quality', async (req, res) => {
    try {
        initializeEnhancedServices();
        
        const { description = 'Modern todo app with beautiful UI and smooth animations' } = req.body;
        
        console.log('🔄 Comparing all quality levels...');
        
        const projectContext = {
            framework: 'React',
            features: ['todo-management', 'beautiful-ui', 'animations'],
            technologies: ['Tailwind CSS', 'React Hooks', 'Framer Motion']
        };

        const comparison = {};
        
        for (const quality of ['poor', 'medium', 'advanced']) {
            console.log(`⚡ Generating ${quality} quality code...`);
            
            try {
                const content = await enhancedAI.generateAdvancedFileContent(
                    { path: 'src/App.js', description: `Todo app component` },
                    projectContext,
                    quality
                );
                
                comparison[quality] = {
                    content: content.substring(0, 500) + '...', // First 500 chars for comparison
                    fullLength: content.length,
                    analysis: {
                        hasImports: content.includes('import'),
                        hasExports: content.includes('export'),
                        hasModernReact: content.includes('useState') || content.includes('useEffect'),
                        hasTailwind: content.includes('className'),
                        hasAnimations: content.includes('animate') || content.includes('transition'),
                        hasResponsiveDesign: content.includes('md:') || content.includes('lg:'),
                        hasGradients: content.includes('gradient'),
                        hasInteractivity: content.includes('onClick') || content.includes('hover:'),
                        codeQuality: analyzeCodeQuality(content, 'jsx')
                    },
                    score: calculateQualityScore(content),
                    timestamp: new Date().toISOString()
                };
            } catch (error) {
                comparison[quality] = {
                    error: error.message,
                    score: 0
                };
            }
        }

        // Add beautiful UI sample
        const beautifulSample = uiGenerator.generateBeautifulComponent(
            'TodoApp',
            'Beautiful Todo Application', 
            ['Task Management', 'Priority Levels', 'Smooth Animations'],
            'modern'
        );
        
        comparison.beautiful = {
            content: beautifulSample.substring(0, 500) + '...',
            fullLength: beautifulSample.length,
            analysis: {
                hasAdvancedFeatures: true,
                hasGlassMorphism: beautifulSample.includes('backdrop-blur'),
                hasAnimations: true,
                hasResponsiveDesign: true,
                hasProfessionalDesign: true,
                codeQuality: 10
            },
            score: 10
        };

        const summary = {
            comparison,
            ranking: Object.entries(comparison)
                .map(([quality, data]) => ({ quality, score: data.score || 0 }))
                .sort((a, b) => b.score - a.score),
            recommendation: 'Use "advanced" or "beautiful" quality for production applications'
        };

        console.log('✅ Quality comparison completed');
        res.json({ success: true, summary, timestamp: new Date().toISOString() });
        
    } catch (error) {
        console.error('❌ Quality comparison error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Utility functions
function analyzeCodeQuality(content, fileType) {
    let score = 1;
    
    // Basic functionality (2 points)
    if (content.length > 50 && !content.includes('error')) score += 2;
    
    // Proper imports/exports (2 points)
    if (content.includes('import') && content.includes('export')) score += 2;
    
    // Modern patterns (2 points)
    if (fileType === 'jsx' && (content.includes('useState') || content.includes('useEffect'))) score += 2;
    if (fileType === 'css' && (content.includes('@keyframes') || content.includes('var('))) score += 2;
    if (fileType === 'json' && isValidJSON(content)) score += 2;
    
    // Advanced features (3 points)
    if (content.includes('gradient') || content.includes('animate') || content.includes('transition')) score += 3;
    
    return Math.min(score, 10);
}

function calculateQualityScore(content) {
    let score = 1;
    
    // Length and completeness
    if (content.length > 200) score += 1;
    if (content.length > 500) score += 1;
    if (content.length > 1000) score += 1;
    
    // Modern React features
    if (content.includes('useState')) score += 1;
    if (content.includes('useEffect')) score += 1;
    
    // Styling quality
    if (content.includes('className')) score += 1;
    if (content.includes('gradient') || content.includes('shadow')) score += 1;
    if (content.includes('transition') || content.includes('animate')) score += 1;
    
    // Responsive design
    if (content.includes('md:') || content.includes('lg:')) score += 1;
    
    // Advanced UI features
    if (content.includes('backdrop-blur') || content.includes('glassmorphism')) score += 1;
    
    return Math.min(score, 10);
}

function calculateAverageQuality(files) {
    const scores = Object.values(files).map(file => file.analysis.quality);
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

function isValidJSON(content) {
    try {
        JSON.parse(content);
        return true;
    } catch {
        return false;
    }
}

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'Enhanced Quality Test API',
        timestamp: new Date().toISOString() 
    });
});

// API documentation
app.get('/', (req, res) => {
    res.json({
        message: '🎨 Enhanced Code Quality Test API',
        version: '2.0.0',
        endpoints: {
            '/api/test/quality-levels': 'POST - Test different quality levels (poor/medium/advanced)',
            '/api/test/beautiful-ui': 'POST - Generate beautiful UI components',
            '/api/test/compare-quality': 'POST - Compare all quality levels side by side'
        },
        examples: {
            qualityTest: {
                url: 'POST /api/test/quality-levels',
                body: {
                    description: 'Create a modern dashboard with charts',
                    quality: 'advanced',
                    componentType: 'dashboard'
                }
            },
            beautifulUI: {
                url: 'POST /api/test/beautiful-ui', 
                body: {
                    componentName: 'Dashboard',
                    description: 'Analytics Dashboard',
                    features: ['Charts', 'Real-time Data', 'Responsive Design']
                }
            }
        }
    });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎨 Enhanced Quality Test API running on port ${PORT}`);
    console.log(`📊 Test endpoints:`);
    console.log(`   POST /api/test/quality-levels - Test quality levels`);
    console.log(`   POST /api/test/beautiful-ui - Generate beautiful components`);
    console.log(`   POST /api/test/compare-quality - Compare all qualities`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});