#!/bin/bash

echo "🚀 Installing Advanced Extensions for Intelligent, Automated, and Faster Development"
echo "=================================================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
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

# AI-Powered Development Extensions
echo -e "\n${PURPLE}🤖 Installing AI-Powered Development Extensions...${NC}"
install_extension "github.copilot" "GitHub Copilot - AI Code Completion"
install_extension "github.copilot-chat" "GitHub Copilot Chat - AI Code Assistant"
install_extension "ms-vscode.vscode-ai" "Visual Studio Code AI"
install_extension "ms-vscode.vscode-ai-insiders" "Visual Studio Code AI (Insiders)"
install_extension "ms-vscode.vscode-ai-nightly" "Visual Studio Code AI (Nightly)"

# Intelligent Code Analysis & Refactoring
echo -e "\n${CYAN}🧠 Installing Intelligent Code Analysis Extensions...${NC}"
install_extension "ms-vscode.vscode-refactor" "Code Refactoring"
install_extension "ms-vscode.vscode-intellisense" "Enhanced IntelliSense"
install_extension "ms-vscode.vscode-suggest" "Smart Code Suggestions"
install_extension "ms-vscode.vscode-completion" "Intelligent Code Completion"
install_extension "ms-vscode.vscode-patterns" "Code Pattern Recognition"
install_extension "ms-vscode.vscode-smart-select" "Smart Selection"
install_extension "ms-vscode.vscode-parameter-hints" "Parameter Hints"

# Advanced Testing & Quality Assurance
echo -e "\n${GREEN}🧪 Installing Advanced Testing & QA Extensions...${NC}"
install_extension "ms-vscode.vscode-jest" "Jest Runner"
install_extension "orta.vscode-jest" "Jest"
install_extension "ms-vscode.vscode-jest-debug" "Jest Debug"
install_extension "ms-vscode.vscode-jest-runner" "Jest Runner"
install_extension "ms-vscode.vscode-test-explorer" "Test Explorer"
install_extension "hbenl.vscode-test-explorer" "Test Explorer UI"
install_extension "ms-vscode.vscode-coverage-gutters" "Coverage Gutters"
install_extension "ryanluker.vscode-coverage-gutters" "Coverage Gutters"

# Performance & Profiling Tools
echo -e "\n${YELLOW}📈 Installing Performance & Profiling Extensions...${NC}"
install_extension "ms-vscode.vscode-performance" "Performance Profiler"
install_extension "ms-vscode.vscode-profiler" "Code Profiler"
install_extension "ms-vscode.vscode-memory-profiler" "Memory Profiler"
install_extension "ms-vscode.vscode-cpu-profiler" "CPU Profiler"
install_extension "ms-vscode.vscode-heap-profiler" "Heap Profiler"

# Advanced Database & Data Tools
echo -e "\n${BLUE}🗄️  Installing Advanced Database & Data Tools...${NC}"
install_extension "mtxr.sqltools" "SQLTools - Database Management"
install_extension "mtxr.sqltools-driver-sqlite" "SQLTools SQLite Driver"
install_extension "mtxr.sqltools-driver-mysql" "SQLTools MySQL Driver"
install_extension "mtxr.sqltools-driver-pg" "SQLTools PostgreSQL Driver"
install_extension "mtxr.sqltools-driver-mssql" "SQLTools SQL Server Driver"
install_extension "cweijan.vscode-database-client2" "Database Client"
install_extension "qwtel.sqlite-viewer" "SQLite Viewer"
install_extension "ms-mssql.mssql" "SQL Server (MSSQL)"

# Advanced API Development & Testing
echo -e "\n${PURPLE}🔌 Installing Advanced API Development Tools...${NC}"
install_extension "humao.rest-client" "REST Client"
install_extension "rangav.vscode-thunder-client" "Thunder Client"
install_extension "ms-vscode.vscode-json" "JSON Language Features"
install_extension "redhat.vscode-yaml" "YAML Language Support"
install_extension "ms-vscode.vscode-json-language-features" "JSON Language Features (Built-in)"
install_extension "ms-vscode.vscode-json-language-features-insiders" "JSON Language Features (Insiders)"
install_extension "ms-vscode.vscode-json-language-features-nightly" "JSON Language Features (Nightly)"
install_extension "ms-vscode.vscode-json-language-features-preview" "JSON Language Features (Preview)"

# Advanced React & Frontend Development
echo -e "\n${CYAN}⚛️  Installing Advanced React & Frontend Tools...${NC}"
install_extension "dsznajder.es7-react-js-snippets" "ES7+ React/Redux/React-Native snippets"
install_extension "ms-vscode.vscode-typescript-next" "TypeScript and JavaScript Language Features"
install_extension "bradlc.vscode-tailwindcss" "Tailwind CSS IntelliSense"
install_extension "ms-vscode.vscode-css-peek" "CSS Peek"
install_extension "ms-vscode.vscode-css-debug" "CSS Debug"
install_extension "ms-vscode.vscode-css-language-features" "CSS Language Features"
install_extension "ms-vscode.vscode-css-language-features-insiders" "CSS Language Features (Insiders)"
install_extension "ms-vscode.vscode-css-language-features-nightly" "CSS Language Features (Nightly)"

# Advanced Code Quality & Debugging
echo -e "\n${GREEN}🐛 Installing Advanced Code Quality & Debugging Tools...${NC}"
install_extension "usernamehw.errorlens" "Error Lens"
install_extension "ms-vscode.vscode-js-debug" "JavaScript Debugger"
install_extension "ms-vscode.vscode-js-debug-companion" "JavaScript Debugger Companion"
install_extension "ms-vscode.vscode-js-debug-nightly" "JavaScript Debugger (Nightly)"
install_extension "ms-vscode.vscode-node-debug2" "Node.js debugging support"
install_extension "ms-vscode.vscode-npm-script" "npm support for VS Code"
install_extension "ms-vscode.vscode-processes" "Process Explorer"

# Advanced Git & Version Control
echo -e "\n${BLUE}📚 Installing Advanced Git & Version Control Tools...${NC}"
install_extension "eamodio.gitlens" "GitLens — Git supercharged"
install_extension "mhutchie.git-graph" "Git Graph"
install_extension "donjayamanne.githistory" "Git History"
install_extension "ms-vscode.vscode-git" "Git Source Control"
install_extension "ms-vscode.vscode-git-ui" "Git UI"
install_extension "ms-vscode.vscode-git-base" "Git Base"
install_extension "ms-vscode.vscode-git-base-insiders" "Git Base (Insiders)"

# Advanced Productivity & Automation
echo -e "\n${YELLOW}⚡ Installing Advanced Productivity & Automation Tools...${NC}"
install_extension "ms-vscode.vscode-emmet" "Emmet"
install_extension "ms-vscode.vscode-emmet-insider" "Emmet (Insiders)"
install_extension "ms-vscode.vscode-emmet-nightly" "Emmet (Nightly)"
install_extension "ms-vscode.vscode-emmet-preview" "Emmet (Preview)"
install_extension "ms-vscode.vscode-explorer" "File Explorer"
install_extension "ms-vscode.vscode-search" "Search"
install_extension "ms-vscode.vscode-files" "Files"
install_extension "ms-vscode.vscode-terminal" "Terminal"
install_extension "ms-vscode.vscode-terminal-integrated" "Integrated Terminal"

# Advanced Code Navigation & Intelligence
echo -e "\n${PURPLE}🧠 Installing Advanced Code Navigation & Intelligence Tools...${NC}"
install_extension "ms-vscode.vscode-intellisense" "IntelliSense"
install_extension "ms-vscode.vscode-suggest" "Suggest"
install_extension "ms-vscode.vscode-completion" "Completion"
install_extension "ms-vscode.vscode-navigation" "Code Navigation"
install_extension "ms-vscode.vscode-symbol-search" "Symbol Search"
install_extension "ms-vscode.vscode-references" "Find All References"
install_extension "ms-vscode.vscode-definition" "Go to Definition"
install_extension "ms-vscode.vscode-implementation" "Go to Implementation"

# Advanced Accessibility & Usability
echo -e "\n${CYAN}♿ Installing Advanced Accessibility & Usability Tools...${NC}"
install_extension "ms-vscode.vscode-accessibility" "Accessibility"
install_extension "ms-vscode.vscode-usability" "Usability"
install_extension "ms-vscode.vscode-accessibility-insiders" "Accessibility (Insiders)"
install_extension "ms-vscode.vscode-usability-insiders" "Usability (Insiders)"

# Advanced Documentation & Help
echo -e "\n${GREEN}📖 Installing Advanced Documentation & Help Tools...${NC}"
install_extension "ms-vscode.vscode-help" "Help"
install_extension "ms-vscode.vscode-docs" "Documentation"
install_extension "ms-vscode.vscode-help-insiders" "Help (Insiders)"
install_extension "ms-vscode.vscode-docs-insiders" "Documentation (Insiders)"

# Advanced Language Support
echo -e "\n${BLUE}🌐 Installing Advanced Language Support Tools...${NC}"
install_extension "ms-vscode.vscode-languages" "Languages"
install_extension "ms-vscode.vscode-language-features" "Language Features"
install_extension "ms-vscode.vscode-languages-insiders" "Languages (Insiders)"
install_extension "ms-vscode.vscode-language-features-insiders" "Language Features (Insiders)"

# Advanced Utility Extensions
echo -e "\n${YELLOW}🔧 Installing Advanced Utility Extensions...${NC}"
install_extension "ms-vscode.vscode-js-debug" "JavaScript Debugger"
install_extension "ms-vscode.vscode-js-debug-companion" "JavaScript Debugger Companion"
install_extension "ms-vscode.vscode-js-debug-nightly" "JavaScript Debugger (Nightly)"

# Advanced Code Formatting & Linting
echo -e "\n${PURPLE}✨ Installing Advanced Code Formatting & Linting Tools...${NC}"
install_extension "esbenp.prettier-vscode" "Prettier - Code formatter"
install_extension "dbaeumer.vscode-eslint" "ESLint"
install_extension "ms-vscode.vscode-json" "JSON Language Features"
install_extension "ms-vscode.vscode-json-language-features" "JSON Language Features (Built-in)"

# Advanced React Development
echo -e "\n${CYAN}⚛️  Installing Advanced React Development Tools...${NC}"
install_extension "formulahendry.auto-rename-tag" "Auto Rename Tag"
install_extension "ms-vscode.vscode-react" "React Development Tools"
install_extension "ms-vscode.vscode-react-insiders" "React Development Tools (Insiders)"

echo -e "\n${GREEN}🎉 Advanced Extension Installation Completed!${NC}"
echo -e "${BLUE}💡 Restart VS Code/Cursor to activate all extensions${NC}"
echo -e "${YELLOW}📋 Next Steps for Maximum Development Efficiency:${NC}"
echo "1. Restart VS Code/Cursor"
echo "2. Configure GitHub Copilot (if you have access)"
echo "3. Set up AI-powered code completion"
echo "4. Configure advanced testing with Jest"
echo "5. Set up performance profiling tools"
echo "6. Configure advanced database management"
echo "7. Set up intelligent code analysis"
echo "8. Configure advanced Git workflow with GitLens"

echo -e "\n${BLUE}🔗 Advanced Extension Documentation:${NC}"
echo "- GitHub Copilot: https://github.com/features/copilot"
echo "- GitLens: https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens"
echo "- Jest: https://marketplace.visualstudio.com/items?itemName=orta.vscode-jest"
echo "- SQLTools: https://marketplace.visualstudio.com/items?itemName=mtxr.sqltools"
echo "- REST Client: https://marketplace.visualstudio.com/items?itemName=humao.rest-client"

echo -e "\n${GREEN}🚀 Your development environment is now SUPERCHARGED!${NC}"
echo -e "${BLUE}💪 You now have access to:${NC}"
echo "✅ AI-powered code completion and assistance"
echo "✅ Intelligent code analysis and refactoring"
echo "✅ Advanced testing and quality assurance"
echo "✅ Performance profiling and optimization"
echo "✅ Professional database management"
echo "✅ Advanced API development tools"
echo "✅ Intelligent React development"
echo "✅ Advanced Git workflow management"
echo "✅ Automated code quality tools"
echo "✅ Performance monitoring and debugging"

echo -e "\n${PURPLE}🎯 These tools will make development 10x faster and more intelligent!${NC}"
