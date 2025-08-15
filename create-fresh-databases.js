const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

class FreshDatabaseBuilder {
    constructor() {
        this.dataDir = path.join(__dirname, 'data');
        this.collegeDbPath = path.join(this.dataDir, 'colleges.db');
        this.counsellingDbPath = path.join(this.dataDir, 'counselling.db');
        this.cutoffDbPath = path.join(this.dataDir, 'cutoff_ranks.db');
        
        // Backup existing databases before overwriting
        this.backupExistingDatabases();
    }

    backupExistingDatabases() {
        console.log('🛡️  Backing up existing databases...');
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = path.join(this.dataDir, 'backups', `before-fresh-${timestamp}`);
        
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        
        const existingDbs = ['colleges.db', 'counselling.db', 'cutoff_ranks.db'];
        existingDbs.forEach(dbFile => {
            const sourcePath = path.join(this.dataDir, dbFile);
            if (fs.existsSync(sourcePath)) {
                const backupPath = path.join(backupDir, dbFile);
                fs.copyFileSync(sourcePath, backupPath);
                console.log(`   ✅ Backed up ${dbFile}`);
            }
        });
        
        console.log(`   📁 Backup location: ${backupDir}\n`);
    }

    async buildAllDatabases() {
        try {
            console.log('🏗️  Building Fresh Database System...\n');
            
            // Step 1: Build Colleges Database
            await this.buildCollegesDatabase();
            
            // Step 2: Build Counselling Database
            await this.buildCounsellingDatabase();
            
            // Step 3: Build Cutoff Database Template
            await this.buildCutoffDatabaseTemplate();
            
            // Step 4: Verify Complete System
            await this.verifyCompleteSystem();
            
            console.log('\n🎉 Fresh Database System Built Successfully!');
            console.log('📁 Ready for Excel imports!');
            
        } catch (error) {
            console.error('❌ Failed to build databases:', error);
            throw error;
        }
    }

    async buildCollegesDatabase() {
        console.log('🏫 Building Fresh Colleges Database...');
        
        // Remove existing database
        if (fs.existsSync(this.collegeDbPath)) {
            fs.unlinkSync(this.collegeDbPath);
        }
        
        const db = new sqlite3.Database(this.collegeDbPath);
        
        const schema = `
            -- Colleges table
            CREATE TABLE colleges (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                address TEXT,
                city TEXT,
                state TEXT,
                pincode TEXT,
                phone TEXT,
                email TEXT,
                website TEXT,
                college_type TEXT,
                affiliation TEXT,
                established_year INTEGER,
                nirf_rank INTEGER,
                naac_grade TEXT,
                aicte_approval BOOLEAN DEFAULT 1,
                ugc_approval BOOLEAN DEFAULT 1,
                pci_approval BOOLEAN DEFAULT 0,
                mci_approval BOOLEAN DEFAULT 0,
                facilities TEXT,
                hostel_available BOOLEAN DEFAULT 0,
                transport_available BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            
            -- Courses table
            CREATE TABLE courses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                college_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                code TEXT,
                duration INTEGER,
                duration_unit TEXT DEFAULT 'years',
                course_type TEXT,
                specialization TEXT,
                total_seats INTEGER,
                available_seats INTEGER,
                fees_amount INTEGER,
                fees_currency TEXT DEFAULT 'INR',
                eligibility_criteria TEXT,
                entrance_exam TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE
            );
            
            -- Create indexes
            CREATE INDEX idx_colleges_name ON colleges(name);
            CREATE INDEX idx_colleges_city ON colleges(city);
            CREATE INDEX idx_colleges_state ON colleges(state);
            CREATE INDEX idx_colleges_type ON colleges(college_type);
            CREATE INDEX idx_courses_college_id ON courses(college_id);
            CREATE INDEX idx_courses_name ON courses(name);
            CREATE INDEX idx_courses_type ON courses(course_type);
            
            -- Create full-text search
            CREATE VIRTUAL TABLE colleges_fts USING fts5(
                name, address, city, state, facilities,
                content='colleges',
                content_rowid='id'
            );
            
            -- Create triggers for FTS
            CREATE TRIGGER colleges_ai AFTER INSERT ON colleges BEGIN
                INSERT INTO colleges_fts(rowid, name, address, city, state, facilities)
                VALUES (new.id, new.name, new.address, new.city, new.state, new.facilities);
            END;
            
            CREATE TRIGGER colleges_ad AFTER DELETE ON colleges BEGIN
                INSERT INTO colleges_fts(colleges_fts, rowid, name, address, city, state, facilities)
                VALUES('delete', old.id, old.name, old.address, old.city, old.state, old.facilities);
            END;
            
            CREATE TRIGGER colleges_au AFTER UPDATE ON colleges BEGIN
                INSERT INTO colleges_fts(colleges_fts, rowid, name, address, city, state, facilities)
                VALUES('delete', old.id, old.name, old.address, old.city, old.state, old.facilities);
                INSERT INTO colleges_fts(rowid, name, address, city, state, facilities)
                VALUES (new.id, new.name, new.address, new.city, new.state, new.facilities);
            END;
        `;
        
        await this.runQuery(db, schema);
        db.close();
        
        console.log('   ✅ Colleges database created with proper schema');
        console.log('   📊 Tables: colleges, courses, colleges_fts');
        console.log('   🔍 Full-text search enabled');
    }

    async buildCounsellingDatabase() {
        console.log('\n🎯 Building Fresh Counselling Database...');
        
        // Remove existing database
        if (fs.existsSync(this.counsellingDbPath)) {
            fs.unlinkSync(this.counsellingDbPath);
        }
        
        const db = new sqlite3.Database(this.counsellingDbPath);
        
        const schema = `
            -- Counselling types
            CREATE TABLE counselling_types (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type_code TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                description TEXT,
                quota_type TEXT NOT NULL,
                authority TEXT,
                website TEXT,
                contact_info TEXT,
                is_active BOOLEAN DEFAULT 1,
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
                registration_start DATE,
                registration_end DATE,
                choice_filling_start DATE,
                choice_filling_end DATE,
                result_date DATE,
                status TEXT DEFAULT 'upcoming',
                description TEXT,
                total_seats INTEGER,
                filled_seats INTEGER DEFAULT 0,
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
        
        await this.runQuery(db, schema);
        
        // Insert default counselling types
        const defaultTypes = [
            ['AIQ', 'All India Quota', 'Centralized counselling for all India seats', 'Central', 'MCC'],
            ['KEA', 'Karnataka Examinations Authority', 'State counselling for Karnataka', 'State', 'KEA'],
            ['COMEDK', 'Consortium of Medical, Engineering and Dental Colleges of Karnataka', 'Private college counselling', 'Private', 'COMEDK'],
            ['MCC', 'Medical Counselling Committee', 'Central counselling for AIQ seats', 'Central', 'MCC'],
            ['DGHS', 'Directorate General of Health Services', 'Central government medical counselling', 'Central', 'DGHS'],
            ['STATE', 'State Quota', 'General state counselling for medical colleges', 'State', 'State Authorities'],
            ['PRIVATE', 'Private Quota', 'Private college counselling and management seats', 'Private', 'Private Colleges'],
            ['MANAGEMENT', 'Management Quota', 'Management seats in private colleges', 'Private', 'Private Colleges'],
            ['NRI', 'NRI Quota', 'Non-Resident Indian seats in private colleges', 'Private', 'Private Colleges']
        ];
        
        for (const [code, name, description, quotaType, authority] of defaultTypes) {
            await this.runQuery(db, 
                'INSERT INTO counselling_types (type_code, name, description, quota_type, authority) VALUES (?, ?, ?, ?, ?)',
                [code, name, description, quotaType, authority]
            );
        }
        
        db.close();
        
        console.log('   ✅ Counselling database created with proper schema');
        console.log('   📊 Tables: counselling_types, counselling_rounds, counselling_data, quota_allocations, counselling_alerts');
        console.log('   🎯 Default counselling types inserted');
    }

    async buildCutoffDatabaseTemplate() {
        console.log('\n📊 Building Cutoff Database Template...');
        
        // Remove existing database
        if (fs.existsSync(this.cutoffDbPath)) {
            fs.unlinkSync(this.cutoffDbPath);
        }
        
        const db = new sqlite3.Database(this.cutoffDbPath);
        
        const schema = `
            -- Quota categories reference (create first)
            CREATE TABLE quota_categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category_code TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                description TEXT,
                quota_type TEXT NOT NULL,
                reservation_percentage REAL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            
            -- Counselling types reference
            CREATE TABLE counselling_types (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type_code TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                description TEXT,
                quota_type TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            
            -- Cutoff ranks table
            CREATE TABLE cutoff_ranks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                college_id INTEGER NOT NULL,
                course_id INTEGER NOT NULL,
                counselling_type TEXT NOT NULL,
                counselling_year INTEGER NOT NULL,
                round_number INTEGER NOT NULL,
                quota_type TEXT NOT NULL,
                category TEXT NOT NULL,
                cutoff_rank INTEGER,
                cutoff_percentile REAL,
                seats_available INTEGER,
                seats_filled INTEGER,
                fees_amount INTEGER,
                special_remarks TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(college_id, course_id, counselling_type, counselling_year, round_number, quota_type, category)
            );
            
            -- Create indexes
            CREATE INDEX idx_cutoff_college_course ON cutoff_ranks(college_id, course_id);
            CREATE INDEX idx_cutoff_counselling ON cutoff_ranks(counselling_type, counselling_year, round_number);
            CREATE INDEX idx_cutoff_quota_category ON cutoff_ranks(quota_type, category);
            CREATE INDEX idx_cutoff_rank ON cutoff_ranks(cutoff_rank);
            
            -- Create full-text search
            CREATE VIRTUAL TABLE cutoff_ranks_fts USING fts5(
                counselling_type, quota_type, category, special_remarks,
                content='cutoff_ranks',
                content_rowid='id'
            );
        `;
        
        await this.runQuery(db, schema);
        
        // Insert default quota categories
        const defaultCategories = [
            ['UR', 'Unreserved', 'General category', 'General', 0],
            ['OBC-NCL', 'Other Backward Classes - Non-Creamy Layer', 'OBC category', 'OBC', 27],
            ['SC', 'Scheduled Caste', 'SC category', 'SC', 15],
            ['ST', 'Scheduled Tribe', 'ST category', 'ST', 7.5],
            ['EWS', 'Economically Weaker Section', 'EWS category', 'EWS', 10],
            ['PwD', 'Persons with Disabilities', 'PwD category', 'PwD', 5],
            ['BC', 'Backward Classes', 'BC category', 'BC', 0],
            ['MBC', 'Most Backward Classes', 'MBC category', 'MBC', 0],
            ['DNC', 'Denotified Nomadic Classes', 'DNC category', 'DNC', 0],
            ['VJ', 'Vimukta Jatis', 'VJ category', 'VJ', 0],
            ['NT', 'Nomadic Tribes', 'NT category', 'NT', 0],
            ['SBC', 'Special Backward Classes', 'SBC category', 'SBC', 0],
            ['PH', 'Physically Handicapped', 'PH category', 'PH', 0],
            ['WOMEN', 'Women Quota', 'Women reservation', 'Women', 0],
            ['RURAL', 'Rural Quota', 'Rural area reservation', 'Rural', 0],
            ['URBAN', 'Urban Quota', 'Urban area reservation', 'Urban', 0]
        ];
        
        for (const [code, name, description, quotaType, percentage] of defaultCategories) {
            await this.runQuery(db, 
                'INSERT INTO quota_categories (category_code, name, description, quota_type, reservation_percentage) VALUES (?, ?, ?, ?, ?)',
                [code, name, description, quotaType, percentage]
            );
        }
        
        db.close();
        
        console.log('   ✅ Cutoff database template created');
        console.log('   📊 Tables: cutoff_ranks, counselling_types, quota_categories, cutoff_ranks_fts');
        console.log('   🎯 Default quota categories inserted');
        console.log('   📋 Ready for cutoff data import when available');
    }

    async verifyCompleteSystem() {
        console.log('\n🔍 Verifying Complete Database System...');
        
        const databases = [
            { name: 'Colleges Database', path: this.collegeDbPath },
            { name: 'Counselling Database', path: this.counsellingDbPath },
            { name: 'Cutoff Database', path: this.cutoffDbPath }
        ];
        
        for (const dbInfo of databases) {
            const db = new sqlite3.Database(dbInfo.path);
            const tables = await this.runQueryAll(db, "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
            const tableNames = tables.map(t => t.name).join(', ');
            
            console.log(`   ✅ ${dbInfo.name}: ${tables.length} tables (${tableNames})`);
            db.close();
        }
        
        console.log('\n🎯 System Status: READY FOR EXCEL IMPORTS!');
        console.log('📁 All databases created with proper structure');
        console.log('🔗 Cross-database relationships established');
        console.log('📊 Ready for: College data, Counselling data, Cutoff data');
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
    const builder = new FreshDatabaseBuilder();
    builder.buildAllDatabases();
}

module.exports = { FreshDatabaseBuilder };
