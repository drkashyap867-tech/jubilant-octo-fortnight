const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class SimpleCounsellingVerifier {
    constructor() {
        this.dataDir = path.join(__dirname, 'data');
        this.counsellingDbPath = path.join(__dirname, 'data/counselling.db');
    }

    async verifyCounsellingData() {
        console.log('🔍 SIMPLE COUNSELLING DATA VERIFICATION...');
        console.log('=====================================');
        
        try {
            const db = new sqlite3.Database(this.counsellingDbPath);
            
            // Get total counts
            const totalRecords = await this.getRecordCount(db, 'counselling_data');
            const totalFts = await this.getRecordCount(db, 'counselling_fts');
            
            console.log(`📊 Total Counselling Records: ${totalRecords}`);
            console.log(`📊 Total FTS Records: ${totalFts}`);
            
            if (totalRecords === totalFts) {
                console.log('✅ Data integrity verified - perfect match!');
            } else {
                console.log('❌ Data integrity issue detected!');
            }
            
            // Get counts by counselling type
            console.log('\n📊 RECORDS BY COUNSELLING TYPE:');
            const typeCounts = await this.getRecordsByType(db);
            typeCounts.forEach(type => {
                console.log(`  ${type.type_code}: ${type.count} records`);
            });
            
            // Get counts by academic year
            console.log('\n📊 RECORDS BY ACADEMIC YEAR:');
            const yearCounts = await this.getRecordsByYear(db);
            yearCounts.forEach(year => {
                console.log(`  ${year.academic_year}: ${year.count} records`);
            });
            
            // Get counts by round
            console.log('\n📊 RECORDS BY ROUND:');
            const roundCounts = await this.getRecordsByRound(db);
            roundCounts.forEach(round => {
                console.log(`  ${round.round_name}: ${round.count} records`);
            });
            
            // Verify specific combinations
            console.log('\n🔍 VERIFYING SPECIFIC COMBINATIONS:');
            await this.verifySpecificCombinations(db);
            
            db.close();
            
        } catch (error) {
            console.error('❌ Verification failed:', error.message);
        }
    }

    async getRecordsByType(db) {
        return new Promise((resolve, reject) => {
            db.all(`
                SELECT ct.type_code, COUNT(*) as count 
                FROM counselling_data cd 
                JOIN counselling_types ct ON cd.counselling_type_id = ct.id 
                GROUP BY ct.type_code 
                ORDER BY ct.type_code
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async getRecordsByYear(db) {
        return new Promise((resolve, reject) => {
            db.all(`
                SELECT academic_year, COUNT(*) as count 
                FROM counselling_data 
                GROUP BY academic_year 
                ORDER BY academic_year
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async getRecordsByRound(db) {
        return new Promise((resolve, reject) => {
            db.all(`
                SELECT cr.round_name, COUNT(*) as count 
                FROM counselling_data cd 
                JOIN counselling_rounds cr ON cd.counselling_round_id = cr.id 
                GROUP BY cr.round_name 
                ORDER BY cr.round_number
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async verifySpecificCombinations(db) {
        // Verify AIQ_PG 2024-25
        const aiqPg2024 = await this.getRecordCount(db, `
            SELECT COUNT(*) FROM counselling_data 
            WHERE counselling_type_id = 1 AND academic_year = '2024-25'
        `);
        console.log(`  AIQ_PG 2024-25: ${aiqPg2024} records`);
        
        // Verify AIQ_UG 2024-25
        const aiqUg2024 = await this.getRecordCount(db, `
            SELECT COUNT(*) FROM counselling_data 
            WHERE counselling_type_id = 2 AND academic_year = '2024-25'
        `);
        console.log(`  AIQ_UG 2024-25: ${aiqUg2024} records`);
        
        // Verify KEA 2024-25
        const kea2024 = await this.getRecordCount(db, `
            SELECT COUNT(*) FROM counselling_data 
            WHERE counselling_type_id = 3 AND academic_year = '2024-25'
        `);
        console.log(`  KEA 2024-25: ${kea2024} records`);
        
        // Verify AIQ_PG 2023-24
        const aiqPg2023 = await this.getRecordCount(db, `
            SELECT COUNT(*) FROM counselling_data 
            WHERE counselling_type_id = 1 AND academic_year = '2023-24'
        `);
        console.log(`  AIQ_PG 2023-24: ${aiqPg2023} records`);
        
        // Verify AIQ_UG 2023-24
        const aiqUg2023 = await this.getRecordCount(db, `
            SELECT COUNT(*) FROM counselling_data 
            WHERE counselling_type_id = 2 AND academic_year = '2023-24'
        `);
        console.log(`  AIQ_UG 2023-24: ${aiqUg2023} records`);
        
        // Verify KEA 2023-24
        const kea2023 = await this.getRecordCount(db, `
            SELECT COUNT(*) FROM counselling_data 
            WHERE counselling_type_id = 3 AND academic_year = '2023-24'
        `);
        console.log(`  KEA 2023-24: ${kea2023} records`);
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
}

// Run if called directly
if (require.main === module) {
    const verifier = new SimpleCounsellingVerifier();
    verifier.verifyCounsellingData()
        .then(() => {
            console.log('\n✅ Simple counselling verification complete!');
        })
        .catch(error => {
            console.error('\n❌ Simple counselling verification failed:', error.message);
        });
}

module.exports = { SimpleCounsellingVerifier };
