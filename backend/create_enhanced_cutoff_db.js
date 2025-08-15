const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Enhanced database schema for universal counselling system
const ENHANCED_SCHEMA = `
-- Drop old tables if they exist to avoid conflicts
DROP TABLE IF EXISTS counselling_types;
DROP TABLE IF EXISTS quota_categories;
DROP TABLE IF EXISTS cutoff_ranks_fts;
DROP TABLE IF EXISTS cutoff_ranks_fts_data;
DROP TABLE IF EXISTS cutoff_ranks_fts_idx;
DROP TABLE IF EXISTS cutoff_ranks_fts_docsize;
DROP TABLE IF EXISTS cutoff_ranks_fts_config;

-- Enhanced cutoff_ranks table with universal fields
CREATE TABLE IF NOT EXISTS cutoff_ranks_enhanced (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Core identification
    college_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    counselling_type TEXT NOT NULL,  -- AIQ_PG, AIQ_UG, KEA, MHT_CET, etc.
    counselling_year INTEGER NOT NULL,
    round_number INTEGER NOT NULL,
    round_name TEXT NOT NULL,
    
    -- Universal fields that work for both AIQ and State systems
    aiq_quota TEXT,           -- For AIQ: NRI, MNG, DEEMED, etc.
    aiq_category TEXT,        -- For AIQ: UR, SC, ST, OBC, EWS, PwD
    state_category TEXT,      -- For State: SC, ST, OBC, GM, NRI, etc.
    state_quota TEXT,         -- For State: Government, Private, NRI, etc.
    
    -- Common fields
    cutoff_rank INTEGER NOT NULL,
    cutoff_percentile REAL,
    seats_available INTEGER NOT NULL,
    seats_filled INTEGER DEFAULT 0,
    fees_amount INTEGER,
    special_remarks TEXT,
    
    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(college_id, course_id, counselling_type, counselling_year, round_number, aiq_quota, aiq_category, state_category, state_quota)
);

-- Reference tables for AIQ system (based on MCC document)
CREATE TABLE IF NOT EXISTS aiq_quotas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quota_code TEXT NOT NULL UNIQUE,
    quota_name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS aiq_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_code TEXT NOT NULL UNIQUE,
    category_name TEXT NOT NULL,
    description TEXT,
    reservation_percentage REAL,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Reference tables for State system (based on KEA document)
CREATE TABLE IF NOT EXISTS state_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_code TEXT NOT NULL UNIQUE,
    category_name TEXT NOT NULL,
    description TEXT,
    reservation_percentage REAL,
    state_code TEXT NOT NULL,  -- KEA, MHT_CET, etc.
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS state_quotas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quota_code TEXT NOT NULL UNIQUE,
    quota_name TEXT NOT NULL,
    description TEXT,
    state_code TEXT NOT NULL,  -- KEA, MHT_CET, etc.
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Counselling types master table
CREATE TABLE IF NOT EXISTS counselling_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    system_type TEXT NOT NULL,  -- AIQ, STATE, DEEMED
    parent_authority TEXT,      -- MCC, KEA, MHT_CET, etc.
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_enhanced_college_course ON cutoff_ranks_enhanced(college_id, course_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_counselling_type ON cutoff_ranks_enhanced(counselling_type);
CREATE INDEX IF NOT EXISTS idx_enhanced_year_round ON cutoff_ranks_enhanced(counselling_year, round_number);
CREATE INDEX IF NOT EXISTS idx_enhanced_aiq_fields ON cutoff_ranks_enhanced(aiq_quota, aiq_category);
CREATE INDEX IF NOT EXISTS idx_enhanced_state_fields ON cutoff_ranks_enhanced(state_category, state_quota);
CREATE INDEX IF NOT EXISTS idx_enhanced_rank ON cutoff_ranks_enhanced(cutoff_rank);
CREATE INDEX IF NOT EXISTS idx_enhanced_percentile ON cutoff_ranks_enhanced(cutoff_percentile);

-- Full-text search
CREATE VIRTUAL TABLE IF NOT EXISTS cutoff_ranks_enhanced_fts USING fts5(
    special_remarks, 
    content='cutoff_ranks_enhanced', 
    content_rowid='id'
);
`;

// Data to populate reference tables
const AIQ_QUOTAS = [
    { code: 'ALL_INDIA', name: 'ALL INDIA', description: 'All India Quota seats' },
    { code: 'DEEMED_PAID', name: 'DEEMED/PAID SEATS', description: 'Deemed university paid seats' },
    { code: 'AMU', name: 'AMU', description: 'Aligarh Muslim University seats' },
    { code: 'DU', name: 'DU', description: 'Delhi University seats' },
    { code: 'ESIC', name: 'ESIC', description: 'ESIC Corporation seats' },
    { code: 'NRI', name: 'NRI', description: 'Non-Resident Indian seats' },
    { code: 'MINORITY', name: 'MINORITY', description: 'Minority institution seats' },
    { code: 'MANAGEMENT', name: 'MANAGEMENT', description: 'Management quota seats' }
];

const AIQ_CATEGORIES = [
    { code: 'UR', name: 'UR (Unreserved)', description: 'Unreserved category', percentage: null },
    { code: 'SC', name: 'SC', description: 'Scheduled Caste', percentage: 15.0 },
    { code: 'ST', name: 'ST', description: 'Scheduled Tribe', percentage: 7.5 },
    { code: 'OBC', name: 'OBC-NCL', description: 'Other Backward Classes (Non-Creamy Layer)', percentage: 27.0 },
    { code: 'EWS', name: 'EWS', description: 'Economically Weaker Section', percentage: 10.0 },
    { code: 'PWD', name: 'PwD', description: 'Persons with Disabilities', percentage: 5.0 }
];

const STATE_CATEGORIES = [
    // Karnataka (KEA) categories
    { code: '1G', name: '1G (General)', description: 'Karnataka General category', state: 'KEA', percentage: null },
    { code: '2AG', name: '2AG', description: 'Karnataka 2A General', state: 'KEA', percentage: 15.0 },
    { code: '2BG', name: '2BG', description: 'Karnataka 2B General', state: 'KEA', percentage: 4.0 },
    { code: '3AG', name: '3AG', description: 'Karnataka 3A General', state: 'KEA', percentage: 4.0 },
    { code: '3BG', name: '3BG', description: 'Karnataka 3B General', state: 'KEA', percentage: 5.0 },
    { code: 'SC', name: 'SC', description: 'Scheduled Caste', state: 'KEA', percentage: 15.0 },
    { code: 'ST', name: 'ST', description: 'Scheduled Tribe', state: 'KEA', percentage: 3.0 },
    { code: 'CAT1', name: 'Category-1', description: 'Karnataka Category-1', state: 'KEA', percentage: 4.0 },
    { code: 'GM', name: 'GM (General Merit)', description: 'General Merit', state: 'KEA', percentage: null },
    { code: 'NRI', name: 'NRI', description: 'Non-Resident Indian', state: 'KEA', percentage: null },
    
    // Maharashtra (MHT_CET) categories (extensible)
    { code: 'OPEN', name: 'OPEN', description: 'Maharashtra Open category', state: 'MHT_CET', percentage: null },
    { code: 'SC', name: 'SC', description: 'Scheduled Caste', state: 'MHT_CET', percentage: 13.0 },
    { code: 'ST', name: 'ST', description: 'Scheduled Tribe', state: 'MHT_CET', percentage: 7.0 },
    { code: 'OBC', name: 'OBC', description: 'Other Backward Classes', state: 'MHT_CET', percentage: 19.0 },
    { code: 'EWS', name: 'EWS', description: 'Economically Weaker Section', state: 'MHT_CET', percentage: 10.0 },
    { code: 'PWD', name: 'PWD', description: 'Persons with Disabilities', state: 'MHT_CET', percentage: 3.0 }
];

const STATE_QUOTAS = [
    // Karnataka (KEA) quotas
    { code: 'GOVERNMENT', name: 'Government', description: 'Government quota seats', state: 'KEA' },
    { code: 'PRIVATE', name: 'Private', description: 'Private quota seats', state: 'KEA' },
    { code: 'NRI', name: 'NRI', description: 'NRI quota seats', state: 'KEA' },
    { code: 'OTHERS', name: 'Others', description: 'Other quota seats', state: 'KEA' },
    
    // Maharashtra (MHT_CET) quotas (extensible)
    { code: 'GOVERNMENT', name: 'Government', description: 'Government quota seats', state: 'MHT_CET' },
    { code: 'PRIVATE', name: 'Private', description: 'Private quota seats', state: 'MHT_CET' },
    { code: 'NRI', name: 'NRI', description: 'NRI quota seats', state: 'MHT_CET' },
    { code: 'MANAGEMENT', name: 'Management', description: 'Management quota seats', state: 'MHT_CET' }
];

const COUNSELLING_TYPES = [
    { code: 'AIQ_PG', name: 'AIQ Post Graduate', description: 'All India Quota Post Graduate', system: 'AIQ', authority: 'MCC' },
    { code: 'AIQ_UG', name: 'AIQ Under Graduate', description: 'All India Quota Under Graduate', system: 'AIQ', authority: 'MCC' },
    { code: 'KEA', name: 'Karnataka Examinations Authority', description: 'Karnataka State Counselling', system: 'STATE', authority: 'KEA' },
    { code: 'MHT_CET', name: 'Maharashtra CET', description: 'Maharashtra State Counselling', system: 'STATE', authority: 'MHT_CET' },
    { code: 'TNEA', name: 'Tamil Nadu Engineering Admissions', description: 'Tamil Nadu State Counselling', system: 'STATE', authority: 'TNEA' },
    { code: 'DEEMED', name: 'Deemed Universities', description: 'Deemed University Counselling', system: 'DEEMED', authority: 'MCC' }
];

async function createEnhancedDatabase() {
    const dbPath = path.join(__dirname, 'data', 'cutoff_ranks_enhanced.db');
    const db = new sqlite3.Database(dbPath);
    
    console.log('🚀 Creating enhanced universal cutoff database...');
    
    try {
        // Create enhanced schema
        await new Promise((resolve, reject) => {
            db.exec(ENHANCED_SCHEMA, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        console.log('✅ Enhanced schema created successfully');
        
        // Populate reference tables
        await populateReferenceTables(db);
        
        // Migrate existing data
        await migrateExistingData(db);
        
        console.log('🎉 Enhanced database created successfully!');
        console.log('📊 Database path:', dbPath);
        
    } catch (error) {
        console.error('❌ Error creating enhanced database:', error);
    } finally {
        db.close();
    }
}

async function populateReferenceTables(db) {
    console.log('📝 Populating reference tables...');
    
    // Insert AIQ Quotas
    for (const quota of AIQ_QUOTAS) {
        await new Promise((resolve, reject) => {
            db.run(
                'INSERT OR REPLACE INTO aiq_quotas (quota_code, quota_name, description) VALUES (?, ?, ?)',
                [quota.code, quota.name, quota.description],
                (err) => err ? reject(err) : resolve()
            );
        });
    }
    
    // Insert AIQ Categories
    for (const category of AIQ_CATEGORIES) {
        await new Promise((resolve, reject) => {
            db.run(
                'INSERT OR REPLACE INTO aiq_categories (category_code, category_name, description, reservation_percentage) VALUES (?, ?, ?, ?)',
                [category.code, category.name, category.description, category.percentage],
                (err) => err ? reject(err) : resolve()
            );
        });
    }
    
    // Insert State Categories
    for (const category of STATE_CATEGORIES) {
        await new Promise((resolve, reject) => {
            db.run(
                'INSERT OR REPLACE INTO state_categories (category_code, category_name, description, reservation_percentage, state_code) VALUES (?, ?, ?, ?, ?)',
                [category.code, category.name, category.description, category.percentage, category.state],
                (err) => err ? reject(err) : resolve()
            );
        });
    }
    
    // Insert State Quotas
    for (const quota of STATE_QUOTAS) {
        await new Promise((resolve, reject) => {
            db.run(
                'INSERT OR REPLACE INTO state_quotas (quota_code, quota_name, description, state_code) VALUES (?, ?, ?, ?)',
                [quota.code, quota.name, quota.description, quota.state],
                (err) => err ? reject(err) : resolve()
            );
        });
    }
    
    // Insert Counselling Types
    for (const type of COUNSELLING_TYPES) {
        await new Promise((resolve, reject) => {
            db.run(
                'INSERT OR REPLACE INTO counselling_types (type_code, name, description, system_type, parent_authority) VALUES (?, ?, ?, ?, ?)',
                [type.code, type.name, type.description, type.system, type.authority],
                (err) => err ? reject(err) : resolve()
            );
        });
    }
    
    console.log('✅ Reference tables populated successfully');
}

async function migrateExistingData(db) {
    console.log('🔄 Migrating existing data...');
    
    try {
        // Get existing data from old table
        const existingData = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM cutoff_ranks', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        console.log(`📊 Found ${existingData.length} existing records to migrate`);
        
        // Migrate each record
        for (const record of existingData) {
            // Determine if it's AIQ or State based on counselling_type
            const isAIQ = record.counselling_type.startsWith('AIQ');
            
            if (isAIQ) {
                // AIQ system: quota_type -> aiq_quota, category -> aiq_category
                await new Promise((resolve, reject) => {
                    db.run(`
                        INSERT INTO cutoff_ranks_enhanced (
                            college_id, course_id, counselling_type, counselling_year, round_number, round_name,
                            aiq_quota, aiq_category, state_category, state_quota,
                            cutoff_rank, cutoff_percentile, seats_available, seats_filled, fees_amount, special_remarks
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        record.college_id, record.course_id, record.counselling_type, record.counselling_year,
                        record.round_number, record.round_name,
                        record.quota_type, record.category, null, null,  // AIQ fields
                        record.cutoff_rank, record.cutoff_percentile, record.seats_available, record.seats_filled,
                        record.fees_amount, record.special_remarks
                    ], (err) => err ? reject(err) : resolve());
                });
            } else {
                // State system: quota_type -> state_quota, category -> state_category
                await new Promise((resolve, reject) => {
                    db.run(`
                        INSERT INTO cutoff_ranks_enhanced (
                            college_id, course_id, counselling_type, counselling_year, round_number, round_name,
                            aiq_quota, aiq_category, state_category, state_quota,
                            cutoff_rank, cutoff_percentile, seats_available, seats_filled, fees_amount, special_remarks
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        record.college_id, record.course_id, record.counselling_type, record.counselling_year,
                        record.round_number, record.round_name,
                        null, null, record.category, record.quota_type,  // State fields
                        record.cutoff_rank, record.cutoff_percentile, record.seats_available, record.seats_filled,
                        record.fees_amount, record.special_remarks
                    ], (err) => err ? reject(err) : resolve());
                });
            }
        }
        
        console.log('✅ Data migration completed successfully');
        
    } catch (error) {
        console.error('❌ Error during data migration:', error);
    }
}

// Run the script
if (require.main === module) {
    createEnhancedDatabase();
}

module.exports = { createEnhancedDatabase };
