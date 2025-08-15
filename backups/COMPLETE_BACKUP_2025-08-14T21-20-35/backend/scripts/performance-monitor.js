const fs = require('fs');
const path = require('path');

/**
 * ⚡ Performance Monitoring System
 * Based on previous project architecture but simplified and robust
 */
class PerformanceMonitor {
  constructor() {
    this.logsDir = path.join(__dirname, '../../logs/performance');
    this.ensureLogsDirectory();
    this.metrics = {
      apiCalls: 0,
      responseTimes: [],
      errors: 0,
      startTime: Date.now()
    };
  }

  /**
   * Ensure logs directory exists
   */
  ensureLogsDirectory() {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  /**
   * Start timing an operation
   */
  startTimer(operation) {
    return {
      operation,
      startTime: Date.now(),
      stop: () => this.stopTimer(operation, Date.now())
    };
  }

  /**
   * Stop timing an operation
   */
  stopTimer(operation, endTime) {
    const duration = endTime - this.startTime;
    this.metrics.responseTimes.push({
      operation,
      duration,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 1000 measurements
    if (this.metrics.responseTimes.length > 1000) {
      this.metrics.responseTimes = this.metrics.responseTimes.slice(-1000);
    }
    
    return duration;
  }

  /**
   * Record API call
   */
  recordApiCall(endpoint, method, duration, statusCode) {
    this.metrics.apiCalls++;
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      endpoint,
      method,
      duration,
      statusCode,
      success: statusCode < 400
    };
    
    this.logToFile('api_calls.log', logEntry);
    
    if (statusCode >= 400) {
      this.metrics.errors++;
    }
  }

  /**
   * Record error
   */
  recordError(operation, error, context = {}) {
    this.metrics.errors++;
    
    const errorEntry = {
      timestamp: new Date().toISOString(),
      operation,
      error: error.message || error,
      stack: error.stack,
      context
    };
    
    this.logToFile('errors.log', errorEntry);
  }

  /**
   * Log entry to file
   */
  logToFile(filename, entry) {
    try {
      const logPath = path.join(this.logsDir, filename);
      const logLine = JSON.stringify(entry) + '\n';
      
      fs.appendFileSync(logPath, logLine);
    } catch (error) {
      console.error('Error writing to log file:', error.message);
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    const now = Date.now();
    const uptime = now - this.metrics.startTime;
    
    // Calculate response time statistics
    const responseTimes = this.metrics.responseTimes.map(r => r.duration);
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;
    
    const sortedTimes = [...responseTimes].sort((a, b) => a - b);
    const medianResponseTime = sortedTimes.length > 0
      ? sortedTimes[Math.floor(sortedTimes.length / 2)]
      : 0;
    
    const p95ResponseTime = sortedTimes.length > 0
      ? sortedTimes[Math.floor(sortedTimes.length * 0.95)]
      : 0;
    
    const p99ResponseTime = sortedTimes.length > 0
      ? sortedTimes[Math.floor(sortedTimes.length * 0.99)]
      : 0;
    
    return {
      uptime: {
        total: uptime,
        formatted: this.formatDuration(uptime)
      },
      apiCalls: {
        total: this.metrics.apiCalls,
        errors: this.metrics.errors,
        successRate: this.metrics.apiCalls > 0 
          ? ((this.metrics.apiCalls - this.metrics.errors) / this.metrics.apiCalls * 100).toFixed(2)
          : 100
      },
      responseTimes: {
        count: responseTimes.length,
        average: Math.round(avgResponseTime),
        median: Math.round(medianResponseTime),
        p95: Math.round(p95ResponseTime),
        p99: Math.round(p99ResponseTime),
        min: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
        max: responseTimes.length > 0 ? Math.max(...responseTimes) : 0
      },
      performance: {
        excellent: responseTimes.filter(t => t < 50).length,
        good: responseTimes.filter(t => t >= 50 && t < 100).length,
        acceptable: responseTimes.filter(t => t >= 100 && t < 200).length,
        slow: responseTimes.filter(t => t >= 200).length
      }
    };
  }

  /**
   * Format duration in human readable format
   */
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    if (seconds > 0) return `${seconds}s`;
    return `${ms}ms`;
  }

  /**
   * Generate performance report
   */
  generateReport() {
    const metrics = this.getMetrics();
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        status: this.getPerformanceStatus(metrics),
        overallHealth: this.calculateHealthScore(metrics)
      },
      metrics,
      recommendations: this.generateRecommendations(metrics)
    };
    
    // Save report
    const reportPath = path.join(this.logsDir, `performance_report_${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    return report;
  }

  /**
   * Get performance status
   */
  getPerformanceStatus(metrics) {
    const avgResponse = metrics.responseTimes.average;
    
    if (avgResponse < 50) return 'EXCELLENT';
    if (avgResponse < 100) return 'GOOD';
    if (avgResponse < 200) return 'ACCEPTABLE';
    if (avgResponse < 500) return 'NEEDS_ATTENTION';
    return 'CRITICAL';
  }

  /**
   * Calculate health score (0-100)
   */
  calculateHealthScore(metrics) {
    let score = 100;
    
    // Response time penalty
    const avgResponse = metrics.responseTimes.average;
    if (avgResponse > 200) score -= 30;
    else if (avgResponse > 100) score -= 15;
    else if (avgResponse > 50) score -= 5;
    
    // Error rate penalty
    const errorRate = 100 - parseFloat(metrics.apiCalls.successRate);
    score -= errorRate * 0.5;
    
    return Math.max(0, Math.round(score));
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations(metrics) {
    const recommendations = [];
    
    if (metrics.responseTimes.average > 200) {
      recommendations.push({
        priority: 'HIGH',
        category: 'PERFORMANCE',
        message: 'Average response time is too high. Consider database optimization and caching.',
        action: 'Review database queries and implement caching layer'
      });
    }
    
    if (metrics.responseTimes.p95 > 500) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'PERFORMANCE',
        message: '95th percentile response time is high. Some requests are experiencing delays.',
        action: 'Identify slow queries and optimize them'
      });
    }
    
    if (parseFloat(metrics.apiCalls.successRate) < 95) {
      recommendations.push({
        priority: 'HIGH',
        category: 'RELIABILITY',
        message: 'Error rate is above 5%. Investigate API failures.',
        action: 'Review error logs and fix underlying issues'
      });
    }
    
    if (metrics.responseTimes.count < 100) {
      recommendations.push({
        priority: 'LOW',
        category: 'MONITORING',
        message: 'Limited performance data available. Continue monitoring.',
        action: 'Allow more time for data collection'
      });
    }
    
    return recommendations;
  }

  /**
   * Clear old logs (keep last 7 days)
   */
  cleanupOldLogs() {
    try {
      const files = fs.readdirSync(this.logsDir);
      const now = Date.now();
      const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
      
      files.forEach(file => {
        if (file.endsWith('.log') || file.endsWith('.json')) {
          const filePath = path.join(this.logsDir, file);
          const stats = fs.statSync(filePath);
          
          if (stats.mtime.getTime() < sevenDaysAgo) {
            fs.unlinkSync(filePath);
            console.log(`🗑️ Cleaned up old log: ${file}`);
          }
        }
      });
    } catch (error) {
      console.error('Error cleaning up old logs:', error.message);
    }
  }
}

module.exports = PerformanceMonitor;
