const express = require('express');
const { validateRequest } = require('../middleware/validation');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Enhanced API service will be injected via middleware
const getEnhancedService = (req) => req.app.get('enhancedApiService');

// POST /api/v2/generate - Enhanced generation with context and caching
router.post('/generate', validateRequest('generateEnhanced'), async (req, res, next) => {
  try {
    const { prompt, options = {}, projectId, userId } = req.body;
    
    console.log(`🎯 Enhanced generate request for project: ${projectId || 'none'}`);
    
    const service = getEnhancedService(req);
    const result = await service.generateCodeEnhanced({
      prompt,
      options,
      projectId,
      userId
    });
    
    res.json({
      success: true,
      logs: result.logs,
      files: result.files,
      result: result.result,
      metadata: {
        model: result.model,
        provider: result.provider,
        tokensUsed: result.tokensUsed,
        processingTime: result.processingTime,
        fromCache: result.fromCache || false,
        cacheType: result.cacheType,
        projectId
      }
    });
    
  } catch (error) {
    next(error);
  }
});

// POST /api/v2/edit - Enhanced editing with session management
router.post('/edit', validateRequest('editEnhanced'), async (req, res, next) => {
  try {
    const { 
      filePath, 
      content, 
      instructions, 
      options = {}, 
      projectId, 
      sessionId,
      previewOnly = false 
    } = req.body;
    
    console.log(`✏️  Enhanced edit request - Session: ${sessionId || 'new'}, Preview: ${previewOnly}`);
    
    const service = getEnhancedService(req);
    const result = await service.editCodeEnhanced({
      filePath,
      content,
      instructions,
      options,
      projectId,
      sessionId,
      previewOnly
    });
    
    res.json({
      success: true,
      logs: result.logs,
      files: result.files,
      result: result.result,
      metadata: {
        model: result.model,
        provider: result.provider,
        tokensUsed: result.tokensUsed,
        processingTime: result.processingTime,
        sessionId: result.sessionId,
        editHistory: result.editHistory,
        isPreview: result.isPreview || false,
        projectId
      }
    });
    
  } catch (error) {
    next(error);
  }
});

// POST /api/v2/diff - Enhanced diff with project context
router.post('/diff', validateRequest('diff'), async (req, res, next) => {
  try {
    const { originalContent, newContent, filePath, projectId } = req.body;
    
    console.log(`🔍 Enhanced diff request for: ${filePath || 'unnamed file'}`);
    
    const service = getEnhancedService(req);
    const result = await service.getDiffEnhanced({
      originalContent,
      newContent,
      filePath,
      projectId
    });
    
    res.json({
      success: true,
      logs: [`Generated diff for ${filePath || 'file'}`],
      files: [{
        path: filePath || 'file.txt',
        diff: result.diff,
        changes: result.changes
      }],
      result: `Diff generated: ${result.changes.additions} additions, ${result.changes.deletions} deletions`,
      metadata: {
        processingTime: result.processingTime,
        projectId
      }
    });
    
  } catch (error) {
    next(error);
  }
});

// Project Management Routes

// POST /api/v2/projects - Create new project
router.post('/projects', async (req, res, next) => {
  try {
    const { name, description, preferences = {} } = req.body;
    const userId = req.headers['x-user-id'] || 'anonymous';
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Project name is required'
      });
    }
    
    const service = getEnhancedService(req);
    const project = await service.createProject(userId, {
      name,
      description,
      ...preferences
    });
    
    console.log(`📂 Created project: ${project.id} - ${project.name}`);
    
    res.json({
      success: true,
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        created: project.created,
        preferences: project.preferences
      },
      message: 'Project created successfully'
    });
    
  } catch (error) {
    next(error);
  }
});

// GET /api/v2/projects/:id - Get project details
router.get('/projects/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const service = getEnhancedService(req);
    const project = await service.getProject(id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    res.json({
      success: true,
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        created: project.created,
        updated: project.updated,
        components: Object.keys(project.components),
        dependencies: Array.from(project.dependencies),
        stats: project.stats,
        preferences: project.preferences
      }
    });
    
  } catch (error) {
    next(error);
  }
});

// PUT /api/v2/projects/:id - Update project
router.put('/projects/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const service = getEnhancedService(req);
    const project = await service.updateProject(id, updates);
    
    res.json({
      success: true,
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        updated: project.updated
      },
      message: 'Project updated successfully'
    });
    
  } catch (error) {
    next(error);
  }
});

// Edit Session Management Routes

// POST /api/v2/sessions - Create edit session
router.post('/sessions', async (req, res, next) => {
  try {
    const { projectId, filePath, content } = req.body;
    
    if (!projectId || !filePath || !content) {
      return res.status(400).json({
        success: false,
        error: 'projectId, filePath, and content are required'
      });
    }
    
    const service = getEnhancedService(req);
    const session = await service.createEditSession(projectId, {
      filePath,
      content
    });
    
    console.log(`✏️  Created edit session: ${session.id}`);
    
    res.json({
      success: true,
      session: {
        id: session.id,
        projectId: session.projectId,
        filePath: session.filePath,
        created: session.created,
        status: session.status
      },
      message: 'Edit session created successfully'
    });
    
  } catch (error) {
    next(error);
  }
});

// GET /api/v2/sessions/:id - Get edit session
router.get('/sessions/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const service = getEnhancedService(req);
    const session = service.getEditSession(id);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Edit session not found'
      });
    }
    
    res.json({
      success: true,
      session: {
        id: session.id,
        projectId: session.projectId,
        filePath: session.filePath,
        created: session.created,
        lastModified: session.lastModified,
        status: session.status,
        historyCount: session.history ? session.history.length : 0,
        currentContent: session.currentContent
      }
    });
    
  } catch (error) {
    next(error);
  }
});

// POST /api/v2/sessions/:id/close - Close edit session
router.post('/sessions/:id/close', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const service = getEnhancedService(req);
    const session = await service.closeEditSession(id);
    
    res.json({
      success: true,
      session: {
        id: session.id,
        status: session.status,
        closed: session.closed,
        totalEdits: session.history.length
      },
      message: 'Edit session closed successfully'
    });
    
  } catch (error) {
    next(error);
  }
});

// Streaming Routes

// GET /api/v2/stream/generate/:streamId - Server-Sent Events for generation
router.get('/stream/generate/:streamId', async (req, res, next) => {
  try {
    const { streamId } = req.params;
    
    const service = getEnhancedService(req);
    if (!service.streaming) {
      return res.status(501).json({
        success: false,
        error: 'Streaming not enabled'
      });
    }
    
    const connectionId = service.streaming.handleSSE(req, res, streamId);
    
    console.log(`📡 SSE connection established: ${connectionId} for stream: ${streamId}`);
    
    // Keep connection alive
    const keepAlive = setInterval(() => {
      service.streaming.sendSSEUpdate(streamId, 'ping', { timestamp: new Date().toISOString() });
    }, 30000); // Ping every 30 seconds
    
    req.on('close', () => {
      clearInterval(keepAlive);
      console.log(`📡 SSE disconnected: ${connectionId}`);
    });
    
  } catch (error) {
    next(error);
  }
});

// POST /api/v2/batch - Batch processing
router.post('/batch', async (req, res, next) => {
  try {
    const { requests } = req.body;
    
    if (!Array.isArray(requests) || requests.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'requests array is required and must not be empty'
      });
    }
    
    if (requests.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 10 requests per batch'
      });
    }
    
    console.log(`📦 Processing batch of ${requests.length} requests`);
    
    const service = getEnhancedService(req);
    const results = await service.processBatch(requests);
    
    const successCount = results.filter(r => r.success).length;
    
    res.json({
      success: true,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: results.length - successCount
      },
      message: `Batch processed: ${successCount}/${results.length} successful`
    });
    
  } catch (error) {
    next(error);
  }
});

// System Routes

// GET /api/v2/health - Enhanced health check
router.get('/health', async (req, res, next) => {
  try {
    const service = getEnhancedService(req);
    const health = service.getHealthStatus();
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      uptime: process.uptime(),
      enhanced: health
    });
    
  } catch (error) {
    next(error);
  }
});

// POST /api/v2/cache/clear - Clear cache
router.post('/cache/clear', async (req, res, next) => {
  try {
    const service = getEnhancedService(req);
    const cleared = await service.clearCache();
    
    res.json({
      success: cleared,
      message: cleared ? 'Cache cleared successfully' : 'Failed to clear cache',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    next(error);
  }
});

module.exports = router;