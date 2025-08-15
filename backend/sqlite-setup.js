const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class SQLiteSetup {
  constructor() {
    this.dbPath = path.join(__dirname, 'data', 'colleges.db');
    this.db = null;
    this.ensureDataDirectory();
  }

  ensureDataDirectory() {
    const dataDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  async initialize() {
    try {
      console.log('🏗️  Initializing SQLite database...');
      
      // Create database connection
      this.db = new sqlite3.Database(this.dbPath);
      
      // Enable WAL mode for better concurrency
      await this.runQuery('PRAGMA journal_mode = WAL');
      await this.runQuery('PRAGMA synchronous = NORMAL');
      await this.runQuery('PRAGMA cache_size = 10000');
      await this.runQuery('PRAGMA temp_store = MEMORY');
      
      console.log('✅ Database connection established');
      
      // Create tables
      await this.createTables();
      
      console.log('✅ Database schema created successfully');
      
      return true;
      
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      return false;
    }
  }

  async createTables() {
    const schema = `
      -- Drop existing counselling-related tables if they exist
      DROP TABLE IF EXISTS counselling_alerts;
      DROP TABLE IF EXISTS quota_allocations;
      DROP TABLE IF EXISTS counselling_data;
      DROP TABLE IF EXISTS counselling_rounds;
      DROP TABLE IF EXISTS counselling_types;
      
      -- Create or update main colleges table
      CREATE TABLE IF NOT EXISTS colleges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        state TEXT NOT NULL,
        type TEXT NOT NULL,
        address TEXT,
        year_established INTEGER,
        management_type TEXT,
        university TEXT,
        search_vector TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Create or update courses table
      CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        college_id INTEGER NOT NULL,
        course_name TEXT NOT NULL,
        seats INTEGER NOT NULL,
        quota_details TEXT,
        cutoff_ranks TEXT,
        fees_structure TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (college_id) REFERENCES colleges(id)
      );

      -- Counselling types and categories
      CREATE TABLE counselling_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type_code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        quota_type TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Counselling rounds and sessions
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

      -- Counselling data for each round
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
        FOREIGN KEY (counselling_round_id) REFERENCES counselling_rounds(id),
        FOREIGN KEY (college_id) REFERENCES colleges(id),
        FOREIGN KEY (course_id) REFERENCES courses(id)
      );

      -- Quota allocations with detailed information
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
        FOREIGN KEY (college_id) REFERENCES colleges(id),
        FOREIGN KEY (course_id) REFERENCES courses(id),
        FOREIGN KEY (counselling_round_id) REFERENCES counselling_rounds(id)
      );

      -- Counselling notifications and alerts
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

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_colleges_type ON colleges(type);
      CREATE INDEX IF NOT EXISTS idx_colleges_state ON colleges(state);
      CREATE INDEX IF NOT EXISTS idx_colleges_name ON colleges(name);
      CREATE INDEX IF NOT EXISTS idx_courses_college_id ON courses(college_id);
      CREATE INDEX IF NOT EXISTS idx_courses_course_name ON courses(course_name);
      CREATE INDEX IF NOT EXISTS idx_courses_seats ON courses(seats);
      CREATE INDEX IF NOT EXISTS idx_counselling_round_id ON counselling_data(counselling_round_id);
      CREATE INDEX IF NOT EXISTS idx_counselling_college_id ON counselling_data(college_id);
      CREATE INDEX IF NOT EXISTS idx_counselling_rank ON counselling_data(all_india_rank);
      CREATE INDEX IF NOT EXISTS idx_quota_college_course ON quota_allocations(college_id, course_id);
      CREATE INDEX IF NOT EXISTS idx_quota_type ON quota_allocations(quota_type);
      CREATE INDEX IF NOT EXISTS idx_alerts_round_id ON counselling_alerts(counselling_round_id);
      CREATE INDEX IF NOT EXISTS idx_alerts_active ON counselling_alerts(is_active);
      
      -- Create or update full-text search index for colleges
      DROP TABLE IF EXISTS colleges_fts;
      CREATE VIRTUAL TABLE colleges_fts USING fts5(
        name, state, address, 
        content='colleges', 
        content_rowid='id'
      );
    `;

    return new Promise((resolve, reject) => {
      this.db.exec(schema, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async runQuery(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(query, params, function(err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  }

  async runSelect(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  close() {
    if (this.db) {
      this.db.close();
      console.log('🔒 Database connection closed');
    }
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new SQLiteSetup();
  setup.initialize()
    .then(success => {
      if (success) {
        console.log('🎉 SQLite setup completed successfully!');
        console.log(`📁 Database created at: ${setup.dbPath}`);
      } else {
        console.log('❌ SQLite setup failed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Setup error:', error);
      process.exit(1);
    })
    .finally(() => {
      setup.close();
    });
}

module.exports = SQLiteSetup;
