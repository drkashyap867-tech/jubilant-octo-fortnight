#!/bin/bash

# Port Configuration Switcher for Medical College Counseling Platform
echo "🔌 Port Configuration Switcher"
echo "================================"
echo ""

# Function to show current configuration
show_current_config() {
    echo "📋 Current Configuration:"
    echo "------------------------"
    
    # Check backend config
    if grep -q "port: process.env.PORT || 3000" backend/config.js; then
        echo "🔧 Backend: Port 3000"
    elif grep -q "port: process.env.PORT || 3001" backend/config.js; then
        echo "🔧 Backend: Port 3001"
    else
        echo "🔧 Backend: Custom port"
    fi
    
    # Check frontend proxy
    if grep -q "target: 'http://localhost:3000'" frontend/vite.config.js; then
        echo "🎨 Frontend: Proxies to localhost:3000"
    elif grep -q "target: 'http://localhost:3001'" frontend/vite.config.js; then
        echo "🎨 Frontend: Proxies to localhost:3001"
    else
        echo "🎨 Frontend: Custom proxy target"
    fi
    
    echo ""
}

# Function to switch to port 3000 configuration
switch_to_3000() {
    echo "🔄 Switching to Port 3000 Configuration..."
    
    # Update backend config
    sed -i '' 's/port: process.env.PORT || 3001/port: process.env.PORT || 3000/' backend/config.js
    
    # Update frontend proxy
    sed -i '' "s/target: 'http:\/\/localhost:3001'/target: 'http:\/\/localhost:3000'/" frontend/vite.config.js
    
    echo "✅ Switched to Port 3000 Configuration"
    echo "   Backend: Port 3000"
    echo "   Frontend: Port 3001"
    echo "   API Proxy: /api/* → localhost:3000"
    echo ""
}

# Function to switch to port 3001 configuration
switch_to_3001() {
    echo "🔄 Switching to Port 3001 Configuration..."
    
    # Update backend config
    sed -i '' 's/port: process.env.PORT || 3000/port: process.env.PORT || 3001/' backend/config.js
    
    # Update frontend proxy
    sed -i '' "s/target: 'http:\/\/localhost:3000'/target: 'http:\/\/localhost:3001'/" frontend/vite.config.js
    
    echo "✅ Switched to Port 3001 Configuration"
    echo "   Backend: Port 3001"
    echo "   Frontend: Port 3001"
    echo "   API Proxy: /api/* → localhost:3001"
    echo ""
}

# Function to start services
start_services() {
    echo "🚀 Starting Services..."
    echo ""
    
    # Check current configuration
    if grep -q "port: process.env.PORT || 3000" backend/config.js; then
        echo "📡 Using Port 3000 Configuration"
        echo "   Use: ./start_platform_3000.sh"
        echo "   Or manually:"
        echo "   Terminal 1: cd backend && export PORT=3000 && npm start"
        echo "   Terminal 2: cd frontend && npm run dev"
    else
        echo "📡 Using Port 3001 Configuration"
        echo "   Use: ./start_platform_3001.sh"
        echo "   Or manually:"
        echo "   Terminal 1: cd backend && export PORT=3001 && npm start"
        echo "   Terminal 2: cd frontend && npm run dev"
    fi
    
    echo ""
}

# Function to show available options
show_help() {
    echo "🔌 Available Options:"
    echo "====================="
    echo ""
    echo "📋 show     - Show current port configuration"
    echo "🔄 3000     - Switch to Port 3000 configuration (Standard)"
    echo "🔄 3001     - Switch to Port 3001 configuration (Unified)"
    echo "🚀 start    - Show how to start services"
    echo "❓ help     - Show this help message"
    echo "🚪 exit     - Exit the switcher"
    echo ""
}

# Main menu
while true; do
    echo "🔌 Port Configuration Switcher"
    echo "================================"
    echo ""
    echo "📋 Available Options:"
    echo "1. Show current configuration"
    echo "2. Switch to Port 3000 (Standard)"
    echo "3. Switch to Port 3001 (Unified)"
    echo "4. Show startup instructions"
    echo "5. Help"
    echo "6. Exit"
    echo ""
    read -p "🔧 Choose an option (1-6): " choice
    
    case $choice in
        1)
            show_current_config
            ;;
        2)
            switch_to_3000
            show_current_config
            ;;
        3)
            switch_to_3001
            show_current_config
            ;;
        4)
            start_services
            ;;
        5)
            show_help
            ;;
        6)
            echo "👋 Goodbye!"
            exit 0
            ;;
        *)
            echo "❌ Invalid option. Please choose 1-6."
            echo ""
            ;;
    esac
    
    echo "Press Enter to continue..."
    read
    clear
done
