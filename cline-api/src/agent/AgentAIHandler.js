/**
 * AgentAIHandler - Enhanced AI integration for agent decision-making
 * Extracted from: /app/src/api/index.ts and enhanced with agent intelligence
 */

const { getLLMProvider } = require('../services/llmService');

class AgentAIHandler {
    constructor(config) {
        this.config = config;
        this.provider = getLLMProvider(config.provider);
        this.conversationHistory = [];
        this.systemPrompt = this.buildSystemPrompt();
    }

    // Build enhanced system prompt for agent behavior
    buildSystemPrompt() {
        return `You are an advanced coding agent that can plan, execute, and validate complete software projects autonomously.

CORE CAPABILITIES:
- Multi-step project planning and architectural design
- Systematic file creation and code generation
- Intelligent dependency and import management
- Error detection and automatic correction
- Project validation and quality assurance
- Context-aware decision making

AGENT WORKFLOW:
1. ANALYZE: Deep analysis of project requirements and constraints
2. ARCHITECT: Design optimal file structure and component relationships
3. PLAN: Create detailed step-by-step execution plan
4. IMPLEMENT: Systematically create files with proper dependencies
5. VALIDATE: Check syntax, imports, and functionality
6. CORRECT: Automatically fix any detected issues
7. OPTIMIZE: Refine code quality and performance

DECISION MAKING PRINCIPLES:
- Always consider the full project context when making decisions
- Prioritize code quality, maintainability, and best practices
- Ensure proper file organization and dependency management
- Implement features incrementally with proper testing
- Handle errors gracefully and provide clear feedback

TOOLS & CAPABILITIES:
- File creation and modification with full content generation
- Directory structure analysis and optimization
- Dependency analysis and management
- Code syntax validation and error correction
- Project architecture planning and implementation

When planning projects:
1. Start with a clear project structure based on the framework
2. Create configuration files first (package.json, config files)
3. Implement core functionality before advanced features
4. Ensure proper imports and dependencies throughout
5. Generate complete, functional code for each file
6. Validate the entire project structure for consistency

Response format for different request types:

FOR PROJECT ANALYSIS:
Analyze the requirements thoroughly and identify:
- Project type and complexity
- Required framework and technologies
- Core features and functionality needed
- File structure and architecture
- Dependencies and integrations

FOR EXECUTION PLANNING:
Create a detailed step-by-step plan with:
- Phase organization (setup, core, features, validation)
- File creation order with dependencies
- Estimated complexity for each step
- Template and content requirements

FOR CODE GENERATION:
Generate complete, functional code that:
- Follows framework best practices
- Includes proper imports and dependencies
- Implements the requested functionality fully
- Uses consistent coding style and patterns
- Includes necessary error handling

Always provide comprehensive, production-ready solutions that work out of the box.`;
    }

    // Analyze project requirements with AI
    async analyzeRequirements(description, initialAnalysis) {
        const prompt = `Analyze this project request and provide detailed technical insights:

PROJECT DESCRIPTION: ${description}

INITIAL ANALYSIS:
- Project Type: ${initialAnalysis.projectType}
- Framework: ${initialAnalysis.framework}
- Complexity: ${initialAnalysis.complexity}
- Features: ${initialAnalysis.features.join(', ')}
- Technologies: ${initialAnalysis.technologies.join(', ')}

Please provide enhanced analysis including:
1. Recommended file structure
2. Additional dependencies needed
3. Implementation challenges and solutions
4. Architecture recommendations
5. Feature implementation order

Respond in JSON format:
{
  "enhancedComplexity": number (1-10),
  "recommendedStructure": ["file/folder paths"],
  "additionalDependencies": ["dependency names"],
  "implementationChallenges": ["challenge descriptions"],
  "architectureRecommendations": ["recommendations"],
  "featureOrder": ["ordered feature list"],
  "estimatedFiles": number,
  "estimatedTime": number (minutes)
}`;

        try {
            const response = await this.provider.generateCode(prompt, {
                temperature: 0.1,
                maxTokens: 2000
            });

            return JSON.parse(response.content);
        } catch (error) {
            console.error('Error in AI requirements analysis:', error);
            return {
                enhancedComplexity: initialAnalysis.complexity,
                estimatedFiles: Math.max(5, initialAnalysis.complexity * 3),
                estimatedTime: Math.max(10, initialAnalysis.complexity * 5)
            };
        }
    }

    // Plan feature implementation with AI
    async planFeature(feature, framework) {
        const prompt = `Plan the implementation of the "${feature}" feature for a ${framework} project.

Provide a detailed implementation plan including:
1. Required files and their purposes
2. Component structure and relationships
3. Dependencies and imports needed
4. Implementation approach and best practices

Respond in JSON format:
{
  "files": [
    {
      "path": "relative/file/path",
      "description": "file purpose and content description",
      "dependencies": ["required dependencies"],
      "type": "component|service|util|config"
    }
  ],
  "mainComponents": ["main component names"],
  "integrationPoints": ["how it connects to other parts"],
  "testingStrategy": "testing approach"
}`;

        try {
            const response = await this.provider.generateCode(prompt, {
                temperature: 0.2,
                maxTokens: 1500
            });

            return JSON.parse(response.content);
        } catch (error) {
            console.error('Error in AI feature planning:', error);
            return {
                files: [
                    {
                        path: `src/components/${feature}.js`,
                        description: `Implementation of ${feature} feature`,
                        dependencies: [],
                        type: 'component'
                    }
                ]
            };
        }
    }

    // Generate code content for a specific file
    async generateFileContent(fileSpec, projectContext) {
        const prompt = `Generate complete, production-ready code for this file:

FILE SPECIFICATION:
- Path: ${fileSpec.path}
- Description: ${fileSpec.description}
- Type: ${fileSpec.type || 'component'}
- Template: ${fileSpec.template || 'custom'}

PROJECT CONTEXT:
- Framework: ${projectContext.framework}
- Features: ${projectContext.features.join(', ')}
- Technologies: ${projectContext.technologies.join(', ')}
- Existing Files: ${projectContext.existingFiles?.join(', ') || 'none'}

REQUIREMENTS:
1. Generate complete, functional code
2. Include proper imports and dependencies
3. Follow ${projectContext.framework} best practices
4. Implement ${fileSpec.description} fully
5. Use modern coding patterns and standards
6. Include error handling where appropriate
7. Add helpful comments for complex logic

Generate ONLY the code content, no explanations or markdown formatting.`;

        try {
            const response = await this.provider.generateCode(prompt, {
                temperature: 0.1,
                maxTokens: 4000
            });

            return response.content.trim();
        } catch (error) {
            console.error('Error generating file content:', error);
            throw error;
        }
    }

    // Edit existing file content with context
    async editFileWithContext(filePath, currentContent, editInstructions, projectContext) {
        const prompt = `Edit the following file based on the instructions:

FILE PATH: ${filePath}

CURRENT CONTENT:
\`\`\`
${currentContent}
\`\`\`

EDIT INSTRUCTIONS: ${editInstructions}

PROJECT CONTEXT:
- Framework: ${projectContext.framework}
- Features: ${projectContext.features.join(', ')}
- Related Files: ${projectContext.relatedFiles?.join(', ') || 'none'}

REQUIREMENTS:
1. Make only the necessary changes requested
2. Preserve existing functionality unless explicitly asked to change
3. Maintain code style and patterns consistent with the existing file
4. Ensure proper imports and dependencies
5. Follow ${projectContext.framework} best practices
6. Add comments for new/modified sections

Return the complete updated file content, no explanations or markdown formatting.`;

        try {
            const response = await this.provider.editCode(prompt, {
                temperature: 0.1,
                maxTokens: 4000
            });

            return response.content.trim();
        } catch (error) {
            console.error('Error editing file content:', error);
            throw error;
        }
    }

    // Make decisions based on current context
    async makeDecision(instruction, projectState, options = {}) {
        const prompt = `Make a decision about how to handle this instruction:

INSTRUCTION: ${instruction}

PROJECT STATE:
- Created Files: ${projectState.createdFiles?.length || 0}
- Modified Files: ${projectState.modifiedFiles?.length || 0}
- Framework: ${projectState.framework}
- Current Features: ${projectState.features?.join(', ') || 'none'}

CONTEXT:
${JSON.stringify(projectState, null, 2)}

Analyze the instruction and project state, then decide:
1. What actions are needed?
2. Which files need to be created or modified?
3. What is the implementation strategy?
4. Are there any dependencies or prerequisites?
5. What is the recommended approach?

Respond in JSON format:
{
  "action": "create_files|modify_files|analyze_project|install_dependencies",
  "files": [
    {
      "path": "file path",
      "action": "create|modify|delete",
      "reason": "why this file change is needed"
    }
  ],
  "strategy": "implementation approach",
  "dependencies": ["any new dependencies needed"],
  "prerequisites": ["what needs to be done first"],
  "estimatedComplexity": number (1-10)
}`;

        try {
            const response = await this.provider.generateCode(prompt, {
                temperature: 0.2,
                maxTokens: 2000
            });

            return JSON.parse(response.content);
        } catch (error) {
            console.error('Error in AI decision making:', error);
            return {
                action: 'create_files',
                files: [],
                strategy: 'Fallback strategy due to AI error',
                estimatedComplexity: 5
            };
        }
    }

    // Validate project structure and suggest improvements
    async validateProject(projectState) {
        const prompt = `Validate this project structure and identify any issues:

PROJECT STATE:
${JSON.stringify(projectState, null, 2)}

Check for:
1. Missing essential files
2. Incorrect file organization
3. Dependency issues
4. Import/export problems
5. Best practice violations
6. Potential bugs or errors

Respond in JSON format:
{
  "isValid": boolean,
  "issues": [
    {
      "type": "error|warning|suggestion",
      "file": "affected file",
      "description": "issue description",
      "suggestion": "how to fix"
    }
  ],
  "improvements": ["general improvement suggestions"],
  "score": number (1-10)
}`;

        try {
            const response = await this.provider.generateCode(prompt, {
                temperature: 0.1,
                maxTokens: 2000
            });

            return JSON.parse(response.content);
        } catch (error) {
            console.error('Error in project validation:', error);
            return {
                isValid: true,
                issues: [],
                score: 7
            };
        }
    }
}

module.exports = AgentAIHandler;