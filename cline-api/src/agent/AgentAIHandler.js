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

    // Build enhanced system prompt based on Cline VS Code extension
    buildSystemPrompt() {
        return `You are Cline, an AI assistant that can use tools to help with software development tasks. You have access to tools that let you create and edit files, run commands, and explore codebases.

CORE PRINCIPLES:
- You are an expert software developer
- Generate clean, well-structured, production-ready code
- Follow best practices for the target framework/language
- Create complete, functional implementations
- Ensure proper file organization and dependencies
- Think step-by-step and work methodically

IMPORTANT CODE GENERATION RULES:
- NEVER wrap code in markdown code blocks
- Generate raw code content directly
- Include proper imports and exports
- Follow the target framework's conventions
- Ensure all code is syntactically correct
- Create complete file contents, not partial snippets

TOOLS AVAILABLE:
- write_to_file: Create or overwrite files with complete content
- replace_in_file: Make targeted edits to existing files
- read_file: Read existing file contents
- list_files: Browse directory structures
- search_files: Search for patterns in files

PROJECT WORKFLOW:
1. ANALYZE requirements and determine project structure
2. CREATE configuration files (package.json, etc.)
3. IMPLEMENT core files in dependency order
4. BUILD features systematically
5. ENSURE proper integration and functionality

When creating files:
- Generate complete, working code
- Include all necessary imports and dependencies
- Follow framework conventions (React, Vue, Node.js, etc.)
- Ensure files work together properly
- No placeholder comments or TODO items
- Code should be immediately functional

For React projects:
- Use modern functional components with hooks
- Include proper JSX structure
- Import React and other dependencies correctly
- Use proper CSS class naming

For Node.js projects:
- Include proper require/import statements
- Set up Express servers correctly
- Handle errors appropriately
- Use consistent module patterns

Always generate production-ready, complete implementations.`;
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
        const prompt = `Generate complete, production-ready code for this file. Return ONLY the raw code content without any markdown formatting, explanations, or code blocks.

FILE SPECIFICATION:
- Path: ${fileSpec.path}
- Description: ${fileSpec.description}
- Type: ${fileSpec.type || 'component'}

PROJECT CONTEXT:
- Framework: ${projectContext.framework}
- Features: ${projectContext.features.join(', ')}
- Technologies: ${projectContext.technologies.join(', ')}

CRITICAL REQUIREMENTS:
1. Return ONLY raw code - NO markdown code blocks (```)
2. NO explanations or comments outside the code
3. Generate complete, functional file content
4. Include proper imports and exports
5. Follow ${projectContext.framework} best practices
6. Make the code immediately usable
7. Ensure proper syntax and structure

EXAMPLES OF CORRECT OUTPUT FORMAT:

For React component:
import React, { useState } from 'react';
import './App.css';

function App() {
  const [count, setCount] = useState(0);
  
  return (
    <div className="App">
      <h1>Counter: {count}</h1>
      <button onClick={() => setCount(count + 1)}>+</button>
    </div>
  );
}

export default App;

For package.json:
{
  "name": "my-app",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0"
  }
}

Generate the complete file content now:`;

        try {
            const response = await this.provider.generateCode(prompt, {
                temperature: 0.1,
                maxTokens: 4000
            });

            // Clean up any markdown formatting that might have been added
            let content = response.content.trim();
            content = this.cleanCodeContent(content);
            
            return content;
        } catch (error) {
            console.error('Error generating file content:', error);
            throw error;
        }
    }

    // Clean markdown formatting from generated code
    cleanCodeContent(content) {
        // Remove markdown code blocks
        content = content.replace(/^```[\w]*\n/gm, '');
        content = content.replace(/\n```$/gm, '');
        content = content.replace(/^```[\w]*$/gm, '');
        content = content.replace(/^```$/gm, '');
        
        // Remove any explanatory text that might be before/after code
        const lines = content.split('\n');
        let startIndex = 0;
        let endIndex = lines.length - 1;
        
        // Find the first line that looks like code (has proper indentation or syntax)
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.match(/^(import|export|const|let|var|function|class|<|{|\/\*|\*|\/\/)/)) {
                startIndex = i;
                break;
            }
        }
        
        // Find the last line that looks like code
        for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i].trim();
            if (line && !line.match(/^(Here|The|This|Generated|File|Code)/i)) {
                endIndex = i;
                break;
            }
        }
        
        return lines.slice(startIndex, endIndex + 1).join('\n').trim();
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