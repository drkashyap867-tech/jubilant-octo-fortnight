const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class UniversalAIImporter {
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
            console.log(`\n🎯 UNIVERSAL AIQ IMPORT: ${filename}`);
            
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

            // Process AIQ data
            await this.processAIQData(rawData, fileInfo);

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

    async processAIQData(rawData, fileInfo) {
        try {
            if (rawData.length < 2) return;

            const headers = rawData[0];
            const dataRows = rawData.slice(1);
            
            console.log(`  📋 Headers: ${headers.slice(0, 5).join(' | ')}`);
            console.log(`  📊 Data rows: ${dataRows.length}`);

            // Find column indices
            const collegeColIndex = this.findColumnIndex(headers, ['COLLEGE', 'INSTITUTE', 'HOSPITAL']);
            const courseColIndex = this.findColumnIndex(headers, ['COURSE', 'SPECIALIZATION']);
            const quotaColIndex = this.findColumnIndex(headers, ['QUOTA', 'CATEGORY']);
            const categoryColIndex = this.findColumnIndex(headers, ['CATEGORY', 'RESERVATION']);
            const rankColIndex = this.findColumnIndex(headers, ['RANK', 'CUTOFF', 'ALL INDIA']);

            console.log(`  🏫 College column: ${collegeColIndex} (${headers[collegeColIndex]})`);
            console.log(`  📚 Course column: ${courseColIndex} (${headers[courseColIndex]})`);
            console.log(`  🏷️  Quota column: ${quotaColIndex} (${headers[quotaColIndex]})`);
            console.log(`  🏷️  Category column: ${categoryColIndex} (${headers[categoryColIndex]})`);
            console.log(`  📊 Rank column: ${rankColIndex} (${headers[rankColIndex]})`);

            // Process each data row
            for (let i = 0; i < dataRows.length; i++) {
                const row = dataRows[i];
                if (!row || row.length === 0) continue;

                try {
                    const collegeName = row[collegeColIndex]?.toString().trim();
                    const courseName = row[courseColIndex]?.toString().trim();
                    const quota = row[quotaColIndex]?.toString().trim();
                    const category = row[categoryColIndex]?.toString().trim();
                    const rank = row[rankColIndex]?.toString().trim();

                    // Skip if critical fields are missing
                    if (!collegeName || !courseName || !quota || !category || !rank) {
                        continue;
                    }

                    // Skip if rank is not a number
                    const rankNumber = parseInt(rank);
                    if (isNaN(rankNumber)) continue;

                    // Find or create college and course
                    const collegeId = await this.findOrCreateCollege(collegeName);
                    const courseId = await this.findOrCreateCourse(courseName);

                    if (!collegeId || !courseId) continue;

                    // Create AIQ cutoff record
                    await this.createAIQCutoffRecord(
                        collegeId,
                        courseId,
                        quota,
                        category,
                        rankNumber,
                        fileInfo
                    );

                    this.importedRecords++;

                    // Progress indicator
                    if ((i + 1) % 1000 === 0) {
                        console.log(`    📊 Processed ${i + 1}/${dataRows.length} rows...`);
                    }

                } catch (error) {
                    if (this.debugMode) {
                        console.error(`    ❌ Error processing row ${i + 2}:`, error.message);
                    }
                }
            }

            console.log(`    ✅ Processed ${dataRows.length} rows, imported ${this.importedRecords} records`);

        } catch (error) {
            console.error('Error processing AIQ data:', error.message);
        }
    }

    findColumnIndex(headers, possibleNames) {
        for (let i = 0; i < headers.length; i++) {
            const header = headers[i]?.toString().toLowerCase() || '';
            for (const name of possibleNames) {
                if (header.includes(name.toLowerCase())) {
                    return i;
                }
            }
        }
        return 0; // Default to first column if not found
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

    async createAIQCutoffRecord(collegeId, courseId, quota, category, rank, fileInfo) {
        try {
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
            console.log('🚀 Starting UNIVERSAL AIQ Data Import...');
            
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

            console.log('\n🎉 UNIVERSAL AIQ import completed!');
            console.log(`📊 Total AIQ records imported: ${this.importedRecords}`);
            
            if (this.errors.length > 0) {
                console.log(`❌ Errors: ${this.errors.length}`);
                this.errors.forEach(error => console.log(`   - ${error}`));
            }

        } catch (error) {
            console.error('❌ UNIVERSAL AIQ import failed:', error.message);
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

// Run the universal AIQ import
const importer = new UniversalAIImporter();
importer.importAllAIQData();
