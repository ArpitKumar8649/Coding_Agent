/**
 * Advanced Validation Engine - Comprehensive quality validation and testing
 */

class ValidationEngine {
    constructor() {
        this.syntaxValidators = new Map();
        this.qualityAnalyzers = new Map();
        this.testRunners = new Map();
        this.performanceAnalyzers = new Map();
        
        this.initializeValidators();
    }

    initializeValidators() {
        // Register validators for different file types
        this.syntaxValidators.set('javascript', new JavaScriptValidator());
        this.syntaxValidators.set('react', new ReactValidator());
        this.syntaxValidators.set('css', new CSSValidator());
        this.syntaxValidators.set('json', new JSONValidator());
        this.syntaxValidators.set('html', new HTMLValidator());
        
        // Quality analyzers
        this.qualityAnalyzers.set('code-quality', new CodeQualityAnalyzer());
        this.qualityAnalyzers.set('ui-quality', new UIQualityAnalyzer());
        this.qualityAnalyzers.set('accessibility', new AccessibilityAnalyzer());
        this.qualityAnalyzers.set('performance', new PerformanceAnalyzer());
    }

    async validateFile(filePath, content, context) {
        const results = {
            isValid: true,
            errors: [],
            warnings: [],
            suggestions: [],
            qualityScore: 0,
            details: {}
        };

        try {
            // 1. Syntax validation
            const syntaxResult = await this.validateSyntax(filePath, content);
            results.details.syntax = syntaxResult;
            
            if (!syntaxResult.isValid) {
                results.isValid = false;
                results.errors.push(...syntaxResult.errors);
            }

            // 2. Code quality analysis
            const qualityResult = await this.analyzeQuality(filePath, content, context);
            results.details.quality = qualityResult;
            results.qualityScore = qualityResult.overallScore;
            
            if (qualityResult.score < 6) {
                results.warnings.push(...qualityResult.issues);
            }

            // 3. Framework-specific validation
            const frameworkResult = await this.validateFrameworkSpecific(filePath, content, context);
            results.details.framework = frameworkResult;
            
            if (!frameworkResult.isValid) {
                results.errors.push(...frameworkResult.errors);
                results.isValid = false;
            }

            // 4. Accessibility validation (for UI files)
            if (this.isUIFile(filePath)) {
                const accessibilityResult = await this.validateAccessibility(content, context);
                results.details.accessibility = accessibilityResult;
                
                if (accessibilityResult.issues.length > 0) {
                    results.warnings.push(...accessibilityResult.issues);
                }
            }

            // 5. Performance analysis
            const performanceResult = await this.analyzePerformance(filePath, content, context);
            results.details.performance = performanceResult;
            
            if (performanceResult.issues.length > 0) {
                results.suggestions.push(...performanceResult.suggestions);
            }

        } catch (error) {
            results.isValid = false;
            results.errors.push({
                type: 'validation-error',
                message: `Validation failed: ${error.message}`,
                severity: 'high'
            });
        }

        return results;
    }

    async validateProject(workspacePath, context) {
        const results = {
            allTestsPassed: true,
            overallQuality: 0,
            issues: [],
            suggestions: [],
            summary: '',
            files: {},
            projectTests: {
                build: { passed: false, message: '' },
                lint: { passed: false, message: '' },
                dependencies: { passed: false, message: '' },
                integration: { passed: false, message: '' }
            }
        };

        try {
            // 1. Validate all generated files
            const files = await this.getProjectFiles(workspacePath);
            let totalQuality = 0;
            let validFiles = 0;

            for (const file of files) {
                const content = await fs.readFile(file.path, 'utf8');
                const validation = await this.validateFile(file.relativePath, content, context);
                
                results.files[file.relativePath] = validation;
                
                if (validation.isValid) {
                    validFiles++;
                    totalQuality += validation.qualityScore;
                } else {
                    results.allTestsPassed = false;
                    results.issues.push(...validation.errors);
                }
            }

            results.overallQuality = validFiles > 0 ? totalQuality / validFiles : 0;

            // 2. Project-level tests
            await this.runProjectTests(workspacePath, context, results);

            // 3. Integration tests
            await this.runIntegrationTests(workspacePath, context, results);

            // 4. Generate summary
            results.summary = this.generateValidationSummary(results);

        } catch (error) {
            results.allTestsPassed = false;
            results.issues.push({
                type: 'project-validation-error',
                message: `Project validation failed: ${error.message}`,
                severity: 'critical'
            });
        }

        return results;
    }

    async validateSyntax(filePath, content) {
        const fileType = this.determineFileType(filePath);
        const validator = this.syntaxValidators.get(fileType);
        
        if (!validator) {
            return {
                isValid: true,
                errors: [],
                message: `No validator available for ${fileType}`
            };
        }

        return await validator.validate(content, filePath);
    }

    async analyzeQuality(filePath, content, context) {
        const analyzer = this.qualityAnalyzers.get('code-quality');
        return await analyzer.analyze(content, {
            filePath,
            context,
            expectedQuality: context.qualityLevel
        });
    }

    async validateFrameworkSpecific(filePath, content, context) {
        if (context.framework === 'React' && this.isReactFile(filePath)) {
            const validator = new ReactValidator();
            return await validator.validateReactSpecific(content, context);
        }
        
        return { isValid: true, errors: [] };
    }

    async validateAccessibility(content, context) {
        const analyzer = this.qualityAnalyzers.get('accessibility');
        return await analyzer.analyze(content, context);
    }

    async analyzePerformance(filePath, content, context) {
        const analyzer = this.performanceAnalyzers.get('performance') || new PerformanceAnalyzer();
        return await analyzer.analyze(content, { filePath, context });
    }

    async runProjectTests(workspacePath, context, results) {
        // 1. Build test
        try {
            if (context.framework === 'React') {
                await this.testReactBuild(workspacePath);
                results.projectTests.build = { passed: true, message: 'Build successful' };
            }
        } catch (error) {
            results.projectTests.build = { passed: false, message: error.message };
            results.allTestsPassed = false;
        }

        // 2. Dependencies test
        try {
            await this.validateDependencies(workspacePath, context);
            results.projectTests.dependencies = { passed: true, message: 'Dependencies valid' };
        } catch (error) {
            results.projectTests.dependencies = { passed: false, message: error.message };
            results.allTestsPassed = false;
        }

        // 3. Lint test
        try {
            const lintResults = await this.runLinting(workspacePath);
            if (lintResults.errors.length === 0) {
                results.projectTests.lint = { passed: true, message: 'Linting passed' };
            } else {
                results.projectTests.lint = { passed: false, message: `${lintResults.errors.length} linting errors` };
                results.suggestions.push(...lintResults.errors);
            }
        } catch (error) {
            results.projectTests.lint = { passed: false, message: 'Linting failed' };
        }
    }

    async runIntegrationTests(workspacePath, context, results) {
        try {
            // Test if the application can start
            const canStart = await this.testApplicationStart(workspacePath, context);
            
            if (canStart.success) {
                results.projectTests.integration = { passed: true, message: 'Integration tests passed' };
            } else {
                results.projectTests.integration = { passed: false, message: canStart.error };
                results.allTestsPassed = false;
            }
        } catch (error) {
            results.projectTests.integration = { passed: false, message: error.message };
            results.allTestsPassed = false;
        }
    }

    // Helper methods
    determineFileType(filePath) {
        const ext = filePath.split('.').pop().toLowerCase();
        
        if (ext === 'jsx' || ext === 'tsx') return 'react';
        if (ext === 'js' || ext === 'ts') return 'javascript';
        if (ext === 'css') return 'css';
        if (ext === 'json') return 'json';
        if (ext === 'html') return 'html';
        
        return 'unknown';
    }

    isUIFile(filePath) {
        return filePath.includes('component') || 
               filePath.includes('Component') ||
               filePath.endsWith('.jsx') ||
               filePath.endsWith('.tsx') ||
               filePath.includes('App.js');
    }

    isReactFile(filePath) {
        return filePath.endsWith('.jsx') || 
               filePath.endsWith('.tsx') || 
               filePath.includes('component') ||
               filePath.includes('Component');
    }

    async getProjectFiles(workspacePath) {
        const files = [];
        const fs = require('fs').promises;
        
        async function scanDir(dir, basePath = '') {
            const entries = await fs.readdir(dir);
            
            for (const entry of entries) {
                if (entry.startsWith('.') || entry === 'node_modules') continue;
                
                const fullPath = path.join(dir, entry);
                const relativePath = path.join(basePath, entry);
                const stats = await fs.stat(fullPath);
                
                if (stats.isFile()) {
                    files.push({
                        path: fullPath,
                        relativePath: relativePath,
                        name: entry
                    });
                } else if (stats.isDirectory()) {
                    await scanDir(fullPath, relativePath);
                }
            }
        }
        
        await scanDir(workspacePath);
        return files;
    }

    generateValidationSummary(results) {
        const { overallQuality, issues, files, projectTests } = results;
        
        let summary = `Project Validation Summary:\n`;
        summary += `Overall Quality: ${overallQuality.toFixed(1)}/10\n`;
        summary += `Files Validated: ${Object.keys(files).length}\n`;
        
        if (issues.length === 0) {
            summary += `✅ All validations passed!\n`;
        } else {
            summary += `❌ ${issues.length} issues found:\n`;
            issues.slice(0, 5).forEach(issue => {
                summary += `  - ${issue.message}\n`;
            });
        }
        
        summary += `\nProject Tests:\n`;
        Object.entries(projectTests).forEach(([test, result]) => {
            summary += `  ${result.passed ? '✅' : '❌'} ${test}: ${result.message}\n`;
        });
        
        return summary;
    }
}

// File-specific validators
class JavaScriptValidator {
    async validate(content, filePath) {
        const results = {
            isValid: true,
            errors: [],
            warnings: []
        };

        try {
            // Basic syntax validation using AST parsing
            const babel = require('@babel/parser');
            babel.parse(content, {
                sourceType: 'module',
                allowImportExportEverywhere: true,
                plugins: ['jsx', 'typescript']
            });
        } catch (error) {
            results.isValid = false;
            results.errors.push({
                type: 'syntax-error',
                message: `Syntax error: ${error.message}`,
                line: error.loc?.line,
                column: error.loc?.column,
                severity: 'high'
            });
        }

        // Additional JavaScript-specific validations
        await this.validateImportsExports(content, results);
        await this.validateFunctionDeclarations(content, results);
        
        return results;
    }

    async validateImportsExports(content, results) {
        // Check for proper imports/exports
        if (content.includes('import ') && !content.match(/export\s+(default\s+|{)/)) {
            results.warnings.push({
                type: 'missing-export',
                message: 'File has imports but no exports',
                severity: 'medium'
            });
        }
    }

    async validateFunctionDeclarations(content, results) {
        // Check for proper function declarations
        const functions = content.match(/function\s+\w+/g) || [];
        const arrowFunctions = content.match(/const\s+\w+\s*=\s*\(/g) || [];
        
        if (functions.length === 0 && arrowFunctions.length === 0 && !content.includes('export default')) {
            results.warnings.push({
                type: 'no-functions',
                message: 'No functions found in JavaScript file',
                severity: 'low'
            });
        }
    }
}

class ReactValidator extends JavaScriptValidator {
    async validateReactSpecific(content, context) {
        const results = await super.validate(content);
        
        // React-specific validations
        await this.validateReactPatterns(content, results, context);
        await this.validateJSXStructure(content, results);
        await this.validateHooks(content, results);
        
        return results;
    }

    async validateReactPatterns(content, results, context) {
        // Check for proper React imports
        if (content.includes('JSX') || content.includes('<') && !content.includes('import React')) {
            results.errors.push({
                type: 'missing-react-import',
                message: 'React component missing React import',
                severity: 'high'
            });
        }

        // Check for component export
        const hasComponentExport = content.match(/export\s+default\s+\w+/) || 
                                 content.match(/export\s+{\s*\w+\s*}/);
        
        if (!hasComponentExport && content.includes('function')) {
            results.warnings.push({
                type: 'missing-component-export',
                message: 'Component function not exported',
                severity: 'medium'
            });
        }
    }

    async validateJSXStructure(content, results) {
        // Basic JSX validation
        const jsxElements = content.match(/<\w+/g) || [];
        const closingElements = content.match(/<\/\w+>/g) || [];
        const selfClosingElements = content.match(/<\w+[^>]*\/>/g) || [];
        
        // Simple check for balanced tags (not comprehensive)
        const openTags = jsxElements.length;
        const closeTags = closingElements.length + selfClosingElements.length;
        
        if (openTags > 0 && Math.abs(openTags - closeTags) > 1) {
            results.warnings.push({
                type: 'jsx-structure',
                message: 'Potential JSX structure issues - unbalanced tags',
                severity: 'medium'
            });
        }
    }

    async validateHooks(content, results) {
        // Validate React hooks usage
        const hookPattern = /use\w+\s*\(/g;
        const hooks = content.match(hookPattern) || [];
        
        if (hooks.length > 0) {
            // Check if hooks are inside a function component
            const functionPattern = /function\s+\w+|const\s+\w+\s*=\s*\(/;
            if (!functionPattern.test(content)) {
                results.errors.push({
                    type: 'hooks-outside-component',
                    message: 'React hooks must be used inside function components',
                    severity: 'high'
                });
            }
        }
    }
}

class CSSValidator {
    async validate(content, filePath) {
        const results = {
            isValid: true,
            errors: [],
            warnings: []
        };

        // Basic CSS validation
        try {
            // Check for balanced braces
            const openBraces = (content.match(/{/g) || []).length;
            const closeBraces = (content.match(/}/g) || []).length;
            
            if (openBraces !== closeBraces) {
                results.isValid = false;
                results.errors.push({
                    type: 'unbalanced-braces',
                    message: `Unbalanced braces: ${openBraces} opening, ${closeBraces} closing`,
                    severity: 'high'
                });
            }

            // Check for invalid properties
            await this.validateCSSProperties(content, results);
            
        } catch (error) {
            results.isValid = false;
            results.errors.push({
                type: 'css-parse-error',
                message: error.message,
                severity: 'high'
            });
        }

        return results;
    }

    async validateCSSProperties(content, results) {
        // Basic property validation
        const propertyPattern = /([a-z-]+)\s*:\s*([^;]+);/gi;
        const matches = [...content.matchAll(propertyPattern)];
        
        for (const match of matches) {
            const property = match[1];
            const value = match[2];
            
            // Check for common typos
            if (property.includes('colur')) {
                results.warnings.push({
                    type: 'property-typo',
                    message: `Possible typo in property: ${property}`,
                    severity: 'medium'
                });
            }
        }
    }
}

class JSONValidator {
    async validate(content, filePath) {
        const results = {
            isValid: true,
            errors: [],
            warnings: []
        };

        try {
            JSON.parse(content);
        } catch (error) {
            results.isValid = false;
            results.errors.push({
                type: 'invalid-json',
                message: `JSON syntax error: ${error.message}`,
                severity: 'high'
            });
        }

        return results;
    }
}

class HTMLValidator {
    async validate(content, filePath) {
        const results = {
            isValid: true,
            errors: [],
            warnings: []
        };

        // Basic HTML validation
        if (!content.includes('<!DOCTYPE html>') && !content.includes('<!doctype html>')) {
            results.warnings.push({
                type: 'missing-doctype',
                message: 'Missing DOCTYPE declaration',
                severity: 'low'
            });
        }

        // Check for basic structure
        if (!content.includes('<html') || !content.includes('<head') || !content.includes('<body')) {
            results.warnings.push({
                type: 'incomplete-structure',
                message: 'Missing basic HTML structure elements',
                severity: 'medium'
            });
        }

        return results;
    }
}

// Quality analyzers
class CodeQualityAnalyzer {
    async analyze(content, options) {
        let score = 5; // Base score
        const issues = [];
        const suggestions = [];

        // Analyze code complexity
        const complexity = this.analyzeComplexity(content);
        if (complexity > 10) {
            score -= 1;
            issues.push('High complexity detected');
        }

        // Check for modern patterns
        if (content.includes('const ') || content.includes('let ')) score += 1;
        if (content.includes('=>')) score += 0.5; // Arrow functions
        if (content.includes('async') || content.includes('await')) score += 0.5;

        // Check for error handling
        if (content.includes('try {') || content.includes('catch')) score += 1;
        
        // Check for comments
        if (content.includes('//') || content.includes('/*')) score += 0.5;

        return {
            overallScore: Math.min(score, 10),
            issues,
            suggestions,
            metrics: {
                complexity,
                linesOfCode: content.split('\n').length,
                functionCount: (content.match(/function|=>/g) || []).length
            }
        };
    }

    analyzeComplexity(content) {
        // Simplified complexity calculation
        const complexityKeywords = ['if', 'for', 'while', 'switch', 'catch'];
        let complexity = 1;
        
        complexityKeywords.forEach(keyword => {
            const matches = content.match(new RegExp(`\\b${keyword}\\b`, 'g')) || [];
            complexity += matches.length;
        });

        return complexity;
    }
}

class UIQualityAnalyzer {
    async analyze(content, context) {
        // UI-specific quality analysis
        return {
            score: 8,
            issues: [],
            suggestions: []
        };
    }
}

class AccessibilityAnalyzer {
    async analyze(content, context) {
        const issues = [];
        
        // Check for accessibility attributes
        if (content.includes('<img') && !content.includes('alt=')) {
            issues.push('Images missing alt attributes');
        }
        
        if (content.includes('<button') && !content.includes('aria-')) {
            issues.push('Buttons missing ARIA labels');
        }

        return {
            score: issues.length === 0 ? 10 : Math.max(10 - issues.length * 2, 1),
            issues: issues.map(issue => ({ message: issue, severity: 'medium' }))
        };
    }
}

class PerformanceAnalyzer {
    async analyze(content, options) {
        const issues = [];
        const suggestions = [];
        
        // Check for performance anti-patterns
        if (content.includes('document.getElementById') && content.includes('React')) {
            issues.push('Direct DOM manipulation in React component');
            suggestions.push('Use React refs instead of direct DOM manipulation');
        }
        
        return {
            score: issues.length === 0 ? 10 : Math.max(10 - issues.length, 1),
            issues,
            suggestions
        };
    }
}

module.exports = ValidationEngine;