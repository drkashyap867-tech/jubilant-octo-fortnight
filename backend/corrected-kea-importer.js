const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class CorrectedKEAImporter {
    constructor() {
        this.dbPath = path.join(__dirname, 'data', 'cutoff_ranks_enhanced.db');
        this.db = null;
        this.importedRecords = 0;
        this.errors = [];
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

    async importKEAFile(filePath) {
        try {
            console.log(`\n🔧 CORRECTED KEA IMPORT: ${path.basename(filePath)}`);

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

            // Process KEA data with CORRECTED algorithm
            await this.correctedKEAParser(rawData, fileInfo);

            console.log(`✅ CORRECTED KEA processing completed for ${path.basename(filePath)}`);

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

    async correctedKEAParser(rawData, fileInfo) {
        try {
            if (rawData.length < 3) return;

            // First row contains college names (but KEA files typically have 1 college)
            const collegeHeaders = rawData[0];
            console.log(`🏫 Found ${collegeHeaders.length} colleges`);

            // For KEA, we process the data vertically (not by college columns)
            await this.processVerticalKEAData(rawData, fileInfo);

        } catch (error) {
            console.error('Error in corrected KEA parser:', error.message);
        }
    }

    async processVerticalKEAData(rawData, fileInfo) {
        try {
            let currentCollege = null;
            let currentCourse = null;
            let currentCategory = null;
            let currentQuota = null;
            let rankBuffer = [];

            // Start from row 1 (skip header row)
            for (let rowIndex = 1; rowIndex < rawData.length; rowIndex++) {
                const row = rawData[rowIndex];
                if (!row || !row[0]) continue;

                const cellValue = row[0].toString().trim();
                if (cellValue === '' || cellValue === 'Grand Total') continue;

                if (this.debugMode) {
                    console.log(`  Row ${rowIndex}: "${cellValue}"`);
                }

                // Determine what type of data this row contains
                if (this.isKEACollegeRow(cellValue)) {
                    // If we have accumulated ranks, process them first
                    if (rankBuffer.length > 0 && currentCourse && currentCategory && currentQuota) {
                        await this.processRankBuffer(currentCollege, currentCourse, currentCategory, currentQuota, rankBuffer, fileInfo);
                        rankBuffer = [];
                    }

                    currentCollege = cellValue;
                    currentCourse = null;
                    currentCategory = null;
                    currentQuota = null;
                    console.log(`    🏫 College: ${currentCollege}`);
                } else if (this.isKEACourseRow(cellValue)) {
                    // If we have accumulated ranks, process them first
                    if (rankBuffer.length > 0 && currentCourse && currentCategory && currentQuota) {
                        await this.processRankBuffer(currentCollege, currentCourse, currentCategory, currentQuota, rankBuffer, fileInfo);
                        rankBuffer = [];
                    }

                    currentCourse = cellValue;
                    currentCategory = null;
                    currentQuota = null;
                    console.log(`    📚 Course: ${currentCourse}`);
                } else if (this.isKEACategoryRow(cellValue)) {
                    // If we have accumulated ranks, process them first
                    if (rankBuffer.length > 0 && currentCourse && currentCategory && currentQuota) {
                        await this.processRankBuffer(currentCollege, currentCourse, currentCategory, currentQuota, rankBuffer, fileInfo);
                        rankBuffer = [];
                    }

                    currentCategory = cellValue;
                    currentQuota = null;
                    console.log(`    🏷️  Category: ${currentCategory}`);
                } else if (this.isKEAQuotaRow(cellValue)) {
                    // If we have accumulated ranks, process them first
                    if (rankBuffer.length > 0 && currentCourse && currentCategory && currentQuota) {
                        await this.processRankBuffer(currentCollege, currentCourse, currentCategory, currentQuota, rankBuffer, fileInfo);
                        rankBuffer = [];
                    }

                    currentQuota = cellValue;
                    console.log(`    🎯 Quota: ${currentQuota}`);
                } else if (this.isKEARankRow(cellValue)) {
                    // Add to rank buffer
                    rankBuffer.push(parseInt(cellValue));
                    if (this.debugMode) {
                        console.log(`    📊 Rank added to buffer: ${cellValue} (Buffer size: ${rankBuffer.length})`);
                    }
                } else if (this.isKEAComplexRankRow(cellValue)) {
                    // Handle complex rank formats (e.g., "44483 0" -> "444830")
                    const cleanedRank = this.cleanComplexRank(cellValue);
                    if (cleanedRank) {
                        rankBuffer.push(cleanedRank);
                        if (this.debugMode) {
                            console.log(`    🔧 Complex rank cleaned: "${cellValue}" -> ${cleanedRank}`);
                        }
                    }
                }
            }

            // Process any remaining ranks in buffer
            if (rankBuffer.length > 0 && currentCourse && currentCategory && currentQuota) {
                await this.processRankBuffer(currentCollege, currentCourse, currentCategory, currentQuota, rankBuffer, fileInfo);
            }

        } catch (error) {
            console.error('Error in vertical KEA data processor:', error.message);
        }
    }

    isKEACollegeRow(value) {
        // Check if this looks like a college name (contains location info)
        return value.includes(',') && (
            value.includes('INSTITUTE') ||
            value.includes('COLLEGE') ||
            value.includes('HOSPITAL') ||
            value.includes('MEDICAL') ||
            value.includes('DENTAL')
        );
    }

    isKEACourseRow(value) {
        // Check if this looks like a course name
        const coursePatterns = [
            /^M\.D\./i, /^M\.S\./i, /^MBBS/i, /^BDS/i, /^MDS/i, /^DNB/i, /^NBEMS/i, /^DIPLOMA/i,
            /^GENERAL MEDICINE/i, /^SURGERY/i, /^PEDIATRICS/i, /^OBSTETRICS/i, /^GYNECOLOGY/i,
            /^PSYCHIATRY/i, /^DERMATOLOGY/i, /^ORTHOPEDICS/i, /^RADIOLOGY/i, /^ANESTHESIA/i,
            /^BIOCHEMISTRY/i, /^PHYSIOLOGY/i, /^ANATOMY/i, /^MICROBIOLOGY/i, /^PHARMACOLOGY/i,
            /^FORENSIC MEDICINE/i, /^COMMUNITY MEDICINE/i, /^RESPIRATORY MEDICINE/i,
            /^TRANSFUSION MEDICINE/i, /^EMERGENCY MEDICINE/i, /^HOSPITAL ADMINISTRATION/i,
            /^CHILD HEALTH/i, /^PUBLIC HEALTH/i
        ];
        return coursePatterns.some(pattern => pattern.test(value));
    }

    isKEACategoryRow(value) {
        // Check if this looks like a KEA category
        const categoryPatterns = [
            /^GMPH$/i, /^GMP$/i, /^SC$/i, /^ST$/i, /^OBC$/i, /^CAT1$/i, /^CAT2$/i, /^CAT3$/i, /^CAT4$/i,
            /^GENERAL$/i, /^OPEN$/i, /^UR$/i, /^EWS$/i, /^PH$/i, /^PWD$/i, /^GM$/i, /^2AG$/i, /^2AH$/i,
            /^OPN$/i, /^MNG$/i, /^NRI$/i, /^ME$/i, /^SCG$/i, /^MU$/i
        ];
        return categoryPatterns.some(pattern => pattern.test(value));
    }

    isKEAQuotaRow(value) {
        // Check if this looks like a KEA quota
        const quotaPatterns = [
            /QUOTA/i, /SEATS/i, /MANAGEMENT/i, /PAID/i, /DEEMED/i, /STATE/i, /KEA/i,
            /GOVERNMENT/i, /PRIVATE/i, /CENTRAL/i, /ALL INDIA/i
        ];
        return quotaPatterns.some(pattern => pattern.test(value));
    }

    isKEARankRow(value) {
        // Check if this looks like a simple rank (just a number)
        return /^\d+$/.test(value);
    }

    isKEAComplexRankRow(value) {
        // Check if this looks like a complex rank (e.g., "44483 0", "10248 0")
        return /^\d+\s+\d+$/.test(value);
    }

    cleanComplexRank(value) {
        try {
            // Pattern: "44483 0" -> "444830"
            const match = value.match(/^(\d+)\s+(\d+)$/);
            if (match) {
                return parseInt(match[1] + match[2]);
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    async processRankBuffer(collegeName, courseName, category, quota, rankBuffer, fileInfo) {
        try {
            console.log(`    💾 Processing ${rankBuffer.length} ranks for ${courseName} - ${category} - ${quota}`);

            // Find or create college
            let collegeId = await this.findOrCreateCollege(collegeName);
            if (!collegeId) return;

            // Find or create course
            let courseId = await this.findOrCreateCourse(courseName);
            if (!courseId) return;

            // Create records for each rank
            for (const rank of rankBuffer) {
                await this.createKEACutoffRecord(
                    collegeId,
                    courseId,
                    category,
                    quota,
                    rank,
                    fileInfo
                );
            }

            console.log(`    ✅ Created ${rankBuffer.length} cutoff records`);

        } catch (error) {
            console.error('Error processing rank buffer:', error.message);
        }
    }

    async createKEACutoffRecord(collegeId, courseId, category, quota, rank, fileInfo) {
        try {
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
            console.log('🚀 Starting CORRECTED KEA Data Import...');

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

            console.log('\n🎉 CORRECTED KEA import completed!');
            console.log(`📊 Total KEA records imported: ${this.importedRecords}`);

            if (this.errors.length > 0) {
                console.log(`❌ Errors: ${this.errors.length}`);
                this.errors.forEach(error => console.log(`   - ${error}`));
            }

        } catch (error) {
            console.error('❌ CORRECTED KEA import failed:', error.message);
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

// Run the CORRECTED KEA import
const importer = new CorrectedKEAImporter();
importer.importAllKEAData();
