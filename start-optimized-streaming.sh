#!/bin/bash
echo "🚀 Starting Optimized Streaming Setup"

# Set environment variables
export NODE_ENV=development
export API_KEY=development-key
export ENABLE_STREAMING=true
export ENABLE_VALIDATION=true
export ENABLE_GIT=true
export QUALITY_LEVEL=advanced
export LLM_PROVIDER=openai
export PORT=3000

# Kill any existing processes
echo "🔄 Stopping existing processes..."
pkill -f "node.*server.js" || true
pkill -f "node.*start" || true
pkill -f "yarn.*start" || true

# Start the backend with optimized streaming
echo "🖥️ Starting optimized Cline API server on port 3000..."
cd /app/cline-api
node src/server.js &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to initialize..."
sleep 5

# Test backend health
echo "🔍 Testing backend health..."
HEALTH_CHECK=$(curl -s http://localhost:3000/health || echo "failed")
if [[ $HEALTH_CHECK == *"ok"* ]]; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

# Start the frontend
echo "🌐 Starting optimized frontend..."
cd /app/frontend

# Set frontend environment variables
export REACT_APP_CLINE_API_URL=http://localhost:3000
export REACT_APP_CLINE_WS_URL=ws://localhost:3000/ws
export REACT_APP_CLINE_API_KEY=development-key

yarn start &
FRONTEND_PID=$!

echo "
🎉 Optimized Streaming Setup Started!

🔗 Services:
  • Backend API: http://localhost:3000
  • WebSocket: ws://localhost:3000/ws
  • Frontend: http://localhost:3001 (will open automatically)
  • Health Check: http://localhost:3000/health

⚡ Features Enabled:
  • Optimized WebSocket streaming
  • File transfer support
  • Real-time collaboration
  • Compression & batching
  • Advanced error recovery
  • Performance monitoring

📊 Debug Panel: Available in development mode (bottom-left)

🛑 To stop: Ctrl+C or run: pkill -f 'node.*server.js'
"

# Keep script running
wait