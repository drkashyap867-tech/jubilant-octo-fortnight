const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class DeepDiscrepancyInvestigation {
    constructor() {
        this.medicalDbPath = path.join(__dirname, 'data/medical_seats.db');
    }

    async investigateMedicalDiscrepancy() {
        console.log('🔍 DEEP INVESTIGATION OF MEDICAL DATA DISCREPANCY...');
        
        // Read Excel file
        const excelPath = path.join(__dirname, 'data/imports/medical/medical_total_seats.xlsx');
        const workbook = XLSX.readFile(excelPath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        const headers = excelData[0];
        const excelRows = excelData.slice(1);
        
        console.log(`📊 Total Excel rows: ${excelRows.length}`);
        console.log(`📋 Headers: ${headers.join(', ')}`);
        
        // Method 1: Perfect Data Verification method
        let method1Valid = 0;
        let method1Invalid = 0;
        let method1Empty = 0;
        
        for (let i = 0; i < excelRows.length; i++) {
            const row = excelRows[i];
            const course = row[0] || '';
            const state = row[1] || '';
            const college = row[2] || '';
            
            if (!course && !state && !college) {
                method1Empty++;
            } else if (!college || !course || !state) {
                method1Invalid++;
            } else {
                method1Valid++;
            }
        }
        
        console.log(`\n🔍 METHOD 1 (Perfect Data Verification):`);
        console.log(`✅ Valid rows: ${method1Valid}`);
        console.log(`❌ Invalid rows: ${method1Invalid}`);
        console.log(`⚪ Empty rows: ${method1Empty}`);
        
        // Method 2: Detailed Discrepancy Analysis method
        let method2Valid = 0;
        let method2Invalid = 0;
        let method2Empty = 0;
        
        for (let i = 0; i < excelRows.length; i++) {
            const row = excelRows[i];
            const course = row[0] || '';
            const state = row[1] || '';
            const college = row[2] || '';
            const seats = row[6] || '';
            
            // Check if row is completely empty
            if (!course && !state && !college && !row[3] && !row[4] && !row[5] && !seats) {
                method2Empty++;
                continue;
            }
            
            // Check if required fields are missing
            if (!college || !course || !state) {
                method2Invalid++;
                continue;
            }
            
            // Check if seats is a valid number
            if (isNaN(parseInt(seats)) && seats !== '') {
                method2Invalid++;
                continue;
            }
            
            method2Valid++;
        }
        
        console.log(`\n🔍 METHOD 2 (Detailed Discrepancy Analysis):`);
        console.log(`✅ Valid rows: ${method2Valid}`);
        console.log(`❌ Invalid rows: ${method2Invalid}`);
        console.log(`⚪ Empty rows: ${method2Empty}`);
        
        // Method 3: Exact Count Verification method (same as importer)
        let method3Valid = 0;
        let method3Invalid = 0;
        let method3Empty = 0;
        
        for (let i = 0; i < excelRows.length; i++) {
            const row = excelRows[i];
            const course = row[0] || '';
            const state = row[1] || '';
            const college = row[2] || '';
            const university = row[3] || '';
            const management = row[4] || '';
            const year = row[5] || '';
            const seats = row[6] || '';
            
            // Check if row is completely empty (skip these)
            if (!course && !state && !college && !university && !management && !year && !seats) {
                method3Empty++;
                continue;
            }
            
            // Check if required fields are present (import these)
            if (college && course && state) {
                method3Valid++;
            } else {
                method3Invalid++;
            }
        }
        
        console.log(`\n🔍 METHOD 3 (Exact Count Verification - Same as Importer):`);
        console.log(`✅ Valid rows: ${method3Valid}`);
        console.log(`❌ Invalid rows: ${method3Invalid}`);
        console.log(`⚪ Empty rows: ${method3Empty}`);
        
        // Get actual database count
        const db = new sqlite3.Database(this.medicalDbPath);
        const dbCount = await this.getRecordCount(db, 'medical_courses');
        db.close();
        
        console.log(`\n📊 ACTUAL DATABASE COUNT: ${dbCount}`);
        
        // Show which method matches the database
        console.log(`\n🔍 METHOD COMPARISON WITH DATABASE:`);
        console.log(`Method 1: ${method1Valid} → DB ${dbCount} | Match: ${method1Valid === dbCount ? '✅' : '❌'}`);
        console.log(`Method 2: ${method2Valid} → DB ${dbCount} | Match: ${method2Valid === dbCount ? '✅' : '❌'}`);
        console.log(`Method 3: ${method3Valid} → DB ${dbCount} | Match: ${method3Valid === dbCount ? '✅' : '❌'}`);
        
        // Show the 3 rows that Method 2 considers invalid
        console.log(`\n🔍 ROWS THAT METHOD 2 CONSIDERS INVALID:`);
        let invalidRowCount = 0;
        for (let i = 0; i < excelRows.length && invalidRowCount < 5; i++) {
            const row = excelRows[i];
            const course = row[0] || '';
            const state = row[1] || '';
            const college = row[2] || '';
            const seats = row[6] || '';
            
            if (college && course && state && isNaN(parseInt(seats)) && seats !== '') {
                invalidRowCount++;
                console.log(`Row ${i + 2}: "${college}" | "${course}" | "${state}" | Seats: "${seats}"`);
            }
        }
        
        return {
            method1: method1Valid,
            method2: method2Valid,
            method3: method3Valid,
            dbCount,
            perfect: method3Valid === dbCount
        };
    }

    async getRecordCount(db, tableName) {
        return new Promise((resolve, reject) => {
            db.get(`SELECT COUNT(*) as count FROM ${tableName}`, (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });
    }
}

// Run if called directly
if (require.main === module) {
    const investigator = new DeepDiscrepancyInvestigation();
    investigator.investigateMedicalDiscrepancy()
        .then(() => {
            console.log('\n✅ Investigation complete!');
        })
        .catch(error => {
            console.error('\n❌ Investigation failed:', error.message);
        });
}

module.exports = { DeepDiscrepancyInvestigation };
