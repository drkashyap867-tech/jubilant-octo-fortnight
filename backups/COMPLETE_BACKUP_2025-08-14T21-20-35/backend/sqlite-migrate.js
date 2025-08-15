const SQLiteSetup = require('./sqlite-setup');
const fs = require('fs');
const path = require('path');

class SQLiteMigrator extends SQLiteSetup {
  constructor() {
    super();
    this.migrationStats = {
      total: 0,
      migrated: 0,
      errors: 0,
      startTime: null,
      endTime: null
    };
  }

  async migrateData() {
    try {
      console.log('🚀 Starting data migration to SQLite...');
      this.migrationStats.startTime = new Date();
      
      // Initialize database
      await this.initialize();
      
      // Load existing JSON data
      const dataFiles = await this.loadDataFiles();
      console.log(`📊 Found ${dataFiles.length} data files to migrate`);
      
      // Begin transaction
      await this.runQuery('BEGIN TRANSACTION');
      
      // Migrate each data type
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
      console.log('🎉 Migration completed successfully!');
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      await this.runQuery('ROLLBACK');
      throw error;
    } finally {
      this.close();
    }
  }

  async loadDataFiles() {
    const dataDir = path.join(__dirname, 'data', 'processed');
    const files = [];
    
    const dataTypes = ['medical', 'dental', 'dnb'];
    
    for (const type of dataTypes) {
      const jsonFile = path.join(dataDir, `${type}_processed.json`);
      const csvFile = path.join(dataDir, `${type}_processed.csv`);
      
      if (fs.existsSync(jsonFile)) {
        files.push({
          type: type,
          path: jsonFile,
          format: 'json',
          size: fs.statSync(jsonFile).size
        });
      }
      
      if (fs.existsSync(csvFile)) {
        files.push({
          type: type,
          path: csvFile,
          format: 'csv',
          size: fs.statSync(csvFile).size
        });
      }
    }
    
    return files;
  }

  async migrateDataFile(dataFile) {
    try {
      console.log(`📥 Migrating ${dataFile.type} data (${dataFile.format})...`);
      
      let data;
      if (dataFile.format === 'json') {
        data = JSON.parse(fs.readFileSync(dataFile.path, 'utf8'));
      } else {
        // Handle CSV if needed
        console.log(`⚠️  CSV migration not implemented yet, skipping ${dataFile.path}`);
        return;
      }
      
      if (!data.data || !Array.isArray(data.data)) {
        console.log(`⚠️  No data array found in ${dataFile.path}, skipping`);
        return;
      }
      
      const records = data.data;
      console.log(`📊 Found ${records.length} records in ${dataFile.type} data`);
      
      // Migrate records in batches
      const batchSize = 1000;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        await this.insertBatch(batch, dataFile.type);
        
        const progress = Math.round(((i + batch.length) / records.length) * 100);
        console.log(`✅ ${dataFile.type}: ${progress}% complete (${i + batch.length}/${records.length})`);
      }
      
      this.migrationStats.migrated += records.length;
      
    } catch (error) {
      console.error(`❌ Error migrating ${dataFile.type}:`, error);
      this.migrationStats.errors++;
    }
  }

  async insertBatch(batch, type) {
    // We have 10 columns (excluding auto-increment id)
    const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(',');
    const query = `
      INSERT INTO colleges (
        name, course, state, seats, type, address, 
        year_established, management_type, university, search_vector
      ) VALUES ${placeholders}
    `;
    
    const values = batch.flatMap(item => [
      this.extractName(item),
      this.extractCourse(item),
      this.extractState(item),
      this.extractSeats(item),
      type,
      this.extractAddress(item),
      this.extractYear(item),
      this.extractManagement(item),
      this.extractUniversity(item),
      this.createSearchVector(item)
    ]);
    
    return this.runQuery(query, values);
  }

  extractName(item) {
    return item.college_institute || item.name || item.institute_name || '';
  }

  extractCourse(item) {
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

  createSearchVector(item) {
    const name = this.extractName(item);
    const course = this.extractCourse(item);
    const state = this.extractState(item);
    const address = this.extractAddress(item);
    
    return `${name} ${course} ${state} ${address}`.toLowerCase().trim();
  }

  async updateFTSIndex() {
    console.log('🔍 Updating full-text search index...');
    
    try {
      // Rebuild FTS index
      await this.runQuery('INSERT INTO colleges_fts(colleges_fts) VALUES("rebuild")');
      console.log('✅ FTS index updated successfully');
    } catch (error) {
      console.error('⚠️  FTS index update failed:', error);
    }
  }

  async generateMigrationReport() {
    console.log('\n📊 Migration Report');
    console.log('==================');
    console.log(`Total Records: ${this.migrationStats.total}`);
    console.log(`Successfully Migrated: ${this.migrationStats.migrated}`);
    console.log(`Errors: ${this.migrationStats.errors}`);
    
    if (this.migrationStats.startTime && this.migrationStats.endTime) {
      const duration = this.migrationStats.endTime - this.migrationStats.startTime;
      console.log(`Duration: ${Math.round(duration / 1000)} seconds`);
    }
    
    // Get database statistics
    try {
      const stats = await this.getDatabaseStats();
      console.log('\n📈 Database Statistics');
      console.log('=====================');
      console.log(`Total Colleges: ${stats.totalColleges}`);
      console.log(`Medical Colleges: ${stats.medicalColleges}`);
      console.log(`Dental Colleges: ${stats.dentalColleges}`);
      console.log(`DNB Hospitals: ${stats.dnbHospitals}`);
      console.log(`Total Seats: ${stats.totalSeats.toLocaleString()}`);
    } catch (error) {
      console.error('⚠️  Could not retrieve database stats:', error);
    }
  }

  async getDatabaseStats() {
    const [total, byType, totalSeats] = await Promise.all([
      this.runSelect('SELECT COUNT(*) as count FROM colleges'),
      this.runSelect('SELECT type, COUNT(*) as count FROM colleges GROUP BY type'),
      this.runSelect('SELECT SUM(seats) as total FROM colleges WHERE seats > 0')
    ]);
    
    const byTypeMap = {};
    byType.forEach(row => {
      byTypeMap[row.type] = row.count;
    });
    
    return {
      totalColleges: total[0]?.count || 0,
      medicalColleges: byTypeMap.medical || 0,
      dentalColleges: byTypeMap.dental || 0,
      dnbHospitals: byTypeMap.dnb || 0,
      totalSeats: totalSeats[0]?.total || 0
    };
  }
}

// Run migration if called directly
if (require.main === module) {
  const migrator = new SQLiteMigrator();
  migrator.migrateData()
    .then(() => {
      console.log('🚀 Migration script completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = SQLiteMigrator;
