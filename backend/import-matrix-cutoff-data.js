const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class MatrixCutoffDataImporter {
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
            const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            console.log(`📋 Found ${rawData.length} rows in ${sheetName}`);

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

            // Process the matrix structure
            await this.processMatrixData(rawData, counsellingType, year, round);

            console.log(`✅ Processed matrix data from ${filename}`);

        } catch (error) {
            console.error(`❌ Error importing ${filePath}:`, error.message);
            this.errors.push(`${path.basename(filePath)}: ${error.message}`);
        }
    }

    async processMatrixData(rawData, counsellingType, year, round) {
        try {
            if (rawData.length < 4) {
                throw new Error('Not enough data rows');
            }

            // First row contains college names (column headers)
            const collegeHeaders = rawData[0];
            console.log(`🏫 Found ${collegeHeaders.length} colleges`);

            // Process each college column
            for (let colIndex = 0; colIndex < collegeHeaders.length; colIndex++) {
                const collegeHeader = collegeHeaders[colIndex];
                if (!collegeHeader || collegeHeader === '') continue;

                // Clean college name (remove address part)
                const collegeName = collegeHeader.split(',')[0].trim();
                if (collegeName === '') continue;

                console.log(`🏫 Processing college: ${collegeName}`);

                // Find or create college
                let collegeId = await this.findOrCreateCollege(collegeName);
                if (!collegeId) continue;

                // Process the data for this college
                await this.processCollegeData(rawData, colIndex, collegeId, counsellingType, year, round);
            }

        } catch (error) {
            console.error('Error processing matrix data:', error.message);
        }
    }

    async processCollegeData(rawData, colIndex, collegeId, counsellingType, year, round) {
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
                if (this.isCourseRow(cellValue)) {
                    currentCourse = cellValue;
                    currentCategory = null;
                    currentQuota = null;
                } else if (this.isCategoryRow(cellValue)) {
                    currentCategory = cellValue;
                    currentQuota = null;
                } else if (this.isQuotaRow(cellValue)) {
                    currentQuota = cellValue;
                } else if (this.isRankRow(cellValue) && currentCourse && currentCategory && currentQuota) {
                    // We have all the pieces, create a record
                    await this.createCutoffRecord(
                        collegeId,
                        currentCourse,
                        currentCategory,
                        currentQuota,
                        parseInt(cellValue),
                        counsellingType,
                        year,
                        round
                    );
                }
            }

        } catch (error) {
            console.error('Error processing college data:', error.message);
        }
    }

    isCourseRow(value) {
        // Check if this looks like a course name
        const coursePatterns = [
            /^M\.D\./i,
            /^M\.S\./i,
            /^MBBS/i,
            /^BDS/i,
            /^MDS/i,
            /^DNB/i,
            /^NBEMS/i,
            /^DIPLOMA/i
        ];
        return coursePatterns.some(pattern => pattern.test(value));
    }

    isCategoryRow(value) {
        // Check if this looks like a category
        const categoryPatterns = [
            /^OPEN$/i,
            /^OBC/i,
            /^SC$/i,
            /^ST$/i,
            /^EWS$/i,
            /^PWD$/i,
            /^BC$/i,
            /^MBC$/i
        ];
        return categoryPatterns.some(pattern => pattern.test(value));
    }

    isQuotaRow(value) {
        // Check if this looks like a quota
        const quotaPatterns = [
            /QUOTA/i,
            /SEATS/i,
            /MANAGEMENT/i,
            /PAID/i,
            /DEEMED/i,
            /ALL INDIA/i,
            /STATE/i
        ];
        return quotaPatterns.some(pattern => pattern.test(value));
    }

    isRankRow(value) {
        // Check if this looks like a rank (just a number)
        return /^\d+$/.test(value);
    }

    async createCutoffRecord(collegeId, courseName, category, quota, rank, counsellingType, year, round) {
        try {
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
                aiq_quota: quota,
                aiq_category: category,
                state_category: null,
                state_quota: null,
                cutoff_rank: rank,
                seats_available: 1, // Default to 1 seat
                fees_amount: 0 // Default fee
            });

            this.importedRecords++;

        } catch (error) {
            console.error('Error creating cutoff record:', error.message);
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
                [collegeName, 'Unknown City', 'Unknown State', 'Medical College']
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
            this.db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve({ lastID: this.lastID, changes: this.changes });
            });
        });
    }

    async importAllMissingData() {
        try {
            console.log('🚀 Starting Matrix Cutoff Data Import...');
            
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
const importer = new MatrixCutoffDataImporter();
importer.importAllMissingData();
