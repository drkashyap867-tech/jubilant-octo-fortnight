#!/usr/bin/env node

/**
 * 🚀 Comprehensive Import Processor for Medical College Data
 * Handles Medical, Dental, and DNB Excel files with standardized data
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const DatabaseVersioning = require('./database-versioning');
const RealTimeValidation = require('./real-time-validation');
const PerformanceMonitor = require('./performance-monitor');
const VersionControlManager = require('./version-control-manager');

class ComprehensiveImportProcessor {
  constructor() {
    this.versioning = new DatabaseVersioning();
    this.validation = new RealTimeValidation();
    this.performance = new PerformanceMonitor();
    this.versionControl = new VersionControlManager();
    
    this.importsPath = path.join(__dirname, '../data/imports');
    this.processedPath = path.join(__dirname, '../data/processed');
    this.enhancedPath = path.join(__dirname, '../data/enhanced');
    
    this.ensureDirectories();
    this.importStats = {
      startTime: null,
      endTime: null,
      totalFiles: 0,
      totalRecords: 0,
      successfulRecords: 0,
      failedRecords: 0,
      errors: []
    };
  }

  /**
   * Ensure all necessary directories exist
   */
  ensureDirectories() {
    [this.importsPath, this.processedPath, this.enhancedPath].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Get available import files
   */
  getAvailableImports() {
    const imports = {
      medical: [],
      dental: [],
      dnb: []
    };

    try {
      // Check medical imports
      const medicalPath = path.join(this.importsPath, 'medical');
      if (fs.existsSync(medicalPath)) {
        imports.medical = fs.readdirSync(medicalPath)
          .filter(f => f.endsWith('.xlsx'))
          .map(f => ({ name: f, path: path.join(medicalPath, f) }));
      }

      // Check dental imports
      const dentalPath = path.join(this.importsPath, 'dental');
      if (fs.existsSync(dentalPath)) {
        imports.dental = fs.readdirSync(dentalPath)
          .filter(f => f.endsWith('.xlsx'))
          .map(f => ({ name: f, path: path.join(dentalPath, f) }));
      }

      // Check DNB imports
      const dnbPath = path.join(this.importsPath, 'dnb');
      if (fs.existsSync(dnbPath)) {
        imports.dnb = fs.readdirSync(dnbPath)
          .filter(f => f.endsWith('.xlsx'))
          .map(f => ({ name: f, path: path.join(dnbPath, f) }));
      }
    } catch (error) {
      console.error('Error checking available imports:', error.message);
    }

    return imports;
  }

  /**
   * Display import status
   */
  displayImportStatus() {
    const imports = this.getAvailableImports();
    
    console.log('📊 Available Import Files\n');
    console.log('─'.repeat(80));
    
    Object.entries(imports).forEach(([type, files]) => {
      const status = files.length > 0 ? '✅' : '❌';
      console.log(`${type.toUpperCase().padEnd(12)} | Files: ${status} | Count: ${files.length}`);
      
      files.forEach(file => {
        console.log(`           | └─ ${file.name}`);
      });
      
      console.log('─'.repeat(80));
    });

    // Check processed data
    console.log('\n📁 Processed Data Status\n');
    console.log('─'.repeat(80));
    
    const processedFiles = ['medical_processed.json', 'dental_processed.json', 'dnb_processed.json'];
    processedFiles.forEach(file => {
      const filePath = path.join(this.processedPath, file);
      const exists = fs.existsSync(filePath);
      const status = exists ? '✅' : '❌';
      const size = exists ? `${(fs.statSync(filePath).size / 1024).toFixed(1)}KB` : 'N/A';
      
      console.log(`${file.padEnd(25)} | Status: ${status} | Size: ${size}`);
    });
    
    console.log('─'.repeat(80));
  }

  /**
   * Process all available imports
   */
  async processAllImports() {
    console.log('🚀 Starting comprehensive import process...\n');
    
    this.importStats.startTime = new Date();
    const imports = this.getAvailableImports();
    
    const results = {};
    
    // Process medical imports
    if (imports.medical.length > 0) {
      console.log('🏥 Processing Medical Data...');
      results.medical = await this.processMedicalImport(imports.medical[0]);
    }
    
    // Process dental imports
    if (imports.dental.length > 0) {
      console.log('🦷 Processing Dental Data...');
      results.dental = await this.processDentalImport(imports.dental[0]);
    }
    
    // Process DNB imports
    if (imports.dnb.length > 0) {
      console.log('🏥 Processing DNB Data...');
      results.dnb = await this.processDNBImport(imports.dnb[0]);
    }
    
    this.importStats.endTime = new Date();
    
    // Create automatic backup if large changes detected
    await this.createAutomaticBackups(results);
    
    // Generate comprehensive report
    this.generateImportReport(results);
    
    return results;
  }

  /**
   * Process medical import file
   */
  async processMedicalImport(fileInfo) {
    try {
      console.log(`   📁 Processing: ${fileInfo.name}`);
      
      const workbook = XLSX.readFile(fileInfo.path);
      const sheetNames = workbook.SheetNames;
      const worksheet = workbook.Sheets[sheetNames[0]];
      
      // Convert to JSON with headers
      const rawData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',
        blankrows: false
      });
      
      if (rawData.length < 2) {
        throw new Error('Insufficient data in Excel file (need at least header + 1 row)');
      }
      
      const headers = rawData[0];
      const dataRows = rawData.slice(1);
      
      console.log(`   📊 Found ${dataRows.length} data rows with ${headers.length} columns`);
      
      // Convert to structured data
      const structuredData = this.convertToStructuredData(headers, dataRows, 'medical');
      
      // Validate data
      console.log('   🔍 Running validation...');
      const validationResults = await this.validation.validateDataset(structuredData);
      
      // Apply corrections
      const correctedData = this.applyCorrections(structuredData, validationResults);
      
      // Save processed data
      const outputPath = await this.saveProcessedData(correctedData, fileInfo.path, {
        type: 'medical',
        createVersion: false,
        saveAsCsv: true
      });
      
      console.log(`   ✅ Medical data processed: ${correctedData.length} records`);
      
      return {
        success: true,
        data: correctedData,
        validation: validationResults,
        outputPath,
        fileInfo
      };
      
    } catch (error) {
      console.error(`   ❌ Error processing medical import: ${error.message}`);
      return {
        success: false,
        error: error.message,
        fileInfo
      };
    }
  }

  /**
   * Process dental import file
   */
  async processDentalImport(fileInfo) {
    try {
      console.log(`   📁 Processing: ${fileInfo.name}`);
      
      const workbook = XLSX.readFile(fileInfo.path);
      const sheetNames = workbook.SheetNames;
      const worksheet = workbook.Sheets[sheetNames[0]];
      
      // Convert to JSON with headers
      const rawData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',
        blankrows: false
      });
      
      if (rawData.length < 2) {
        throw new Error('Insufficient data in Excel file (need at least header + 1 row)');
      }
      
      const headers = rawData[0];
      const dataRows = rawData.slice(1);
      
      console.log(`   📊 Found ${dataRows.length} data rows with ${headers.length} columns`);
      
      // Convert to structured data
      const structuredData = this.convertToStructuredData(headers, dataRows, 'dental');
      
      // Validate data
      console.log('   🔍 Running validation...');
      const validationResults = await this.validation.validateDataset(structuredData);
      
      // Apply corrections
      const correctedData = this.applyCorrections(structuredData, validationResults);
      
      // Save processed data
      const outputPath = await this.saveProcessedData(correctedData, fileInfo.path, {
        type: 'dental',
        createVersion: false,
        saveAsCsv: true
      });
      
      console.log(`   ✅ Dental data processed: ${correctedData.length} records`);
      
      return {
        success: true,
        data: correctedData,
        validation: validationResults,
        outputPath,
        fileInfo
      };
      
    } catch (error) {
      console.error(`   ❌ Error processing dental import: ${error.message}`);
      return {
        success: false,
        error: error.message,
        fileInfo
      };
    }
  }

  /**
   * Process DNB import file
   */
  async processDNBImport(fileInfo) {
    try {
      console.log(`   📁 Processing: ${fileInfo.name}`);
      
      const workbook = XLSX.readFile(fileInfo.path);
      const sheetNames = workbook.SheetNames;
      const worksheet = workbook.Sheets[sheetNames[0]];
      
      // Convert to JSON with headers
      const rawData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',
        blankrows: false
      });
      
      if (rawData.length < 2) {
        throw new Error('Insufficient data in Excel file (need at least header + 1 row)');
      }
      
      const headers = rawData[0];
      const dataRows = rawData.slice(1);
      
      console.log(`   📊 Found ${dataRows.length} data rows with ${headers.length} columns`);
      
      // Convert to structured data
      const structuredData = this.convertToStructuredData(headers, dataRows, 'dnb');
      
      // Validate data
      console.log('   🔍 Running validation...');
      const validationResults = await this.validation.validateDataset(structuredData);
      
      // Apply corrections
      const correctedData = this.applyCorrections(structuredData, validationResults);
      
      // Save processed data
      const outputPath = await this.saveProcessedData(correctedData, fileInfo.path, {
        type: 'dnb',
        createVersion: false,
        saveAsCsv: true
      });
      
      console.log(`   ✅ DNB data processed: ${correctedData.length} records`);
      
      return {
        success: true,
        data: correctedData,
        validation: validationResults,
        outputPath,
        fileInfo
      };
      
    } catch (error) {
      console.error(`   ❌ Error processing DNB import: ${error.message}`);
      return {
        success: false,
        error: error.message,
        fileInfo
      };
    }
  }

  /**
   * Convert raw Excel data to structured format
   */
  convertToStructuredData(headers, dataRows, dataType) {
    const structuredData = [];
    
    dataRows.forEach((row, rowIndex) => {
      const record = {};
      
      headers.forEach((header, colIndex) => {
        if (header && header.trim()) {
          const cleanHeader = this.cleanHeader(header);
          const value = row[colIndex] || '';
          
          // Apply data type conversion
          record[cleanHeader] = this.convertDataType(cleanHeader, value);
        }
      });
      
      // Add metadata
      record._row_index = rowIndex + 2;
      record._data_type = dataType;
      record._import_timestamp = new Date().toISOString();
      
      if (Object.keys(record).length > 3) { // More than just metadata
        structuredData.push(record);
      }
    });
    
    return structuredData;
  }

  /**
   * Clean header names
   */
  cleanHeader(header) {
    return header
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  /**
   * Convert data types based on field names
   */
  convertDataType(fieldName, value) {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    
    const stringValue = value.toString().trim();
    
    // Numeric fields
    if (fieldName.includes('seat') || fieldName.includes('year') || fieldName.includes('rank') || fieldName.includes('fee')) {
      const numValue = parseInt(stringValue);
      return isNaN(numValue) ? null : numValue;
    }
    
    // Boolean fields
    if (fieldName.includes('status') || fieldName.includes('active')) {
      const lowerValue = stringValue.toLowerCase();
      if (lowerValue === 'yes' || lowerValue === 'true' || lowerValue === '1') return true;
      if (lowerValue === 'no' || lowerValue === 'false' || lowerValue === '0') return false;
      return stringValue;
    }
    
    // Date fields
    if (fieldName.includes('date') || fieldName.includes('year')) {
      const dateValue = new Date(stringValue);
      return isNaN(dateValue.getTime()) ? stringValue : dateValue.toISOString().split('T')[0];
    }
    
    // Default to string
    return stringValue;
  }

  /**
   * Apply corrections from validation
   */
  applyCorrections(data, validationResults) {
    const correctedData = [...data];
    
    validationResults.records.forEach(record => {
      if (record.corrections.length > 0) {
        const dataIndex = record.rowIndex - 2;
        if (dataIndex >= 0 && dataIndex < correctedData.length) {
          record.corrections.forEach(correction => {
            correctedData[dataIndex][correction.field] = correction.correctedValue;
          });
        }
      }
    });
    
    return correctedData;
  }

  /**
   * Save processed data
   */
  async saveProcessedData(data, originalFilePath, options = {}) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const originalName = path.basename(originalFilePath, path.extname(originalFilePath));
    const outputDir = this.processedPath;
    
    // Generate output filename
    const outputFilename = `${options.type}_processed.json`;
    const outputPath = path.join(outputDir, outputFilename);
    
    // Save as JSON
    const outputData = {
      metadata: {
        originalFile: path.basename(originalFilePath),
        processedAt: new Date().toISOString(),
        totalRecords: data.length,
        dataType: options.type,
        validationResults: options.validation ? {
          validRecords: options.validation.validRecords,
          invalidRecords: options.validation.invalidRecords,
          totalErrors: options.validation.totalErrors,
          totalWarnings: options.validation.totalWarnings,
          totalCorrections: options.validation.totalCorrections
        } : null
      },
      data: data
    };
    
    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
    
    // Also save as CSV if requested
    if (options.saveAsCsv) {
      const csvPath = outputPath.replace('.json', '.csv');
      await this.saveAsCSV(data, csvPath);
    }
    
    return outputPath;
  }

  /**
   * Save data as CSV
   */
  async saveAsCSV(data, outputPath) {
    try {
      if (data.length === 0) return;
      
      const headers = Object.keys(data[0]).filter(key => !key.startsWith('_'));
      const csvRows = [headers.join(',')];
      
      data.forEach(record => {
        const row = headers.map(header => {
          const value = record[header];
          if (value === null || value === undefined) return '';
          
          // Escape commas and quotes in CSV
          const stringValue = value.toString();
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        });
        csvRows.push(row.join(','));
      });
      
      fs.writeFileSync(outputPath, csvRows.join('\n'));
    } catch (error) {
      console.error('Error saving CSV:', error.message);
    }
  }

  /**
   * Create automatic backups when necessary (not manual versions)
   */
  async createAutomaticBackups(results) {
    try {
      const totalRecords = Object.values(results).reduce((sum, result) => {
        return sum + (result.success ? result.data.length : 0);
      }, 0);
      
      console.log(`🔄 Checking if automatic backup is needed for ${totalRecords} records...`);
      
      // Create backup for large imports
      if (totalRecords > 0) {
        const backupResult = await this.versionControl.createImportBackup('comprehensive', totalRecords);
        
        if (backupResult.success) {
          console.log(`✅ Automatic backup created: ${backupResult.backupId}`);
          console.log(`📝 Reason: ${backupResult.reason}`);
        } else if (backupResult.reason === 'not_large_enough') {
          console.log(`ℹ️  No automatic backup needed (${totalRecords} records below threshold)`);
        } else {
          console.log(`ℹ️  Automatic backup not created: ${backupResult.reason}`);
        }
      }
      
    } catch (error) {
      console.error('❌ Error creating automatic backups:', error.message);
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
    
    return `2.${year}${month}${day}.${hour}${minute}`;
  }

  /**
   * Generate comprehensive import report
   */
  generateImportReport(results) {
    const report = {
      timestamp: new Date().toISOString(),
      importStats: this.importStats,
      results: results,
      summary: this.generateSummary(results)
    };
    
    // Save report
    const reportPath = path.join(this.processedPath, `comprehensive_import_report_${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Display summary
    this.displayImportSummary(report);
    
    return report;
  }

  /**
   * Generate import summary
   */
  generateSummary(results) {
    const summary = {
      totalDataTypes: Object.keys(results).length,
      successfulImports: Object.values(results).filter(r => r.success).length,
      totalRecords: Object.values(results).reduce((sum, result) => {
        return sum + (result.success ? result.data.length : 0);
      }, 0),
      successRate: 0
    };
    
    summary.successRate = ((summary.successfulImports / summary.totalDataTypes) * 100).toFixed(2);
    
    return summary;
  }

  /**
   * Display import summary
   */
  displayImportSummary(report) {
    console.log('\n📊 Import Summary\n');
    console.log('─'.repeat(80));
    
    Object.entries(report.results).forEach(([type, result]) => {
      const status = result.success ? '✅' : '❌';
      const records = result.success ? result.data.length : 'N/A';
      const message = result.success ? 'Success' : result.error;
      
      console.log(`${type.toUpperCase().padEnd(12)} | Status: ${status} | Records: ${records} | ${message}`);
    });
    
    console.log('─'.repeat(80));
    console.log(`Total Records: ${report.summary.totalRecords}`);
    console.log(`Success Rate: ${report.summary.successRate}%`);
    console.log(`Report Saved: comprehensive_import_report_*.json`);
  }
}

// CLI interface
async function main() {
  const processor = new ComprehensiveImportProcessor();
  const command = process.argv[2];
  
  switch (command) {
    case 'status':
      processor.displayImportStatus();
      break;
      
    case 'import':
      const type = process.argv[3];
      if (type && ['medical', 'dental', 'dnb'].includes(type)) {
        console.log(`🚀 Importing ${type} data...`);
        if (type === 'medical') {
          const imports = processor.getAvailableImports();
          if (imports.medical.length > 0) {
            await processor.processMedicalImport(imports.medical[0]);
          } else {
            console.error(`❌ No medical import files found`);
          }
        } else if (type === 'dental') {
          const imports = processor.getAvailableImports();
          if (imports.dental.length > 0) {
            await processor.processDentalImport(imports.dental[0]);
          } else {
            console.error(`❌ No dental import files found`);
          }
        } else if (type === 'dnb') {
          const imports = processor.getAvailableImports();
          if (imports.dnb.length > 0) {
            await processor.processDNBImport(imports.dnb[0]);
          } else {
            console.error(`❌ No DNB import files found`);
          }
        }
      } else if (!type) {
        await processor.processAllImports();
      } else {
        console.error(`❌ Invalid type: ${type}. Valid types: medical, dental, dnb`);
      }
      break;
      
    default:
      console.log('🚀 Comprehensive Import Processor\n');
      console.log('Usage:');
      console.log('  node scripts/comprehensive-import-processor.js status     - Show import status');
      console.log('  node scripts/comprehensive-import-processor.js import     - Import all available files');
      console.log('  node scripts/comprehensive-import-processor.js import <type> - Import specific type');
      console.log('\nValid types: medical, dental, dnb');
      break;
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = ComprehensiveImportProcessor;
