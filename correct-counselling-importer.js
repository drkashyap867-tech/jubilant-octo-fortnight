const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class CorrectCounsellingImporter {
    constructor() {
        this.dataDir = path.join(__dirname, 'data');
        this.counsellingDbPath = path.join(__dirname, 'data/counselling.db');
        this.counsellingDataDir = path.join(__dirname, '../counselling_data');
        this.importStats = {
            totalFiles: 0,
            processedFiles: 0,
            totalRecords: 0,
            errors: []
        };
    }

    async importAllCounsellingData() {
        console.log('🚀 CORRECT COUNSELLING DATA IMPORT - NO DUPLICATION...');
        console.log('=====================================');
        
        try {
            // Get all counselling files
            const allFiles = this.getAllCounsellingFiles();
            this.importStats.totalFiles = allFiles.length;
            
            console.log(`📊 Found ${allFiles.length} counselling files to import`);
            
            // Import each file individually
            for (let i = 0; i < allFiles.length; i++) {
                const file = allFiles[i];
                console.log(`\n📁 Importing ${i + 1}/${allFiles.length}: ${file.filename}`);
                
                const result = await this.importSingleFile(file);
                if (result.success) {
                    this.importStats.processedFiles++;
                    this.importStats.totalRecords += result.importedRecords;
                    console.log(`✅ ${file.filename}: ${result.importedRecords} records imported`);
                } else {
                    this.importStats.errors.push({
                        file: file.filename,
                        error: result.error
                    });
                    console.log(`❌ ${file.filename}: ${result.error}`);
                }
                
                // Progress indicator
                if ((i + 1) % 10 === 0) {
                    console.log(`📊 Progress: ${i + 1}/${allFiles.length} files processed`);
                }
            }
            
            // Final verification
            await this.finalVerification();
            
        } catch (error) {
            console.error('❌ Import failed:', error.message);
            this.importStats.errors.push(error.message);
        }
        
        this.printImportSummary();
    }

    getAllCounsellingFiles() {
        const allFiles = [];
        
        // Scan all subdirectories
        const subdirs = fs.readdirSync(this.counsellingDataDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
        
        for (const subdir of subdirs) {
            const subdirPath = path.join(this.counsellingDataDir, subdir);
            const files = fs.readdirSync(subdirPath)
                .filter(file => file.endsWith('.xlsx'))
                .map(file => ({
                    path: path.join(subdirPath, file),
                    filename: file,
                    subdir: subdir
                }));
            
            allFiles.push(...files);
        }
        
        // Sort files for logical processing
        allFiles.sort((a, b) => {
            if (a.subdir !== b.subdir) return a.subdir.localeCompare(b.subdir);
            return a.filename.localeCompare(b.filename);
        });
        
        return allFiles;
    }

    async importSingleFile(file) {
        const result = {
            success: false,
            importedRecords: 0,
            error: null
        };
        
        try {
            // Read Excel file
            const workbook = XLSX.readFile(file.path);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            const excelRows = excelData.slice(1); // Exclude header
            console.log(`  📊 Excel rows: ${excelRows.length}`);
            
            // Determine file type and structure
            const fileType = this.determineFileType(file.subdir, file.filename);
            const structure = this.getFileStructure(fileType);
            
            if (!structure) {
                throw new Error(`Unknown file type for ${file.filename}`);
            }
            
            // Get counselling type and round IDs
            const counsellingTypeId = await this.getCounsellingTypeId(fileType);
            const counsellingRoundId = await this.getCounsellingRoundId(file.filename);
            
            // Import records
            const importedCount = await this.importRecordsFromFile(
                excelRows, 
                structure, 
                counsellingTypeId, 
                counsellingRoundId, 
                file.filename
            );
            
            result.importedRecords = importedCount;
            result.success = true;
            
        } catch (error) {
            result.error = error.message;
            console.error(`❌ Error importing ${file.filename}:`, error.message);
        }
        
        return result;
    }

    determineFileType(subdir, filename) {
        if (subdir.startsWith('AIQ_PG')) return 'AIQ_PG';
        if (subdir.startsWith('AIQ_UG')) return 'AIQ_UG';
        if (subdir.includes('KEA') && filename.includes('MEDICAL')) {
            if (filename === 'KEA_2023_MEDICAL_R1.xlsx') {
                return 'KEA_MEDICAL_ALT';
            }
            return 'KEA_MEDICAL';
        }
        if (subdir.includes('KEA') && filename.includes('DENTAL')) return 'KEA_DENTAL';
        return 'UNKNOWN';
    }

    getFileStructure(fileType) {
        const structures = {
            'AIQ_PG': {
                headers: ['ALL INDIA RANK', 'QUOTA', 'COLLEGE/INSTITUTE', 'COURSE', 'CATEGORY'],
                mapping: {
                    allIndiaRank: 0,
                    quota: 1,
                    collegeName: 2,
                    courseName: 3,
                    category: 4
                },
                defaultQuota: 'AIQ'
            },
            'AIQ_UG': {
                headers: ['ALL INDIA RANK', 'QUOTA', 'COLLEGE/INSTITUTE', 'COURSE', 'CATEGORY'],
                mapping: {
                    allIndiaRank: 0,
                    quota: 1,
                    collegeName: 2,
                    courseName: 3,
                    category: 4
                },
                defaultQuota: 'AIQ'
            },
            'KEA_MEDICAL': {
                headers: ['ALL INDIA RANK', 'COLLEGE/INSTITUTE', 'COURSE', 'CATEGORY'],
                mapping: {
                    allIndiaRank: 0,
                    quota: 'STATE',
                    collegeName: 1,
                    courseName: 2,
                    category: 3
                },
                defaultQuota: 'STATE'
            },
            'KEA_MEDICAL_ALT': {
                headers: ['ALL INDIA RANK', 'COLLEGE/INSTITUTE', 'COURSE NAME', 'COURSE'],
                mapping: {
                    allIndiaRank: 0,
                    quota: 'STATE',
                    collegeName: 1,
                    courseName: 2,
                    category: 3
                },
                defaultQuota: 'STATE'
            },
            'KEA_DENTAL': {
                headers: ['ALL INDIA RANK', 'COLLEGE/INSTITUTE', 'COURSE', 'CATEGORY'],
                mapping: {
                    allIndiaRank: 0,
                    quota: 'STATE',
                    collegeName: 1,
                    courseName: 2,
                    category: 3
                },
                defaultQuota: 'STATE'
            }
        };
        
        return structures[fileType];
    }

    async getCounsellingTypeId(fileType) {
        const db = new sqlite3.Database(this.counsellingDbPath);
        
        try {
            let typeCode = '';
            if (fileType === 'AIQ_PG') typeCode = 'AIQ_PG';
            else if (fileType === 'AIQ_UG') typeCode = 'AIQ_UG';
            else if (fileType.startsWith('KEA')) typeCode = 'KEA';
            
            const result = await this.runQuery(db, 
                'SELECT id FROM counselling_types WHERE type_code = ?', 
                [typeCode]
            );
            
            return result || 1; // Default to AIQ_PG if not found
            
        } finally {
            db.close();
        }
    }

    async getCounsellingRoundId(filename) {
        const roundMatch = filename.match(/R(\d+)/);
        if (roundMatch) {
            return parseInt(roundMatch[1]);
        }
        
        // Handle special rounds with correct mapping
        if (filename.includes('STRAY_BDS')) return 10; // STRAY_BDS - NEW ROUND
        if (filename.includes('STRAY') && filename.includes('SPECIAL')) return 7; // SPECIAL_STRAY
        if (filename.includes('STRAY') && !filename.includes('SPECIAL') && !filename.includes('EXTENDED') && !filename.includes('BDS')) return 6; // STRAY (but not STRAY_BDS)
        if (filename.includes('MOPUP')) return 8; // MOPUP
        if (filename.includes('EXTENDED_STRAY')) return 9; // EXTENDED_STRAY
        
        return 1; // Default to Round 1
    }

    async importRecordsFromFile(excelRows, structure, counsellingTypeId, counsellingRoundId, filename) {
        const db = new sqlite3.Database(this.counsellingDbPath);
        
        try {
            let importedCount = 0;
            
            for (const row of excelRows) {
                const record = this.mapRowToRecord(row, structure, counsellingTypeId, counsellingRoundId, filename);
                
                if (record.collegeName && record.courseName && record.category) {
                    await this.insertCounsellingRecord(db, record);
                    importedCount++;
                }
            }
            
            return importedCount;
            
        } finally {
            db.close();
        }
    }

    mapRowToRecord(row, structure, counsellingTypeId, counsellingRoundId, filename) {
        const mapping = structure.mapping;
        
        return {
            allIndiaRank: mapping.allIndiaRank !== 'STATE' ? (row[mapping.allIndiaRank] || null) : null,
            quota: mapping.quota !== 'STATE' ? (row[mapping.quota] || structure.defaultQuota) : structure.defaultQuota,
            collegeName: row[mapping.collegeName] || '',
            courseName: row[mapping.courseName] || '',
            category: row[mapping.category] || '',
            cutoffRank: mapping.allIndiaRank !== 'STATE' ? (row[mapping.allIndiaRank] || null) : null,
            seats: 1,
            fees: 0,
            counsellingTypeId: counsellingTypeId,
            counsellingRoundId: counsellingRoundId,
            academicYear: this.extractAcademicYear(filename)
        };
    }

    extractAcademicYear(filename) {
        const yearMatch = filename.match(/(\d{4})/);
        if (yearMatch) {
            const year = yearMatch[1];
            return `${year}-${parseInt(year) + 1}`;
        }
        return '2024-2025';
    }

    async insertCounsellingRecord(db, record) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO counselling_data (
                    all_india_rank, quota, college_name, course_name, category,
                    cutoff_rank, seats, fees, counselling_type_id, counselling_round_id, academic_year
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const params = [
                record.allIndiaRank,
                record.quota,
                record.collegeName,
                record.courseName,
                record.category,
                record.cutoffRank,
                record.seats,
                record.fees,
                record.counsellingTypeId,
                record.counsellingRoundId,
                record.academicYear
            ];
            
            db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    async finalVerification() {
        console.log('\n🔍 FINAL VERIFICATION...');
        
        const db = new sqlite3.Database(this.counsellingDbPath);
        
        const counsellingDataCount = await this.getRecordCount(db, 'counselling_data');
        console.log(`📊 Final counselling data records: ${counsellingDataCount}`);
        
        // Rebuild FTS table
        console.log('🔧 Rebuilding FTS table...');
        await this.runQuery(db, 'DELETE FROM counselling_fts');
        await this.runQuery(db, 'INSERT INTO counselling_fts SELECT * FROM counselling_data');
        
        const counsellingFtsCount = await this.getRecordCount(db, 'counselling_fts');
        console.log(`📊 Final counselling FTS records: ${counsellingFtsCount}`);
        
        if (counsellingDataCount === counsellingFtsCount) {
            console.log('✅ Data integrity verified - perfect match!');
        } else {
            console.log('❌ Data integrity issue detected!');
        }
        
        db.close();
    }

    async getRecordCount(db, tableName) {
        return new Promise((resolve, reject) => {
            db.get(`SELECT COUNT(*) as count FROM ${tableName}`, (err, row) => {
                if (err) reject(err);
                else resolve(row ? row.count : 0);
            });
        });
    }

    async runQuery(db, sql, params = []) {
        return new Promise((resolve, reject) => {
            db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row ? row.id : null);
            });
        });
    }

    printImportSummary() {
        console.log('\n📊 IMPORT SUMMARY:');
        console.log('=====================================');
        console.log(`📁 Total files: ${this.importStats.totalFiles}`);
        console.log(`✅ Processed files: ${this.importStats.processedFiles}`);
        console.log(`📊 Total records imported: ${this.importStats.totalRecords}`);
        
        if (this.importStats.errors.length > 0) {
            console.log(`❌ Errors: ${this.importStats.errors.length}`);
            this.importStats.errors.forEach(error => {
                if (typeof error === 'string') {
                    console.log(`  - ${error}`);
                } else {
                    console.log(`  - ${error.file}: ${error.error}`);
                }
            });
        }
        
        if (this.importStats.errors.length === 0) {
            console.log('\n🎉 PERFECT! ALL FILES IMPORTED SUCCESSFULLY!');
        } else {
            console.log(`\n⚠️ ${this.importStats.errors.length} files had errors`);
        }
    }
}

// Run if called directly
if (require.main === module) {
    const importer = new CorrectCounsellingImporter();
    importer.importAllCounsellingData()
        .then(() => {
            console.log('\n✅ Correct counselling import complete!');
        })
        .catch(error => {
            console.error('\n❌ Correct counselling import failed:', error.message);
        });
}

module.exports = { CorrectCounsellingImporter };
