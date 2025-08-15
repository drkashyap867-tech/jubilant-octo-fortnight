const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const DatabaseVersioning = require('./database-versioning');
const RealTimeValidation = require('./real-time-validation');
const PerformanceMonitor = require('./performance-monitor');

/**
 * 🚀 Enhanced Data Processor
 * Integrates validation, versioning, and performance monitoring
 * Based on previous project architecture but simplified and robust
 */
class EnhancedDataProcessor {
  constructor() {
    this.versioning = new DatabaseVersioning();
    this.validation = new RealTimeValidation();
    this.performance = new PerformanceMonitor();
    this.processedData = [];
    this.validationResults = null;
    this.processingStats = {
      startTime: null,
      endTime: null,
      totalFiles: 0,
      totalRecords: 0,
      successfulRecords: 0,
      failedRecords: 0
    };
  }

  /**
   * Process Excel file with full validation and versioning
   */
  async processExcelFile(filePath, options = {}) {
    const timer = this.performance.startTimer('process_excel_file');
    
    try {
      console.log(`🚀 Starting enhanced processing of: ${path.basename(filePath)}`);
      
      this.processingStats.startTime = new Date();
      this.processingStats.totalFiles++;
      
      // Validate file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }
      
      // Load and parse Excel file
      const workbook = XLSX.readFile(filePath);
      const sheetNames = workbook.SheetNames;
      
      if (sheetNames.length === 0) {
        throw new Error('No sheets found in Excel file');
      }
      
      // Process first sheet by default
      const sheetName = options.sheetName || sheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      if (!worksheet) {
        throw new Error(`Sheet "${sheetName}" not found`);
      }
      
      // Convert to JSON
      const rawData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',
        blankrows: false
      });
      
      if (rawData.length < 2) {
        throw new Error('Insufficient data in Excel file (need at least header + 1 row)');
      }
      
      // Extract headers and data
      const headers = rawData[0];
      const dataRows = rawData.slice(1);
      
      console.log(`📊 Found ${dataRows.length} data rows with ${headers.length} columns`);
      
      // Convert to structured data
      const structuredData = this.convertToStructuredData(headers, dataRows);
      
      // Validate data
      console.log('🔍 Running real-time validation...');
      this.validationResults = await this.validation.validateDataset(structuredData);
      
      // Apply corrections
      const correctedData = this.applyCorrections(structuredData, this.validationResults);
      
      // Generate processing report
      const processingReport = this.generateProcessingReport(filePath, correctedData);
      
      // Save processed data
      const outputPath = await this.saveProcessedData(correctedData, filePath, options);
      
      // Create version backup
      if (options.createVersion !== false) {
        const version = options.version || this.generateVersionNumber();
        const description = options.description || `Processed ${path.basename(filePath)}`;
        
        await this.versioning.createVersion(version, description, outputPath);
      }
      
      // Update processing stats
      this.processingStats.totalRecords += correctedData.length;
      this.processingStats.successfulRecords += this.validationResults.validRecords;
      this.processingStats.failedRecords += this.validationResults.invalidRecords;
      this.processingStats.endTime = new Date();
      
      // Record performance
      const duration = timer.stop();
      this.performance.recordApiCall('process_excel_file', 'POST', duration, 200);
      
      console.log(`✅ Enhanced processing completed successfully`);
      console.log(`📊 Processed ${correctedData.length} records`);
      console.log(`✅ Valid: ${this.validationResults.validRecords}`);
      console.log(`❌ Invalid: ${this.validationResults.invalidRecords}`);
      console.log(`⚠️ Warnings: ${this.validationResults.totalWarnings}`);
      console.log(`🔧 Corrections: ${this.validationResults.totalCorrections}`);
      
      return {
        success: true,
        data: correctedData,
        validation: this.validationResults,
        report: processingReport,
        outputPath,
        stats: this.processingStats
      };
      
    } catch (error) {
      const duration = timer.stop();
      this.performance.recordError('process_excel_file', error, { filePath, options });
      this.performance.recordApiCall('process_excel_file', 'POST', duration, 500);
      
      console.error(`❌ Error processing file: ${error.message}`);
      return {
        success: false,
        error: error.message,
        stats: this.processingStats
      };
    }
  }

  /**
   * Convert raw Excel data to structured format
   */
  convertToStructuredData(headers, dataRows) {
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
      
      // Add row index for tracking
      record._row_index = rowIndex + 2; // +2 because Excel is 1-indexed and we have headers
      
      if (Object.keys(record).length > 1) { // More than just _row_index
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
    if (fieldName.includes('seat') || fieldName.includes('year') || fieldName.includes('rank')) {
      const numValue = parseInt(stringValue);
      return isNaN(numValue) ? null : numValue;
    }
    
    // Boolean fields
    if (fieldName.includes('status') || fieldName.includes('active')) {
      const lowerValue = stringValue.toLowerCase();
      if (lowerValue === 'yes' || lowerValue === 'true' || lowerValue === '1') return true;
      if (lowerValue === 'no' || lowerValue === 'false' || lowerValue === '0') return false;
      return stringValue; // Keep original if unclear
    }
    
    // Date fields
    if (fieldName.includes('date') || fieldName.includes('updated')) {
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
        const dataIndex = record.rowIndex - 2; // Convert back to array index
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
    const outputDir = options.outputDir || path.join(__dirname, '../../data/processed');
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Generate output filename
    const outputFilename = options.outputFilename || 
      `${originalName}_processed_${timestamp}.json`;
    
    const outputPath = path.join(outputDir, outputFilename);
    
    // Save as JSON
    const outputData = {
      metadata: {
        originalFile: path.basename(originalFilePath),
        processedAt: new Date().toISOString(),
        totalRecords: data.length,
        validationResults: this.validationResults ? {
          validRecords: this.validationResults.validRecords,
          invalidRecords: this.validationResults.invalidRecords,
          totalErrors: this.validationResults.totalErrors,
          totalWarnings: this.validationResults.totalWarnings,
          totalCorrections: this.validationResults.totalCorrections
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
   * Generate processing report
   */
  generateProcessingReport(filePath, data) {
    const report = {
      timestamp: new Date().toISOString(),
      file: path.basename(filePath),
      processingStats: this.processingStats,
      validationReport: this.validation ? this.validation.generateValidationReport(this.validationResults) : null,
      dataSummary: this.generateDataSummary(data)
    };
    
    // Save report
    const reportsDir = path.join(__dirname, '../../reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const reportPath = path.join(reportsDir, `processing_report_${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    return report;
  }

  /**
   * Generate data summary
   */
  generateDataSummary(data) {
    if (data.length === 0) return {};
    
    const summary = {
      totalRecords: data.length,
      fields: {},
      statistics: {}
    };
    
    // Analyze each field
    const firstRecord = data[0];
    Object.keys(firstRecord).forEach(field => {
      if (field.startsWith('_')) return; // Skip internal fields
      
      const values = data.map(record => record[field]).filter(v => v !== null && v !== undefined);
      const uniqueValues = [...new Set(values)];
      
      summary.fields[field] = {
        totalValues: values.length,
        uniqueValues: uniqueValues.length,
        dataTypes: [...new Set(values.map(v => typeof v))],
        sampleValues: uniqueValues.slice(0, 5)
      };
      
      // Generate statistics for numeric fields
      if (values.length > 0 && typeof values[0] === 'number') {
        const numericValues = values.filter(v => typeof v === 'number');
        if (numericValues.length > 0) {
          summary.statistics[field] = {
            min: Math.min(...numericValues),
            max: Math.max(...numericValues),
            average: numericValues.reduce((a, b) => a + b, 0) / numericValues.length,
            median: this.calculateMedian(numericValues)
          };
        }
      }
    });
    
    return summary;
  }

  /**
   * Calculate median
   */
  calculateMedian(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
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
   * Get processing statistics
   */
  getProcessingStats() {
    return this.processingStats;
  }

  /**
   * Get validation results
   */
  getValidationResults() {
    return this.validationResults;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return this.performance.getMetrics();
  }

  /**
   * Generate comprehensive report
   */
  generateComprehensiveReport() {
    const report = {
      timestamp: new Date().toISOString(),
      processing: this.processingStats,
      validation: this.validationResults ? this.validation.generateValidationReport(this.validationResults) : null,
      performance: this.performance.getMetrics(),
      versioning: this.versioning.getSystemStatus()
    };
    
    return report;
  }
}

module.exports = EnhancedDataProcessor;
