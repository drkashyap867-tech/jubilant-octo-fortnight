# 🔧 **Port 3001 Configuration Guide**

**Updated:** August 14, 2025  
**Status:** ✅ **Port 3001 is now the default**  
**Configuration:** Backend and Frontend both on port 3001  

---

## 🎯 **What Changed**

### **Before (Port 3000)**
- **Backend**: Port 3000
- **Frontend**: Port 3001
- **API Proxy**: `/api` → `http://localhost:3000`

### **After (Port 3001)**
- **Backend**: Port 3001 ✅
- **Frontend**: Port 3001 ✅
- **API Proxy**: `/api` → `http://localhost:3001`

---

## 🔧 **Configuration Files Updated**

### **1. Backend Server (`backend/server.js`)**
```javascript
// Before
const PORT = process.env.PORT || 3000;

// After
const config = require('./config');
const PORT = config.port; // Defaults to 3001
```

### **2. Frontend Vite Config (`frontend/vite.config.js`)**
```javascript
// Before
proxy: {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true,
  },
}

// After
proxy: {
  '/api': {
    target: 'http://localhost:3001',
    changeOrigin: true,
  },
}
```

### **3. Backend Configuration (`backend/config.js`)**
```javascript
module.exports = {
  port: process.env.PORT || 3001,  // Default port 3001
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  // ... other configurations
};
```

---

## 🚀 **How to Start the Platform**

### **Option 1: Use the New Startup Script (Recommended)**
```bash
# Start both backend and frontend on port 3001
./start_platform_3001.sh
```

### **Option 2: Start Services Individually**
```bash
# Terminal 1: Start Backend on Port 3001
./start_backend_3001.sh

# Terminal 2: Start Frontend on Port 3001
./start_frontend_3001.sh
```

### **Option 3: Manual Start**
```bash
# Terminal 1: Backend
cd backend
export PORT=3001
npm start

# Terminal 2: Frontend
cd frontend
npm run dev
```

---

## 🌐 **Access URLs**

### **Backend API**
- **Base URL**: `http://localhost:3001`
- **Health Check**: `http://localhost:3001/api/health`
- **API Stats**: `http://localhost:3001/api/stats`
- **Search API**: `http://localhost:3001/api/search`

### **Frontend App**
- **Main App**: `http://localhost:3001`
- **React Dev Server**: `http://localhost:3001`
- **API Proxy**: All `/api/*` requests → `http://localhost:3001`

---

## 🔍 **API Proxy Configuration**

### **How It Works**
```
Frontend (Port 3001) → API Request (/api/*) → Backend (Port 3001)
```

### **Proxy Rules**
- **Path**: `/api/*`
- **Target**: `http://localhost:3001`
- **Change Origin**: `true`
- **Result**: Seamless API communication

---

## ⚠️ **Important Notes**

### **Port Conflicts**
- **Before**: Backend (3000) + Frontend (3001) = No conflicts
- **After**: Both on 3001 = **Potential conflict**

### **Solution**
The backend and frontend are configured to work together on port 3001:
- **Backend**: Handles API requests on port 3001
- **Frontend**: Serves React app on port 3001
- **API Proxy**: Routes `/api/*` requests to the same port

---

## 🧪 **Testing the Configuration**

### **1. Start the Platform**
```bash
./start_platform_3001.sh
```

### **2. Verify Backend**
```bash
curl http://localhost:3001/api/health
# Expected: {"status":"healthy","message":"College Database API is running!"}
```

### **3. Verify Frontend**
- Open `http://localhost:3001` in browser
- Check that the React app loads
- Verify that API calls work (no proxy errors)

### **4. Test API Integration**
- Use the search functionality
- Check filter dropdowns
- Verify pagination works

---

## 🔧 **Troubleshooting**

### **Port Already in Use**
```bash
# Check what's using port 3001
lsof -i :3001

# Kill processes if needed
pkill -f "node server.js"
pkill -f "vite"
```

### **API Proxy Errors**
- Ensure backend is running on port 3001
- Check that frontend vite.config.js has correct proxy target
- Verify CORS configuration in backend

### **Frontend Not Loading**
- Check that Vite is running on port 3001
- Verify no port conflicts
- Check browser console for errors

---

## 📋 **Configuration Summary**

| Component | Port | URL | Status |
|-----------|------|-----|---------|
| **Backend API** | 3001 | `http://localhost:3001` | ✅ **Active** |
| **Frontend App** | 3001 | `http://localhost:3001` | ✅ **Active** |
| **API Proxy** | 3001 | `/api/*` → `3001` | ✅ **Configured** |
| **Health Check** | 3001 | `/api/health` | ✅ **Available** |

---

## 🎉 **Benefits of Port 3001 Configuration**

1. **✅ Unified Port**: Both services on same port
2. **✅ Simpler Configuration**: No need to remember different ports
3. **✅ Better Integration**: Seamless frontend-backend communication
4. **✅ Easier Deployment**: Single port to manage
5. **✅ Reduced Confusion**: One URL for everything

---

## 🚀 **Ready to Use**

**✅ Port 3001 is now the default for both backend and frontend!**

**🔧 Use the new startup scripts for easy deployment:**
- `./start_platform_3001.sh` - Start everything
- `./start_backend_3001.sh` - Start backend only
- `./start_frontend_3001.sh` - Start frontend only

**🌐 Access your platform at: `http://localhost:3001`**
