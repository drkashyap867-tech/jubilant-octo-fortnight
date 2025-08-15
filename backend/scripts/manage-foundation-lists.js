#!/usr/bin/env node

/**
 * 🗂️ Foundation Lists Management Script
 * Manages all foundation data lists (states, courses, categories, quotas)
 */

const fs = require('fs');
const path = require('path');
const EnhancedDataProcessor = require('./enhanced-data-processor');
const DatabaseVersioning = require('./database-versioning');

class FoundationListsManager {
  constructor() {
    this.foundationPath = path.join(__dirname, '../data/foundation');
    this.processedPath = path.join(__dirname, '../data/processed');
    this.processor = new EnhancedDataProcessor();
    this.versioning = new DatabaseVersioning();
    
    this.dataTypes = ['states', 'courses', 'categories', 'quotas', 'colleges'];
    this.ensureDirectories();
  }

  /**
   * Ensure all necessary directories exist
   */
  ensureDirectories() {
    [this.foundationPath, this.processedPath].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Get status of all foundation lists
   */
  getListsStatus() {
    const status = {};
    
    this.dataTypes.forEach(type => {
      const foundationDir = path.join(this.foundationPath, type);
      const processedFile = path.join(this.processedPath, `${type}_processed.json`);
      
      status[type] = {
        foundation: {
          exists: fs.existsSync(foundationDir),
          files: fs.existsSync(foundationDir) ? 
            fs.readdirSync(foundationDir).filter(f => f.endsWith('.xlsx')) : [],
          lastUpdated: null
        },
        processed: {
          exists: fs.existsSync(processedFile),
          count: 0,
          lastUpdated: null
        }
      };
      
      // Get foundation file info
      if (status[type].foundation.exists && status[type].foundation.files.length > 0) {
        const filePath = path.join(foundationDir, status[type].foundation.files[0]);
        const stats = fs.statSync(filePath);
        status[type].foundation.lastUpdated = stats.mtime.toISOString();
      }
      
      // Get processed file info
      if (status[type].processed.exists) {
        try {
          const processedData = JSON.parse(fs.readFileSync(processedFile, 'utf8'));
          status[type].processed.count = processedData.data ? processedData.data.length : 0;
          status[type].processed.lastUpdated = processedData.metadata?.processedAt || null;
        } catch (error) {
          console.error(`Error reading processed ${type} data:`, error.message);
        }
      }
    });
    
    return status;
  }

  /**
   * Process all foundation lists
   */
  async processAllLists() {
    console.log('🚀 Starting processing of all foundation lists...\n');
    
    const results = {};
    const startTime = Date.now();
    
    for (const type of this.dataTypes) {
      console.log(`📊 Processing ${type}...`);
      
      try {
        const result = await this.processList(type);
        results[type] = result;
        
        if (result.success) {
          console.log(`   ✅ ${type}: ${result.data.length} records processed`);
        } else {
          console.log(`   ❌ ${type}: ${result.error}`);
        }
      } catch (error) {
        console.error(`   ❌ Error processing ${type}:`, error.message);
        results[type] = { success: false, error: error.message };
      }
      
      console.log('');
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`⏱️  Total processing time: ${totalTime}ms`);
    
    // Create version backup
    await this.createProcessingVersion(results);
    
    return results;
  }

  /**
   * Process a specific list
   */
  async processList(type) {
    const foundationDir = path.join(this.foundationPath, type);
    
    if (!fs.existsSync(foundationDir)) {
      return { success: false, error: `Foundation directory not found for ${type}` };
    }
    
    const files = fs.readdirSync(foundationDir).filter(f => f.endsWith('.xlsx'));
    if (files.length === 0) {
      return { success: false, error: `No Excel files found for ${type}` };
    }
    
    const excelPath = path.join(foundationDir, files[0]);
    
    const result = await this.processor.processExcelFile(excelPath, {
      createVersion: false, // We'll create a version after all processing
      saveAsCsv: true,
      outputDir: this.processedPath,
      outputFilename: `${type}_processed.json`,
      description: `Processed ${type} foundation data`
    });
    
    return result;
  }

  /**
   * Create a version after processing all lists
   */
  async createProcessingVersion(results) {
    try {
      const totalRecords = Object.values(results).reduce((sum, result) => {
        return sum + (result.success ? result.data.length : 0);
      }, 0);
      
      const version = this.generateVersionNumber();
      const description = `Processed ${totalRecords} foundation records across ${this.dataTypes.length} data types`;
      
      const versionResult = await this.versioning.createVersion(version, description);
      
      if (versionResult.success) {
        console.log(`✅ Version ${version} created: ${description}`);
      } else {
        console.log(`⚠️  Version creation failed: ${versionResult.error}`);
      }
    } catch (error) {
      console.error('❌ Error creating version:', error.message);
    }
  }

  /**
   * Generate version number
   */
  generateVersionNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    
    return `1.${year}${month}${day}.${hour}${minute}`;
  }

  /**
   * Validate all processed lists
   */
  async validateAllLists() {
    console.log('🔍 Validating all processed foundation lists...\n');
    
    const validationResults = {};
    
    for (const type of this.dataTypes) {
      console.log(`📊 Validating ${type}...`);
      
      try {
        const result = await this.validateList(type);
        validationResults[type] = result;
        
        if (result.success) {
          const summary = result.validation.summary;
          console.log(`   ✅ ${type}: ${summary.successRate}% success rate`);
          console.log(`   📊 Records: ${result.validation.validRecords}/${result.validation.totalRecords}`);
          console.log(`   ⚠️  Warnings: ${result.validation.totalWarnings}`);
          console.log(`   🔧 Corrections: ${result.validation.totalCorrections}`);
        } else {
          console.log(`   ❌ ${type}: ${result.error}`);
        }
      } catch (error) {
        console.error(`   ❌ Error validating ${type}:`, error.message);
        validationResults[type] = { success: false, error: error.message };
      }
      
      console.log('');
    }
    
    return validationResults;
  }

  /**
   * Validate a specific list
   */
  async validateList(type) {
    const processedFile = path.join(this.processedPath, `${type}_processed.json`);
    
    if (!fs.existsSync(processedFile)) {
      return { success: false, error: `Processed file not found for ${type}` };
    }
    
    try {
      const processedData = JSON.parse(fs.readFileSync(processedFile, 'utf8'));
      const data = processedData.data || processedData;
      
      if (!Array.isArray(data) || data.length === 0) {
        return { success: false, error: `No data found in processed ${type} file` };
      }
      
      // Use the real-time validation system
      const RealTimeValidation = require('./real-time-validation');
      const validation = new RealTimeValidation();
      
      const validationResults = await validation.validateDataset(data);
      
      return {
        success: true,
        type,
        validation: validationResults
      };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate comprehensive report
   */
  generateReport() {
    const status = this.getListsStatus();
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalDataTypes: this.dataTypes.length,
        processedTypes: Object.values(status).filter(s => s.processed.exists).length,
        foundationTypes: Object.values(status).filter(s => s.foundation.exists).length
      },
      status,
      recommendations: this.generateRecommendations(status)
    };
    
    // Save report
    const reportPath = path.join(this.processedPath, 'foundation_lists_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    return report;
  }

  /**
   * Generate recommendations based on status
   */
  generateRecommendations(status) {
    const recommendations = [];
    
    Object.entries(status).forEach(([type, typeStatus]) => {
      if (!typeStatus.foundation.exists) {
        recommendations.push({
          priority: 'HIGH',
          type,
          message: `Foundation directory missing for ${type}`,
          action: `Create directory: data/foundation/${type}`
        });
      } else if (typeStatus.foundation.files.length === 0) {
        recommendations.push({
          priority: 'HIGH',
          type,
          message: `No Excel files found for ${type}`,
          action: `Upload Excel file to data/foundation/${type}/`
        });
      } else if (!typeStatus.processed.exists) {
        recommendations.push({
          priority: 'MEDIUM',
          type,
          message: `No processed data for ${type}`,
          action: `Run: node scripts/manage-foundation-lists.js process ${type}`
        });
      } else {
        recommendations.push({
          priority: 'LOW',
          type,
          message: `${type} is up to date`,
          action: 'No action needed'
        });
      }
    });
    
    return recommendations;
  }

  /**
   * Display status in a nice format
   */
  displayStatus() {
    const status = this.getListsStatus();
    
    console.log('📊 Foundation Lists Status\n');
    console.log('─'.repeat(80));
    
    this.dataTypes.forEach(type => {
      const typeStatus = status[type];
      const foundationStatus = typeStatus.foundation.exists ? '✅' : '❌';
      const processedStatus = typeStatus.processed.exists ? '✅' : '❌';
      
      console.log(`${type.toUpperCase().padEnd(12)} | Foundation: ${foundationStatus} | Processed: ${processedStatus}`);
      
      if (typeStatus.foundation.exists && typeStatus.foundation.files.length > 0) {
        console.log(`           | Files: ${typeStatus.foundation.files.join(', ')}`);
        console.log(`           | Last Updated: ${typeStatus.foundation.lastUpdated || 'Unknown'}`);
      }
      
      if (typeStatus.processed.exists) {
        console.log(`           | Records: ${typeStatus.processed.count}`);
        console.log(`           | Processed: ${typeStatus.processed.lastUpdated || 'Unknown'}`);
      }
      
      console.log('─'.repeat(80));
    });
    
    // Display recommendations
    const recommendations = this.generateRecommendations(status);
    const highPriority = recommendations.filter(r => r.priority === 'HIGH');
    const mediumPriority = recommendations.filter(r => r.priority === 'MEDIUM');
    
    if (highPriority.length > 0 || mediumPriority.length > 0) {
      console.log('\n🎯 Recommendations:');
      
      [...highPriority, ...mediumPriority].forEach(rec => {
        const icon = rec.priority === 'HIGH' ? '🔴' : '🟡';
        console.log(`${icon} ${rec.type}: ${rec.message}`);
        console.log(`   Action: ${rec.action}`);
      });
    }
  }
}

// CLI interface
async function main() {
  const manager = new FoundationListsManager();
  const command = process.argv[2];
  
  switch (command) {
    case 'status':
      manager.displayStatus();
      break;
      
    case 'process':
      const type = process.argv[3];
      if (type && manager.dataTypes.includes(type)) {
        console.log(`🚀 Processing ${type}...`);
        const result = await manager.processList(type);
        console.log('Result:', JSON.stringify(result, null, 2));
      } else if (!type) {
        await manager.processAllLists();
      } else {
        console.error(`❌ Invalid type: ${type}. Valid types: ${manager.dataTypes.join(', ')}`);
      }
      break;
      
    case 'validate':
      await manager.validateAllLists();
      break;
      
    case 'report':
      const report = manager.generateReport();
      console.log('📊 Report generated:', report);
      break;
      
    default:
      console.log('🗂️  Foundation Lists Management Script\n');
      console.log('Usage:');
      console.log('  node scripts/manage-foundation-lists.js status     - Show status of all lists');
      console.log('  node scripts/manage-foundation-lists.js process    - Process all lists');
      console.log('  node scripts/manage-foundation-lists.js process <type> - Process specific list');
      console.log('  node scripts/manage-foundation-lists.js validate   - Validate all processed lists');
      console.log('  node scripts/manage-foundation-lists.js report     - Generate comprehensive report');
      console.log('\nValid types:', manager.dataTypes.join(', '));
      break;
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = FoundationListsManager;
