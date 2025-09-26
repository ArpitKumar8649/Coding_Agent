from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import json
import asyncio
from typing import List
import uvicorn

app = FastAPI(title="Cline Chat Interface Backend")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

# Pydantic models
class Message(BaseModel):
    type: str
    content: str
    timestamp: int
    mode: str = "ACT"

class ToolExecution(BaseModel):
    tool_name: str
    parameters: dict
    execution_id: str

@app.get("/")
async def root():
    return {"message": "Cline Chat Interface Backend"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Echo back for now (in real implementation, this would go to Cline agent)
            response = {
                "type": "agent_response",
                "content": f"Received: {message_data.get('content', '')}",
                "timestamp": message_data.get('timestamp'),
                "mode": message_data.get('mode', 'ACT')
            }
            
            await manager.send_personal_message(json.dumps(response), websocket)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.post("/api/message")
async def send_message(message: Message):
    # In real implementation, this would interface with Cline agent
    return {
        "success": True,
        "response": {
            "type": "assistant",
            "content": f"Echo: {message.content}",
            "timestamp": message.timestamp,
            "mode": message.mode
        }
    }

@app.post("/api/tool/execute")
async def execute_tool(tool_execution: ToolExecution):
    # Mock tool execution
    await asyncio.sleep(1)  # Simulate processing time
    
    return {
        "success": True,
        "execution_id": tool_execution.execution_id,
        "result": {
            "status": "completed",
            "output": f"Tool {tool_execution.tool_name} executed successfully",
            "timestamp": asyncio.get_event_loop().time()
        }
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)