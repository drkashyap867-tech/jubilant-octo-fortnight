const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

class PerfectDataVerification {
    constructor() {
        this.dataDir = path.join(__dirname, 'data');
        this.medicalDbPath = path.join(this.dataDir, 'medical_seats.db');
        this.dentalDbPath = path.join(this.dataDir, 'dental_seats.db');
        this.dnbDbPath = path.join(this.dataDir, 'dnb_seats.db');
    }

    async analyzeMedicalData() {
        console.log('🏥 ANALYZING MEDICAL DATA FOR PERFECT ACCURACY...');
        
        // Read Excel file
        const excelPath = path.join(__dirname, 'data/imports/medical/medical_total_seats.xlsx');
        const workbook = XLSX.readFile(excelPath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        const headers = excelData[0];
        const excelRows = excelData.slice(1);
        
        console.log(`📊 Excel rows: ${excelRows.length}`);
        
        // Get database records
        const db = new sqlite3.Database(this.medicalDbPath);
        const dbRecords = await this.getMedicalRecords(db);
        db.close();
        
        console.log(`📊 Database records: ${dbRecords.length}`);
        
        // Find missing records
        const missingRecords = this.findMissingMedicalRecords(excelRows, headers, dbRecords);
        
        console.log(`❌ Missing records: ${missingRecords.length}`);
        
        if (missingRecords.length > 0) {
            console.log('\n🔍 MISSING RECORDS DETAILS:');
            missingRecords.forEach((record, index) => {
                console.log(`${index + 1}. Row ${record.excelRow}: ${record.college} | ${record.course} | ${record.state}`);
            });
        }
        
        return { excelRows: excelRows.length, dbRecords: dbRecords.length, missingRecords };
    }

    async analyzeDentalData() {
        console.log('\n🦷 ANALYZING DENTAL DATA FOR PERFECT ACCURACY...');
        
        // Read Excel file
        const excelPath = path.join(__dirname, 'data/imports/dental/dental_total_seats.xlsx');
        const workbook = XLSX.readFile(excelPath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        const headers = excelData[0];
        const excelRows = excelData.slice(1);
        
        console.log(`📊 Excel rows: ${excelRows.length}`);
        
        // Get database records
        const db = new sqlite3.Database(this.dentalDbPath);
        const dbRecords = await this.getDentalRecords(db);
        db.close();
        
        console.log(`📊 Database records: ${dbRecords.length}`);
        
        // Find missing records
        const missingRecords = this.findMissingDentalRecords(excelRows, headers, dbRecords);
        
        console.log(`❌ Missing records: ${missingRecords.length}`);
        
        if (missingRecords.length > 0) {
            console.log('\n🔍 MISSING RECORDS DETAILS:');
            missingRecords.forEach((record, index) => {
                console.log(`${index + 1}. Row ${record.excelRow}: ${record.college} | ${record.course} | ${record.state}`);
            });
        }
        
        return { excelRows: excelRows.length, dbRecords: dbRecords.length, missingRecords };
    }

    async analyzeDnbData() {
        console.log('\n🏥 ANALYZING DNB DATA FOR PERFECT ACCURACY...');
        
        // Read Excel file
        const excelPath = path.join(__dirname, 'data/imports/dnb/dnb_total_seats.xlsx');
        const workbook = XLSX.readFile(excelPath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        const headers = excelData[0];
        const excelRows = excelData.slice(1);
        
        console.log(`📊 Excel rows: ${excelRows.length}`);
        
        // Get database records
        const db = new sqlite3.Database(this.dnbDbPath);
        const dbRecords = await this.getDnbRecords(db);
        db.close();
        
        console.log(`📊 Database records: ${dbRecords.length}`);
        
        // Find missing records
        const missingRecords = this.findMissingDnbRecords(excelRows, headers, dbRecords);
        
        console.log(`❌ Missing records: ${missingRecords.length}`);
        
        if (missingRecords.length > 0) {
            console.log('\n🔍 MISSING RECORDS DETAILS:');
            missingRecords.forEach((record, index) => {
                console.log(`${index + 1}. Row ${record.excelRow}: ${record.college} | ${record.course} | ${record.state}`);
            });
        }
        
        return { excelRows: excelRows.length, dbRecords: dbRecords.length, missingRecords };
    }

    async getMedicalRecords(db) {
        return new Promise((resolve, reject) => {
            db.all("SELECT college_name, course_name, state, total_seats FROM medical_courses", (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async getDentalRecords(db) {
        return new Promise((resolve, reject) => {
            db.all("SELECT college_name, course_name, state, total_seats FROM dental_courses", (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async getDnbRecords(db) {
        return new Promise((resolve, reject) => {
            db.all("SELECT college_name, course_name, state, total_seats FROM dnb_courses", (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    findMissingMedicalRecords(excelRows, headers, dbRecords) {
        const missing = [];
        
        for (let i = 0; i < excelRows.length; i++) {
            const row = excelRows[i];
            const college = row[2] || ''; // COLLEGE/INSTITUTE
            const course = row[0] || '';  // COURSE
            const state = row[1] || '';   // STATE
            
            // Skip if any required field is empty
            if (!college || !course || !state) {
                continue;
            }
            
            // Check if record exists in database
            const exists = dbRecords.some(dbRecord => 
                this.normalizeString(dbRecord.college_name) === this.normalizeString(college) &&
                this.normalizeString(dbRecord.course_name) === this.normalizeString(course) &&
                this.normalizeString(dbRecord.state) === this.normalizeString(state)
            );
            
            if (!exists) {
                missing.push({
                    excelRow: i + 2,
                    college,
                    course,
                    state,
                    seats: row[6] || 0
                });
            }
        }
        
        return missing;
    }

    findMissingDentalRecords(excelRows, headers, dbRecords) {
        const missing = [];
        
        for (let i = 0; i < excelRows.length; i++) {
            const row = excelRows[i];
            const college = row[0] || ''; // COLLEGE/INSTITUTE
            const state = row[1] || '';   // STATE
            const course = row[4] || '';  // COURSE
            
            // Skip if any required field is empty
            if (!college || !course || !state) {
                continue;
            }
            
            // Check if record exists in database
            const exists = dbRecords.some(dbRecord => 
                this.normalizeString(dbRecord.college_name) === this.normalizeString(college) &&
                this.normalizeString(dbRecord.course_name) === this.normalizeString(course) &&
                this.normalizeString(dbRecord.state) === this.normalizeString(state)
            );
            
            if (!exists) {
                missing.push({
                    excelRow: i + 2,
                    college,
                    course,
                    state,
                    seats: row[5] || 0
                });
            }
        }
        
        return missing;
    }

    findMissingDnbRecords(excelRows, headers, dbRecords) {
        const missing = [];
        
        for (let i = 0; i < excelRows.length; i++) {
            const row = excelRows[i];
            const state = row[0] || '';     // STATE
            const college = row[1] || '';   // COLLEGE/INSTITUTE
            const course = row[3] || '';    // COURSE
            
            // Skip if any required field is empty
            if (!college || !course || !state) {
                continue;
            }
            
            // Check if record exists in database
            const exists = dbRecords.some(dbRecord => 
                this.normalizeString(dbRecord.college_name) === this.normalizeString(college) &&
                this.normalizeString(dbRecord.course_name) === this.normalizeString(course) &&
                this.normalizeString(dbRecord.state) === this.normalizeString(state)
            );
            
            if (!exists) {
                missing.push({
                    excelRow: i + 2,
                    college,
                    course,
                    state,
                    seats: row[5] || 0
                });
            }
        }
        
        return missing;
    }

    normalizeString(str) {
        return str.toString().toLowerCase().trim().replace(/\s+/g, ' ');
    }

    async runCompleteAnalysis() {
        console.log('🎯 PERFECT DATA VERIFICATION - COMPLETE ANALYSIS\n');
        
        const medical = await this.analyzeMedicalData();
        const dental = await this.analyzeDentalData();
        const dnb = await this.analyzeDnbData();
        
        console.log('\n📊 COMPLETE ANALYSIS SUMMARY:');
        console.log('=====================================');
        console.log(`🏥 Medical: Excel ${medical.excelRows} → DB ${medical.dbRecords} | Missing: ${medical.missingRecords.length}`);
        console.log(`🦷 Dental: Excel ${dental.excelRows} → DB ${dental.dbRecords} | Missing: ${dental.missingRecords.length}`);
        console.log(`🏥 DNB: Excel ${dnb.excelRows} → DB ${dnb.dbRecords} | Missing: ${dnb.missingRecords.length}`);
        
        const totalMissing = medical.missingRecords.length + dental.missingRecords.length + dnb.missingRecords.length;
        
        if (totalMissing === 0) {
            console.log('\n🎉 PERFECT! ZERO DISCREPANCIES ACHIEVED!');
        } else {
            console.log(`\n❌ TOTAL MISSING RECORDS: ${totalMissing}`);
            console.log('🔧 Need to fix these records for perfect accuracy');
        }
        
        return { medical, dental, dnb, totalMissing };
    }
}

// Run if called directly
if (require.main === module) {
    const verifier = new PerfectDataVerification();
    verifier.runCompleteAnalysis()
        .then(() => {
            console.log('\n✅ Analysis complete!');
        })
        .catch(error => {
            console.error('\n❌ Analysis failed:', error.message);
        });
}

module.exports = { PerfectDataVerification };
