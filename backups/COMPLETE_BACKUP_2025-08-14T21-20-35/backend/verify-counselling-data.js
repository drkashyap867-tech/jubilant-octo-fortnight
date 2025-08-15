const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class CounsellingDataVerifier {
    constructor() {
        this.dataDir = path.join(__dirname, 'data');
        this.counsellingDbPath = path.join(this.dataDir, 'counselling.db');
        this.counsellingDataDir = path.join(__dirname, '../counselling_data');
        this.verificationResults = {
            totalFiles: 0,
            verifiedFiles: 0,
            discrepancies: [],
            fileResults: []
        };
    }

    async verifyAllCounsellingData() {
        console.log('🔍 COMPREHENSIVE COUNSELLING DATA VERIFICATION...');
        console.log('=====================================');
        
        try {
            // Get all counselling files
            const allFiles = this.getAllCounsellingFiles();
            this.verificationResults.totalFiles = allFiles.length;
            
            console.log(`📊 Found ${allFiles.length} counselling files to verify`);
            
            // Verify each file
            for (let i = 0; i < allFiles.length; i++) {
                const file = allFiles[i];
                console.log(`\n📁 Verifying ${i + 1}/${allFiles.length}: ${file.filename}`);
                
                const result = await this.verifySingleFile(file);
                this.verificationResults.fileResults.push(result);
                
                if (result.verified) {
                    this.verificationResults.verifiedFiles++;
                    console.log(`✅ ${file.filename}: Excel ${result.excelRows} → DB ${result.dbRows} | Match: ✅`);
                } else {
                    this.verificationResults.discrepancies.push({
                        file: file.filename,
                        excelRows: result.excelRows,
                        dbRows: result.dbRows,
                        difference: Math.abs(result.excelRows - result.dbRows)
                    });
                    console.log(`❌ ${file.filename}: Excel ${result.excelRows} → DB ${result.dbRows} | Match: ❌`);
                }
                
                // Progress indicator
                if ((i + 1) % 10 === 0) {
                    console.log(`📊 Progress: ${i + 1}/${allFiles.length} files verified`);
                }
            }
            
            // Final verification
            await this.finalVerification();
            
        } catch (error) {
            console.error('❌ Verification failed:', error.message);
        }
        
        this.printVerificationSummary();
    }

    getAllCounsellingFiles() {
        const allFiles = [];
        
        // Scan all subdirectories
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
        
        // Sort files for logical processing
        allFiles.sort((a, b) => {
            if (a.subdir !== b.subdir) return a.subdir.localeCompare(b.subdir);
            return a.filename.localeCompare(b.filename);
        });
        
        return allFiles;
    }

    async verifySingleFile(file) {
        const result = {
            filename: file.filename,
            subdir: file.subdir,
            verified: false,
            excelRows: 0,
            dbRows: 0,
            error: null
        };
        
        try {
            // Read Excel file
            const workbook = XLSX.readFile(file.path);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            result.excelRows = excelData.length - 1; // Exclude header
            
            // Get database count for this file
            result.dbRows = await this.getDatabaseCountForFile(file);
            
            // Check if counts match
            result.verified = result.excelRows === result.dbRows;
            
        } catch (error) {
            result.error = error.message;
            console.error(`❌ Error verifying ${file.filename}:`, error.message);
        }
        
        return result;
    }

    async getDatabaseCountForFile(file) {
        const db = new sqlite3.Database(this.counsellingDbPath);
        
        try {
            // Extract year and round from filename
            const yearMatch = file.filename.match(/(\d{4})/);
            const roundMatch = file.filename.match(/R(\d+)/);
            
            let query = '';
            let params = [];
            
            if (file.subdir.startsWith('AIQ_PG')) {
                query = `
                    SELECT COUNT(*) FROM counselling_data 
                    WHERE counselling_type_id = 1 
                    AND academic_year = ?
                `;
                params = [yearMatch ? `${yearMatch[1]}-${parseInt(yearMatch[1]) + 1}` : '2024-25'];
            } else if (file.subdir.startsWith('AIQ_UG')) {
                query = `
                    SELECT COUNT(*) FROM counselling_data 
                    WHERE counselling_type_id = 2 
                    AND academic_year = ?
                `;
                params = [yearMatch ? `${yearMatch[1]}-${parseInt(yearMatch[1]) + 1}` : '2024-25'];
            } else if (file.subdir.includes('KEA')) {
                query = `
                    SELECT COUNT(*) FROM counselling_data 
                    WHERE counselling_type_id = 3 
                    AND academic_year = ?
                `;
                params = [yearMatch ? `${yearMatch[1]}-${parseInt(yearMatch[1]) + 1}` : '2024-25'];
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

    async finalVerification() {
        console.log('\n🔍 FINAL VERIFICATION...');
        
        const db = new sqlite3.Database(this.counsellingDbPath);
        
        const counsellingDataCount = await this.getRecordCount(db, 'counselling_data');
        const counsellingFtsCount = await this.getRecordCount(db, 'counselling_fts');
        
        console.log(`📊 Final counselling data records: ${counsellingDataCount}`);
        console.log(`📊 Final counselling FTS records: ${counsellingFtsCount}`);
        
        if (counsellingDataCount === counsellingFtsCount) {
            console.log('✅ Data integrity verified - perfect match!');
        } else {
            console.log('❌ Data integrity issue detected!');
        }
        
        db.close();
    }

    async getRecordCount(db, tableName) {
        return new Promise((resolve, reject) => {
            db.get(`SELECT COUNT(*) as count FROM ${tableName}`, (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
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

    printVerificationSummary() {
        console.log('\n📊 COMPREHENSIVE VERIFICATION SUMMARY:');
        console.log('=====================================');
        console.log(`📁 Total files verified: ${this.verificationResults.totalFiles}`);
        console.log(`✅ Verified files: ${this.verificationResults.verifiedFiles}`);
        console.log(`❌ Files with discrepancies: ${this.verificationResults.discrepancies.length}`);
        
        if (this.verificationResults.discrepancies.length > 0) {
            console.log('\n❌ DISCREPANCIES FOUND:');
            this.verificationResults.discrepancies.forEach(discrepancy => {
                console.log(`  - ${discrepancy.file}: Excel ${discrepancy.excelRows} → DB ${discrepancy.dbRows} (Diff: ${discrepancy.difference})`);
            });
        }
        
        console.log('\n📋 FILE-BY-FILE VERIFICATION RESULTS:');
        this.verificationResults.fileResults.forEach(result => {
            const status = result.verified ? '✅' : '❌';
            console.log(`${status} ${result.filename}: Excel ${result.excelRows} → DB ${result.dbRows}`);
        });
        
        if (this.verificationResults.discrepancies.length === 0) {
            console.log('\n🎉 PERFECT! ALL FILES VERIFIED WITH ZERO DISCREPANCIES!');
        } else {
            console.log(`\n⚠️ ${this.verificationResults.discrepancies.length} files have discrepancies - need to investigate`);
        }
    }
}

// Run if called directly
if (require.main === module) {
    const verifier = new CounsellingDataVerifier();
    verifier.verifyAllCounsellingData()
        .then(() => {
            console.log('\n✅ Counselling data verification complete!');
        })
        .catch(error => {
            console.error('\n❌ Counselling data verification failed:', error.message);
        });
}

module.exports = { CounsellingDataVerifier };
