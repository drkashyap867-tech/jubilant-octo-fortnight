const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class ComprehensiveAIQPG2023R3Fixer {
    constructor() {
        this.counsellingDbPath = path.join(__dirname, 'data/counselling.db');
        this.originalExcelPath = path.join(__dirname, '../counselling_data/AIQ_PG_2023/AIQ_PG_2023_R3.xlsx');
        this.fixResults = {
            originalRecords: 0,
            corruptedRecords: 0,
            newRecords: 0,
            errors: []
        };
    }

    async fixCorruptedData() {
        console.log('🔧 COMPREHENSIVE FIX FOR AIQ_PG_2023_R3 DATA CORRUPTION');
        console.log('==========================================================');
        
        try {
            // Step 1: Count current corrupted records
            await this.countCorruptedRecords();
            
            // Step 2: Remove all corrupted records for this file
            await this.removeCorruptedRecords();
            
            // Step 3: Re-import clean data from original Excel
            await this.reimportCleanData();
            
            // Step 4: Verify the fix
            await this.verifyFix();
            
            // Step 5: Print summary
            this.printFixSummary();
            
        } catch (error) {
            console.error('❌ Comprehensive fix failed:', error.message);
            this.fixResults.errors.push(error.message);
        }
    }

    async countCorruptedRecords() {
        console.log('\n🔍 Counting corrupted records...');
        
        const db = new sqlite3.Database(this.counsellingDbPath);
        
        try {
            const corruptedCount = await this.getRecordCount(db, `
                SELECT COUNT(*) FROM counselling_data 
                WHERE counselling_type_id = 1 
                AND academic_year = '2023-2024' 
                AND counselling_round_id = 3
            `);
            
            this.fixResults.corruptedRecords = corruptedCount;
            console.log(`📊 Found ${corruptedCount} corrupted records to remove`);
            
        } finally {
            db.close();
        }
    }

    async removeCorruptedRecords() {
        console.log('\n🗑️ Removing corrupted records...');
        
        const db = new sqlite3.Database(this.counsellingDbPath);
        
        try {
            const result = await this.runQuery(db, `
                DELETE FROM counselling_data 
                WHERE counselling_type_id = 1 
                AND academic_year = '2023-2024' 
                AND counselling_round_id = 3
            `);
            
            console.log(`✅ Removed ${result.changes} corrupted records`);
            
        } finally {
            db.close();
        }
    }

    async reimportCleanData() {
        console.log('\n📥 Re-importing clean data from original Excel...');
        
        try {
            // Read the original Excel file
            const workbook = XLSX.readFile(this.originalExcelPath);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            this.fixResults.originalRecords = excelData.length - 1; // Exclude header
            console.log(`📊 Excel file contains ${this.fixResults.originalRecords} rows of data`);
            
            // Import clean data
            await this.importCleanRecords(excelData);
            
        } catch (error) {
            throw new Error(`Failed to read original Excel file: ${error.message}`);
        }
    }

    async importCleanRecords(excelData) {
        const db = new sqlite3.Database(this.counsellingDbPath);
        
        try {
            // Begin transaction
            await this.runQuery(db, 'BEGIN TRANSACTION');
            
            // Skip header row
            for (let i = 1; i < excelData.length; i++) {
                const row = excelData[i];
                
                if (row.length >= 5) {
                    try {
                        // Clean the data by removing extra spaces
                        const cleanRank = this.cleanField(row[0]);
                        const cleanQuota = this.cleanField(row[1]);
                        const cleanCollege = this.cleanField(row[2]);
                        const cleanCourse = this.cleanField(row[3]);
                        const cleanCategory = this.cleanField(row[4]);
                        
                        // Insert clean record
                        await this.runQuery(db, `
                            INSERT INTO counselling_data (
                                all_india_rank, quota, college_name, course_name, category,
                                counselling_type_id, counselling_round_id, academic_year,
                                created_at, updated_at
                            ) VALUES (?, ?, ?, ?, ?, 1, 3, '2023-2024', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                        `, [cleanRank, cleanQuota, cleanCollege, cleanCourse, cleanCategory]);
                        
                        this.fixResults.newRecords++;
                        
                        if ((i + 1) % 1000 === 0) {
                            console.log(`📊 Progress: ${i + 1}/${excelData.length - 1} records imported`);
                        }
                        
                    } catch (error) {
                        this.fixResults.errors.push(`Failed to import row ${i + 1}: ${error.message}`);
                    }
                }
            }
            
            // Commit transaction
            await this.runQuery(db, 'COMMIT');
            console.log('✅ All clean records imported successfully');
            
        } catch (error) {
            // Rollback on error
            await this.runQuery(db, 'ROLLBACK');
            throw error;
        } finally {
            db.close();
        }
    }

    cleanField(field) {
        if (typeof field === 'string') {
            // Remove extra spaces and normalize
            return field.replace(/\s+/g, ' ').trim();
        }
        return field;
    }

    async verifyFix() {
        console.log('\n🔍 Verifying the fix...');
        
        const db = new sqlite3.Database(this.counsellingDbPath);
        
        try {
            // Check total records for this file
            const totalRecords = await this.getRecordCount(db, `
                SELECT COUNT(*) FROM counselling_data 
                WHERE counselling_type_id = 1 
                AND academic_year = '2023-2024' 
                AND counselling_round_id = 3
            `);
            
            console.log(`📊 Total AIQ_PG_2023_R3 records after fix: ${totalRecords}`);
            
            // Check if any corrupted records remain
            const remainingCorrupted = await this.getRecordCount(db, `
                SELECT COUNT(*) FROM counselling_data 
                WHERE counselling_type_id = 1 
                AND academic_year = '2023-2024' 
                AND counselling_round_id = 3 
                AND (all_india_rank LIKE '% %' OR quota LIKE '% %' OR college_name LIKE '% %' OR course_name LIKE '% %' OR category LIKE '% %')
            `);
            
            if (remainingCorrupted === 0) {
                console.log('✅ All corruption has been eliminated!');
            } else {
                console.log(`⚠️ ${remainingCorrupted} corrupted records still remain`);
            }
            
            // Sample some clean records
            console.log('\n📋 Sample of clean records:');
            const sampleRecords = await this.getSampleRecords(db);
            sampleRecords.forEach((record, index) => {
                console.log(`  ${index + 1}. Rank: ${record.all_india_rank} | ${record.course_name} | ${record.college_name.substring(0, 50)}...`);
            });
            
        } finally {
            db.close();
        }
    }

    async getSampleRecords(db) {
        return new Promise((resolve, reject) => {
            db.all(`
                SELECT all_india_rank, course_name, college_name 
                FROM counselling_data 
                WHERE counselling_type_id = 1 
                AND academic_year = '2023-2024' 
                AND counselling_round_id = 3 
                LIMIT 5
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async getRecordCount(db, query) {
        return new Promise((resolve, reject) => {
            db.get(query, (err, row) => {
                if (err) reject(err);
                else resolve(row ? row['COUNT(*)'] : 0);
            });
        });
    }

    async runQuery(db, sql, params = []) {
        return new Promise((resolve, reject) => {
            db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve({ changes: this.changes, lastID: this.lastID });
            });
        });
    }

    printFixSummary() {
        console.log('\n📊 COMPREHENSIVE FIX SUMMARY');
        console.log('=============================');
        console.log(`📁 Original Excel rows: ${this.fixResults.originalRecords}`);
        console.log(`🗑️ Corrupted records removed: ${this.fixResults.corruptedRecords}`);
        console.log(`📥 New clean records imported: ${this.fixResults.newRecords}`);
        console.log(`❌ Errors: ${this.fixResults.errors.length}`);
        
        if (this.fixResults.errors.length > 0) {
            console.log('\n❌ ERRORS ENCOUNTERED:');
            this.fixResults.errors.forEach((error, index) => {
                console.log(`  ${index + 1}. ${error}`);
            });
        }
        
        if (this.fixResults.newRecords === this.fixResults.originalRecords) {
            console.log('\n🎉 ALL CORRUPTED DATA SUCCESSFULLY FIXED! 🎉');
        } else {
            console.log(`\n⚠️ ${this.fixResults.originalRecords - this.fixResults.newRecords} records failed to import`);
        }
    }
}

// Run if called directly
if (require.main === module) {
    const fixer = new ComprehensiveAIQPG2023R3Fixer();
    fixer.fixCorruptedData()
        .then(() => {
            console.log('\n✅ Comprehensive data corruption fix complete!');
        })
        .catch(error => {
            console.error('\n❌ Comprehensive data corruption fix failed:', error.message);
        });
}

module.exports = { ComprehensiveAIQPG2023R3Fixer };
