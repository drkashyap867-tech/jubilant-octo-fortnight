const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');

class UltimateIntelligentCutoffImporter {
    constructor() {
        this.cutoffDbPath = path.join(__dirname, 'data/cutoff_ranks.db');
        this.counsellingDbPath = path.join(__dirname, 'data/counselling.db');
        this.cutoffDataPath = '/Users/kashyapanand/Documents/jubilant-octo-fortnight/counselling_data/cutoffs';
        
        this.importResults = {
            totalFiles: 0,
            processedFiles: 0,
            totalRecords: 0,
            importedRecords: 0,
            errors: [],
            fileResults: {},
            typeResults: {
                aiq_pg: { files: 0, records: 0 },
                aiq_ug: { files: 0, records: 0 },
                kea: { files: 0, records: 0 }
            }
        };

        // Advanced pattern recognition
        this.patterns = {
            college: /(COLLEGE|INSTITUTE|HOSPITAL|MEDICAL|DENTAL|UNIVERSITY)/i,
            course: /(M\.D\.|M\.S\.|MBBS|BDS|DIPLOMA|MDS)/i,
            quota: /(OPEN|SC|ST|OBC|EWS|MANAGEMENT|PAID|DEEMED|STATE|ALL INDIA)/i,
            category: /(GENERAL|GM|GMP|GMC|SC|ST|OBC|EWS|NRI|MU|OPN|3BG|2AG)/i,
            rank: /^\d+$/,
            grandTotal: /GRAND TOTAL/i
        };
    }

    async importAllCutoffData() {
        console.log('🧠 ULTIMATE INTELLIGENT CUTOFF DATA IMPORTER');
        console.log('==============================================');
        console.log('🚀 Starting the most intelligent data import ever created...');
        
        try {
            // Step 1: Initialize database
            await this.initializeDatabase();
            
            // Step 2: Discover all cutoff files
            const allFiles = await this.discoverAllCutoffFiles();
            this.importResults.totalFiles = allFiles.length;
            
            console.log(`📁 Discovered ${allFiles.length} cutoff files to process`);
            
            // Step 3: Process each file with advanced intelligence
            for (const file of allFiles) {
                try {
                    console.log(`\n🔍 Processing: ${file.filename}`);
                    await this.processSingleFile(file);
                    this.importResults.processedFiles++;
                } catch (error) {
                    console.error(`❌ Error processing ${file.filename}:`, error.message);
                    this.importResults.errors.push(`${file.filename}: ${error.message}`);
                }
            }
            
            // Step 4: Final verification and optimization
            await this.finalVerification();
            
            // Step 5: Print comprehensive results
            this.printUltimateResults();
            
        } catch (error) {
            console.error('❌ Ultimate import failed:', error.message);
            this.importResults.errors.push(error.message);
        }
    }

    async initializeDatabase() {
        console.log('\n🔧 INITIALIZING DATABASE...');
        
        const db = new sqlite3.Database(this.cutoffDbPath);
        
        try {
            // Create cutoff_ranks table if it doesn't exist
            await this.runQuery(db, `
                CREATE TABLE IF NOT EXISTS cutoff_ranks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    college_name TEXT NOT NULL,
                    course_name TEXT NOT NULL,
                    category TEXT NOT NULL,
                    quota TEXT NOT NULL,
                    cutoff_rank INTEGER NOT NULL,
                    counselling_type_id INTEGER NOT NULL,
                    counselling_round_id INTEGER NOT NULL,
                    academic_year TEXT NOT NULL,
                    filename TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Create indexes for performance
            await this.runQuery(db, 'CREATE INDEX IF NOT EXISTS idx_cutoff_college ON cutoff_ranks(college_name)');
            await this.runQuery(db, 'CREATE INDEX IF NOT EXISTS idx_cutoff_course ON cutoff_ranks(course_name)');
            await this.runQuery(db, 'CREATE INDEX IF NOT EXISTS idx_cutoff_type_round ON cutoff_ranks(counselling_type_id, counselling_round_id)');
            await this.runQuery(db, 'CREATE INDEX IF NOT EXISTS idx_cutoff_year ON cutoff_ranks(academic_year)');

            // Create FTS table for search
            await this.runQuery(db, 'DROP TABLE IF EXISTS cutoff_fts');
            await this.runQuery(db, `
                CREATE VIRTUAL TABLE cutoff_fts USING fts5(
                    college_name, course_name, category, quota, 
                    counselling_type, round_name, academic_year
                )
            `);

            console.log('✅ Database initialized successfully');
            
        } finally {
            db.close();
        }
    }

    async discoverAllCutoffFiles() {
        console.log('\n🔍 DISCOVERING ALL CUTOFF FILES...');
        
        const allFiles = [];
        
        // AIQ_PG files
        const aiqPgDirs = ['AIQ_PG_2023', 'AIQ_PG_2024'];
        for (const dir of aiqPgDirs) {
            const dirPath = path.join(this.cutoffDataPath, dir);
            if (fs.existsSync(dirPath)) {
                const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.xlsx'));
                for (const file of files) {
                    allFiles.push({
                        filename: file,
                        subdir: dir,
                        fullPath: path.join(dirPath, file),
                        type: 'aiq_pg',
                        year: dir.includes('2023') ? '2023' : '2024'
                    });
                }
            }
        }

        // AIQ_UG files
        const aiqUgDirs = ['AIQ_UG_2023', 'AIQ_UG_2024'];
        for (const dir of aiqUgDirs) {
            const dirPath = path.join(this.cutoffDataPath, dir);
            if (fs.existsSync(dirPath)) {
                const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.xlsx'));
                for (const file of files) {
                    allFiles.push({
                        filename: file,
                        subdir: dir,
                        fullPath: path.join(dirPath, file),
                        type: 'aiq_ug',
                        year: dir.includes('2023') ? '2023' : '2024'
                    });
                }
            }
        }

        // KEA files
        const keaDirs = ['KEA_2023', 'KEA_2024'];
        for (const dir of keaDirs) {
            const dirPath = path.join(this.cutoffDataPath, dir);
            if (fs.existsSync(dirPath)) {
                const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.xlsx'));
                for (const file of files) {
                    allFiles.push({
                        filename: file,
                        subdir: dir,
                        fullPath: path.join(dirPath, file),
                        type: 'kea',
                        year: dir.includes('2023') ? '2023' : '2024'
                    });
                }
            }
        }

        console.log(`📊 File discovery complete:`);
        console.log(`  AIQ_PG: ${allFiles.filter(f => f.type === 'aiq_pg').length} files`);
        console.log(`  AIQ_UG: ${allFiles.filter(f => f.type === 'aiq_ug').length} files`);
        console.log(`  KEA: ${allFiles.filter(f => f.type === 'kea').length} files`);

        return allFiles;
    }

    async processSingleFile(file) {
        console.log(`🧠 Processing ${file.filename} with ultimate intelligence...`);
        
        // Read Excel file
        const workbook = XLSX.readFile(file.fullPath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Remove Grand Total row
        const cleanData = rawData.filter(row => 
            row && row[0] && !this.patterns.grandTotal.test(row[0])
        );
        
        // Determine counselling type and round
        const counsellingTypeId = this.getCounsellingTypeId(file.type);
        const counsellingRoundId = this.getCounsellingRoundId(file.filename);
        const academicYear = `${file.year}-${parseInt(file.year) + 1}`;
        
        // Parse data with advanced intelligence
        const records = this.parseDataWithUltimateIntelligence(cleanData, file);
        
        // Import records to database
        await this.importRecordsToDatabase(records, counsellingTypeId, counsellingRoundId, academicYear, file.filename);
        
        // Update statistics
        this.importResults.fileResults[file.filename] = {
            records: records.length,
            type: file.type,
            year: file.year
        };
        
        this.importResults.typeResults[file.type].files++;
        this.importResults.typeResults[file.type].records += records.length;
        this.importResults.totalRecords += records.length;
        
        console.log(`✅ ${file.filename}: ${records.length} records imported`);
    }

    parseDataWithUltimateIntelligence(data, file) {
        const records = [];
        let i = 0;
        
        while (i < data.length) {
            try {
                // Find college name (contains COLLEGE, INSTITUTE, HOSPITAL)
                if (data[i] && data[i][0] && this.patterns.college.test(data[i][0])) {
                    const collegeName = this.cleanField(data[i][0]);
                    i++;
                    
                    // Process all courses for this college
                    while (i < data.length && data[i] && data[i][0] && !this.patterns.college.test(data[i][0])) {
                        if (this.patterns.course.test(data[i][0])) {
                            const courseName = this.cleanField(data[i][0]);
                            i++;
                            
                            // Find category and quota
                            let category = '';
                            let quota = '';
                            
                            if (i < data.length && data[i] && data[i][0]) {
                                if (this.patterns.category.test(data[i][0])) {
                                    category = this.cleanField(data[i][0]);
                                    i++;
                                }
                            }
                            
                            if (i < data.length && data[i] && data[i][0]) {
                                if (this.patterns.quota.test(data[i][0])) {
                                    quota = this.cleanField(data[i][0]);
                                    i++;
                                }
                            }
                            
                            // For KEA files, set quota as STATE if missing
                            if (file.type === 'kea' && !quota) {
                                quota = 'STATE';
                            }
                            
                            // Collect all ranks for this course
                            const ranks = [];
                            while (i < data.length && data[i] && data[i][0] && this.patterns.rank.test(data[i][0])) {
                                ranks.push(parseInt(data[i][0]));
                                i++;
                            }
                            
                            // Create record with highest rank (lowest number = best rank)
                            if (ranks.length > 0 && collegeName && courseName && category && quota) {
                                const highestRank = Math.min(...ranks);
                                records.push({
                                    college_name: collegeName,
                                    course_name: courseName,
                                    category: category,
                                    quota: quota,
                                    cutoff_rank: highestRank
                                });
                            }
                        } else {
                            i++;
                        }
                    }
                } else {
                    i++;
                }
            } catch (error) {
                console.warn(`⚠️ Error parsing row ${i}:`, error.message);
                i++;
            }
        }
        
        return records;
    }

    cleanField(field) {
        if (typeof field === 'string') {
            // Remove extra spaces and normalize
            let cleaned = field.replace(/\s+/g, ' ').trim();
            
            // Remove duplicate text patterns
            if (cleaned.includes(',') && cleaned.split(',').length > 2) {
                const parts = cleaned.split(',');
                const uniqueParts = [];
                const seen = new Set();
                
                for (const part of parts) {
                    const trimmedPart = part.trim();
                    if (trimmedPart && !seen.has(trimmedPart)) {
                        uniqueParts.push(trimmedPart);
                        seen.add(trimmedPart);
                    }
                }
                
                cleaned = uniqueParts.join(', ');
            }
            
            // Remove trailing commas
            cleaned = cleaned.replace(/,\s*$/, '');
            
            return cleaned;
        }
        return field;
    }

    getCounsellingTypeId(type) {
        switch (type) {
            case 'aiq_pg': return 1;
            case 'aiq_ug': return 2;
            case 'kea': return 3;
            default: return 1;
        }
    }

    getCounsellingRoundId(filename) {
        if (filename.includes('STRAY_BDS')) return 10;
        if (filename.includes('STRAY') && filename.includes('SPECIAL')) return 7;
        if (filename.includes('STRAY') && !filename.includes('SPECIAL') && !filename.includes('EXTENDED') && !filename.includes('BDS')) return 6;
        if (filename.includes('MOPUP')) return 8;
        if (filename.includes('EXTENDED_STRAY')) return 9;
        if (filename.includes('R1')) return 1;
        if (filename.includes('R2')) return 2;
        if (filename.includes('R3')) return 3;
        if (filename.includes('R4')) return 4;
        if (filename.includes('R5')) return 5;
        return 1;
    }

    async importRecordsToDatabase(records, counsellingTypeId, counsellingRoundId, academicYear, filename) {
        const db = new sqlite3.Database(this.cutoffDbPath);
        
        try {
            // Begin transaction
            await this.runQuery(db, 'BEGIN TRANSACTION');
            
            // Clear existing records for this file to avoid duplicates
            await this.runQuery(db, `
                DELETE FROM cutoff_ranks 
                WHERE filename = ?
            `, [filename]);
            
            // Insert new records
            for (const record of records) {
                await this.runQuery(db, `
                    INSERT INTO cutoff_ranks (
                        college_name, course_name, category, quota, cutoff_rank,
                        counselling_type_id, counselling_round_id, academic_year, filename
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    record.college_name,
                    record.course_name,
                    record.category,
                    record.quota,
                    record.cutoff_rank,
                    counsellingTypeId,
                    counsellingRoundId,
                    academicYear,
                    filename
                ]);
                
                this.importResults.importedRecords++;
            }
            
            // Commit transaction
            await this.runQuery(db, 'COMMIT');
            
        } catch (error) {
            await this.runQuery(db, 'ROLLBACK');
            throw error;
        } finally {
            db.close();
        }
    }

    async finalVerification() {
        console.log('\n🔍 FINAL VERIFICATION AND OPTIMIZATION...');
        
        const db = new sqlite3.Database(this.cutoffDbPath);
        
        try {
            // Get final counts
            const totalRecords = await this.getRecordCount(db, 'SELECT COUNT(*) FROM cutoff_ranks');
            const aiqPgRecords = await this.getRecordCount(db, 'SELECT COUNT(*) FROM cutoff_ranks WHERE counselling_type_id = 1');
            const aiqUgRecords = await this.getRecordCount(db, 'SELECT COUNT(*) FROM cutoff_ranks WHERE counselling_type_id = 2');
            const keaRecords = await this.getRecordCount(db, 'SELECT COUNT(*) FROM cutoff_ranks WHERE counselling_type_id = 3');
            
            console.log('\n📊 FINAL DATABASE STATUS:');
            console.log(`  Total cutoff records: ${totalRecords}`);
            console.log(`  AIQ_PG records: ${aiqPgRecords}`);
            console.log(`  AIQ_UG records: ${aiqUgRecords}`);
            console.log(`  KEA records: ${keaRecords}`);
            
            // Rebuild FTS table
            console.log('\n🔧 Rebuilding FTS table...');
            await this.runQuery(db, 'DELETE FROM cutoff_fts');
            await this.runQuery(db, `
                INSERT INTO cutoff_fts 
                SELECT cr.college_name, cr.course_name, cr.category, cr.quota,
                       ct.name as counselling_type, cr.round_name, cr.academic_year
                FROM cutoff_ranks cr
                JOIN counselling_types ct ON cr.counselling_type_id = ct.id
            `);
            
            console.log('✅ FTS table rebuilt successfully');
            
        } finally {
            db.close();
        }
    }

    async getRecordCount(db, query) {
        return new Promise((resolve, reject) => {
            db.get(query, (err, row) => {
                if (err) reject(err);
                else resolve(row ? row['COUNT(*)'] : 0);
            });
        });
    }

    async runQuery(db, sql, params = []) {
        return new Promise((resolve, reject) => {
            db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve({ changes: this.changes, lastID: this.lastID });
            });
        });
    }

    printUltimateResults() {
        console.log('\n🎉 ULTIMATE INTELLIGENT CUTOFF IMPORT COMPLETE! 🎉');
        console.log('=====================================================');
        console.log(`📁 Total files discovered: ${this.importResults.totalFiles}`);
        console.log(`✅ Files processed: ${this.importResults.processedFiles}`);
        console.log(`📊 Total records imported: ${this.importResults.importedRecords}`);
        console.log(`❌ Errors: ${this.importResults.errors.length}`);
        
        console.log('\n🔧 RESULTS BY TYPE:');
        console.log(`  AIQ_PG: ${this.importResults.typeResults.aiq_pg.files} files, ${this.importResults.typeResults.aiq_pg.records} records`);
        console.log(`  AIQ_UG: ${this.importResults.typeResults.aiq_ug.files} files, ${this.importResults.typeResults.aiq_ug.records} records`);
        console.log(`  KEA: ${this.importResults.typeResults.kea.files} files, ${this.importResults.typeResults.kea.records} records`);
        
        if (this.importResults.errors.length > 0) {
            console.log('\n❌ ERRORS ENCOUNTERED:');
            this.importResults.errors.forEach((error, index) => {
                console.log(`  ${index + 1}. ${error}`);
            });
        }
        
        console.log('\n🚀 YOUR CUTOFF DATABASE IS NOW INTELLIGENTLY POPULATED!');
        console.log('✨ Advanced pattern recognition completed successfully!');
        console.log('🧠 AI-like data processing achieved!');
    }
}

// Run if called directly
if (require.main === module) {
    const importer = new UltimateIntelligentCutoffImporter();
    importer.importAllCutoffData()
        .then(() => {
            console.log('\n✅ Ultimate intelligent cutoff import complete!');
        })
        .catch(error => {
            console.error('\n❌ Ultimate intelligent cutoff import failed:', error.message);
        });
}

module.exports = { UltimateIntelligentCutoffImporter };
