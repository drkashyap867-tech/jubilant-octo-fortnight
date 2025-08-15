#!/bin/bash

echo "🧠 Smart Development Environment - Auto-Detection & Startup"
echo "=========================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
BACKEND_PORT=3000
FRONTEND_PORT=3001
BACKEND_PID_FILE="logs/backend.pid"
FRONTEND_PID_FILE="logs/frontend.pid"
BACKEND_LOG_FILE="logs/backend.log"
FRONTEND_LOG_FILE="logs/frontend.log"

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "success") echo -e "${GREEN}✅ $message${NC}" ;;
        "error") echo -e "${RED}❌ $message${NC}" ;;
        "warning") echo -e "${YELLOW}⚠️  $message${NC}" ;;
        "info") echo -e "${BLUE}ℹ️  $message${NC}" ;;
        "header") echo -e "${PURPLE}🎯 $message${NC}" ;;
        "step") echo -e "${CYAN}🔧 $message${NC}" ;;
        "auto") echo -e "${CYAN}🤖 $message${NC}" ;;
    esac
}

# Function to check if port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to check if process is running
check_process() {
    local pid_file=$1
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            return 0
        else
            rm -f "$pid_file"
            return 1
        fi
    fi
    return 1
}

# Function to create logs directory
create_logs_dir() {
    if [ ! -d "logs" ]; then
        mkdir -p logs
        print_status "auto" "Created logs directory"
    fi
}

# Function to auto-detect what needs to be started
auto_detect_needs() {
    print_status "auto" "Auto-detecting what needs to be started..."
    
    local needs_backend=false
    local needs_frontend=false
    local needs_database=false
    local needs_dependencies=false
    
    # Check backend
    if ! check_process "$BACKEND_PID_FILE" || ! check_port $BACKEND_PORT; then
        needs_backend=true
        print_status "info" "Backend needs to be started"
    fi
    
    # Check frontend
    if ! check_process "$FRONTEND_PID_FILE" || ! check_port $FRONTEND_PORT; then
        needs_frontend=true
        print_status "info" "Frontend needs to be started"
    fi
    
    # Check database
    if [ ! -f "backend/data/cutoff_ranks_enhanced.db" ]; then
        needs_database=true
        print_status "info" "Database needs to be created"
    fi
    
    # Check dependencies
    if [ ! -d "frontend/node_modules" ] || [ ! -d "backend/node_modules" ]; then
        needs_dependencies=true
        print_status "info" "Dependencies need to be installed"
    fi
    
    echo "$needs_backend:$needs_frontend:$needs_database:$needs_dependencies"
}

# Function to auto-install dependencies
auto_install_dependencies() {
    print_status "auto" "Auto-installing dependencies..."
    
    # Frontend dependencies
    if [ ! -d "frontend/node_modules" ]; then
        print_status "step" "Installing frontend dependencies..."
        cd frontend
        npm install
        if [ $? -ne 0 ]; then
            print_status "error" "Failed to install frontend dependencies"
            return 1
        fi
        cd ..
        print_status "success" "Frontend dependencies installed"
    fi
    
    # Backend dependencies
    if [ ! -d "backend/node_modules" ]; then
        print_status "step" "Installing backend dependencies..."
        cd backend
        npm install
        if [ $? -ne 0 ]; then
            print_status "error" "Failed to install backend dependencies"
            return 1
        fi
        cd ..
        print_status "success" "Backend dependencies installed"
    fi
}

# Function to auto-setup database
auto_setup_database() {
    print_status "auto" "Auto-setting up database..."
    
    if [ ! -f "backend/data/cutoff_ranks_enhanced.db" ]; then
        print_status "step" "Creating enhanced database..."
        cd backend
        node create_enhanced_cutoff_db.js
        if [ $? -ne 0 ]; then
            print_status "error" "Failed to create enhanced database"
            return 1
        fi
        
        print_status "step" "Adding missing tables..."
        node add_missing_tables.js
        if [ $? -ne 0 ]; then
            print_status "error" "Failed to add missing tables"
            return 1
        fi
        cd ..
        print_status "success" "Database setup completed"
    fi
}

# Function to auto-start backend
auto_start_backend() {
    print_status "auto" "Auto-starting backend..."
    
    if check_process "$BACKEND_PID_FILE"; then
        print_status "warning" "Backend is already running"
        return 0
    fi
    
    if check_port $BACKEND_PORT; then
        print_status "warning" "Port $BACKEND_PORT is already in use, killing conflicting process..."
        lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null
        sleep 2
    fi
    
    cd backend
    
    # Start backend with nodemon for development
    print_status "step" "Starting backend with nodemon..."
    nohup npx nodemon server.js > "../$BACKEND_LOG_FILE" 2>&1 &
    local backend_pid=$!
    echo $backend_pid > "../$BACKEND_PID_FILE"
    
    cd ..
    
    # Wait for backend to start
    print_status "info" "Waiting for backend to start..."
    local attempts=0
    while [ $attempts -lt 30 ]; do
        if check_port $BACKEND_PORT; then
            print_status "success" "Backend started successfully (PID: $backend_pid)"
            return 0
        fi
        sleep 1
        attempts=$((attempts + 1))
    done
    
    print_status "error" "Backend failed to start within 30 seconds"
    return 1
}

# Function to auto-start frontend
auto_start_frontend() {
    print_status "auto" "Auto-starting frontend..."
    
    if check_process "$FRONTEND_PID_FILE"; then
        print_status "warning" "Frontend is already running"
        return 0
    fi
    
    if check_port $FRONTEND_PORT; then
        print_status "warning" "Port $FRONTEND_PORT is already in use, killing conflicting process..."
        lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null
        sleep 2
    fi
    
    cd frontend
    
    # Clear Vite cache for fresh start
    print_status "step" "Clearing Vite cache..."
    rm -rf node_modules/.vite
    
    # Start frontend
    print_status "step" "Starting frontend development server..."
    nohup npm run dev > "../$FRONTEND_LOG_FILE" 2>&1 &
    local frontend_pid=$!
    echo $frontend_pid > "../$FRONTEND_PID_FILE"
    
    cd ..
    
    # Wait for frontend to start
    print_status "info" "Waiting for frontend to start..."
    local attempts=0
    while [ $attempts -lt 30 ]; do
        if check_port $FRONTEND_PORT; then
            print_status "success" "Frontend started successfully (PID: $frontend_pid)"
            return 0
        fi
        sleep 1
        attempts=$((attempts + 1))
    done
    
    print_status "error" "Frontend failed to start within 30 seconds"
    return 1
}

# Function to auto-start everything
auto_start_all() {
    print_status "header" "🚀 Smart Auto-Start: Starting Everything You Need"
    echo ""
    
    create_logs_dir
    
    # Auto-detect what's needed
    local needs=$(auto_detect_needs)
    IFS=':' read -r needs_backend needs_frontend needs_database needs_dependencies <<< "$needs"
    
    echo ""
    print_status "auto" "Auto-detection results:"
    print_status "info" "  Backend needed: $needs_backend"
    print_status "info" "  Frontend needed: $needs_frontend"
    print_status "info" "  Database needed: $needs_dependencies"
    print_status "info" "  Dependencies needed: $needs_dependencies"
    echo ""
    
    # Install dependencies if needed
    if [ "$needs_dependencies" = "true" ]; then
        if ! auto_install_dependencies; then
            print_status "error" "Failed to install dependencies"
            return 1
        fi
    fi
    
    # Setup database if needed
    if [ "$needs_database" = "true" ]; then
        if ! auto_setup_database; then
            print_status "error" "Failed to setup database"
            return 1
        fi
    fi
    
    # Start backend if needed
    if [ "$needs_backend" = "true" ]; then
        if ! auto_start_backend; then
            print_status "error" "Failed to start backend"
            return 1
        fi
    fi
    
    # Start frontend if needed
    if [ "$needs_frontend" = "true" ]; then
        if ! auto_start_frontend; then
            print_status "error" "Failed to start frontend"
            return 1
        fi
    fi
    
    echo ""
    print_status "success" "🎉 Smart auto-start completed successfully!"
    echo ""
    
    # Show final status
    show_final_status
    
    return 0
}

# Function to show final status
show_final_status() {
    print_status "header" "📊 Final Status Check"
    echo ""
    
    # Backend status
    if check_process "$BACKEND_PID_FILE"; then
        local backend_pid=$(cat "$BACKEND_PID_FILE")
        print_status "success" "Backend: Running (PID: $backend_pid)"
    else
        print_status "error" "Backend: Not running"
    fi
    
    # Frontend status
    if check_process "$FRONTEND_PID_FILE"; then
        local frontend_pid=$(cat "$FRONTEND_PID_FILE")
        print_status "success" "Frontend: Running (PID: $frontend_pid)"
    else
        print_status "error" "Frontend: Not running"
    fi
    
    # Port status
    if check_port $BACKEND_PORT; then
        print_status "success" "Port $BACKEND_PORT: Backend API"
    else
        print_status "error" "Port $BACKEND_PORT: Not in use"
    fi
    
    if check_port $FRONTEND_PORT; then
        print_status "success" "Port $FRONTEND_PORT: Frontend Dev Server"
    else
        print_status "error" "Port $FRONTEND_PORT: Not in use"
    fi
    
    echo ""
    print_status "info" "🌐 Access your application:"
    print_status "info" "   Frontend: http://localhost:$FRONTEND_PORT"
    print_status "info" "   Backend API: http://localhost:$BACKEND_PORT"
    print_status "info" "   Cutoff Page: http://localhost:$FRONTEND_PORT/cutoff-ranks"
    echo ""
}

# Function to handle voice commands
handle_voice_command() {
    local command="$1"
    command=$(echo "$command" | tr '[:upper:]' '[:lower:]')
    
    case "$command" in
        *"start"*|*"go"*|*"run"*|*"fire"*|*"launch"*)
            print_status "auto" "Voice command detected: START"
            auto_start_all
            ;;
        *"status"*|*"check"*|*"how"*)
            print_status "auto" "Voice command detected: STATUS"
            show_final_status
            ;;
        *"stop"*|*"halt"*|*"end"*)
            print_status "auto" "Voice command detected: STOP"
            ./supercharged-dev.sh stop
            ;;
        *"restart"*|*"reboot"*|*"refresh"*)
            print_status "auto" "Voice command detected: RESTART"
            ./supercharged-dev.sh restart
            ;;
        *"test"*|*"check"*|*"verify"*)
            print_status "auto" "Voice command detected: TEST"
            ./supercharged-dev.sh test all
            ;;
        *"help"*|*"what"*|*"how"*)
            print_status "auto" "Voice command detected: HELP"
            show_help
            ;;
        *)
            print_status "auto" "Voice command not recognized, starting everything automatically..."
            auto_start_all
            ;;
    esac
}

# Function to show help
show_help() {
    echo ""
    print_status "header" "🎤 Voice Commands & Smart Features"
    echo ""
    echo "Just say or type these words to control your development environment:"
    echo ""
    print_status "info" "🎯 START COMMANDS (auto-start everything):"
    echo "  • 'start' or 'go' or 'run' or 'fire' or 'launch'"
    echo "  • 'start development' or 'start coding'"
    echo "  • 'fire up the dev environment'"
    echo ""
    print_status "info" "📊 STATUS COMMANDS:"
    echo "  • 'status' or 'check' or 'how is it going'"
    echo "  • 'what's running' or 'check status'"
    echo ""
    print_status "info" "🛑 STOP COMMANDS:"
    echo "  • 'stop' or 'halt' or 'end'"
    echo "  • 'stop development' or 'shut down'"
    echo ""
    print_status "info" "🔄 RESTART COMMANDS:"
    echo "  • 'restart' or 'reboot' or 'refresh'"
    echo "  • 'restart everything' or 'refresh environment'"
    echo ""
    print_status "info" "🧪 TEST COMMANDS:"
    echo "  • 'test' or 'check' or 'verify'"
    echo "  • 'run tests' or 'test everything'"
    echo ""
    print_status "info" "❓ HELP COMMANDS:"
    echo "  • 'help' or 'what can I say' or 'how does this work'"
    echo ""
    print_status "auto" "🤖 SMART FEATURES:"
    echo "  • Auto-detects what needs to be started"
    echo "  • Auto-installs missing dependencies"
    echo "  • Auto-sets up database if needed"
    echo "  • Auto-starts only what's necessary"
    echo "  • No manual intervention required"
    echo ""
    print_status "success" "💡 Just say 'start' and everything will be ready!"
    echo ""
}

# Function to run in interactive mode
interactive_mode() {
    print_status "header" "🎤 Interactive Voice Command Mode"
    echo ""
    print_status "info" "Type your command (or just press Enter to start everything):"
    echo ""
    
    while true; do
        echo -n "🎤 Command: "
        read -r user_input
        
        if [ -z "$user_input" ]; then
            print_status "auto" "No command given, starting everything automatically..."
            auto_start_all
            break
        fi
        
        handle_voice_command "$user_input"
        
        echo ""
        print_status "info" "Type another command or press Enter to exit:"
        echo ""
    done
}

# Main function
main() {
    case "${1:-auto}" in
        "start"|"go"|"run"|"fire"|"launch")
            print_status "auto" "Command detected: START"
            auto_start_all
            ;;
        "status"|"check"|"how")
            print_status "auto" "Command detected: STATUS"
            show_final_status
            ;;
        "stop"|"halt"|"end")
            print_status "auto" "Command detected: STOP"
            ./supercharged-dev.sh stop
            ;;
        "restart"|"reboot"|"refresh")
            print_status "auto" "Command detected: RESTART"
            ./supercharged-dev.sh restart
            ;;
        "test"|"verify")
            print_status "auto" "Command detected: TEST"
            ./supercharged-dev.sh test all
            ;;
        "help"|"what"|"how")
            print_status "auto" "Command detected: HELP"
            show_help
            ;;
        "interactive"|"voice"|"talk")
            interactive_mode
            ;;
        "auto"|*)
            print_status "auto" "No specific command, using smart auto-detection..."
            auto_start_all
            ;;
    esac
}

# Show welcome message
echo ""
print_status "header" "🎤 Welcome to Smart Development Environment!"
print_status "info" "Just say a few words and everything will start automatically!"
echo ""

# Check if command line arguments were provided
if [ $# -eq 0 ]; then
    print_status "auto" "No arguments provided, starting interactive mode..."
    echo ""
    print_status "info" "Available quick commands:"
    print_status "info" "  ./smart-dev-startup.sh start     - Start everything"
    print_status "info" "  ./smart-dev-startup.sh status    - Check status"
    print_status "info" "  ./smart-dev-startup.sh interactive - Voice command mode"
    print_status "info" "  ./smart-dev-startup.sh help      - Show all commands"
    echo ""
    print_status "auto" "Starting smart auto-detection mode..."
    echo ""
fi

# Run main function
main "$@"
