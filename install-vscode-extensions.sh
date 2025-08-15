#!/bin/bash

echo "🚀 Installing Essential VS Code Extensions for Medical College Counseling Platform Development"
echo "========================================================================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to install extension
install_extension() {
    local extension_id=$1
    local description=$2
    
    echo -e "${BLUE}📦 Installing: $description${NC}"
    code --install-extension "$extension_id"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Successfully installed: $description${NC}"
    else
        echo -e "${YELLOW}⚠️  Failed to install: $description${NC}"
    fi
}

# Database & SQL Management
echo -e "\n${BLUE}🗄️  Installing Database & SQL Extensions...${NC}"
install_extension "mtxr.sqltools" "SQLTools - Database Management"
install_extension "mtxr.sqltools-driver-sqlite" "SQLTools SQLite Driver"
install_extension "qwtel.sqlite-viewer" "SQLite Viewer"
install_extension "ms-mssql.mssql" "SQL Server (MSSQL)"
install_extension "cweijan.vscode-database-client2" "Database Client"

# API Development & Testing
echo -e "\n${BLUE}🔌 Installing API Development Extensions...${NC}"
install_extension "humao.rest-client" "REST Client"
install_extension "rangav.vscode-thunder-client" "Thunder Client"
install_extension "formulahendry.auto-rename-tag" "Auto Rename Tag"
install_extension "ms-vscode.vscode-json" "JSON Language Features"
install_extension "redhat.vscode-yaml" "YAML Language Support"

# React & Frontend Development
echo -e "\n${BLUE}⚛️  Installing React & Frontend Extensions...${NC}"
install_extension "dsznajder.es7-react-js-snippets" "ES7+ React/Redux/React-Native snippets"
install_extension "esbenp.prettier-vscode" "Prettier - Code formatter"
install_extension "dbaeumer.vscode-eslint" "ESLint"
install_extension "ms-vscode.vscode-typescript-next" "TypeScript and JavaScript Language Features"
install_extension "bradlc.vscode-tailwindcss" "Tailwind CSS IntelliSense"
install_extension "ms-vscode.vscode-css-peek" "CSS Peek"
install_extension "ms-vscode.vscode-css-debug" "CSS Debug"

# Code Quality & Debugging
echo -e "\n${BLUE}🐛 Installing Code Quality & Debugging Extensions...${NC}"
install_extension "usernamehw.errorlens" "Error Lens"
install_extension "ms-vscode.vscode-js-debug" "JavaScript Debugger"
install_extension "ms-vscode.vscode-js-debug-companion" "JavaScript Debugger Companion"
install_extension "ms-vscode.vscode-js-debug-nightly" "JavaScript Debugger (Nightly)"
install_extension "ms-vscode.vscode-node-debug2" "Node.js debugging support"
install_extension "ms-vscode.vscode-npm-script" "npm support for VS Code"

# Git & Version Control
echo -e "\n${BLUE}📚 Installing Git & Version Control Extensions...${NC}"
install_extension "eamodio.gitlens" "GitLens — Git supercharged"
install_extension "mhutchie.git-graph" "Git Graph"
install_extension "donjayamanne.githistory" "Git History"
install_extension "ms-vscode.vscode-git" "Git Source Control"

# Productivity & Utilities
echo -e "\n${BLUE}⚡ Installing Productivity & Utility Extensions...${NC}"
install_extension "ms-vscode.vscode-json" "JSON Language Features"
install_extension "ms-vscode.vscode-json-language-features" "JSON Language Features (Built-in)"
install_extension "ms-vscode.vscode-json-language-features-insiders" "JSON Language Features (Insiders)"
install_extension "ms-vscode.vscode-json-language-features-nightly" "JSON Language Features (Nightly)"
install_extension "ms-vscode.vscode-json-language-features-preview" "JSON Language Features (Preview)"

# Testing & Quality Assurance
echo -e "\n${BLUE}🧪 Installing Testing & QA Extensions...${NC}"
install_extension "ms-vscode.vscode-jest" "Jest Runner"
install_extension "orta.vscode-jest" "Jest"
install_extension "ms-vscode.vscode-jest-debug" "Jest Debug"
install_extension "ms-vscode.vscode-jest-runner" "Jest Runner"

# Database Schema Visualization
echo -e "\n${BLUE}📊 Installing Database Schema Extensions...${NC}"
install_extension "mtxr.sqltools" "SQLTools"
install_extension "mtxr.sqltools-driver-sqlite" "SQLTools SQLite Driver"

# Process Management & System
echo -e "\n${BLUE}⚙️  Installing Process Management Extensions...${NC}"
install_extension "ms-vscode.vscode-node-debug2" "Node.js debugging support"
install_extension "ms-vscode.vscode-npm-script" "npm support for VS Code"
install_extension "ms-vscode.vscode-processes" "Process Explorer"

# Enhanced Development Experience
echo -e "\n${BLUE}🎨 Installing Enhanced Development Experience Extensions...${NC}"
install_extension "ms-vscode.vscode-emmet" "Emmet"
install_extension "ms-vscode.vscode-emmet-insider" "Emmet (Insiders)"
install_extension "ms-vscode.vscode-emmet-nightly" "Emmet (Nightly)"
install_extension "ms-vscode.vscode-emmet-preview" "Emmet (Preview)"

# File Management & Navigation
echo -e "\n${BLUE}📁 Installing File Management Extensions...${NC}"
install_extension "ms-vscode.vscode-explorer" "File Explorer"
install_extension "ms-vscode.vscode-search" "Search"
install_extension "ms-vscode.vscode-files" "Files"

# Terminal & Shell Integration
echo -e "\n${BLUE}💻 Installing Terminal & Shell Extensions...${NC}"
install_extension "ms-vscode.vscode-terminal" "Terminal"
install_extension "ms-vscode.vscode-terminal-integrated" "Integrated Terminal"

# Code Navigation & Intelligence
echo -e "\n${BLUE}🧠 Installing Code Navigation Extensions...${NC}"
install_extension "ms-vscode.vscode-intellisense" "IntelliSense"
install_extension "ms-vscode.vscode-suggest" "Suggest"
install_extension "ms-vscode.vscode-completion" "Completion"

# Performance & Profiling
echo -e "\n${BLUE}📈 Installing Performance & Profiling Extensions...${NC}"
install_extension "ms-vscode.vscode-performance" "Performance"
install_extension "ms-vscode.vscode-profiler" "Profiler"

# Accessibility & Usability
echo -e "\n${BLUE}♿ Installing Accessibility & Usability Extensions...${NC}"
install_extension "ms-vscode.vscode-accessibility" "Accessibility"
install_extension "ms-vscode.vscode-usability" "Usability"

# Documentation & Help
echo -e "\n${BLUE}📖 Installing Documentation & Help Extensions...${NC}"
install_extension "ms-vscode.vscode-help" "Help"
install_extension "ms-vscode.vscode-docs" "Documentation"

# Language Support
echo -e "\n${BLUE}🌐 Installing Language Support Extensions...${NC}"
install_extension "ms-vscode.vscode-languages" "Languages"
install_extension "ms-vscode.vscode-language-features" "Language Features"

# Utility Extensions
echo -e "\n${BLUE}🔧 Installing Utility Extensions...${NC}"
install_extension "ms-vscode.vscode-js-debug" "JavaScript Debugger"
install_extension "ms-vscode.vscode-js-debug-companion" "JavaScript Debugger Companion"
install_extension "ms-vscode.vscode-js-debug-nightly" "JavaScript Debugger (Nightly)"

echo -e "\n${GREEN}🎉 Extension installation completed!${NC}"
echo -e "${BLUE}💡 Restart VS Code/Cursor to activate all extensions${NC}"
echo -e "${YELLOW}📋 Recommended next steps:${NC}"
echo "1. Restart VS Code/Cursor"
echo "2. Configure Prettier and ESLint for your project"
echo "3. Set up SQLTools connections to your databases"
echo "4. Configure GitLens settings"
echo "5. Test the REST Client with your API endpoints"
echo "6. Set up Jest testing environment"
echo "7. Configure Tailwind CSS IntelliSense"

echo -e "\n${BLUE}🔗 Useful Extension Documentation:${NC}"
echo "- SQLTools: https://marketplace.visualstudio.com/items?itemName=mtxr.sqltools"
echo "- REST Client: https://marketplace.visualstudio.com/items?itemName=humao.rest-client"
echo "- GitLens: https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens"
echo "- Prettier: https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode"
echo "- Jest: https://marketplace.visualstudio.com/items?itemName=orta.vscode-jest"
echo "- Tailwind CSS: https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss"

echo -e "\n${GREEN}🚀 Your development environment is now supercharged!${NC}"
echo -e "${BLUE}💪 You have access to:${NC}"
echo "✅ Advanced database management and visualization"
echo "✅ Comprehensive API testing and debugging"
echo "✅ Professional React development tools"
echo "✅ Automated code quality and formatting"
echo "✅ Enhanced Git workflow and history"
echo "✅ Performance profiling and optimization"
echo "✅ Comprehensive testing and debugging tools"
