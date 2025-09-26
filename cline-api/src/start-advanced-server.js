/**
 * Advanced Cline API Server Startup
 */

require('dotenv').config({ path: '.env.advanced' });

const app = require('./enhanced-server');
const mongoService = require('./services/mongoService');

async function startServer() {
    try {
        // Connect to MongoDB
        console.log('🔌 Connecting to MongoDB...');
        await mongoService.connect();
        
        // Create workspaces directory
        const fs = require('fs').promises;
        const workspaceDir = process.env.WORKSPACE_DIR || './workspaces';
        await fs.mkdir(workspaceDir, { recursive: true });
        console.log(`📁 Workspace directory ready: ${workspaceDir}`);
        
        const PORT = process.env.PORT || 3001;
        
        const server = app.listen(PORT, () => {
            console.log(`
🚀 Advanced Cline API Server running on port ${PORT}

📊 Advanced Features Enabled:
  • Sophisticated System Prompts (6000+ lines)
  • Plan vs Act Mode System  
  • Advanced Tool Orchestration
  • Git Awareness & Auto-commit
  • Quality-Enhanced Code Generation
  • Real-time Streaming & Validation
  • Iterative Refinement Loops
  • MongoDB Session Persistence

🔗 API Endpoints:
  • POST /api/sessions - Create new advanced session
  • POST /api/sessions/:id/messages - Process message with enhanced capabilities
  • POST /api/sessions/:id/mode - Switch between PLAN and ACT modes
  • GET /api/capabilities - View advanced capabilities
  • POST /api/test/quality - Test quality-enhanced generation

🎯 Quality Levels: poor, medium, advanced
🔄 Modes: PLAN (planning & discussion) | ACT (implementation)
📋 Git: ${process.env.ENABLE_GIT !== 'false' ? 'Enabled' : 'Disabled'}
🔑 API Key: ${process.env.API_KEY ? 'Configured ✅' : 'Not configured ❌'}
🤖 Model: ${process.env.DEFAULT_MODEL}
`);
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            console.log('\n🛑 Shutting down server...');
            await mongoService.disconnect();
            server.close(() => {
                console.log('✅ Server shut down gracefully');
                process.exit(0);
            });
        });

    } catch (error) {
        console.error('❌ Server startup failed:', error);
        process.exit(1);
    }
}

startServer();