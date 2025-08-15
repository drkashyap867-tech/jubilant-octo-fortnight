const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class TransposedCutoffDataImporter {
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

  async importExcelFile(filePath) {
    try {
      console.log(`📊 Importing: ${path.basename(filePath)}`);

      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Read Excel file
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // Get the raw data with headers
      const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (rawData.length < 2) {
        throw new Error('Not enough data in sheet');
      }

      // Extract file info from filename
      const filename = path.basename(filePath);
      const match = filename.match(/AIQ_PG_(\d{4})_R(\d+)/);
      if (!match) {
        throw new Error(`Invalid filename format: ${filename}`);
      }

      const year = parseInt(match[1]);
      const round = parseInt(match[2]);
      const counsellingType = 'AIQ_PG';

      console.log(`🎯 Processing: ${counsellingType} ${year} Round ${round}`);

      // First row contains college names (column headers)
      const collegeHeaders = rawData[0];
      console.log(`🏫 Found ${collegeHeaders.length} colleges`);

      // Process each row (course) starting from index 1
      for (let rowIndex = 1; rowIndex < rawData.length; rowIndex++) {
        const row = rawData[rowIndex];
        if (!row || !row[0]) continue; // Skip empty rows

        const courseName = row[0]; // First column is course name
        if (!courseName || courseName === '') continue;

        console.log(`📚 Processing course: ${courseName}`);

        // Process each college column (starting from index 1)
        for (let colIndex = 1; colIndex < row.length; colIndex++) {
          const cutoffData = row[colIndex];
          const collegeHeader = collegeHeaders[colIndex];

          if (!cutoffData || !collegeHeader || cutoffData === '') continue;

          await this.processTransposedRecord(
            collegeHeader,
            courseName,
            cutoffData,
            counsellingType,
            year,
            round
          );
        }
      }

      console.log(`✅ Processed ${rawData.length - 1} courses from ${filename}`);

    } catch (error) {
      console.error(`❌ Error importing ${filePath}:`, error.message);
      this.errors.push(`${path.basename(filePath)}: ${error.message}`);
    }
  }

  async processTransposedRecord(collegeHeader, courseName, cutoffData, counsellingType, year, round) {
    try {
      // Parse college header (format: "College Name, City, State, Pincode")
      const collegeParts = collegeHeader.split(',').map(part => part.trim());
      const collegeName = collegeParts[0];
      const city = collegeParts[1] || 'Unknown City';
      const state = collegeParts[2] || 'Unknown State';

      // Parse cutoff data (could be rank, seats, or other info)
      let cutoffRank = 0;
      let seatsAvailable = 0;
      let fees = 0;

      // Try to extract numeric data from cutoffData
      if (typeof cutoffData === 'string') {
        // Look for rank patterns
        const rankMatch = cutoffData.match(/(\d+)/);
        if (rankMatch) {
          cutoffRank = parseInt(rankMatch[1]);
        }

        // Look for seat patterns
        const seatMatch = cutoffData.match(/seat[s]?\s*(\d+)/i);
        if (seatMatch) {
          seatsAvailable = parseInt(seatMatch[1]);
        }
      } else if (typeof cutoffData === 'number') {
        cutoffRank = cutoffData;
      }

      // Skip if no meaningful data
      if (!collegeName || collegeName === '') return;

      // Find or create college
      let collegeId = await this.findOrCreateCollege(collegeName, city, state);
      if (!collegeId) return;

      // Find or create course
      let courseId = await this.findOrCreateCourse(courseName);
      if (!courseId) return;

      // Insert cutoff record
      await this.insertCutoffRecord({
        college_id: collegeId,
        course_id: courseId,
        counselling_type: counsellingType,
        counselling_year: year,
        round_number: round,
        round_name: `Round ${round}`,
        aiq_quota: 'AIQ',
        aiq_category: 'UR', // Default category
        state_category: null,
        state_quota: null,
        cutoff_rank: cutoffRank || 0,
        seats_available: seatsAvailable || 1,
        fees_amount: fees
      });

      this.importedRecords++;

    } catch (error) {
      console.error('Error processing transposed record:', error.message);
    }
  }

  async findOrCreateCollege(collegeName, city, state) {
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
        [collegeName, city, state, 'Medical College']
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

  async importAllMissingData() {
    try {
      console.log('🚀 Starting Transposed Cutoff Data Import...');

      await this.connect();

      // List of Excel files to import
      const excelFiles = [
        './data/cleaned_cutoffs/AIQ_PG_2023_R1_CLEANED.xlsx',
        './data/cleaned_cutoffs/AIQ_PG_2023_R2_CLEANED.xlsx',
        './data/cleaned_cutoffs/AIQ_PG_2023_R3_CLEANED.xlsx',
        './data/cleaned_cutoffs/AIQ_PG_2024_R1_CLEANED.xlsx',
        './data/cleaned_cutoffs/AIQ_PG_2024_R2_CLEANED.xlsx'
      ];

      // Import each file
      for (const file of excelFiles) {
        if (fs.existsSync(file)) {
          await this.importExcelFile(file);
        } else {
          console.log(`⚠️  File not found: ${file}`);
        }
      }

      console.log('\n🎉 Import completed!');
      console.log(`📊 Total records imported: ${this.importedRecords}`);

      if (this.errors.length > 0) {
        console.log(`❌ Errors: ${this.errors.length}`);
        this.errors.forEach(error => console.log(`   - ${error}`));
      }

    } catch (error) {
      console.error('❌ Import failed:', error.message);
    } finally {
      await this.disconnect();
    }
  }
}

// Run the import
const importer = new TransposedCutoffDataImporter();
importer.importAllMissingData();
