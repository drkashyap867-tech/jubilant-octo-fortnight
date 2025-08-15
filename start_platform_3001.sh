#!/bin/bash

# Medical College Counseling Platform - Port 3001 Configuration
echo "🏥 Medical College Counseling Platform"
echo "🚀 Starting on Port 3001 Configuration"
echo "=========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo ""

# Set environment variables
export PORT=3001
export NODE_ENV=development

echo "🔧 Configuration:"
echo "   Backend Port: 3001"
echo "   Frontend Port: 3001"
echo "   API Proxy: http://localhost:3001/api -> http://localhost:3001"
echo ""

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    pkill -f "node server.js" 2>/dev/null
    pkill -f "vite" 2>/dev/null
    echo "✅ All services stopped"
    exit 0
}

# Set trap for cleanup
trap cleanup SIGINT SIGTERM

# Start Backend
echo "🚀 Starting Backend Server on Port 3001..."
cd backend

# Install backend dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

# Start backend in background
echo "🌐 Backend starting on http://localhost:3001"
npm start &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Check if backend is running
if ! curl -s http://localhost:3001/api/health > /dev/null; then
    echo "❌ Backend failed to start on port 3001"
    echo "💡 Check if port 3001 is available or if there are any errors"
    cleanup
fi

echo "✅ Backend is running on port 3001"
echo ""

# Start Frontend
echo "🎨 Starting Frontend on Port 3001..."
cd ../frontend

# Install frontend dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Start frontend in background
echo "🌐 Frontend starting on http://localhost:3001"
npm run dev &
FRONTEND_PID=$!

# Wait a moment for frontend to start
sleep 5

echo ""
echo "🎉 Platform is starting up!"
echo "=========================================="
echo "🌐 Backend API: http://localhost:3001"
echo "🔗 API Health: http://localhost:3001/api/health"
echo "📊 API Stats: http://localhost:3001/api/stats"
echo "🎨 Frontend: http://localhost:3001"
echo "📱 React App with Vite"
echo ""
echo "🔍 Search API: http://localhost:3001/api/search"
echo "🏫 Colleges API: http://localhost:3001/api/colleges"
echo "📋 Dropdown API: http://localhost:3001/api/dropdown"
echo ""
echo "💡 Press Ctrl+C to stop all services"
echo ""

# Wait for user to stop
wait
