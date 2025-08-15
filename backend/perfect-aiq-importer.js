const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class PerfectAIImporter {
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

    async importAIQFile(filePath) {
        try {
            const filename = path.basename(filePath);
            console.log(`\n🎯 PERFECT AIQ IMPORT: ${filename}`);
            
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
            const fileInfo = this.parseAIIFilename(filename);
            if (!fileInfo) {
                console.log(`⚠️  Skipping file with unknown format: ${filename}`);
                return;
            }

            console.log(`🎯 Processing: AIQ ${fileInfo.level} ${fileInfo.year} ${fileInfo.round}`);

            // Process AIQ data with CORRECTED logic
            await this.processAIQDataCorrected(rawData, fileInfo);

            console.log(`✅ AIQ processing completed for ${filename}`);

        } catch (error) {
            console.error(`❌ Error importing ${filePath}:`, error.message);
            this.errors.push(`${path.basename(filePath)}: ${error.message}`);
        }
    }

    parseAIIFilename(filename) {
        // AIQ_PG_2023_R1_CLEANED.xlsx
        const aiqMatch = filename.match(/AIQ_(PG|UG)_(\d{4})_R(\d+)/);
        if (aiqMatch) {
            return {
                level: aiqMatch[1],
                year: parseInt(aiqMatch[2]),
                round: parseInt(aiqMatch[3]),
                roundName: `Round ${aiqMatch[3]}`
            };
        }

        // AIQ_PG_2023_SPECIAL_STRAY_CLEANED.xlsx
        const specialStrayMatch = filename.match(/AIQ_(PG|UG)_(\d{4})_SPECIAL_STRAY/);
        if (specialStrayMatch) {
            return {
                level: specialStrayMatch[1],
                year: parseInt(specialStrayMatch[2]),
                round: 'SPECIAL_STRAY',
                roundName: 'SPECIAL_STRAY'
            };
        }

        // AIQ_PG_2023_STRAY_CLEANED.xlsx
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

    async processAIQDataCorrected(rawData, fileInfo) {
        try {
            if (rawData.length < 2) return;

            const headers = rawData[0];
            const dataRows = rawData.slice(1);
            
            console.log(`  📋 Headers: ${headers.slice(0, 5).join(' | ')}`);
            console.log(`  📊 Data rows: ${dataRows.length}`);

            // CORRECTED: AIQ files have college names in first column, data in subsequent columns
            // Each column represents a different college
            const collegeColumns = this.extractCollegeColumns(headers);
            console.log(`  🏫 Found ${collegeColumns.length} college columns`);

            // Process each college column
            for (let colIndex = 0; colIndex < collegeColumns.length; colIndex++) {
                const collegeName = collegeColumns[colIndex];
                if (!collegeName) continue;

                console.log(`    🏫 Processing college: ${collegeName}`);
                
                // Process data for this college
                await this.processCollegeColumn(rawData, colIndex, collegeName, fileInfo);
            }

        } catch (error) {
            console.error('Error processing AIQ data:', error.message);
        }
    }

    extractCollegeColumns(headers) {
        const colleges = [];
        
        // First column is usually empty or contains metadata
        // College names start from second column onwards
        for (let i = 1; i < headers.length; i++) {
            const header = headers[i]?.toString().trim();
            if (header && header !== '') {
                // Extract college name from header (remove location info)
                const collegeName = this.extractCollegeName(header);
                if (collegeName) {
                    colleges.push(collegeName);
                }
            }
        }
        
        return colleges;
    }

    extractCollegeName(header) {
        // Headers look like: "A.C.S. MEDICAL COLLEGE AND HOSPITAL, TAMIL NADU, 600077"
        // Extract just the college name part
        const parts = header.split(',');
        if (parts.length > 0) {
            return parts[0].trim();
        }
        return header;
    }

    async processCollegeColumn(rawData, colIndex, collegeName, fileInfo) {
        try {
            // Find or create college
            const collegeId = await this.findOrCreateCollege(collegeName);
            if (!collegeId) return;

            let currentCourse = null;
            let currentQuota = null;
            let currentCategory = null;
            let currentRank = null;

            // Process each row starting from row 1 (skip header)
            for (let rowIndex = 1; rowIndex < rawData.length; rowIndex++) {
                const row = rawData[rowIndex];
                if (!row || row.length <= colIndex) continue;

                const cellValue = row[colIndex]?.toString().trim();
                if (!cellValue || cellValue === '') continue;

                // Determine what type of data this cell contains
                if (this.isAIQCourse(cellValue)) {
                    currentCourse = cellValue;
                    currentQuota = null;
                    currentCategory = null;
                    currentRank = null;
                } else if (this.isAIQQuota(cellValue)) {
                    currentQuota = cellValue;
                    currentCategory = null;
                    currentRank = null;
                } else if (this.isAIQCategory(cellValue)) {
                    currentCategory = cellValue;
                    currentRank = null;
                } else if (this.isAIQRank(cellValue)) {
                    currentRank = parseInt(cellValue);
                    
                    // If we have all required data, create a record
                    if (currentCourse && currentQuota && currentCategory && currentRank) {
                        await this.createAIQCutoffRecord(
                            collegeId,
                            currentCourse,
                            currentQuota,
                            currentCategory,
                            currentRank,
                            fileInfo
                        );
                        this.importedRecords++;
                    }
                }
            }

        } catch (error) {
            console.error(`Error processing college column ${colIndex}:`, error.message);
        }
    }

    isAIQCourse(value) {
        const coursePatterns = [
            /^M\.D\./i, /^M\.S\./i, /^MBBS/i, /^BDS/i, /^MDS/i, /^DNB/i, /^DIPLOMA/i,
            /^GENERAL MEDICINE/i, /^SURGERY/i, /^PEDIATRICS/i, /^OBSTETRICS/i, /^GYNECOLOGY/i,
            /^PSYCHIATRY/i, /^DERMATOLOGY/i, /^ORTHOPEDICS/i, /^RADIOLOGY/i, /^ANESTHESIA/i,
            /^BIOCHEMISTRY/i, /^PHYSIOLOGY/i, /^ANATOMY/i, /^MICROBIOLOGY/i, /^PHARMACOLOGY/i,
            /^FORENSIC MEDICINE/i, /^COMMUNITY MEDICINE/i, /^RESPIRATORY MEDICINE/i,
            /^TRANSFUSION MEDICINE/i, /^EMERGENCY MEDICINE/i, /^HOSPITAL ADMINISTRATION/i,
            /^CHILD HEALTH/i, /^PUBLIC HEALTH/i, /^CONSERVATIVE DENTISTRY/i, /^ORAL SURGERY/i,
            /^PROSTHODONTICS/i, /^PAEDODONTICS/i, /^PERIODONTICS/i, /^ORTHODONTICS/i
        ];
        return coursePatterns.some(pattern => pattern.test(value));
    }

    isAIQQuota(value) {
        const quotaPatterns = [
            /^ALL INDIA$/i, /^DELHI UNIVERSITY QUOTA$/i, /^IP UNIVERSITY QUOTA$/i,
            /^MANAGEMENT\/PAID SEATS QUOTA$/i, /^CENTRAL QUOTA$/i, /^STATE QUOTA$/i
        ];
        return quotaPatterns.some(pattern => pattern.test(value));
    }

    isAIQCategory(value) {
        const categoryPatterns = [
            /^OPEN$/i, /^OBC$/i, /^SC$/i, /^ST$/i, /^EWS$/i, /^PH$/i, /^PWD$/i,
            /^OBC PWD$/i, /^SC PWD$/i, /^ST PWD$/i, /^EWS PWD$/i
        ];
        return categoryPatterns.some(pattern => pattern.test(value));
    }

    isAIQRank(value) {
        return /^\d+$/.test(value);
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

    async createAIQCutoffRecord(collegeId, courseName, quota, category, rank, fileInfo) {
        try {
            // Find or create course
            const courseId = await this.findOrCreateCourse(courseName);
            if (!courseId) return;

            // Insert cutoff record
            await this.runQuery(`
                INSERT OR REPLACE INTO cutoff_ranks_enhanced 
                (college_id, course_id, counselling_type, counselling_year, round_number, 
                 round_name, aiq_quota, aiq_category, state_category, state_quota, 
                 cutoff_rank, seats_available, fees_amount) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                collegeId, courseId, `AIQ_${fileInfo.level}`, fileInfo.year, 
                typeof fileInfo.round === 'number' ? fileInfo.round : 999,
                fileInfo.roundName, quota, category, null, null,
                rank, 1, 0
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
            console.log('🚀 Starting PERFECT AIQ Data Import for 100% Coverage...');
            
            await this.connect();
            
            // Get all AIQ Excel files
            const aiqFiles = this.getAIIExcelFiles();
            console.log(`📁 Found ${aiqFiles.length} AIQ Excel files to process`);

            // Import each file
            for (const file of aiqFiles) {
                if (fs.existsSync(file)) {
                    await this.importAIQFile(file);
                } else {
                    console.log(`⚠️  File not found: ${file}`);
                }
            }

            console.log('\n🎉 PERFECT AIQ import completed!');
            console.log(`📊 Total AIQ records imported: ${this.importedRecords}`);
            
            if (this.errors.length > 0) {
                console.log(`❌ Errors: ${this.errors.length}`);
                this.errors.forEach(error => console.log(`   - ${error}`));
            }

        } catch (error) {
            console.error('❌ PERFECT AIQ import failed:', error.message);
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

// Run the perfect AIQ import
const importer = new PerfectAIImporter();
importer.importAllAIQData();
