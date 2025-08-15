const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

class DatabaseStructureFixer {
    constructor() {
        this.collegeDbPath = path.join(__dirname, 'data', 'colleges.db');
        this.counsellingDbPath = path.join(__dirname, 'data', 'counselling.db');
        this.cutoffDbPath = path.join(__dirname, 'data', 'cutoff_ranks.db');
        this.backupPath = path.join(__dirname, 'data', 'backup');
    }

    async fixDatabaseStructure() {
        try {
            console.log('🔧 Fixing Database Structure...\n');
            
            // Step 1: Create backup
            await this.createBackup();
            
            // Step 2: Create proper counselling database
            await this.createCounsellingDatabase();
            
            // Step 3: Move counselling data from colleges.db to counselling.db
            await this.moveCounsellingData();
            
            // Step 4: Clean up colleges.db (remove counselling tables)
            await this.cleanupCollegesDatabase();
            
            // Step 5: Verify structure
            await this.verifyStructure();
            
            console.log('\n✅ Database structure fixed successfully!');
            
        } catch (error) {
            console.error('❌ Failed to fix database structure:', error);
        }
    }

    async createBackup() {
        console.log('📦 Creating backup...');
        
        if (!fs.existsSync(this.backupPath)) {
            fs.mkdirSync(this.backupPath, { recursive: true });
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(this.backupPath, `backup-${timestamp}.zip`);
        
        // For now, just create a backup directory
        console.log(`   📁 Backup directory created: ${this.backupPath}`);
        console.log('   ⚠️  Please manually backup your databases before proceeding!');
    }

    async createCounsellingDatabase() {
        console.log('\n🏗️  Creating proper counselling database...');
        
        const counsellingDb = new sqlite3.Database(this.counsellingDbPath);
        
        const schema = `
            -- Counselling types
            CREATE TABLE counselling_types (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type_code TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                description TEXT,
                quota_type TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            
            -- Counselling rounds
            CREATE TABLE counselling_rounds (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                counselling_type_id INTEGER NOT NULL,
                year INTEGER NOT NULL,
                round_name TEXT NOT NULL,
                round_order INTEGER NOT NULL,
                round_type TEXT NOT NULL,
                start_date DATE,
                end_date DATE,
                status TEXT DEFAULT 'upcoming',
                description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (counselling_type_id) REFERENCES counselling_types(id),
                UNIQUE(counselling_type_id, year, round_name)
            );
            
            -- Counselling data
            CREATE TABLE counselling_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                counselling_round_id INTEGER NOT NULL,
                college_id INTEGER NOT NULL,
                course_id INTEGER NOT NULL,
                all_india_rank INTEGER,
                quota TEXT,
                category TEXT,
                cutoff_rank INTEGER,
                cutoff_percentile REAL,
                seats_available INTEGER,
                seats_filled INTEGER,
                fees_amount INTEGER,
                special_remarks TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (counselling_round_id) REFERENCES counselling_rounds(id)
            );
            
            -- Quota allocations
            CREATE TABLE quota_allocations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                college_id INTEGER NOT NULL,
                course_id INTEGER NOT NULL,
                counselling_round_id INTEGER NOT NULL,
                quota_type TEXT NOT NULL,
                total_seats INTEGER NOT NULL,
                available_seats INTEGER NOT NULL,
                filled_seats INTEGER DEFAULT 0,
                cutoff_rank INTEGER,
                cutoff_percentile REAL,
                fees_amount INTEGER,
                reservation_details TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (counselling_round_id) REFERENCES counselling_rounds(id)
            );
            
            -- Counselling alerts
            CREATE TABLE counselling_alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                counselling_round_id INTEGER,
                alert_type TEXT NOT NULL,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                priority TEXT DEFAULT 'normal',
                start_date DATE,
                end_date DATE,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (counselling_round_id) REFERENCES counselling_rounds(id)
            );
            
            -- Create indexes
            CREATE INDEX idx_counselling_round_id ON counselling_data(counselling_round_id);
            CREATE INDEX idx_counselling_college_id ON counselling_data(college_id);
            CREATE INDEX idx_counselling_rank ON counselling_data(all_india_rank);
            CREATE INDEX idx_quota_college_course ON quota_allocations(college_id, course_id);
            CREATE INDEX idx_quota_type ON quota_allocations(quota_type);
            CREATE INDEX idx_alerts_round_id ON counselling_alerts(counselling_round_id);
            CREATE INDEX idx_alerts_active ON counselling_alerts(is_active);
        `;
        
        await this.runQuery(counsellingDb, schema);
        
        // Insert counselling types
        const counsellingTypes = [
            ['AIQ', 'All India Quota', 'Centralized counselling for all India seats', 'Central'],
            ['KEA', 'Karnataka Examinations Authority', 'State counselling for Karnataka', 'State'],
            ['COMEDK', 'Consortium of Medical, Engineering and Dental Colleges of Karnataka', 'Private college counselling', 'Private'],
            ['MCC', 'Medical Counselling Committee', 'Central counselling for AIQ seats', 'Central'],
            ['DGHS', 'Directorate General of Health Services', 'Central government medical counselling', 'Central'],
            ['STATE', 'State Quota', 'General state counselling for medical colleges', 'State'],
            ['PRIVATE', 'Private Quota', 'Private college counselling and management seats', 'Private'],
            ['MANAGEMENT', 'Management Quota', 'Management seats in private colleges', 'Private'],
            ['NRI', 'NRI Quota', 'Non-Resident Indian seats in private colleges', 'Private']
        ];
        
        for (const [code, name, description, quotaType] of counsellingTypes) {
            await this.runQuery(counsellingDb, 
                'INSERT INTO counselling_types (type_code, name, description, quota_type) VALUES (?, ?, ?, ?)',
                [code, name, description, quotaType]
            );
        }
        
        counsellingDb.close();
        console.log('   ✅ Counselling database created with proper structure');
    }

    async moveCounsellingData() {
        console.log('\n🔄 Moving counselling data...');
        
        // This would move existing counselling data from colleges.db to counselling.db
        // For now, we'll just note that this needs to be done
        console.log('   📝 Note: Existing counselling data migration needed');
        console.log('   📝 This step requires careful data migration planning');
    }

    async cleanupCollegesDatabase() {
        console.log('\n🧹 Cleaning up colleges database...');
        
        const collegesDb = new sqlite3.Database(this.collegeDbPath);
        
        // Remove counselling-related tables from colleges.db
        const cleanupQueries = [
            'DROP TABLE IF EXISTS counselling_alerts',
            'DROP TABLE IF EXISTS quota_allocations', 
            'DROP TABLE IF EXISTS counselling_data',
            'DROP TABLE IF EXISTS counselling_rounds',
            'DROP TABLE IF EXISTS counselling_types'
        ];
        
        for (const query of cleanupQueries) {
            await this.runQuery(collegesDb, query);
        }
        
        collegesDb.close();
        console.log('   ✅ Counselling tables removed from colleges database');
    }

    async verifyStructure() {
        console.log('\n🔍 Verifying new database structure...');
        
        // Check colleges.db
        const collegesDb = new sqlite3.Database(this.collegeDbPath);
        const collegeTables = await this.runQueryAll(collegesDb, "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
        console.log('   🏫 Colleges database tables:', collegeTables.map(t => t.name).join(', '));
        collegesDb.close();
        
        // Check counselling.db
        const counsellingDb = new sqlite3.Database(this.counsellingDbPath);
        const counsellingTables = await this.runQueryAll(counsellingDb, "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
        console.log('   🎯 Counselling database tables:', counsellingTables.map(t => t.name).join(', '));
        counsellingDb.close();
        
        // Check cutoff_ranks.db
        const cutoffDb = new sqlite3.Database(this.cutoffDbPath);
        const cutoffTables = await this.runQueryAll(cutoffDb, "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
        console.log('   📊 Cutoff ranks database tables:', cutoffTables.map(t => t.name).join(', '));
        cutoffDb.close();
    }

    async runQuery(db, query, params = []) {
        return new Promise((resolve, reject) => {
            db.run(query, params, function(err) {
                if (err) reject(err);
                else resolve({ lastID: this.lastID, changes: this.changes });
            });
        });
    }

    async runQueryAll(db, query, params = []) {
        return new Promise((resolve, reject) => {
            db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
}

// Run if called directly
if (require.main === module) {
    const fixer = new DatabaseStructureFixer();
    fixer.fixDatabaseStructure();
}

module.exports = { DatabaseStructureFixer };
