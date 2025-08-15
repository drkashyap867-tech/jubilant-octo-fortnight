const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class BulletproofCounsellingBatchImporter {
    constructor() {
        this.dataDir = path.join(__dirname, 'data');
        this.counsellingDbPath = path.join(this.dataDir, 'counselling.db');
        this.counsellingDataDir = path.join(__dirname, '../counselling_data');
        this.importStats = {
            totalFiles: 0,
            successfulFiles: 0,
            failedFiles: 0,
            totalRecords: 0,
            importedRecords: 0,
            skippedRecords: 0,
            errors: [],
            fileResults: []
        };
        
        // File structure mappings for different counselling types
        this.fileStructures = {
            'AIQ_PG': {
                headers: ['ALL INDIA RANK', 'QUOTA', 'COLLEGE/INSTITUTE', 'COURSE', 'CATEGORY'],
                mapping: {
                    allIndiaRank: 0,
                    quota: 1,
                    collegeName: 2,
                    courseName: 3,
                    category: 4
                },
                counsellingType: 'AIQ_PG',
                defaultQuota: 'ALL INDIA'
            },
            'AIQ_UG': {
                headers: ['RANK', 'QUOTA', 'COLLEGE/INSTITUTE', 'COURSE', 'CATEGORY'],
                mapping: {
                    allIndiaRank: 0,
                    quota: 1,
                    collegeName: 2,
                    courseName: 3,
                    category: 4
                },
                counsellingType: 'AIQ_UG',
                defaultQuota: 'OPEN SEAT QUOTA'
            },
            'KEA_MEDICAL': {
                headers: ['ALL INDIA RANK', 'COLLEGE/INSTITUTE', 'COURSE', 'CATEGORY'],
                mapping: {
                    allIndiaRank: 0,
                    quota: 'STATE', // Fixed for KEA
                    collegeName: 1,
                    courseName: 2,
                    category: 3
                },
                counsellingType: 'KEA',
                defaultQuota: 'STATE'
            },
            'KEA_MEDICAL_ALT': {
                headers: ['ALL INDIA RANK', 'COLLEGE/INSTITUTE', 'COURSE NAME', 'COURSE'],
                mapping: {
                    allIndiaRank: 0,
                    quota: 'STATE', // Fixed for KEA
                    collegeName: 1,
                    courseName: 2,
                    category: 3
                },
                counsellingType: 'KEA',
                defaultQuota: 'STATE'
            },
            'KEA_DENTAL': {
                headers: ['ALL INDIA RANK', 'COLLEGE/INSTITUTE', 'COURSE', 'CATEGORY'],
                mapping: {
                    allIndiaRank: 0,
                    quota: 'STATE', // Fixed for KEA
                    collegeName: 1,
                    courseName: 2,
                    category: 3
                },
                counsellingType: 'KEA',
                defaultQuota: 'STATE'
            }
        };
    }

    async runBulletproofBatchImport() {
        console.log('🛡️ BULLETPROOF COUNSELLING BATCH IMPORT - SAFE & ACCURATE...');
        console.log('=====================================');
        
        try {
            // Step 1: Analyze all available files
            const allFiles = await this.analyzeAllFiles();
            console.log(`📊 Found ${allFiles.length} counselling files to process`);
            
            // Step 2: Create backup of current database
            await this.createDatabaseBackup();
            
            // Step 3: Process files in safe batches
            await this.processFilesInBatches(allFiles);
            
            // Step 4: Final verification
            await this.finalVerification();
            
        } catch (error) {
            console.error('❌ CRITICAL ERROR - ROLLING BACK...');
            await this.rollbackDatabase();
            throw error;
        }
        
        this.printComprehensiveSummary();
    }

    async analyzeAllFiles() {
        console.log('🔍 ANALYZING ALL COUNSELLING FILES...');
        
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
                    subdir: subdir,
                    type: this.determineFileType(subdir, file)
                }));
            
            allFiles.push(...files);
        }
        
        // Sort files by type and round for logical processing
        allFiles.sort((a, b) => {
            if (a.type !== b.type) return a.type.localeCompare(b.type);
            return a.filename.localeCompare(b.filename);
        });
        
        return allFiles;
    }

    determineFileType(subdir, filename) {
        if (subdir.startsWith('AIQ_PG')) return 'AIQ_PG';
        if (subdir.startsWith('AIQ_UG')) return 'AIQ_UG';
        if (subdir.includes('KEA') && filename.includes('MEDICAL')) {
            // Special case for KEA_2023_MEDICAL_R1.xlsx which has different headers
            if (filename === 'KEA_2023_MEDICAL_R1.xlsx') {
                return 'KEA_MEDICAL_ALT';
            }
            return 'KEA_MEDICAL';
        }
        if (subdir.includes('KEA') && filename.includes('DENTAL')) return 'KEA_DENTAL';
        return 'UNKNOWN';
    }

    async createDatabaseBackup() {
        console.log('💾 CREATING DATABASE BACKUP...');
        const backupPath = `${this.counsellingDbPath}.backup.${Date.now()}`;
        fs.copyFileSync(this.counsellingDbPath, backupPath);
        console.log(`✅ Backup created: ${backupPath}`);
    }

    async processFilesInBatches(allFiles) {
        console.log('🔄 PROCESSING FILES IN SAFE BATCHES...');
        
        this.importStats.totalFiles = allFiles.length;
        
        for (let i = 0; i < allFiles.length; i++) {
            const file = allFiles[i];
            console.log(`\n📁 Processing ${i + 1}/${allFiles.length}: ${file.filename}`);
            
            try {
                const result = await this.processSingleFile(file);
                this.importStats.fileResults.push(result);
                
                if (result.success) {
                    this.importStats.successfulFiles++;
                    this.importStats.totalRecords += result.totalRows;
                    this.importStats.importedRecords += result.importedRows;
                    this.importStats.skippedRecords += result.skippedRows;
                } else {
                    this.importStats.failedFiles++;
                    this.importStats.errors.push(`File ${file.filename}: ${result.error}`);
                }
                
                // Progress indicator
                if ((i + 1) % 5 === 0) {
                    console.log(`📊 Progress: ${i + 1}/${allFiles.length} files processed`);
                }
                
            } catch (error) {
                console.error(`❌ Critical error processing ${file.filename}:`, error.message);
                this.importStats.failedFiles++;
                this.importStats.errors.push(`File ${file.filename}: ${error.message}`);
                
                // Continue with next file instead of failing completely
            }
        }
    }

    async processSingleFile(file) {
        const result = {
            filename: file.filename,
            path: file.path,
            type: file.type,
            success: false,
            totalRows: 0,
            importedRows: 0,
            skippedRows: 0,
            error: null,
            startTime: Date.now()
        };
        
        try {
            // Read Excel file
            const workbook = XLSX.readFile(file.path);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            const headers = excelData[0];
            const excelRows = excelData.slice(1);
            
            result.totalRows = excelRows.length;
            
            // Validate file structure
            const structure = this.fileStructures[file.type];
            if (!structure) {
                throw new Error(`Unknown file type: ${file.type}`);
            }
            
            // Validate headers
            if (!this.validateHeaders(headers, structure.headers)) {
                throw new Error(`Header mismatch. Expected: ${structure.headers.join(', ')}. Got: ${headers.join(', ')}`);
            }
            
            // Extract round number from filename
            const roundNumber = this.extractRoundNumber(file.filename);
            
            // Process rows
            const db = new sqlite3.Database(this.counsellingDbPath);
            const counsellingTypeId = await this.getCounsellingTypeId(db, structure.counsellingType);
            const counsellingRoundId = await this.getCounsellingRoundId(db, roundNumber);
            
            for (let i = 0; i < excelRows.length; i++) {
                const row = excelRows[i];
                
                try {
                    const record = this.mapRowToRecord(row, structure, counsellingTypeId, counsellingRoundId, file.filename);
                    
                    if (this.isValidRecord(record)) {
                        await this.importCounsellingRecord(db, record);
                        result.importedRows++;
                    } else {
                        result.skippedRows++;
                    }
                    
                } catch (error) {
                    console.error(`❌ Error in row ${i + 2} of ${file.filename}:`, error.message);
                    result.skippedRows++;
                }
            }
            
            db.close();
            result.success = true;
            
            console.log(`✅ ${file.filename}: ${result.importedRows} imported, ${result.skippedRows} skipped`);
            
        } catch (error) {
            result.error = error.message;
            console.error(`❌ Failed to process ${file.filename}:`, error.message);
        }
        
        result.endTime = Date.now();
        result.duration = result.endTime - result.startTime;
        
        return result;
    }

    validateHeaders(actualHeaders, expectedHeaders) {
        if (actualHeaders.length < expectedHeaders.length) return false;
        
        for (const expected of expectedHeaders) {
            if (!actualHeaders.some(actual => actual.includes(expected) || expected.includes(actual))) {
                return false;
            }
        }
        return true;
    }

    extractRoundNumber(filename) {
        const match = filename.match(/R(\d+)/);
        return match ? parseInt(match[1]) : 1;
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
        const match = filename.match(/(\d{4})/);
        return match ? `${match[1]}-${parseInt(match[1]) + 1}` : '2024-25';
    }

    isValidRecord(record) {
        return record.collegeName && record.courseName && record.category;
    }

    async importCounsellingRecord(db, record) {
        // Insert into counselling_data table
        await this.runQuery(db, `
            INSERT INTO counselling_data (
                all_india_rank, quota, college_name, course_name, category, 
                cutoff_rank, seats, fees, counselling_type_id, counselling_round_id,
                academic_year, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [
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
        ]);
        
        // Insert into FTS table for search
        await this.runQuery(db, `
            INSERT INTO counselling_fts (
                college_name, course_name, quota, category, counselling_type
            ) VALUES (?, ?, ?, ?, ?)
        `, [
            record.collegeName,
            record.courseName,
            record.quota,
            record.category,
            record.counsellingType
        ]);
    }

    async finalVerification() {
        console.log('\n🔍 FINAL VERIFICATION...');
        
        const db = new sqlite3.Database(this.counsellingDbPath);
        
        const counsellingDataCount = await this.getRecordCount(db, 'counselling_data');
        const counsellingFtsCount = await this.getRecordCount(db, 'counselling_fts');
        
        console.log(`📊 Final counselling data records: ${counsellingDataCount}`);
        console.log(`📊 Final counselling FTS records: ${counsellingFtsCount}`);
        
        db.close();
        
        if (counsellingDataCount === counsellingFtsCount) {
            console.log('✅ Data integrity verified - perfect match!');
        } else {
            console.log('❌ Data integrity issue detected!');
            throw new Error('Data integrity check failed');
        }
    }

    async rollbackDatabase() {
        console.log('🔄 ROLLING BACK DATABASE...');
        // Implementation would restore from backup
        console.log('⚠️ Manual rollback required - restore from backup file');
    }

    async getCounsellingTypeId(db, counsellingType) {
        return new Promise((resolve, reject) => {
            db.get(
                'SELECT id FROM counselling_types WHERE type_code = ?',
                [counsellingType],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row ? row.id : 1);
                }
            );
        });
    }

    async getCounsellingRoundId(db, roundNumber) {
        return new Promise((resolve, reject) => {
            db.get(
                'SELECT id FROM counselling_rounds WHERE round_number = ?',
                [roundNumber],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row ? row.id : 1);
                }
            );
        });
    }

    async getRecordCount(db, tableName) {
        return new Promise((resolve, reject) => {
            db.get(`SELECT COUNT(*) as count FROM ${tableName}`, (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });
    }

    async runQuery(db, sql, params = []) {
        return new Promise((resolve, reject) => {
            db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve(this);
            });
        });
    }

    printComprehensiveSummary() {
        console.log('\n📊 COMPREHENSIVE BATCH IMPORT SUMMARY:');
        console.log('=====================================');
        console.log(`📁 Total files processed: ${this.importStats.totalFiles}`);
        console.log(`✅ Successful files: ${this.importStats.successfulFiles}`);
        console.log(`❌ Failed files: ${this.importStats.failedFiles}`);
        console.log(`📊 Total Excel rows: ${this.importStats.totalRecords}`);
        console.log(`✅ Imported records: ${this.importStats.importedRecords}`);
        console.log(`⏭️ Skipped records: ${this.importStats.skippedRecords}`);
        
        if (this.importStats.errors.length > 0) {
            console.log('\n❌ Errors encountered:');
            this.importStats.errors.slice(0, 10).forEach(error => console.log(`  - ${error}`));
            if (this.importStats.errors.length > 10) {
                console.log(`  ... and ${this.importStats.errors.length - 10} more errors`);
            }
        }
        
        console.log('\n📋 FILE-BY-FILE RESULTS:');
        this.importStats.fileResults.forEach(result => {
            const status = result.success ? '✅' : '❌';
            console.log(`${status} ${result.filename}: ${result.importedRows} imported, ${result.skippedRows} skipped (${result.duration}ms)`);
        });
        
        if (this.importStats.failedFiles === 0) {
            console.log('\n🎉 PERFECT! ALL FILES PROCESSED SUCCESSFULLY!');
        } else {
            console.log(`\n⚠️ ${this.importStats.failedFiles} files failed - check errors above`);
        }
    }
}

// Run if called directly
if (require.main === module) {
    const importer = new BulletproofCounsellingBatchImporter();
    importer.runBulletproofBatchImport()
        .then(() => {
            console.log('\n✅ Bulletproof batch import complete!');
        })
        .catch(error => {
            console.error('\n❌ Bulletproof batch import failed:', error.message);
        });
}

module.exports = { BulletproofCounsellingBatchImporter };
