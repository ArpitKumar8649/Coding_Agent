/**
 * Agent API Routes - New routes for the autonomous coding agent
 * These routes provide access to the full Cline agent capabilities via API
 */

const express = require('express');
const { validateRequest } = require('../middleware/validation');
const AgentService = require('../services/AgentService');

const router = express.Router();

// Initialize agent service
let agentService = null;

// Middleware to ensure agent service is initialized
const ensureAgentService = (req, res, next) => {
    if (!agentService) {
        agentService = new AgentService({
            streamingService: req.app.get('streamingService'),
            defaultWorkspace: process.env.DEFAULT_WORKSPACE || '/tmp/cline-projects'
        });
    }
    req.agentService = agentService;
    next();
};

// Apply middleware to all routes
router.use(ensureAgentService);

/**
 * POST /api/agent/create-project
 * Create a complete project using autonomous agent
 */
router.post('/create-project', async (req, res, next) => {
    try {
        const {
            description,
            workspace,
            preferences = {},
            userId,
            streaming = false
        } = req.body;

        // Validate request
        const validation = req.agentService.validateProjectRequest(req.body);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validation.errors
            });
        }

        console.log(`🚀 Agent: Creating project - "${description.substring(0, 50)}..."`);

        // Create project using agent
        const result = await req.agentService.createProject({
            description,
            workspace,
            preferences,
            userId: userId || req.headers['x-user-id'] || 'anonymous',
            streaming
        });

        res.json(result);

    } catch (error) {
        console.error('Agent project creation error:', error);
        next(error);
    }
});

/**
 * POST /api/agent/continue-project
 * Continue development on an existing project
 */
router.post('/continue-project', async (req, res, next) => {
    try {
        const {
            projectId,
            workspace,
            instruction,
            userId,
            streaming = false
        } = req.body;

        if (!instruction) {
            return res.status(400).json({
                success: false,
                error: 'Instruction is required'
            });
        }

        console.log(`🔄 Agent: Continuing project ${projectId} - "${instruction.substring(0, 50)}..."`);

        const result = await req.agentService.continueProject({
            projectId,
            workspace,
            instruction,
            userId: userId || req.headers['x-user-id'] || 'anonymous',
            streaming
        });

        res.json(result);

    } catch (error) {
        console.error('Agent project continuation error:', error);
        next(error);
    }
});

/**
 * GET /api/agent/projects/:projectId/status
 * Get project status and information
 */
router.get('/projects/:projectId/status', async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const { workspace } = req.query;

        const result = await req.agentService.getProjectStatus(projectId, workspace);
        res.json(result);

    } catch (error) {
        console.error('Agent project status error:', error);
        next(error);
    }
});

/**
 * GET /api/agent/projects/:projectId/files
 * Get project files
 */
router.get('/projects/:projectId/files', async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const { workspace, filePath } = req.query;

        const result = await req.agentService.getProjectFiles(projectId, workspace, filePath);
        res.json(result);

    } catch (error) {
        console.error('Agent project files error:', error);
        next(error);
    }
});

/**
 * GET /api/agent/projects
 * List active projects
 */
router.get('/projects', async (req, res, next) => {
    try {
        const userId = req.query.userId || req.headers['x-user-id'];
        
        const result = req.agentService.getActiveProjects(userId);
        res.json(result);

    } catch (error) {
        console.error('Agent projects list error:', error);
        next(error);
    }
});

/**
 * POST /api/agent/projects/:projectId/cancel
 * Cancel a project/task
 */
router.post('/projects/:projectId/cancel', async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const { workspace } = req.body;

        const result = await req.agentService.cancelProject(projectId, workspace);
        res.json(result);

    } catch (error) {
        console.error('Agent project cancel error:', error);
        next(error);
    }
});

/**
 * POST /api/agent/cleanup
 * Clean up old/completed projects
 */
router.post('/cleanup', async (req, res, next) => {
    try {
        const { olderThanHours = 24 } = req.body;

        const result = await req.agentService.cleanupProjects(olderThanHours);
        res.json(result);

    } catch (error) {
        console.error('Agent cleanup error:', error);
        next(error);
    }
});

/**
 * GET /api/agent/stats
 * Get service statistics
 */
router.get('/stats', async (req, res, next) => {
    try {
        const result = req.agentService.getServiceStats();
        res.json(result);

    } catch (error) {
        console.error('Agent stats error:', error);
        next(error);
    }
});

/**
 * POST /api/agent/validate-request
 * Validate a project request without executing
 */
router.post('/validate-request', async (req, res, next) => {
    try {
        const validation = req.agentService.validateProjectRequest(req.body);
        
        res.json({
            success: true,
            validation
        });

    } catch (error) {
        console.error('Agent validation error:', error);
        next(error);
    }
});

/**
 * POST /api/agent/advanced-generate
 * Advanced code generation with enhanced system prompts
 */
router.post('/advanced-generate', async (req, res, next) => {
    try {
        const {
            description,
            projectType = 'web-application',
            framework = 'react',
            features = [],
            qualityLevel = 'advanced',
            streaming = false,
            fileSpecs = [],
            contextAware = true
        } = req.body;

        if (!description) {
            return res.status(400).json({
                success: false,
                error: 'Description is required for advanced generation'
            });
        }

        console.log(`🧠 Advanced Generate: "${description.substring(0, 50)}..." (${qualityLevel})`);

        // Use enhanced system prompt
        const result = await req.agentService.advancedGenerate({
            description,
            projectType,
            framework,
            features,
            qualityLevel,
            streaming,
            fileSpecs,
            contextAware,
            userId: req.headers['x-user-id'] || 'anonymous'
        });

        res.json(result);

    } catch (error) {
        console.error('Advanced generation error:', error);
        next(error);
    }
});

/**
 * POST /api/agent/stream-generate
 * Real-time streaming generation with live updates
 */
router.post('/stream-generate', async (req, res, next) => {
    try {
        const {
            description,
            fileSpecs = [],
            qualityLevel = 'advanced',
            realTimeValidation = true,
            autoCorrection = true
        } = req.body;

        if (!description) {
            return res.status(400).json({
                success: false,
                error: 'Description is required for streaming generation'
            });
        }

        console.log(`🌊 Stream Generate: "${description.substring(0, 50)}..."`);

        // Set up streaming headers
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const streamId = await req.agentService.createStreamingGeneration({
            description,
            fileSpecs,
            qualityLevel,
            realTimeValidation,
            autoCorrection,
            onChunk: (chunk) => {
                res.write(`data: ${JSON.stringify(chunk)}\n\n`);
            },
            onComplete: (result) => {
                res.write(`data: ${JSON.stringify({ type: 'complete', result })}\n\n`);
                res.end();
            },
            onError: (error) => {
                res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
                res.end();
            }
        });

        res.write(`data: ${JSON.stringify({ type: 'started', streamId })}\n\n`);

    } catch (error) {
        console.error('Streaming generation error:', error);
        res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
        res.end();
    }
});

/**
 * POST /api/agent/bulk-file-generate
 * Generate multiple files with advanced prompts and dependencies
 */
router.post('/bulk-file-generate', async (req, res, next) => {
    try {
        const {
            files = [],
            projectContext = {},
            generateDependencies = true,
            qualityLevel = 'advanced',
            streaming = false
        } = req.body;

        if (!Array.isArray(files) || files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Files array is required and must not be empty'
            });
        }

        console.log(`📁 Bulk File Generate: ${files.length} files (${qualityLevel})`);

        const result = await req.agentService.bulkFileGenerate({
            files,
            projectContext,
            generateDependencies,
            qualityLevel,
            streaming,
            userId: req.headers['x-user-id'] || 'anonymous'
        });

        res.json(result);

    } catch (error) {
        console.error('Bulk file generation error:', error);
        next(error);
    }
});

/**
 * POST /api/agent/enhance-prompt
 * Enhance system prompt for specific use case
 */
router.post('/enhance-prompt', async (req, res, next) => {
    try {
        const {
            basePrompt = '',
            context = {},
            qualityLevel = 'advanced',
            projectType = 'web-application',
            features = []
        } = req.body;

        console.log(`✨ Enhance Prompt: ${projectType} (${qualityLevel})`);

        const result = await req.agentService.enhanceSystemPrompt({
            basePrompt,
            context,
            qualityLevel,
            projectType,
            features
        });

        res.json({
            success: true,
            enhancedPrompt: result.prompt,
            enhancement: result.enhancement,
            metadata: result.metadata
        });

    } catch (error) {
        console.error('Prompt enhancement error:', error);
        next(error);
    }
});

/**
 * GET /api/agent/health
 * Agent service health check
 */
router.get('/health', async (req, res, next) => {
    try {
        const stats = req.agentService.getServiceStats();
        
        res.json({
            status: 'healthy',
            agent: 'operational',
            stats,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Agent health check error:', error);
        next(error);
    }
});

module.exports = router;