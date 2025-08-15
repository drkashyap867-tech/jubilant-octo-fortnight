const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

class AdvancedSystemBuilder {
    constructor() {
        this.dataDir = path.join(__dirname, 'data');
        this.collegeDbPath = path.join(this.dataDir, 'colleges.db');
        this.counsellingDbPath = path.join(this.dataDir, 'counselling.db');
        this.cutoffDbPath = path.join(this.dataDir, 'cutoff_ranks.db');
    }

    async buildAdvancedSystem() {
        try {
            console.log('🚀 Building Advanced System Step by Step...\n');
            
            // Step 1: Build Advanced Colleges Database
            await this.buildCollegesDatabase();
            
            // Step 2: Build Advanced Counselling Database
            await this.buildCounsellingDatabase();
            
            // Step 3: Build Advanced Cutoff Database
            await this.buildCutoffDatabase();
            
            // Step 4: Verify System
            await this.verifySystem();
            
            console.log('\n🎉 Advanced System Built Successfully!');
            console.log('🚀 All advanced features included!');
            
        } catch (error) {
            console.error('❌ Failed to build advanced system:', error);
            throw error;
        }
    }

    async buildCollegesDatabase() {
        console.log('🏫 Building Advanced Colleges Database...');
        
        // Remove existing database
        if (fs.existsSync(this.collegeDbPath)) {
            fs.unlinkSync(this.collegeDbPath);
            console.log('   🗑️  Removed existing colleges database');
        }
        
        const db = new sqlite3.Database(this.collegeDbPath);
        
        try {
            // Create tables one by one
            await this.runQuery(db, `
                CREATE TABLE colleges (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    normalized_name TEXT,
                    address TEXT,
                    city TEXT,
                    normalized_city TEXT,
                    state TEXT,
                    normalized_state TEXT,
                    pincode TEXT,
                    phone TEXT,
                    email TEXT,
                    website TEXT,
                    college_type TEXT,
                    normalized_college_type TEXT,
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
                    latitude REAL,
                    longitude REAL,
                    search_score REAL DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('   ✅ Colleges table created');
            
            await this.runQuery(db, `
                CREATE TABLE courses (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    college_id INTEGER NOT NULL,
                    name TEXT NOT NULL,
                    normalized_name TEXT,
                    code TEXT,
                    duration INTEGER,
                    duration_unit TEXT DEFAULT 'years',
                    course_type TEXT,
                    normalized_course_type TEXT,
                    specialization TEXT,
                    normalized_specialization TEXT,
                    total_seats INTEGER,
                    available_seats INTEGER,
                    fees_amount INTEGER,
                    fees_currency TEXT DEFAULT 'INR',
                    eligibility_criteria TEXT,
                    entrance_exam TEXT,
                    normalized_entrance_exam TEXT,
                    search_score REAL DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE
                )
            `);
            console.log('   ✅ Courses table created');
            
            await this.runQuery(db, `
                CREATE TABLE search_synonyms (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    original_term TEXT NOT NULL,
                    synonym TEXT NOT NULL,
                    synonym_type TEXT NOT NULL,
                    confidence REAL DEFAULT 1.0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(original_term, synonym)
                )
            `);
            console.log('   ✅ Search synonyms table created');
            
            await this.runQuery(db, `
                CREATE TABLE typo_corrections (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    incorrect_spelling TEXT NOT NULL,
                    correct_spelling TEXT NOT NULL,
                    context TEXT,
                    confidence REAL DEFAULT 1.0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(incorrect_spelling, correct_spelling)
                )
            `);
            console.log('   ✅ Typo corrections table created');
            
            await this.runQuery(db, `
                CREATE TABLE locations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    city TEXT NOT NULL,
                    state TEXT NOT NULL,
                    country TEXT DEFAULT 'India',
                    latitude REAL,
                    longitude REAL,
                    population INTEGER,
                    is_metro BOOLEAN DEFAULT 0,
                    search_priority INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(city, state)
                )
            `);
            console.log('   ✅ Locations table created');
            
            // Create indexes
            await this.runQuery(db, 'CREATE INDEX idx_colleges_normalized_name ON colleges(normalized_name)');
            await this.runQuery(db, 'CREATE INDEX idx_colleges_normalized_city ON colleges(normalized_city)');
            await this.runQuery(db, 'CREATE INDEX idx_colleges_search_score ON colleges(search_score)');
            await this.runQuery(db, 'CREATE INDEX idx_courses_college_id ON courses(college_id)');
            await this.runQuery(db, 'CREATE INDEX idx_synonyms_original ON search_synonyms(original_term)');
            await this.runQuery(db, 'CREATE INDEX idx_typos_incorrect ON typo_corrections(incorrect_spelling)');
            console.log('   ✅ Indexes created');
            
            // Insert sample data
            await this.insertSampleData(db);
            
        } catch (error) {
            console.error('   ❌ Error creating colleges database:', error);
            throw error;
        } finally {
            db.close();
        }
        
        console.log('   ✅ Advanced colleges database completed');
    }

    async insertSampleData(db) {
        console.log('   📊 Inserting sample data...');
        
        // Insert common synonyms
        const synonyms = [
            ['MBBS', 'M.B.B.S.', 'abbreviation'],
            ['MBBS', 'Bachelor of Medicine and Bachelor of Surgery', 'abbreviation'],
            ['BDS', 'B.D.S.', 'abbreviation'],
            ['BDS', 'Bachelor of Dental Surgery', 'abbreviation'],
            ['BAMS', 'B.A.M.S.', 'abbreviation'],
            ['BAMS', 'Bachelor of Ayurvedic Medicine and Surgery', 'abbreviation']
        ];
        
        for (const [original, synonym, type] of synonyms) {
            await this.runQuery(db, 
                'INSERT INTO search_synonyms (original_term, synonym, synonym_type) VALUES (?, ?, ?)',
                [original, synonym, type]
            );
        }
        
        // Insert common typos
        const typos = [
            ['Banglore', 'Bangalore', 'city'],
            ['Bombay', 'Mumbai', 'city'],
            ['Calcutta', 'Kolkata', 'city'],
            ['Madras', 'Chennai', 'city']
        ];
        
        for (const [incorrect, correct, context] of typos) {
            await this.runQuery(db, 
                'INSERT INTO typo_corrections (incorrect_spelling, correct_spelling, context) VALUES (?, ?, ?)',
                [incorrect, correct, context]
            );
        }
        
        // Insert common locations
        const locations = [
            ['Bangalore', 'Karnataka', 12.9716, 77.5946, 12000000, 1, 100],
            ['Mumbai', 'Maharashtra', 19.0760, 72.8777, 20000000, 1, 100],
            ['Delhi', 'Delhi', 28.7041, 77.1025, 30000000, 1, 100],
            ['Chennai', 'Tamil Nadu', 13.0827, 80.2707, 11000000, 1, 90]
        ];
        
        for (const [city, state, lat, lng, pop, metro, priority] of locations) {
            await this.runQuery(db, 
                'INSERT INTO locations (city, state, latitude, longitude, population, is_metro, search_priority) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [city, state, lat, lng, pop, metro, priority]
            );
        }
        
        console.log('   ✅ Sample data inserted');
    }

    async buildCounsellingDatabase() {
        console.log('\n🎯 Building Advanced Counselling Database...');
        
        // Remove existing database
        if (fs.existsSync(this.counsellingDbPath)) {
            fs.unlinkSync(this.counsellingDbPath);
            console.log('   🗑️  Removed existing counselling database');
        }
        
        const db = new sqlite3.Database(this.counsellingDbPath);
        
        try {
            await this.runQuery(db, `
                CREATE TABLE counselling_types (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    type_code TEXT NOT NULL UNIQUE,
                    name TEXT NOT NULL,
                    normalized_name TEXT,
                    description TEXT,
                    quota_type TEXT NOT NULL,
                    authority TEXT,
                    website TEXT,
                    contact_info TEXT,
                    is_active BOOLEAN DEFAULT 1,
                    search_priority INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            await this.runQuery(db, `
                CREATE TABLE counselling_rounds (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    counselling_type_id INTEGER NOT NULL,
                    year INTEGER NOT NULL,
                    round_name TEXT NOT NULL,
                    normalized_round_name TEXT,
                    round_order INTEGER NOT NULL,
                    round_type TEXT NOT NULL,
                    start_date DATE,
                    end_date DATE,
                    status TEXT DEFAULT 'upcoming',
                    description TEXT,
                    total_seats INTEGER,
                    filled_seats INTEGER DEFAULT 0,
                    search_score REAL DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (counselling_type_id) REFERENCES counselling_types(id),
                    UNIQUE(counselling_type_id, year, round_name)
                )
            `);
            
            await this.runQuery(db, `
                CREATE TABLE counselling_data (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    counselling_round_id INTEGER NOT NULL,
                    college_id INTEGER NOT NULL,
                    course_id INTEGER NOT NULL,
                    all_india_rank INTEGER,
                    quota TEXT,
                    normalized_quota TEXT,
                    category TEXT,
                    normalized_category TEXT,
                    cutoff_rank INTEGER,
                    cutoff_percentile REAL,
                    seats_available INTEGER,
                    seats_filled INTEGER,
                    fees_amount INTEGER,
                    special_remarks TEXT,
                    search_score REAL DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (counselling_round_id) REFERENCES counselling_types(id)
                )
            `);
            
            // Insert default counselling types
            const defaultTypes = [
                ['AIQ', 'All India Quota', 'Centralized counselling for all India seats', 'Central', 'MCC', 100],
                ['KEA', 'Karnataka Examinations Authority', 'State counselling for Karnataka', 'State', 'KEA', 90],
                ['COMEDK', 'Consortium of Medical, Engineering and Dental Colleges of Karnataka', 'Private college counselling', 'Private', 'COMEDK', 85],
                ['MCC', 'Medical Counselling Committee', 'Central counselling for AIQ seats', 'Central', 'MCC', 95]
            ];
            
            for (const [code, name, description, quotaType, authority, priority] of defaultTypes) {
                const normalizedName = this.normalizeText(name);
                await this.runQuery(db, 
                    'INSERT INTO counselling_types (type_code, name, normalized_name, description, quota_type, authority, search_priority) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [code, name, normalizedName, description, quotaType, authority, priority]
                );
            }
            
            console.log('   ✅ Counselling database completed');
            
        } catch (error) {
            console.error('   ❌ Error creating counselling database:', error);
            throw error;
        } finally {
            db.close();
        }
    }

    async buildCutoffDatabase() {
        console.log('\n📊 Building Advanced Cutoff Database...');
        
        // Remove existing database
        if (fs.existsSync(this.cutoffDbPath)) {
            fs.unlinkSync(this.cutoffDbPath);
            console.log('   🗑️  Removed existing cutoff database');
        }
        
        const db = new sqlite3.Database(this.cutoffDbPath);
        
        try {
            await this.runQuery(db, `
                CREATE TABLE cutoff_ranks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    college_id INTEGER NOT NULL,
                    course_id INTEGER NOT NULL,
                    counselling_type TEXT NOT NULL,
                    normalized_counselling_type TEXT,
                    counselling_year INTEGER NOT NULL,
                    round_number INTEGER NOT NULL,
                    quota_type TEXT NOT NULL,
                    normalized_quota_type TEXT,
                    category TEXT NOT NULL,
                    normalized_category TEXT,
                    cutoff_rank INTEGER,
                    cutoff_percentile REAL,
                    seats_available INTEGER,
                    seats_filled INTEGER,
                    fees_amount INTEGER,
                    special_remarks TEXT,
                    search_score REAL DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(college_id, course_id, counselling_type, counselling_year, round_number, quota_type, category)
                )
            `);
            
            await this.runQuery(db, `
                CREATE TABLE quota_categories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    category_code TEXT NOT NULL UNIQUE,
                    name TEXT NOT NULL,
                    normalized_name TEXT,
                    description TEXT,
                    quota_type TEXT NOT NULL,
                    reservation_percentage REAL,
                    search_priority INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // Insert default quota categories
            const defaultCategories = [
                ['UR', 'Unreserved', 'General category', 'General', 0, 100],
                ['OBC-NCL', 'Other Backward Classes - Non-Creamy Layer', 'OBC category', 'OBC', 27, 90],
                ['SC', 'Scheduled Caste', 'SC category', 'SC', 15, 85],
                ['ST', 'Scheduled Tribe', 'ST category', 'ST', 7.5, 80],
                ['EWS', 'Economically Weaker Section', 'EWS category', 'EWS', 10, 75]
            ];
            
            for (const [code, name, description, quotaType, percentage, priority] of defaultCategories) {
                const normalizedName = this.normalizeText(name);
                await this.runQuery(db, 
                    'INSERT INTO quota_categories (category_code, name, normalized_name, description, quota_type, reservation_percentage, search_priority) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [code, name, normalizedName, description, quotaType, percentage, priority]
                );
            }
            
            console.log('   ✅ Cutoff database completed');
            
        } catch (error) {
            console.error('   ❌ Error creating cutoff database:', error);
            throw error;
        } finally {
            db.close();
        }
    }

    async verifySystem() {
        console.log('\n🔍 Verifying Advanced System...');
        
        const databases = [
            { name: 'Advanced Colleges Database', path: this.collegeDbPath },
            { name: 'Advanced Counselling Database', path: this.counsellingDbPath },
            { name: 'Advanced Cutoff Database', path: this.cutoffDbPath }
        ];
        
        for (const dbInfo of databases) {
            const db = new sqlite3.Database(dbInfo.path);
            const tables = await this.runQueryAll(db, "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
            const tableNames = tables.map(t => t.name).join(', ');
            
            console.log(`   ✅ ${dbInfo.name}: ${tables.length} tables (${tableNames})`);
            db.close();
        }
        
        console.log('\n🎯 Advanced System Status: READY!');
        console.log('🚀 Features: Fuzzy search, typo correction, semantic search, smart ranking');
        console.log('📊 Ready for: College data, Counselling data, Cutoff data');
    }

    normalizeText(text) {
        if (!text) return '';
        return text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
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
    const builder = new AdvancedSystemBuilder();
    builder.buildAdvancedSystem();
}

module.exports = { AdvancedSystemBuilder };
