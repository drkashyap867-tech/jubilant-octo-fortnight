const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class DatabaseDeduplicator {
  constructor() {
    this.dbPath = path.join(__dirname, 'data', 'cutoff_ranks_enhanced.db');
    this.db = null;
    this.backupPath = path.join(__dirname, 'data', 'cutoff_ranks_enhanced_BACKUP_BEFORE_DEDUP.db');
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async disconnect() {
    if (this.db) {
      return new Promise((resolve) => {
        this.db.close((err) => {
          if (err) console.error('Error closing database:', err);
          resolve();
        });
      });
    }
  }

  async createBackup() {
    try {
      console.log('💾 Creating backup before deduplication...');

      const fs = require('fs');
      if (fs.existsSync(this.dbPath)) {
        fs.copyFileSync(this.dbPath, this.backupPath);
        console.log(`✅ Backup created: ${this.backupPath}`);
      }
    } catch (error) {
      console.error('❌ Backup failed:', error.message);
      throw error;
    }
  }

  async getDuplicateCount() {
    try {
      const result = await this.queryOne(`
                SELECT COUNT(*) as count 
                FROM (
                    SELECT college_id, course_id, counselling_type, counselling_year, 
                           round_name, aiq_quota, aiq_category, state_category, 
                           state_quota, cutoff_rank, COUNT(*) as dup_count
                    FROM cutoff_ranks_enhanced 
                    GROUP BY college_id, course_id, counselling_type, counselling_year, 
                             round_name, aiq_quota, aiq_category, state_category, 
                             state_quota, cutoff_rank
                    HAVING COUNT(*) > 1
                )
            `);

      return result.count;
    } catch (error) {
      console.error('Error getting duplicate count:', error.message);
      return 0;
    }
  }

  async removeDuplicates() {
    try {
      console.log('🧹 Removing duplicate records...');

      // Create a temporary table with unique records
      await this.runQuery(`
                CREATE TEMPORARY TABLE temp_unique AS
                SELECT MIN(rowid) as rowid
                FROM cutoff_ranks_enhanced
                GROUP BY college_id, course_id, counselling_type, counselling_year, 
                         round_name, aiq_quota, aiq_category, state_category, 
                         state_quota, cutoff_rank
            `);

      console.log('  📋 Temporary table created');

      // Count records to be kept
      const keptRecords = await this.queryOne('SELECT COUNT(*) as count FROM temp_unique');
      console.log(`  📊 Records to keep: ${keptRecords.count.toLocaleString()}`);

      // Create new table with unique records
      await this.runQuery(`
                CREATE TABLE cutoff_ranks_enhanced_clean AS
                SELECT cr.*
                FROM cutoff_ranks_enhanced cr
                INNER JOIN temp_unique tu ON cr.rowid = tu.rowid
            `);

      console.log('  🆕 Clean table created');

      // Count records in clean table
      const cleanCount = await this.queryOne('SELECT COUNT(*) as count FROM cutoff_ranks_enhanced_clean');
      console.log(`  📊 Clean table records: ${cleanCount.count.toLocaleString()}`);

      // Drop old table and rename clean table
      await this.runQuery('DROP TABLE cutoff_ranks_enhanced');
      await this.runQuery('ALTER TABLE cutoff_ranks_enhanced_clean RENAME TO cutoff_ranks_enhanced');

      console.log('  🔄 Tables swapped');

      // Drop temporary table
      await this.runQuery('DROP TABLE temp_unique');

      console.log('  🧹 Cleanup completed');

      return cleanCount.count;

    } catch (error) {
      console.error('Error removing duplicates:', error.message);
      throw error;
    }
  }

  async verifyDeduplication() {
    try {
      console.log('🔍 Verifying deduplication...');

      // Check total records
      const totalRecords = await this.queryOne('SELECT COUNT(*) as count FROM cutoff_ranks_enhanced');
      console.log(`  📊 Total records: ${totalRecords.count.toLocaleString()}`);

      // Check for remaining duplicates
      const remainingDuplicates = await this.queryOne(`
                SELECT COUNT(*) as count 
                FROM (
                    SELECT college_id, course_id, counselling_type, counselling_year, 
                           round_name, aiq_quota, aiq_category, state_category, 
                           state_quota, cutoff_rank, COUNT(*) as dup_count
                    FROM cutoff_ranks_enhanced 
                    GROUP BY college_id, course_id, counselling_type, counselling_year, 
                             round_name, aiq_quota, aiq_category, state_category, 
                             state_quota, cutoff_rank
                    HAVING COUNT(*) > 1
                )
            `);

      console.log(`  ❌ Remaining duplicates: ${remainingDuplicates.count.toLocaleString()}`);

      // Check records by counselling type
      const recordsByType = await this.queryAll(`
                SELECT counselling_type, COUNT(*) as count 
                FROM cutoff_ranks_enhanced 
                GROUP BY counselling_type 
                ORDER BY counselling_type
            `);

      console.log('\n📋 Records by Counselling Type:');
      recordsByType.forEach(type => {
        console.log(`  ${type.counselling_type}: ${type.count.toLocaleString()}`);
      });

      return remainingDuplicates.count === 0;

    } catch (error) {
      console.error('Error verifying deduplication:', error.message);
      return false;
    }
  }

  async queryOne(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async queryAll(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  async runDeduplication() {
    try {
      console.log('🚀 Starting Database Deduplication...');

      await this.connect();

      // Get initial duplicate count
      const initialDuplicates = await this.getDuplicateCount();
      console.log(`📊 Initial duplicates: ${initialDuplicates.toLocaleString()}`);

      if (initialDuplicates === 0) {
        console.log('✅ No duplicates found. Database is clean!');
        return;
      }

      // Create backup
      await this.createBackup();

      // Remove duplicates
      const finalCount = await this.removeDuplicates();
      console.log(`✅ Deduplication completed. Final record count: ${finalCount.toLocaleString()}`);

      // Verify deduplication
      const isClean = await this.verifyDeduplication();

      if (isClean) {
        console.log('\n🎉 SUCCESS: Database deduplication completed successfully!');
        console.log(`📊 Records removed: ${initialDuplicates.toLocaleString()}`);
        console.log(`💾 Backup saved: ${this.backupPath}`);
      } else {
        console.log('\n⚠️  WARNING: Some duplicates may remain. Manual verification required.');
      }

    } catch (error) {
      console.error('❌ Deduplication failed:', error.message);
      console.log('💾 Restore from backup if needed');
    } finally {
      await this.disconnect();
    }
  }
}

// Run the deduplication
const deduplicator = new DatabaseDeduplicator();
deduplicator.runDeduplication();
