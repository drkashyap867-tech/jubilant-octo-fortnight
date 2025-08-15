const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class AllCounsellingDataImporter {
    constructor() {
        this.dataDir = path.join(__dirname, 'data');
        this.counsellingDbPath = path.join(__dirname, 'data/counselling.db');
        this.importStats = {
            counsellingTypesImported: 0,
            counsellingDataImported: 0,
            counsellingRoundsImported: 0,
            totalRecords: 0,
            errors: []
        };
    }

    async importAllCounsellingData() {
        console.log('🚀 IMPORTING ALL COUNSELLING DATA - COMPREHENSIVE IMPORT...');
        
        const db = new sqlite3.Database(this.counsellingDbPath);
        
        try {
            // Clear existing data for fresh import
            await this.clearAllData(db);
            
            // Import counselling types from sample-counselling.xlsx
            await this.importCounsellingTypes(db);
            
            // Import counselling rounds
            await this.importCounsellingRounds(db);
            
            // Import counselling data from sample-counselling-data.xlsx
            await this.importCounsellingData(db);
            
            // Verify complete import
            await this.verifyCompleteImport(db);
            
        } catch (error) {
            console.error('❌ Import failed:', error.message);
            this.importStats.errors.push(error.message);
        } finally {
            db.close();
        }
        
        this.printCompleteImportSummary();
    }

    async clearAllData(db) {
        console.log('🗑️ Clearing all existing counselling data...');
        
        const clearQueries = [
            'DELETE FROM counselling_data',
            'DELETE FROM counselling_fts',
            'DELETE FROM counselling_rounds',
            'DELETE FROM counselling_types'
        ];
        
        for (const query of clearQueries) {
            await this.runQuery(db, query);
        }
        
        console.log('✅ All data cleared');
    }

    async importCounsellingTypes(db) {
        console.log('🔄 Importing counselling types from sample-counselling.xlsx...');
        
        try {
            const excelPath = path.join(__dirname, 'data/imports/counselling/sample-counselling.xlsx');
            const workbook = XLSX.readFile(excelPath);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            const headers = data[0];
            const rows = data.slice(1);
            
            console.log(`📊 Total counselling type rows: ${rows.length}`);
            console.log(`📋 Headers: ${headers.join(', ')}`);
            
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                
                try {
                    const counsellingType = {
                        typeCode: row[0] || '',
                        name: row[1] || '',
                        description: row[2] || '',
                        quotaType: row[3] || '',
                        authority: row[4] || '',
                        website: row[5] || '',
                        contactInfo: row[6] || '',
                        isActive: row[7] === 'Yes' ? 1 : 0,
                        searchPriority: row[8] || 0
                    };
                    
                    if (counsellingType.typeCode && counsellingType.name) {
                        await this.insertCounsellingType(db, counsellingType);
                        this.importStats.counsellingTypesImported++;
                    }
                    
                } catch (error) {
                    console.error(`❌ Error processing counselling type row ${i + 2}:`, error.message);
                    this.importStats.errors.push(`Counselling type row ${i + 2}: ${error.message}`);
                }
            }
            
            console.log(`✅ Imported ${this.importStats.counsellingTypesImported} counselling types`);
            
        } catch (error) {
            console.error('❌ Error reading counselling types Excel:', error.message);
            this.importStats.errors.push(`Counselling types Excel read error: ${error.message}`);
        }
    }

    async insertCounsellingType(db, counsellingType) {
        await this.runQuery(db, `
            INSERT INTO counselling_types (
                type_code, type_name, description, scope, authority, 
                website, is_active, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [
            counsellingType.typeCode,
            counsellingType.name,
            counsellingType.description,
            counsellingType.quotaType,
            counsellingType.authority,
            counsellingType.website,
            counsellingType.isActive
        ]);
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
        
        this.importStats.counsellingRoundsImported = rounds.length;
        console.log(`✅ Imported ${rounds.length} counselling rounds`);
    }

    async importCounsellingData(db) {
        console.log('🔄 Importing counselling data from sample-counselling-data.xlsx...');
        
        try {
            const excelPath = path.join(__dirname, 'data/imports/counselling/sample-counselling-data.xlsx');
            const workbook = XLSX.readFile(excelPath);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            const headers = excelData[0];
            const excelRows = excelData.slice(1);
            
            console.log(`📊 Total counselling data rows: ${excelRows.length}`);
            console.log(`📋 Headers: ${headers.join(', ')}`);
            
            this.importStats.totalRecords = excelRows.length;
            
            for (let i = 0; i < excelRows.length; i++) {
                const row = excelRows[i];
                
                try {
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
                    
                    if (record.collegeName && record.courseName && record.quota) {
                        await this.insertCounsellingRecord(db, record);
                        this.importStats.counsellingDataImported++;
                    }
                    
                } catch (error) {
                    console.error(`❌ Error processing counselling data row ${i + 2}:`, error.message);
                    this.importStats.errors.push(`Counselling data row ${i + 2}: ${error.message}`);
                }
            }
            
            console.log(`✅ Imported ${this.importStats.counsellingDataImported} counselling data records`);
            
        } catch (error) {
            console.error('❌ Error reading counselling data Excel:', error.message);
            this.importStats.errors.push(`Counselling data Excel read error: ${error.message}`);
        }
    }

    async insertCounsellingRecord(db, record) {
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
                    else resolve(row ? row.id : 1); // Default to first type if not found
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

    async verifyCompleteImport(db) {
        console.log('🔍 Verifying complete import...');
        
        const counsellingTypesCount = await this.getRecordCount(db, 'counselling_types');
        const counsellingDataCount = await this.getRecordCount(db, 'counselling_data');
        const counsellingFtsCount = await this.getRecordCount(db, 'counselling_fts');
        const counsellingRoundsCount = await this.getRecordCount(db, 'counselling_rounds');
        
        console.log(`📊 Counselling types: ${counsellingTypesCount}`);
        console.log(`📊 Counselling data: ${counsellingDataCount}`);
        console.log(`📊 Counselling FTS: ${counsellingFtsCount}`);
        console.log(`📊 Counselling rounds: ${counsellingRoundsCount}`);
        
        // Verify data integrity
        if (counsellingDataCount === this.importStats.counsellingDataImported) {
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

    printCompleteImportSummary() {
        console.log('\n📊 COMPLETE COUNSELLING IMPORT SUMMARY:');
        console.log('=====================================');
        console.log(`📊 Counselling types imported: ${this.importStats.counsellingTypesImported}`);
        console.log(`📊 Counselling rounds imported: ${this.importStats.counsellingRoundsImported}`);
        console.log(`📊 Counselling data imported: ${this.importStats.counsellingDataImported}`);
        console.log(`📊 Total Excel rows processed: ${this.importStats.totalRecords}`);
        console.log(`❌ Errors: ${this.importStats.errors.length}`);
        
        if (this.importStats.errors.length > 0) {
            console.log('\n❌ Errors encountered:');
            this.importStats.errors.forEach(error => console.log(`  - ${error}`));
        }
        
        if (this.importStats.counsellingDataImported === this.importStats.totalRecords) {
            console.log('\n🎉 PERFECT! ALL COUNSELLING DATA IMPORTED SUCCESSFULLY!');
        } else {
            console.log('\n⚠️ Some counselling data not imported - need to investigate');
        }
    }
}

// Run if called directly
if (require.main === module) {
    const importer = new AllCounsellingDataImporter();
    importer.importAllCounsellingData()
        .then(() => {
            console.log('\n✅ Complete counselling data import finished!');
        })
        .catch(error => {
            console.error('\n❌ Complete counselling data import failed:', error.message);
        });
}

module.exports = { AllCounsellingDataImporter };
