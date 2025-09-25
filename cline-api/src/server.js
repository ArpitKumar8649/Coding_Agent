const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
require('dotenv').config();

const codeRoutes = require('./routes/code');
const enhancedRoutes = require('./routes/enhanced');
const { errorHandler, notFound } = require('./middleware/error');
const { authenticate } = require('./middleware/auth');
const { rateLimiter } = require('./middleware/rateLimit');

// Enhanced services
const EnhancedApiService = require('./services/enhancedApiService');
const StreamingService = require('./services/streamingService');

const app = express();
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

// API routes
app.use('/api', codeRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Cline API Service',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      generate: 'POST /api/generate',
      edit: 'POST /api/edit',
      diff: 'POST /api/diff'
    }
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Cline API Service running on port ${PORT}`);
  console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🤖 Default LLM Provider: ${process.env.DEFAULT_LLM_PROVIDER || 'anthropic'}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
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