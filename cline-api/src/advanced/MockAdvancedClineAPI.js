/**
 * Mock Advanced Cline API for testing streaming implementation
 * This is a simplified version to get streaming working
 */

const { EventEmitter } = require('events');

class MockAdvancedClineAPI extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            workspaceDir: config.workspaceDir || '/tmp/cline-workspace',
            llmProvider: config.llmProvider || 'openai',
            qualityLevel: config.qualityLevel || 'advanced',
            enableGit: config.enableGit !== false,
            enableValidation: config.enableValidation !== false,
            enableStreaming: config.enableStreaming !== false,
            ...config
        };
        
        this.sessions = new Map();
        this.sessionCounter = 0;
        
        console.log('🤖 Mock Advanced Cline API initialized with config:', this.config);
    }

    async createSession(config = {}) {
        this.sessionCounter++;
        const sessionId = `session_${Date.now()}_${this.sessionCounter}`;
        
        const session = {
            sessionId,
            startMode: config.startMode || 'ACT',
            qualityLevel: config.qualityLevel || this.config.qualityLevel,
            enableGit: config.enableGit !== false,
            enableValidation: config.enableValidation !== false,
            enableStreaming: config.enableStreaming !== false,
            created: new Date().toISOString(),
            messages: [],
            context: {},
            status: 'active'
        };
        
        this.sessions.set(sessionId, session);
        
        console.log(`📝 Created advanced session: ${sessionId}`);
        
        return {
            success: true,
            sessionId,
            message: 'Advanced Cline session created successfully',
            ...session
        };
    }

    getSessionStatus(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }
        
        return {
            sessionId,
            status: session.status,
            mode: session.startMode,
            messageCount: session.messages.length,
            created: session.created,
            lastActivity: session.lastActivity || session.created
        };
    }

    async processMessage(sessionId, message, options = {}) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }
        
        session.lastActivity = new Date().toISOString();
        
        console.log(`💬 Processing message in session ${sessionId}: "${message.substring(0, 50)}..."`);
        
        // Add user message to session
        session.messages.push({
            type: 'user',
            content: message,
            timestamp: Date.now()
        });
        
        // Simulate streaming response
        if (options.streaming && options.onChunk) {
            await this.simulateStreamingResponse(message, options);
        }
        
        // Create a mock response
        const response = this.generateMockResponse(message, session);
        
        // Add assistant message to session
        session.messages.push({
            type: 'assistant',
            content: response.content,
            timestamp: Date.now(),
            toolsUsed: response.toolsUsed || []
        });
        
        if (options.onComplete) {
            options.onComplete({
                content: response.content,
                toolsUsed: response.toolsUsed,
                sessionId
            });
        }
        
        return {
            success: true,
            response: response.content,
            toolsUsed: response.toolsUsed || [],
            mode: session.startMode,
            timestamp: new Date().toISOString()
        };
    }

    async simulateStreamingResponse(message, options) {
        const mockResponse = this.generateMockResponse(message);
        const words = mockResponse.content.split(' ');
        
        console.log(`🌊 Starting streaming simulation for ${words.length} words`);
        
        let accumulatedContent = '';
        for (let i = 0; i < words.length; i++) {
            const word = words[i] + ' ';
            accumulatedContent += word;
            
            if (options.onChunk) {
                options.onChunk({
                    content: word,
                    accumulated: accumulatedContent,
                    quality: Math.min(5 + Math.floor(i / 10), 10), // Quality improves over time
                    errors: [],
                    timestamp: Date.now(),
                    progress: (i + 1) / words.length
                });
            }
            
            // Simulate realistic typing speed
            await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
        }
        
        console.log('✅ Streaming simulation completed');
    }

    generateMockResponse(message, session = {}) {
        const lowerMessage = message.toLowerCase();
        
        // Detect intent and generate appropriate response
        if (lowerMessage.includes('calculator') || lowerMessage.includes('math')) {
            return {
                content: `I'll help you create a calculator! Let me build a modern calculator app with HTML, CSS, and JavaScript.

First, I'll create the HTML structure with a clean interface:
- Display screen for numbers and results
- Number buttons (0-9)
- Operation buttons (+, -, *, /)
- Clear and equals buttons

Then I'll add CSS styling:
- Modern gradient design
- Responsive button layout
- Clean typography
- Hover effects

Finally, JavaScript functionality:
- Number input handling
- Operation logic
- Error handling
- Keyboard support

The calculator will support:
✓ Basic arithmetic operations
✓ Decimal numbers
✓ Clear functionality
✓ Keyboard input
✓ Error handling for division by zero

Would you like me to start building this calculator now?`,
                toolsUsed: ['file_creation', 'web_development']
            };
        }
        
        if (lowerMessage.includes('weather') || lowerMessage.includes('dashboard')) {
            return {
                content: `I'll create a beautiful weather dashboard for you! Here's what I'll build:

**Dashboard Features:**
🌤️ Current weather display with animated icons
📊 5-day forecast with temperature charts
📍 Location-based weather data
🎨 Beautiful responsive design
📱 Mobile-friendly interface

**Technical Implementation:**
- React components with hooks
- Weather API integration
- Tailwind CSS for styling
- Chart.js for data visualization
- Geolocation API for user location

**Components I'll create:**
1. WeatherCard - Current conditions
2. ForecastChart - Temperature trends
3. LocationSearch - City selector
4. WeatherDetails - Humidity, wind, pressure
5. DashboardLayout - Responsive grid

The dashboard will be fully responsive and include:
- Real-time weather updates
- Beautiful animations
- Interactive charts
- Search functionality
- Local storage for preferences

Ready to start building this weather dashboard?`,
                toolsUsed: ['react_development', 'api_integration', 'responsive_design']
            };
        }
        
        if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
            return {
                content: `I'm an Advanced Cline AI Agent with enhanced capabilities! Here's what I can help you with:

**🛠️ Development Capabilities:**
- Full-stack web applications (React, Node.js, Python)
- Modern UI/UX with Tailwind CSS
- Database integration (MongoDB, PostgreSQL)
- API development and integration
- Real-time features (WebSocket, SSE)

**⚡ Advanced Features:**
- Optimized streaming responses
- Real-time error detection and correction
- File upload and processing
- Git integration and version control
- Quality-enhanced code generation

**🎯 Modes Available:**
- **PLAN Mode**: Interactive planning and discussion
- **ACT Mode**: Direct implementation and building

**🚀 Recent Enhancements:**
- Performance optimizations
- Large file transfer support
- Real-time collaboration features
- Compression and batching
- Advanced error recovery

Just tell me what you'd like to build, and I'll create it with production-ready code, beautiful design, and optimized performance!`,
                toolsUsed: ['system_info', 'capability_overview']
            };
        }
        
        // Default response for other messages
        return {
            content: `I understand you want me to work on: "${message}"

I'm processing your request with advanced capabilities:

🧠 **Analyzing Requirements:**
- Understanding project scope and goals
- Identifying key features and functionality
- Planning technical architecture

🛠️ **Implementation Strategy:**
- Modern tech stack selection
- Responsive design principles
- Performance optimization
- Error handling and validation

⚡ **Advanced Features:**
- Real-time streaming responses
- Quality-enhanced code generation
- Git integration for version control
- Comprehensive testing approach

I'll start building this project with production-ready code, beautiful UI design, and optimized performance. The implementation will include proper error handling, responsive design, and modern development practices.

Would you like me to begin the implementation, or would you prefer to discuss the approach first in PLAN mode?`,
            toolsUsed: ['analysis', 'planning', 'modern_development']
        };
    }

    async switchMode(sessionId, mode) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }
        
        if (!['PLAN', 'ACT'].includes(mode)) {
            throw new Error('Mode must be either PLAN or ACT');
        }
        
        const previousMode = session.startMode;
        session.startMode = mode;
        session.lastActivity = new Date().toISOString();
        
        console.log(`🔄 Switched session ${sessionId} from ${previousMode} to ${mode}`);
        
        return {
            success: true,
            previousMode,
            currentMode: mode,
            message: `Successfully switched to ${mode} mode`,
            timestamp: new Date().toISOString()
        };
    }

    getAllSessions() {
        const sessions = Array.from(this.sessions.values()).map(session => ({
            sessionId: session.sessionId,
            status: session.status,
            mode: session.startMode,
            messageCount: session.messages.length,
            created: session.created,
            lastActivity: session.lastActivity || session.created
        }));
        
        return sessions;
    }

    async cleanupSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }
        
        this.sessions.delete(sessionId);
        
        console.log(`🗑️ Cleaned up session: ${sessionId}`);
        
        return {
            success: true,
            message: 'Session cleaned up successfully',
            sessionId
        };
    }

    // Utility methods
    getStats() {
        return {
            totalSessions: this.sessions.size,
            activeSessions: Array.from(this.sessions.values()).filter(s => s.status === 'active').length,
            totalMessages: Array.from(this.sessions.values()).reduce((total, session) => total + session.messages.length, 0),
            config: this.config
        };
    }
}

module.exports = MockAdvancedClineAPI;