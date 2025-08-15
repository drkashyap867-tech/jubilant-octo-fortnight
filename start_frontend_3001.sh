#!/bin/bash

# Start Frontend on Port 3001
echo "🎨 Starting Medical College Counseling Frontend on Port 3001..."

# Navigate to frontend directory
cd frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Start the development server
echo "🌐 Frontend starting on http://localhost:3001"
echo "🔗 Backend API proxy configured to http://localhost:3001"
echo "📱 React app with Vite development server"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev
