# 🚀 Development Workflow with Extensions

## 📋 **Quick Start**

1. **Install Extensions**: Run `./install-vscode-extensions.sh`
2. **Restart VS Code/Cursor**: To activate all extensions
3. **Use Startup Script**: `./start-development.sh start` for development environment

## 🗄️ **Database Management with Extensions**

### **SQLTools Extension**
- **Connect to Databases**: 
  - Right-click on `.db` files → "Connect with SQLTools"
  - Use Command Palette: `SQLTools: Add Connection`
- **View Schema**: 
  - Expand connection → Tables → Right-click table → "Show Create Statement"
- **Run Queries**: 
  - Open `.sql` file → Use `Ctrl+Shift+Q` (Cmd+Shift+Q on Mac)

### **Database Client Extension**
- **Visual Database Browser**: 
  - View tables, data, and relationships
  - Execute queries with syntax highlighting
  - Export data to various formats

### **SQLite Viewer**
- **Quick Database Inspection**: 
  - Right-click `.db` files → "Open With" → "SQLite Viewer"
- **Table Structure**: View columns, indexes, and constraints

## 🔌 **API Testing with Extensions**

### **REST Client Extension**
- **Test API Endpoints**: 
  - Open `.vscode/api-tests.http`
  - Set environment variables (local/development)
  - Click "Send Request" above any endpoint
- **Save Responses**: `Ctrl+Alt+S` (Cmd+Alt+S on Mac)
- **Environment Switching**: Use dropdown in bottom status bar

### **Thunder Client Extension**
- **Alternative to Postman**: 
  - Lightweight API testing
- **Collections**: Organize API requests
- **Environment Variables**: Manage different configurations

## ⚛️ **React Development with Extensions**

### **ES7+ React Snippets**
```javascript
// Type 'rfc' and press Tab
import React from 'react'

function ComponentName() {
  return (
    <div>
      
    </div>
  )
}

export default ComponentName

// Type 'rcc' for class component
// Type 'useState' for React hooks
```

### **Auto Rename Tag**
- **Automatic JSX Tag Renaming**: 
  - Rename opening tag → closing tag updates automatically
  - Works with JSX, HTML, and XML

### **Prettier + ESLint**
- **Format on Save**: Automatically formats code
- **Error Detection**: Shows errors inline with Error Lens
- **Auto-fix**: `Ctrl+Shift+P` → "ESLint: Fix all auto-fixable Problems"

## 🐛 **Debugging with Extensions**

### **Error Lens**
- **Inline Error Display**: 
  - Errors shown directly in code
  - Hover for detailed information
  - Quick fix suggestions

### **JavaScript Debugger**
- **Node.js Debugging**: 
  - Set breakpoints in backend code
  - Debug API endpoints
  - Step through database queries

### **React Developer Tools**
- **Component Inspection**: 
  - View component hierarchy
  - Inspect props and state
  - Performance profiling

## 📊 **Database Schema Visualization**

### **SQLTools Schema Viewer**
- **Visual Table Relationships**: 
  - ER diagrams
  - Foreign key connections
  - Index information

### **Database Client Schema**
- **Table Structure**: 
  - Column types and constraints
  - Primary/foreign keys
  - Indexes and triggers

## 🔍 **Code Quality Tools**

### **ESLint Configuration**
```json
// .eslintrc.js
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended'
  ],
  rules: {
    'no-unused-vars': 'warn',
    'react/prop-types': 'off'
  }
}
```

### **Prettier Configuration**
```json
// .prettierrc
{
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 80,
  "tabWidth": 2
}
```

## 🚀 **Development Workflow**

### **1. Start Development Environment**
```bash
./start-development.sh start
```

### **2. Database Changes**
- Use SQLTools to inspect current schema
- Create migration scripts in `backend/` directory
- Test queries before implementing in code

### **3. API Development**
- Use REST Client to test endpoints
- Check responses and error handling
- Verify data format and validation

### **4. Frontend Development**
- Use React snippets for faster component creation
- Auto-format with Prettier on save
- Check for errors with Error Lens

### **5. Testing & Debugging**
- Use Error Lens for inline error display
- Debug with JavaScript debugger
- Test API endpoints with REST Client

## 🛠️ **Useful Commands**

### **VS Code Command Palette** (`Ctrl+Shift+P` / `Cmd+Shift+P`)
- `SQLTools: Add Connection` - Add database connection
- `ESLint: Fix all auto-fixable Problems` - Auto-fix code issues
- `Prettier: Format Document` - Format current file
- `Database Client: Connect` - Connect to database

### **Keyboard Shortcuts**
- `Ctrl+Shift+Q` (Cmd+Shift+Q) - Execute SQL query
- `Ctrl+Alt+R` (Cmd+Alt+R) - Send REST request
- `Ctrl+Shift+P` (Cmd+Shift+P) - Command palette
- `Ctrl+Shift+F` (Cmd+Shift+F) - Search across files

## 📁 **File Organization**

```
.vscode/
├── settings.json          # Workspace settings
├── api-tests.http        # API testing endpoints
└── launch.json           # Debug configurations

backend/
├── data/                 # Database files
├── scripts/              # Database scripts
└── server.js            # Main server file

frontend/
├── src/
│   ├── pages/           # React components
│   ├── components/       # Reusable components
│   └── styles/          # CSS and styling
└── package.json         # Frontend dependencies
```

## 🎯 **Best Practices**

### **1. Always Use Extensions**
- Don't manually test APIs - use REST Client
- Don't manually inspect databases - use SQLTools
- Don't ignore code quality - use ESLint + Prettier

### **2. Database First Approach**
- Design schema changes in SQLTools
- Test queries before implementing
- Use migrations for version control

### **3. API Testing**
- Test all endpoints with REST Client
- Verify error handling and edge cases
- Check response formats and validation

### **4. Code Quality**
- Format code automatically with Prettier
- Fix ESLint errors immediately
- Use TypeScript for better type safety

## 🚨 **Troubleshooting**

### **Extensions Not Working**
1. Restart VS Code/Cursor
2. Check extension is enabled
3. Verify workspace settings

### **Database Connection Issues**
1. Check file paths in settings
2. Verify database files exist
3. Check file permissions

### **API Testing Problems**
1. Verify environment variables
2. Check if backend is running
3. Verify endpoint URLs

---

**Remember**: These extensions will make development much faster and more reliable! 🎉
