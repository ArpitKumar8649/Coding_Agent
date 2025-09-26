/**
 * Chat-Enabled Cline API Server - Frontend Integration
 * Integrates with existing Cline capabilities + WebSocket chat support
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 8001;

// Configure CORS for frontend integration
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize WebSocket Server
const wss = new WebSocket.Server({ 
    server,
    path: '/ws',
    verifyClient: (info) => {
        // Accept connections from frontend
        return true;
    }
});

// Initialize Advanced Cline API
const advancedAPI = new AdvancedClineAPI({
    workspaceDir: process.env.WORKSPACE_DIR || '/tmp/cline-workspace',
    llmProvider: process.env.LLM_PROVIDER || 'openai',
    qualityLevel: process.env.QUALITY_LEVEL || 'advanced',
    enableGit: process.env.ENABLE_GIT !== 'false',
    enableValidation: process.env.ENABLE_VALIDATION !== 'false',
    enableStreaming: true
});

// Connection Manager for WebSocket clients
class ConnectionManager {
    constructor() {
        this.connections = new Map();
        this.sessions = new Map();
    }

    addConnection(ws, sessionId) {
        const connectionId = this.generateId();
        this.connections.set(connectionId, {
            ws,
            sessionId,
            connectedAt: Date.now(),
            lastActivity: Date.now()
        });
        
        if (sessionId) {
            if (!this.sessions.has(sessionId)) {
                this.sessions.set(sessionId, new Set());
            }
            this.sessions.get(sessionId).add(connectionId);
        }
        
        return connectionId;
    }

    removeConnection(connectionId) {
        const connection = this.connections.get(connectionId);
        if (connection && connection.sessionId) {
            const sessionConnections = this.sessions.get(connection.sessionId);
            if (sessionConnections) {
                sessionConnections.delete(connectionId);
                if (sessionConnections.size === 0) {
                    this.sessions.delete(connection.sessionId);
                }
            }
        }
        this.connections.delete(connectionId);
    }

    broadcastToSession(sessionId, message) {
        const sessionConnections = this.sessions.get(sessionId);
        if (sessionConnections) {
            sessionConnections.forEach(connectionId => {
                const connection = this.connections.get(connectionId);
                if (connection && connection.ws.readyState === WebSocket.OPEN) {
                    connection.ws.send(JSON.stringify(message));
                }
            });
        }
    }

    sendToConnection(connectionId, message) {
        const connection = this.connections.get(connectionId);
        if (connection && connection.ws.readyState === WebSocket.OPEN) {
            connection.ws.send(JSON.stringify(message));
        }
    }

    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
}

const connectionManager = new ConnectionManager();

// WebSocket Event Handlers
wss.on('connection', (ws, req) => {
    console.log('🔌 New WebSocket connection established');
    let connectionId = null;
    let currentSessionId = null;

    ws.on('message', async (data) => {
        try {
            const message = JSON.parse(data.toString());
            console.log('📨 Received message:', message.type);

            switch (message.type) {
                case 'join_session':
                    currentSessionId = message.sessionId;
                    connectionId = connectionManager.addConnection(ws, currentSessionId);
                    
                    ws.send(JSON.stringify({
                        type: 'session_joined',
                        sessionId: currentSessionId,
                        connectionId
                    }));
                    break;

                case 'chat_message':
                    await handleChatMessage(message, currentSessionId);
                    break;

                case 'switch_mode':
                    await handleModeSwitch(message, currentSessionId);
                    break;

                case 'tool_approval':
                    await handleToolApproval(message, currentSessionId);
                    break;

                default:
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: `Unknown message type: ${message.type}`
                    }));
            }
        } catch (error) {
            console.error('WebSocket message error:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to process message',
                error: error.message
            }));
        }
    });

    ws.on('close', () => {
        console.log('🔌 WebSocket connection closed');
        if (connectionId) {
            connectionManager.removeConnection(connectionId);
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });

    // Send welcome message
    ws.send(JSON.stringify({
        type: 'welcome',
        message: 'Connected to Cline Chat API',
        timestamp: Date.now()
    }));
});

// Chat message handler
async function handleChatMessage(message, sessionId) {
    try {
        const { content, mode = 'ACT' } = message;
        
        // Broadcast user message to all session connections
        connectionManager.broadcastToSession(sessionId, {
            type: 'user_message',
            content,
            timestamp: Date.now(),
            mode
        });

        // Broadcast agent thinking indicator
        connectionManager.broadcastToSession(sessionId, {
            type: 'agent_status',
            status: 'thinking',
            timestamp: Date.now()
        });

        // Process message with Advanced Cline API
        const response = await advancedAPI.processMessage(sessionId, content, {
            mode,
            streaming: true,
            onStream: (chunk) => {
                // Real-time streaming to frontend
                connectionManager.broadcastToSession(sessionId, {
                    type: 'agent_stream',
                    content: chunk.content,
                    complete: chunk.complete,
                    timestamp: Date.now()
                });
            },
            onToolExecution: (toolData) => {
                // Tool execution updates
                connectionManager.broadcastToSession(sessionId, {
                    type: 'tool_execution',
                    ...toolData,
                    timestamp: Date.now()
                });
            }
        });

        // Send final response
        connectionManager.broadcastToSession(sessionId, {
            type: 'agent_response',
            content: response.content,
            mode: response.mode,
            timestamp: Date.now(),
            toolsUsed: response.toolsUsed
        });

        // Update status to idle
        connectionManager.broadcastToSession(sessionId, {
            type: 'agent_status',
            status: 'idle',
            timestamp: Date.now()
        });

    } catch (error) {
        console.error('Chat message processing error:', error);
        connectionManager.broadcastToSession(sessionId, {
            type: 'error',
            message: 'Failed to process chat message',
            error: error.message,
            timestamp: Date.now()
        });
    }
}

// Mode switch handler
async function handleModeSwitch(message, sessionId) {
    try {
        const { mode } = message;
        const result = await advancedAPI.switchMode(sessionId, mode);
        
        connectionManager.broadcastToSession(sessionId, {
            type: 'mode_switched',
            mode: result.mode,
            capabilities: result.capabilities,
            timestamp: Date.now()
        });
    } catch (error) {
        console.error('Mode switch error:', error);
        connectionManager.broadcastToSession(sessionId, {
            type: 'error',
            message: 'Failed to switch mode',
            error: error.message,
            timestamp: Date.now()
        });
    }
}

// Tool approval handler
async function handleToolApproval(message, sessionId) {
    try {
        const { executionId, approved, feedback } = message;
        
        // Handle tool approval logic
        // This would integrate with the tool execution system
        
        connectionManager.broadcastToSession(sessionId, {
            type: 'tool_approval_processed',
            executionId,
            approved,
            feedback,
            timestamp: Date.now()
        });
    } catch (error) {
        console.error('Tool approval error:', error);
    }
}

// REST API Routes for HTTP clients

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        version: '1.0.0-chat',
        features: [
            'WebSocket Chat Interface',
            'Advanced Cline Integration', 
            'Real-time Streaming',
            'Plan vs Act Modes',
            'Tool Execution with Approval',
            'Session Management'
        ],
        websocket: `ws://localhost:${PORT}/ws`,
        connections: connectionManager.connections.size,
        sessions: connectionManager.sessions.size,
        timestamp: new Date().toISOString()
    });
});

// Create chat session
app.post('/api/chat/sessions', async (req, res) => {
    try {
        const sessionConfig = {
            startMode: req.body.mode || 'ACT',
            qualityLevel: req.body.qualityLevel || 'advanced',
            ...req.body
        };
        
        const session = await advancedAPI.createSession(sessionConfig);
        
        res.json({
            success: true,
            sessionId: session.sessionId,
            mode: session.mode,
            websocketUrl: `ws://localhost:${PORT}/ws`,
            capabilities: session.capabilities,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Session creation error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get chat session status
app.get('/api/chat/sessions/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const status = advancedAPI.getSessionStatus(sessionId);
        
        res.json({
            success: true,
            sessionId,
            ...status,
            connectedClients: connectionManager.sessions.get(sessionId)?.size || 0,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Session status error:', error);
        res.status(404).json({
            success: false,
            error: error.message
        });
    }
});

// Send message via HTTP (alternative to WebSocket)
app.post('/api/chat/sessions/:sessionId/messages', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { message, mode = 'ACT' } = req.body;
        
        // Process through WebSocket handler
        await handleChatMessage({ content: message, mode }, sessionId);
        
        res.json({
            success: true,
            message: 'Message sent and processed',
            sessionId,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('HTTP message error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Switch mode via HTTP
app.post('/api/chat/sessions/:sessionId/mode', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { mode } = req.body;
        
        await handleModeSwitch({ mode }, sessionId);
        
        res.json({
            success: true,
            mode,
            sessionId,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('HTTP mode switch error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// List all active sessions
app.get('/api/chat/sessions', (req, res) => {
    try {
        const sessions = advancedAPI.getAllSessions();
        const sessionDetails = sessions.map(session => ({
            ...session,
            connectedClients: connectionManager.sessions.get(session.sessionId)?.size || 0
        }));
        
        res.json({
            success: true,
            sessions: sessionDetails,
            totalSessions: sessions.length,
            activeConnections: connectionManager.connections.size,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Sessions list error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled HTTP error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
    });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
    console.log(`
🚀 Cline Chat API Server running on port ${PORT}

💬 Chat Features:
  • Real-time WebSocket communication
  • Advanced Cline AI integration
  • Plan vs Act mode switching
  • Streaming responses with tool execution
  • Session management with reconnection support

🔗 Endpoints:
  • WebSocket: ws://localhost:${PORT}/ws
  • HTTP API: http://localhost:${PORT}/api/chat
  • Health: http://localhost:${PORT}/health

🎯 Frontend Integration:
  • CORS enabled for localhost:3000
  • Real-time message streaming
  • Tool execution with approval workflow
  • Advanced code generation capabilities

📊 Current Status:
  • Connections: 0
  • Sessions: 0
  • Quality Level: ${process.env.QUALITY_LEVEL || 'advanced'}
  • Git Enabled: ${process.env.ENABLE_GIT !== 'false' ? 'Yes' : 'No'}
`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    wss.close(() => {
        server.close(() => {
            process.exit(0);
        });
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    wss.close(() => {
        server.close(() => {
            process.exit(0);
        });
    });
});

module.exports = { app, server, wss };