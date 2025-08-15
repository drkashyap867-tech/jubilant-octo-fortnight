const ExcelCutoffImporter = require('./import-excel-cutoff');

async function testImporter() {
    const importer = new ExcelCutoffImporter();
    
    try {
        console.log('🧪 Testing Excel Cutoff Importer...\n');
        
        // Test initialization
        const initSuccess = await importer.initialize();
        if (!initSuccess) {
            console.log('❌ Initialization failed');
            return;
        }
        
        console.log('✅ Initialization successful\n');
        
        // Test with a sample file (if it exists)
        const testFile = './data/imports/test-cutoff-data.xlsx';
        
        if (require('fs').existsSync(testFile)) {
            console.log(`📊 Testing with file: ${testFile}`);
            const result = await importer.importExcelFile(testFile);
            console.log('\n📊 Import result:', result);
        } else {
            console.log('📝 No test file found. Ready for real Excel file import!');
            console.log('\n📁 Place your Excel file in: ./data/imports/');
            console.log('🚀 Then run: node import-excel-cutoff.js ./data/imports/your-file.xlsx');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await importer.close();
    }
}

// Run the test
testImporter();
