const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class KEADataImporter {
  constructor() {
    this.dbPath = path.join(__dirname, 'data', 'cutoff_ranks_enhanced.db');
    this.db = null;
    this.importedRecords = 0;
    this.errors = [];
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

  async importKEAFile(filePath) {
    try {
      console.log(`📊 Importing KEA: ${path.basename(filePath)}`);

      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Read Excel file
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      console.log(`📋 Found ${rawData.length} rows in ${sheetName}`);

      // Extract file info from filename
      const fileInfo = this.parseKEAFilename(path.basename(filePath));
      if (!fileInfo) {
        console.log(`⚠️  Skipping file with unknown format: ${path.basename(filePath)}`);
        return;
      }

      console.log(`🎯 Processing: KEA ${fileInfo.year} ${fileInfo.stream} Round ${fileInfo.round}`);

      // Process KEA data structure
      await this.processKEAData(rawData, fileInfo);

      console.log(`✅ Processed KEA data from ${path.basename(filePath)}`);

    } catch (error) {
      console.error(`❌ Error importing ${filePath}:`, error.message);
      this.errors.push(`${path.basename(filePath)}: ${error.message}`);
    }
  }

  parseKEAFilename(filename) {
    // KEA_2024_MEDICAL_R1_CLEANED.xlsx
    const keaMatch = filename.match(/KEA_(\d{4})_(MEDICAL|DENTAL)_R(\d+)/);
    if (keaMatch) {
      return {
        year: parseInt(keaMatch[1]),
        stream: keaMatch[2],
        round: parseInt(keaMatch[3])
      };
    }

    // KEA_2023_MEDICAL_EXTENDED_STRAY_CLEANED.xlsx
    const extendedMatch = filename.match(/KEA_(\d{4})_(MEDICAL|DENTAL)_EXTENDED_STRAY/);
    if (extendedMatch) {
      return {
        year: parseInt(extendedMatch[1]),
        stream: extendedMatch[2],
        round: 'EXTENDED_STRAY'
      };
    }

    // KEA_2023_MEDICAL_STRAY_CLEANED.xlsx
    const strayMatch = filename.match(/KEA_(\d{4})_(MEDICAL|DENTAL)_STRAY/);
    if (strayMatch) {
      return {
        year: parseInt(strayMatch[1]),
        stream: strayMatch[2],
        round: 'STRAY'
      };
    }

    // KEA_2023_DENTAL_MOPUP_CLEANED.xlsx
    const mopupMatch = filename.match(/KEA_(\d{4})_(MEDICAL|DENTAL)_MOPUP/);
    if (mopupMatch) {
      return {
        year: parseInt(mopupMatch[1]),
        stream: mopupMatch[2],
        round: 'MOPUP'
      };
    }

    return null;
  }

  async processKEAData(rawData, fileInfo) {
    try {
      if (rawData.length < 3) return;

      // First row contains college names (column headers)
      const collegeHeaders = rawData[0];
      console.log(`🏫 Found ${collegeHeaders.length} colleges`);

      // Process each college column
      for (let colIndex = 0; colIndex < collegeHeaders.length; colIndex++) {
        const collegeHeader = collegeHeaders[colIndex];
        if (!collegeHeader || collegeHeader === '') continue;

        // Clean college name
        const collegeName = collegeHeader.split(',')[0].trim();
        if (collegeName === '') continue;

        // Find or create college
        let collegeId = await this.findOrCreateCollege(collegeName);
        if (!collegeId) continue;

        // Process the data for this college
        await this.processKEACollegeData(rawData, colIndex, collegeId, fileInfo);
      }

    } catch (error) {
      console.error('Error processing KEA data:', error.message);
    }
  }

  async processKEACollegeData(rawData, colIndex, collegeId, fileInfo) {
    try {
      let currentCourse = null;
      let currentCategory = null;
      let currentQuota = null;

      // Start from row 1 (skip header row)
      for (let rowIndex = 1; rowIndex < rawData.length; rowIndex++) {
        const row = rawData[rowIndex];
        if (!row || !row[colIndex]) continue;

        const cellValue = row[colIndex].toString().trim();
        if (cellValue === '') continue;

        // Determine what type of data this row contains
        if (this.isKEACourseRow(cellValue)) {
          currentCourse = cellValue;
          currentCategory = null;
          currentQuota = null;
        } else if (this.isKEACategoryRow(cellValue)) {
          currentCategory = cellValue;
          currentQuota = null;
        } else if (this.isKEAQuotaRow(cellValue)) {
          currentQuota = cellValue;
        } else if (this.isKEARankRow(cellValue) && currentCourse && currentCategory && currentQuota) {
          // Create a record
          await this.createKEACutoffRecord(
            collegeId,
            currentCourse,
            currentCategory,
            currentQuota,
            parseInt(cellValue),
            fileInfo
          );
        }
      }

    } catch (error) {
      console.error('Error processing KEA college data:', error.message);
    }
  }

  isKEACourseRow(value) {
    // Check if this looks like a course name
    const coursePatterns = [
      /^M\.D\./i, /^M\.S\./i, /^MBBS/i, /^BDS/i, /^MDS/i, /^DNB/i, /^NBEMS/i, /^DIPLOMA/i
    ];
    return coursePatterns.some(pattern => pattern.test(value));
  }

  isKEACategoryRow(value) {
    // Check if this looks like a KEA category
    const categoryPatterns = [
      /^GMPH$/i, /^GMP$/i, /^SC$/i, /^ST$/i, /^OBC$/i, /^CAT1$/i, /^CAT2$/i, /^CAT3$/i, /^CAT4$/i
    ];
    return categoryPatterns.some(pattern => pattern.test(value));
  }

  isKEAQuotaRow(value) {
    // Check if this looks like a KEA quota
    const quotaPatterns = [
      /QUOTA/i, /SEATS/i, /MANAGEMENT/i, /PAID/i, /DEEMED/i, /STATE/i, /KEA/i
    ];
    return quotaPatterns.some(pattern => pattern.test(value));
  }

  isKEARankRow(value) {
    // Check if this looks like a rank (just a number)
    return /^\d+$/.test(value);
  }

  async createKEACutoffRecord(collegeId, courseName, category, quota, rank, fileInfo) {
    try {
      // Find or create course
      let courseId = await this.findOrCreateCourse(courseName);
      if (!courseId) return;

      // Insert cutoff record
      await this.insertCutoffRecord({
        college_id: collegeId,
        course_id: courseId,
        counselling_type: 'KEA',
        counselling_year: fileInfo.year,
        round_number: typeof fileInfo.round === 'number' ? fileInfo.round : 999,
        round_name: typeof fileInfo.round === 'number' ? `Round ${fileInfo.round}` : fileInfo.round,
        aiq_quota: null,
        aiq_category: null,
        state_category: category,
        state_quota: quota || 'KEA',
        cutoff_rank: rank,
        seats_available: 1,
        fees_amount: 0
      });

      this.importedRecords++;

    } catch (error) {
      console.error('Error creating KEA cutoff record:', error.message);
    }
  }

  async findOrCreateCollege(collegeName) {
    try {
      // Try to find existing college
      const existing = await this.queryOne(
        'SELECT id FROM colleges WHERE name = ?',
        [collegeName]
      );

      if (existing) {
        return existing.id;
      }

      // Create new college
      const result = await this.runQuery(
        'INSERT INTO colleges (name, location, state, type) VALUES (?, ?, ?, ?)',
        [collegeName, 'Karnataka', 'Karnataka', 'Medical College']
      );

      return result.lastID;

    } catch (error) {
      console.error('Error with college:', collegeName, error.message);
      return null;
    }
  }

  async findOrCreateCourse(courseName) {
    try {
      // Try to find existing course
      const existing = await this.queryOne(
        'SELECT id FROM courses WHERE name = ?',
        [courseName]
      );

      if (existing) {
        return existing.id;
      }

      // Create new course
      const result = await this.runQuery(
        'INSERT INTO courses (name, type, duration) VALUES (?, ?, ?)',
        [courseName, 'medical', 3]
      );

      return result.lastID;

    } catch (error) {
      console.error('Error with course:', courseName, error.message);
      return null;
    }
  }

  async insertCutoffRecord(record) {
    try {
      await this.runQuery(`
                INSERT OR REPLACE INTO cutoff_ranks_enhanced 
                (college_id, course_id, counselling_type, counselling_year, round_number, 
                 round_name, aiq_quota, aiq_category, state_category, state_quota,
                 cutoff_rank, seats_available, fees_amount)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
        record.college_id, record.course_id, record.counselling_type,
        record.counselling_year, record.round_number, record.round_name,
        record.aiq_quota, record.aiq_category, record.state_category, record.state_quota,
        record.cutoff_rank, record.seats_available, record.fees_amount
      ]);

    } catch (error) {
      console.error('Error inserting cutoff record:', error.message);
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

  async runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  async importAllKEAData() {
    try {
      console.log('🚀 Starting KEA Data Import...');

      await this.connect();

      // Get all KEA Excel files
      const keaFiles = this.getKEAExcelFiles();
      console.log(`📁 Found ${keaFiles.length} KEA Excel files to process`);

      // Import each file
      for (const file of keaFiles) {
        if (fs.existsSync(file)) {
          await this.importKEAFile(file);
        } else {
          console.log(`⚠️  File not found: ${file}`);
        }
      }

      console.log('\n🎉 KEA import completed!');
      console.log(`📊 Total KEA records imported: ${this.importedRecords}`);

      if (this.errors.length > 0) {
        console.log(`❌ Errors: ${this.errors.length}`);
        this.errors.forEach(error => console.log(`   - ${error}`));
      }

    } catch (error) {
      console.error('❌ KEA import failed:', error.message);
    } finally {
      await this.disconnect();
    }
  }

  getKEAExcelFiles() {
    const cleanedCutoffsDir = './data/cleaned_cutoffs';
    const files = [];

    if (fs.existsSync(cleanedCutoffsDir)) {
      const items = fs.readdirSync(cleanedCutoffsDir);
      items.forEach(item => {
        if (item.startsWith('KEA_') && (item.endsWith('.xlsx') || item.endsWith('.xls'))) {
          files.push(path.join(cleanedCutoffsDir, item));
        }
      });
    }

    return files.sort();
  }
}

// Run the KEA import
const importer = new KEADataImporter();
importer.importAllKEAData();
