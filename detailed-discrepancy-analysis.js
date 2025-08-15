const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

class DetailedDiscrepancyAnalysis {
    constructor() {
        this.dataDir = path.join(__dirname, 'data');
        this.medicalDbPath = path.join(this.dataDir, 'medical_seats.db');
        this.dentalDbPath = path.join(this.dataDir, 'dental_seats.db');
        this.dnbDbPath = path.join(this.dataDir, 'dnb_seats.db');
    }

    async analyzeMedicalDiscrepancies() {
        console.log('🏥 DETAILED MEDICAL DISCREPANCY ANALYSIS...');
        
        const excelPath = path.join(__dirname, 'data/imports/medical/medical_total_seats.xlsx');
        const workbook = XLSX.readFile(excelPath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        const headers = excelData[0];
        const excelRows = excelData.slice(1);
        
        console.log(`📊 Total Excel rows: ${excelRows.length}`);
        
        // Analyze each row
        let validRows = 0;
        let invalidRows = 0;
        let emptyRows = 0;
        let invalidRowsDetails = [];
        
        for (let i = 0; i < excelRows.length; i++) {
            const row = excelRows[i];
            const course = row[0] || '';
            const state = row[1] || '';
            const college = row[2] || '';
            const university = row[3] || '';
            const management = row[4] || '';
            const year = row[5] || '';
            const seats = row[6] || '';
            
            // Check if row is completely empty
            if (!course && !state && !college && !university && !management && !year && !seats) {
                emptyRows++;
                continue;
            }
            
            // Check if required fields are missing
            if (!college || !course || !state) {
                invalidRows++;
                invalidRowsDetails.push({
                    row: i + 2,
                    course,
                    state,
                    college,
                    university,
                    management,
                    year,
                    seats,
                    reason: 'Missing required fields'
                });
                continue;
            }
            
            // Check if seats is valid number
            if (isNaN(parseInt(seats))) {
                invalidRows++;
                invalidRowsDetails.push({
                    row: i + 2,
                    course,
                    state,
                    college,
                    university,
                    management,
                    year,
                    seats,
                    reason: 'Invalid seats number'
                });
                continue;
            }
            
            validRows++;
        }
        
        console.log(`✅ Valid rows: ${validRows}`);
        console.log(`❌ Invalid rows: ${invalidRows}`);
        console.log(`⚪ Empty rows: ${emptyRows}`);
        
        if (invalidRows > 0) {
            console.log('\n🔍 INVALID ROWS DETAILS (First 10):');
            invalidRowsDetails.slice(0, 10).forEach((row, index) => {
                console.log(`${index + 1}. Row ${row.row}: ${row.reason}`);
                console.log(`   College: "${row.college}" | Course: "${row.course}" | State: "${row.state}" | Seats: "${row.seats}"`);
            });
        }
        
        return { total: excelRows.length, valid: validRows, invalid: invalidRows, empty: emptyRows, invalidDetails: invalidRowsDetails };
    }

    async analyzeDentalDiscrepancies() {
        console.log('\n🦷 DETAILED DENTAL DISCREPANCY ANALYSIS...');
        
        const excelPath = path.join(__dirname, 'data/imports/dental/dental_total_seats.xlsx');
        const workbook = XLSX.readFile(excelPath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        const headers = excelData[0];
        const excelRows = excelData.slice(1);
        
        console.log(`📊 Total Excel rows: ${excelRows.length}`);
        
        // Analyze each row
        let validRows = 0;
        let invalidRows = 0;
        let emptyRows = 0;
        let invalidRowsDetails = [];
        
        for (let i = 0; i < excelRows.length; i++) {
            const row = excelRows[i];
            const college = row[0] || '';
            const state = row[1] || '';
            const year = row[2] || '';
            const management = row[3] || '';
            const course = row[4] || '';
            const seats = row[5] || '';
            
            // Check if row is completely empty
            if (!college && !state && !year && !management && !course && !seats) {
                emptyRows++;
                continue;
            }
            
            // Check if required fields are missing
            if (!college || !course || !state) {
                invalidRows++;
                invalidRowsDetails.push({
                    row: i + 2,
                    college,
                    state,
                    year,
                    management,
                    course,
                    seats,
                    reason: 'Missing required fields'
                });
                continue;
            }
            
            // Check if seats is valid number
            if (isNaN(parseInt(seats))) {
                invalidRows++;
                invalidRowsDetails.push({
                    row: i + 2,
                    college,
                    state,
                    year,
                    management,
                    course,
                    seats,
                    reason: 'Invalid seats number'
                });
                continue;
            }
            
            validRows++;
        }
        
        console.log(`✅ Valid rows: ${validRows}`);
        console.log(`❌ Invalid rows: ${invalidRows}`);
        console.log(`⚪ Empty rows: ${emptyRows}`);
        
        if (invalidRows > 0) {
            console.log('\n🔍 INVALID ROWS DETAILS (First 10):');
            invalidRowsDetails.slice(0, 10).forEach((row, index) => {
                console.log(`${index + 1}. Row ${row.row}: ${row.reason}`);
                console.log(`   College: "${row.college}" | Course: "${row.course}" | State: "${row.state}" | Seats: "${row.seats}"`);
            });
        }
        
        return { total: excelRows.length, valid: validRows, invalid: invalidRows, empty: emptyRows, invalidDetails: invalidRowsDetails };
    }

    async analyzeDnbDiscrepancies() {
        console.log('\n🏥 DETAILED DNB DISCREPANCY ANALYSIS...');
        
        const excelPath = path.join(__dirname, 'data/imports/dnb/dnb_total_seats.xlsx');
        const workbook = XLSX.readFile(excelPath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        const headers = excelData[0];
        const excelRows = excelData.slice(1);
        
        console.log(`📊 Total Excel rows: ${excelRows.length}`);
        
        // Analyze each row
        let validRows = 0;
        let invalidRows = 0;
        let emptyRows = 0;
        let invalidRowsDetails = [];
        
        for (let i = 0; i < excelRows.length; i++) {
            const row = excelRows[i];
            const state = row[0] || '';
            const college = row[1] || '';
            const quota = row[2] || '';
            const course = row[3] || '';
            const category = row[4] || '';
            const seats = row[5] || '';
            
            // Check if row is completely empty
            if (!state && !college && !quota && !course && !category && !seats) {
                emptyRows++;
                continue;
            }
            
            // Check if required fields are missing
            if (!college || !course || !state) {
                invalidRows++;
                invalidRowsDetails.push({
                    row: i + 2,
                    state,
                    college,
                    quota,
                    course,
                    category,
                    seats,
                    reason: 'Missing required fields'
                });
                continue;
            }
            
            // Check if seats is valid number
            if (isNaN(parseInt(seats))) {
                invalidRows++;
                invalidRowsDetails.push({
                    row: i + 2,
                    state,
                    college,
                    quota,
                    course,
                    category,
                    seats,
                    reason: 'Invalid seats number'
                });
                continue;
            }
            
            validRows++;
        }
        
        console.log(`✅ Valid rows: ${validRows}`);
        console.log(`❌ Invalid rows: ${invalidRows}`);
        console.log(`⚪ Empty rows: ${emptyRows}`);
        
        if (invalidRows > 0) {
            console.log('\n🔍 INVALID ROWS DETAILS (First 10):');
            invalidRowsDetails.slice(0, 10).forEach((row, index) => {
                console.log(`${index + 1}. Row ${index + 2}: ${row.reason}`);
                console.log(`   College: "${row.college}" | Course: "${row.course}" | State: "${row.state}" | Seats: "${row.seats}"`);
            });
        }
        
        return { total: excelRows.length, valid: validRows, invalid: invalidRows, empty: emptyRows, invalidDetails: invalidRowsDetails };
    }

    async runCompleteAnalysis() {
        console.log('🔍 DETAILED DISCREPANCY ANALYSIS - FINDING ROOT CAUSE\n');
        
        const medical = await this.analyzeMedicalDiscrepancies();
        const dental = await this.analyzeDentalDiscrepancies();
        const dnb = await this.analyzeDnbDiscrepancies();
        
        console.log('\n📊 COMPLETE DISCREPANCY ANALYSIS:');
        console.log('=====================================');
        console.log(`🏥 Medical: Excel ${medical.total} → Valid ${medical.valid} | Invalid ${medical.invalid} | Empty ${medical.empty}`);
        console.log(`🦷 Dental: Excel ${dental.total} → Valid ${dental.valid} | Invalid ${dental.invalid} | Empty ${dental.empty}`);
        console.log(`🏥 DNB: Excel ${dnb.total} → Valid ${dnb.valid} | Invalid ${dnb.invalid} | Empty ${dnb.empty}`);
        
        // Check if valid rows match database counts
        const db = new sqlite3.Database(this.medicalDbPath);
        const medicalCount = await this.getRecordCount(db, 'medical_courses');
        db.close();
        
        const db2 = new sqlite3.Database(this.dentalDbPath);
        const dentalCount = await this.getRecordCount(db2, 'dental_courses');
        db2.close();
        
        const db3 = new sqlite3.Database(this.dnbDbPath);
        const dnbCount = await this.getRecordCount(db3, 'dnb_courses');
        db3.close();
        
        console.log('\n🔍 DATABASE COUNT VERIFICATION:');
        console.log(`🏥 Medical: Valid Excel ${medical.valid} → DB ${medicalCount} | Match: ${medical.valid === medicalCount ? '✅' : '❌'}`);
        console.log(`🦷 Dental: Valid Excel ${dental.valid} → DB ${dentalCount} | Match: ${dental.valid === dentalCount ? '✅' : '❌'}`);
        console.log(`🏥 DNB: Valid Excel ${dnb.valid} → DB ${dnbCount} | Match: ${dnb.valid === dnbCount ? '✅' : '❌'}`);
        
        const allMatch = (medical.valid === medicalCount) && (dental.valid === dentalCount) && (dnb.valid === dnbCount);
        
        if (allMatch) {
            console.log('\n🎉 PERFECT! ALL VALID RECORDS SUCCESSFULLY IMPORTED!');
            console.log('📊 The discrepancies were due to invalid/empty rows being correctly filtered out.');
        } else {
            console.log('\n❌ SOME VALID RECORDS STILL MISSING - NEED TO INVESTIGATE FURTHER');
        }
        
        return { medical, dental, dnb, allMatch };
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
    const analyzer = new DetailedDiscrepancyAnalysis();
    analyzer.runCompleteAnalysis()
        .then(() => {
            console.log('\n✅ Analysis complete!');
        })
        .catch(error => {
            console.error('\n❌ Analysis failed:', error.message);
        });
}

module.exports = { DetailedDiscrepancyAnalysis };
