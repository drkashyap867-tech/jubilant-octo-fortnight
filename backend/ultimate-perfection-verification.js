const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class UltimatePerfectionVerifier {
    constructor() {
        this.dataDir = path.join(__dirname, 'data');
        this.counsellingDbPath = path.join(__dirname, 'data/counselling.db');
        this.counsellingDataDir = path.join(__dirname, '../counselling_data');
        this.verificationResults = {
            totalFiles: 0,
            perfectFiles: 0,
            errors: [],
            warnings: [],
            fileResults: []
        };
    }

    async runUltimatePerfectionVerification() {
        console.log('🔍 ULTIMATE PERFECTION VERIFICATION - ZERO TOLERANCE FOR ERRORS');
        console.log('================================================================');
        
        try {
            // Phase 1: Database Integrity Verification
            await this.verifyDatabaseIntegrity();
            
            // Phase 2: File-by-File Perfection Check
            await this.verifyAllFilesPerfection();
            
            // Phase 3: Data Quality and Consistency Check
            await this.verifyDataQualityAndConsistency();
            
            // Phase 4: Final Perfection Assessment
            await this.finalPerfectionAssessment();
            
        } catch (error) {
            console.error('❌ Ultimate verification failed:', error.message);
            this.verificationResults.errors.push(error.message);
        }
        
        this.printUltimatePerfectionSummary();
    }

    async verifyDatabaseIntegrity() {
        console.log('\n🔍 PHASE 1: DATABASE INTEGRITY VERIFICATION');
        console.log('==========================================');
        
        const db = new sqlite3.Database(this.counsellingDbPath);
        
        try {
            // Check total records
            const counsellingDataCount = await this.getRecordCount(db, 'counselling_data');
            const counsellingFtsCount = await this.getRecordCount(db, 'counselling_fts');
            
            console.log(`📊 Counselling Data Records: ${counsellingDataCount}`);
            console.log(`📊 Counselling FTS Records: ${counsellingFtsCount}`);
            
            if (counsellingDataCount !== counsellingFtsCount) {
                this.verificationResults.errors.push(`Data integrity failure: counselling_data (${counsellingDataCount}) != counselling_fts (${counsellingFtsCount})`);
                console.log('❌ Data integrity issue detected!');
            } else {
                console.log('✅ Data integrity verified - perfect match!');
            }
            
            // Check foreign key integrity
            const invalidTypeIds = await this.getRecordCount(db, `
                SELECT COUNT(*) FROM counselling_data cd 
                LEFT JOIN counselling_types ct ON cd.counselling_type_id = ct.id 
                WHERE ct.id IS NULL
            `);
            
            const invalidRoundIds = await this.getRecordCount(db, `
                SELECT COUNT(*) FROM counselling_data cd 
                LEFT JOIN counselling_rounds cr ON cd.counselling_round_id = cr.id 
                WHERE cr.id IS NULL
            `);
            
            if (invalidTypeIds > 0) {
                this.verificationResults.errors.push(`Foreign key violation: ${invalidTypeIds} records have invalid counselling_type_id`);
            }
            
            if (invalidRoundIds > 0) {
                this.verificationResults.errors.push(`Foreign key violation: ${invalidRoundIds} records have invalid counselling_round_id`);
            }
            
            console.log(`🔗 Foreign Key Integrity: Type IDs - ${invalidTypeIds === 0 ? '✅' : '❌'}, Round IDs - ${invalidRoundIds === 0 ? '✅' : '❌'}`);
            
        } finally {
            db.close();
        }
    }

    async verifyAllFilesPerfection() {
        console.log('\n🔍 PHASE 2: FILE-BY-FILE PERFECTION CHECK');
        console.log('==========================================');
        
        const allFiles = this.getAllCounsellingFiles();
        this.verificationResults.totalFiles = allFiles.length;
        
        console.log(`📊 Found ${allFiles.length} counselling files to verify for perfection`);
        
        for (let i = 0; i < allFiles.length; i++) {
            const file = allFiles[i];
            console.log(`\n📁 Verifying ${i + 1}/${allFiles.length}: ${file.filename}`);
            
            const result = await this.verifySingleFilePerfection(file);
            this.verificationResults.fileResults.push(result);
            
            if (result.perfect) {
                this.verificationResults.perfectFiles++;
                console.log(`✅ ${file.filename}: Excel ${result.excelRows} → DB ${result.dbRows} | PERFECT MATCH ✅`);
            } else {
                this.verificationResults.errors.push({
                    file: file.filename,
                    excelRows: result.excelRows,
                    dbRows: result.dbRows,
                    difference: Math.abs(result.excelRows - result.dbRows),
                    issue: result.issue
                });
                console.log(`❌ ${file.filename}: Excel ${result.excelRows} → DB ${result.dbRows} | ERROR: ${result.issue}`);
            }
            
            if ((i + 1) % 10 === 0) {
                console.log(`📊 Progress: ${i + 1}/${allFiles.length} files verified`);
            }
        }
    }

    async verifySingleFilePerfection(file) {
        const result = {
            filename: file.filename,
            subdir: file.subdir,
            perfect: false,
            excelRows: 0,
            dbRows: 0,
            issue: null
        };
        
        try {
            // Read Excel file
            const workbook = XLSX.readFile(file.path);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            result.excelRows = excelData.length - 1; // Exclude header
            
            // Get database count for this specific file
            result.dbRows = await this.getDatabaseCountForSpecificFile(file);
            
            // Check if counts match perfectly
            if (result.excelRows === result.dbRows) {
                result.perfect = true;
            } else {
                result.issue = `Count mismatch: Excel ${result.excelRows} vs DB ${result.dbRows}`;
            }
            
        } catch (error) {
            result.issue = `File read error: ${error.message}`;
            console.error(`❌ Error verifying ${file.filename}:`, error.message);
        }
        
        return result;
    }

    async getDatabaseCountForSpecificFile(file) {
        const db = new sqlite3.Database(this.counsellingDbPath);
        
        try {
            // Extract year and round from filename
            const yearMatch = file.filename.match(/(\d{4})/);
            const roundMatch = file.filename.match(/R(\d+)/);
            
            // Determine the correct round ID for this file
            let roundId = 1; // Default to Round 1
            
            if (roundMatch) {
                roundId = parseInt(roundMatch[1]);
            } else {
                // Handle special rounds
                if (file.filename.includes('STRAY') && file.filename.includes('SPECIAL')) {
                    roundId = 7; // SPECIAL_STRAY
                } else if (file.filename.includes('STRAY') && !file.filename.includes('SPECIAL') && !file.filename.includes('EXTENDED')) {
                    roundId = 6; // STRAY
                } else if (file.filename.includes('MOPUP')) {
                    roundId = 8; // MOPUP
                } else if (file.filename.includes('EXTENDED_STRAY')) {
                    roundId = 9; // EXTENDED_STRAY
                }
            }
            
            let query = '';
            let params = [];
            
            if (file.subdir.startsWith('AIQ_PG')) {
                query = `
                    SELECT COUNT(*) as count FROM counselling_data 
                    WHERE counselling_type_id = 1 
                    AND academic_year = ?
                    AND counselling_round_id = ?
                `;
                const year = yearMatch ? yearMatch[1] : '2024';
                params = [`${year}-${parseInt(year) + 1}`, roundId];
            } else if (file.subdir.startsWith('AIQ_UG')) {
                query = `
                    SELECT COUNT(*) as count FROM counselling_data 
                    WHERE counselling_type_id = 2 
                    AND academic_year = ?
                    AND counselling_round_id = ?
                `;
                const year = yearMatch ? yearMatch[1] : '2024';
                params = [`${year}-${parseInt(year) + 1}`, roundId];
            } else if (file.subdir.includes('KEA')) {
                query = `
                    SELECT COUNT(*) as count FROM counselling_data 
                    WHERE counselling_type_id = 3 
                    AND academic_year = ?
                    AND counselling_round_id = ?
                `;
                const year = yearMatch ? yearMatch[1] : '2024';
                params = [`${year}-${parseInt(year) + 1}`, roundId];
            }
            
            if (query) {
                const count = await this.runQuery(db, query, params);
                return count;
            }
            
            return 0;
            
        } finally {
            db.close();
        }
    }

    async verifyDataQualityAndConsistency() {
        console.log('\n🔍 PHASE 3: DATA QUALITY AND CONSISTENCY CHECK');
        console.log('===============================================');
        
        const db = new sqlite3.Database(this.counsellingDbPath);
        
        try {
            // Check for data quality issues
            const nullCollegeNames = await this.getRecordCount(db, `
                SELECT COUNT(*) FROM counselling_data 
                WHERE college_name IS NULL OR college_name = '' OR college_name = 'NULL'
            `);
            
            const nullCourseNames = await this.getRecordCount(db, `
                SELECT COUNT(*) FROM counselling_data 
                WHERE course_name IS NULL OR course_name = '' OR course_name = 'NULL'
            `);
            
            const nullCategories = await this.getRecordCount(db, `
                SELECT COUNT(*) FROM counselling_data 
                WHERE category IS NULL OR category = '' OR category = 'NULL'
            `);
            
            const invalidSeats = await this.getRecordCount(db, `
                SELECT COUNT(*) FROM counselling_data 
                WHERE seats < 0 OR seats IS NULL
            `);
            
            const invalidFees = await this.getRecordCount(db, `
                SELECT COUNT(*) FROM counselling_data 
                WHERE fees < 0 OR fees IS NULL
            `);
            
            console.log(`🏫 Data Quality Check:`);
            console.log(`  College Names: ${nullCollegeNames === 0 ? '✅' : '❌'} (${nullCollegeNames} issues)`);
            console.log(`  Course Names: ${nullCourseNames === 0 ? '✅' : '❌'} (${nullCourseNames} issues)`);
            console.log(`  Categories: ${nullCategories === 0 ? '✅' : '❌'} (${nullCategories} issues)`);
            console.log(`  Seats: ${invalidSeats === 0 ? '✅' : '❌'} (${invalidSeats} issues)`);
            console.log(`  Fees: ${invalidFees === 0 ? '✅' : '❌'} (${invalidFees} issues)`);
            
            // Add any issues to results
            if (nullCollegeNames > 0) this.verificationResults.errors.push(`${nullCollegeNames} records have invalid college names`);
            if (nullCourseNames > 0) this.verificationResults.errors.push(`${nullCourseNames} records have invalid course names`);
            if (nullCategories > 0) this.verificationResults.errors.push(`${nullCategories} records have invalid categories`);
            if (invalidSeats > 0) this.verificationResults.errors.push(`${invalidSeats} records have invalid seats`);
            if (invalidFees > 0) this.verificationResults.errors.push(`${invalidFees} records have invalid fees`);
            
        } finally {
            db.close();
        }
    }

    async finalPerfectionAssessment() {
        console.log('\n🔍 PHASE 4: FINAL PERFECTION ASSESSMENT');
        console.log('========================================');
        
        const db = new sqlite3.Database(this.counsellingDbPath);
        
        try {
            // Get final summary
            const totalRecords = await this.getRecordCount(db, 'counselling_data');
            const summary = await this.getSummaryByTypeAndYear(db);
            
            console.log(`📊 FINAL SYSTEM STATUS:`);
            console.log(`  Total Records: ${totalRecords}`);
            console.log(`  Perfect Files: ${this.verificationResults.perfectFiles}/${this.verificationResults.totalFiles}`);
            console.log(`  Error Count: ${this.verificationResults.errors.length}`);
            console.log(`  Warning Count: ${this.verificationResults.warnings.length}`);
            
            console.log('\n📊 SUMMARY BY TYPE AND YEAR:');
            summary.forEach(row => {
                console.log(`  ${row.type_code} ${row.academic_year}: ${row.count} records`);
            });
            
            // Final perfection verdict
            if (this.verificationResults.errors.length === 0 && this.verificationResults.perfectFiles === this.verificationResults.totalFiles) {
                console.log('\n🎉 ULTIMATE PERFECTION ACHIEVED! ZERO ERRORS, 100% ACCURACY! 🎉');
            } else {
                console.log(`\n⚠️ PERFECTION NOT ACHIEVED: ${this.verificationResults.errors.length} errors, ${this.verificationResults.totalFiles - this.verificationResults.perfectFiles} file mismatches`);
            }
            
        } finally {
            db.close();
        }
    }

    getAllCounsellingFiles() {
        const allFiles = [];
        
        const subdirs = fs.readdirSync(this.counsellingDataDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
        
        for (const subdir of subdirs) {
            const subdirPath = path.join(this.counsellingDataDir, subdir);
            const files = fs.readdirSync(subdirPath)
                .filter(file => file.endsWith('.xlsx'))
                .map(file => ({
                    path: path.join(subdirPath, file),
                    filename: file,
                    subdir: subdir
                }));
            
            allFiles.push(...files);
        }
        
        allFiles.sort((a, b) => {
            if (a.subdir !== b.subdir) return a.subdir.localeCompare(b.subdir);
            return a.filename.localeCompare(b.filename);
        });
        
        return allFiles;
    }

    async getRecordCount(db, query) {
        return new Promise((resolve, reject) => {
            if (typeof query === 'string') {
                db.get(query, (err, row) => {
                    if (err) reject(err);
                    else resolve(row ? row.count : 0);
                });
            } else {
                db.get(`SELECT COUNT(*) as count FROM ${query}`, (err, row) => {
                    if (err) reject(err);
                    else resolve(row ? row.count : 0);
                });
            }
        });
    }

    async runQuery(db, sql, params = []) {
        return new Promise((resolve, reject) => {
            db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row ? row.count : 0);
            });
        });
    }

    async getSummaryByTypeAndYear(db) {
        return new Promise((resolve, reject) => {
            db.all(`
                SELECT ct.type_code, cd.academic_year, COUNT(*) as count 
                FROM counselling_data cd 
                JOIN counselling_types ct ON cd.counselling_type_id = ct.id 
                GROUP BY ct.type_code, cd.academic_year 
                ORDER BY ct.type_code, cd.academic_year
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    printUltimatePerfectionSummary() {
        console.log('\n📊 ULTIMATE PERFECTION VERIFICATION SUMMARY');
        console.log('==========================================');
        console.log(`📁 Total files verified: ${this.verificationResults.totalFiles}`);
        console.log(`✅ Perfect files: ${this.verificationResults.perfectFiles}`);
        console.log(`❌ Files with errors: ${this.verificationResults.totalFiles - this.verificationResults.perfectFiles}`);
        console.log(`🚨 Total errors: ${this.verificationResults.errors.length}`);
        console.log(`⚠️ Total warnings: ${this.verificationResults.warnings.length}`);
        
        if (this.verificationResults.errors.length > 0) {
            console.log('\n❌ ERRORS FOUND:');
            this.verificationResults.errors.forEach((error, index) => {
                if (typeof error === 'string') {
                    console.log(`  ${index + 1}. ${error}`);
                } else {
                    console.log(`  ${index + 1}. ${error.file}: ${error.issue || `Excel ${error.excelRows} → DB ${error.dbRows} (Diff: ${error.difference})`}`);
                }
            });
        }
        
        console.log('\n📋 FILE-BY-FILE PERFECTION RESULTS:');
        this.verificationResults.fileResults.forEach(result => {
            const status = result.perfect ? '✅' : '❌';
            const issue = result.issue ? ` - ${result.issue}` : '';
            console.log(`${status} ${result.filename}: Excel ${result.excelRows} → DB ${result.dbRows}${issue}`);
        });
        
        if (this.verificationResults.errors.length === 0 && this.verificationResults.perfectFiles === this.verificationResults.totalFiles) {
            console.log('\n🎉 PERFECTION ACHIEVED! ZERO ERRORS, 100% ACCURACY! 🎉');
        } else {
            console.log(`\n⚠️ PERFECTION NOT ACHIEVED: ${this.verificationResults.errors.length} errors, ${this.verificationResults.totalFiles - this.verificationResults.perfectFiles} file mismatches`);
        }
    }
}

// Run if called directly
if (require.main === module) {
    const verifier = new UltimatePerfectionVerifier();
    verifier.runUltimatePerfectionVerification()
        .then(() => {
            console.log('\n✅ Ultimate perfection verification complete!');
        })
        .catch(error => {
            console.error('\n❌ Ultimate perfection verification failed:', error.message);
        });
}

module.exports = { UltimatePerfectionVerifier };
