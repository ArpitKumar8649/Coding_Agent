/**
 * PlanningEngine - Handles project analysis and execution planning
 * Extracted intelligence from Cline's decision-making logic
 */

class PlanningEngine {
    constructor(aiHandler) {
        this.aiHandler = aiHandler;
        this.projectTemplates = new Map();
        this.initializeTemplates();
    }

    // Initialize project templates for common patterns
    initializeTemplates() {
        this.projectTemplates.set('react-app', {
            framework: 'React',
            files: [
                { path: 'package.json', template: 'react-package' },
                { path: 'src/index.js', template: 'react-index' },
                { path: 'src/App.js', template: 'react-app' },
                { path: 'src/App.css', template: 'react-css' },
                { path: 'public/index.html', template: 'html-template' }
            ],
            dependencies: ['react', 'react-dom', 'react-scripts']
        });

        this.projectTemplates.set('node-api', {
            framework: 'Node.js',
            files: [
                { path: 'package.json', template: 'node-package' },
                { path: 'server.js', template: 'express-server' },
                { path: 'routes/index.js', template: 'express-routes' },
                { path: '.env.example', template: 'env-example' }
            ],
            dependencies: ['express', 'cors', 'dotenv']
        });

        this.projectTemplates.set('html-website', {
            framework: 'HTML/CSS/JS',
            files: [
                { path: 'index.html', template: 'html-index' },
                { path: 'style.css', template: 'css-main' },
                { path: 'script.js', template: 'js-main' }
            ],
            dependencies: []
        });
    }

    // Analyze requirements and determine project structure
    async analyzeRequirements(description, options = {}) {
        const analysis = {
            projectType: this.detectProjectType(description),
            framework: this.detectFramework(description, options),
            complexity: this.assessComplexity(description),
            features: this.extractFeatures(description),
            technologies: this.identifyTechnologies(description),
            estimatedFiles: 0,
            estimatedTime: 0
        };

        // Use AI to enhance analysis
        const enhancedAnalysis = await this.aiHandler.analyzeRequirements(description, analysis);
        
        return {
            ...analysis,
            ...enhancedAnalysis,
            timestamp: new Date().toISOString()
        };
    }

    // Create detailed execution plan
    async createExecutionPlan(analysis, workspace) {
        const steps = [];
        let stepId = 1;

        // 1. Setup phase
        steps.push({
            id: stepId++,
            phase: 'setup',
            type: 'create_workspace',
            description: 'Initialize project workspace',
            path: workspace,
            estimatedTime: 1000
        });

        // 2. Configuration files
        if (analysis.framework) {
            const configSteps = await this.generateConfigurationSteps(analysis, stepId);
            steps.push(...configSteps);
            stepId += configSteps.length;
        }

        // 3. Core files
        const coreSteps = await this.generateCoreFileSteps(analysis, stepId);
        steps.push(...coreSteps);
        stepId += coreSteps.length;

        // 4. Feature implementation
        const featureSteps = await this.generateFeatureSteps(analysis, stepId);
        steps.push(...featureSteps);
        stepId += featureSteps.length;

        // 5. Validation and testing
        steps.push({
            id: stepId++,
            phase: 'validation',
            type: 'validate_syntax',
            description: 'Validate code syntax and structure',
            estimatedTime: 2000
        });

        const executionPlan = {
            id: Date.now().toString(),
            analysis,
            workspace,
            steps,
            totalSteps: steps.length,
            estimatedTotalTime: steps.reduce((sum, step) => sum + (step.estimatedTime || 1000), 0),
            created: new Date().toISOString()
        };

        return executionPlan;
    }

    // Generate configuration file steps
    async generateConfigurationSteps(analysis, startId) {
        const steps = [];
        let stepId = startId;

        switch (analysis.framework) {
            case 'React':
                steps.push({
                    id: stepId++,
                    phase: 'configuration',
                    type: 'create_file',
                    description: 'Create package.json with React dependencies',
                    path: 'package.json',
                    template: 'react-package',
                    estimatedTime: 1500
                });
                
                if (analysis.technologies.includes('TypeScript')) {
                    steps.push({
                        id: stepId++,
                        phase: 'configuration',
                        type: 'create_file',
                        description: 'Create TypeScript configuration',
                        path: 'tsconfig.json',
                        template: 'typescript-config',
                        estimatedTime: 1000
                    });
                }

                if (analysis.technologies.includes('Tailwind')) {
                    steps.push({
                        id: stepId++,
                        phase: 'configuration',
                        type: 'create_file',
                        description: 'Create Tailwind CSS configuration',
                        path: 'tailwind.config.js',
                        template: 'tailwind-config',
                        estimatedTime: 1000
                    });
                }
                break;

            case 'Node.js':
                steps.push({
                    id: stepId++,
                    phase: 'configuration',
                    type: 'create_file',
                    description: 'Create package.json with Node.js dependencies',
                    path: 'package.json',
                    template: 'node-package',
                    estimatedTime: 1500
                });
                break;
        }

        return steps;
    }

    // Generate core application file steps
    async generateCoreFileSteps(analysis, startId) {
        const steps = [];
        let stepId = startId;

        const template = this.projectTemplates.get(this.getTemplateKey(analysis.framework));
        
        if (template) {
            for (const file of template.files) {
                if (file.path !== 'package.json') { // Skip if already added in config
                    steps.push({
                        id: stepId++,
                        phase: 'core',
                        type: 'create_file',
                        description: `Create ${file.path}`,
                        path: file.path,
                        template: file.template,
                        estimatedTime: 2000
                    });
                }
            }
        }

        return steps;
    }

    // Generate feature implementation steps
    async generateFeatureSteps(analysis, startId) {
        const steps = [];
        let stepId = startId;

        for (const feature of analysis.features) {
            const featureSteps = await this.planFeatureImplementation(feature, analysis.framework, stepId);
            steps.push(...featureSteps);
            stepId += featureSteps.length;
        }

        return steps;
    }

    // Plan implementation for specific features
    async planFeatureImplementation(feature, framework, startId) {
        const steps = [];
        let stepId = startId;

        // Use AI to plan feature implementation
        const featurePlan = await this.aiHandler.planFeature(feature, framework);
        
        if (featurePlan && featurePlan.files) {
            for (const file of featurePlan.files) {
                steps.push({
                    id: stepId++,
                    phase: 'features',
                    type: 'create_file',
                    description: `Implement ${feature}: ${file.description}`,
                    path: file.path,
                    feature: feature,
                    estimatedTime: 3000
                });
            }
        }

        return steps;
    }

    // Detect project type from description
    detectProjectType(description) {
        const lower = description.toLowerCase();
        
        if (lower.includes('website') || lower.includes('landing page')) return 'website';
        if (lower.includes('api') || lower.includes('server') || lower.includes('backend')) return 'api';
        if (lower.includes('app') || lower.includes('application')) return 'application';
        if (lower.includes('component') || lower.includes('library')) return 'library';
        
        return 'application'; // default
    }

    // Detect framework from description and options
    detectFramework(description, options) {
        const lower = description.toLowerCase();
        
        // Check explicit options first
        if (options.framework) {
            return options.framework;
        }
        
        // Detect from description
        if (lower.includes('react')) return 'React';
        if (lower.includes('vue')) return 'Vue.js';
        if (lower.includes('angular')) return 'Angular';
        if (lower.includes('node') || lower.includes('express')) return 'Node.js';
        if (lower.includes('python') || lower.includes('flask') || lower.includes('django')) return 'Python';
        if (lower.includes('html') || lower.includes('css') || lower.includes('javascript')) return 'HTML/CSS/JS';
        
        return 'HTML/CSS/JS'; // default for web projects
    }

    // Assess project complexity
    assessComplexity(description) {
        const lower = description.toLowerCase();
        let complexity = 1; // base complexity
        
        // Add complexity for features
        if (lower.includes('auth') || lower.includes('login')) complexity += 2;
        if (lower.includes('database') || lower.includes('api')) complexity += 2;
        if (lower.includes('realtime') || lower.includes('websocket')) complexity += 3;
        if (lower.includes('payment') || lower.includes('stripe')) complexity += 3;
        if (lower.includes('admin') || lower.includes('dashboard')) complexity += 2;
        
        return Math.min(complexity, 10); // cap at 10
    }

    // Extract features from description
    extractFeatures(description) {
        const features = [];
        const lower = description.toLowerCase();
        
        if (lower.includes('auth') || lower.includes('login') || lower.includes('signup')) {
            features.push('authentication');
        }
        if (lower.includes('crud') || lower.includes('create') && lower.includes('edit')) {
            features.push('crud-operations');
        }
        if (lower.includes('search')) {
            features.push('search');
        }
        if (lower.includes('filter')) {
            features.push('filtering');
        }
        if (lower.includes('sort')) {
            features.push('sorting');
        }
        if (lower.includes('pagination')) {
            features.push('pagination');
        }
        if (lower.includes('api integration') || lower.includes('rest api')) {
            features.push('api-integration');
        }
        if (lower.includes('responsive')) {
            features.push('responsive-design');
        }
        if (lower.includes('dark mode')) {
            features.push('dark-mode');
        }
        
        return features;
    }

    // Identify technologies from description
    identifyTechnologies(description) {
        const technologies = [];
        const lower = description.toLowerCase();
        
        if (lower.includes('typescript') || lower.includes('ts')) technologies.push('TypeScript');
        if (lower.includes('tailwind')) technologies.push('Tailwind');
        if (lower.includes('bootstrap')) technologies.push('Bootstrap');
        if (lower.includes('sass') || lower.includes('scss')) technologies.push('Sass');
        if (lower.includes('mongodb')) technologies.push('MongoDB');
        if (lower.includes('mysql')) technologies.push('MySQL');
        if (lower.includes('postgresql') || lower.includes('postgres')) technologies.push('PostgreSQL');
        if (lower.includes('redis')) technologies.push('Redis');
        if (lower.includes('jwt')) technologies.push('JWT');
        if (lower.includes('oauth')) technologies.push('OAuth');
        
        return technologies;
    }

    // Get template key for framework
    getTemplateKey(framework) {
        const mapping = {
            'React': 'react-app',
            'Vue.js': 'vue-app',
            'Node.js': 'node-api',
            'HTML/CSS/JS': 'html-website'
        };
        return mapping[framework] || 'html-website';
    }
}

module.exports = PlanningEngine;