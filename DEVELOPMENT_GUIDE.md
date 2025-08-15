# Medical College Counseling Platform - Development Guide

## 🚨 Common Issues & Solutions

### 1. Port Conflicts (EADDRINUSE)
**Problem**: Backend server can't start because port 3000 is already in use
**Root Cause**: Previous server process didn't shut down properly
**Solution**: Use the startup script which automatically kills conflicting processes

```bash
# Manual fix
lsof -ti:3000 | xargs kill -9
# Or use our script
./start-development.sh stop
./start-development.sh start
```

### 2. Missing Dependencies
**Problem**: `Error: Cannot find module 'express'` or similar
**Root Cause**: Running commands from wrong directory or missing node_modules
**Solution**: Always run from the correct directory and ensure dependencies are installed

```bash
# Backend dependencies
cd backend && npm install

# Frontend dependencies  
cd frontend && npm install
```

### 3. Vite Cache Issues (504 Outdated Optimize Dep)
**Problem**: Frontend shows "Failed to load resource: 504 (Outdated Optimize Dep)"
**Root Cause**: Vite's dependency optimization cache is corrupted
**Solution**: Clear Vite cache and reinstall dependencies

```bash
cd frontend
rm -rf node_modules/.vite
rm -rf node_modules package-lock.json
npm install
```

### 4. Database Schema Mismatch
**Problem**: API returns empty results because missing tables
**Root Cause**: Enhanced database doesn't have required `colleges` and `courses` tables
**Solution**: Run the database setup scripts

```bash
cd backend
node create_enhanced_cutoff_db.js
node add_missing_tables.js
```

### 5. Process Management Issues
**Problem**: Frontend/backend processes stop unexpectedly
**Root Cause**: No proper process management or background execution
**Solution**: Use the startup script with proper process management

```bash
./start-development.sh start  # Start everything
./start-development.sh status # Check status
./start-development.sh stop   # Stop everything
```

## 🚀 Recommended Development Workflow

### 1. Initial Setup
```bash
# Clone and setup
git clone <repository>
cd jubilant-octo-fortnight

# Make startup script executable
chmod +x start-development.sh

# Start development environment
./start-development.sh start
```

### 2. Daily Development
```bash
# Check status
./start-development.sh status

# View logs if issues
./start-development.sh logs

# Restart if needed
./start-development.sh restart
```

### 3. Stopping Development
```bash
./start-development.sh stop
```

## 🏗️ Architecture Improvements Made

### 1. Universal Database Schema
- **Before**: Separate tables for different counselling types
- **After**: Single `cutoff_ranks_enhanced` table with universal fields
- **Benefit**: Easier to extend for new states/counselling types

### 2. Intelligent API Design
- **Before**: Hardcoded endpoints for specific counselling types
- **After**: Universal API that auto-detects counselling system
- **Benefit**: Single endpoint handles all counselling types

### 3. Process Management
- **Before**: Manual process management, prone to errors
- **After**: Automated startup script with health checks
- **Benefit**: Consistent, reliable development environment

## 🔧 Troubleshooting Checklist

When something goes wrong, check in this order:

1. **Port Conflicts**: `./start-development.sh stop` then `./start-development.sh start`
2. **Dependencies**: Check if `node_modules` exists in both directories
3. **Database**: Verify `cutoff_ranks_enhanced.db` exists and has required tables
4. **Process Status**: `./start-development.sh status`
5. **Logs**: `./start-development.sh logs`
6. **Cache Issues**: Clear Vite cache and reinstall frontend dependencies

## 📚 Key Learnings

### 1. **Process Management is Critical**
- Always use proper process management (nohup, PID files)
- Implement health checks for critical services
- Provide clear status and logging

### 2. **Dependency Management**
- Use exact versions in package.json
- Clear caches when switching between branches
- Install dependencies in correct directories

### 3. **Database Migrations**
- Always backup before schema changes
- Test migrations on sample data first
- Provide rollback mechanisms

### 4. **Development Environment**
- Standardize startup procedures
- Automate common tasks
- Provide clear error messages and solutions

## 🎯 Best Practices Going Forward

1. **Always use the startup script** instead of manual commands
2. **Check status before making changes** to understand current state
3. **Use logs for debugging** instead of guessing
4. **Test API endpoints** before testing frontend
5. **Keep dependencies updated** and consistent across environments

## 🚀 Quick Start Commands

```bash
# Start everything
./start-development.sh start

# Check what's running
./start-development.sh status

# View recent logs
./start-development.sh logs

# Restart everything
./start-development.sh restart

# Stop everything
./start-development.sh stop
```

## 🔍 Monitoring & Debugging

### Backend Health Check
```bash
curl http://localhost:3000/api/cutoff/counselling-types
```

### Frontend Health Check
```bash
curl http://localhost:3001
```

### Database Status
```bash
cd backend
sqlite3 data/cutoff_ranks_enhanced.db "SELECT COUNT(*) FROM cutoff_ranks_enhanced;"
```

---

**Remember**: The startup script handles most common issues automatically. Use it as your primary development tool!
