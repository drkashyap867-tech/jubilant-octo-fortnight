#!/bin/bash

echo "🚀 Starting Medical College Counseling Platform..."
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "❌ Port $1 is already in use"
        return 1
    else
        echo "✅ Port $1 is available"
        return 0
    fi
}

# Check ports
echo ""
echo "🔍 Checking port availability..."
check_port 3000 || exit 1
check_port 3001 || exit 1

# Install backend dependencies if needed
echo ""
echo "📦 Installing backend dependencies..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "✅ Backend dependencies already installed"
fi

# Install frontend dependencies if needed
echo ""
echo "📦 Installing frontend dependencies..."
cd ../frontend
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "✅ Frontend dependencies already installed"
fi

# Start backend server
echo ""
echo "🔧 Starting backend server on port 3000..."
cd ../backend
nohup node src/server.js > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ Backend server started with PID: $BACKEND_PID"

# Wait a moment for backend to start
sleep 3

# Check if backend is running
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ Backend server is responding"
else
    echo "❌ Backend server failed to start"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Start frontend server
echo ""
echo "🎨 Starting frontend server on port 3001..."
cd ../frontend
nohup npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ Frontend server started with PID: $FRONTEND_PID"

# Wait for frontend to start
sleep 5

# Check if frontend is running
if curl -s http://localhost:3001 > /dev/null; then
    echo "✅ Frontend server is responding"
else
    echo "❌ Frontend server failed to start"
    kill $FRONTEND_PID 2>/dev/null
    exit 1
fi

# Save PIDs for later use
echo $BACKEND_PID > ../logs/backend.pid
echo $FRONTEND_PID > ../logs/frontend.pid

echo ""
echo "🎉 Platform started successfully!"
echo "=================================================="
echo "🌐 Backend API: http://localhost:3000"
echo "🎨 Frontend App: http://localhost:3001"
echo "📊 Health Check: http://localhost:3000/health"
echo ""
echo "📝 Logs:"
echo "   Backend:  logs/backend.log"
echo "   Frontend: logs/frontend.log"
echo ""
echo "🛑 To stop the platform, run: ./stop_platform.sh"
echo ""

# Keep script running and show logs
echo "📋 Live logs (Ctrl+C to stop):"
echo "=================================================="
tail -f ../logs/backend.log ../logs/frontend.log
