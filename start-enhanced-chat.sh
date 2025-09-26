#!/bin/bash

# Enhanced Cline Chat Interface Startup Script
# This script starts both the Cline API service and the enhanced React frontend

echo "🚀 Starting Enhanced Cline Chat Interface..."
echo "================================================"

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port)
    if [ ! -z "$pid" ]; then
        echo "🔪 Killing process on port $port (PID: $pid)"
        kill -9 $pid
        sleep 2
    fi
}

# Check if required directories exist
if [ ! -d "/app/cline-api" ]; then
    echo "❌ Error: /app/cline-api directory not found"
    echo "Please ensure you're running this from the correct location"
    exit 1
fi

if [ ! -d "/app/frontend" ]; then
    echo "❌ Error: /app/frontend directory not found"
    echo "Please ensure you're running this from the correct location"
    exit 1
fi

# Clean up any existing processes
echo "🧹 Cleaning up existing processes..."
kill_port 3000
kill_port 3001

# Install dependencies if needed
echo "📦 Checking dependencies..."

# Check Cline API dependencies
if [ ! -d "/app/cline-api/node_modules" ]; then
    echo "📦 Installing Cline API dependencies..."
    cd /app/cline-api
    npm install
fi

# Check Frontend dependencies
if [ ! -d "/app/frontend/node_modules" ]; then
    echo "📦 Installing Frontend dependencies..."
    cd /app/frontend
    npm install
fi

# Create logs directory
mkdir -p /app/logs

echo "🔧 Starting services..."

# Start Cline API Service (port 3000)
echo "🤖 Starting Cline API Service on port 3000..."
cd /app/cline-api
nohup npm start > /app/logs/cline-api.log 2>&1 &
CLINE_API_PID=$!
echo "   └─ PID: $CLINE_API_PID"

# Wait for Cline API to start
echo "⏳ Waiting for Cline API to start..."
for i in {1..30}; do
    if check_port 3000; then
        echo "✅ Cline API is running on port 3000"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Timeout waiting for Cline API to start"
        echo "   Check logs: tail -f /app/logs/cline-api.log"
        exit 1
    fi
    sleep 1
done

# Start Enhanced Frontend (port 3001)
echo "🎨 Starting Enhanced Frontend on port 3001..."
cd /app/frontend
BROWSER=none PORT=3001 nohup npm start > /app/logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   └─ PID: $FRONTEND_PID"

# Wait for Frontend to start
echo "⏳ Waiting for Frontend to start..."
for i in {1..60}; do
    if check_port 3001; then
        echo "✅ Frontend is running on port 3001"
        break
    fi
    if [ $i -eq 60 ]; then
        echo "❌ Timeout waiting for Frontend to start"
        echo "   Check logs: tail -f /app/logs/frontend.log"
        exit 1
    fi
    sleep 1
done

echo ""
echo "🎉 Enhanced Cline Chat Interface is now running!"
echo "================================================"
echo "📱 Frontend:    http://localhost:3001"
echo "🤖 Cline API:   http://localhost:3000"
echo "📊 API Health:  http://localhost:3000/health" 
echo "📋 Agent API:   http://localhost:3000/api/agent/health"
echo ""
echo "📋 Process Information:"
echo "   Cline API PID:  $CLINE_API_PID"
echo "   Frontend PID:   $FRONTEND_PID"
echo ""
echo "📜 View Logs:"
echo "   Cline API:  tail -f /app/logs/cline-api.log"
echo "   Frontend:   tail -f /app/logs/frontend.log"
echo ""
echo "🛑 To stop services:"
echo "   kill $CLINE_API_PID $FRONTEND_PID"
echo "   or"
echo "   ./stop-enhanced-chat.sh"
echo ""

# Create stop script
cat > /app/stop-enhanced-chat.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping Enhanced Cline Chat Interface..."

# Kill processes
if [ ! -z "$1" ] && [ ! -z "$2" ]; then
    echo "🔪 Killing Cline API (PID: $1)"
    kill -9 $1 2>/dev/null
    echo "🔪 Killing Frontend (PID: $2)"
    kill -9 $2 2>/dev/null
else
    # Find and kill by port
    CLINE_PID=$(lsof -ti:3000)
    FRONTEND_PID=$(lsof -ti:3001)
    
    if [ ! -z "$CLINE_PID" ]; then
        echo "🔪 Killing Cline API (PID: $CLINE_PID)"
        kill -9 $CLINE_PID
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        echo "🔪 Killing Frontend (PID: $FRONTEND_PID)"
        kill -9 $FRONTEND_PID
    fi
fi

echo "✅ Services stopped"
EOF

chmod +x /app/stop-enhanced-chat.sh

# Save PIDs for stop script
echo "CLINE_API_PID=$CLINE_API_PID" > /app/.pids
echo "FRONTEND_PID=$FRONTEND_PID" >> /app/.pids

# Wait for user input or run indefinitely
echo "💡 Press Ctrl+C to stop all services or close this terminal"
echo "   The services will continue running in the background"
echo ""

# Open browser automatically (optional)
if command -v xdg-open > /dev/null; then
    echo "🌐 Opening browser..."
    xdg-open http://localhost:3001
elif command -v open > /dev/null; then
    echo "🌐 Opening browser..."
    open http://localhost:3001
fi

# Trap Ctrl+C to stop services
trap 'echo -e "\n🛑 Stopping services..."; ./stop-enhanced-chat.sh $CLINE_API_PID $FRONTEND_PID; exit 0' INT

# Keep script running
while true; do
    # Check if services are still running
    if ! kill -0 $CLINE_API_PID 2>/dev/null; then
        echo "❌ Cline API service has stopped"
        break
    fi
    
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "❌ Frontend service has stopped"
        break
    fi
    
    sleep 5
done

echo "🏁 One or more services have stopped. Exiting..."
./stop-enhanced-chat.sh $CLINE_API_PID $FRONTEND_PID