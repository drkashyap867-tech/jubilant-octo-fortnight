const XLSX = require('xlsx');
const path = require('path');

async function debugKEAStructure() {
    try {
        console.log('🔍 Debugging KEA Excel structure...\n');
        
        // Test with a cleaned KEA file
        const filePath = path.join(__dirname, 'data/cleaned_cutoffs/KEA_2024_MEDICAL_R1_CLEANED.xlsx');
        
        if (!require('fs').existsSync(filePath)) {
            console.error('❌ File not found:', filePath);
            return;
        }
        
        console.log(`📄 Analyzing file: ${path.basename(filePath)}`);
        
        // Read the Excel file
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        console.log(`📊 Sheet: ${sheetName}`);
        
        // Convert to JSON with headers
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (rawData.length < 2) {
            console.log('❌ No data found');
            return;
        }
        
        const headers = rawData[0];
        
        console.log(`\n🏷️  Header (Column 0): "${headers[0]}"`);
        console.log(`📏 Header length: ${headers[0] ? headers[0].length : 0} characters`);
        
        // Analyze the data structure
        console.log(`\n📊 Data Structure Analysis:`);
        console.log(`Total rows: ${rawData.length}`);
        
        // Look at first 15 rows to understand the pattern
        console.log(`\n🔍 First 15 rows analysis:`);
        for (let i = 1; i <= Math.min(15, rawData.length - 1); i++) {
            const row = rawData[i];
            if (row && row[0]) {
                const value = String(row[0]).trim();
                console.log(`   Row ${i}: "${value}"`);
                
                // Try to categorize the row
                if (value.includes('MBBS') || value.includes('BDS') || value.includes('MD') || value.includes('MS')) {
                    console.log(`     → Course: ${value}`);
                } else if (value.includes('GENERAL') || value.includes('OPEN') || value.includes('UR') || 
                          value.includes('OBC') || value.includes('SC') || value.includes('ST') ||
                          value.includes('NRI') || value.includes('MNG') || value.includes('MANAGEMENT')) {
                    console.log(`     → Category: ${value}`);
                } else if (value.includes('QUOTA') || value.includes('SEATS')) {
                    console.log(`     → Quota/Seats: ${value}`);
                } else if (value.includes('RANK') || value.includes('CUTOFF')) {
                    console.log(`     → Rank/Cutoff: ${value}`);
                } else if (value.includes('SEATS') || value.includes('VACANT') || value.includes('FILLED')) {
                    console.log(`     → Seat Info: ${value}`);
                } else if (!isNaN(value) && value.length > 3) {
                    console.log(`     → Rank: ${value}`);
                } else {
                    console.log(`     → Other: ${value}`);
                }
            }
        }
        
        // Look for patterns in the data
        console.log(`\n🔍 Pattern Analysis:`);
        let courseRows = 0;
        let categoryRows = 0;
        let rankRows = 0;
        let otherRows = 0;
        
        for (let i = 1; i < rawData.length; i++) {
            const row = rawData[i];
            if (row && row[0]) {
                const value = String(row[0]).trim();
                
                if (value.includes('MBBS') || value.includes('BDS') || value.includes('MD') || value.includes('MS')) {
                    courseRows++;
                } else if (value.includes('GENERAL') || value.includes('OPEN') || value.includes('UR') || 
                          value.includes('OBC') || value.includes('SC') || value.includes('ST') ||
                          value.includes('NRI') || value.includes('MNG') || value.includes('MANAGEMENT')) {
                    categoryRows++;
                } else if (!isNaN(value) && value.length > 3) {
                    rankRows++;
                } else {
                    otherRows++;
                }
            }
        }
        
        console.log(`   Course rows: ${courseRows}`);
        console.log(`   Category rows: ${categoryRows}`);
        console.log(`   Rank rows: ${rankRows}`);
        console.log(`   Other rows: ${otherRows}`);
        
        // Try to find where the actual data starts
        console.log(`\n🔍 Looking for data patterns:`);
        let dataStartRow = -1;
        for (let i = 1; i < Math.min(50, rawData.length); i++) {
            const row = rawData[i];
            if (row && row[0]) {
                const value = String(row[0]).trim();
                if (value.includes('MBBS') || value.includes('BDS')) {
                    dataStartRow = i;
                    console.log(`   Data appears to start at row ${i}: "${value}"`);
                    break;
                }
            }
        }
        
        if (dataStartRow !== -1) {
            console.log(`\n📊 Sample data starting from row ${dataStartRow}:`);
            for (let i = dataStartRow; i < Math.min(dataStartRow + 10, rawData.length); i++) {
                const row = rawData[i];
                if (row && row[0]) {
                    console.log(`   Row ${i}: "${row[0]}"`);
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Debug failed:', error);
    }
}

// Run the debug
debugKEAStructure();
