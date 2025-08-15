const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class MissingCutoffDataImporter {
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
            const jsonData = XLSX.utils.sheet_to_json(sheet);

            console.log(`📋 Found ${jsonData.length} records in ${sheetName}`);

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

            // Process each record
            for (const record of jsonData) {
                await this.processRecord(record, counsellingType, year, round);
            }

            console.log(`✅ Imported ${jsonData.length} records from ${filename}`);

        } catch (error) {
            console.error(`❌ Error importing ${filePath}:`, error.message);
            this.errors.push(`${path.basename(filePath)}: ${error.message}`);
        }
    }

    async processRecord(record, counsellingType, year, round) {
        try {
            // Extract data from Excel record (adjust field names as needed)
            const collegeName = record['College Name'] || record['College'] || record['Institution'] || 'Unknown';
            const courseName = record['Course Name'] || record['Course'] || record['Specialization'] || 'Unknown';
            const category = record['Category'] || record['Reservation'] || 'UR';
            const quota = record['Quota'] || record['Seat Type'] || 'AIQ';
            const cutoffRank = parseInt(record['Cutoff Rank'] || record['Rank'] || record['Closing Rank'] || 0);
            const seatsAvailable = parseInt(record['Seats Available'] || record['Total Seats'] || record['Seats'] || 0);
            const fees = parseInt(record['Fees'] || record['Fee Amount'] || record['Tuition Fee'] || 0);

            if (!collegeName || !courseName || cutoffRank === 0) {
                return; // Skip invalid records
            }

            // Find or create college
            let collegeId = await this.findOrCreateCollege(collegeName);
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
                aiq_quota: quota,
                aiq_category: category,
                state_category: null,
                state_quota: null,
                cutoff_rank: cutoffRank,
                seats_available: seatsAvailable,
                fees_amount: fees
            });

            this.importedRecords++;

        } catch (error) {
            console.error('Error processing record:', error.message);
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
                [collegeName, 'Unknown City', 'Unknown State', 'Unknown']
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
            console.log('🚀 Starting Missing Cutoff Data Import...');
            
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
const importer = new MissingCutoffDataImporter();
importer.importAllMissingData();
