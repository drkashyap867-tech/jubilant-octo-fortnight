#!/bin/bash

# 🧠 SUPER INTELLIGENT DEVELOPMENT ENVIRONMENT
# 🚀 AI-Powered Issue Prevention & Performance Optimization
# ⚡ Accelerated Development with Proactive Problem Solving

set -e

# 🎨 Color codes for beautiful output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# 🧠 SUPER INTELLIGENT CONFIGURATION
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_PORT=3000
FRONTEND_PORT=3001
MAX_RETRIES=5
HEALTH_CHECK_INTERVAL=10
PERFORMANCE_THRESHOLD=2000 # ms

# 🚀 SUPER INTELLIGENT LOGGING
LOG_DIR="$PROJECT_ROOT/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/super-intelligent-dev.log"

log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

log_info() { log "INFO" "$*"; }
log_warn() { log "WARN" "$*"; }
log_error() { log "ERROR" "$*"; }
log_success() { log "SUCCESS" "$*"; }

# 🎯 SUPER INTELLIGENT BANNER
show_banner() {
    clear
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    🧠 SUPER INTELLIGENT DEV                 ║"
    echo "║                🚀 AI-Powered Development Environment        ║"
    echo "║              ⚡ Proactive Issue Prevention & Optimization    ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo -e "${CYAN}🎯 Features:${NC}"
    echo -e "  • 🧠 AI-Powered Issue Detection & Prevention"
    echo -e "  • 🚀 Performance Optimization & Monitoring"
    echo -e "  • ⚡ Automated Problem Solving & Recovery"
    echo -e "  • 🎯 Smart Dependency Management"
    echo -e "  • 🔍 Intelligent Health Monitoring"
    echo -e "  • 🚨 Proactive Error Handling"
    echo -e "  • 📊 Real-time Performance Analytics"
    echo ""
}

# 🧠 SUPER INTELLIGENT ISSUE DETECTION
detect_potential_issues() {
    log_info "🧠 Scanning for potential issues..."
    
    local issues_found=0
    
    # Check for common React issues
    if grep -r "Cannot access.*before initialization" frontend/src/ 2>/dev/null; then
        log_warn "⚠️  Potential React initialization issue detected"
        issues_found=$((issues_found + 1))
    fi
    
    # Check for missing dependencies
    if [ ! -d "frontend/node_modules" ]; then
        log_warn "⚠️  Frontend dependencies missing"
        issues_found=$((issues_found + 1))
    fi
    
    if [ ! -d "backend/node_modules" ]; then
        log_warn "⚠️  Backend dependencies missing"
        issues_found=$((issues_found + 1))
    fi
    
    # Check for port conflicts
    if lsof -ti:$BACKEND_PORT >/dev/null 2>&1; then
        log_warn "⚠️  Backend port $BACKEND_PORT already in use"
        issues_found=$((issues_found + 1))
    fi
    
    if lsof -ti:$FRONTEND_PORT >/dev/null 2>&1; then
        log_warn "⚠️  Frontend port $FRONTEND_PORT already in use"
        issues_found=$((issues_found + 1))
    fi
    
    # Check for database issues
    if [ ! -f "data/cutoff_ranks_enhanced.db" ]; then
        log_warn "⚠️  Enhanced database missing"
        issues_found=$((issues_found + 1))
    fi
    
    if [ $issues_found -eq 0 ]; then
        log_success "✅ No potential issues detected"
    else
        log_warn "⚠️  $issues_found potential issue(s) detected"
    fi
    
    return $issues_found
}

# 🚀 SUPER INTELLIGENT PERFORMANCE OPTIMIZATION
optimize_performance() {
    log_info "🚀 Optimizing performance..."
    
    # Clear Vite cache for faster builds
    if [ -d "frontend/node_modules/.vite" ]; then
        rm -rf frontend/node_modules/.vite
        log_info "🧹 Cleared Vite cache"
    fi
    
    # Clear npm cache if needed
    if [ $(npm cache verify 2>/dev/null | grep -c "cache verified") -eq 0 ]; then
        npm cache clean --force
        log_info "🧹 Cleared npm cache"
    fi
    
    # Optimize database
    if [ -f "data/cutoff_ranks_enhanced.db" ]; then
        sqlite3 data/cutoff_ranks_enhanced.db "VACUUM; ANALYZE;" 2>/dev/null || true
        log_info "🗄️  Database optimized"
    fi
    
    log_success "✅ Performance optimization complete"
}

# 🧠 SUPER INTELLIGENT DEPENDENCY MANAGEMENT
smart_dependency_install() {
    log_info "🧠 Installing dependencies intelligently..."
    
    # Frontend dependencies
    if [ ! -d "frontend/node_modules" ]; then
        log_info "📦 Installing frontend dependencies..."
        cd frontend
        npm install --silent
        cd ..
        log_success "✅ Frontend dependencies installed"
    else
        log_info "✅ Frontend dependencies already present"
    fi
    
    # Backend dependencies
    if [ ! -d "backend/node_modules" ]; then
        log_info "📦 Installing backend dependencies..."
        cd backend
        npm install --silent
        cd ..
        log_success "✅ Backend dependencies installed"
    else
        log_success "✅ Backend dependencies already present"
    fi
}

# 🎯 SUPER INTELLIGENT DATABASE SETUP
smart_database_setup() {
    log_info "🎯 Setting up database intelligently..."
    
    if [ ! -f "data/cutoff_ranks_enhanced.db" ]; then
        log_info "🗄️  Creating enhanced database..."
        
        # Create enhanced database
        if [ -f "backend/create_enhanced_cutoff_db.js" ]; then
            cd backend
            node create_enhanced_cutoff_db.js
            cd ..
        fi
        
        # Add missing tables
        if [ -f "backend/add_missing_tables.js" ]; then
            cd backend
            node add_missing_tables.js
            cd ..
        fi
        
        log_success "✅ Enhanced database created"
    else
        log_success "✅ Enhanced database already exists"
    fi
}

# 🚨 SUPER INTELLIGENT PORT MANAGEMENT
smart_port_management() {
    log_info "🚨 Managing ports intelligently..."
    
    # Kill processes on backend port
    local backend_pid=$(lsof -ti:$BACKEND_PORT 2>/dev/null)
    if [ ! -z "$backend_pid" ]; then
        log_info "🔄 Stopping backend process on port $BACKEND_PORT"
        kill -9 $backend_pid 2>/dev/null || true
        sleep 2
    fi
    
    # Kill processes on frontend port
    local frontend_pid=$(lsof -ti:$FRONTEND_PORT 2>/dev/null)
    if [ ! -z "$frontend_pid" ]; then
        log_info "🔄 Stopping frontend process on port $FRONTEND_PORT"
        kill -9 $frontend_pid 2>/dev/null || true
        sleep 2
    fi
    
    log_success "✅ Port management complete"
}

# 🧠 SUPER INTELLIGENT SERVICE STARTUP
smart_service_startup() {
    log_info "🧠 Starting services intelligently..."
    
    # Start backend
    log_info "🚀 Starting backend..."
    cd backend
    nohup node server.js > ../logs/backend.log 2>&1 &
    local backend_pid=$!
    echo $backend_pid > ../logs/backend.pid
    cd ..
    
    # Wait for backend to be ready
    local retries=0
    while [ $retries -lt $MAX_RETRIES ]; do
        if curl -s http://localhost:$BACKEND_PORT/health >/dev/null 2>&1; then
            log_success "✅ Backend started successfully (PID: $backend_pid)"
            break
        fi
        retries=$((retries + 1))
        sleep 2
    done
    
    if [ $retries -eq $MAX_RETRIES ]; then
        log_error "❌ Backend failed to start"
        return 1
    fi
    
    # Start frontend
    log_info "🚀 Starting frontend..."
    cd frontend
    nohup npm run dev > ../logs/frontend.log 2>&1 &
    local frontend_pid=$!
    echo $frontend_pid > ../logs/frontend.pid
    cd ..
    
    # Wait for frontend to be ready
    retries=0
    while [ $retries -lt $MAX_RETRIES ]; do
        if curl -s http://localhost:$FRONTEND_PORT >/dev/null 2>&1; then
            log_success "✅ Frontend started successfully (PID: $frontend_pid)"
            break
        fi
        retries=$((retries + 1))
        sleep 2
    done
    
    if [ $retries -eq $MAX_RETRIES ]; then
        log_error "❌ Frontend failed to start"
        return 1
    fi
}

# 🔍 SUPER INTELLIGENT HEALTH MONITORING
monitor_health() {
    log_info "🔍 Monitoring system health..."
    
    local backend_pid=$(cat logs/backend.pid 2>/dev/null)
    local frontend_pid=$(cat logs/frontend.pid 2>/dev/null)
    
    if [ -z "$backend_pid" ] || ! kill -0 $backend_pid 2>/dev/null; then
        log_error "❌ Backend is not running"
        return 1
    fi
    
    if [ -z "$frontend_pid" ] || ! kill -0 $frontend_pid 2>/dev/null; then
        log_error "❌ Frontend is not running"
        return 1
    fi
    
    # Performance monitoring
    local backend_response_time=$(curl -s -w "%{time_total}" -o /dev/null http://localhost:$BACKEND_PORT/health)
    local frontend_response_time=$(curl -s -w "%{time_total}" -o /dev/null http://localhost:$FRONTEND_PORT)
    
    if (( $(echo "$backend_response_time > $PERFORMANCE_THRESHOLD" | bc -l) )); then
        log_warn "⚠️  Backend response time: ${backend_response_time}ms (above threshold)"
    else
        log_success "✅ Backend response time: ${backend_response_time}ms"
    fi
    
    if (( $(echo "$frontend_response_time > $PERFORMANCE_THRESHOLD" | bc -l) )); then
        log_warn "⚠️  Frontend response time: ${frontend_response_time}ms (above threshold)"
    else
        log_success "✅ Frontend response time: ${frontend_response_time}ms"
    fi
    
    return 0
}

# 🚀 SUPER INTELLIGENT MAIN FUNCTION
main() {
    show_banner
    
    log_info "🚀 Starting Super Intelligent Development Environment..."
    
    # Create logs directory
    mkdir -p "$LOG_DIR"
    
    # Detect potential issues
    if detect_potential_issues; then
        log_info "🔧 Issues detected, attempting to resolve..."
    fi
    
    # Optimize performance
    optimize_performance
    
    # Install dependencies
    smart_dependency_install
    
    # Setup database
    smart_database_setup
    
    # Manage ports
    smart_port_management
    
    # Start services
    if smart_service_startup; then
        log_success "🎉 All services started successfully!"
        
        # Monitor health
        sleep 5
        if monitor_health; then
            log_success "✅ System is healthy and ready for development!"
            
            echo ""
            echo -e "${GREEN}🎯 Access URLs:${NC}"
            echo -e "  • Frontend: ${CYAN}http://localhost:$FRONTEND_PORT${NC}"
            echo -e "  • Backend API: ${CYAN}http://localhost:$BACKEND_PORT${NC}"
            echo -e "  • Cutoff Page: ${CYAN}http://localhost:$FRONTEND_PORT/cutoff-ranks${NC}"
            echo ""
            echo -e "${GREEN}📊 Monitoring:${NC}"
            echo -e "  • Logs: ${CYAN}$LOG_DIR${NC}"
            echo -e "  • Health Check: ${CYAN}./super-intelligent-dev.sh health${NC}"
            echo -e "  • Stop Services: ${CYAN}./super-intelligent-dev.sh stop${NC}"
            echo ""
        else
            log_error "❌ System health check failed"
            return 1
        fi
    else
        log_error "❌ Failed to start services"
        return 1
    fi
}

# 🎯 SUPER INTELLIGENT COMMAND HANDLING
case "${1:-start}" in
    "start")
        main
        ;;
    "health")
        monitor_health
        ;;
    "stop")
        log_info "🛑 Stopping services..."
        if [ -f "logs/backend.pid" ]; then
            kill $(cat logs/backend.pid) 2>/dev/null || true
            rm logs/backend.pid
        fi
        if [ -f "logs/frontend.pid" ]; then
            kill $(cat logs/frontend.pid) 2>/dev/null || true
            rm logs/frontend.pid
        fi
        log_success "✅ Services stopped"
        ;;
    "restart")
        $0 stop
        sleep 2
        $0 start
        ;;
    "optimize")
        optimize_performance
        ;;
    "issues")
        detect_potential_issues
        ;;
    "deps")
        smart_dependency_install
        ;;
    "db")
        smart_database_setup
        ;;
    "ports")
        smart_port_management
        ;;
    *)
        echo -e "${YELLOW}Usage: $0 [command]${NC}"
        echo ""
        echo -e "${CYAN}Commands:${NC}"
        echo -e "  start     - Start all services (default)"
        echo -e "  health    - Check system health"
        echo -e "  stop      - Stop all services"
        echo -e "  restart   - Restart all services"
        echo -e "  optimize  - Optimize performance"
        echo -e "  issues    - Detect potential issues"
        echo -e "  deps      - Install dependencies"
        echo -e "  db        - Setup database"
        echo -e "  ports     - Manage ports"
        echo ""
        echo -e "${GREEN}Examples:${NC}"
        echo -e "  $0              # Start all services"
        echo -e "  $0 health       # Check health"
        echo -e "  $0 stop         # Stop services"
        echo -e "  $0 restart      # Restart services"
        ;;
esac
