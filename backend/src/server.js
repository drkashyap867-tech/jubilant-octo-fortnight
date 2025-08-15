#!/usr/bin/env node

/**
 * 🚀 Medical College Counseling Platform - Express Server
 * Complete backend API ready for rapid development
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

// Import routes
const collegesRoutes = require('./routes/api/colleges');
const analyticsRoutes = require('./routes/api/analytics');
const statisticsRoutes = require('./routes/api/statistics');
const foundationRoutes = require('./routes/api/foundation');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files
app.use('/static', express.static(path.join(__dirname, '../data')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/colleges', collegesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/foundation', foundationRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Medical College Counseling Platform API',
    version: '1.0.0',
                  endpoints: {
          health: '/health',
          colleges: '/api/colleges',
          analytics: '/api/analytics',
          statistics: '/api/statistics',
          foundation: '/api/foundation'
        },
    documentation: '/api/docs'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
            availableEndpoints: [
          '/health',
          '/api/colleges',
          '/api/analytics',
          '/api/statistics'
        ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Medical College Counseling Platform API Server');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 API base: http://localhost:${PORT}/api`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
});

module.exports = app;
