const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class CutoffRanksSetup {
  constructor() {
    this.dbPath = path.join(__dirname, 'data', 'cutoff_ranks.db');
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
      console.log('️  Initializing Cutoff Ranks Database...');
      this.db = new sqlite3.Database(this.dbPath);
      await this.runQuery('PRAGMA journal_mode = WAL');
      await this.runQuery('PRAGMA synchronous = NORMAL');
      await this.runQuery('PRAGMA cache_size = 10000');
      await this.runQuery('PRAGMA temp_store = MEMORY');
      console.log('✅ Cutoff Ranks Database connection established');
      await this.createTables();
      console.log('✅ Cutoff Ranks Database schema created successfully');
      return true;
    } catch (error) {
      console.error('❌ Cutoff Ranks Database initialization failed:', error);
      return false;
    }
  }

  async createTables() {
    const schema = `
      CREATE TABLE IF NOT EXISTS cutoff_ranks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        college_id INTEGER NOT NULL,
        course_id INTEGER NOT NULL,
        counselling_type TEXT NOT NULL,
        counselling_year INTEGER NOT NULL,
        round_number INTEGER NOT NULL,
        round_name TEXT NOT NULL,
        quota_type TEXT NOT NULL,
        category TEXT NOT NULL,
        cutoff_rank INTEGER NOT NULL,
        cutoff_percentile REAL,
        seats_available INTEGER NOT NULL,
        seats_filled INTEGER DEFAULT 0,
        fees_amount INTEGER,
        special_remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(college_id, course_id, counselling_type, counselling_year, round_number, quota_type, category)
      );
      CREATE TABLE IF NOT EXISTS counselling_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type_code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        quota_type TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS quota_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_code TEXT NOT NULL UNIQUE,
        category_name TEXT NOT NULL,
        description TEXT,
        reservation_percentage REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_cutoff_college_course ON cutoff_ranks(college_id, course_id);
      CREATE INDEX IF NOT EXISTS idx_cutoff_counselling_type ON cutoff_ranks(counselling_type);
      CREATE INDEX IF NOT EXISTS idx_cutoff_year_round ON cutoff_ranks(counselling_year, round_number);
      CREATE INDEX IF NOT EXISTS idx_cutoff_quota_category ON cutoff_ranks(quota_type, category);
      CREATE INDEX IF NOT EXISTS idx_cutoff_rank ON cutoff_ranks(cutoff_rank);
      CREATE INDEX IF NOT EXISTS idx_cutoff_percentile ON cutoff_ranks(cutoff_percentile);
      CREATE VIRTUAL TABLE IF NOT EXISTS cutoff_ranks_fts USING fts5(
        special_remarks, 
        content='cutoff_ranks', 
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
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  async runQueryAll(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async runQueryGet(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(query, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async insertCutoffRank(cutoffData) {
    const query = `
      INSERT OR REPLACE INTO cutoff_ranks (
        college_id, course_id, counselling_type, counselling_year, round_number, 
        round_name, quota_type, category, cutoff_rank, cutoff_percentile, 
        seats_available, seats_filled, fees_amount, special_remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      cutoffData.college_id, cutoffData.course_id, cutoffData.counselling_type,
      cutoffData.counselling_year, cutoffData.round_number, cutoffData.round_name,
      cutoffData.quota_type, cutoffData.category, cutoffData.cutoff_rank,
      cutoffData.cutoff_percentile, cutoffData.seats_available, cutoffData.seats_filled,
      cutoffData.fees_amount, cutoffData.special_remarks
    ];
    return this.runQuery(query, params);
  }

  async getCutoffRanks(collegeId, courseId, counsellingType = null, year = null) {
    let query = `
      SELECT * FROM cutoff_ranks 
      WHERE college_id = ? AND course_id = ?
    `;
    let params = [collegeId, courseId];
    
    if (counsellingType) {
      query += ' AND counselling_type = ?';
      params.push(counsellingType);
    }
    
    if (year) {
      query += ' AND counselling_year = ?';
      params.push(year);
    }
    
    query += ' ORDER BY counselling_year DESC, round_number ASC, quota_type, category';
    return this.runQueryAll(query, params);
  }

  async getCutoffRanksByQuota(collegeId, courseId, quotaType, category) {
    const query = `
      SELECT * FROM cutoff_ranks 
      WHERE college_id = ? AND course_id = ? AND quota_type = ? AND category = ?
      ORDER BY counselling_year DESC, round_number ASC
    `;
    return this.runQueryAll(query, [collegeId, courseId, quotaType, category]);
  }

  async searchCutoffRanks(searchTerm, filters = {}) {
    let query = `
      SELECT cr.*, ct.name as counselling_type_name, qc.category_name as quota_category_name
      FROM cutoff_ranks cr
      LEFT JOIN counselling_types ct ON cr.counselling_type = ct.type_code
      LEFT JOIN quota_categories qc ON cr.category = qc.category_code
      WHERE 1=1
    `;
    let params = [];
    
    if (searchTerm) {
      query += ` AND (
        cr.special_remarks LIKE ? OR 
        ct.name LIKE ? OR 
        qc.category_name LIKE ?
      )`;
      const searchPattern = `%${searchTerm}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }
    
    if (filters.counsellingType) {
      query += ' AND cr.counselling_type = ?';
      params.push(filters.counsellingType);
    }
    
    if (filters.year) {
      query += ' AND cr.counselling_year = ?';
      params.push(filters.year);
    }
    
    if (filters.quotaType) {
      query += ' AND cr.quota_type = ?';
      params.push(filters.quotaType);
    }
    
    if (filters.category) {
      query += ' AND cr.category = ?';
      params.push(filters.category);
    }
    
    query += ' ORDER BY cr.counselling_year DESC, cr.round_number ASC, cr.quota_type, cr.category';
    return this.runQueryAll(query, params);
  }

  async close() {
    if (this.db) {
      return new Promise((resolve) => {
        this.db.close((err) => {
          if (err) console.error('Error closing database:', err);
          resolve();
        });
      });
    }
  }
}

module.exports = CutoffRanksSetup;
