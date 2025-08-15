#!/bin/bash

echo "🚀 SUPERCHARGED Development Environment for Medical College Counseling Platform"
echo "============================================================================="

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
        print_status "info" "Created logs directory"
    fi
}

# Function to start backend
start_backend() {
    print_status "step" "Starting Backend Server..."
    
    if check_process "$BACKEND_PID_FILE"; then
        print_status "warning" "Backend is already running"
        return 0
    fi
    
    if check_port $BACKEND_PORT; then
        print_status "error" "Port $BACKEND_PORT is already in use"
        print_status "info" "Killing process on port $BACKEND_PORT..."
        lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null
        sleep 2
    fi
    
    cd backend
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        print_status "info" "Installing backend dependencies..."
        npm install
        if [ $? -ne 0 ]; then
            print_status "error" "Failed to install backend dependencies"
            return 1
        fi
    fi
    
    # Check if enhanced database exists
    if [ ! -f "data/cutoff_ranks_enhanced.db" ]; then
        print_status "info" "Creating enhanced database..."
        node create_enhanced_cutoff_db.js
        if [ $? -ne 0 ]; then
            print_status "error" "Failed to create enhanced database"
            return 1
        fi
        
        print_status "info" "Adding missing tables..."
        node add_missing_tables.js
        if [ $? -ne 0 ]; then
            print_status "error" "Failed to add missing tables"
            return 1
        fi
    fi
    
    # Start backend with nodemon for development
    print_status "info" "Starting backend with nodemon..."
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

# Function to start frontend
start_frontend() {
    print_status "step" "Starting Frontend Development Server..."
    
    if check_process "$FRONTEND_PID_FILE"; then
        print_status "warning" "Frontend is already running"
        return 0
    fi
    
    if check_port $FRONTEND_PORT; then
        print_status "error" "Port $FRONTEND_PORT is already in use"
        print_status "info" "Killing process on port $FRONTEND_PORT..."
        lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null
        sleep 2
    fi
    
    cd frontend
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        print_status "info" "Installing frontend dependencies..."
        npm install
        if [ $? -ne 0 ]; then
            print_status "error" "Failed to install frontend dependencies"
            return 1
        fi
    fi
    
    # Clear Vite cache for fresh start
    print_status "info" "Clearing Vite cache..."
    rm -rf node_modules/.vite
    
    # Start frontend with enhanced development mode
    print_status "info" "Starting frontend with enhanced development mode..."
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

# Function to stop services
stop_services() {
    print_status "step" "Stopping Development Services..."
    
    # Stop backend
    if [ -f "$BACKEND_PID_FILE" ]; then
        local backend_pid=$(cat "$BACKEND_PID_FILE")
        if ps -p $backend_pid > /dev/null 2>&1; then
            print_status "info" "Stopping backend (PID: $backend_pid)..."
            kill $backend_pid
            rm -f "$BACKEND_PID_FILE"
        fi
    fi
    
    # Stop frontend
    if [ -f "$FRONTEND_PID_FILE" ]; then
        local frontend_pid=$(cat "$FRONTEND_PID_FILE")
        if ps -p $frontend_pid > /dev/null 2>&1; then
            print_status "info" "Stopping frontend (PID: $frontend_pid)..."
            kill $frontend_pid
            rm -f "$FRONTEND_PID_FILE"
        fi
    fi
    
    # Kill any remaining processes on our ports
    lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null
    lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null
    
    print_status "success" "All services stopped"
}

# Function to show status
show_status() {
    print_status "header" "Development Environment Status"
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
}

# Function to show logs
show_logs() {
    local service=${1:-"all"}
    
    case $service in
        "backend"|"b")
            if [ -f "$BACKEND_LOG_FILE" ]; then
                print_status "info" "Showing backend logs (Ctrl+C to exit):"
                tail -f "$BACKEND_LOG_FILE"
            else
                print_status "error" "Backend log file not found"
            fi
            ;;
        "frontend"|"f")
            if [ -f "$FRONTEND_LOG_FILE" ]; then
                print_status "info" "Showing frontend logs (Ctrl+C to exit):"
                tail -f "$FRONTEND_LOG_FILE"
            else
                print_status "error" "Frontend log file not found"
            fi
            ;;
        "all"|*)
            print_status "info" "Showing all logs (Ctrl+C to exit):"
            if [ -f "$BACKEND_LOG_FILE" ] && [ -f "$FRONTEND_LOG_FILE" ]; then
                tail -f "$BACKEND_LOG_FILE" "$FRONTEND_LOG_FILE"
            else
                print_status "error" "Log files not found"
            fi
            ;;
    esac
}

# Function to run tests
run_tests() {
    local type=${1:-"all"}
    
    case $type in
        "frontend"|"f")
            print_status "step" "Running Frontend Tests..."
            cd frontend
            npm run test:coverage
            cd ..
            ;;
        "backend"|"b")
            print_status "step" "Running Backend Tests..."
            cd backend
            npm test
            cd ..
            ;;
        "all"|*)
            print_status "step" "Running All Tests..."
            cd frontend
            npm run test:coverage
            cd ..
            cd backend
            npm test
            cd ..
            ;;
    esac
}

# Function to run linting and formatting
run_quality_checks() {
    local type=${1:-"all"}
    
    case $type in
        "frontend"|"f")
            print_status "step" "Running Frontend Quality Checks..."
            cd frontend
            print_status "info" "Running ESLint..."
            npm run lint
            print_status "info" "Running Prettier..."
            npm run format:check
            cd ..
            ;;
        "backend"|"b")
            print_status "step" "Running Backend Quality Checks..."
            cd backend
            print_status "info" "Running ESLint..."
            npm run lint
            cd ..
            ;;
        "all"|*)
            print_status "step" "Running All Quality Checks..."
            cd frontend
            print_status "info" "Running Frontend ESLint..."
            npm run lint
            print_status "info" "Running Frontend Prettier..."
            npm run format:check
            cd ..
            cd backend
            print_status "info" "Running Backend ESLint..."
            npm run lint
            cd ..
            ;;
    esac
}

# Function to install advanced extensions
install_extensions() {
    print_status "step" "Installing Advanced Development Extensions..."
    
    if [ -f "install-advanced-extensions.sh" ]; then
        chmod +x install-advanced-extensions.sh
        ./install-advanced-extensions.sh
    else
        print_status "error" "Advanced extensions script not found"
        return 1
    fi
}

# Function to show help
show_help() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  start                    Start both backend and frontend services"
    echo "  stop                     Stop all services"
    echo "  restart                  Restart all services"
    echo "  status                   Show status of all services"
    echo "  logs [service]           Show logs (backend|frontend|all)"
    echo "  test [type]              Run tests (frontend|backend|all)"
    echo "  quality [type]           Run quality checks (frontend|backend|all)"
    echo "  extensions               Install advanced development extensions"
    echo "  help                     Show this help message"
    echo ""
    echo "Options:"
    echo "  -p, --port PORT         Specify custom port for backend"
    echo "  -f, --frontend-port PORT Specify custom port for frontend"
    echo ""
    echo "Examples:"
    echo "  $0 start                 # Start all services"
    echo "  $0 logs frontend         # Show frontend logs"
    echo "  $0 test frontend         # Run frontend tests"
    echo "  $0 quality all           # Run all quality checks"
}

# Main function
main() {
    create_logs_dir
    
    case "${1:-start}" in
        "start")
            print_status "header" "Starting Supercharged Development Environment"
            echo ""
            
            if start_backend && start_frontend; then
                echo ""
                print_status "success" "🎉 Development environment started successfully!"
                echo ""
                show_status
                echo ""
                print_status "info" "🌐 Access your application:"
                print_status "info" "   Frontend: http://localhost:$FRONTEND_PORT"
                print_status "info" "   Backend API: http://localhost:$BACKEND_PORT"
                print_status "info" "   Cutoff Page: http://localhost:$FRONTEND_PORT/cutoff-ranks"
                echo ""
                print_status "info" "📋 Available commands:"
                print_status "info" "   $0 status    - Check service status"
                print_status "info" "   $0 logs      - View logs"
                print_status "info" "   $0 test      - Run tests"
                print_status "info" "   $0 quality   - Run quality checks"
                print_status "info" "   $0 stop      - Stop services"
            else
                print_status "error" "Failed to start development environment"
                exit 1
            fi
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            print_status "header" "Restarting Development Environment"
            stop_services
            sleep 2
            main start
            ;;
        "status")
            show_status
            ;;
        "logs")
            show_logs "$2"
            ;;
        "test")
            run_tests "$2"
            ;;
        "quality")
            run_quality_checks "$2"
            ;;
        "extensions")
            install_extensions
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            print_status "error" "Unknown command: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--port)
            BACKEND_PORT="$2"
            shift 2
            ;;
        -f|--frontend-port)
            FRONTEND_PORT="$2"
            shift 2
            ;;
        *)
            break
            ;;
    esac
done

# Run main function
main "$@"
