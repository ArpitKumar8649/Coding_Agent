/**
 * Advanced Tool Orchestrator - Sophisticated tool management with fallback strategies
 */

class ToolOrchestrator {
    constructor() {
        this.generators = new Map();
        this.validators = new Map();
        this.fixers = new Map();
        this.qualityCheckers = new Map();
    }

    createFileGenerator(fileSpec, context) {
        return new AdvancedFileGenerator(fileSpec, context, this);
    }

    registerGenerator(type, generator) {
        this.generators.set(type, generator);
    }

    registerValidator(type, validator) {
        this.validators.set(type, validator);
    }

    registerFixer(type, fixer) {
        this.fixers.set(type, fixer);
    }
}

class AdvancedFileGenerator {
    constructor(fileSpec, context, orchestrator) {
        this.fileSpec = fileSpec;
        this.context = context;
        this.orchestrator = orchestrator;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.qualityThreshold = this.getQualityThreshold();
    }

    async* generateWithValidation() {
        let currentPrompt = this.buildInitialPrompt();
        
        while (this.retryCount < this.maxRetries) {
            try {
                // Generate content stream
                const generator = this.createContentGenerator(currentPrompt);
                
                let accumulatedContent = '';
                let lastValidationResult = null;
                
                for await (const chunk of generator) {
                    accumulatedContent += chunk;
                    
                    // Yield streaming content
                    yield {
                        type: 'content',
                        data: chunk
                    };
                    
                    // Validate every 500 characters or at natural breakpoints
                    if (accumulatedContent.length % 500 === 0 || this.isValidationPoint(chunk)) {
                        const validationResult = await this.validatePartialContent(
                            accumulatedContent, 
                            this.fileSpec
                        );
                        
                        if (validationResult.hasErrors) {
                            yield {
                                type: 'validation',
                                errors: validationResult.errors,
                                canAutoFix: validationResult.canAutoFix,
                                severity: validationResult.severity
                            };
                            
                            // Auto-fix if possible
                            if (validationResult.canAutoFix && validationResult.severity !== 'critical') {
                                accumulatedContent = await this.applyQuickFixes(
                                    accumulatedContent, 
                                    validationResult.errors
                                );
                            }
                        }
                        
                        lastValidationResult = validationResult;
                    }
                }
                
                // Final validation
                const finalValidation = await this.validateCompleteContent(accumulatedContent);
                const qualityScore = await this.assessQuality(accumulatedContent);
                
                if (finalValidation.isValid && qualityScore >= this.qualityThreshold) {
                    yield {
                        type: 'complete',
                        content: accumulatedContent,
                        qualityScore,
                        validation: finalValidation
                    };
                    return;
                } else {
                    // Retry with improved prompt
                    currentPrompt = this.improvePrompt(currentPrompt, finalValidation.errors, qualityScore);
                    this.retryCount++;
                    
                    yield {
                        type: 'retry',
                        attempt: this.retryCount,
                        reason: finalValidation.isValid ? 'quality-too-low' : 'validation-failed',
                        qualityScore,
                        errors: finalValidation.errors
                    };
                }
                
            } catch (error) {
                this.retryCount++;
                
                yield {
                    type: 'error',
                    error: error.message,
                    attempt: this.retryCount,
                    canRetry: this.retryCount < this.maxRetries
                };
                
                if (this.retryCount >= this.maxRetries) {
                    throw new Error(`Failed to generate ${this.fileSpec.path} after ${this.maxRetries} attempts`);
                }
                
                // Adjust strategy for retry
                currentPrompt = this.buildFallbackPrompt(error);
            }
        }
    }

    async* createContentGenerator(prompt) {
        // This would integrate with your LLM service
        const llmService = require('./LLMService');
        
        const stream = llmService.generateStream({
            prompt,
            model: this.selectOptimalModel(),
            temperature: this.getOptimalTemperature(),
            maxTokens: this.calculateMaxTokens(),
            stopSequences: this.getStopSequences()
        });
        
        for await (const chunk of stream) {
            if (chunk.type === 'content') {
                yield chunk.content;
            }
        }
    }

    buildInitialPrompt() {
        const qualityLevel = this.context.qualityLevel || 'advanced';
        
        return `Generate ${qualityLevel} quality ${this.fileSpec.type} file: ${this.fileSpec.path}

PROJECT CONTEXT:
- Framework: ${this.context.framework}
- Technologies: ${this.context.technologies.join(', ')}
- Architecture: ${JSON.stringify(this.context.architecture)}
- Code Style: ${this.context.codeStyle}

FILE REQUIREMENTS:
- Path: ${this.fileSpec.path}
- Type: ${this.fileSpec.type}
- Purpose: ${this.fileSpec.description || 'Core application file'}
- Dependencies: ${this.getFileDependencies().join(', ')}

QUALITY STANDARDS (${qualityLevel}):
${this.getQualityStandards(qualityLevel)}

SPECIFIC REQUIREMENTS FOR ${this.fileSpec.path}:
${this.getFileSpecificRequirements()}

Generate ONLY the file content, no explanations or markdown:`;
    }

    getQualityStandards(level) {
        const standards = {
            poor: [
                '- Basic functionality that works',
                '- Simple, clean code structure',
                '- Minimal styling and features'
            ],
            medium: [
                '- Well-structured, readable code',
                '- Proper error handling',
                '- Good styling and responsive design',
                '- Modern JavaScript/React patterns'
            ],
            advanced: [
                '- Production-ready, professional code',
                '- Comprehensive error handling and validation',
                '- Beautiful, responsive UI with animations',
                '- Advanced patterns and optimizations',
                '- Accessibility features (ARIA, keyboard navigation)',
                '- Performance optimizations',
                '- Type safety (if TypeScript)',
                '- Comprehensive comments and documentation'
            ]
        };
        
        return standards[level].join('\n');
    }

    getFileSpecificRequirements() {
        const ext = this.fileSpec.path.split('.').pop();
        const fileName = this.fileSpec.path.split('/').pop();
        
        const requirements = {
            'js': this.getJavaScriptRequirements(),
            'jsx': this.getReactRequirements(), 
            'css': this.getCSSRequirements(),
            'json': this.getJSONRequirements(),
            'html': this.getHTMLRequirements()
        };
        
        return requirements[ext] || requirements.js;
    }

    getJavaScriptRequirements() {
        return `
- Use modern ES6+ features (arrow functions, destructuring, etc.)
- Proper error handling with try/catch
- Clean function and variable names
- Modular code structure
- Comments for complex logic
        `;
    }

    getReactRequirements() {
        return `
- Use functional components with hooks
- Proper JSX structure and formatting
- Event handling and state management
- Conditional rendering where appropriate
- Props validation (PropTypes if not TypeScript)
- Performance considerations (useMemo, useCallback where needed)
- Accessibility attributes (aria-label, role, etc.)
        `;
    }

    getCSSRequirements() {
        if (this.context.technologies.includes('Tailwind CSS')) {
            return `
- Use Tailwind utility classes exclusively
- Responsive design (sm:, md:, lg:, xl: breakpoints)
- Modern CSS features (flexbox, grid)
- Consistent spacing and typography
- Hover states and transitions
- Color scheme consistency
            `;
        }
        
        return `
- Modern CSS with custom properties
- Responsive design with media queries
- Flexbox/Grid layouts
- Smooth transitions and animations
- Consistent spacing and typography
- Cross-browser compatibility
        `;
    }

    getJSONRequirements() {
        return `
- Valid JSON syntax
- Proper structure for file type
- All required fields included
- Sensible default values
- Comments via package.json conventions where applicable
        `;
    }

    getHTMLRequirements() {
        return `
- Semantic HTML5 structure
- Proper DOCTYPE and meta tags
- Accessibility features
- SEO optimization
- Performance considerations (preload, prefetch)
        `;
    }

    async validatePartialContent(content, fileSpec) {
        const validator = new ContentValidator();
        
        return await validator.validatePartial(content, {
            fileType: fileSpec.type,
            filePath: fileSpec.path,
            context: this.context,
            expectations: this.getValidationExpectations()
        });
    }

    async validateCompleteContent(content) {
        const validator = new ContentValidator();
        
        return await validator.validateComplete(content, {
            fileType: this.fileSpec.type,
            filePath: this.fileSpec.path,
            context: this.context,
            qualityLevel: this.context.qualityLevel
        });
    }

    async assessQuality(content) {
        const assessor = new QualityAssessor();
        
        return await assessor.assess(content, {
            fileType: this.fileSpec.type,
            context: this.context,
            qualityLevel: this.context.qualityLevel
        });
    }

    async applyAutoFixes(content, errors) {
        const fixer = new AutoFixer();
        
        return await fixer.applyFixes(content, errors, {
            fileType: this.fileSpec.type,
            context: this.context
        });
    }

    async applyQuickFixes(content, errors) {
        // Apply only safe, quick fixes during streaming
        const quickFixer = new QuickFixer();
        
        return await quickFixer.applyFixes(content, errors);
    }

    improvePrompt(currentPrompt, errors, qualityScore) {
        let improvements = '\n\nIMPROVEMENTS NEEDED:\n';
        
        if (errors && errors.length > 0) {
            improvements += 'Fix these specific issues:\n';
            errors.forEach(error => {
                improvements += `- ${error.message}\n`;
            });
        }
        
        if (qualityScore < this.qualityThreshold) {
            improvements += `\nQuality too low (${qualityScore}/${this.qualityThreshold}). Improve:\n`;
            improvements += '- Code structure and organization\n';
            improvements += '- Error handling and validation\n';
            improvements += '- User interface and styling\n';
            improvements += '- Performance and accessibility\n';
        }
        
        return currentPrompt + improvements;
    }

    buildFallbackPrompt(error) {
        return `Generate ${this.fileSpec.path} using simplified approach.

Previous attempt failed with: ${error.message}

Use simpler patterns and focus on core functionality.
Avoid complex features that might cause errors.

File: ${this.fileSpec.path}
Purpose: ${this.fileSpec.description}
`;
    }

    retryWithImprovedPrompt(errors) {
        this.retryCount++;
        // This will be handled in the main generation loop
    }

    getQualityThreshold() {
        const thresholds = {
            poor: 4,
            medium: 6,
            advanced: 8
        };
        
        return thresholds[this.context.qualityLevel] || 6;
    }

    getFileDependencies() {
        return this.context.fileRelationships[this.fileSpec.path] || [];
    }

    isValidationPoint(chunk) {
        // Check if this is a good point to validate (end of function, component, etc.)
        return chunk.includes('}\n') || chunk.includes(';\n') || chunk.includes('*/\n');
    }

    selectOptimalModel() {
        // Select best model based on file type and quality requirements
        if (this.context.qualityLevel === 'advanced') {
            return 'x-ai/grok-4-fast:free'; // Your specified model
        }
        return 'deepseek/deepseek-chat-v3.1:free';
    }

    getOptimalTemperature() {
        // Lower temperature for more consistent, higher quality code
        const temps = {
            poor: 0.3,
            medium: 0.2,
            advanced: 0.1
        };
        
        return temps[this.context.qualityLevel] || 0.2;
    }

    calculateMaxTokens() {
        // Calculate appropriate token limit based on file type
        const baseLimits = {
            config: 1000,
            component: 3000,
            style: 2000,
            template: 1500,
            entry: 1000
        };
        
        return baseLimits[this.fileSpec.type] || 2000;
    }

    getStopSequences() {
        // Prevent common issues in code generation
        return ['```', 'Here is the', 'The file', 'This code'];
    }

    getValidationExpectations() {
        return {
            syntaxValid: true,
            importsComplete: true,
            exportsPresent: true,
            codeStyle: this.context.codeStyle,
            qualityLevel: this.context.qualityLevel
        };
    }
}

// Supporting validation and quality classes would go here...
class ContentValidator {
    async validatePartial(content, options) {
        // Implementation for partial validation
        return {
            hasErrors: false,
            errors: [],
            canAutoFix: true,
            severity: 'low'
        };
    }

    async validateComplete(content, options) {
        // Implementation for complete validation
        return {
            isValid: true,
            errors: [],
            warnings: [],
            suggestions: []
        };
    }
}

class QualityAssessor {
    async assess(content, options) {
        // Implementation for quality assessment
        // Return score 1-10
        return 8;
    }
}

class AutoFixer {
    async applyFixes(content, errors, options) {
        // Implementation for automatic fixes
        return content;
    }
}

class QuickFixer {
    async applyFixes(content, errors) {
        // Implementation for quick fixes during streaming
        return content;
    }
}

module.exports = ToolOrchestrator;