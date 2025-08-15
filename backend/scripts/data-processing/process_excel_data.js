#!/usr/bin/env node

/**
 * 🚀 Excel Data Processing Script
 * Processes Excel files from foundation data and converts them to proper formats
 * 
 * Usage: node process_excel_data.js [data_type] [file_path]
 * Example: node process_excel_data.js colleges ./foundation/colleges/colleges.xlsx
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { program } = require('commander');

// Configure command line interface
program
  .name('excel-processor')
  .description('Process Excel files for Medical College Counseling Platform')
  .version('1.0.0')
  .option('-t, --type <type>', 'Data type: colleges, states, courses, quotas, categories')
  .option('-f, --file <file>', 'Excel file path')
  .option('-o, --output <output>', 'Output directory')
  .option('-v, --verbose', 'Verbose output')
  .option('--validate', 'Run validation after processing')
  .parse();

const options = program.opts();

// Data type configurations
const DATA_TYPES = {
  colleges: {
    requiredColumns: ['college_name', 'state', 'city', 'management_type', 'establishment_year', 'total_seats'],
    outputFormats: ['csv', 'json'],
    validationRules: './validation_rules.json'
  },
  states: {
    requiredColumns: ['state_name', 'state_code', 'capital', 'region'],
    outputFormats: ['csv', 'json'],
    validationRules: './state_validation.json'
  },
  courses: {
    requiredColumns: ['course_name', 'course_code', 'duration', 'type', 'eligibility'],
    outputFormats: ['csv', 'json'],
    validationRules: './course_validation.json'
  },
  quotas: {
    requiredColumns: ['quota_category', 'percentage', 'state', 'eligibility_criteria'],
    outputFormats: ['csv', 'json'],
    validationRules: './quota_validation.json'
  },
  categories: {
    requiredColumns: ['category_name', 'category_code', 'description', 'parent_category'],
    outputFormats: ['csv', 'json'],
    validationRules: './category_validation.json'
  }
};

class ExcelProcessor {
  constructor(options) {
    this.options = options;
    this.dataType = options.type;
    this.inputFile = options.file;
    this.outputDir = options.output || './processed';
    this.verbose = options.verbose;
    this.validate = options.validate;
    
    this.config = DATA_TYPES[this.dataType];
    if (!this.config) {
      throw new Error(`Invalid data type: ${this.dataType}. Valid types: ${Object.keys(DATA_TYPES).join(', ')}`);
    }
  }

  /**
   * Main processing function
   */
  async process() {
    try {
      console.log(`🚀 Processing ${this.dataType} data from ${this.inputFile}`);
      
      // Read Excel file
      const workbook = this.readExcelFile();
      
      // Extract data from all sheets
      const data = this.extractData(workbook);
      
      // Validate data structure
      this.validateDataStructure(data);
      
      // Clean and process data
      const processedData = this.cleanData(data);
      
      // Validate data content
      if (this.validate) {
        this.validateDataContent(processedData);
      }
      
      // Export to different formats
      await this.exportData(processedData);
      
      // Generate processing report
      this.generateReport(processedData);
      
      console.log(`✅ Successfully processed ${processedData.length} records`);
      
    } catch (error) {
      console.error(`❌ Error processing data: ${error.message}`);
      process.exit(1);
    }
  }

  /**
   * Read Excel file and return workbook
   */
  readExcelFile() {
    if (!fs.existsSync(this.inputFile)) {
      throw new Error(`File not found: ${this.inputFile}`);
    }

    const fileExtension = path.extname(this.inputFile).toLowerCase();
    if (!['.xlsx', '.xls'].includes(fileExtension)) {
      throw new Error(`Invalid file format. Expected .xlsx or .xls, got ${fileExtension}`);
    }

    try {
      const workbook = XLSX.readFile(this.inputFile);
      if (this.verbose) {
        console.log(`📖 Excel file loaded successfully`);
        console.log(`📊 Sheets found: ${workbook.SheetNames.join(', ')}`);
      }
      return workbook;
    } catch (error) {
      throw new Error(`Failed to read Excel file: ${error.message}`);
    }
  }

  /**
   * Extract data from all sheets
   */
  extractData(workbook) {
    const allData = [];
    
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (sheetData.length > 1) { // Skip empty sheets
        const headers = sheetData[0];
        const rows = sheetData.slice(1);
        
        rows.forEach((row, index) => {
          if (row.some(cell => cell !== null && cell !== undefined && cell !== '')) {
            const rowData = {};
            headers.forEach((header, colIndex) => {
              if (header && row[colIndex] !== undefined) {
                rowData[header.trim()] = row[colIndex];
              }
            });
            allData.push(rowData);
          }
        });
        
        if (this.verbose) {
          console.log(`📋 Sheet '${sheetName}': ${rows.length} rows processed`);
        }
      }
    });
    
    return allData;
  }

  /**
   * Validate data structure
   */
  validateDataStructure(data) {
    if (!data || data.length === 0) {
      throw new Error('No data found in Excel file');
    }

    const firstRow = data[0];
    const missingColumns = this.config.requiredColumns.filter(col => !(col in firstRow));
    
    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
    }

    if (this.verbose) {
      console.log(`✅ Data structure validation passed`);
      console.log(`📊 Found columns: ${Object.keys(firstRow).join(', ')}`);
    }
  }

  /**
   * Clean and process data
   */
  cleanData(data) {
    return data.map((row, index) => {
      const cleanedRow = {};
      
      Object.keys(row).forEach(key => {
        let value = row[key];
        
        // Clean string values
        if (typeof value === 'string') {
          value = value.trim();
          if (value === '') value = null;
        }
        
        // Clean numeric values
        if (typeof value === 'number' && isNaN(value)) {
          value = null;
        }
        
        // Convert empty strings to null
        if (value === '') value = null;
        
        cleanedRow[key] = value;
      });
      
      // Add processing metadata
      cleanedRow._processed_at = new Date().toISOString();
      cleanedRow._source_file = path.basename(this.inputFile);
      cleanedRow._row_index = index + 1;
      
      return cleanedRow;
    }).filter(row => {
      // Filter out completely empty rows
      return Object.values(row).some(value => 
        value !== null && value !== undefined && value !== ''
      );
    });
  }

  /**
   * Validate data content
   */
  validateDataContent(data) {
    const errors = [];
    
    data.forEach((row, index) => {
      // Check for required field values
      this.config.requiredColumns.forEach(col => {
        if (!row[col] || row[col] === null || row[col] === '') {
          errors.push(`Row ${index + 1}: Missing required value for '${col}'`);
        }
      });
      
      // Type-specific validations
      if (this.dataType === 'colleges') {
        if (row.establishment_year && (row.establishment_year < 1800 || row.establishment_year > new Date().getFullYear())) {
          errors.push(`Row ${index + 1}: Invalid establishment year '${row.establishment_year}'`);
        }
        if (row.total_seats && (row.total_seats < 0 || row.total_seats > 10000)) {
          errors.push(`Row ${index + 1}: Invalid total seats '${row.total_seats}'`);
        }
      }
    });
    
    if (errors.length > 0) {
      console.warn(`⚠️  Validation warnings (${errors.length}):`);
      errors.forEach(error => console.warn(`   ${error}`));
    } else if (this.verbose) {
      console.log(`✅ Data content validation passed`);
    }
  }

  /**
   * Export data to different formats
   */
  async exportData(data) {
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseFileName = `${this.dataType}_${timestamp}`;

    // Export to CSV
    if (this.config.outputFormats.includes('csv')) {
      const csvPath = path.join(this.outputDir, `${baseFileName}.csv`);
      this.exportToCSV(data, csvPath);
      if (this.verbose) console.log(`📄 CSV exported to: ${csvPath}`);
    }

    // Export to JSON
    if (this.config.outputFormats.includes('json')) {
      const jsonPath = path.join(this.outputDir, `${baseFileName}.json`);
      this.exportToJSON(data, jsonPath);
      if (this.verbose) console.log(`📄 JSON exported to: ${jsonPath}`);
    }

    // Export processed data to foundation directory
    const foundationPath = path.join(__dirname, '../../data/foundation', this.dataType);
    if (fs.existsSync(foundationPath)) {
      const foundationCSV = path.join(foundationPath, `processed_${this.dataType}.csv`);
      const foundationJSON = path.join(foundationPath, `processed_${this.dataType}.json`);
      
      this.exportToCSV(data, foundationCSV);
      this.exportToJSON(data, foundationJSON);
      
      if (this.verbose) {
        console.log(`🏛️  Foundation data updated:`);
        console.log(`   📄 ${foundationCSV}`);
        console.log(`   📄 ${foundationJSON}`);
      }
    }
  }

  /**
   * Export data to CSV format
   */
  exportToCSV(data, filePath) {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          let value = row[header];
          if (typeof value === 'string' && value.includes(',')) {
            value = `"${value}"`;
          }
          return value || '';
        }).join(',')
      )
    ].join('\n');
    
    fs.writeFileSync(filePath, csvContent, 'utf8');
  }

  /**
   * Export data to JSON format
   */
  exportToJSON(data, filePath) {
    const jsonContent = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, jsonContent, 'utf8');
  }

  /**
   * Generate processing report
   */
  generateReport(data) {
    const report = {
      timestamp: new Date().toISOString(),
      dataType: this.dataType,
      inputFile: this.inputFile,
      totalRecords: data.length,
      columns: Object.keys(data[0] || {}),
      processingStats: {
        successfulRecords: data.length,
        validationErrors: 0,
        processingTime: new Date().toISOString()
      }
    };

    const reportPath = path.join(this.outputDir, `processing_report_${this.dataType}_${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    if (this.verbose) {
      console.log(`📊 Processing report saved to: ${reportPath}`);
    }
  }
}

// Main execution
async function main() {
  try {
    if (!options.type || !options.file) {
      console.error('❌ Error: Both --type and --file options are required');
      console.log('Usage: node process_excel_data.js --type colleges --file ./data.xlsx');
      process.exit(1);
    }

    const processor = new ExcelProcessor(options);
    await processor.process();
    
  } catch (error) {
    console.error(`❌ Fatal error: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = ExcelProcessor;
