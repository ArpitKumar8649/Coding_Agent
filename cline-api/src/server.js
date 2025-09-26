const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
require('dotenv').config();

const agentRoutes = require('./routes/agent');
const { errorHandler, notFound } = require('./middleware/error');
const { authenticate } = require('./middleware/auth');
const { rateLimiter } = require('./middleware/rateLimit');

// Services
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

// Initialize services
console.log('🚀 Initializing services...');
const streamingService = new StreamingService(server);

// Handle streaming requests for agent operations
streamingService.on('stream_request', async ({ streamId, connectionId, type, request, callback }) => {
  try {
    console.log(`📡 Processing stream request: ${type} (${streamId})`);
    
    // For now, streaming is handled directly by agent operations
    // Future: Add agent streaming support here
    
    streamingService.completeStream(streamId, { 
      message: 'Agent operations handle streaming internally' 
    });
    
  } catch (error) {
    console.error(`Stream processing error (${streamId}):`, error);
    streamingService.errorStream(streamId, error);
  }
});

// API routes
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
  console.log(`🤖 Agent API: http://localhost:${PORT}/api/agent`);
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