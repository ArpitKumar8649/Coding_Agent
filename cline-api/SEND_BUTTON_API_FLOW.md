# Send Button API Flow Documentation 🚀

## Overview
This document shows the complete flow from when a user clicks the Send button in the chat interface to how it connects with the Cline API services.

## 📱 Frontend Send Button Code Flow

### 1. Send Button Component (`MessageInput.jsx`)
```jsx
// Send button in /app/frontend/src/components/chat/MessageInput.jsx
<button
  onClick={onSend}  // ← This triggers the message sending
  disabled={disabled || !value.trim()}
  className={`flex-shrink-0 p-2 rounded-lg transition-all ${
    disabled || !value.trim()
      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
      : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 active:scale-95'
  }`}
>
  {disabled ? (
    <Square className="w-4 h-4" />
  ) : (
    <Send className="w-4 h-4" />  // ← Send icon
  )}
</button>
```

### 2. Chat Interface Handler (`ChatInterface.jsx`)
```jsx
// In /app/frontend/src/components/chat/ChatInterface.jsx
const handleSendMessage = () => {
  if (input.trim() && onSendMessage) {
    onSendMessage(input.trim());  // ← Calls parent component
    setInput('');                 // ← Clears input
  }
};

// MessageInput component receives this handler
<MessageInput
  value={input}
  onChange={setInput}
  onSend={handleSendMessage}  // ← Send button calls this
  onKeyPress={handleKeyPress}
  disabled={isStreaming}
/>
```

### 3. Main App Component (`App.js`)
```jsx
// In /app/frontend/src/App.js
const handleSendMessage = (message) => {
  const success = sendMessage(message);  // ← Calls useClineChat hook
  if (!success) {
    console.error('Failed to send message');
  }
};

// Passes handler to ChatInterface
<ChatInterface
  messages={messages}
  onSendMessage={handleSendMessage}  // ← This handler
  isStreaming={isStreaming}
  currentMode={currentMode}
  onModeChange={handleModeChange}
  agentStatus={agentStatus}
  isConnected={isConnected}
  sessionId={sessionId}
/>
```

## 🔗 API Connection Flow

### 4. Chat Hook (`useClineChat.js`)
```jsx
// In /app/frontend/src/hooks/useClineChat.js
const sendMessage = useCallback((content) => {
  if (!isConnected || !sessionId) {
    console.warn('Cannot send message: not connected to chat service');
    return false;
  }

  // Uses WebSocket to send message
  return wsService.current.sendChatMessage(content, currentMode);
}, [isConnected, sessionId, currentMode]);
```

### 5. WebSocket Service (`WebSocketService.js`)
```jsx
// In /app/frontend/src/services/WebSocketService.js
class WebSocketService {
  // Connects to backend WebSocket
  connect(url = 'ws://localhost:8001/ws') {  // ← Backend port 8001
    // WebSocket connection logic...
  }

  // Send chat message via WebSocket
  sendChatMessage(content, mode = 'ACT') {
    return this.send('chat_message', { content, mode });  // ← Sends to backend
  }

  send(type, data = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = {
        type,           // ← 'chat_message'
        timestamp: Date.now(),
        ...data         // ← { content: "user message", mode: "ACT" }
      };
      this.ws.send(JSON.stringify(message));  // ← Actual WebSocket send
      return true;
    }
    return false;
  }
}
```

## 🖥️ Backend API Processing

### 6. FastAPI Backend (`/app/backend/server.py`)
```python
# WebSocket endpoint that receives frontend messages
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connection_id = str(uuid.uuid4())
    
    try:
        while True:
            # Receive message from frontend
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            message_type = message_data.get("type")
            
            if message_type == "chat_message":
                session_id = message_data.get("sessionId")
                content = message_data.get("content")      # ← User's message
                mode = message_data.get("mode", "ACT")
                
                if session_id and session_id in active_sessions:
                    # Echo user message back to frontend
                    await websocket.send_text(json.dumps({
                        "type": "user_message",
                        "content": content,            # ← User's message
                        "mode": mode,
                        "timestamp": datetime.utcnow().isoformat()
                    }))
                    
                    # Process message would call Cline-API here
                    # (Currently responds with basic echo)
```

### 7. Session Management API
```python
# HTTP API for session management
@app.post("/api/chat/sessions/{session_id}/messages")
async def send_chat_message(session_id: str, request: ChatMessageRequest):
    """Send message to chat session"""
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = active_sessions[session_id]
    
    try:
        # If enhanced session, use enhanced API
        if session.get("api_type") == "enhanced" and session.get("enhanced_session_id"):
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{ENHANCED_CLINE_API_URL}/api/sessions/{session['enhanced_session_id']}/messages",
                    json={
                        "message": request.message,    # ← User's message
                        "options": {
                            "mode": request.mode       # ← PLAN or ACT
                        }
                    },
                    timeout=60.0
                )
                
                # Returns Cline API response back to frontend
                if response.status_code == 200:
                    result = response.json()
                    return {
                        "success": True,
                        "sessionId": session_id,
                        "response": result        # ← Cline API response
                    }
```

## 🤖 Cline API Integration

### 8. Enhanced Cline API (`/app/cline-api/src/enhanced-server.js`)
```javascript
// Process message in session
app.post('/api/sessions/:sessionId/messages', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { message, options = {} } = req.body;  // ← User's message arrives here
        
        console.log(`📨 Processing message in session ${sessionId}: ${message.substring(0, 100)}...`);
        
        // Process with AdvancedClineAPI
        const response = await advancedAPI.processMessage(sessionId, message, options);
        
        res.json({
            success: true,
            ...response,           // ← AI response from Cline
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error processing message:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
```

### 9. Advanced Cline API Processing (`AdvancedClineAPI.js`)
```javascript
// Process user message with full Cline capabilities
async processMessage(sessionId, message, options = {}) {
    const session = this.sessions.get(sessionId);
    
    // Add user message to history
    session.conversationHistory.push({
        type: 'user',
        content: message,               // ← User's message
        timestamp: new Date().toISOString(),
        mode: session.mode
    });
    
    let response;
    
    if (session.mode === 'PLAN') {
        response = await this.processPlanModeMessage(session, message, options);
    } else {
        response = await this.processActModeMessage(session, message, options);
    }
    
    // Add assistant response to history
    session.conversationHistory.push({
        type: 'assistant',
        content: response.content,      // ← AI response
        timestamp: new Date().toISOString(),
        mode: session.mode,
        toolUsed: response.toolUsed,
        executionResult: response.executionResult
    });
    
    return response;                    // ← Returns to backend → frontend
}
```

## 📊 Complete Message Flow Diagram

```
User clicks Send Button
         ↓
MessageInput.jsx (onSend)
         ↓
ChatInterface.jsx (handleSendMessage)
         ↓
App.js (handleSendMessage)
         ↓
useClineChat.js (sendMessage)
         ↓
WebSocketService.js (sendChatMessage)
         ↓
WebSocket: ws://localhost:8001/ws
         ↓
Backend server.py (websocket_endpoint)
         ↓
HTTP: POST /api/sessions/{id}/messages
         ↓
Enhanced Cline API (port 3001)
         ↓
AdvancedClineAPI.js (processMessage)
         ↓
SystemPromptEngine + ToolExecutor + LLM
         ↓
AI Response flows back through same chain
         ↓
Frontend displays response
```

## 🔧 API Endpoints Called

### Frontend → Backend (port 8001):
- **WebSocket**: `ws://localhost:8001/ws` (real-time communication)
- **HTTP**: `POST /api/chat/sessions` (create session)
- **HTTP**: `POST /api/chat/sessions/{id}/messages` (send message)
- **HTTP**: `POST /api/chat/sessions/{id}/mode` (switch PLAN/ACT)

### Backend → Cline-API (port 3001):
- **HTTP**: `POST /api/sessions/{id}/messages` (process with AI)
- **HTTP**: `POST /api/sessions/{id}/mode` (mode switching)
- **HTTP**: `GET /api/sessions/{id}` (session status)

## 💡 Key Features

### Message Processing:
- **Real-time**: WebSocket for instant communication
- **Dual Mode**: PLAN (planning) vs ACT (implementation) modes
- **Tool Execution**: AI can execute files, commands, searches
- **Streaming**: Real-time response streaming (when implemented)
- **Error Recovery**: Comprehensive error handling and retries

### Advanced Capabilities:
- **Quality Levels**: Poor/Medium/Advanced code generation
- **System Prompts**: 6000+ line sophisticated prompts
- **Tool Orchestration**: 10+ tools (files, commands, searches)
- **Git Integration**: Auto-commit and project awareness
- **Context Management**: Project understanding and relationships

The send button triggers a sophisticated AI coding assistant with full Cline capabilities! 🚀