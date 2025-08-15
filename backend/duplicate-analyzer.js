const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class DuplicateAnalyzer {
  constructor() {
    this.dbPath = path.join(__dirname, 'data', 'cutoff_ranks_enhanced.db');
    this.db = null;
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

  async analyzeDuplicates() {
    try {
      console.log('🔍 Analyzing Database for Duplicates...');

      // Get total records
      const totalRecords = await this.queryOne('SELECT COUNT(*) as count FROM cutoff_ranks_enhanced');
      console.log(`📊 Total Records: ${totalRecords.count.toLocaleString()}`);

      // Check for exact duplicates
      const exactDuplicates = await this.queryAll(`
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

      console.log(`❌ Exact Duplicates: ${exactDuplicates[0].count.toLocaleString()}`);

      // Check duplicates by counselling type
      const duplicatesByType = await this.queryAll(`
                SELECT counselling_type, COUNT(*) as total_records,
                       COUNT(DISTINCT college_id || '|' || course_id || '|' || 
                             counselling_year || '|' || round_name || '|' || 
                             COALESCE(aiq_quota, '') || '|' || COALESCE(aiq_category, '') || '|' || 
                             COALESCE(state_category, '') || '|' || COALESCE(state_quota, '') || '|' || 
                             cutoff_rank) as unique_records
                FROM cutoff_ranks_enhanced 
                GROUP BY counselling_type
            `);

      console.log('\n📋 Duplicate Analysis by Counselling Type:');
      duplicatesByType.forEach(type => {
        const duplicates = type.total_records - type.unique_records;
        console.log(`  ${type.counselling_type}: ${type.total_records.toLocaleString()} total, ${type.unique_records.toLocaleString()} unique, ${duplicates.toLocaleString()} duplicates`);
      });

      // Find specific duplicate examples
      console.log('\n🔍 Finding Specific Duplicate Examples...');
      const duplicateExamples = await this.queryAll(`
                SELECT college_id, course_id, counselling_type, counselling_year, 
                       round_name, aiq_quota, aiq_category, state_category, 
                       state_quota, cutoff_rank, COUNT(*) as dup_count
                FROM cutoff_ranks_enhanced 
                GROUP BY college_id, course_id, counselling_type, counselling_year, 
                         round_name, aiq_quota, aiq_category, state_category, 
                         state_quota, cutoff_rank
                HAVING COUNT(*) > 1
                ORDER BY dup_count DESC
                LIMIT 10
            `);

      console.log('\n📊 Top 10 Duplicate Patterns:');
      duplicateExamples.forEach((dup, index) => {
        console.log(`  ${index + 1}. ${dup.counselling_type} ${dup.counselling_year} ${dup.round_name} - College:${dup.college_id}, Course:${dup.course_id} - Count: ${dup.dup_count}`);
      });

      // Check if duplicates are from recent import
      console.log('\n🔍 Checking Recent Import Duplicates...');
      const recentDuplicates = await this.queryAll(`
                SELECT counselling_type, COUNT(*) as total,
                       COUNT(DISTINCT college_id || '|' || course_id || '|' || 
                             counselling_year || '|' || round_name || '|' || 
                             COALESCE(aiq_quota, '') || '|' || COALESCE(aiq_category, '') || '|' || 
                             COALESCE(state_category, '') || '|' || COALESCE(state_quota, '') || '|' || 
                             cutoff_rank) as unique_count
                FROM cutoff_ranks_enhanced 
                WHERE counselling_type LIKE 'AIQ_%'
                GROUP BY counselling_type
            `);

      console.log('\n📋 AIQ Duplicate Analysis:');
      recentDuplicates.forEach(type => {
        const duplicates = type.total - type.unique_count;
        console.log(`  ${type.counselling_type}: ${type.total.toLocaleString()} total, ${type.unique_count.toLocaleString()} unique, ${duplicates.toLocaleString()} duplicates`);
      });

    } catch (error) {
      console.error('Error analyzing duplicates:', error.message);
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

  async runAnalysis() {
    try {
      await this.connect();
      await this.analyzeDuplicates();
    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
    } finally {
      await this.disconnect();
    }
  }
}

// Run the duplicate analysis
const analyzer = new DuplicateAnalyzer();
analyzer.runAnalysis();
