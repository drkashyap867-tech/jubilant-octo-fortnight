# 🚀 **Quick Start Guide - Medical College Counseling Platform**

## ⚡ **Get Up and Running in 5 Minutes!**

This guide will help you get the platform running on your local machine quickly.

## 📋 **Prerequisites Check**

Before starting, ensure you have:

- ✅ **Node.js 18+** installed
- ✅ **npm** package manager
- ✅ **Git** for version control
- ✅ **Modern browser** (Chrome, Firefox, Safari, Edge)

### **Check Node.js Version**
```bash
node --version  # Should be 18.0.0 or higher
npm --version   # Should be 8.0.0 or higher
```

## 🚀 **Step-by-Step Setup**

### **1. Clone and Navigate**
```bash
git clone <your-repository-url>
cd jubilant-octo-fortnight
```

### **2. Install Dependencies**
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend && npm install

# Install backend dependencies
cd ../backend && npm install

# Return to root
cd ..
```

### **3. Environment Configuration**
```bash
# Copy environment template
cp env.example .env

# Edit environment file (optional for development)
# Most settings work out of the box
```

### **4. Database Setup**
```bash
# Navigate to backend
cd backend

# Initialize database (creates SQLite file)
npm run db:init

# Import sample data
npm run db:seed

# Return to root
cd ..
```

### **5. Start Development Servers**
```bash
# Terminal 1: Start Backend API
cd backend
npm run dev

# Terminal 2: Start Frontend (in new terminal)
cd frontend
npm run dev
```

### **6. Open Your Browser**
- 🌐 **Frontend**: http://localhost:3001
- 🔌 **Backend API**: http://localhost:3000
- 📊 **API Health Check**: http://localhost:3000/health

## 🎯 **What You'll See**

### **🏠 Homepage**
- Welcome message and platform overview
- Quick navigation to main features
- Platform statistics and metrics

### **📊 Dashboard**
- Total colleges count
- States covered
- Courses available
- Interactive charts and analytics

### **🏥 Colleges Section**
- Medical colleges listing
- Dental colleges listing
- DNB colleges listing
- Advanced search and filtering

### **📈 Analytics**
- Management type distribution
- Establishment timeline
- Top performing states
- Course popularity rankings

## 🔧 **Troubleshooting**

### **Port Already in Use**
```bash
# Check what's using the port
lsof -i :3000
lsof -i :3001

# Kill the process or change ports in .env
```

### **Database Issues**
```bash
# Reset database
cd backend
rm -f database/medical_colleges.db
npm run db:init
npm run db:seed
```

### **Dependencies Issues**
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### **Build Errors**
```bash
# Clear build cache
cd frontend
rm -rf dist node_modules/.vite
npm install
npm run dev
```

## 📱 **Test on Different Devices**

### **Mobile Testing**
- Open browser dev tools
- Toggle device toolbar
- Test on various screen sizes
- Verify touch interactions

### **Responsive Breakpoints**
- **480px**: Mobile portrait
- **768px**: Tablet portrait
- **1024px**: Tablet landscape
- **1440px**: Desktop

## 🧪 **Quick Testing Checklist**

- [ ] **Frontend loads** without errors
- [ ] **Backend API** responds to health check
- [ ] **Database** contains sample data
- [ ] **Search functionality** works
- [ ] **Filters** apply correctly
- [ ] **Responsive design** works on mobile
- [ ] **Dark/Light mode** toggles
- **Analytics charts** display data
- **Export functionality** works

## 🚀 **Next Steps**

### **Immediate Actions**
1. **Explore the interface** and familiarize yourself
2. **Test all features** mentioned in the checklist
3. **Check console** for any errors or warnings
4. **Verify mobile responsiveness** on different devices

### **Development Tasks**
1. **Review the codebase** structure
2. **Check the TODO.md** for development roadmap
3. **Set up your IDE** with recommended extensions
4. **Start building** new features or improvements

### **Production Preparation**
1. **Configure production** environment variables
2. **Set up monitoring** and logging
3. **Test performance** with large datasets
4. **Deploy to staging** environment

## 🆘 **Need Help?**

### **Common Issues**
- **Port conflicts**: Check if ports 3000/3001 are free
- **Database errors**: Ensure SQLite is supported
- **Build failures**: Clear cache and reinstall dependencies
- **Performance issues**: Check browser console for errors

### **Getting Support**
- 📖 **Documentation**: Check the `/docs` folder
- 🐛 **Issues**: Create a GitHub issue
- 💬 **Community**: Join our Discord server
- 📧 **Email**: Contact support team

## 🎉 **You're All Set!**

Congratulations! You now have a fully functional medical college counseling platform running locally. 

**🚀 Start exploring, testing, and building amazing features!**

---

*This quick start guide covers the essentials. For detailed information, check the main [README.md](./README.md) and [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md).*
