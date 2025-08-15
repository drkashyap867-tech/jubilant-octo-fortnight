#!/bin/bash

echo "🛑 Stopping Medical College Counseling Platform..."
echo "=================================================="

# Stop backend server
if [ -f "logs/backend.pid" ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo "🔧 Stopping backend server (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        sleep 2
        if kill -0 $BACKEND_PID 2>/dev/null; then
            echo "⚠️  Backend server didn't stop gracefully, force killing..."
            kill -9 $BACKEND_PID
        fi
        echo "✅ Backend server stopped"
    else
        echo "ℹ️  Backend server is not running"
    fi
    rm -f logs/backend.pid
else
    echo "ℹ️  No backend PID file found"
fi

# Stop frontend server
if [ -f "logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "🎨 Stopping frontend server (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
        sleep 2
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            echo "⚠️  Frontend server didn't stop gracefully, force killing..."
            kill -9 $FRONTEND_PID
        fi
        echo "✅ Frontend server stopped"
    else
        echo "ℹ️  Frontend server is not running"
    fi
    rm -f logs/frontend.pid
else
    echo "ℹ️  No frontend PID file found"
fi

# Kill any remaining node processes on our ports
echo "🔍 Cleaning up any remaining processes on ports 3000 and 3001..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

echo ""
echo "🎉 Platform stopped successfully!"
echo "=================================================="
echo "To restart, run: ./start_platform.sh"
