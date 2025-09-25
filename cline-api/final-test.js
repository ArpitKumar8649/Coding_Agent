/**
 * Final comprehensive test of fixed Cline Agent API
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { getLLMProvider } = require('./src/services/llmService');

const app = express();
app.use(cors());
app.use(express.json());

class FixedClineAgent {
    constructor() {
        this.provider = getLLMProvider('openrouter');
    }

    // Clean markdown blocks and extraneous content from generated code
    cleanGeneratedCode(content) {
        // Remove markdown code blocks
        content = content.replace(/```[\w]*\n?/g, '');
        content = content.replace(/\n?```$/gm, '');
        
        // Remove explanatory text before/after code
        const lines = content.split('\n');
        let startIdx = 0;
        let endIdx = lines.length - 1;
        
        // Find first line that looks like actual code
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line && (
                line.match(/^(<!DOCTYPE|<html|<\?xml|\{|import|export|const|let|var|function|class|\/\*|\*|\/\/|#)/) ||
                line.includes('<') || line.includes('{') || line.includes('=')
            )) {
                startIdx = i;
                break;
            }
        }
        
        // Find last line that's actual code (not explanation)
        for (let i = lines.length - 1; i >= startIdx; i--) {
            const line = lines[i].trim();
            if (line && !line.match(/^(Here|The|This|Generated|Note|I've|Now|Finally)/i)) {
                endIdx = i;
                break;
            }
        }
        
        return lines.slice(startIdx, endIdx + 1).join('\n').trim();
    }

    // Generate file content with proper Cline-style prompting
    async generateFileContent(filePath, description, framework, existingFiles = []) {
        const fileExt = path.extname(filePath);
        let fileType = 'file';
        
        if (fileExt === '.html') fileType = 'HTML document';
        else if (fileExt === '.css') fileType = 'CSS stylesheet';
        else if (fileExt === '.js') fileType = 'JavaScript file';
        else if (fileExt === '.json') fileType = 'JSON configuration';
        else if (fileExt === '.jsx') fileType = 'React JSX component';

        const prompt = `You are Cline, an expert developer. Generate complete, production-ready code for this ${fileType}.

FILE: ${filePath}
FRAMEWORK: ${framework}
TASK: ${description}
EXISTING FILES: ${existingFiles.join(', ') || 'none'}

CRITICAL REQUIREMENTS:
1. Return ONLY the raw ${fileType} content
2. NO markdown code blocks (no \`\`\`)
3. NO explanations or comments outside the code
4. Generate complete, functional, ready-to-use content
5. Follow ${framework} best practices
6. Ensure proper syntax and structure
7. Make it immediately usable

${fileType === 'JSON configuration' ? 'Generate valid JSON:' : fileType === 'HTML document' ? 'Generate complete HTML document:' : fileType === 'CSS stylesheet' ? 'Generate CSS styles:' : 'Generate JavaScript code:'}`;

        const response = await this.provider.generateCode(prompt, {
            model: process.env.DEFAULT_MODEL || 'x-ai/grok-4-fast:free',
            temperature: 0.1,
            maxTokens: 3000
        });

        return this.cleanGeneratedCode(response.content);
    }

    // Create a complete project following Cline's pattern
    async createProject(description, framework = 'HTML/CSS/JS') {
        console.log(`🚀 Creating ${framework} project: "${description}"`);
        
        // Create project workspace
        const projectName = description.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 40);
            
        const timestamp = Date.now();
        const workspace = `/tmp/cline-projects/${projectName}-${timestamp}`;
        
        await fs.mkdir(workspace, { recursive: true });
        console.log(`📁 Created workspace: ${workspace}`);

        // Define file structure based on framework
        let fileStructure = [];
        
        if (framework === 'React') {
            fileStructure = [
                { path: 'package.json', description: 'React package.json with dependencies for create-react-app' },
                { path: 'public/index.html', description: 'HTML template with root div for React app' },
                { path: 'src/index.js', description: 'React entry point with ReactDOM.render' },
                { path: 'src/App.js', description: `Main React component implementing: ${description}` },
                { path: 'src/App.css', description: 'CSS styles for the React application with modern styling' }
            ];
        } else if (framework === 'Vue.js') {
            fileStructure = [
                { path: 'package.json', description: 'Vue.js package.json with Vue 3 dependencies' },
                { path: 'index.html', description: 'HTML template for Vue app' },
                { path: 'src/main.js', description: 'Vue app entry point' },
                { path: 'src/App.vue', description: `Main Vue component implementing: ${description}` },
                { path: 'src/style.css', description: 'CSS styles for Vue application' }
            ];
        } else {
            // Default HTML/CSS/JS
            fileStructure = [
                { path: 'index.html', description: `Complete HTML page implementing: ${description}` },
                { path: 'style.css', description: 'CSS styles with modern design and responsive layout' },
                { path: 'script.js', description: `JavaScript functionality implementing: ${description}` }
            ];
        }

        const results = [];
        const createdFiles = [];

        // Generate each file step by step
        for (let i = 0; i < fileStructure.length; i++) {
            const fileSpec = fileStructure[i];
            
            try {
                console.log(`🔧 Generating ${fileSpec.path}...`);
                
                const content = await this.generateFileContent(
                    fileSpec.path,
                    fileSpec.description,
                    framework,
                    createdFiles
                );

                // Write file
                const fullPath = path.join(workspace, fileSpec.path);
                await fs.mkdir(path.dirname(fullPath), { recursive: true });
                await fs.writeFile(fullPath, content, 'utf8');
                
                createdFiles.push(fileSpec.path);
                results.push({
                    path: fileSpec.path,
                    action: 'created',
                    size: content.length,
                    success: true
                });

                console.log(`✅ Created ${fileSpec.path} (${content.length} chars)`);
                
            } catch (error) {
                console.error(`❌ Failed to create ${fileSpec.path}:`, error.message);
                results.push({
                    path: fileSpec.path,
                    action: 'failed',
                    error: error.message,
                    success: false
                });
            }
        }

        const successfulFiles = results.filter(r => r.success).map(r => r.path);
        
        console.log(`✅ Project created successfully: ${workspace}`);
        console.log(`📁 Files created: ${successfulFiles.join(', ')}`);

        return {
            success: true,
            projectId: Buffer.from(workspace).toString('base64').substring(0, 16),
            workspace,
            task: {
                taskId: timestamp.toString(),
                userId: 'test-user',
                isActive: false,
                progress: 100,
                summary: {
                    isActive: false,
                    progress: 100,
                    totalSteps: fileStructure.length,
                    completedSteps: successfulFiles.length,
                    hasErrors: results.some(r => !r.success),
                    workspace
                }
            },
            files: {
                createdFiles: successfulFiles,
                totalFiles: successfulFiles.length,
                framework,
                results
            },
            timestamp: new Date().toISOString()
        };
    }

    // Continue project development (add features)
    async continueProject(projectId, instruction, workspace) {
        console.log(`🔄 Continuing project ${projectId}: "${instruction}"`);
        
        if (!workspace) {
            workspace = Buffer.from(projectId, 'base64').toString();
        }

        // Read existing files to understand context
        let existingFiles = [];
        try {
            const files = await fs.readdir(workspace, { recursive: true });
            existingFiles = files.filter(f => f.endsWith('.js') || f.endsWith('.html') || f.endsWith('.css'));
        } catch (error) {
            console.error('Could not read existing files:', error.message);
        }

        // Determine what files need to be modified or created
        let framework = 'HTML/CSS/JS';
        if (existingFiles.some(f => f.includes('package.json'))) {
            try {
                const packageJson = await fs.readFile(path.join(workspace, 'package.json'), 'utf8');
                if (packageJson.includes('react')) framework = 'React';
                else if (packageJson.includes('vue')) framework = 'Vue.js';
            } catch {}
        }

        // For now, modify the main files based on instruction
        const filesToModify = framework === 'React' 
            ? ['src/App.js', 'src/App.css']
            : ['script.js', 'style.css'];

        const results = [];
        
        for (const filePath of filesToModify) {
            try {
                const fullPath = path.join(workspace, filePath);
                let currentContent = '';
                
                try {
                    currentContent = await fs.readFile(fullPath, 'utf8');
                } catch {
                    // File doesn't exist, will create new
                }

                console.log(`🔧 Updating ${filePath}...`);
                
                const modifyPrompt = `You are Cline. Modify this ${framework} file based on the instruction.

INSTRUCTION: ${instruction}
FILE: ${filePath}
CURRENT CONTENT:
${currentContent}

Generate the complete updated file content implementing the requested changes.
Return ONLY the raw code without markdown blocks or explanations.`;

                const response = await this.provider.generateCode(modifyPrompt, {
                    model: process.env.DEFAULT_MODEL || 'x-ai/grok-4-fast:free',
                    temperature: 0.1
                });

                const newContent = this.cleanGeneratedCode(response.content);
                await fs.writeFile(fullPath, newContent, 'utf8');
                
                results.push({
                    path: filePath,
                    action: currentContent ? 'modified' : 'created',
                    size: newContent.length,
                    success: true
                });

                console.log(`✅ Updated ${filePath}`);
                
            } catch (error) {
                console.error(`❌ Failed to update ${filePath}:`, error.message);
                results.push({
                    path: filePath,
                    action: 'failed',
                    error: error.message,
                    success: false
                });
            }
        }

        const successfulFiles = results.filter(r => r.success);
        
        return {
            success: true,
            projectId,
            workspace,
            result: results,
            files: {
                createdFiles: results.filter(r => r.action === 'created').map(r => r.path),
                modifiedFiles: results.filter(r => r.action === 'modified').map(r => r.path),
                totalFiles: results.length
            },
            timestamp: new Date().toISOString()
        };
    }
}

// Initialize agent
const agent = new FixedClineAgent();

// API Endpoints
app.post('/api/agent/create-project', async (req, res) => {
    try {
        const { description, preferences = {} } = req.body;
        
        if (!description) {
            return res.status(400).json({ error: 'Description is required' });
        }

        const framework = preferences.framework || 'HTML/CSS/JS';
        const result = await agent.createProject(description, framework);
        
        res.json(result);
        
    } catch (error) {
        console.error('❌ Create project error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

app.post('/api/agent/continue-project', async (req, res) => {
    try {
        const { projectId, instruction, workspace } = req.body;
        
        if (!projectId || !instruction) {
            return res.status(400).json({ error: 'ProjectId and instruction are required' });
        }

        const result = await agent.continueProject(projectId, instruction, workspace);
        res.json(result);
        
    } catch (error) {
        console.error('❌ Continue project error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

app.get('/api/agent/projects/:projectId/files', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { filePath } = req.query;
        
        // Decode workspace path
        let workspace;
        try {
            workspace = Buffer.from(projectId, 'base64').toString();
        } catch {
            workspace = `/tmp/cline-projects/${projectId}`;
        }

        if (filePath) {
            // Return specific file content
            const fullPath = path.join(workspace, filePath);
            const content = await fs.readFile(fullPath, 'utf8');
            res.json({ success: true, path: filePath, content, size: content.length });
        } else {
            // List all files
            const files = await fs.readdir(workspace, { recursive: true });
            const fileList = files.filter(f => !f.includes('node_modules'));
            res.json({ success: true, files: fileList, count: fileList.length });
        }
        
    } catch (error) {
        res.status(404).json({ success: false, error: error.message });
    }
});

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '3.0.0-fixed',
        features: ['✅ Clean code generation', '✅ Multiple frameworks', '✅ Project management']
    });
});

// Start server
const PORT = process.env.PORT || 3003;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Fixed Cline Agent API running on port ${PORT}`);
    console.log(`📡 Health: GET /health`);
    console.log(`🛠️  Create: POST /api/agent/create-project`);
    console.log(`🔄 Continue: POST /api/agent/continue-project`);
    console.log(`📁 Files: GET /api/agent/projects/:id/files`);
    console.log(`🎯 Ready for testing!`);
});