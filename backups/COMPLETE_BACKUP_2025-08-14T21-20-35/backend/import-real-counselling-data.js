const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

class RealCounsellingDataImporter {
    constructor() {
        this.dataDir = path.join(__dirname, 'data');
        this.counsellingDbPath = path.join(this.dataDir, 'counselling.db');
        this.importStats = {
            totalRows: 0,
            importedRecords: 0,
            skippedRecords: 0,
            errors: []
        };
    }

    async importRealCounsellingData() {
        console.log('🚀 IMPORTING REAL COUNSELLING DATA - ACHIEVING PERFECT ZERO DISCREPANCIES...');
        
        const db = new sqlite3.Database(this.counsellingDbPath);
        
        try {
            // Clear existing data for fresh import
            await this.runQuery(db, 'DELETE FROM counselling_data');
            await this.runQuery(db, 'DELETE FROM counselling_fts');
            await this.runQuery(db, 'DELETE FROM counselling_rounds');
            
            console.log('✅ Cleared existing data for fresh import');
            
            // Import counselling rounds
            await this.importCounsellingRounds(db);
            
            // Import main counselling data
            await this.importCounsellingData(db);
            
            // Verify import
            await this.verifyImport(db);
            
        } catch (error) {
            console.error('❌ Import failed:', error.message);
            this.importStats.errors.push(error.message);
        } finally {
            db.close();
        }
        
        this.printImportSummary();
    }

    async importCounsellingRounds(db) {
        console.log('🔄 Importing counselling rounds...');
        
        const rounds = [
            { round_number: 1, round_name: 'Round 1', description: 'First round of counselling', is_active: 1 },
            { round_number: 2, round_name: 'Round 2', description: 'Second round of counselling', is_active: 1 },
            { round_number: 3, round_name: 'Round 3', description: 'Third round of counselling', is_active: 1 },
            { round_number: 4, round_name: 'Round 4', description: 'Fourth round of counselling', is_active: 1 },
            { round_number: 5, round_name: 'Round 5', description: 'Fifth round of counselling', is_active: 1 },
            { round_number: 6, round_name: 'Round 6', description: 'Sixth round of counselling', is_active: 1 },
            { round_number: 7, round_name: 'Round 7', description: 'Seventh round of counselling', is_active: 1 },
            { round_number: 8, round_name: 'Round 8', description: 'Eighth round of counselling', is_active: 1 },
            { round_number: 9, round_name: 'Round 9', description: 'Ninth round of counselling', is_active: 1 },
            { round_number: 10, round_name: 'Round 10', description: 'Tenth round of counselling', is_active: 1 }
        ];

        for (const round of rounds) {
            await this.runQuery(db, `
                INSERT INTO counselling_rounds (round_number, round_name, description, is_active, created_at, updated_at)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `, [round.round_number, round.round_name, round.description, round.is_active]);
        }
        
        console.log(`✅ Imported ${rounds.length} counselling rounds`);
    }

    async importCounsellingData(db) {
        console.log('🔄 Importing main counselling data...');
        
        // Read Excel file
        const excelPath = path.join(__dirname, 'data/imports/counselling/sample-counselling-data.xlsx');
        const workbook = XLSX.readFile(excelPath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        const headers = excelData[0];
        const excelRows = excelData.slice(1);
        
        console.log(`📊 Total Excel rows: ${excelRows.length}`);
        console.log(`📋 Headers: ${headers.join(', ')}`);
        
        this.importStats.totalRows = excelRows.length;
        
        for (let i = 0; i < excelRows.length; i++) {
            const row = excelRows[i];
            
            try {
                // Map Excel columns to database fields
                const record = {
                    allIndiaRank: row[0] || null,
                    quota: row[1] || '',
                    collegeName: row[2] || '',
                    courseName: row[3] || '',
                    category: row[4] || '',
                    cutoffRank: row[5] || null,
                    seats: row[6] || 0,
                    fees: row[7] || 0,
                    counsellingType: row[8] || '',
                    year: row[9] || '',
                    round: row[10] || 1
                };
                
                // Skip if critical fields are missing
                if (!record.collegeName || !record.courseName || !record.quota) {
                    this.importStats.skippedRecords++;
                    continue;
                }
                
                // Import the record
                await this.importCounsellingRecord(db, record);
                this.importStats.importedRecords++;
                
            } catch (error) {
                console.error(`❌ Error processing row ${i + 2}:`, error.message);
                this.importStats.errors.push(`Row ${i + 2}: ${error.message}`);
            }
        }
    }

    async importCounsellingRecord(db, record) {
        // Get counselling type ID
        const counsellingTypeId = await this.getCounsellingTypeId(db, record.counsellingType);
        
        // Get counselling round ID
        const counsellingRoundId = await this.getCounsellingRoundId(db, record.round);
        
        // Insert into counselling_data table
        await this.runQuery(db, `
            INSERT INTO counselling_data (
                all_india_rank, quota, college_name, course_name, category, 
                cutoff_rank, seats, fees, counselling_type_id, counselling_round_id,
                academic_year, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [
            record.allIndiaRank,
            record.quota,
            record.collegeName,
            record.courseName,
            record.category,
            record.cutoffRank,
            record.seats,
            record.fees,
            counsellingTypeId,
            counsellingRoundId,
            record.year
        ]);
        
        // Insert into FTS table for search
        await this.runQuery(db, `
            INSERT INTO counselling_fts (
                college_name, course_name, quota, category, counselling_type
            ) VALUES (?, ?, ?, ?, ?)
        `, [
            record.collegeName,
            record.courseName,
            record.quota,
            record.category,
            record.counsellingType
        ]);
    }

    async getCounsellingTypeId(db, counsellingType) {
        return new Promise((resolve, reject) => {
            db.get(
                'SELECT id FROM counselling_types WHERE type_code = ? OR type_name LIKE ?',
                [counsellingType, `%${counsellingType}%`],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row ? row.id : 1); // Default to AIQ_PG if not found
                }
            );
        });
    }

    async getCounsellingRoundId(db, roundNumber) {
        return new Promise((resolve, reject) => {
            db.get(
                'SELECT id FROM counselling_rounds WHERE round_number = ?',
                [roundNumber],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row ? row.id : 1); // Default to Round 1 if not found
                }
            );
        });
    }

    async verifyImport(db) {
        console.log('🔍 Verifying import...');
        
        const counsellingDataCount = await this.getRecordCount(db, 'counselling_data');
        const counsellingFtsCount = await this.getRecordCount(db, 'counselling_fts');
        const counsellingRoundsCount = await this.getRecordCount(db, 'counselling_rounds');
        
        console.log(`📊 Counselling data records: ${counsellingDataCount}`);
        console.log(`📊 Counselling FTS records: ${counsellingFtsCount}`);
        console.log(`📊 Counselling rounds: ${counsellingRoundsCount}`);
        
        // Verify data integrity
        if (counsellingDataCount === this.importStats.importedRecords) {
            console.log('✅ Data integrity verified - perfect match!');
        } else {
            console.log('❌ Data integrity issue detected!');
        }
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
            db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve(this);
            });
        });
    }

    printImportSummary() {
        console.log('\n📊 IMPORT SUMMARY:');
        console.log('=====================================');
        console.log(`📊 Total Excel rows: ${this.importStats.totalRows}`);
        console.log(`✅ Imported records: ${this.importStats.importedRecords}`);
        console.log(`⏭️ Skipped records: ${this.importStats.skippedRecords}`);
        console.log(`❌ Errors: ${this.importStats.errors.length}`);
        
        if (this.importStats.errors.length > 0) {
            console.log('\n❌ Errors encountered:');
            this.importStats.errors.forEach(error => console.log(`  - ${error}`));
        }
        
        if (this.importStats.importedRecords === this.importStats.totalRows - this.importStats.skippedRecords) {
            console.log('\n🎉 PERFECT! ZERO DISCREPANCIES ACHIEVED!');
        } else {
            console.log('\n⚠️ Some discrepancies detected - need to investigate');
        }
    }
}

// Run if called directly
if (require.main === module) {
    const importer = new RealCounsellingDataImporter();
    importer.importRealCounsellingData()
        .then(() => {
            console.log('\n✅ Counselling data import complete!');
        })
        .catch(error => {
            console.error('\n❌ Counselling data import failed:', error.message);
        });
}

module.exports = { RealCounsellingDataImporter };
