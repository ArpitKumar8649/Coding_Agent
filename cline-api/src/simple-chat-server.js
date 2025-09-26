/**
 * Simple Chat Server for Cline Frontend Integration
 * Basic WebSocket chat interface while we build out full Cline integration
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 8001;

// Configure CORS for frontend integration
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Initialize WebSocket Server
const wss = new WebSocket.Server({ 
    server,
    path: '/ws'
});

// Simple session management
class SessionManager {
    constructor() {
        this.sessions = new Map();
        this.connections = new Map();
    }

    createSession(config = {}) {
        const sessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        const session = {
            id: sessionId,
            created: new Date().toISOString(),
            mode: config.mode || 'ACT',
            messages: [],
            status: 'active'
        };
        
        this.sessions.set(sessionId, session);
        console.log(`📋 Created session ${sessionId} in ${session.mode} mode`);
        
        return session;
    }

    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }

    addMessage(sessionId, message) {
        const session = this.getSession(sessionId);
        if (session) {
            session.messages.push({
                ...message,
                timestamp: Date.now()
            });
        }
    }

    switchMode(sessionId, newMode) {
        const session = this.getSession(sessionId);
        if (session) {
            const oldMode = session.mode;
            session.mode = newMode;
            console.log(`🔄 Session ${sessionId} switched from ${oldMode} to ${newMode}`);
            return { success: true, oldMode, newMode };
        }
        return { success: false, error: 'Session not found' };
    }

    addConnection(sessionId, ws) {
        if (!this.connections.has(sessionId)) {
            this.connections.set(sessionId, new Set());
        }
        this.connections.get(sessionId).add(ws);
    }

    removeConnection(sessionId, ws) {
        if (this.connections.has(sessionId)) {
            this.connections.get(sessionId).delete(ws);
        }
    }

    broadcastToSession(sessionId, message) {
        const connections = this.connections.get(sessionId);
        if (connections) {
            connections.forEach(ws => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify(message));
                }
            });
        }
    }
}

const sessionManager = new SessionManager();

// Mock AI Response Generator
class MockClineAgent {
    async processMessage(sessionId, message, mode = 'ACT') {
        console.log(`🤖 Processing message in ${mode} mode: ${message.substring(0, 50)}...`);
        
        // Simulate thinking time
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        let response;
        
        if (mode === 'PLAN') {
            response = this.generatePlanResponse(message);
        } else {
            response = this.generateActResponse(message);
        }
        
        return {
            content: response,
            mode,
            toolsUsed: [],
            timestamp: Date.now()
        };
    }

    generatePlanResponse(message) {
        const planResponses = [
            `I understand you want to: "${message}"

Let me help you plan this out step by step:

## 📋 Project Analysis
- **Scope**: This looks like a ${this.detectProjectType(message)} project
- **Complexity**: Medium complexity with multiple components needed
- **Tech Stack**: React, Node.js, and supporting libraries

## 🎯 Implementation Strategy
1. **Setup Phase**: Create project structure and dependencies
2. **Core Components**: Build main functionality components  
3. **Integration**: Connect frontend with backend services
4. **Testing & Polish**: Validate functionality and improve UX

## 🤔 Questions for You:
- Any specific UI/UX preferences or design system?
- Do you need any particular integrations or external services?
- What's your target audience or use case?

Would you like me to proceed with implementation, or do you want to discuss any of these aspects further?`,

            `Great idea! Let me break down "${message}" into a structured plan:

## 🔍 Requirements Analysis
Based on your request, I can see we need:
- **Frontend Components**: Interactive UI elements
- **State Management**: Handle data flow and user interactions
- **Styling**: Modern, responsive design
- **Functionality**: Core features that deliver value

## 📐 Architecture Approach
1. **Component Structure**: Modular, reusable components
2. **Data Flow**: Centralized state with local component state where appropriate
3. **Styling Strategy**: Tailwind CSS for consistent, maintainable styles
4. **Performance**: Optimized rendering and efficient updates

## 🚀 Implementation Phases
**Phase 1**: Basic structure and core components
**Phase 2**: Advanced features and interactions  
**Phase 3**: Polish, optimization, and edge cases

Ready to switch to ACT mode and start building? Or would you like to refine the plan further?`,

            `Excellent! "${message}" sounds like a valuable project. Here's my planning approach:

## 💡 Concept Validation
This project will provide significant value by:
- Solving a real user problem
- Providing intuitive, accessible interface
- Following modern development practices
- Being maintainable and scalable

## 🔧 Technical Considerations
- **Framework**: React with modern hooks and patterns
- **Styling**: Tailwind CSS for rapid, consistent styling
- **State**: Local state with Context API where needed
- **Performance**: Optimized for smooth user experience

## 📋 Development Workflow
1. Create foundational structure
2. Implement core functionality iteratively
3. Add advanced features and polish
4. Test across different scenarios

Shall we proceed to implementation? I'm ready to start building when you are!`
        ];

        return planResponses[Math.floor(Math.random() * planResponses.length)];
    }

    generateActResponse(message) {
        if (message.toLowerCase().includes('create') || message.toLowerCase().includes('build')) {
            return this.generateBuildResponse(message);
        } else if (message.toLowerCase().includes('fix') || message.toLowerCase().includes('debug')) {
            return this.generateFixResponse(message);
        } else {
            return this.generateGeneralResponse(message);
        }
    }

    generateBuildResponse(message) {
        const buildResponses = [
            `I'll help you build that! Let me create the components you need.

## 🔨 Implementation Plan
I'll start by creating the core structure and then build out the functionality step by step.

\`\`\`jsx
// Main Component Structure
const App = () => {
  const [state, setState] = useState(initialState);
  
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />
      <MainContent state={state} onChange={setState} />
      <Footer />
    </div>
  );
};
\`\`\`

This will include:
- **Modern React patterns** with hooks and functional components
- **Tailwind CSS** for beautiful, responsive styling  
- **Clean architecture** that's easy to maintain and extend
- **Accessibility features** for inclusive user experience

Would you like me to start implementing this? I can create the files and show you the progress in real-time!`,

            `Perfect! I'll build this with modern React and beautiful styling.

## ⚡ Development Approach
Creating a professional, production-ready implementation with:

\`\`\`javascript
// State Management
const useAppState = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const handleAction = useCallback(async (action) => {
    setLoading(true);
    try {
      // Implementation logic
      setData(await processAction(action));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  
  return { data, loading, error, handleAction };
};
\`\`\`

## 🎨 UI Features
- **Dark theme** with professional color palette
- **Responsive design** that works on all devices
- **Smooth animations** for enhanced user experience
- **Loading states** and error handling

Ready to see this come to life? I'll start creating the components now!`
        ];

        return buildResponses[Math.floor(Math.random() * buildResponses.length)];
    }

    generateFixResponse(message) {
        return `I'll help you fix that issue! Let me analyze the problem and provide a solution.

## 🔍 Issue Analysis
Based on your description: "${message}"

Common causes for this type of issue:
- **State synchronization** problems between components
- **Event handling** not properly bound or cleaned up  
- **CSS specificity** or styling conflicts
- **Dependencies** missing or incorrectly configured

## 🛠️ Solution Approach
Let me check the relevant code and provide fixes:

\`\`\`javascript
// Typical fix pattern
useEffect(() => {
  // Proper cleanup and error handling
  const controller = new AbortController();
  
  const fetchData = async () => {
    try {
      const result = await api.getData({ signal: controller.signal });
      setData(result);
    } catch (error) {
      if (!controller.signal.aborted) {
        setError(error.message);
      }
    }
  };
  
  fetchData();
  
  return () => controller.abort();
}, [dependencies]);
\`\`\`

This should resolve the issue. Would you like me to apply these fixes to your code?`;
    }

    generateGeneralResponse(message) {
        return `I understand you're asking about: "${message}"

I'm here to help with your development needs! I can:

## 🚀 **Development Capabilities**
- **Create React components** with modern patterns and best practices
- **Build full applications** from concept to completion
- **Debug and fix issues** in existing code
- **Add new features** to existing projects
- **Optimize performance** and improve user experience

## 💻 **Technologies I Excel At**
- **Frontend**: React, JavaScript/TypeScript, Tailwind CSS, HTML5
- **Styling**: Modern CSS, responsive design, dark/light themes
- **State Management**: React hooks, Context API, local state
- **Best Practices**: Accessibility, performance, clean code

## 🎯 **How I Can Help**
Just tell me what you'd like to build, fix, or improve, and I'll:
1. Analyze your requirements
2. Create a clear implementation plan
3. Build it step by step with explanations
4. Test and refine until it's perfect

What would you like to work on together?`;
    }

    detectProjectType(message) {
        if (message.toLowerCase().includes('todo') || message.toLowerCase().includes('task')) {
            return 'task management';
        } else if (message.toLowerCase().includes('chat') || message.toLowerCase().includes('message')) {
            return 'communication';
        } else if (message.toLowerCase().includes('dashboard') || message.toLowerCase().includes('admin')) {
            return 'dashboard/analytics';
        } else if (message.toLowerCase().includes('ecommerce') || message.toLowerCase().includes('shop')) {
            return 'e-commerce';
        } else {
            return 'web application';
        }
    }
}

const mockAgent = new MockClineAgent();

// WebSocket Event Handlers
wss.on('connection', (ws, req) => {
    console.log('🔌 New WebSocket connection established');
    let currentSessionId = null;

    ws.on('message', async (data) => {
        try {
            const message = JSON.parse(data.toString());
            console.log('📨 Received message:', message.type);

            switch (message.type) {
                case 'join_session':
                    currentSessionId = message.sessionId;
                    sessionManager.addConnection(currentSessionId, ws);
                    
                    ws.send(JSON.stringify({
                        type: 'session_joined',
                        sessionId: currentSessionId,
                        timestamp: Date.now()
                    }));
                    break;

                case 'chat_message':
                    await handleChatMessage(message, currentSessionId);
                    break;

                case 'switch_mode':
                    await handleModeSwitch(message, currentSessionId);
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
        if (currentSessionId) {
            sessionManager.removeConnection(currentSessionId, ws);
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
        
        // Add user message to session
        sessionManager.addMessage(sessionId, {
            type: 'user',
            content,
            mode
        });

        // Broadcast user message
        sessionManager.broadcastToSession(sessionId, {
            type: 'user_message',
            content,
            timestamp: Date.now(),
            mode
        });

        // Broadcast thinking status
        sessionManager.broadcastToSession(sessionId, {
            type: 'agent_status',
            status: 'thinking',
            timestamp: Date.now()
        });

        // Process with mock agent
        const response = await mockAgent.processMessage(sessionId, content, mode);
        
        // Add agent response to session
        sessionManager.addMessage(sessionId, {
            type: 'assistant',
            content: response.content,
            mode: response.mode,
            toolsUsed: response.toolsUsed
        });

        // Broadcast agent response
        sessionManager.broadcastToSession(sessionId, {
            type: 'agent_response',
            content: response.content,
            mode: response.mode,
            timestamp: response.timestamp,
            toolsUsed: response.toolsUsed
        });

        // Reset status to idle
        sessionManager.broadcastToSession(sessionId, {
            type: 'agent_status',
            status: 'idle',
            timestamp: Date.now()
        });

    } catch (error) {
        console.error('Chat message processing error:', error);
        sessionManager.broadcastToSession(sessionId, {
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
        const result = sessionManager.switchMode(sessionId, mode);
        
        if (result.success) {
            sessionManager.broadcastToSession(sessionId, {
                type: 'mode_switched',
                mode: mode,
                previousMode: result.oldMode,
                timestamp: Date.now()
            });
        } else {
            sessionManager.broadcastToSession(sessionId, {
                type: 'error',
                message: 'Failed to switch mode',
                error: result.error,
                timestamp: Date.now()
            });
        }
    } catch (error) {
        console.error('Mode switch error:', error);
        sessionManager.broadcastToSession(sessionId, {
            type: 'error',
            message: 'Failed to switch mode',
            error: error.message,
            timestamp: Date.now()
        });
    }
}

// REST API Routes

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        version: '1.0.0-simple',
        features: [
            'WebSocket Chat Interface',
            'Session Management', 
            'Plan vs Act Modes',
            'Mock Agent Responses'
        ],
        websocket: `ws://localhost:${PORT}/ws`,
        connections: wss.clients.size,
        sessions: sessionManager.sessions.size,
        timestamp: new Date().toISOString()
    });
});

// Create chat session
app.post('/api/chat/sessions', async (req, res) => {
    try {
        const session = sessionManager.createSession({
            mode: req.body.mode || 'ACT',
            ...req.body
        });
        
        res.json({
            success: true,
            sessionId: session.id,
            mode: session.mode,
            websocketUrl: `ws://localhost:${PORT}/ws`,
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
app.get('/api/chat/sessions/:sessionId', (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = sessionManager.getSession(sessionId);
        
        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            });
        }
        
        res.json({
            success: true,
            sessionId,
            ...session,
            messageCount: session.messages.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Session status error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// List all sessions
app.get('/api/chat/sessions', (req, res) => {
    try {
        const sessions = Array.from(sessionManager.sessions.values()).map(session => ({
            id: session.id,
            created: session.created,
            mode: session.mode,
            messageCount: session.messages.length,
            status: session.status
        }));
        
        res.json({
            success: true,
            sessions,
            totalSessions: sessions.length,
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
🚀 Simple Cline Chat API Server running on port ${PORT}

💬 Features:
  • Real-time WebSocket chat communication
  • Plan vs Act mode switching  
  • Session management
  • Mock intelligent responses

🔗 Endpoints:
  • WebSocket: ws://localhost:${PORT}/ws
  • HTTP API: http://localhost:${PORT}/api/chat
  • Health: http://localhost:${PORT}/health

🎯 Ready for Frontend Integration:
  • CORS enabled for localhost:3000
  • Mock Cline-style responses
  • Real-time streaming simulation
  • Professional conversation patterns

📊 Current Status:
  • Sessions: 0
  • Connections: 0
  • Mode: Ready for production
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