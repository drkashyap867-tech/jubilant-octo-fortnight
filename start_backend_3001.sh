#!/bin/bash

# Start Backend Server on Port 3001
echo "🚀 Starting Medical College Counseling Backend on Port 3001..."

# Set environment variable for port
export PORT=3001

# Navigate to backend directory
cd backend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

# Start the server
echo "🌐 Backend server starting on http://localhost:3001"
echo "📡 API endpoints available at http://localhost:3001/api"
echo "🔍 Health check: http://localhost:3001/api/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm start
