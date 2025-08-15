const SQLiteSetup = require('./sqlite-setup');
const fs = require('fs');
const path = require('path');

class SQLiteMigratorFixed extends SQLiteSetup {
  constructor() {
    super();
    this.migrationStats = {
      totalCourses: 0,
      uniqueColleges: 0,
      migrated: 0,
      errors: 0,
      startTime: null,
      endTime: null
    };
  }

  async migrateData() {
    try {
      console.log('🚀 Starting CORRECTED data migration to SQLite...');
      console.log('📝 Understanding: Rows = Courses, NOT Colleges');
      this.migrationStats.startTime = new Date();
      
      // Initialize database
      await this.initialize();
      
      // Load existing JSON data
      const dataFiles = await this.loadDataFiles();
      console.log(`📊 Found ${dataFiles.length} data files to migrate`);
      
      // Begin transaction
      await this.runQuery('BEGIN TRANSACTION');
      
      // First, create a colleges table with unique colleges
      await this.createCollegesTable();
      
      // Then migrate course data
      for (const dataFile of dataFiles) {
        await this.migrateDataFile(dataFile);
      }
      
      // Commit transaction
      await this.runQuery('COMMIT');
      
      // Update FTS index
      await this.updateFTSIndex();
      
      // Generate migration report
      await this.generateMigrationReport();
      
      this.migrationStats.endTime = new Date();
      console.log('🎉 CORRECTED Migration completed successfully!');
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      await this.runQuery('ROLLBACK');
      throw error;
    } finally {
      this.close();
    }
  }

  async createCollegesTable() {
    console.log('🏗️  Creating colleges table structure...');
    
    const schema = `
      -- Drop existing tables if they exist
      DROP TABLE IF EXISTS colleges;
      DROP TABLE IF EXISTS courses;
      DROP TABLE IF EXISTS colleges_fts;
      
      -- Main colleges table (unique colleges)
      CREATE TABLE colleges (
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

      -- Courses table (courses offered by colleges)
      CREATE TABLE courses (
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

      -- Indexes for performance
      CREATE INDEX idx_colleges_type ON colleges(type);
      CREATE INDEX idx_colleges_state ON colleges(state);
      CREATE INDEX idx_colleges_name ON colleges(name);
      CREATE INDEX idx_courses_college_id ON courses(college_id);
      CREATE INDEX idx_courses_course_name ON courses(course_name);
      CREATE INDEX idx_courses_seats ON courses(seats);

      -- Full-text search index for colleges
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

  async loadDataFiles() {
    const dataDir = path.join(__dirname, 'data', 'processed');
    const files = [];
    
    const dataTypes = ['medical', 'dental', 'dnb'];
    
    for (const type of dataTypes) {
      const jsonFile = path.join(dataDir, `${type}_processed.json`);
      
      if (fs.existsSync(jsonFile)) {
        files.push({
          type: type,
          path: jsonFile,
          format: 'json',
          size: fs.statSync(jsonFile).size
        });
      }
    }
    
    return files;
  }

  async migrateDataFile(dataFile) {
    try {
      console.log(`📥 Migrating ${dataFile.type} data...`);
      
      const data = JSON.parse(fs.readFileSync(dataFile.path, 'utf8'));
      
      if (!data.data || !Array.isArray(data.data)) {
        console.log(`⚠️  No data array found in ${dataFile.path}, skipping`);
        return;
      }
      
      const records = data.data;
      console.log(`📊 Found ${records.length} course records in ${dataFile.type} data`);
      
      // First, extract unique colleges
      const uniqueColleges = this.extractUniqueColleges(records, dataFile.type);
      console.log(`🏫 Found ${uniqueColleges.length} unique colleges in ${dataFile.type}`);
      
      // Insert unique colleges
      await this.insertUniqueColleges(uniqueColleges);
      
      // Get college IDs AFTER inserting colleges
      const collegeIds = await this.getCollegeIdMap();
      console.log(`🔗 Mapped ${collegeIds.size} college IDs for ${dataFile.type}`);
      
      // Then insert course data
      await this.insertCourses(records, dataFile.type, collegeIds);
      
      this.migrationStats.totalCourses += records.length;
      this.migrationStats.uniqueColleges += uniqueColleges.length;
      
    } catch (error) {
      console.error(`❌ Error migrating ${dataFile.type}:`, error);
      this.migrationStats.errors++;
    }
  }

  extractUniqueColleges(records, type) {
    const collegeMap = new Map();
    
    records.forEach(record => {
      const collegeName = this.extractCollegeName(record);
      const state = this.extractState(record);
      
      if (!collegeMap.has(collegeName)) {
        collegeMap.set(collegeName, {
          name: collegeName,
          state: state,
          type: type,
          address: this.extractAddress(record),
          year_established: this.extractYear(record),
          management_type: this.extractManagement(record),
          university: this.extractUniversity(record),
          search_vector: `${collegeName} ${state} ${type}`.toLowerCase()
        });
      }
    });
    
    return Array.from(collegeMap.values());
  }

  async insertUniqueColleges(colleges) {
    // We have 8 columns (excluding auto-increment id)
    const placeholders = colleges.map(() => '(?, ?, ?, ?, ?, ?, ?, ?)').join(',');
    const query = `
      INSERT OR IGNORE INTO colleges (
        name, state, type, address, year_established, 
        management_type, university, search_vector
      ) VALUES ${placeholders}
    `;
    
    const values = colleges.flatMap(college => [
      college.name,
      college.state,
      college.type,
      college.address,
      college.year_established,
      college.management_type,
      college.university,
      college.search_vector
    ]);
    
    return this.runQuery(query, values);
  }

  async insertCourses(records, type, collegeIds) {
    // Process in smaller batches to avoid SQLite limits
    const batchSize = 100;
    
    // Debug: Show some college names and their IDs
    console.log(`🔍 Debug: First 5 college names in ${type}:`);
    const sampleColleges = Array.from(collegeIds.keys()).slice(0, 5);
    sampleColleges.forEach(name => {
      console.log(`   "${name}" -> ID: ${collegeIds.get(name)}`);
    });
    
    // Debug: Show some course records and their college names
    console.log(`🔍 Debug: First 5 course records in ${type}:`);
    records.slice(0, 5).forEach((record, index) => {
      const collegeName = this.extractCollegeName(record);
      console.log(`   Record ${index + 1}: "${collegeName}" -> Found: ${collegeIds.has(collegeName)}`);
    });
    
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      // Build valid records first
      const validRecords = [];
      for (const record of batch) {
        const collegeName = this.extractCollegeName(record);
        const collegeId = collegeIds.get(collegeName);
        
        if (!collegeId) {
          console.warn(`⚠️  College not found: "${collegeName}"`);
          continue;
        }
        
        const seats = this.extractSeats(record);
        if (seats === null || seats === undefined) {
          console.warn(`⚠️  Invalid seats for "${collegeName}": ${record.seats}`);
          continue;
        }
        
        validRecords.push({
          collegeId,
          courseName: this.extractCourseName(record),
          seats,
          quotaDetails: JSON.stringify(this.extractQuotaDetails(record)),
          cutoffRanks: JSON.stringify(this.extractCutoffRanks(record)),
          feesStructure: JSON.stringify(this.extractFeesStructure(record))
        });
      }
      
      if (validRecords.length === 0) {
        console.log(`⚠️  No valid courses in batch ${Math.floor(i/batchSize) + 1} for ${type}`);
        continue;
      }
      
      // Build the INSERT statement
      const placeholders = validRecords.map(() => '(?, ?, ?, ?, ?, ?)').join(',');
      const query = `
        INSERT INTO courses (
          college_id, course_name, seats, quota_details, cutoff_ranks, fees_structure
        ) VALUES ${placeholders}
      `;
      
      // Build the values array
      const values = [];
      for (const record of validRecords) {
        values.push(
          record.collegeId,
          record.courseName,
          record.seats,
          record.quotaDetails,
          record.cutoffRanks,
          record.feesStructure
        );
      }
      
      try {
        await this.runQuery(query, values);
        console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(records.length/batchSize)} for ${type} (${validRecords.length} courses)`);
      } catch (error) {
        console.error(`❌ Error inserting batch ${Math.floor(i/batchSize) + 1} for ${type}:`, error.message);
      }
    }
  }

  async getCollegeIdMap() {
    const colleges = await this.runSelect('SELECT id, name FROM colleges');
    const map = new Map();
    colleges.forEach(college => {
      map.set(college.name, college.id);
    });
    return map;
  }

  extractCollegeName(item) {
    return item.college_institute || item.name || item.institute_name || '';
  }

  extractCourseName(item) {
    return item.course || item.course_name || '';
  }

  extractState(item) {
    return item.state || item.state_name || '';
  }

  extractSeats(item) {
    const seats = item.seats || item.total_seats || 0;
    return parseInt(seats) || 0;
  }

  extractAddress(item) {
    return item.address || item.location || item.full_address || '';
  }

  extractYear(item) {
    const year = item.year_of_inception_of_college || 
                item.year_of_inception || 
                item.established_year || 
                item.founded_year;
    return parseInt(year) || null;
  }

  extractManagement(item) {
    return item.management_of_the_college || 
           item.management_type || 
           item.ownership || 
           item.institution_type || '';
  }

  extractUniversity(item) {
    return item.university_name || 
           item.university || 
           item.affiliating_university || '';
  }

  extractQuotaDetails(item) {
    // Extract quota information if available
    return {
      general: item.general_quota || null,
      obc: item.obc_quota || null,
      sc: item.sc_quota || null,
      st: item.st_quota || null,
      ews: item.ews_quota || null
    };
  }

  extractCutoffRanks(item) {
    // Extract cutoff rank information if available
    return {
      general: item.general_cutoff || null,
      obc: item.obc_cutoff || null,
      sc: item.sc_cutoff || null,
      st: item.st_cutoff || null,
      ews: item.ews_cutoff || null
    };
  }

  extractFeesStructure(item) {
    // Extract fee information if available
    return {
      tuition_fee: item.tuition_fee || null,
      hostel_fee: item.hostel_fee || null,
      other_fees: item.other_fees || null
    };
  }

  async updateFTSIndex() {
    console.log('🔍 Updating full-text search index...');
    
    try {
      await this.runQuery('INSERT INTO colleges_fts(colleges_fts) VALUES("rebuild")');
      console.log('✅ FTS index updated successfully');
    } catch (error) {
      console.error('⚠️  FTS index update failed:', error);
    }
  }

  async generateMigrationReport() {
    console.log('\n📊 CORRECTED Migration Report');
    console.log('==============================');
    console.log(`Total Course Records: ${this.migrationStats.totalCourses.toLocaleString()}`);
    console.log(`Unique Colleges: ${this.migrationStats.uniqueColleges.toLocaleString()}`);
    console.log(`Successfully Migrated: ${this.migrationStats.migrated.toLocaleString()}`);
    console.log(`Errors: ${this.migrationStats.errors}`);
    
    if (this.migrationStats.startTime && this.migrationStats.endTime) {
      const duration = this.migrationStats.endTime - this.migrationStats.startTime;
      console.log(`Duration: ${Math.round(duration / 1000)} seconds`);
    }
    
    // Get corrected database statistics
    try {
      const stats = await this.getCorrectedDatabaseStats();
      console.log('\n📈 CORRECTED Database Statistics');
      console.log('=================================');
      console.log(`Total Unique Colleges: ${stats.totalColleges.toLocaleString()}`);
      console.log(`Total Courses: ${stats.totalCourses.toLocaleString()}`);
      console.log(`Medical Colleges: ${stats.medicalColleges.toLocaleString()}`);
      console.log(`Dental Colleges: ${stats.dentalColleges.toLocaleString()}`);
      console.log(`DNB Hospitals: ${stats.dnbHospitals.toLocaleString()}`);
      console.log(`Total Seats: ${stats.totalSeats.toLocaleString()}`);
    } catch (error) {
      console.error('⚠️  Could not retrieve database stats:', error);
    }
  }

  async getCorrectedDatabaseStats() {
    const [totalColleges, totalCourses, byType, totalSeats] = await Promise.all([
      this.runSelect('SELECT COUNT(*) as count FROM colleges'),
      this.runSelect('SELECT COUNT(*) as count FROM courses'),
      this.runSelect('SELECT type, COUNT(*) as count FROM colleges GROUP BY type'),
      this.runSelect('SELECT SUM(seats) as total FROM courses WHERE seats > 0')
    ]);
    
    const byTypeMap = {};
    byType.forEach(row => {
      byTypeMap[row.type] = row.count;
    });
    
    return {
      totalColleges: totalColleges[0]?.count || 0,
      totalCourses: totalCourses[0]?.count || 0,
      medicalColleges: byTypeMap.medical || 0,
      dentalColleges: byTypeMap.dental || 0,
      dnbHospitals: byTypeMap.dnb || 0,
      totalSeats: totalSeats[0]?.total || 0
    };
  }
}

// Run migration if called directly
if (require.main === module) {
  const migrator = new SQLiteMigratorFixed();
  migrator.migrateData()
    .then(() => {
      console.log('🚀 CORRECTED Migration script completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = SQLiteMigratorFixed;
