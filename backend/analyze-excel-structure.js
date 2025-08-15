const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

function analyzeExcelStructure(filePath) {
    try {
        console.log(`🔍 Analyzing Excel file: ${path.basename(filePath)}`);
        
        // Read Excel file
        const workbook = XLSX.readFile(filePath);
        const sheetNames = workbook.SheetNames;
        
        console.log(`📊 Found ${sheetNames.length} sheet(s): ${sheetNames.join(', ')}`);
        
        // Analyze first sheet
        const sheetName = sheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON with headers
        const rawData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: '',
            blankrows: false
        });
        
        if (rawData.length < 2) {
            console.log('❌ Insufficient data in Excel file');
            return;
        }
        
        // Extract headers and first few rows
        const headers = rawData[0];
        const dataRows = rawData.slice(1, 4); // First 3 data rows
        
        console.log('\n📋 HEADERS:');
        headers.forEach((header, index) => {
            console.log(`  ${index}: "${header}"`);
        });
        
        console.log('\n📊 FIRST 3 DATA ROWS:');
        dataRows.forEach((row, rowIndex) => {
            console.log(`\n  Row ${rowIndex + 1}:`);
            headers.forEach((header, colIndex) => {
                const value = row[colIndex] || '';
                console.log(`    ${header}: "${value}"`);
            });
        });
        
        // Analyze data types
        console.log('\n🔍 DATA TYPE ANALYSIS:');
        headers.forEach((header, index) => {
            const sampleValues = dataRows.map(row => row[index]).filter(val => val !== '');
            if (sampleValues.length > 0) {
                const types = [...new Set(sampleValues.map(val => typeof val))];
                console.log(`  ${header}: ${types.join(', ')} (sample: "${sampleValues[0]}")`);
            }
        });
        
    } catch (error) {
        console.error('❌ Error analyzing file:', error.message);
    }
}

// Check if file path is provided
const filePath = process.argv[2];
if (!filePath) {
    console.error('❌ Please provide the Excel file path:');
    console.error('   node analyze-excel-structure.js <excel-file-path>');
    process.exit(1);
}

analyzeExcelStructure(filePath);
