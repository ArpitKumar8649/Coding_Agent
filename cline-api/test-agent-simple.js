/**
 * Simple test of the agent functionality
 */

const express = require('express');
const cors = require('cors');
const { getLLMProvider } = require('./src/services/llmService');

const app = express();
app.use(cors());
app.use(express.json());

// Simple agent handler that fixes the core issues
class SimpleAgentHandler {
    constructor(apiKey) {
        this.provider = getLLMProvider('openrouter');
    }

    // Clean any markdown formatting from code
    cleanCode(content) {
        // Remove markdown code blocks
        content = content.replace(/^```[\w]*\n/gm, '');
        content = content.replace(/\n```$/gm, '');
        content = content.replace(/^```[\w]*$/gm, '');
        content = content.replace(/^```$/gm, '');
        
        // Find first and last meaningful code lines
        const lines = content.split('\n');
        let start = 0;
        let end = lines.length - 1;
        
        // Find first line that looks like code
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line && (line.includes('import') || line.includes('export') || 
                        line.includes('const') || line.includes('function') || 
                        line.includes('<') || line.includes('{') ||
                        line.includes('<!DOCTYPE') || line.includes('var') ||
                        line.includes('let'))) {
                start = i;
                break;
            }
        }
        
        // Find last meaningful line
        for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i].trim();
            if (line && !line.match(/^(Here|The|This|Generated|Note:|```)/i)) {
                end = i;
                break;
            }
        }
        
        return lines.slice(start, end + 1).join('\n').trim();
    }

    // Generate clean code content
    async generateFile(filePath, description, framework) {
        const prompt = `Generate complete, production-ready code for this file. Return ONLY the raw code content without any markdown formatting or explanations.

FILE: ${filePath}
DESCRIPTION: ${description}
FRAMEWORK: ${framework}

CRITICAL RULES:
1. Return ONLY raw code - NO markdown blocks (```)
2. NO explanations or comments outside the code
3. Generate complete, functional file content
4. Include proper imports and exports for ${framework}

Generate the complete ${filePath} file content now:`;

        try {
            const response = await this.provider.generateCode(prompt, {
                model: process.env.DEFAULT_MODEL,
                temperature: 0.1,
                maxTokens: 3000
            });

            return this.cleanCode(response.content);
        } catch (error) {
            throw new Error(`Failed to generate ${filePath}: ${error.message}`);
        }
    }

    // Create a simple project
    async createProject(description, framework = 'HTML/CSS/JS') {
        const fs = require('fs').promises;
        const path = require('path');
        
        // Create workspace
        const projectName = description.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 50);
        
        const workspace = `/tmp/cline-projects/${projectName}-${Date.now()}`;
        await fs.mkdir(workspace, { recursive: true });

        const files = [];
        let createdFiles = [];

        // Determine files to create based on framework
        if (framework === 'React') {
            files.push(
                { path: 'package.json', description: 'React package.json with dependencies' },
                { path: 'src/index.js', description: 'React app entry point with ReactDOM.render' },
                { path: 'src/App.js', description: `React component implementing: ${description}` },
                { path: 'src/App.css', description: 'CSS styles for the React app' },
                { path: 'public/index.html', description: 'HTML template for React app' }
            );
        } else {
            files.push(
                { path: 'index.html', description: `HTML page implementing: ${description}` },
                { path: 'style.css', description: 'CSS styles for the application' },
                { path: 'script.js', description: `JavaScript functionality for: ${description}` }
            );
        }

        // Generate and create files
        for (const fileSpec of files) {
            try {
                console.log(`🔧 Generating ${fileSpec.path}...`);
                const content = await this.generateFile(fileSpec.path, fileSpec.description, framework);
                
                const fullPath = path.join(workspace, fileSpec.path);
                await fs.mkdir(path.dirname(fullPath), { recursive: true });
                await fs.writeFile(fullPath, content);
                
                createdFiles.push(fileSpec.path);
                console.log(`✅ Created ${fileSpec.path} (${content.length} chars)`);
                
            } catch (error) {
                console.error(`❌ Failed to create ${fileSpec.path}:`, error.message);
            }
        }

        return {
            success: true,
            workspace,
            files: { createdFiles, totalFiles: createdFiles.length },
            framework,
            timestamp: new Date().toISOString()
        };
    }
}

// Test endpoint
app.post('/api/agent/test-create', async (req, res) => {
    try {
        const { description, framework = 'HTML/CSS/JS' } = req.body;
        
        if (!description) {
            return res.status(400).json({ error: 'Description is required' });
        }

        console.log(`🚀 Creating ${framework} project: "${description}"`);
        
        const agent = new SimpleAgentHandler();
        const result = await agent.createProject(description, framework);
        
        console.log(`✅ Project created successfully: ${result.workspace}`);
        res.json(result);
        
    } catch (error) {
        console.error('❌ Project creation error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🧪 Simple Agent Test API running on port ${PORT}`);
    console.log(`📡 Test endpoint: POST /api/agent/test-create`);
    console.log(`🔬 Health check: GET /health`);
});