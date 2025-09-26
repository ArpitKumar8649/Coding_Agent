/**
 * Advanced Context Manager - Full project understanding and state management
 */

const fs = require('fs').promises;
const path = require('path');

class ContextManager {
    constructor() {
        this.contexts = new Map(); // sessionId -> context data
        this.projectAnalyzer = new ProjectAnalyzer();
        this.dependencyTracker = new DependencyTracker();
        this.codePatternRecognizer = new CodePatternRecognizer();
    }

    async analyzeProject(sessionId, taskData) {
        const { description, requirements, workspace } = taskData;
        
        // 1. Analyze existing project structure (if any)
        const existingStructure = await this.analyzeExistingStructure(workspace);
        
        // 2. Understand requirements and extract technical details
        const technicalSpecs = await this.extractTechnicalSpecs(description, requirements);
        
        // 3. Plan file structure and dependencies
        const projectPlan = await this.createProjectPlan(technicalSpecs, existingStructure);
        
        // 4. Build comprehensive context
        const context = {
            sessionId,
            workspace,
            timestamp: Date.now(),
            
            // Project Understanding
            projectType: technicalSpecs.projectType,
            framework: technicalSpecs.framework,
            technologies: technicalSpecs.technologies,
            architecture: technicalSpecs.architecture,
            
            // File Planning
            requiredFiles: projectPlan.files,
            dependencies: projectPlan.dependencies,
            fileRelationships: projectPlan.relationships,
            
            // Code Standards
            codeStyle: technicalSpecs.codeStyle,
            namingConventions: technicalSpecs.namingConventions,
            patterns: technicalSpecs.patterns,
            
            // Quality Requirements
            qualityLevel: requirements.quality || 'advanced',
            features: technicalSpecs.features,
            constraints: requirements.constraints || [],
            
            // Learning from previous sessions
            learnedPatterns: await this.getLearningHistory(technicalSpecs),
            
            // State tracking
            completedFiles: [],
            pendingFiles: [],
            errors: [],
            feedback: []
        };
        
        this.contexts.set(sessionId, context);
        return context;
    }

    async analyzeExistingStructure(workspace) {
        try {
            const structure = {};
            
            // Check if workspace exists and has files
            const exists = await fs.access(workspace).then(() => true).catch(() => false);
            if (!exists) {
                return { exists: false, files: [], structure: {} };
            }
            
            // Analyze directory structure
            const files = await this.scanDirectory(workspace);
            
            // Detect project type and framework
            const projectInfo = await this.projectAnalyzer.detectProjectType(files);
            
            // Analyze existing code patterns
            const codePatterns = await this.codePatternRecognizer.analyzePatterns(files, workspace);
            
            return {
                exists: true,
                files,
                projectInfo,
                codePatterns,
                structure: await this.buildStructureTree(workspace)
            };
        } catch (error) {
            console.error('Error analyzing existing structure:', error);
            return { exists: false, error: error.message };
        }
    }

    async extractTechnicalSpecs(description, requirements) {
        // AI-powered extraction of technical requirements
        const specs = {
            projectType: this.detectProjectType(description),
            framework: this.detectFramework(description, requirements),
            technologies: this.extractTechnologies(description, requirements),
            architecture: this.suggestArchitecture(description, requirements),
            features: this.extractFeatures(description, requirements),
            codeStyle: requirements.codeStyle || 'modern',
            namingConventions: requirements.namingConventions || 'camelCase',
            patterns: this.suggestPatterns(description, requirements)
        };
        
        return specs;
    }

    async createProjectPlan(specs, existingStructure) {
        const planner = new ProjectPlanner(specs, existingStructure);
        
        return {
            files: await planner.planRequiredFiles(),
            dependencies: await planner.identifyDependencies(),
            relationships: await planner.mapFileRelationships(),
            buildOrder: await planner.determineBuildOrder()
        };
    }

    async getContext(sessionId) {
        return this.contexts.get(sessionId);
    }

    async getContextSummary(sessionId) {
        const context = this.contexts.get(sessionId);
        if (!context) return null;
        
        return {
            sessionId: context.sessionId,
            projectType: context.projectType,
            framework: context.framework,
            technologies: context.technologies,
            totalFiles: context.requiredFiles.length,
            completedFiles: context.completedFiles.length,
            qualityLevel: context.qualityLevel,
            progress: (context.completedFiles.length / context.requiredFiles.length) * 100
        };
    }

    async updateFromFeedback(sessionId, feedback) {
        const context = this.contexts.get(sessionId);
        if (!context) return;
        
        // Learn from user feedback and adjust future generation
        context.feedback.push({
            feedback,
            timestamp: Date.now(),
            applied: false
        });
        
        // Apply feedback to improve future generations
        await this.applyFeedbackLearning(context, feedback);
    }

    // Helper methods for technical analysis
    detectProjectType(description) {
        const keywords = description.toLowerCase();
        
        if (keywords.includes('web app') || keywords.includes('website')) return 'web-application';
        if (keywords.includes('api') || keywords.includes('backend')) return 'api-service';
        if (keywords.includes('dashboard') || keywords.includes('admin')) return 'dashboard';
        if (keywords.includes('mobile') || keywords.includes('app')) return 'mobile-app';
        if (keywords.includes('cli') || keywords.includes('command')) return 'cli-tool';
        
        return 'web-application'; // default
    }

    detectFramework(description, requirements) {
        const text = (description + ' ' + JSON.stringify(requirements)).toLowerCase();
        
        if (text.includes('react')) return 'React';
        if (text.includes('vue')) return 'Vue.js';
        if (text.includes('angular')) return 'Angular';
        if (text.includes('svelte')) return 'Svelte';
        if (text.includes('next')) return 'Next.js';
        if (text.includes('nuxt')) return 'Nuxt.js';
        
        return 'React'; // default for modern web apps
    }

    extractTechnologies(description, requirements) {
        const technologies = new Set();
        const text = (description + ' ' + JSON.stringify(requirements)).toLowerCase();
        
        // Frontend technologies
        if (text.includes('tailwind')) technologies.add('Tailwind CSS');
        if (text.includes('typescript')) technologies.add('TypeScript');
        if (text.includes('javascript')) technologies.add('JavaScript');
        
        // Backend technologies  
        if (text.includes('node') || text.includes('express')) technologies.add('Node.js');
        if (text.includes('python') || text.includes('flask') || text.includes('django')) technologies.add('Python');
        
        // Databases
        if (text.includes('mongodb')) technologies.add('MongoDB');
        if (text.includes('postgres')) technologies.add('PostgreSQL');
        if (text.includes('mysql')) technologies.add('MySQL');
        
        // Default stack for web apps
        if (technologies.size === 0) {
            technologies.add('React');
            technologies.add('Tailwind CSS');
            technologies.add('JavaScript');
        }
        
        return Array.from(technologies);
    }

    suggestArchitecture(description, requirements) {
        const complexity = this.assessComplexity(description, requirements);
        
        if (complexity === 'simple') {
            return {
                type: 'single-page-application',
                pattern: 'component-based',
                structure: 'flat'
            };
        } else if (complexity === 'medium') {
            return {
                type: 'multi-page-application', 
                pattern: 'feature-based',
                structure: 'modular'
            };
        } else {
            return {
                type: 'enterprise-application',
                pattern: 'domain-driven',
                structure: 'layered'
            };
        }
    }

    extractFeatures(description, requirements) {
        const features = [];
        const text = description.toLowerCase();
        
        // Common features detection
        if (text.includes('auth') || text.includes('login')) features.push('authentication');
        if (text.includes('dashboard')) features.push('dashboard');
        if (text.includes('crud') || text.includes('manage')) features.push('data-management');
        if (text.includes('search')) features.push('search');
        if (text.includes('filter')) features.push('filtering');
        if (text.includes('chart') || text.includes('graph')) features.push('data-visualization');
        if (text.includes('responsive')) features.push('responsive-design');
        if (text.includes('real-time')) features.push('real-time-updates');
        
        return features;
    }

    assessComplexity(description, requirements) {
        const featureCount = this.extractFeatures(description, requirements).length;
        const wordCount = description.split(' ').length;
        
        if (featureCount <= 3 && wordCount <= 50) return 'simple';
        if (featureCount <= 8 && wordCount <= 200) return 'medium';
        return 'complex';
    }

    async scanDirectory(dirPath) {
        const files = [];
        
        try {
            const entries = await fs.readdir(dirPath);
            
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry);
                const stats = await fs.stat(fullPath);
                
                if (stats.isFile()) {
                    files.push({
                        name: entry,
                        path: fullPath,
                        size: stats.size,
                        ext: path.extname(entry)
                    });
                } else if (stats.isDirectory() && !entry.startsWith('.')) {
                    const subFiles = await this.scanDirectory(fullPath);
                    files.push(...subFiles);
                }
            }
        } catch (error) {
            console.error('Error scanning directory:', error);
        }
        
        return files;
    }
}

// Supporting classes
class ProjectAnalyzer {
    async detectProjectType(files) {
        const packageJson = files.find(f => f.name === 'package.json');
        if (packageJson) {
            const content = await fs.readFile(packageJson.path, 'utf8');
            const pkg = JSON.parse(content);
            
            return {
                type: 'web-application',
                framework: this.detectFrameworkFromPackage(pkg),
                hasBackend: this.hasBackendDeps(pkg),
                hasFrontend: this.hasFrontendDeps(pkg)
            };
        }
        
        const pyFiles = files.filter(f => f.ext === '.py');
        if (pyFiles.length > 0) {
            return { type: 'python-application' };
        }
        
        return { type: 'unknown' };
    }

    detectFrameworkFromPackage(pkg) {
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        
        if (deps.react) return 'React';
        if (deps.vue) return 'Vue.js';
        if (deps.angular) return 'Angular';
        if (deps.svelte) return 'Svelte';
        
        return 'unknown';
    }

    hasBackendDeps(pkg) {
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        return !!(deps.express || deps.fastify || deps.koa);
    }

    hasFrontendDeps(pkg) {
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        return !!(deps.react || deps.vue || deps.angular);
    }
}

class CodePatternRecognizer {
    async analyzePatterns(files, workspace) {
        const patterns = {
            componentPatterns: [],
            stylePatterns: [],
            stateManagement: 'none',
            testingFramework: 'none'
        };
        
        // Analyze React components
        const jsFiles = files.filter(f => f.ext === '.js' || f.ext === '.jsx' || f.ext === '.ts' || f.ext === '.tsx');
        
        for (const file of jsFiles.slice(0, 5)) { // Analyze first 5 files
            try {
                const content = await fs.readFile(file.path, 'utf8');
                
                if (content.includes('useState') || content.includes('useEffect')) {
                    patterns.componentPatterns.push('hooks');
                }
                
                if (content.includes('class extends Component')) {
                    patterns.componentPatterns.push('class-components');
                }
                
                if (content.includes('redux') || content.includes('useSelector')) {
                    patterns.stateManagement = 'redux';
                } else if (content.includes('useContext')) {
                    patterns.stateManagement = 'context';
                }
            } catch (error) {
                // Skip files that can't be read
            }
        }
        
        return patterns;
    }
}

class ProjectPlanner {
    constructor(specs, existingStructure) {
        this.specs = specs;
        this.existing = existingStructure;
    }

    async planRequiredFiles() {
        const files = [];
        
        // Basic structure based on project type and framework
        if (this.specs.framework === 'React') {
            files.push(
                { path: 'package.json', type: 'config', priority: 1 },
                { path: 'src/index.js', type: 'entry', priority: 2 },
                { path: 'src/App.js', type: 'component', priority: 3 },
                { path: 'src/App.css', type: 'style', priority: 4 },
                { path: 'public/index.html', type: 'template', priority: 5 }
            );
            
            // Add feature-specific files
            if (this.specs.features.includes('authentication')) {
                files.push(
                    { path: 'src/components/Login.js', type: 'component', priority: 6 },
                    { path: 'src/components/Register.js', type: 'component', priority: 7 }
                );
            }
            
            if (this.specs.features.includes('dashboard')) {
                files.push(
                    { path: 'src/components/Dashboard.js', type: 'component', priority: 8 }
                );
            }
        }
        
        return files.sort((a, b) => a.priority - b.priority);
    }

    async identifyDependencies() {
        const deps = {
            production: new Set(),
            development: new Set()
        };
        
        if (this.specs.framework === 'React') {
            deps.production.add('react');
            deps.production.add('react-dom');
            deps.development.add('react-scripts');
        }
        
        if (this.specs.technologies.includes('Tailwind CSS')) {
            deps.development.add('tailwindcss');
            deps.development.add('postcss');
            deps.development.add('autoprefixer');
        }
        
        if (this.specs.technologies.includes('TypeScript')) {
            deps.development.add('typescript');
            deps.development.add('@types/react');
            deps.development.add('@types/react-dom');
        }
        
        return {
            production: Array.from(deps.production),
            development: Array.from(deps.development)
        };
    }

    async mapFileRelationships() {
        const relationships = {};
        
        // Map dependencies between files
        relationships['src/index.js'] = ['src/App.js'];
        relationships['src/App.js'] = ['src/App.css'];
        
        if (this.specs.features.includes('authentication')) {
            relationships['src/App.js'] = [...(relationships['src/App.js'] || []), 'src/components/Login.js'];
        }
        
        return relationships;
    }

    async determineBuildOrder() {
        // Return files in dependency order
        return [
            'package.json',
            'public/index.html',
            'src/App.css',
            'src/components/Login.js',
            'src/components/Dashboard.js', 
            'src/App.js',
            'src/index.js'
        ];
    }
}

module.exports = ContextManager;