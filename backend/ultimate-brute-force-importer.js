const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class UltimateBruteForceImporter {
    constructor() {
        this.dbPath = path.join(__dirname, 'data', 'cutoff_ranks_enhanced.db');
        this.db = null;
        this.importedRecords = 0;
        this.patternStats = {
            colleges: 0,
            courses: 0,
            categories: 0,
            quotas: 0,
            ranks: 0,
            unknown: 0
        };
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
            console.log(`\n🔥 ULTIMATE BRUTE FORCE: ${filename}`);
            
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            
            console.log(`📋 Found ${rawData.length} rows in ${sheetName}`);

            const fileInfo = this.parseAIIFilename(filename);
            if (!fileInfo) return;

            console.log(`🎯 Processing: AIQ ${fileInfo.level} ${fileInfo.year} ${fileInfo.round}`);

            // BRUTE FORCE: Process EVERY row and create records
            await this.processAIQDataBruteForce(rawData, fileInfo);

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

    async processAIQDataBruteForce(rawData, fileInfo) {
        try {
            if (rawData.length < 2) return;

            let currentCollege = null;
            let currentCourse = null;
            let currentCategory = null;
            let currentQuota = null;
            let recordsCreated = 0;
            let pendingRecords = [];

            for (let rowIndex = 0; rowIndex < rawData.length; rowIndex++) {
                const row = rawData[rowIndex];
                if (!row || row.length === 0) continue;

                const cellValue = row[0]?.toString().trim();
                if (!cellValue || cellValue === '') continue;

                // BRUTE FORCE: Analyze EVERY cell type
                const cellType = this.analyzeCellTypeBruteForce(cellValue);
                
                switch (cellType) {
                    case 'COLLEGE':
                        currentCollege = cellValue;
                        currentCourse = null;
                        currentCategory = null;
                        currentQuota = null;
                        console.log(`    🏫 College: ${currentCollege}`);
                        break;
                        
                    case 'COURSE':
                        currentCourse = cellValue;
                        currentCategory = null;
                        currentQuota = null;
                        console.log(`      📚 Course: ${currentCourse}`);
                        break;
                        
                    case 'CATEGORY':
                        currentCategory = cellValue;
                        console.log(`        🏷️  Category: ${currentCategory}`);
                        break;
                        
                    case 'QUOTA':
                        currentQuota = cellValue;
                        console.log(`          🎯 Quota: ${currentQuota}`);
                        break;
                        
                    case 'RANK':
                        // BRUTE FORCE: Create record with ANY available data
                        if (currentCollege && currentCourse) {
                            const record = {
                                collegeName: currentCollege,
                                courseName: currentCourse,
                                category: currentCategory || 'OPEN',
                                quota: currentQuota || 'ALL INDIA QUOTA',
                                rank: parseInt(cellValue.replace(/\s+/g, ''))
                            };
                            
                            await this.createAIQCutoffRecord(record, fileInfo);
                            this.importedRecords++;
                            recordsCreated++;
                        }
                        break;
                        
                    case 'UNKNOWN':
                        // BRUTE FORCE: Try to infer what this could be
                        if (this.isLikelyCourse(cellValue)) {
                            currentCourse = cellValue;
                            console.log(`      📚 Likely Course: ${currentCourse}`);
                        } else if (this.isLikelyQuota(cellValue)) {
                            currentQuota = cellValue;
                            console.log(`          🎯 Likely Quota: ${currentQuota}`);
                        } else if (this.isLikelyCategory(cellValue)) {
                            currentCategory = cellValue;
                            console.log(`        🏷️  Likely Category: ${currentCategory}`);
                        }
                        break;
                }
            }

            console.log(`      ✅ Created ${recordsCreated} records for this file`);

        } catch (error) {
            console.error('Error processing AIQ data:', error.message);
        }
    }

    analyzeCellTypeBruteForce(value) {
        if (this.isCollegeName(value)) {
            this.patternStats.colleges++;
            return 'COLLEGE';
        } else if (this.isCourse(value)) {
            this.patternStats.courses++;
            return 'COURSE';
        } else if (this.isCategory(value)) {
            this.patternStats.categories++;
            return 'CATEGORY';
        } else if (this.isQuota(value)) {
            this.patternStats.quotas++;
            return 'QUOTA';
        } else if (this.isRank(value)) {
            this.patternStats.ranks++;
            return 'RANK';
        } else {
            this.patternStats.unknown++;
            return 'UNKNOWN';
        }
    }

    isCollegeName(value) {
        return value.includes('COLLEGE') || value.includes('HOSPITAL') || 
               value.includes('INSTITUTE') || value.includes('MEDICAL') ||
               value.includes('DENTAL') || value.includes('UNIVERSITY') ||
               value.includes('TRUST') || value.includes('FOUNDATION');
    }

    isCourse(value) {
        return value.startsWith('M.D.') || value.startsWith('M.S.') || 
               value.startsWith('MBBS') || value.startsWith('BDS') ||
               value.startsWith('MDS') || value.startsWith('DNB') ||
               value.startsWith('(NBEMS)') || value.startsWith('(NBEMS-') ||
               value.includes('ANAESTHESIOLOGY') || value.includes('SURGERY') ||
               value.includes('MEDICINE') || value.includes('PATHOLOGY') ||
               value.includes('RADIOLOGY') || value.includes('ORTHOPAEDICS');
    }

    isCategory(value) {
        return value === 'OPEN' || value === 'OBC' || value === 'SC' || 
               value === 'ST' || value === 'EWS' || value === 'PH' || 
               value === 'PWD' || value === 'GENERAL' || value === 'UR' ||
               value === 'BC' || value === 'MBC' || value === 'DNT';
    }

    isQuota(value) {
        return value.includes('QUOTA') || value.includes('SEATS') || 
               value.includes('MANAGEMENT') || value.includes('PAID') ||
               value.includes('NRI') || value.includes('NON-RESIDENT') ||
               value.includes('MUSLIM MINORITY') || value.includes('DNB') ||
               value.includes('DEEMED') || value.includes('CENTRAL') ||
               value.includes('STATE') || value.includes('ALL INDIA');
    }

    isRank(value) {
        const cleanValue = value.replace(/\s+/g, '');
        return /^\d+$/.test(cleanValue);
    }

    isLikelyCourse(value) {
        return value.includes('M.D.') || value.includes('M.S.') || 
               value.includes('MBBS') || value.includes('BDS') ||
               value.includes('MDS') || value.includes('DNB') ||
               value.includes('ANAESTHESIOLOGY') || value.includes('SURGERY') ||
               value.includes('MEDICINE') || value.includes('PATHOLOGY');
    }

    isLikelyQuota(value) {
        return value.includes('QUOTA') || value.includes('SEATS') || 
               value.includes('MANAGEMENT') || value.includes('PAID') ||
               value.includes('NRI') || value.includes('NON-RESIDENT') ||
               value.includes('MUSLIM') || value.includes('MINORITY');
    }

    isLikelyCategory(value) {
        return value === 'OPEN' || value === 'OBC' || value === 'SC' || 
               value === 'ST' || value === 'EWS' || value === 'PH' || 
               value === 'PWD' || value === 'GENERAL' || value === 'UR';
    }

    async createAIQCutoffRecord(record, fileInfo) {
        try {
            const collegeId = await this.findOrCreateCollege(record.collegeName);
            if (!collegeId) return;

            const courseId = await this.findOrCreateCourse(record.courseName);
            if (!courseId) return;

            await this.runQuery(`
                INSERT OR REPLACE INTO cutoff_ranks_enhanced 
                (college_id, course_id, counselling_type, counselling_year, round_number, 
                 round_name, aiq_quota, aiq_category, state_category, state_quota, 
                 cutoff_rank, seats_available, fees_amount) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                collegeId, courseId, `AIQ_${fileInfo.level}`, fileInfo.year, 
                typeof fileInfo.round === 'number' ? fileInfo.round : 999,
                fileInfo.roundName, record.quota, record.category, null, null,
                record.rank, 1, 0
            ]);

        } catch (error) {
            console.error('Error creating AIQ cutoff record:', error.message);
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
            console.log('🔥 Starting ULTIMATE BRUTE FORCE AIQ Data Import...');
            
            await this.connect();
            
            const aiqFiles = this.getAIIExcelFiles();
            console.log(`📁 Found ${aiqFiles.length} AIQ Excel files to process`);

            for (const file of aiqFiles) {
                if (fs.existsSync(file)) {
                    await this.importAIQFile(file);
                }
            }

            console.log('\n🎉 ULTIMATE BRUTE FORCE AIQ import completed!');
            console.log(`📊 Total AIQ records imported: ${this.importedRecords}`);
            console.log('\n📈 Pattern Statistics:');
            console.log(`   Colleges: ${this.patternStats.colleges}`);
            console.log(`   Courses: ${this.patternStats.courses}`);
            console.log(`   Categories: ${this.patternStats.categories}`);
            console.log(`   Quotas: ${this.patternStats.quotas}`);
            console.log(`   Ranks: ${this.patternStats.ranks}`);
            console.log(`   Unknown: ${this.patternStats.unknown}`);

        } catch (error) {
            console.error('❌ ULTIMATE BRUTE FORCE AIQ import failed:', error.message);
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

// Run the ULTIMATE BRUTE FORCE importer
const importer = new UltimateBruteForceImporter();
importer.importAllAIQData();
