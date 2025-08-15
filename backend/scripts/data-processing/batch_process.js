#!/usr/bin/env node

/**
 * 🔄 Batch Excel Processing Script
 * Processes multiple Excel files from foundation data directories
 * 
 * Usage: node batch_process.js [--validate] [--verbose]
 */

const fs = require('fs');
const path = require('path');
const { program } = require('commander');
const ExcelProcessor = require('./process_excel_data');

// Configure command line interface
program
  .name('batch-processor')
  .description('Batch process Excel files for Medical College Counseling Platform')
  .version('1.0.0')
  .option('--validate', 'Run validation after processing')
  .option('--verbose', 'Verbose output')
  .option('--dry-run', 'Show what would be processed without actually processing')
  .parse();

const options = program.opts();

// Foundation data directories to process
const FOUNDATION_DIRS = [
  'colleges',
  'states', 
  'courses',
  'quotas',
  'categories'
];

class BatchProcessor {
  constructor(options) {
    this.options = options;
    this.verbose = options.verbose;
    this.validate = options.validate;
    this.dryRun = options.dryRun;
    
    this.foundationPath = path.join(__dirname, '../../data/foundation');
    this.processedCount = 0;
    this.errorCount = 0;
    this.skippedCount = 0;
  }

  /**
   * Main batch processing function
   */
  async processAll() {
    console.log('🚀 Starting batch processing of foundation data...');
    console.log(`📁 Foundation path: ${this.foundationPath}`);
    
    if (this.dryRun) {
      console.log('🔍 DRY RUN MODE - No files will be processed');
    }
    
    const startTime = Date.now();
    
    for (const dataType of FOUNDATION_DIRS) {
      await this.processDataType(dataType);
    }
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    this.generateBatchReport(duration);
  }

  /**
   * Process a specific data type directory
   */
  async processDataType(dataType) {
    const dataTypePath = path.join(this.foundationPath, dataType);
    
    if (!fs.existsSync(dataTypePath)) {
      if (this.verbose) {
        console.log(`⚠️  Directory not found: ${dataTypePath}`);
      }
      return;
    }

    console.log(`\n📊 Processing ${dataType} data...`);
    
    // Find Excel files in the directory
    const excelFiles = this.findExcelFiles(dataTypePath);
    
    if (excelFiles.length === 0) {
      console.log(`   ℹ️  No Excel files found in ${dataType}`);
      return;
    }

    console.log(`   📋 Found ${excelFiles.length} Excel file(s)`);
    
    for (const excelFile of excelFiles) {
      await this.processExcelFile(dataType, excelFile);
    }
  }

  /**
   * Find Excel files in a directory
   */
  findExcelFiles(directory) {
    const files = fs.readdirSync(directory);
    return files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.xlsx', '.xls'].includes(ext);
    }).map(file => path.join(directory, file));
  }

  /**
   * Process a single Excel file
   */
  async processExcelFile(dataType, filePath) {
    try {
      const fileName = path.basename(filePath);
      console.log(`   🔄 Processing: ${fileName}`);
      
      if (this.dryRun) {
        console.log(`      📋 Would process: ${dataType} -> ${filePath}`);
        this.skippedCount++;
        return;
      }

      const processorOptions = {
        type: dataType,
        file: filePath,
        output: path.join(__dirname, '../../data/processed'),
        verbose: this.verbose,
        validate: this.validate
      };

      const processor = new ExcelProcessor(processorOptions);
      await processor.process();
      
      this.processedCount++;
      console.log(`      ✅ Successfully processed: ${fileName}`);
      
    } catch (error) {
      this.errorCount++;
      console.error(`      ❌ Error processing ${path.basename(filePath)}: ${error.message}`);
      
      if (this.verbose) {
        console.error(`         Stack trace: ${error.stack}`);
      }
    }
  }

  /**
   * Generate batch processing report
   */
  generateBatchReport(duration) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 BATCH PROCESSING COMPLETE');
    console.log('='.repeat(60));
    
    if (this.dryRun) {
      console.log(`🔍 DRY RUN RESULTS:`);
      console.log(`   📋 Files that would be processed: ${this.skippedCount}`);
    } else {
      console.log(`📈 PROCESSING RESULTS:`);
      console.log(`   ✅ Successfully processed: ${this.processedCount}`);
      console.log(`   ❌ Errors encountered: ${this.errorCount}`);
      console.log(`   ⏱️  Total duration: ${duration.toFixed(2)} seconds`);
    }
    
    console.log(`📁 Foundation directories processed: ${FOUNDATION_DIRS.length}`);
    console.log(`   ${FOUNDATION_DIRS.join(', ')}`);
    
    if (this.errorCount > 0) {
      console.log('\n⚠️  Some files had errors. Check the logs above for details.');
    }
    
    if (!this.dryRun && this.processedCount > 0) {
      console.log('\n🎉 Foundation data processing completed successfully!');
      console.log('📁 Processed files are available in: backend/data/processed/');
      console.log('🏛️  Foundation data updated in: backend/data/foundation/');
    }
    
    console.log('='.repeat(60));
  }
}

// Main execution
async function main() {
  try {
    const processor = new BatchProcessor(options);
    await processor.processAll();
    
  } catch (error) {
    console.error(`❌ Fatal error in batch processing: ${error.message}`);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = BatchProcessor;
