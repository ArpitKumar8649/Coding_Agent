/**
 * Enhanced Cline API Server - Integrating advanced Cline capabilities
 * Includes sophisticated system prompts, Plan vs Act modes, advanced tools, and git awareness
 */

require('dotenv').config({ path: '.env.advanced' });

const express = require('express');
const cors = require('cors');
const path = require('path');
const AdvancedClineAPI = require('./advanced/AdvancedClineAPI');
const { authenticateAPIKey, applyRateLimit, validateRequest } = require('./middleware/advancedAuth');
const mongoService = require('./services/mongoService');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(applyRateLimit());
app.use(validateRequest);

// Authentication for all routes except health
app.use((req, res, next) => {
    if (req.path === '/health') {
        return next();
    }
    return authenticateAPIKey(req, res, next);
});

// Initialize Advanced Cline API
const advancedAPI = new AdvancedClineAPI({
    workspaceDir: process.env.WORKSPACE_DIR || '/tmp/cline-workspace',
    llmProvider: process.env.LLM_PROVIDER || 'openai',
    qualityLevel: process.env.QUALITY_LEVEL || 'advanced',
    enableGit: process.env.ENABLE_GIT !== 'false',
    enableValidation: process.env.ENABLE_VALIDATION !== 'false',
    enableStreaming: process.env.ENABLE_STREAMING !== 'false'
});

// Routes

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        version: '2.0.0-advanced',
        capabilities: [
            'Advanced System Prompts (6000+ lines)',
            'Plan vs Act Mode System',
            'Sophisticated Tool Orchestration', 
            'Git Awareness and Auto-commit',
            'Quality-Enhanced Code Generation',
            'Real-time Streaming and Validation',
            'Iterative Refinement Loops'
        ],
        timestamp: new Date().toISOString()
    });
});

// Create new session
app.post('/api/sessions', async (req, res) => {
    try {
        const sessionConfig = req.body || {};
        const session = await advancedAPI.createSession(sessionConfig);
        
        res.json({
            success: true,
            message: 'Advanced Cline session created successfully',
            ...session
        });
    } catch (error) {
        console.error('Error creating session:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get session status
app.get('/api/sessions/:sessionId', (req, res) => {
    try {
        const { sessionId } = req.params;
        const status = advancedAPI.getSessionStatus(sessionId);
        
        res.json({
            success: true,
            ...status
        });
    } catch (error) {
        console.error('Error getting session status:', error);
        res.status(404).json({
            success: false,
            error: error.message
        });
    }
});

// Process message in session
app.post('/api/sessions/:sessionId/messages', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { message, options = {} } = req.body;
        
        if (!message || typeof message !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Message is required and must be a string'
            });
        }
        
        console.log(`📨 Processing message in session ${sessionId}: ${message.substring(0, 100)}...`);
        
        const response = await advancedAPI.processMessage(sessionId, message, options);
        
        res.json({
            success: true,
            ...response,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error processing message:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Switch session mode (PLAN <-> ACT)
app.post('/api/sessions/:sessionId/mode', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { mode } = req.body;
        
        if (!mode || !['PLAN', 'ACT'].includes(mode)) {
            return res.status(400).json({
                success: false,
                error: 'Mode must be either "PLAN" or "ACT"'
            });
        }
        
        const result = await advancedAPI.switchMode(sessionId, mode);
        
        res.json({
            success: true,
            ...result,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error switching mode:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get all sessions
app.get('/api/sessions', (req, res) => {
    try {
        const sessions = advancedAPI.getAllSessions();
        
        res.json({
            success: true,
            sessions,
            count: sessions.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error listing sessions:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Delete session
app.delete('/api/sessions/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const result = await advancedAPI.cleanupSession(sessionId);
        
        res.json({
            success: true,
            ...result,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error deleting session:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Advanced capabilities endpoints

// Get advanced capabilities info
app.get('/api/capabilities', (req, res) => {
    res.json({
        success: true,
        advancedCapabilities: {
            systemPrompts: {
                description: 'Sophisticated 6000+ line system prompts based on real Cline architecture',
                features: [
                    'Model-specific optimizations',
                    'Comprehensive tool descriptions',
                    'Detailed workflow guidance',
                    'Quality-enhanced generation'
                ]
            },
            planActModes: {
                description: 'Plan vs Act mode system for better planning and execution',
                planMode: [
                    'Interactive planning and discussion',
                    'Requirements gathering',
                    'Architecture design',
                    'Mermaid diagram generation'
                ],
                actMode: [
                    'Step-by-step implementation',
                    'Real-time tool execution',
                    'Error handling and recovery',
                    'Progress tracking'
                ]
            },
            toolOrchestration: {
                description: 'Advanced tool execution with error recovery and validation',
                features: [
                    'Sophisticated retry logic',
                    'Real-time validation',
                    'Error recovery mechanisms',
                    'Execution history tracking'
                ]
            },
            gitAwareness: {
                description: 'Intelligent git operations and version control',
                features: [
                    'Auto-commit with smart messages',
                    'Git state tracking',
                    'Project history awareness',
                    'Branch and commit management'
                ]
            },
            qualityGeneration: {
                description: 'Quality-enhanced code generation',
                levels: ['poor', 'medium', 'advanced'],
                features: [
                    'Beautiful UI components',
                    'Modern React patterns',
                    'Accessibility features',
                    'Performance optimizations'
                ]
            }
        },
        timestamp: new Date().toISOString()
    });
});

// Test quality levels
app.post('/api/test/quality', async (req, res) => {
    try {
        const { description, quality = 'advanced' } = req.body;
        
        if (!description) {
            return res.status(400).json({
                success: false,
                error: 'Description is required for quality test'
            });
        }
        
        // Create test session
        const session = await advancedAPI.createSession({
            startMode: 'ACT',
            qualityLevel: quality
        });
        
        // Process test message
        const response = await advancedAPI.processMessage(
            session.sessionId,
            `Create a ${quality} quality React component: ${description}`
        );
        
        res.json({
            success: true,
            qualityLevel: quality,
            testResult: response,
            session: session.sessionId,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error testing quality:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
    });
});

module.exports = app;