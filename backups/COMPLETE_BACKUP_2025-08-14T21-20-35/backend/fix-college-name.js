const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class CollegeNameFixer {
    constructor() {
        this.dbPath = path.join(__dirname, 'data', 'colleges.db');
        this.db = null;
    }

    async initialize() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READWRITE, (err) => {
                if (err) {
                    console.error('❌ Database connection error:', err);
                    reject(err);
                } else {
                    console.log('✅ Database connection established');
                    resolve();
                }
            });
        });
    }

    async close() {
        if (this.db) {
            this.db.close();
        }
    }

    async runQuery(query, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(query, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ lastID: this.lastID, changes: this.changes });
                }
            });
        });
    }

    async runSelect(query, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(query, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async fixCollegeName() {
        try {
            console.log('🔍 Searching for the incorrect college name...');
            
            // Search for the incorrect name
            const searchResults = await this.runSelect(`
                SELECT id, name, state, type, address 
                FROM colleges 
                WHERE name LIKE '%Chandramma Dayananda Sagar%'
                OR name LIKE '%Harohalli, Hubli%'
                OR name LIKE '%Instt. of Medical Education%'
            `);

            console.log('📋 Found colleges with similar names:');
            searchResults.forEach(college => {
                console.log(`  ID: ${college.id}`);
                console.log(`  Name: ${college.name}`);
                console.log(`  State: ${college.state}`);
                console.log(`  Type: ${college.type}`);
                console.log(`  Address: ${college.address}`);
                console.log('  ---');
            });

            if (searchResults.length === 0) {
                console.log('❌ No colleges found with the incorrect name pattern');
                return;
            }

            // Update the college name and details
            const correctName = 'Dr. Chandramma Dayananda Sagar Institute of Medical Education & Research';
            const correctAddress = 'Devarakaggalahalli, Kanakapura Road, Bengaluru South District, Karnataka';
            const correctState = 'Karnataka';

            console.log('🔧 Updating college information...');
            
            for (const college of searchResults) {
                const updateResult = await this.runQuery(`
                    UPDATE colleges 
                    SET name = ?, address = ?, state = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `, [correctName, correctAddress, correctState, college.id]);

                console.log(`✅ Updated college ID ${college.id}: ${updateResult.changes} rows affected`);
            }

            // Verify the update
            console.log('🔍 Verifying the update...');
            const verifyResults = await this.runSelect(`
                SELECT id, name, state, type, address 
                FROM colleges 
                WHERE name LIKE '%Chandramma Dayananda Sagar%'
            `);

            console.log('📋 Updated college information:');
            verifyResults.forEach(college => {
                console.log(`  ID: ${college.id}`);
                console.log(`  Name: ${college.name}`);
                console.log(`  State: ${college.state}`);
                console.log(`  Type: ${college.type}`);
                console.log(`  Address: ${college.address}`);
                console.log('  ---');
            });

            console.log('✅ College name fix completed successfully!');

        } catch (error) {
            console.error('❌ Error fixing college name:', error);
            throw error;
        }
    }
}

// Run the fix
async function main() {
    const fixer = new CollegeNameFixer();
    
    try {
        await fixer.initialize();
        await fixer.fixCollegeName();
    } catch (error) {
        console.error('❌ Failed to fix college name:', error);
        process.exit(1);
    } finally {
        await fixer.close();
    }
}

if (require.main === module) {
    main();
}

module.exports = CollegeNameFixer;
