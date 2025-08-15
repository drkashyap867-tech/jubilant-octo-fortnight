const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

function createSampleExcel() {
    console.log('📊 Creating sample Excel file for testing...');
    
    // Sample data
    const sampleData = [
        {
            'College Name': 'Mysore Medical College and Research Institute',
            'Course Name': 'MBBS',
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
            'College Name': 'Mysore Medical College and Research Institute',
            'Course Name': 'MBBS',
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
            'College Name': 'Mysore Medical College and Research Institute',
            'Course Name': 'MBBS',
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
            'College Name': 'Mysore Medical College and Research Institute',
            'Course Name': 'MBBS',
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
            'College Name': 'Mysore Medical College and Research Institute',
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
            'College Name': 'Bangalore Medical College and Research Institute',
            'Course Name': 'MBBS',
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
            'College Name': 'Bangalore Medical College and Research Institute',
            'Course Name': 'MBBS',
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
            'College Name': 'Bangalore Medical College and Research Institute',
            'Course Name': 'MD - Medicine',
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
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Counselling Data');
    
    // Ensure imports directory exists
    const importsDir = path.join(__dirname, 'data', 'imports');
    if (!fs.existsSync(importsDir)) {
        fs.mkdirSync(importsDir, { recursive: true });
    }
    
    // Save the file
    const filePath = path.join(importsDir, 'sample-counselling-data.xlsx');
    XLSX.writeFile(workbook, filePath);
    
    console.log(`✅ Sample Excel file created: ${filePath}`);
    console.log(`📊 Contains ${sampleData.length} sample records`);
    console.log('\n🎯 You can now:');
    console.log('1. Use this as a template for your real data');
    console.log('2. Test the import system with this file');
    console.log('3. Replace with your actual counselling data');
    
    return filePath;
}

// Run if called directly
if (require.main === module) {
    createSampleExcel();
}

module.exports = { createSampleExcel };
