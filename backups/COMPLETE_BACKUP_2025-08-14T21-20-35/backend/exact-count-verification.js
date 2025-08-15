const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

class ExactCountVerification {
    constructor() {
        this.dataDir = path.join(__dirname, 'data');
        this.medicalDbPath = path.join(this.dataDir, 'medical_seats.db');
        this.dentalDbPath = path.join(this.dataDir, 'dental_seats.db');
        this.dnbDbPath = path.join(this.dataDir, 'dnb_seats.db');
    }

    async verifyMedicalData() {
        console.log('🏥 EXACT MEDICAL DATA COUNT VERIFICATION...');
        
        // Read Excel file
        const excelPath = path.join(__dirname, 'data/imports/medical/medical_total_seats.xlsx');
        const workbook = XLSX.readFile(excelPath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        const headers = excelData[0];
        const excelRows = excelData.slice(1);
        
        console.log(`📊 Total Excel rows: ${excelRows.length}`);
        
        // Analyze each row exactly as the importer does
        let validRows = 0;
        let invalidRows = 0;
        let emptyRows = 0;
        let validRowsData = [];
        
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
                emptyRows++;
                continue;
            }
            
            // Check if required fields are present (import these)
            if (college && course && state) {
                validRows++;
                validRowsData.push({
                    row: i + 2,
                    course,
                    state,
                    college,
                    seats: seats || '0'
                });
            } else {
                invalidRows++;
            }
        }
        
        console.log(`✅ Valid rows: ${validRows}`);
        console.log(`❌ Invalid rows: ${invalidRows}`);
        console.log(`⚪ Empty rows: ${emptyRows}`);
        console.log(`🎯 Expected database count: ${validRows}`);
        
        // Get actual database count
        const db = new sqlite3.Database(this.medicalDbPath);
        const dbCount = await this.getRecordCount(db, 'medical_courses');
        db.close();
        
        console.log(`📊 Actual database count: ${dbCount}`);
        console.log(`✅ Perfect match: ${validRows === dbCount ? 'YES' : 'NO'}`);
        
        if (validRows !== dbCount) {
            console.log(`❌ DISCREPANCY: ${Math.abs(validRows - dbCount)} records`);
            console.log(`🔍 Need to investigate why database has ${dbCount - validRows} extra records`);
        }
        
        return { excelValid: validRows, dbCount, perfect: validRows === dbCount };
    }

    async verifyDentalData() {
        console.log('\n🦷 EXACT DENTAL DATA COUNT VERIFICATION...');
        
        // Read Excel file
        const excelPath = path.join(__dirname, 'data/imports/dental/dental_total_seats.xlsx');
        const workbook = XLSX.readFile(excelPath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        const headers = excelData[0];
        const excelRows = excelData.slice(1);
        
        console.log(`📊 Total Excel rows: ${excelRows.length}`);
        
        // Analyze each row exactly as the importer does
        let validRows = 0;
        let invalidRows = 0;
        let emptyRows = 0;
        
        for (let i = 0; i < excelRows.length; i++) {
            const row = excelRows[i];
            const college = row[0] || '';
            const state = row[1] || '';
            const year = row[2] || '';
            const management = row[3] || '';
            const course = row[4] || '';
            const seats = row[5] || '';
            
            // Check if row is completely empty (skip these)
            if (!college && !state && !year && !management && !course && !seats) {
                emptyRows++;
                continue;
            }
            
            // Check if required fields are present (import these)
            if (college && course && state) {
                validRows++;
            } else {
                invalidRows++;
            }
        }
        
        console.log(`✅ Valid rows: ${validRows}`);
        console.log(`❌ Invalid rows: ${invalidRows}`);
        console.log(`⚪ Empty rows: ${emptyRows}`);
        console.log(`🎯 Expected database count: ${validRows}`);
        
        // Get actual database count
        const db = new sqlite3.Database(this.dentalDbPath);
        const dbCount = await this.getRecordCount(db, 'dental_courses');
        db.close();
        
        console.log(`📊 Actual database count: ${dbCount}`);
        console.log(`✅ Perfect match: ${validRows === dbCount ? 'YES' : 'NO'}`);
        
        return { excelValid: validRows, dbCount, perfect: validRows === dbCount };
    }

    async verifyDnbData() {
        console.log('\n🏥 EXACT DNB DATA COUNT VERIFICATION...');
        
        // Read Excel file
        const excelPath = path.join(__dirname, 'data/imports/dnb/dnb_total_seats.xlsx');
        const workbook = XLSX.readFile(excelPath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        const headers = excelData[0];
        const excelRows = excelData.slice(1);
        
        console.log(`📊 Total Excel rows: ${excelRows.length}`);
        
        // Analyze each row exactly as the importer does
        let validRows = 0;
        let invalidRows = 0;
        let emptyRows = 0;
        
        for (let i = 0; i < excelRows.length; i++) {
            const row = excelRows[i];
            const state = row[0] || '';
            const college = row[1] || '';
            const quota = row[2] || '';
            const course = row[3] || '';
            const category = row[4] || '';
            const seats = row[5] || '';
            
            // Check if row is completely empty (skip these)
            if (!state && !college && !quota && !course && !category && !seats) {
                emptyRows++;
                continue;
            }
            
            // Check if required fields are present (import these)
            if (college && course && state) {
                validRows++;
            } else {
                invalidRows++;
            }
        }
        
        console.log(`✅ Valid rows: ${validRows}`);
        console.log(`❌ Invalid rows: ${invalidRows}`);
        console.log(`⚪ Empty rows: ${emptyRows}`);
        console.log(`🎯 Expected database count: ${validRows}`);
        
        // Get actual database count
        const db = new sqlite3.Database(this.dnbDbPath);
        const dbCount = await this.getRecordCount(db, 'dnb_courses');
        db.close();
        
        console.log(`📊 Actual database count: ${dbCount}`);
        console.log(`✅ Perfect match: ${validRows === dbCount ? 'YES' : 'NO'}`);
        
        return { excelValid: validRows, dbCount, perfect: validRows === dbCount };
    }

    async getRecordCount(db, tableName) {
        return new Promise((resolve, reject) => {
            db.get(`SELECT COUNT(*) as count FROM ${tableName}`, (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });
    }

    async runCompleteVerification() {
        console.log('🎯 EXACT COUNT VERIFICATION - ACHIEVING PERFECT ZERO DISCREPANCIES\n');
        
        const medical = await this.verifyMedicalData();
        const dental = await this.verifyDentalData();
        const dnb = await this.verifyDnbData();
        
        console.log('\n📊 COMPLETE VERIFICATION SUMMARY:');
        console.log('=====================================');
        console.log(`🏥 Medical: Excel ${medical.excelValid} → DB ${medical.dbCount} | Perfect: ${medical.perfect ? '✅' : '❌'}`);
        console.log(`🦷 Dental: Excel ${dental.excelValid} → DB ${dental.dbCount} | Perfect: ${dental.perfect ? '✅' : '❌'}`);
        console.log(`🏥 DNB: Excel ${dnb.excelValid} → DB ${dnb.dbCount} | Perfect: ${dnb.perfect ? '✅' : '❌'}`);
        
        const allPerfect = medical.perfect && dental.perfect && dnb.perfect;
        
        if (allPerfect) {
            console.log('\n🎉 PERFECT! ALL DATABASES HAVE ZERO DISCREPANCIES!');
        } else {
            console.log('\n❌ SOME DISCREPANCIES EXIST - NEED TO FIX FOR PERFECT ACCURACY');
        }
        
        return { medical, dental, dnb, allPerfect };
    }
}

// Run if called directly
if (require.main === module) {
    const verifier = new ExactCountVerification();
    verifier.runCompleteVerification()
        .then(() => {
            console.log('\n✅ Verification complete!');
        })
        .catch(error => {
            console.error('\n❌ Verification failed:', error.message);
        });
}

module.exports = { ExactCountVerification };
