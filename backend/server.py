"""
Backend server for Cline Chat Interface
Bridges React frontend to Cline-API service
"""

import os
import asyncio
import json
import uuid
from datetime import datetime
from typing import Dict, Any, Optional

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import httpx
import uvicorn
from pydantic import BaseModel

# Configuration
CLINE_API_URL = os.getenv('CLINE_API_URL', 'http://localhost:3002')
ENHANCED_CLINE_API_URL = os.getenv('ENHANCED_CLINE_API_URL', 'http://localhost:3003')

app = FastAPI(
    title="Cline Chat Backend",
    description="Backend service bridging React frontend to Cline-API functionality",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for sessions and WebSocket connections
active_sessions: Dict[str, Dict] = {}
websocket_connections: Dict[str, WebSocket] = {}

# Request/Response models
class ChatSessionRequest(BaseModel):
    mode: str = "ACT"
    qualityLevel: str = "advanced"
    description: Optional[str] = None

class ChatMessageRequest(BaseModel):
    message: str
    mode: str = "ACT"

class ModeRequest(BaseModel):
    mode: str

# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "services": {
            "cline_api": "connected",
            "enhanced_cline_api": "connected"
        }
    }

# Chat session management
@app.post("/api/chat/sessions")
async def create_chat_session(request: ChatSessionRequest):
    """Create a new chat session"""
    try:
        session_id = str(uuid.uuid4())
        
        # Try to create session with Enhanced Cline API first
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{ENHANCED_CLINE_API_URL}/api/sessions",
                    json={
                        "startMode": request.mode,
                        "qualityLevel": request.qualityLevel,
                        "description": request.description
                    },
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    enhanced_session = response.json()
                    
                    # Store session info
                    active_sessions[session_id] = {
                        "id": session_id,
                        "created": datetime.utcnow().isoformat(),
                        "mode": request.mode,
                        "qualityLevel": request.qualityLevel,
                        "enhanced_session_id": enhanced_session.get("sessionId"),
                        "api_type": "enhanced",
                        "status": "active"
                    }
                    
                    return {
                        "success": True,
                        "sessionId": session_id,
                        "mode": request.mode,
                        "qualityLevel": request.qualityLevel,
                        "api_type": "enhanced",
                        "enhanced_session_id": enhanced_session.get("sessionId")
                    }
                    
            except Exception as e:
                print(f"Enhanced API not available: {e}")
                pass
        
        # Fallback to basic session creation
        active_sessions[session_id] = {
            "id": session_id,
            "created": datetime.utcnow().isoformat(),
            "mode": request.mode,
            "qualityLevel": request.qualityLevel,
            "api_type": "basic",
            "status": "active"
        }
        
        return {
            "success": True,
            "sessionId": session_id,
            "mode": request.mode,
            "qualityLevel": request.qualityLevel,
            "api_type": "basic"
        }
        
    except Exception as e:
        print(f"Session creation error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create session: {str(e)}")

@app.get("/api/chat/sessions/{session_id}")
async def get_chat_session(session_id: str):
    """Get chat session information"""
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = active_sessions[session_id]
    
    # If enhanced session, get status from enhanced API
    if session.get("api_type") == "enhanced" and session.get("enhanced_session_id"):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{ENHANCED_CLINE_API_URL}/api/sessions/{session['enhanced_session_id']}",
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    enhanced_status = response.json()
                    session.update(enhanced_status)
                    
        except Exception as e:
            print(f"Failed to get enhanced session status: {e}")
    
    return {
        "success": True,
        **session
    }

@app.get("/api/chat/sessions")
async def list_chat_sessions():
    """List all active chat sessions"""
    return {
        "success": True,
        "sessions": list(active_sessions.values()),
        "count": len(active_sessions)
    }

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
                        "message": request.message,
                        "options": {
                            "mode": request.mode
                        }
                    },
                    timeout=60.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    
                    # Broadcast to WebSocket if connected
                    if session_id in websocket_connections:
                        await broadcast_to_session(session_id, {
                            "type": "agent_response",
                            "content": result.get("content", ""),
                            "mode": request.mode,
                            "timestamp": datetime.utcnow().isoformat(),
                            "toolUsed": result.get("toolUsed"),
                            "executionResult": result.get("executionResult")
                        })
                    
                    return {
                        "success": True,
                        "sessionId": session_id,
                        "response": result
                    }
        
        # Fallback to basic response
        basic_response = f"Received message: {request.message}"
        
        # Broadcast to WebSocket if connected
        if session_id in websocket_connections:
            await broadcast_to_session(session_id, {
                "type": "agent_response", 
                "content": basic_response,
                "mode": request.mode,
                "timestamp": datetime.utcnow().isoformat()
            })
        
        return {
            "success": True,
            "sessionId": session_id,
            "response": {
                "content": basic_response,
                "mode": request.mode
            }
        }
        
    except Exception as e:
        print(f"Message processing error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process message: {str(e)}")

@app.post("/api/chat/sessions/{session_id}/mode")
async def switch_session_mode(session_id: str, request: ModeRequest):
    """Switch session mode (PLAN/ACT)"""
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = active_sessions[session_id]
    
    try:
        # If enhanced session, use enhanced API
        if session.get("api_type") == "enhanced" and session.get("enhanced_session_id"):
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{ENHANCED_CLINE_API_URL}/api/sessions/{session['enhanced_session_id']}/mode",
                    json={"mode": request.mode},
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    session["mode"] = request.mode
                    
                    # Broadcast mode change
                    if session_id in websocket_connections:
                        await broadcast_to_session(session_id, {
                            "type": "mode_switched",
                            "mode": request.mode,
                            "message": result.get("message", f"Switched to {request.mode} mode")
                        })
                    
                    return {
                        "success": True,
                        "sessionId": session_id,
                        "previousMode": session.get("mode"),
                        "currentMode": request.mode,
                        "result": result
                    }
        
        # Basic mode switch
        previous_mode = session.get("mode", "ACT")
        session["mode"] = request.mode
        
        # Broadcast mode change
        if session_id in websocket_connections:
            await broadcast_to_session(session_id, {
                "type": "mode_switched",
                "mode": request.mode,
                "message": f"Switched from {previous_mode} to {request.mode} mode"
            })
        
        return {
            "success": True,
            "sessionId": session_id,
            "previousMode": previous_mode,
            "currentMode": request.mode
        }
        
    except Exception as e:
        print(f"Mode switch error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to switch mode: {str(e)}")

# WebSocket endpoint for real-time communication
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time chat communication"""
    await websocket.accept()
    connection_id = str(uuid.uuid4())
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            message_type = message_data.get("type")
            
            if message_type == "join_session":
                session_id = message_data.get("sessionId")
                if session_id and session_id in active_sessions:
                    websocket_connections[session_id] = websocket
                    
                    await websocket.send_text(json.dumps({
                        "type": "session_joined",
                        "sessionId": session_id,
                        "connectionId": connection_id,
                        "timestamp": datetime.utcnow().isoformat()
                    }))
                    
            elif message_type == "chat_message":
                session_id = message_data.get("sessionId")
                content = message_data.get("content")
                mode = message_data.get("mode", "ACT")
                
                if session_id and session_id in active_sessions:
                    # Echo user message
                    await websocket.send_text(json.dumps({
                        "type": "user_message",
                        "content": content,
                        "mode": mode,
                        "timestamp": datetime.utcnow().isoformat()
                    }))
                    
                    # Process via HTTP endpoint (this will handle the response)
                    # You could also process directly here for better performance
                    
            elif message_type == "switch_mode":
                session_id = message_data.get("sessionId") 
                mode = message_data.get("mode")
                
                if session_id and session_id in active_sessions:
                    active_sessions[session_id]["mode"] = mode
                    
                    await websocket.send_text(json.dumps({
                        "type": "mode_switched",
                        "mode": mode,
                        "sessionId": session_id,
                        "timestamp": datetime.utcnow().isoformat()
                    }))
                    
    except WebSocketDisconnect:
        # Remove connection
        for session_id, ws in list(websocket_connections.items()):
            if ws == websocket:
                del websocket_connections[session_id]
                break
                
    except Exception as e:
        print(f"WebSocket error: {e}")
        await websocket.close()

async def broadcast_to_session(session_id: str, message: Dict[str, Any]):
    """Broadcast message to specific session WebSocket"""
    if session_id in websocket_connections:
        try:
            await websocket_connections[session_id].send_text(json.dumps(message))
        except Exception as e:
            print(f"Failed to broadcast to session {session_id}: {e}")
            # Remove dead connection
            if session_id in websocket_connections:
                del websocket_connections[session_id]

# Start Cline API services
async def start_cline_services():
    """Start the Cline API services in background"""
    import subprocess
    import os
    
    print("🔄 Cline API services will be started separately...")
    print("📝 Frontend connects to this backend (port 8001)")
    print("🤖 Cline APIs should run on ports 3002-3003 to avoid conflicts")

@app.on_event("startup")
async def startup_event():
    """Startup event to initialize services"""
    print("🔄 Initializing Cline Chat Backend...")
    
    # Start Cline API services
    await start_cline_services()
    
    print("✅ Cline Chat Backend ready")

if __name__ == "__main__":
    uvicorn.run(
        "server:app",
        host="0.0.0.0", 
        port=8001,
        reload=True,
        log_level="info"
    )