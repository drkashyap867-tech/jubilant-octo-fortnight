const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

function createCorrectedSampleExcel() {
    console.log('📊 Creating corrected sample Excel file with exact database names...');
    
    // Corrected data using exact names from database
    const correctedData = [
        {
            'College Name': 'Mysore Medical College and Research Instt. (Prev.name Government Medical College), Mysore',
            'Course Name': 'M.B.B.S.',
            'Counselling Type': 'KEA',
            'Year': '2024',
            'Round': '1',
            'Category': 'UR',
            'Cutoff Rank': '2200',
            'Percentile': '97.2',
            'Seats Available': '25',
            'Seats Filled': '20',
            'Fees': '15000',
            'Remarks': 'State quota seats'
        },
        {
            'College Name': 'Mysore Medical College and Research Instt. (Prev.name Government Medical College), Mysore',
            'Course Name': 'M.B.B.S.',
            'Counselling Type': 'KEA',
            'Year': '2024',
            'Round': '1',
            'Category': 'OBC-NCL',
            'Cutoff Rank': '3500',
            'Percentile': '94.1',
            'Seats Available': '15',
            'Seats Filled': '12',
            'Fees': '15000',
            'Remarks': 'OBC reservation'
        },
        {
            'College Name': 'Mysore Medical College and Research Instt. (Prev.name Government Medical College), Mysore',
            'Course Name': 'M.B.B.S.',
            'Counselling Type': 'KEA',
            'Year': '2024',
            'Round': '1',
            'Category': 'SC',
            'Cutoff Rank': '8500',
            'Percentile': '87.3',
            'Seats Available': '8',
            'Seats Filled': '6',
            'Fees': '15000',
            'Remarks': 'SC reservation'
        },
        {
            'College Name': 'Mysore Medical College and Research Instt. (Prev.name Government Medical College), Mysore',
            'Course Name': 'M.B.B.S.',
            'Counselling Type': 'AIQ',
            'Year': '2024',
            'Round': '1',
            'Category': 'UR',
            'Cutoff Rank': '1800',
            'Percentile': '98.1',
            'Seats Available': '5',
            'Seats Filled': '4',
            'Fees': '15000',
            'Remarks': 'All India quota'
        },
        {
            'College Name': 'Mysore Medical College and Research Instt. (Prev.name Government Medical College), Mysore',
            'Course Name': 'MS - Orthopaedics',
            'Counselling Type': 'KEA',
            'Year': '2024',
            'Round': '1',
            'Category': 'UR',
            'Cutoff Rank': '1500',
            'Percentile': '98.8',
            'Seats Available': '3',
            'Seats Filled': '2',
            'Fees': '25000',
            'Remarks': 'PG course'
        },
        {
            'College Name': 'Bangalore Medical College and Research Institute, Bangalore',
            'Course Name': 'M.B.B.S.',
            'Counselling Type': 'KEA',
            'Year': '2024',
            'Round': '1',
            'Category': 'UR',
            'Cutoff Rank': '1800',
            'Percentile': '98.1',
            'Seats Available': '30',
            'Seats Filled': '25',
            'Fees': '12000',
            'Remarks': 'Government college'
        },
        {
            'College Name': 'Bangalore Medical College and Research Institute, Bangalore',
            'Course Name': 'M.B.B.S.',
            'Counselling Type': 'KEA',
            'Year': '2024',
            'Round': '1',
            'Category': 'OBC-NCL',
            'Cutoff Rank': '2800',
            'Percentile': '95.5',
            'Seats Available': '18',
            'Seats Filled': '15',
            'Fees': '12000',
            'Remarks': 'OBC reservation'
        },
        {
            'College Name': 'Bangalore Medical College and Research Institute, Bangalore',
            'Course Name': 'MD - General Medicine',
            'Counselling Type': 'KEA',
            'Year': '2024',
            'Round': '1',
            'Category': 'UR',
            'Cutoff Rank': '1200',
            'Percentile': '99.1',
            'Seats Available': '5',
            'Seats Filled': '4',
            'Fees': '20000',
            'Remarks': 'PG course'
        }
    ];
    
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(correctedData);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Counselling Data');
    
    // Ensure imports directory exists
    const importsDir = path.join(__dirname, 'data', 'imports');
    if (!fs.existsSync(importsDir)) {
        fs.mkdirSync(importsDir, { recursive: true });
    }
    
    // Save the file
    const filePath = path.join(importsDir, 'corrected-sample-counselling-data.xlsx');
    XLSX.writeFile(workbook, filePath);
    
    console.log(`✅ Corrected sample Excel file created: ${filePath}`);
    console.log(`📊 Contains ${correctedData.length} sample records`);
    console.log('\n🎯 This file uses EXACT college and course names from your database!');
    console.log('\n📋 College IDs found:');
    console.log('   - Mysore Medical College: ID 228');
    console.log('   - Bangalore Medical College: ID 244');
    console.log('\n📚 Course IDs found:');
    console.log('   - M.B.B.S.: ID 2417');
    console.log('   - MS - Orthopaedics: ID 2400');
    console.log('   - MD - General Medicine: ID 2795');
    
    return filePath;
}

// Run if called directly
if (require.main === module) {
    createCorrectedSampleExcel();
}

module.exports = { createCorrectedSampleExcel };
