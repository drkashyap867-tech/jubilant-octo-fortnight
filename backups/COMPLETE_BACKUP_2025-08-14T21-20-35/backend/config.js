// Backend Configuration
module.exports = {
  // Server Configuration
  port: process.env.PORT || 3001,
  
  // Database Configuration
  dbPath: process.env.DB_PATH || './data/',
  
  // CORS Configuration
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  
  // Logging Configuration
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // API Configuration
  apiPrefix: '/api',
  
  // Search Configuration
  defaultSearchLimit: 100,
  maxSearchLimit: 1250,
  
  // Environment
  environment: process.env.NODE_ENV || 'development'
};
