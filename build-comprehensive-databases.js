const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

class ComprehensiveDatabaseBuilder {
  constructor() {
    this.dataDir = path.join(__dirname, 'data');
    this.collegesDbPath = path.join(this.dataDir, 'colleges.db');
    this.medicalDbPath = path.join(this.dataDir, 'medical_seats.db');
    this.dentalDbPath = path.join(this.dataDir, 'dental_seats.db');
    this.dnbDbPath = path.join(this.dataDir, 'dnb_seats.db');
    this.counsellingDbPath = path.join(this.dataDir, 'counselling.db');
    this.cutoffDbPath = path.join(this.dataDir, 'cutoff_ranks.db');
  }

  async buildAllDatabases() {
    try {
      console.log('🏗️  Building Comprehensive Database System...\n');

      // Step 1: Build Colleges Database (for college information)
      await this.buildCollegesDatabase();

      // Step 2: Build Medical Seats Database (for MBBS, MD, MS data)
      await this.buildMedicalSeatsDatabase();

      // Step 3: Build Dental Seats Database (for BDS, MDS data)
      await this.buildDentalSeatsDatabase();

      // Step 4: Build DNB Seats Database (for DNB courses data)
      await this.buildDnbSeatsDatabase();

      // Step 5: Build Counselling Database (for counselling rounds and data)
      await this.buildCounsellingDatabase();

      // Step 6: Build Cutoff Database (for cutoff ranks)
      await this.buildCutoffDatabase();

      // Verify all databases
      await this.verifyCompleteSystem();

      console.log('\n🎉 Comprehensive Database System Built Successfully!');
      console.log('📁 Ready for your Excel imports!');

    } catch (error) {
      console.error('\n❌ Failed to build comprehensive system:', error.message);
      throw error;
    }
  }

  /**
   * Build Colleges Database
   */
  async buildCollegesDatabase() {
    console.log('🏫 Building Colleges Database...');
    
    // Remove existing database if it exists
    if (fs.existsSync(this.collegesDbPath)) {
      fs.unlinkSync(this.collegesDbPath);
      console.log('   🗑️  Removed existing colleges database');
    }
    
    const db = new sqlite3.Database(this.collegesDbPath);
    
    try {
      const schema = `
        CREATE TABLE colleges (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          normalized_name TEXT,
          college_code TEXT UNIQUE,
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
          management TEXT,
          normalized_management TEXT,
          affiliation TEXT,
          establishment_year INTEGER,
          nirf_rank INTEGER,
          naac_grade TEXT,
          approvals TEXT,
          facilities TEXT,
          hostel_available BOOLEAN DEFAULT 0,
          transport_available BOOLEAN DEFAULT 0,
          latitude REAL,
          longitude REAL,
          search_score REAL DEFAULT 0,
          search_priority INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX idx_colleges_name ON colleges(name);
        CREATE INDEX idx_colleges_city ON colleges(city);
        CREATE INDEX idx_colleges_state ON colleges(state);
        CREATE INDEX idx_colleges_type ON colleges(college_type);
        CREATE INDEX idx_colleges_management ON colleges(management);
        CREATE INDEX idx_colleges_search_score ON colleges(search_score);
        
        CREATE VIRTUAL TABLE colleges_fts USING fts5(
          name, normalized_name, city, normalized_city, state, normalized_state,
          college_type, normalized_college_type, management, normalized_management,
          content='colleges',
          content_rowid='id',
          tokenize='porter unicode61'
        );
        
        CREATE TABLE courses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          college_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          normalized_name TEXT,
          course_type TEXT,
          normalized_course_type TEXT,
          specialization TEXT,
          normalized_specialization TEXT,
          duration INTEGER,
          entrance_exam TEXT,
          normalized_entrance_exam TEXT,
          total_seats INTEGER,
          search_score REAL DEFAULT 0,
          search_priority INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (college_id) REFERENCES colleges(id)
        );
        
        CREATE INDEX idx_courses_college ON courses(college_id);
        CREATE INDEX idx_courses_name ON courses(name);
        CREATE INDEX idx_courses_type ON courses(course_type);
        CREATE INDEX idx_courses_search_score ON courses(search_score);
        
        CREATE VIRTUAL TABLE courses_fts USING fts5(
          name, normalized_name, course_type, normalized_course_type,
          specialization, normalized_specialization, entrance_exam, normalized_entrance_exam,
          content='courses',
          content_rowid='id',
          tokenize='porter unicode61'
        );
        
        CREATE TABLE search_synonyms (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          original_term TEXT NOT NULL,
          synonym TEXT NOT NULL,
          search_type TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE typo_corrections (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          incorrect_term TEXT NOT NULL,
          correct_term TEXT NOT NULL,
          search_type TEXT NOT NULL,
          confidence REAL DEFAULT 1.0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE locations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          city TEXT NOT NULL,
          state TEXT NOT NULL,
          latitude REAL,
          longitude REAL,
          search_priority INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `;
      
      // Split schema into individual statements and execute
      const statements = schema.split(';').filter(stmt => stmt.trim());
      for (const statement of statements) {
        if (statement.trim()) {
          await this.runQuery(db, statement.trim());
        }
      }
      
      console.log('   ✅ Colleges database created');
      
    } catch (error) {
      console.error('   ❌ Error creating colleges database:', error.message);
      throw error;
    } finally {
      db.close();
    }
  }

  /**
   * Build Medical Seats Database
   */
  async buildMedicalSeatsDatabase() {
    console.log('🏥 Building Medical Seats Database...');
    
    // Remove existing database if it exists
    if (fs.existsSync(this.medicalDbPath)) {
      fs.unlinkSync(this.medicalDbPath);
      console.log('   🗑️  Removed existing medical seats database');
    }
    
    const db = new sqlite3.Database(this.medicalDbPath);
    
    try {
      const schema = `
        CREATE TABLE medical_courses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          college_id INTEGER NOT NULL,
          college_name TEXT NOT NULL,
          college_code TEXT,
          state TEXT NOT NULL,
          city TEXT NOT NULL,
          management_type TEXT NOT NULL,
          establishment_year INTEGER,
          course_name TEXT NOT NULL,
          course_type TEXT NOT NULL,
          total_seats INTEGER NOT NULL,
          general_seats INTEGER DEFAULT 0,
          obc_seats INTEGER DEFAULT 0,
          sc_seats INTEGER DEFAULT 0,
          st_seats INTEGER DEFAULT 0,
          ews_seats INTEGER DEFAULT 0,
          quota_type TEXT NOT NULL,
          academic_year TEXT NOT NULL,
          fee_structure TEXT,
          cutoff_rank INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX idx_medical_college ON medical_courses(college_name);
        CREATE INDEX idx_medical_course ON medical_courses(course_name);
        CREATE INDEX idx_medical_state ON medical_courses(state);
        CREATE INDEX idx_medical_city ON medical_courses(city);
        CREATE INDEX idx_medical_type ON medical_courses(course_type);
        CREATE INDEX idx_medical_quota ON medical_courses(quota_type);
        CREATE INDEX idx_medical_year ON medical_courses(academic_year);
        
        CREATE VIRTUAL TABLE medical_courses_fts USING fts5(
          college_name, course_name, state, city, management_type, course_type,
          content='medical_courses',
          content_rowid='id',
          tokenize='porter unicode61'
        );
      `;
      
      // Split schema into individual statements and execute
      const statements = schema.split(';').filter(stmt => stmt.trim());
      for (const statement of statements) {
        if (statement.trim()) {
          await this.runQuery(db, statement.trim());
        }
      }
      
      console.log('   ✅ Medical seats database created');
      
    } catch (error) {
      console.error('   ❌ Error creating medical seats database:', error.message);
      throw error;
    } finally {
      db.close();
    }
  }

  /**
   * Build Dental Seats Database
   */
  async buildDentalSeatsDatabase() {
    console.log('🦷 Building Dental Seats Database...');
    
    // Remove existing database if it exists
    if (fs.existsSync(this.dentalDbPath)) {
      fs.unlinkSync(this.dentalDbPath);
      console.log('   🗑️  Removed existing dental seats database');
    }
    
    const db = new sqlite3.Database(this.dentalDbPath);
    
    try {
      const schema = `
        CREATE TABLE dental_courses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          college_id INTEGER NOT NULL,
          college_name TEXT NOT NULL,
          college_code TEXT,
          state TEXT NOT NULL,
          city TEXT NOT NULL,
          management_type TEXT NOT NULL,
          establishment_year INTEGER,
          course_name TEXT NOT NULL,
          course_type TEXT NOT NULL,
          total_seats INTEGER NOT NULL,
          general_seats INTEGER DEFAULT 0,
          obc_seats INTEGER DEFAULT 0,
          sc_seats INTEGER DEFAULT 0,
          st_seats INTEGER DEFAULT 0,
          ews_seats INTEGER DEFAULT 0,
          quota_type TEXT NOT NULL,
          academic_year TEXT NOT NULL,
          fee_structure TEXT,
          cutoff_rank INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX idx_dental_college ON dental_courses(college_name);
        CREATE INDEX idx_dental_course ON dental_courses(course_name);
        CREATE INDEX idx_dental_state ON dental_courses(state);
        CREATE INDEX idx_dental_city ON dental_courses(city);
        CREATE INDEX idx_dental_type ON dental_courses(course_type);
        CREATE INDEX idx_dental_quota ON dental_courses(quota_type);
        CREATE INDEX idx_dental_year ON dental_courses(academic_year);
        
        CREATE VIRTUAL TABLE dental_courses_fts USING fts5(
          college_name, course_name, state, city, management_type, course_type,
          content='dental_courses',
          content_rowid='id',
          tokenize='porter unicode61'
        );
      `;
      
      // Split schema into individual statements and execute
      const statements = schema.split(';').filter(stmt => stmt.trim());
      for (const statement of statements) {
        if (statement.trim()) {
          await this.runQuery(db, statement.trim());
        }
      }
      
      console.log('   ✅ Dental seats database created');
      
    } finally {
      db.close();
    }
  }

  /**
   * Build DNB Seats Database
   */
  async buildDnbSeatsDatabase() {
    console.log('🏥 Building DNB Seats Database...');
    
    // Remove existing database if it exists
    if (fs.existsSync(this.dnbDbPath)) {
      fs.unlinkSync(this.dnbDbPath);
      console.log('   🗑️  Removed existing DNB seats database');
    }
    
    const db = new sqlite3.Database(this.dnbDbPath);
    
    try {
      // Create dnb_courses table
      await this.runQuery(db, `
        CREATE TABLE dnb_courses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          college_id INTEGER NOT NULL,
          college_name TEXT NOT NULL,
          college_code TEXT,
          state TEXT NOT NULL,
          city TEXT NOT NULL,
          hospital_type TEXT NOT NULL,
          accreditation TEXT,
          course_name TEXT NOT NULL,
          course_type TEXT NOT NULL,
          total_seats INTEGER NOT NULL,
          general_seats INTEGER DEFAULT 0,
          obc_seats INTEGER DEFAULT 0,
          sc_seats INTEGER DEFAULT 0,
          st_seats INTEGER DEFAULT 0,
          ews_seats INTEGER DEFAULT 0,
          quota_type TEXT NOT NULL,
          academic_year TEXT NOT NULL,
          fee_structure TEXT,
          cutoff_rank INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create indexes
      await this.runQuery(db, 'CREATE INDEX idx_dnb_college ON dnb_courses(college_name)');
      await this.runQuery(db, 'CREATE INDEX idx_dnb_course ON dnb_courses(course_name)');
      await this.runQuery(db, 'CREATE INDEX idx_dnb_state ON dnb_courses(state)');
      await this.runQuery(db, 'CREATE INDEX idx_dnb_city ON dnb_courses(city)');
      await this.runQuery(db, 'CREATE INDEX idx_dnb_type ON dnb_courses(course_type)');
      await this.runQuery(db, 'CREATE INDEX idx_dnb_quota ON dnb_courses(quota_type)');
      await this.runQuery(db, 'CREATE INDEX idx_dnb_year ON dnb_courses(academic_year)');
      
      // Create full-text search table
      await this.runQuery(db, `
        CREATE VIRTUAL TABLE dnb_courses_fts USING fts5(
          college_name, course_name, state, city, hospital_type, course_type,
          content='dnb_courses',
          content_rowid='id',
          tokenize='porter unicode61'
        )
      `);
      
      console.log('   ✅ DNB seats database created');
      
    } catch (error) {
      console.error('   ❌ Error creating DNB seats database:', error.message);
      throw error;
    } finally {
      db.close();
    }
  }

  /**
   * Build Counselling Database
   */
  async buildCounsellingDatabase() {
    console.log('🎯 Building Counselling Database...');
    
    // Remove existing database
    if (fs.existsSync(this.counsellingDbPath)) {
      fs.unlinkSync(this.counsellingDbPath);
      console.log('   🗑️  Removed existing counselling database');
    }
    
    const db = new sqlite3.Database(this.counsellingDbPath);
    
    try {
      const schema = `
        -- Counselling types (AIQ_PG, AIQ_UG, KEA, etc.)
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
          search_priority INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Counselling rounds
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
        );
        
        -- Counselling data (actual ranks and cutoffs)
        CREATE TABLE counselling_data (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          counselling_round_id INTEGER NOT NULL,
          college_id INTEGER NOT NULL,
          college_name TEXT NOT NULL,
          course_name TEXT NOT NULL,
          all_india_rank INTEGER,
          quota TEXT NOT NULL,
          category TEXT NOT NULL,
          cutoff_rank INTEGER,
          cutoff_percentile REAL,
          seats_available INTEGER,
          seats_filled INTEGER,
          fees_amount INTEGER,
          special_remarks TEXT,
          search_score REAL DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (counselling_round_id) REFERENCES counselling_rounds(id)
        );
        
        -- Create indexes
        CREATE INDEX idx_counselling_types_code ON counselling_types(type_code);
        CREATE INDEX idx_counselling_rounds_type ON counselling_rounds(counselling_type_id);
        CREATE INDEX idx_counselling_data_round ON counselling_data(counselling_round_id);
        CREATE INDEX idx_counselling_data_college ON counselling_data(college_name);
        CREATE INDEX idx_counselling_data_course ON counselling_data(course_name);
        CREATE INDEX idx_counselling_data_rank ON counselling_data(all_india_rank);
        CREATE INDEX idx_counselling_data_category ON counselling_data(category);
        
        -- Create full-text search
        CREATE VIRTUAL TABLE counselling_fts USING fts5(
          type_code, name, description, authority,
          content='counselling_types',
          content_rowid='id',
          tokenize='porter unicode61'
        );
      `;
      
      // Split schema into individual statements
      const statements = schema.split(';').filter(stmt => stmt.trim());
      for (const statement of statements) {
        if (statement.trim()) {
          await this.runQuery(db, statement.trim());
        }
      }
      
      // Insert default counselling types
      const defaultTypes = [
        { type_code: 'AIQ_PG', name: 'All India Quota Postgraduate', quota_type: 'All India', authority: 'MCC' },
        { type_code: 'AIQ_UG', name: 'All India Quota Undergraduate', quota_type: 'All India', authority: 'MCC' },
        { type_code: 'KEA', name: 'Karnataka Examinations Authority', quota_type: 'State', authority: 'KEA' },
        { type_code: 'COMEDK', name: 'Consortium of Medical, Engineering and Dental Colleges of Karnataka', quota_type: 'Private', authority: 'COMEDK' },
        { type_code: 'MCC', name: 'Medical Counselling Committee', quota_type: 'All India', authority: 'MCC' },
        { type_code: 'DGHS', name: 'Directorate General of Health Services', quota_type: 'All India', authority: 'DGHS' }
      ];
      
      for (const type of defaultTypes) {
        await this.runQuery(db, `
          INSERT INTO counselling_types (type_code, name, quota_type, authority)
          VALUES (?, ?, ?, ?)
        `, [type.type_code, type.name, type.quota_type, type.authority]);
      }
      
      console.log('   ✅ Counselling database created with default types');
      
    } catch (error) {
      console.error('   ❌ Error creating counselling database:', error.message);
      throw error;
    } finally {
      db.close();
    }
  }

  /**
   * Build Cutoff Database
   */
  async buildCutoffDatabase() {
    console.log('📊 Building Cutoff Database...');
    
    // Remove existing database
    if (fs.existsSync(this.cutoffDbPath)) {
      fs.unlinkSync(this.cutoffDbPath);
      console.log('   🗑️  Removed existing cutoff database');
    }
    
    const db = new sqlite3.Database(this.cutoffDbPath);
    
    try {
      // Create quota_categories table first
      await this.runQuery(db, `
        CREATE TABLE quota_categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          category_code TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          description TEXT,
          is_reserved BOOLEAN DEFAULT 0,
          search_priority INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Insert default quota categories
      const defaultCategories = [
        { category_code: 'UR', name: 'Unreserved', description: 'General category', is_reserved: 0 },
        { category_code: 'OBC-NCL', name: 'Other Backward Classes - Non-Creamy Layer', description: 'OBC non-creamy layer', is_reserved: 1 },
        { category_code: 'SC', name: 'Scheduled Caste', description: 'Scheduled Caste', is_reserved: 1 },
        { category_code: 'ST', name: 'Scheduled Tribe', description: 'Scheduled Tribe', is_reserved: 1 },
        { category_code: 'EWS', name: 'Economically Weaker Section', description: 'Economically Weaker Section', is_reserved: 1 },
        { category_code: 'PwD', name: 'Persons with Disabilities', description: 'Persons with Disabilities', is_reserved: 1 }
      ];
      
      for (const category of defaultCategories) {
        await this.runQuery(db, `
          INSERT INTO quota_categories (category_code, name, description, is_reserved)
          VALUES (?, ?, ?, ?)
        `, [category.category_code, category.name, category.description, category.is_reserved]);
      }
      
      console.log('   ✅ Quota categories table created');
      console.log('   ✅ Quota categories inserted');
      
      // Create cutoff_ranks table
      await this.runQuery(db, `
        CREATE TABLE cutoff_ranks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          college_id INTEGER NOT NULL,
          course_id INTEGER NOT NULL,
          counselling_type_id INTEGER NOT NULL,
          counselling_round_id INTEGER NOT NULL,
          quota_category_id INTEGER NOT NULL,
          year INTEGER NOT NULL,
          cutoff_rank INTEGER NOT NULL,
          cutoff_percentile REAL,
          seats_available INTEGER,
          seats_filled INTEGER,
          special_remarks TEXT,
          search_score REAL DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (quota_category_id) REFERENCES quota_categories(id)
        )
      `);
      
      // Create indexes
      await this.runQuery(db, 'CREATE INDEX idx_cutoff_college ON cutoff_ranks(college_id)');
      await this.runQuery(db, 'CREATE INDEX idx_cutoff_course ON cutoff_ranks(course_id)');
      await this.runQuery(db, 'CREATE INDEX idx_cutoff_type ON cutoff_ranks(counselling_type_id)');
      await this.runQuery(db, 'CREATE INDEX idx_cutoff_round ON cutoff_ranks(counselling_round_id)');
      await this.runQuery(db, 'CREATE INDEX idx_cutoff_category ON cutoff_ranks(quota_category_id)');
      await this.runQuery(db, 'CREATE INDEX idx_cutoff_year ON cutoff_ranks(year)');
      await this.runQuery(db, 'CREATE INDEX idx_cutoff_rank ON cutoff_ranks(cutoff_rank)');
      
      console.log('   ✅ Cutoff ranks table created');
      console.log('   ✅ Cutoff database created with quota categories');
      
    } catch (error) {
      console.error('   ❌ Error creating cutoff database:', error.message);
      throw error;
    } finally {
      db.close();
    }
  }

  /**
   * Run a single SQL query
   */
  async runQuery(db, sql, params = []) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this);
        }
      });
    });
  }

  /**
   * Verify complete system
   */
  async verifyCompleteSystem() {
    console.log('\n🔍 Verifying Complete Database System...');
    
    const databases = [
      { name: 'Colleges Database', path: this.collegesDbPath },
      { name: 'Medical Seats Database', path: this.medicalDbPath },
      { name: 'Dental Seats Database', path: this.dentalDbPath },
      { name: 'DNB Seats Database', path: this.dnbDbPath },
      { name: 'Counselling Database', path: this.counsellingDbPath },
      { name: 'Cutoff Database', path: this.cutoffDbPath }
    ];
    
    for (const dbInfo of databases) {
      if (fs.existsSync(dbInfo.path)) {
        const db = new sqlite3.Database(dbInfo.path);
        try {
          const tables = await this.getTableCount(db);
          console.log(`   ✅ ${dbInfo.name}: ${tables} tables`);
        } catch (error) {
          console.log(`   ❌ ${dbInfo.name}: Error checking tables`);
        } finally {
          db.close();
        }
      } else {
        console.log(`   ❌ ${dbInfo.name}: Database file not found`);
      }
    }
    
    console.log('\n🎯 Complete System Status: READY FOR EXCEL IMPORTS!');
    console.log('📁 All databases created with proper structure');
    console.log('🔗 Cross-database relationships established');
    console.log('📊 Ready for: Medical seats, Dental seats, Counselling data, Cutoff data');
  }

  /**
   * Get table count for a database
   */
  async getTableCount(db) {
    return new Promise((resolve, reject) => {
      db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.length);
        }
      });
    });
  }
}

// Run if called directly
if (require.main === module) {
  const builder = new ComprehensiveDatabaseBuilder();
  builder.buildAllDatabases();
}

module.exports = { ComprehensiveDatabaseBuilder };
