# Enhanced Cline Chat Interface

A modern, responsive React-based chat interface that connects directly to the Cline API service for AI-powered coding assistance.

## Features

### 🎆 Enhanced Chat Experience
- **Direct API Connection**: Connects directly to Cline API (port 3000) instead of the FastAPI backend
- **Real-time Communication**: WebSocket support for live updates and streaming responses
- **Responsive Design**: Optimized for mobile, tablet, and desktop viewing
- **Modern UI**: Clean, dark-themed interface with smooth animations

### 🤖 Agent Capabilities
- **Plan vs Act Modes**: Switch between planning discussions and immediate execution
- **Tool Execution Indicators**: Visual feedback for file operations, commands, and code generation
- **Streaming Updates**: Real-time display of agent thinking and execution progress
- **Project Management**: Track active projects and their status

### 📝 Message Types
- **User Messages**: Your input with mode indicators and attachments support
- **Assistant Messages**: AI responses with syntax highlighting and code blocks
- **Tool Execution**: Detailed view of file operations, command execution, and results
- **File Changes**: Track file creation, updates, and diffs
- **System Messages**: Connection status, mode changes, and notifications

### 📱 Mobile-First Design
- **Responsive Layout**: Adapts to all screen sizes
- **Touch-Optimized**: Large touch targets and gesture-friendly interactions
- **Collapsible Interface**: Minimize chat on mobile for better space utilization
- **Progressive Enhancement**: Works great on both slow and fast connections

## Getting Started

### Prerequisites

1. **Node.js**: Version 14 or higher
2. **Cline API Service**: Must be running on port 3000
3. **API Key**: Valid Cline API key (can use 'development-key' for local development)

### Installation

1. **Install Dependencies**:
   ```bash
   cd /app/frontend
   npm install
   ```

2. **Environment Configuration**:
   The `.env` file is already configured with default values:
   ```bash
   # Direct Cline API Connection
   REACT_APP_CLINE_API_URL=http://localhost:3000
   REACT_APP_CLINE_WS_URL=ws://localhost:3000/ws
   REACT_APP_CLINE_API_KEY=development-key
   ```

3. **Start the Development Server**:
   ```bash
   npm start
   ```

4. **Access the Interface**:
   Open [http://localhost:3000](http://localhost:3000) in your browser

### Starting the Complete System

1. **Start Cline API Service** (Terminal 1):
   ```bash
   cd /app/cline-api
   npm install
   npm start
   ```

2. **Start Enhanced Frontend** (Terminal 2):
   ```bash
   cd /app/frontend
   npm install
   npm start
   ```

3. **Access the Chat Interface**:
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Cline API: [http://localhost:3000](http://localhost:3000) (API documentation)

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `REACT_APP_CLINE_API_URL` | `http://localhost:3000` | Cline API base URL |
| `REACT_APP_CLINE_WS_URL` | `ws://localhost:3000/ws` | WebSocket URL for real-time updates |
| `REACT_APP_CLINE_API_KEY` | `development-key` | API key for authentication |

### API Configuration

The Cline API service requires these environment variables (in `/app/cline-api/.env`):

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# API Authentication
API_KEY=development-key

# LLM Provider (choose one)
OPENROUTER_API_KEY=your-openrouter-key
ANTHROPIC_API_KEY=your-anthropic-key
OPENAI_API_KEY=your-openai-key

# Default settings
DEFAULT_LLM_PROVIDER=anthropic
DEFAULT_MODEL=claude-3-5-sonnet-20241022
```

## Usage Guide

### Basic Chat

1. **Start a Conversation**: Type your message and press Enter
2. **Switch Modes**: Use the mode switch to toggle between Plan and Act
3. **Watch Progress**: Monitor real-time updates as Cline works
4. **Review Results**: Examine file changes, tool executions, and code output

### Mode Explanation

- **Plan Mode** (🧠): Discuss requirements, architecture, and approach before implementation
- **Act Mode** (⚡): Direct execution and implementation of your requests

### Message Types

#### User Messages
- Your input with timestamp and mode indicator
- Support for multi-line text (Shift+Enter)
- Attachment indicators (future feature)

#### Assistant Messages
- AI responses with syntax highlighting
- Real-time streaming updates
- Code blocks with copy functionality
- Progress indicators

#### Tool Execution Messages
- Expandable view of tool operations
- Parameter and result details
- Status indicators (running, completed, failed)
- Real-time execution updates

#### File Change Messages
- File creation and update notifications
- Diff view for changes
- Copy file paths
- Content preview

## Architecture

### Components Structure

```
src/
├── components/
│   └── chat/
│       ├── EnhancedChatInterface.jsx    # Main chat container
│       ├── EnhancedMessageList.jsx      # Message container
│       ├── EnhancedMessageInput.jsx     # Input component
│       ├── EnhancedModeSwitch.jsx       # Plan/Act mode switcher
│       ├── EnhancedUserMessage.jsx      # User message display
│       ├── EnhancedAssistantMessage.jsx # AI message display
│       ├── EnhancedToolExecutionMessage.jsx # Tool execution display
│       ├── FileChangeMessage.jsx        # File change display
│       └── CodeBlock.jsx               # Code highlighting
├── hooks/
│   └── useDirectClineChat.js        # Main chat logic
├── services/
│   ├── DirectClineAPIService.js     # HTTP API client
│   └── DirectWebSocketService.js    # WebSocket client
└── utils/
    └── timeUtils.js                # Time formatting utilities
```

### Data Flow

1. **User Input**: User types message in `EnhancedMessageInput`
2. **Hook Processing**: `useDirectClineChat` handles the message
3. **API Call**: `DirectClineAPIService` sends HTTP request to Cline API
4. **WebSocket Updates**: `DirectWebSocketService` receives real-time updates
5. **State Updates**: Hook updates component state
6. **UI Rendering**: Components re-render with new data

### State Management

The `useDirectClineChat` hook manages:
- **messages**: Array of all chat messages
- **isConnected**: WebSocket connection status
- **isStreaming**: Whether AI is currently responding
- **currentMode**: 'PLAN' or 'ACT' mode
- **agentStatus**: 'idle', 'thinking', or 'executing'
- **currentProject**: Active project information
- **connectionError**: Connection error messages

## Responsive Design

### Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Mobile Optimizations

- **Collapsible Header**: Minimize chat interface to save space
- **Touch Targets**: 44px minimum for better touch interaction
- **Simplified UI**: Hide non-essential elements on small screens
- **Swipe Gestures**: Support for mobile navigation patterns

### Tablet Optimizations

- **Split Layout**: Side-by-side message and input areas
- **Adaptive Sizing**: Flexible component sizing
- **Touch-First**: Optimized for touch interaction

### Desktop Features

- **Full Feature Set**: All features available
- **Keyboard Shortcuts**: Enhanced keyboard navigation
- **Multi-Window**: Support for multiple chat sessions

## Troubleshooting

### Common Issues

#### Connection Failed
- **Check Cline API**: Ensure Cline API service is running on port 3000
- **API Key**: Verify the API key in `.env` file
- **Network**: Check for firewall or network restrictions

#### WebSocket Issues
- **Browser Support**: Ensure browser supports WebSockets
- **Proxy/Firewall**: Check if WebSocket connections are blocked
- **SSL/TLS**: WebSocket URL must match page protocol (ws/wss)

#### UI/Display Issues
- **Browser Cache**: Clear browser cache and reload
- **Console Errors**: Check browser developer console for errors
- **CSS Loading**: Ensure Tailwind CSS is loading properly

### Debug Mode

In development mode, a debug panel shows:
- Connection status
- Current mode and agent status
- Message count and streaming state
- Current project ID
- Error messages

### Performance Tips

1. **Message Limit**: Consider implementing message pagination for long conversations
2. **Image Optimization**: Compress images if using file attachments
3. **WebSocket Reconnection**: Automatic reconnection handles connection drops
4. **Memory Management**: Clear old messages periodically

## Development

### Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API and WebSocket services
│   ├── utils/           # Utility functions
│   ├── App.js           # Main application component
│   ├── App.css          # Global styles and animations
│   └── index.js         # Application entry point
├── .env                 # Environment configuration
├── package.json         # Dependencies and scripts
├── tailwind.config.js   # Tailwind CSS configuration
└── README.md           # This file
```

### Adding New Features

1. **New Message Type**: Create component in `components/chat/`
2. **API Integration**: Add methods to `DirectClineAPIService`
3. **WebSocket Events**: Handle new events in `DirectWebSocketService`
4. **State Management**: Update `useDirectClineChat` hook
5. **UI Updates**: Add to `EnhancedMessageList` component

### Code Style

- **ESLint**: Follow React/JavaScript best practices
- **Prettier**: Consistent code formatting
- **Component Structure**: Functional components with hooks
- **Props**: Use PropTypes or TypeScript for type checking

## API Reference

### DirectClineAPIService Methods

- `checkHealth()`: Health check
- `createProject(description, preferences)`: Create new project
- `continueProject(projectId, instruction)`: Continue existing project
- `getProjectStatus(projectId)`: Get project status
- `getProjectFiles(projectId)`: Get project files
- `listProjects()`: List active projects
- `cancelProject(projectId)`: Cancel project

### DirectWebSocketService Events

- `connected`: WebSocket connection established
- `disconnected`: WebSocket connection lost
- `project_created`: New project created
- `project_progress`: Project progress update
- `agent_thinking`: Agent is processing
- `tool_execution`: Tool execution update
- `file_change`: File created/updated
- `project_completed`: Project finished

## Contributing

1. **Fork the Repository**
2. **Create Feature Branch**: `git checkout -b feature/your-feature`
3. **Make Changes**: Follow code style guidelines
4. **Test Changes**: Ensure all functionality works
5. **Submit Pull Request**: Describe your changes

## License

Apache 2.0 © 2025 Cline Bot Inc.

## Support

- **Issues**: GitHub Issues for bug reports
- **Discussions**: GitHub Discussions for feature requests
- **Documentation**: This README and inline code comments
- **API Documentation**: Available at Cline API service endpoint