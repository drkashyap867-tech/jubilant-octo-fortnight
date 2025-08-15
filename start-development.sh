#!/bin/bash

echo "🚀 Starting Medical College Counseling Platform Development Environment"
echo "================================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${RED}❌ Port $port is already in use${NC}"
        echo -e "${YELLOW}Killing process on port $port...${NC}"
        lsof -ti:$port | xargs kill -9
        sleep 2
    fi
}

# Function to check if process is running
check_process() {
    local process_name=$1
    if pgrep -f "$process_name" > /dev/null; then
        echo -e "${YELLOW}⚠️  $process_name is already running${NC}"
        return 0
    else
        return 1
    fi
}

# Function to start backend
start_backend() {
    echo -e "${BLUE}🔧 Starting Backend Server...${NC}"
    cd backend
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
        npm install
    fi
    
    # Check if enhanced database exists
    if [ ! -f "data/cutoff_ranks_enhanced.db" ]; then
        echo -e "${YELLOW}🗄️  Creating enhanced database...${NC}"
        node create_enhanced_cutoff_db.js
        node add_missing_tables.js
    fi
    
    # Start backend
    echo -e "${GREEN}✅ Starting backend on port 3000...${NC}"
    nohup node server.js > ../logs/backend.log 2>&1 &
    echo $! > ../logs/backend.pid
    
    cd ..
    sleep 3
    
    # Verify backend is running
    if curl -s http://localhost:3000/api/cutoff/counselling-types > /dev/null; then
        echo -e "${GREEN}✅ Backend is running successfully!${NC}"
    else
        echo -e "${RED}❌ Backend failed to start${NC}"
        exit 1
    fi
}

# Function to start frontend
start_frontend() {
    echo -e "${BLUE}🎨 Starting Frontend Development Server...${NC}"
    cd frontend
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
        npm install
    fi
    
    # Clear Vite cache to prevent optimization issues
    if [ -d "node_modules/.vite" ]; then
        echo -e "${YELLOW}🧹 Clearing Vite cache...${NC}"
        rm -rf node_modules/.vite
    fi
    
    # Start frontend
    echo -e "${GREEN}✅ Starting frontend on port 3001...${NC}"
    nohup npm run dev > ../logs/frontend.log 2>&1 &
    echo $! > ../logs/frontend.pid
    
    cd ..
    sleep 5
    
    # Verify frontend is running
    if curl -s http://localhost:3001 > /dev/null; then
        echo -e "${GREEN}✅ Frontend is running successfully!${NC}"
    else
        echo -e "${RED}❌ Frontend failed to start${NC}"
        exit 1
    fi
}

# Function to create logs directory
create_logs_dir() {
    if [ ! -d "logs" ]; then
        mkdir -p logs
        echo -e "${BLUE}📁 Created logs directory${NC}"
    fi
}

# Function to show status
show_status() {
    echo -e "\n${BLUE}📊 Development Environment Status:${NC}"
    echo "=================================="
    
    # Backend status
    if [ -f "logs/backend.pid" ] && ps -p $(cat logs/backend.pid) > /dev/null; then
        echo -e "${GREEN}✅ Backend: Running (PID: $(cat logs/backend.pid))${NC}"
    else
        echo -e "${RED}❌ Backend: Not running${NC}"
    fi
    
    # Frontend status
    if [ -f "logs/frontend.pid" ] && ps -p $(cat logs/frontend.pid) > /dev/null; then
        echo -e "${GREEN}✅ Frontend: Running (PID: $(cat logs/frontend.pid))${NC}"
    else
        echo -e "${RED}❌ Frontend: Not running${NC}"
    fi
    
    # Port status
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null; then
        echo -e "${GREEN}✅ Port 3000: Backend API${NC}"
    else
        echo -e "${RED}❌ Port 3000: Not listening${NC}"
    fi
    
    if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null; then
        echo -e "${GREEN}✅ Port 3001: Frontend Dev Server${NC}"
    else
        echo -e "${RED}❌ Port 3001: Not listening${NC}"
    fi
}

# Function to stop all services
stop_services() {
    echo -e "${YELLOW}🛑 Stopping all services...${NC}"
    
    if [ -f "logs/backend.pid" ]; then
        kill $(cat logs/backend.pid) 2>/dev/null || true
        rm -f logs/backend.pid
    fi
    
    if [ -f "logs/frontend.pid" ]; then
        kill $(cat logs/frontend.pid) 2>/dev/null || true
        rm -f logs/frontend.pid
    fi
    
    # Kill any remaining processes
    pkill -f "node server.js" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    
    echo -e "${GREEN}✅ All services stopped${NC}"
}

# Main execution
main() {
    case "${1:-start}" in
        "start")
            echo -e "${BLUE}🚀 Starting development environment...${NC}"
            create_logs_dir
            check_port 3000
            check_port 3001
            start_backend
            start_frontend
            show_status
            echo -e "\n${GREEN}🎉 Development environment is ready!${NC}"
            echo -e "${BLUE}📱 Frontend: http://localhost:3001${NC}"
            echo -e "${BLUE}🔧 Backend API: http://localhost:3000${NC}"
            echo -e "${YELLOW}💡 Use './start-development.sh stop' to stop all services${NC}"
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            echo -e "${BLUE}🔄 Restarting development environment...${NC}"
            stop_services
            sleep 2
            main start
            ;;
        "status")
            show_status
            ;;
        "logs")
            echo -e "${BLUE}📋 Recent logs:${NC}"
            echo "Backend logs:"
            tail -n 20 logs/backend.log 2>/dev/null || echo "No backend logs found"
            echo -e "\nFrontend logs:"
            tail -n 20 logs/frontend.log 2>/dev/null || echo "No frontend logs found"
            ;;
        *)
            echo -e "${YELLOW}Usage: $0 {start|stop|restart|status|logs}${NC}"
            echo -e "${BLUE}Commands:${NC}"
            echo "  start   - Start development environment"
            echo "  stop    - Stop all services"
            echo "  restart - Restart all services"
            echo "  status  - Show current status"
            echo "  logs    - Show recent logs"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
