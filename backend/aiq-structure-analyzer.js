const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Analyze AIQ file structure
function analyzeAIQFile(filePath) {
  try {
    const filename = path.basename(filePath);
    console.log(`\n🔍 AIQ STRUCTURE: ${filename}`);

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    console.log(`📊 Rows: ${rawData.length}`);

    if (rawData.length > 0) {
      const headers = rawData[0];
      console.log(`📋 Headers (first 5): ${headers.slice(0, 5).map(h => `"${h || ''}"`).join(' | ')}`);

      // Check first few data rows
      for (let i = 1; i < Math.min(5, rawData.length); i++) {
        const row = rawData[i];
        if (row && row.length > 0) {
          console.log(`  Row ${i}: ${row.slice(0, 3).map(c => `"${c || ''}"`).join(' | ')}`);
        }
      }
    }

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
}

// Main analysis
console.log('🚀 AIQ Structure Analysis...');

const cleanedCutoffsDir = './data/cleaned_cutoffs';
if (fs.existsSync(cleanedCutoffsDir)) {
  const items = fs.readdirSync(cleanedCutoffsDir);
  const aiqFiles = items.filter(item =>
    item.startsWith('AIQ_') && (item.endsWith('.xlsx') || item.endsWith('.xls'))
  ).slice(0, 3); // Analyze first 3 files

  aiqFiles.forEach(file => {
    const filePath = path.join(cleanedCutoffsDir, file);
    analyzeAIQFile(filePath);
  });
}
