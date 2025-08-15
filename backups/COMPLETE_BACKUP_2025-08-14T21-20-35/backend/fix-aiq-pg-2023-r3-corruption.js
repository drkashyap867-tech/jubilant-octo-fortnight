const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class AIQPG2023R3CorrectionFixer {
    constructor() {
        this.counsellingDbPath = path.join(__dirname, 'data/counselling.db');
        this.correctionFilePath = '/Users/kashyapanand/Desktop/AIQ_PG_2023_R3_CORRECTION.xlsx';
        this.correctionResults = {
            totalCorrections: 0,
            successfulCorrections: 0,
            errors: [],
            corrections: []
        };
    }

    async fixCorruptedData() {
        console.log('🔧 FIXING AIQ_PG_2023_R3 DATA CORRUPTION');
        console.log('==========================================');
        
        try {
            // Step 1: Read the correction file
            const corrections = await this.readCorrectionFile();
            console.log(`📊 Found ${corrections.length} corrections to apply`);
            
            // Step 2: Apply corrections to database
            await this.applyCorrections(corrections);
            
            // Step 3: Verify fixes
            await this.verifyFixes();
            
            // Step 4: Print summary
            this.printCorrectionSummary();
            
        } catch (error) {
            console.error('❌ Correction failed:', error.message);
            this.correctionResults.errors.push(error.message);
        }
    }

    async readCorrectionFile() {
        console.log('\n📁 Reading correction file...');
        
        try {
            const workbook = XLSX.readFile(this.correctionFilePath);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            const corrections = [];
            
            // Skip header row
            for (let i = 1; i < data.length; i++) {
                const row = data[i];
                if (row.length >= 2) {
                    corrections.push({
                        corruptedRank: row[0], // Original corrupted rank
                        correctedRank: row[1]  // Corrected rank
                    });
                }
            }
            
            console.log(`✅ Successfully read ${corrections.length} corrections`);
            return corrections;
            
        } catch (error) {
            throw new Error(`Failed to read correction file: ${error.message}`);
        }
    }

    async applyCorrections(corrections) {
        console.log('\n🔧 Applying corrections to database...');
        
        const db = new sqlite3.Database(this.counsellingDbPath);
        
        try {
            // Begin transaction for better performance
            await this.runQuery(db, 'BEGIN TRANSACTION');
            
            for (let i = 0; i < corrections.length; i++) {
                const correction = corrections[i];
                
                try {
                    // Update the corrupted rank
                    const result = await this.runQuery(db, `
                        UPDATE counselling_data 
                        SET all_india_rank = ?, updated_at = CURRENT_TIMESTAMP
                        WHERE counselling_type_id = 1 
                        AND academic_year = '2023-2024' 
                        AND counselling_round_id = 3 
                        AND all_india_rank = ?
                    `, [correction.correctedRank, correction.corruptedRank]);
                    
                    if (result.changes > 0) {
                        this.correctionResults.successfulCorrections++;
                        this.correctionResults.corrections.push({
                            from: correction.corruptedRank,
                            to: correction.correctedRank,
                            status: 'SUCCESS'
                        });
                        
                        if ((i + 1) % 100 === 0) {
                            console.log(`📊 Progress: ${i + 1}/${corrections.length} corrections applied`);
                        }
                    } else {
                        this.correctionResults.errors.push(`No records found for rank: ${correction.corruptedRank}`);
                    }
                    
                } catch (error) {
                    this.correctionResults.errors.push(`Failed to correct ${correction.corruptedRank}: ${error.message}`);
                }
            }
            
            // Commit transaction
            await this.runQuery(db, 'COMMIT');
            console.log('✅ All corrections applied successfully');
            
        } catch (error) {
            // Rollback on error
            await this.runQuery(db, 'ROLLBACK');
            throw error;
        } finally {
            db.close();
        }
    }

    async verifyFixes() {
        console.log('\n🔍 Verifying fixes...');
        
        const db = new sqlite3.Database(this.counsellingDbPath);
        
        try {
            // Check if any corrupted records remain
            const remainingCorrupted = await this.getRecordCount(db, `
                SELECT COUNT(*) FROM counselling_data 
                WHERE counselling_type_id = 1 
                AND academic_year = '2023-2024' 
                AND counselling_round_id = 3 
                AND all_india_rank LIKE '% %'
            `);
            
            if (remainingCorrupted === 0) {
                console.log('✅ All corrupted records have been fixed!');
            } else {
                console.log(`⚠️ ${remainingCorrupted} corrupted records still remain`);
            }
            
            // Check total records for this file
            const totalRecords = await this.getRecordCount(db, `
                SELECT COUNT(*) FROM counselling_data 
                WHERE counselling_type_id = 1 
                AND academic_year = '2023-2024' 
                AND counselling_round_id = 3
            `);
            
            console.log(`📊 Total AIQ_PG_2023_R3 records: ${totalRecords}`);
            
        } finally {
            db.close();
        }
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

    printCorrectionSummary() {
        console.log('\n📊 CORRECTION SUMMARY');
        console.log('=====================');
        console.log(`📁 Total corrections: ${this.correctionResults.totalCorrections}`);
        console.log(`✅ Successful corrections: ${this.correctionResults.successfulCorrections}`);
        console.log(`❌ Errors: ${this.correctionResults.errors.length}`);
        
        if (this.correctionResults.errors.length > 0) {
            console.log('\n❌ ERRORS ENCOUNTERED:');
            this.correctionResults.errors.forEach((error, index) => {
                console.log(`  ${index + 1}. ${error}`);
            });
        }
        
        if (this.correctionResults.successfulCorrections === this.correctionResults.totalCorrections) {
            console.log('\n🎉 ALL CORRUPTED DATA SUCCESSFULLY FIXED! 🎉');
        } else {
            console.log(`\n⚠️ ${this.correctionResults.totalCorrections - this.correctionResults.successfulCorrections} corrections failed`);
        }
    }
}

// Run if called directly
if (require.main === module) {
    const fixer = new AIQPG2023R3CorrectionFixer();
    fixer.fixCorruptedData()
        .then(() => {
            console.log('\n✅ Data corruption fix complete!');
        })
        .catch(error => {
            console.error('\n❌ Data corruption fix failed:', error.message);
        });
}

module.exports = { AIQPG2023R3CorrectionFixer };
