const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
require('dotenv').config();

const agentRoutes = require('./routes/agent');
const { errorHandler, notFound } = require('./middleware/error');
const { authenticate } = require('./middleware/auth');
const { rateLimiter } = require('./middleware/rateLimit');

// Enhanced services
const EnhancedApiService = require('./services/enhancedApiService');
const StreamingService = require('./services/streamingService');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Rate limiting
app.use(rateLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Authentication middleware (applied to all routes except health)
app.use('/api', authenticate);

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime()
  });
});

// Initialize enhanced services
console.log('🚀 Initializing enhanced services...');
const streamingService = new StreamingService(server);
const enhancedApiService = new EnhancedApiService(streamingService);

// Make enhanced service available to routes
app.set('enhancedApiService', enhancedApiService);

// Handle streaming requests
streamingService.on('stream_request', async ({ streamId, connectionId, type, request, callback }) => {
  try {
    console.log(`📡 Processing stream request: ${type} (${streamId})`);
    
    let result;
    switch (type) {
      case 'generate':
        result = await enhancedApiService.generateCodeEnhanced({
          ...request,
          streamId
        });
        break;
      case 'edit':
        result = await enhancedApiService.editCodeEnhanced({
          ...request,
          streamId
        });
        break;
      default:
        throw new Error(`Unsupported stream type: ${type}`);
    }
    
    streamingService.completeStream(streamId, result);
    
  } catch (error) {
    console.error(`Stream processing error (${streamId}):`, error);
    streamingService.errorStream(streamId, error);
  }
});

// API routes
app.use('/api/v2', enhancedRoutes);
app.use('/api/agent', agentRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Cline API Service - Agent Edition',
    version: '3.0.0',
    features: [
      '🤖 Autonomous Coding Agent',
      '📋 Multi-Step Project Planning', 
      '📁 Complete File Management',
      '🎯 Response Caching',
      '📂 Project Context Management', 
      '🔄 Iterative Development',
      '📡 Real-time Streaming (WebSocket + SSE)',
      '🔄 Advanced Retry Logic',
      '📦 Batch Processing'
    ],
    endpoints: {
      // Agent endpoints (NEW)
      agent: {
        createProject: 'POST /api/agent/create-project',
        continueProject: 'POST /api/agent/continue-project',
        getProjects: 'GET /api/agent/projects',
        getProject: 'GET /api/agent/projects/:id/status',
        getFiles: 'GET /api/agent/projects/:id/files',
        cancelProject: 'POST /api/agent/projects/:id/cancel',
        cleanup: 'POST /api/agent/cleanup',
        stats: 'GET /api/agent/stats',
        health: 'GET /api/agent/health'
      },
      // System endpoints
      system: {
        health: 'GET /health'
      },
      // Enhanced v2 endpoints
      v2: {
        health: 'GET /api/v2/health',
        generate: 'POST /api/v2/generate',
        edit: 'POST /api/v2/edit',
        diff: 'POST /api/v2/diff',
        projects: 'POST/GET/PUT /api/v2/projects',
        sessions: 'POST/GET /api/v2/sessions',
        batch: 'POST /api/v2/batch',
        streaming: 'GET /api/v2/stream/generate/:streamId',
        cache: 'POST /api/v2/cache/clear'
      },
      websocket: 'ws://localhost:' + PORT + '/ws'
    },
    integration: {
      guide: 'See CLINE_AGENT_API_IMPLEMENTATION_GUIDE.md',
      examples: 'Full autonomous coding agent with multi-step execution'
    },
    usage: {
      createProject: {
        url: 'POST /api/agent/create-project',
        body: {
          description: 'Create a React todo app with API integration',
          preferences: { framework: 'React', styling: 'Tailwind CSS' },
          streaming: true
        }
      }
    }
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Cline API Service running on port ${PORT}`);
  console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🤖 Default LLM Provider: ${process.env.DEFAULT_LLM_PROVIDER || 'anthropic'}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 WebSocket server: ws://localhost:${PORT}/ws`);
  console.log(`📡 Enhanced API v2: http://localhost:${PORT}/api/v2`);
  console.log(`🎯 Features: Caching ✅ Context ✅ Streaming ✅ Sessions ✅`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});