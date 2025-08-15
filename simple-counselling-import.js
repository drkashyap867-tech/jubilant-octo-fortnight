const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class SimpleCounsellingImporter {
    constructor() {
        this.dataDir = path.join(__dirname, 'data');
        this.counsellingDbPath = path.join(this.dataDir, 'counselling.db');
    }

    async importCounsellingData() {
        console.log('🚀 SIMPLE COUNSELLING DATA IMPORT...');
        
        try {
            // Test database connection first
            const db = new sqlite3.Database(this.counsellingDbPath);
            
            console.log('✅ Database connection successful');
            
            // Check if tables exist
            const tables = await this.getTables(db);
            console.log('📊 Available tables:', tables.join(', '));
            
            // Clear existing data
            await this.clearData(db);
            
            // Import counselling rounds
            await this.importRounds(db);
            
            // Import main data
            await this.importMainData(db);
            
            // Verify
            await this.verifyData(db);
            
            db.close();
            console.log('✅ Import completed successfully!');
            
        } catch (error) {
            console.error('❌ Import failed:', error.message);
        }
    }

    async getTables(db) {
        return new Promise((resolve, reject) => {
            db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
                if (err) reject(err);
                else resolve(rows.map(row => row.name));
            });
        });
    }

    async clearData(db) {
        console.log('🗑️ Clearing existing data...');
        
        const clearQueries = [
            'DELETE FROM counselling_data',
            'DELETE FROM counselling_fts',
            'DELETE FROM counselling_rounds'
        ];
        
        for (const query of clearQueries) {
            await this.runQuery(db, query);
        }
        
        console.log('✅ Data cleared');
    }

    async importRounds(db) {
        console.log('🔄 Importing counselling rounds...');
        
        const rounds = [
            { number: 1, name: 'Round 1', description: 'First round' },
            { number: 2, name: 'Round 2', description: 'Second round' },
            { number: 3, name: 'Round 3', description: 'Third round' },
            { number: 4, name: 'Round 4', description: 'Fourth round' },
            { number: 5, name: 'Round 5', description: 'Fifth round' }
        ];
        
        for (const round of rounds) {
            await this.runQuery(db, `
                INSERT INTO counselling_rounds (round_number, round_name, description, is_active, created_at, updated_at)
                VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `, [round.number, round.name, round.description]);
        }
        
        console.log(`✅ Imported ${rounds.length} rounds`);
    }

    async importMainData(db) {
        console.log('🔄 Importing main counselling data...');
        
        try {
            const excelPath = path.join(__dirname, 'data/imports/counselling/sample-counselling-data.xlsx');
            const workbook = XLSX.readFile(excelPath);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            const headers = data[0];
            const rows = data.slice(1);
            
            console.log(`📊 Total rows: ${rows.length}`);
            console.log(`📋 Headers: ${headers.join(', ')}`);
            
            let imported = 0;
            let skipped = 0;
            
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                
                try {
                    const record = {
                        rank: row[0] || null,
                        quota: row[1] || '',
                        college: row[2] || '',
                        course: row[3] || '',
                        category: row[4] || '',
                        cutoff: row[5] || null,
                        seats: row[6] || 0,
                        fees: row[7] || 0,
                        type: row[8] || '',
                        year: row[9] || '',
                        round: row[10] || 1
                    };
                    
                    if (record.college && record.course && record.quota) {
                        await this.insertRecord(db, record);
                        imported++;
                    } else {
                        skipped++;
                    }
                    
                } catch (error) {
                    console.error(`❌ Error in row ${i + 2}:`, error.message);
                    skipped++;
                }
            }
            
            console.log(`✅ Imported: ${imported}, Skipped: ${skipped}`);
            
        } catch (error) {
            console.error('❌ Excel read error:', error.message);
        }
    }

    async insertRecord(db, record) {
        // Get counselling type ID (default to 1 for AIQ_PG)
        const typeId = 1;
        
        // Get round ID (default to 1 for Round 1)
        const roundId = 1;
        
        // Insert main record
        await this.runQuery(db, `
            INSERT INTO counselling_data (
                all_india_rank, quota, college_name, course_name, category,
                cutoff_rank, seats, fees, counselling_type_id, counselling_round_id,
                academic_year, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [
            record.rank, record.quota, record.college, record.course, record.category,
            record.cutoff, record.seats, record.fees, typeId, roundId, record.year
        ]);
        
        // Insert FTS record
        await this.runQuery(db, `
            INSERT INTO counselling_fts (college_name, course_name, quota, category, counselling_type)
            VALUES (?, ?, ?, ?, ?)
        `, [record.college, record.course, record.quota, record.category, record.type]);
    }

    async verifyData(db) {
        console.log('🔍 Verifying imported data...');
        
        const dataCount = await this.getCount(db, 'counselling_data');
        const ftsCount = await this.getCount(db, 'counselling_fts');
        const roundsCount = await this.getCount(db, 'counselling_rounds');
        
        console.log(`📊 Counselling data: ${dataCount} records`);
        console.log(`📊 FTS data: ${ftsCount} records`);
        console.log(`📊 Rounds: ${roundsCount} records`);
        
        if (dataCount > 0) {
            console.log('✅ Data import verified successfully!');
        } else {
            console.log('❌ No data imported!');
        }
    }

    async getCount(db, table) {
        return new Promise((resolve, reject) => {
            db.get(`SELECT COUNT(*) as count FROM ${table}`, (err, row) => {
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
}

// Run if called directly
if (require.main === module) {
    const importer = new SimpleCounsellingImporter();
    importer.importCounsellingData()
        .then(() => {
            console.log('\n✅ Simple counselling import complete!');
        })
        .catch(error => {
            console.error('\n❌ Simple counselling import failed:', error.message);
        });
}

module.exports = { SimpleCounsellingImporter };
