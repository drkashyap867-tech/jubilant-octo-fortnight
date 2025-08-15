const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

class DebugVerticalDataFlow {
  constructor() {
    this.debugData = [];
  }

  async debugAIQFile(filePath) {
    try {
      const filename = path.basename(filePath);
      console.log(`\n🔍 DEBUGGING: ${filename}`);

      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      console.log(`📋 Total rows: ${rawData.length}`);
      console.log(`📋 Total columns: ${rawData[0]?.length || 0}`);

      // Debug first few columns in detail
      const maxColsToDebug = Math.min(5, rawData[0]?.length || 0);

      for (let colIndex = 0; colIndex < maxColsToDebug; colIndex++) {
        console.log(`\n🔍 COLUMN ${colIndex}:`);

        const header = rawData[0][colIndex];
        console.log(`  Header: "${header}"`);

        // Extract college name
        const collegeName = this.extractCollegeName(header);
        console.log(`  College: "${collegeName}"`);

        // Debug first 20 rows of this column
        const columnData = [];
        for (let rowIndex = 1; rowIndex < Math.min(21, rawData.length); rowIndex++) {
          const cellValue = rawData[rowIndex]?.[colIndex];
          if (cellValue && cellValue.toString().trim() !== '') {
            columnData.push({
              row: rowIndex,
              value: cellValue.toString().trim(),
              type: this.analyzeCellType(cellValue.toString().trim())
            });
          }
        }

        console.log(`  First 20 non-empty cells:`);
        columnData.forEach(cell => {
          console.log(`    Row ${cell.row}: "${cell.value}" (${cell.type})`);
        });

        // Analyze data flow pattern
        this.analyzeDataFlowPattern(columnData, collegeName);
      }

    } catch (error) {
      console.error(`❌ Error debugging ${filePath}:`, error.message);
    }
  }

  extractCollegeName(header) {
    if (!header) return null;
    const parts = header.toString().split(',');
    return parts[0].trim();
  }

  analyzeCellType(value) {
    if (this.isCourse(value)) return 'COURSE';
    if (this.isQuota(value)) return 'QUOTA';
    if (this.isCategory(value)) return 'CATEGORY';
    if (this.isRank(value)) return 'RANK';
    return 'UNKNOWN';
  }

  isCourse(value) {
    const coursePatterns = [
      /^M\.D\./i, /^M\.S\./i, /^MBBS/i, /^BDS/i, /^MDS/i, /^DNB/i, /^DIPLOMA/i,
      /^GENERAL MEDICINE/i, /^SURGERY/i, /^PEDIATRICS/i, /^OBSTETRICS/i, /^GYNECOLOGY/i,
      /^PSYCHIATRY/i, /^DERMATOLOGY/i, /^ORTHOPEDICS/i, /^RADIOLOGY/i, /^ANESTHESIA/i
    ];
    return coursePatterns.some(pattern => pattern.test(value));
  }

  isQuota(value) {
    const quotaPatterns = [
      /^ALL INDIA$/i, /^ALL INDIA QUOTA$/i, /^CENTRAL QUOTA$/i, /^STATE QUOTA$/i,
      /^MANAGEMENT QUOTA$/i, /^PAID SEATS QUOTA$/i, /^NRI QUOTA$/i,
      /^MANAGEMENT\/PAID SEATS QUOTA$/i, /^MANAGEMENT\/ PAID SEATS QUOTA$/i,
      /^NON-RESIDENT INDIAN$/i, /^NRI$/i, /^FOREIGN$/i, /^OVERSEAS$/i,
      /^INTERNATIONAL$/i, /^MANAGEMENT\/ PAID SEATS QUOTA$/i
    ];
    return quotaPatterns.some(pattern => pattern.test(value));
  }

  isCategory(value) {
    const categoryPatterns = [
      /^OPEN$/i, /^OBC$/i, /^SC$/i, /^ST$/i, /^EWS$/i, /^PH$/i, /^PWD$/i,
      /^GENERAL$/i, /^UR$/i, /^RESERVED$/i, /^UNRESERVED$/i
    ];
    return categoryPatterns.some(pattern => pattern.test(value));
  }

  isRank(value) {
    const cleanValue = value.replace(/\s+/g, '');
    return /^\d+$/.test(cleanValue);
  }

  analyzeDataFlowPattern(columnData, collegeName) {
    console.log(`  📊 Data Flow Analysis for "${collegeName}":`);

    let courseCount = 0, quotaCount = 0, categoryCount = 0, rankCount = 0;
    let pattern = [];

    columnData.forEach(cell => {
      pattern.push(cell.type);
      switch (cell.type) {
        case 'COURSE': courseCount++; break;
        case 'QUOTA': quotaCount++; break;
        case 'CATEGORY': categoryCount++; break;
        case 'RANK': rankCount++; break;
      }
    });

    console.log(`    Pattern: ${pattern.join(' → ')}`);
    console.log(`    Counts: Course(${courseCount}), Quota(${quotaCount}), Category(${categoryCount}), Rank(${rankCount})`);

    // Identify potential issues
    if (courseCount === 0) console.log(`    ⚠️  NO COURSES DETECTED!`);
    if (quotaCount === 0) console.log(`    ⚠️  NO QUOTAS DETECTED!`);
    if (categoryCount === 0) console.log(`    ⚠️  NO CATEGORIES DETECTED!`);
    if (rankCount === 0) console.log(`    ⚠️  NO RANKS DETECTED!`);

    // Check for complete records
    const potentialRecords = Math.min(courseCount, quotaCount, categoryCount, rankCount);
    console.log(`    💡 Potential complete records: ${potentialRecords}`);

    if (potentialRecords === 0) {
      console.log(`    ❌ CRITICAL: No complete records can be formed!`);
    }
  }

  async debugAllAIQFiles() {
    console.log('🚀 Starting AIQ Data Flow Debug...');

    const aiqFiles = this.getAIIExcelFiles();
    console.log(`📁 Found ${aiqFiles.length} AIQ Excel files to debug`);

    // Debug first 2 files in detail
    for (let i = 0; i < Math.min(2, aiqFiles.length); i++) {
      const file = aiqFiles[i];
      if (fs.existsSync(file)) {
        await this.debugAIQFile(file);
      }
    }

    console.log('\n🎯 Debug completed! Check the output above for data flow issues.');
  }

  getAIIExcelFiles() {
    const cleanedCutoffsDir = './data/cleaned_cutoffs';
    const files = [];

    if (fs.existsSync(cleanedCutoffsDir)) {
      const items = fs.readdirSync(cleanedCutoffsDir);
      items.forEach(item => {
        if (item.startsWith('AIQ_') && (item.endsWith('.xlsx') || item.endsWith('.xls'))) {
          files.push(path.join(cleanedCutoffsDir, item));
        }
      });
    }

    return files.sort();
  }
}

// Run the debug
const debuggerInstance = new DebugVerticalDataFlow();
debuggerInstance.debugAllAIQFiles();
