const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class FinalPerfectionAIImporter {
    constructor() {
        this.dbPath = path.join(__dirname, 'data', 'cutoff_ranks_enhanced.db');
        this.db = null;
        this.importedRecords = 0;
        this.debugMode = true;
        this.patternStats = {
            courses: { recognized: 0, unrecognized: 0 },
            quotas: { recognized: 0, unrecognized: 0 },
            categories: { recognized: 0, unrecognized: 0 },
            ranks: { recognized: 0, unrecognized: 0 }
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
            console.log(`\n🎯 FINAL PERFECTION AIQ IMPORT: ${filename}`);
            
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            
            console.log(`📋 Found ${rawData.length} rows in ${sheetName}`);

            const fileInfo = this.parseAIIFilename(filename);
            if (!fileInfo) return;

            console.log(`🎯 Processing: AIQ ${fileInfo.level} ${fileInfo.year} ${fileInfo.round}`);

            // FINAL PERFECTION: Process ALL colleges in the file
            await this.processAIQDataFinalPerfection(rawData, fileInfo);

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

    async processAIQDataFinalPerfection(rawData, fileInfo) {
        try {
            if (rawData.length < 2) return;

            const headers = rawData[0];
            const dataRows = rawData.slice(1);
            
            console.log(`  📋 Total columns: ${headers.length}`);
            console.log(`  📊 Data rows: ${dataRows.length}`);

            // FINAL PERFECTION: Process ALL college columns
            let totalColleges = 0;
            for (let colIndex = 0; colIndex < headers.length; colIndex++) {
                const header = headers[colIndex]?.toString().trim();
                if (!header || header === '') continue;

                const collegeName = this.extractCollegeName(header);
                if (!collegeName) continue;

                totalColleges++;
                console.log(`    🏫 Processing college ${totalColleges}: ${collegeName}`);
                
                // FINAL PERFECTION processing
                await this.processCollegeFinalPerfection(rawData, colIndex, collegeName, fileInfo);
            }

            console.log(`  🎯 Total colleges processed: ${totalColleges}`);

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

    async processCollegeFinalPerfection(rawData, colIndex, collegeName, fileInfo) {
        try {
            const collegeId = await this.findOrCreateCollege(collegeName);
            if (!collegeId) return;

            // FINAL PERFECTION: Correct vertical data flow tracking
            let currentCourse = null;
            let currentQuota = null;
            let currentCategory = null;
            let currentRank = null;
            let recordsCreated = 0;

            // Process each row with FINAL PERFECTION logic
            for (let rowIndex = 1; rowIndex < rawData.length; rowIndex++) {
                const row = rawData[rowIndex];
                if (!row || row.length <= colIndex) continue;

                const cellValue = row[colIndex]?.toString().trim();
                if (!cellValue || cellValue === '') continue;

                // FINAL PERFECTION: Enhanced pattern recognition
                const cellType = this.analyzeCellTypeFinalPerfection(cellValue);
                
                switch (cellType) {
                    case 'COURSE':
                        // Reset all values when new course starts
                        currentCourse = cellValue;
                        currentQuota = null;
                        currentCategory = null;
                        currentRank = null;
                        break;
                        
                    case 'QUOTA':
                        currentQuota = cellValue;
                        break;
                        
                    case 'CATEGORY':
                        currentCategory = cellValue;
                        break;
                        
                    case 'RANK':
                        currentRank = parseInt(cellValue.replace(/\s+/g, ''));
                        
                        // FINAL PERFECTION: Create record if we have all required data
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
                            recordsCreated++;
                            
                            // Reset quota and category for next rank (same course)
                            currentQuota = null;
                            currentCategory = null;
                            currentRank = null;
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

            console.log(`      ✅ Created ${recordsCreated} records for ${collegeName}`);

        } catch (error) {
            console.error(`Error processing college column ${colIndex}:`, error.message);
        }
    }

    // FINAL PERFECTION: Enhanced pattern recognition
    analyzeCellTypeFinalPerfection(cellValue) {
        if (this.isAIQCourseFinalPerfection(cellValue)) return 'COURSE';
        if (this.isAIQQuotaFinalPerfection(cellValue)) return 'QUOTA';
        if (this.isAIQCategoryFinalPerfection(cellValue)) return 'CATEGORY';
        if (this.isAIQRank(cellValue)) return 'RANK';
        return 'UNKNOWN';
    }

    // FINAL PERFECTION: Comprehensive course recognition
    isAIQCourseFinalPerfection(value) {
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
            /^MEDICAL/i, /^DENTAL/i, /^CLINICAL/i, /^SPECIALIZATION/i, /^POST GRADUATE/i,
            /^UNDER GRADUATE/i, /^GRADUATE/i, /^POSTGRADUATE/i, /^UNDERGRADUATE/i,
            /^MEDICAL COLLEGE/i, /^DENTAL COLLEGE/i, /^HOSPITAL/i, /^INSTITUTE/i,
            /^COLLEGE/i, /^UNIVERSITY/i, /^ACADEMY/i, /^SCHOOL/i, /^CENTER/i, /^CENTRE/i
        ];
        
        const isMatch = coursePatterns.some(pattern => pattern.test(value));
        if (isMatch) {
            this.patternStats.courses.recognized++;
        } else {
            this.patternStats.courses.unrecognized++;
        }
        
        return isMatch;
    }

    // FINAL PERFECTION: Comprehensive quota recognition
    isAIQQuotaFinalPerfection(value) {
        const quotaPatterns = [
            /^ALL INDIA$/i, /^ALL INDIA QUOTA$/i, /^CENTRAL QUOTA$/i, /^STATE QUOTA$/i,
            /^MANAGEMENT QUOTA$/i, /^PAID SEATS QUOTA$/i, /^NRI QUOTA$/i,
            /^MANAGEMENT\/PAID SEATS QUOTA$/i, /^MANAGEMENT\/ PAID SEATS QUOTA$/i,
            /^NON-RESIDENT INDIAN$/i, /^NRI$/i, /^FOREIGN$/i, /^OVERSEAS$/i,
            /^INTERNATIONAL$/i, /^MANAGEMENT\/ PAID SEATS QUOTA$/i,
            /^GOVERNMENT QUOTA$/i, /^PRIVATE QUOTA$/i, /^OPEN QUOTA$/i,
            /^GOVERNMENT SEATS$/i, /^PRIVATE SEATS$/i, /^OPEN SEATS$/i, /^RESERVED SEATS$/i,
            /^UNRESERVED SEATS$/i, /^CENTRAL SEATS$/i, /^STATE SEATS$/i, /^ALL INDIA SEATS$/i,
            /^MANAGEMENT SEATS$/i, /^PAID SEATS$/i, /^NRI SEATS$/i, /^FOREIGN SEATS$/i,
            /^INTERNATIONAL SEATS$/i, /^OVERSEAS SEATS$/i, /^QUOTA SEATS$/i, /^SEAT QUOTA$/i
        ];
        
        const isMatch = quotaPatterns.some(pattern => pattern.test(value));
        if (isMatch) {
            this.patternStats.quotas.recognized++;
        } else {
            this.patternStats.quotas.unrecognized++;
        }
        
        return isMatch;
    }

    // FINAL PERFECTION: Comprehensive category recognition
    isAIQCategoryFinalPerfection(value) {
        const categoryPatterns = [
            /^OPEN$/i, /^OBC$/i, /^SC$/i, /^ST$/i, /^EWS$/i, /^PH$/i, /^PWD$/i,
            /^OBC PWD$/i, /^SC PWD$/i, /^ST PWD$/i, /^EWS PWD$/i, /^OPEN PWD$/i,
            /^GENERAL$/i, /^UR$/i, /^RESERVED$/i, /^UNRESERVED$/i, /^CATEGORY 1$/i,
            /^CATEGORY 2$/i, /^CATEGORY 3$/i, /^CATEGORY 4$/i, /^CATEGORY 5$/i,
            /^GENERAL CATEGORY$/i, /^RESERVED CATEGORY$/i, /^UNRESERVED CATEGORY$/i,
            /^OPEN CATEGORY$/i, /^CLOSED CATEGORY$/i, /^SPECIAL CATEGORY$/i,
            /^PHYSICALLY HANDICAPPED$/i, /^PERSONS WITH DISABILITY$/i, /^DISABLED$/i,
            /^ECONOMICALLY WEAKER SECTION$/i, /^WEAKER SECTION$/i, /^MINORITY$/i,
            /^TRIBAL$/i, /^SCHEDULED CASTE$/i, /^SCHEDULED TRIBE$/i, /^OTHER BACKWARD CLASS$/i
        ];
        
        const isMatch = categoryPatterns.some(pattern => pattern.test(value));
        if (isMatch) {
            this.patternStats.categories.recognized++;
        } else {
            this.patternStats.categories.unrecognized++;
        }
        
        return isMatch;
    }

    isAIQRank(value) {
        const cleanValue = value.replace(/\s+/g, '');
        const isMatch = /^\d+$/.test(cleanValue);
        
        if (isMatch) {
            this.patternStats.ranks.recognized++;
        } else {
            this.patternStats.ranks.unrecognized++;
        }
        
        return isMatch;
    }

    // FINAL PERFECTION: Likely pattern matching
    isLikelyCourse(value) {
        return value.includes('MEDICINE') || value.includes('SURGERY') || 
               value.includes('DENTAL') || value.includes('CLINICAL') ||
               value.includes('SPECIALIZATION') || value.includes('DIPLOMA') ||
               value.includes('COURSE') || value.includes('PROGRAM') ||
               value.includes('STUDY') || value.includes('TRAINING');
    }

    isLikelyQuota(value) {
        return value.includes('QUOTA') || value.includes('SEATS') || 
               value.includes('MANAGEMENT') || value.includes('PAID') ||
               value.includes('GOVERNMENT') || value.includes('PRIVATE') ||
               value.includes('CENTRAL') || value.includes('STATE') ||
               value.includes('ALL INDIA') || value.includes('NRI');
    }

    isLikelyCategory(value) {
        return value.includes('OPEN') || value.includes('OBC') || 
               value.includes('SC') || value.includes('ST') || 
               value.includes('EWS') || value.includes('PH') || 
               value.includes('PWD') || value.includes('GENERAL') ||
               value.includes('RESERVED') || value.includes('UNRESERVED') ||
               value.includes('CATEGORY') || value.includes('SECTION');
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

    // FINAL PERFECTION: Import all AIQ data
    async importAllAIQData() {
        try {
            console.log('🚀 Starting FINAL PERFECTION AIQ Data Import...');
            
            await this.connect();
            
            const aiqFiles = this.getAIIExcelFiles();
            console.log(`📁 Found ${aiqFiles.length} AIQ Excel files to process`);

            for (const file of aiqFiles) {
                if (fs.existsSync(file)) {
                    await this.importAIQFile(file);
                }
            }

            console.log('\n🎉 FINAL PERFECTION AIQ import completed!');
            console.log(`📊 Total AIQ records imported: ${this.importedRecords}`);
            
            // Display final pattern statistics
            this.displayFinalPatternStats();

        } catch (error) {
            console.error('❌ FINAL PERFECTION AIQ import failed:', error.message);
        } finally {
            await this.disconnect();
        }
    }

    displayFinalPatternStats() {
        console.log('\n🎯 FINAL PATTERN RECOGNITION STATISTICS:');
        console.log(`  Courses: ${this.patternStats.courses.recognized} recognized, ${this.patternStats.courses.unrecognized} unrecognized`);
        console.log(`  Quotas: ${this.patternStats.quotas.recognized} recognized, ${this.patternStats.quotas.unrecognized} unrecognized`);
        console.log(`  Categories: ${this.patternStats.categories.recognized} recognized, ${this.patternStats.categories.unrecognized} unrecognized`);
        console.log(`  Ranks: ${this.patternStats.ranks.recognized} recognized, ${this.patternStats.ranks.unrecognized} unrecognized`);
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

// Run the FINAL PERFECTION importer
const importer = new FinalPerfectionAIImporter();
importer.importAllAIQData();
