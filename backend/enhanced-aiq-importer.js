const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class EnhancedAIImporter {
  constructor() {
    this.dbPath = path.join(__dirname, 'data', 'cutoff_ranks_enhanced.db');
    this.db = null;
    this.importedRecords = 0;
    this.debugMode = false;
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

  async importAIQFile(filePath) {
    try {
      const filename = path.basename(filePath);
      console.log(`\n🎯 ENHANCED AIQ IMPORT: ${filename}`);

      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      console.log(`📋 Found ${rawData.length} rows in ${sheetName}`);

      const fileInfo = this.parseAIIFilename(filename);
      if (!fileInfo) return;

      console.log(`🎯 Processing: AIQ ${fileInfo.level} ${fileInfo.year} ${fileInfo.round}`);

      // Enhanced processing with better pattern recognition
      await this.processAIQDataEnhanced(rawData, fileInfo);

    } catch (error) {
      console.error(`❌ Error importing ${filePath}:`, error.message);
    }
  }

  parseAIIFilename(filename) {
    const aiqMatch = filename.match(/AIQ_(PG|UG)_(\d{4})_R(\d+)/);
    if (aiqMatch) {
      return {
        level: aiqMatch[1],
        year: parseInt(aiqMatch[2]),
        round: parseInt(aiqMatch[3]),
        roundName: `Round ${aiqMatch[3]}`
      };
    }

    const specialStrayMatch = filename.match(/AIQ_(PG|UG)_(\d{4})_SPECIAL_STRAY/);
    if (specialStrayMatch) {
      return {
        level: specialStrayMatch[1],
        year: parseInt(specialStrayMatch[2]),
        round: 'SPECIAL_STRAY',
        roundName: 'SPECIAL_STRAY'
      };
    }

    const strayMatch = filename.match(/AIQ_(PG|UG)_(\d{4})_STRAY/);
    if (strayMatch) {
      return {
        level: strayMatch[1],
        year: parseInt(strayMatch[2]),
        round: 'STRAY',
        roundName: 'STRAY'
      };
    }

    return null;
  }

  async processAIQDataEnhanced(rawData, fileInfo) {
    try {
      if (rawData.length < 2) return;

      const headers = rawData[0];
      const dataRows = rawData.slice(1);

      console.log(`  📋 Headers: ${headers.slice(0, 3).join(' | ')}`);
      console.log(`  📊 Data rows: ${dataRows.length}`);

      // Process each college column
      for (let colIndex = 0; colIndex < headers.length; colIndex++) {
        const header = headers[colIndex]?.toString().trim();
        if (!header || header === '') continue;

        const collegeName = this.extractCollegeName(header);
        if (!collegeName) continue;

        console.log(`    🏫 Processing college: ${collegeName}`);

        // Enhanced processing with better data flow logic
        await this.processCollegeEnhanced(rawData, colIndex, collegeName, fileInfo);
      }

    } catch (error) {
      console.error('Error processing AIQ data:', error.message);
    }
  }

  extractCollegeName(header) {
    const parts = header.split(',');
    if (parts.length > 0) {
      return parts[0].trim();
    }
    return header;
  }

  async processCollegeEnhanced(rawData, colIndex, collegeName, fileInfo) {
    try {
      const collegeId = await this.findOrCreateCollege(collegeName);
      if (!collegeId) return;

      // Enhanced data flow tracking
      let currentCourse = null;
      let currentQuota = null;
      let currentCategory = null;
      let currentRank = null;
      let pendingRecords = [];

      // Process each row with enhanced logic
      for (let rowIndex = 1; rowIndex < rawData.length; rowIndex++) {
        const row = rawData[rowIndex];
        if (!row || row.length <= colIndex) continue;

        const cellValue = row[colIndex]?.toString().trim();
        if (!cellValue || cellValue === '') continue;

        // Enhanced pattern recognition
        const cellType = this.analyzeCellType(cellValue);

        switch (cellType) {
          case 'COURSE':
            // If we have pending records, process them first
            await this.processPendingRecords(pendingRecords, collegeId, fileInfo);
            pendingRecords = [];

            currentCourse = cellValue;
            currentQuota = null;
            currentCategory = null;
            currentRank = null;
            break;

          case 'QUOTA':
            currentQuota = cellValue;
            currentCategory = null;
            currentRank = null;
            break;

          case 'CATEGORY':
            currentCategory = cellValue;
            currentRank = null;
            break;

          case 'RANK':
            currentRank = parseInt(cellValue.replace(/\s+/g, ''));

            // Create record if we have all required data
            if (currentCourse && currentQuota && currentCategory && currentRank) {
              const record = {
                collegeId,
                courseName: currentCourse,
                quota: currentQuota,
                category: currentCategory,
                rank: currentRank
              };

              await this.createAIQCutoffRecord(record, fileInfo);
              this.importedRecords++;
            } else {
              // Store pending record for later processing
              pendingRecords.push({
                collegeId,
                courseName: currentCourse,
                quota: currentQuota,
                category: currentCategory,
                rank: currentRank
              });
            }
            break;

          case 'UNKNOWN':
            // Try to infer what this cell contains
            if (this.isLikelyCourse(cellValue)) {
              currentCourse = cellValue;
            } else if (this.isLikelyQuota(cellValue)) {
              currentQuota = cellValue;
            } else if (this.isLikelyCategory(cellValue)) {
              currentCategory = cellValue;
            }
            break;
        }
      }

      // Process any remaining pending records
      await this.processPendingRecords(pendingRecords, collegeId, fileInfo);

    } catch (error) {
      console.error(`Error processing college column ${colIndex}:`, error.message);
    }
  }

  analyzeCellType(cellValue) {
    if (this.isAIQCourse(cellValue)) return 'COURSE';
    if (this.isAIQQuota(cellValue)) return 'QUOTA';
    if (this.isAIQCategory(cellValue)) return 'CATEGORY';
    if (this.isAIQRank(cellValue)) return 'RANK';
    return 'UNKNOWN';
  }

  async processPendingRecords(pendingRecords, collegeId, fileInfo) {
    for (const record of pendingRecords) {
      if (record.courseName && record.quota && record.category && record.rank) {
        await this.createAIQCutoffRecord(record, fileInfo);
        this.importedRecords++;
      }
    }
  }

  // ENHANCED: More comprehensive course patterns
  isAIQCourse(value) {
    const coursePatterns = [
      // Standard medical courses
      /^M\.D\./i, /^M\.S\./i, /^MBBS/i, /^BDS/i, /^MDS/i, /^DNB/i, /^DIPLOMA/i,

      // Medical specializations
      /^GENERAL MEDICINE/i, /^SURGERY/i, /^PEDIATRICS/i, /^OBSTETRICS/i, /^GYNECOLOGY/i,
      /^PSYCHIATRY/i, /^DERMATOLOGY/i, /^ORTHOPEDICS/i, /^RADIOLOGY/i, /^ANESTHESIA/i,
      /^BIOCHEMISTRY/i, /^PHYSIOLOGY/i, /^ANATOMY/i, /^MICROBIOLOGY/i, /^PHARMACOLOGY/i,
      /^FORENSIC MEDICINE/i, /^COMMUNITY MEDICINE/i, /^RESPIRATORY MEDICINE/i,
      /^TRANSFUSION MEDICINE/i, /^EMERGENCY MEDICINE/i, /^HOSPITAL ADMINISTRATION/i,
      /^CHILD HEALTH/i, /^PUBLIC HEALTH/i, /^PREVENTIVE MEDICINE/i, /^PATHOLOGY/i,
      /^LABORATORY MEDICINE/i, /^CLINICAL PHARMACOLOGY/i, /^IMMUNOLOGY/i,

      // Dental specializations
      /^CONSERVATIVE DENTISTRY/i, /^ORAL SURGERY/i, /^PROSTHODONTICS/i, /^PAEDODONTICS/i,
      /^PERIODONTICS/i, /^ORTHODONTICS/i, /^ORAL MEDICINE/i, /^ORAL PATHOLOGY/i,
      /^PUBLIC HEALTH DENTISTRY/i, /^COMMUNITY DENTISTRY/i,

      // Additional patterns
      /^MEDICAL/i, /^DENTAL/i, /^CLINICAL/i, /^SPECIALIZATION/i
    ];
    return coursePatterns.some(pattern => pattern.test(value));
  }

  // ENHANCED: More comprehensive quota patterns
  isAIQQuota(value) {
    const quotaPatterns = [
      /^ALL INDIA$/i, /^ALL INDIA QUOTA$/i, /^CENTRAL QUOTA$/i, /^STATE QUOTA$/i,
      /^MANAGEMENT\/PAID SEATS QUOTA$/i, /^MANAGEMENT\/ PAID SEATS QUOTA$/i,
      /^MANAGEMENT QUOTA$/i, /^PAID SEATS QUOTA$/i, /^NRI QUOTA$/i,
      /^DELHI UNIVERSITY QUOTA$/i, /^IP UNIVERSITY QUOTA$/i, /^CENTRAL INSTITUTE QUOTA$/i,
      /^GOVERNMENT QUOTA$/i, /^PRIVATE QUOTA$/i, /^OPEN QUOTA$/i
    ];
    return quotaPatterns.some(pattern => pattern.test(value));
  }

  // ENHANCED: More comprehensive category patterns
  isAIQCategory(value) {
    const categoryPatterns = [
      /^OPEN$/i, /^OBC$/i, /^SC$/i, /^ST$/i, /^EWS$/i, /^PH$/i, /^PWD$/i,
      /^OBC PWD$/i, /^SC PWD$/i, /^ST PWD$/i, /^EWS PWD$/i, /^OPEN PWD$/i,
      /^GENERAL$/i, /^UR$/i, /^RESERVED$/i, /^UNRESERVED$/i, /^CATEGORY 1$/i,
      /^CATEGORY 2$/i, /^CATEGORY 3$/i, /^CATEGORY 4$/i, /^CATEGORY 5$/i
    ];
    return categoryPatterns.some(pattern => pattern.test(value));
  }

  isAIQRank(value) {
    const cleanValue = value.replace(/\s+/g, '');
    return /^\d+$/.test(cleanValue);
  }

  // ENHANCED: Likely pattern matching for unknown cells
  isLikelyCourse(value) {
    return value.includes('MEDICINE') || value.includes('SURGERY') ||
      value.includes('DENTAL') || value.includes('CLINICAL') ||
      value.includes('SPECIALIZATION') || value.includes('DIPLOMA');
  }

  isLikelyQuota(value) {
    return value.includes('QUOTA') || value.includes('SEATS') ||
      value.includes('MANAGEMENT') || value.includes('PAID');
  }

  isLikelyCategory(value) {
    return value.includes('OPEN') || value.includes('OBC') ||
      value.includes('SC') || value.includes('ST') ||
      value.includes('EWS') || value.includes('PH') ||
      value.includes('PWD') || value.includes('GENERAL');
  }

  async findOrCreateCollege(collegeName) {
    try {
      const existing = await this.queryOne(
        'SELECT id FROM colleges WHERE name = ?',
        [collegeName]
      );

      if (existing) return existing.id;

      const result = await this.runQuery(
        'INSERT INTO colleges (name, location, state, type) VALUES (?, ?, ?, ?)',
        [collegeName, 'India', 'India', 'Medical College']
      );

      return result.lastID;

    } catch (error) {
      console.error('Error with college:', collegeName, error.message);
      return null;
    }
  }

  async findOrCreateCourse(courseName) {
    try {
      const existing = await this.queryOne(
        'SELECT id FROM courses WHERE name = ?',
        [courseName]
      );

      if (existing) return existing.id;

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

  async createAIQCutoffRecord(record, fileInfo) {
    try {
      const courseId = await this.findOrCreateCourse(record.courseName);
      if (!courseId) return;

      const cleanRank = parseInt(record.rank.toString().replace(/\s+/g, ''));

      await this.runQuery(`
                INSERT OR REPLACE INTO cutoff_ranks_enhanced 
                (college_id, course_id, counselling_type, counselling_year, round_number, 
                 round_name, aiq_quota, aiq_category, state_category, state_quota, 
                 cutoff_rank, seats_available, fees_amount) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
        record.collegeId, courseId, `AIQ_${fileInfo.level}`, fileInfo.year,
        typeof fileInfo.round === 'number' ? fileInfo.round : 999,
        fileInfo.roundName, record.quota, record.category, null, null,
        cleanRank, 1, 0
      ]);

    } catch (error) {
      console.error('Error creating AIQ cutoff record:', error.message);
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

  async importAllAIQData() {
    try {
      console.log('🚀 Starting ENHANCED AIQ Data Import for Maximum Coverage...');

      await this.connect();

      const aiqFiles = this.getAIIExcelFiles();
      console.log(`📁 Found ${aiqFiles.length} AIQ Excel files to process`);

      for (const file of aiqFiles) {
        if (fs.existsSync(file)) {
          await this.importAIQFile(file);
        }
      }

      console.log('\n🎉 ENHANCED AIQ import completed!');
      console.log(`📊 Total AIQ records imported: ${this.importedRecords}`);

    } catch (error) {
      console.error('❌ ENHANCED AIQ import failed:', error.message);
    } finally {
      await this.disconnect();
    }
  }

  getAIIExcelFiles() {
    const cleanedCutoffsDir = './data/cleaned_cutoffs';
    const files = [];

    if (fs.existsSync(cleanedCutoffsDir)) {
      const items = fs.readdirSync(cleanedCutoffsDir);
      items.forEach(item => {
        if (item.startsWith('AIQ_') && (item.endsWith('.xlsx') || item.endsWith('.xls'))) {
          files.push(path.join(cleanedCutoffsDir, item));
        }
      });
    }

    return files.sort();
  }
}

const importer = new EnhancedAIImporter();
importer.importAllAIQData();
