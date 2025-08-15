const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class ComprehensiveCutoffDataImporter {
    constructor() {
        this.dbPath = path.join(__dirname, 'data', 'cutoff_ranks_enhanced.db');
        this.db = null;
        this.importedRecords = 0;
        this.errors = [];
        this.fileResults = {};
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
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            console.log(`📋 Found ${rawData.length} rows in ${sheetName}`);

            // Extract file info from filename
            const fileInfo = this.parseFilename(path.basename(filePath));
            if (!fileInfo) {
                console.log(`⚠️  Skipping file with unknown format: ${path.basename(filePath)}`);
                return;
            }

            console.log(`🎯 Processing: ${fileInfo.counsellingType} ${fileInfo.year} Round ${fileInfo.round}`);

            // Process the data based on file type
            if (fileInfo.counsellingType === 'AIQ_PG' || fileInfo.counsellingType === 'AIQ_UG') {
                await this.processAIQData(rawData, fileInfo);
            } else if (fileInfo.counsellingType === 'KEA') {
                await this.processKEAData(rawData, fileInfo);
            }

            console.log(`✅ Processed data from ${path.basename(filePath)}`);

        } catch (error) {
            console.error(`❌ Error importing ${filePath}:`, error.message);
            this.errors.push(`${path.basename(filePath)}: ${error.message}`);
        }
    }

    parseFilename(filename) {
        // AIQ_PG_2023_R1_CLEANED.xlsx
        const aiqMatch = filename.match(/(AIQ_(?:PG|UG))_(\d{4})_R(\d+)/);
        if (aiqMatch) {
            return {
                counsellingType: aiqMatch[1],
                year: parseInt(aiqMatch[2]),
                round: parseInt(aiqMatch[3])
            };
        }

        // AIQ_PG_2023_SPECIAL_STRAY_CLEANED.xlsx
        const specialMatch = filename.match(/(AIQ_(?:PG|UG))_(\d{4})_SPECIAL_STRAY/);
        if (specialMatch) {
            return {
                counsellingType: specialMatch[1],
                year: parseInt(specialMatch[2]),
                round: 'SPECIAL_STRAY'
            };
        }

        // AIQ_PG_2023_STRAY_CLEANED.xlsx
        const strayMatch = filename.match(/(AIQ_(?:PG|UG))_(\d{4})_STRAY/);
        if (strayMatch) {
            return {
                counsellingType: strayMatch[1],
                year: parseInt(strayMatch[2]),
                round: 'STRAY'
            };
        }

        // KEA_2023_MEDICAL_R1_CLEANED.xlsx
        const keaMatch = filename.match(/KEA_(\d{4})_(MEDICAL|DENTAL)_R(\d+)/);
        if (keaMatch) {
            return {
                counsellingType: 'KEA',
                year: parseInt(keaMatch[1]),
                round: parseInt(keaMatch[2]),
                stream: keaMatch[2]
            };
        }

        // KEA_2023_MEDICAL_EXTENDED_STRAY_CLEANED.xlsx
        const keaExtendedMatch = filename.match(/KEA_(\d{4})_(MEDICAL|DENTAL)_EXTENDED_STRAY/);
        if (keaExtendedMatch) {
            return {
                counsellingType: 'KEA',
                year: parseInt(keaExtendedMatch[1]),
                round: 'EXTENDED_STRAY',
                stream: keaExtendedMatch[2]
            };
        }

        return null;
    }

    async processAIQData(rawData, fileInfo) {
        try {
            if (rawData.length < 4) return;

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
                await this.processCollegeData(rawData, colIndex, collegeId, fileInfo);
            }

        } catch (error) {
            console.error('Error processing AIQ data:', error.message);
        }
    }

    async processKEAData(rawData, fileInfo) {
        try {
            // KEA data might have a different structure
            // For now, process it similar to AIQ data
            await this.processAIQData(rawData, fileInfo);
        } catch (error) {
            console.error('Error processing KEA data:', error.message);
        }
    }

    async processCollegeData(rawData, colIndex, collegeId, fileInfo) {
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
                    // Create a record
                    await this.createCutoffRecord(
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
            console.error('Error processing college data:', error.message);
        }
    }

    isCourseRow(value) {
        const coursePatterns = [
            /^M\.D\./i, /^M\.S\./i, /^MBBS/i, /^BDS/i, /^MDS/i, /^DNB/i, /^NBEMS/i, /^DIPLOMA/i
        ];
        return coursePatterns.some(pattern => pattern.test(value));
    }

    isCategoryRow(value) {
        const categoryPatterns = [
            /^OPEN$/i, /^OBC/i, /^SC$/i, /^ST$/i, /^EWS$/i, /^PWD$/i, /^BC$/i, /^MBC$/i
        ];
        return categoryPatterns.some(pattern => pattern.test(value));
    }

    isQuotaRow(value) {
        const quotaPatterns = [
            /QUOTA/i, /SEATS/i, /MANAGEMENT/i, /PAID/i, /DEEMED/i, /ALL INDIA/i, /STATE/i
        ];
        return quotaPatterns.some(pattern => pattern.test(value));
    }

    isRankRow(value) {
        return /^\d+$/.test(value);
    }

    async createCutoffRecord(collegeId, courseName, category, quota, rank, fileInfo) {
        try {
            // Find or create course
            let courseId = await this.findOrCreateCourse(courseName);
            if (!courseId) return;

            // Determine counselling type
            let counsellingType = fileInfo.counsellingType;
            if (fileInfo.counsellingType === 'AIQ_PG' || fileInfo.counsellingType === 'AIQ_UG') {
                counsellingType = fileInfo.counsellingType;
            }

            // Insert cutoff record
            await this.insertCutoffRecord({
                college_id: collegeId,
                course_id: courseId,
                counselling_type: counsellingType,
                counselling_year: fileInfo.year,
                round_number: typeof fileInfo.round === 'number' ? fileInfo.round : 999,
                round_name: typeof fileInfo.round === 'number' ? `Round ${fileInfo.round}` : fileInfo.round,
                aiq_quota: fileInfo.counsellingType.includes('AIQ') ? quota : null,
                aiq_category: fileInfo.counsellingType.includes('AIQ') ? category : null,
                state_category: fileInfo.counsellingType === 'KEA' ? category : null,
                state_quota: fileInfo.counsellingType === 'KEA' ? quota : null,
                cutoff_rank: rank,
                seats_available: 1,
                fees_amount: 0
            });

            this.importedRecords++;

        } catch (error) {
            console.error('Error creating cutoff record:', error.message);
        }
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
            console.log('🚀 Starting Comprehensive Cutoff Data Import...');
            
            await this.connect();
            
            // Get all Excel files
            const excelFiles = this.getAllExcelFiles();
            console.log(`📁 Found ${excelFiles.length} Excel files to process`);

            // Import each file
            for (const file of excelFiles) {
                if (fs.existsSync(file)) {
                    await this.importExcelFile(file);
                } else {
                    console.log(`⚠️  File not found: ${file}`);
                }
            }

            console.log('\n🎉 Comprehensive import completed!');
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

    getAllExcelFiles() {
        const cleanedCutoffsDir = './data/cleaned_cutoffs';
        const files = [];
        
        if (fs.existsSync(cleanedCutoffsDir)) {
            const items = fs.readdirSync(cleanedCutoffsDir);
            items.forEach(item => {
                if (item.endsWith('.xlsx') || item.endsWith('.xls')) {
                    files.push(path.join(cleanedCutoffsDir, item));
                }
            });
        }
        
        return files.sort();
    }
}

// Run the comprehensive import
const importer = new ComprehensiveCutoffDataImporter();
importer.importAllMissingData();
