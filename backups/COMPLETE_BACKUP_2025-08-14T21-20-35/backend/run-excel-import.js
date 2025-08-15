const EnhancedExcelCutoffImporter = require('./import-excel-cutoff-enhanced');

async function runExcelImport(filePath) {
    if (!filePath) {
        console.log('❌ Please provide an Excel file path!');
        console.log('\nUsage:');
        console.log('  node run-excel-import.js <excel-file-path>');
        console.log('\nExample:');
        console.log('  node run-excel-import.js ./data/imports/sample-counselling-data.xlsx');
        return;
    }

    const importer = new EnhancedExcelCutoffImporter();
    
    try {
        console.log('🚀 Starting Enhanced Excel Import...\n');
        
        // Initialize the importer
        const initSuccess = await importer.initialize();
        if (!initSuccess) {
            console.log('❌ Failed to initialize importer');
            return;
        }
        
        // Import the Excel file
        const result = await importer.importExcelFile(filePath);
        
        // Display results
        console.log('\n🎯 IMPORT COMPLETED!');
        console.log('==================');
        console.log(`📊 Total Records: ${result.importedRecords}`);
        console.log(`✅ Success: ${result.success ? 'YES' : 'NO'}`);
        
        if (result.warnings && result.warnings.length > 0) {
            console.log(`⚠️  Warnings: ${result.warnings.length}`);
            result.warnings.forEach(warning => console.log(`   - ${warning}`));
        }
        
        if (result.errors && result.errors.length > 0) {
            console.log(`❌ Errors: ${result.errors.length}`);
            result.errors.forEach(error => console.log(`   - ${error}`));
        }
        
        if (result.success) {
            console.log('\n🎉 SUCCESS! Your counselling data has been imported!');
            console.log('🚀 You can now view the data in your application!');
        } else {
            console.log('\n❌ Import failed. Please check the errors above.');
        }
        
    } catch (error) {
        console.error('❌ Import failed with error:', error);
    } finally {
        await importer.close();
    }
}

// Get file path from command line arguments
const filePath = process.argv[2];

// Run the import
runExcelImport(filePath);
