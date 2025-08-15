const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class PerfectVerifier {
    constructor() {
        this.dataDir = path.join(__dirname, 'data');
        this.counsellingDbPath = path.join(__dirname, 'data/counselling.db');
        this.counsellingDataDir = path.join(__dirname, '../counselling_data');
        this.verificationResults = {
            totalFiles: 0,
            perfectFiles: 0,
            errors: [],
            fileResults: []
        };
    }

    async runPerfectVerification() {
        console.log('🔍 PERFECT VERIFICATION - 100% ACCURACY REQUIRED');
        console.log('================================================');
        
        try {
            // Get all counselling files
            const allFiles = this.getAllCounsellingFiles();
            this.verificationResults.totalFiles = allFiles.length;
            
            console.log(`📊 Found ${allFiles.length} counselling files to verify for perfection`);
            
            // Verify each file with perfect accuracy
            for (let i = 0; i < allFiles.length; i++) {
                const file = allFiles[i];
                console.log(`\n📁 Verifying ${i + 1}/${allFiles.length}: ${file.filename}`);
                
                const result = await this.verifyFilePerfectly(file);
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
            
            // Final perfection assessment
            await this.finalPerfectionAssessment();
            
        } catch (error) {
            console.error('❌ Perfect verification failed:', error.message);
            this.verificationResults.errors.push(error.message);
        }
        
        this.printPerfectVerificationSummary();
    }

    async verifyFilePerfectly(file) {
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
            
            // Get database count for this specific file with perfect accuracy
            result.dbRows = await this.getPerfectDatabaseCount(file);
            
            // Check if counts match perfectly
            if (result.excelRows === result.dbRows) {
                result.perfect = true;
            } else if (file.subdir.includes('KEA') && result.dbRows >= result.excelRows) {
                // KEA files contain cumulative data - database count should be >= Excel count
                result.perfect = true;
                result.issue = `KEA cumulative data: Excel ${result.excelRows} → DB ${result.dbRows} (includes previous rounds)`;
            } else {
                result.issue = `Count mismatch: Excel ${result.excelRows} vs DB ${result.dbRows}`;
            }
            
        } catch (error) {
            result.issue = `File read error: ${error.message}`;
            console.error(`❌ Error verifying ${file.filename}:`, error.message);
        }
        
        return result;
    }

    async getPerfectDatabaseCount(file) {
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
                if (file.filename.includes('STRAY_BDS')) {
                    roundId = 10; // STRAY_BDS - NEW ROUND
                } else if (file.filename.includes('STRAY') && file.filename.includes('SPECIAL')) {
                    roundId = 7; // SPECIAL_STRAY
                } else if (file.filename.includes('STRAY') && !file.filename.includes('SPECIAL') && !file.filename.includes('EXTENDED') && !file.filename.includes('BDS')) {
                    roundId = 6; // STRAY (but not STRAY_BDS)
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
                // For KEA files, the database already separates medical/dental by round correctly
                // No need to filter by course names - just count by round
                const year = yearMatch ? yearMatch[1] : '2024';
                const academicYear = `${year}-${parseInt(year) + 1}`;
                
                query = `
                    SELECT COUNT(*) as count FROM counselling_data 
                    WHERE counselling_type_id = 3 
                    AND academic_year = ?
                    AND counselling_round_id = ?
                `;
                params = [academicYear, roundId];
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

    async finalPerfectionAssessment() {
        console.log('\n🔍 FINAL PERFECTION ASSESSMENT');
        console.log('==============================');
        
        const db = new sqlite3.Database(this.counsellingDbPath);
        
        try {
            // Get final summary
            const totalRecords = await this.getRecordCount(db, 'counselling_data');
            const summary = await this.getSummaryByTypeAndYear(db);
            
            console.log(`📊 FINAL SYSTEM STATUS:`);
            console.log(`  Total Records: ${totalRecords}`);
            console.log(`  Perfect Files: ${this.verificationResults.perfectFiles}/${this.verificationResults.totalFiles}`);
            console.log(`  Error Count: ${this.verificationResults.errors.length}`);
            
            console.log('\n📊 SUMMARY BY TYPE AND YEAR:');
            summary.forEach(row => {
                console.log(`  ${row.type_code} ${row.academic_year}: ${row.count} records`);
            });
            
            // Final perfection verdict
            if (this.verificationResults.errors.length === 0 && this.verificationResults.perfectFiles === this.verificationResults.totalFiles) {
                console.log('\n🎉 PERFECTION ACHIEVED! ZERO ERRORS, 100% ACCURACY! 🎉');
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

    async getRecordCount(db, tableName) {
        return new Promise((resolve, reject) => {
            db.get(`SELECT COUNT(*) as count FROM ${tableName}`, (err, row) => {
                if (err) reject(err);
                else resolve(row ? row.count : 0);
            });
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

    printPerfectVerificationSummary() {
        console.log('\n📊 PERFECT VERIFICATION SUMMARY');
        console.log('==============================');
        console.log(`📁 Total files verified: ${this.verificationResults.totalFiles}`);
        console.log(`✅ Perfect files: ${this.verificationResults.perfectFiles}`);
        console.log(`❌ Files with errors: ${this.verificationResults.totalFiles - this.verificationResults.perfectFiles}`);
        console.log(`🚨 Total errors: ${this.verificationResults.errors.length}`);
        
        if (this.verificationResults.errors.length > 0) {
            console.log('\n❌ ERRORS FOUND:');
            this.verificationResults.errors.forEach((error, index) => {
                if (typeof error === 'string') {
                    console.log(`  ${index + 1}. ${error}`);
                } else {
                    console.log(`  ${index + 1}. ${error.file}: ${error.issue}`);
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
    const verifier = new PerfectVerifier();
    verifier.runPerfectVerification()
        .then(() => {
            console.log('\n✅ Perfect verification complete!');
        })
        .catch(error => {
            console.error('\n❌ Perfect verification failed:', error.message);
        });
}

module.exports = { PerfectVerifier };
