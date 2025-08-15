const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function addMissingTables() {
    const dbPath = path.join(__dirname, 'data', 'cutoff_ranks_enhanced.db');
    const db = new sqlite3.Database(dbPath);
    
    console.log('🔧 Adding missing tables to enhanced database...');
    
    try {
        // Create colleges table
        await new Promise((resolve, reject) => {
            db.run(`
                CREATE TABLE IF NOT EXISTS colleges (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    location TEXT,
                    state TEXT,
                    type TEXT,
                    is_active BOOLEAN DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        console.log('✅ Colleges table created');

        // Create courses table
        await new Promise((resolve, reject) => {
            db.run(`
                CREATE TABLE IF NOT EXISTS courses (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    type TEXT,
                    duration INTEGER,
                    is_active BOOLEAN DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        console.log('✅ Courses table created');

        // Insert sample college data
        await new Promise((resolve, reject) => {
            db.run(`
                INSERT OR REPLACE INTO colleges (id, name, location, state, type) VALUES 
                (1, 'Sample Medical College', 'Sample City', 'Sample State', 'Medical'),
                (2, 'Sample Dental College', 'Sample City', 'Sample State', 'Dental'),
                (3, 'Sample University', 'Sample City', 'Sample State', 'University')
            `, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        console.log('✅ Sample college data inserted');

        // Insert sample course data
        await new Promise((resolve, reject) => {
            db.run(`
                INSERT OR REPLACE INTO courses (id, name, type, duration) VALUES 
                (1, 'MD General Medicine', 'Medical', 3),
                (2, 'MS General Surgery', 'Medical', 3),
                (3, 'MDS Conservative Dentistry', 'Dental', 3),
                (4, 'MDS Oral Surgery', 'Dental', 3)
            `, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        console.log('✅ Sample course data inserted');

        console.log('🎉 Missing tables added successfully!');
        
    } catch (error) {
        console.error('❌ Error adding missing tables:', error);
    } finally {
        db.close();
    }
}

// Run the script
if (require.main === module) {
    addMissingTables();
}

module.exports = { addMissingTables };
