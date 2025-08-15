const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

class CounsellingDataImporter {
    constructor() {
        this.dataDir = path.join(__dirname, 'data');
        this.counsellingDbPath = path.join(this.dataDir, 'counselling.db');
        this.collegeDbPath = path.join(this.dataDir, 'colleges.db');
        this.importStats = {
            totalRecords: 0,
            importedRecords: 0,
            updatedRecords: 0,
            skippedRecords: 0,
            errors: [],
            warnings: []
        };
    }

    async importFromExcel(filePath) {
        try {
            console.log('🎯 Starting Counselling Data Import...');
            console.log(`📁 File: ${path.basename(filePath)}`);
            
            // Validate file exists
            if (!fs.existsSync(filePath)) {
                throw new Error(`File not found: ${filePath}`);
            }

            // Read Excel file
            const workbook = XLSX.readFile(filePath);
            const sheetNames = workbook.SheetNames;
            
            if (sheetNames.length === 0) {
                throw new Error('No sheets found in Excel file');
            }

            console.log(`📊 Found ${sheetNames.length} sheet(s): ${sheetNames.join(', ')}`);
            
            // Process first sheet by default
            const sheetName = sheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            if (!worksheet) {
                throw new Error(`Sheet "${sheetName}" not found`);
            }

            // Convert to JSON
            const rawData = XLSX.utils.sheet_to_json(worksheet, {
                header: 1,
                defval: '',
                blankrows: false
            });

            if (rawData.length < 2) {
                throw new Error('Insufficient data in Excel file (need at least header + 1 row)');
            }

            // Extract headers and data
            const headers = rawData[0];
            const dataRows = rawData.slice(1);

            console.log(`📋 Headers: ${headers.join(', ')}`);
            console.log(`📊 Data rows: ${dataRows.length}`);

            // Detect column mapping
            const columnMapping = this.detectColumnMapping(headers);
            console.log('🔍 Column mapping detected:', columnMapping);

            // Validate required columns
            this.validateRequiredColumns(columnMapping);

            // Process data rows
            await this.processDataRows(dataRows, columnMapping);

            // Generate import report
            this.generateImportReport();

        } catch (error) {
            console.error('❌ Import failed:', error.message);
            throw error;
        }
    }

    detectColumnMapping(headers) {
        const mapping = {};
        
        headers.forEach((header, index) => {
            if (!header) return;
            
            const cleanHeader = header.toString().toLowerCase().trim();
            
            // Rank information
            if (cleanHeader.includes('all india rank') || cleanHeader.includes('rank')) {
                mapping.allIndiaRank = index;
            }
            
            // Quota information
            else if (cleanHeader.includes('quota')) {
                mapping.quota = index;
            } else if (cleanHeader.includes('state')) {
                mapping.state = index;
            }
            
            // College information
            else if (cleanHeader.includes('college') || cleanHeader.includes('institute')) {
                mapping.collegeName = index;
            }
            
            // Course information
            else if (cleanHeader.includes('course')) {
                mapping.courseName = index;
            }
            
            // Category information
            else if (cleanHeader.includes('category')) {
                mapping.category = index;
            }
            
            // Cutoff information
            else if (cleanHeader.includes('cutoff rank') || cleanHeader.includes('cutoff')) {
                mapping.cutoffRank = index;
            }
            
            // Seats information
            else if (cleanHeader.includes('seats')) {
                mapping.seats = index;
            }
            
            // Fees information
            else if (cleanHeader.includes('fees') || cleanHeader.includes('fee')) {
                mapping.fees = index;
            }
            
            // Counselling type detection
            else if (cleanHeader.includes('counselling') || cleanHeader.includes('type')) {
                mapping.counsellingType = index;
            }
            
            // Year information
            else if (cleanHeader.includes('year') || cleanHeader.includes('academic')) {
                mapping.year = index;
            }
            
            // Round information
            else if (cleanHeader.includes('round') || cleanHeader.includes('phase')) {
                mapping.round = index;
            }
        });

        return mapping;
    }

    validateRequiredColumns(mapping) {
        const required = ['collegeName', 'courseName', 'category'];
        const missing = required.filter(field => mapping[field] === undefined);
        
        if (missing.length > 0) {
            throw new Error(`Missing required columns: ${missing.join(', ')}`);
        }
    }

    async processDataRows(dataRows, columnMapping) {
        console.log('\n🔄 Processing counselling data rows...');
        
        const db = new sqlite3.Database(this.counsellingDbPath);
        
        try {
            for (let i = 0; i < dataRows.length; i++) {
                const row = dataRows[i];
                this.importStats.totalRecords++;
                
                try {
                    // Extract data using column mapping
                    const record = this.extractRecord(row, columnMapping);
                    
                    // Validate record
                    if (!this.validateRecord(record)) {
                        this.importStats.skippedRecords++;
                        continue;
                    }
                    
                    // Normalize data
                    const normalizedRecord = this.normalizeRecord(record);
                    
                    // Import to database
                    await this.importRecord(db, normalizedRecord);
                    
                } catch (error) {
                    this.importStats.errors.push({
                        row: i + 2,
                        error: error.message,
                        data: row
                    });
                }
            }
        } finally {
            db.close();
        }
    }

    extractRecord(row, mapping) {
        const record = {};
        
        Object.keys(mapping).forEach(field => {
            const columnIndex = mapping[field];
            if (columnIndex !== undefined && row[columnIndex] !== undefined) {
                record[field] = row[columnIndex];
            }
        });
        
        return record;
    }

    validateRecord(record) {
        // Check if essential fields are present
        if (!record.collegeName || !record.courseName || !record.category) {
            return false;
        }
        
        return true;
    }

    normalizeRecord(record) {
        const normalized = {};
        
        // Normalize text fields
        Object.keys(record).forEach(key => {
            let value = record[key];
            
            if (typeof value === 'string') {
                value = value.toString().trim();
                if (value === '') value = null;
            }
            
            // Convert numeric fields
            if (['allIndiaRank', 'cutoffRank', 'seats', 'fees', 'year', 'round'].includes(key)) {
                if (value && !isNaN(parseInt(value))) {
                    value = parseInt(value);
                } else {
                    value = null;
                }
            }
            
            normalized[key] = value;
        });
        
        // Set defaults and normalize values
        normalized.quota = normalized.quota || 'AIQ';
        normalized.state = normalized.state || 'Karnataka';
        normalized.seats = normalized.seats || 1;
        normalized.fees = normalized.fees || 0;
        normalized.year = normalized.year || 2024;
        normalized.round = normalized.round || 1;
        
        // Normalize counselling type based on quota
        if (normalized.quota === 'AIQ' || normalized.quota === 'All India') {
            if (normalized.courseName && normalized.courseName.includes('MBBS')) {
                normalized.counsellingType = 'AIQ_UG';
            } else {
                normalized.counsellingType = 'AIQ_PG';
            }
        } else if (normalized.state === 'Karnataka') {
            normalized.counsellingType = 'KEA';
        }
        
        return normalized;
    }

    async importRecord(db, record) {
        return new Promise((resolve, reject) => {
            // First, ensure counselling type exists
            this.ensureCounsellingType(db, record.counsellingType, record.quota, record.state)
                .then(counsellingTypeId => {
                    // Then ensure counselling round exists
                    return this.ensureCounsellingRound(db, counsellingTypeId, record.year, record.round);
                })
                .then(counsellingRoundId => {
                    // Finally, import the counselling data
                    return this.importCounsellingData(db, counsellingRoundId, record);
                })
                .then(() => {
                    resolve();
                })
                .catch(reject);
        });
    }

    async ensureCounsellingType(db, typeCode, quota, state) {
        return new Promise((resolve, reject) => {
            // Check if counselling type exists
            db.get('SELECT id FROM counselling_types WHERE type_code = ?', [typeCode], (err, existing) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                if (existing) {
                    resolve(existing.id);
                } else {
                    // Create new counselling type
                    const name = this.getCounsellingTypeName(typeCode, quota, state);
                    const description = this.getCounsellingTypeDescription(typeCode, quota, state);
                    const quotaType = this.getQuotaType(quota, state);
                    const authority = this.getAuthority(typeCode, quota, state);
                    
                    db.run(`
                        INSERT INTO counselling_types (type_code, name, description, quota_type, authority, search_priority)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `, [typeCode, name, description, quotaType, authority, 90], function(err) {
                        if (err) reject(err);
                        else resolve(this.lastID);
                    });
                }
            });
        });
    }

    async ensureCounsellingRound(db, counsellingTypeId, year, round) {
        return new Promise((resolve, reject) => {
            // Check if counselling round exists
            db.get(`
                SELECT id FROM counselling_rounds 
                WHERE counselling_type_id = ? AND year = ? AND round_name = ?
            `, [counsellingTypeId, year, `Round ${round}`], (err, existing) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                if (existing) {
                    resolve(existing.id);
                } else {
                    // Create new counselling round
                    db.run(`
                        INSERT INTO counselling_rounds (
                            counselling_type_id, year, round_name, normalized_round_name, 
                            round_order, round_type, status, description
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        counsellingTypeId, year, `Round ${round}`, `round ${round}`,
                        round, 'Regular', 'completed', `Round ${round} for year ${year}`
                    ], function(err) {
                        if (err) reject(err);
                        else resolve(this.lastID);
                    });
                }
            });
        });
    }

    async importCounsellingData(db, counsellingRoundId, record) {
        return new Promise((resolve, reject) => {
            // Check if counselling data already exists
            const checkQuery = `
                SELECT id FROM counselling_data 
                WHERE counselling_round_id = ? AND college_name = ? AND course_name = ? AND category = ?
            `;
            
            db.get(checkQuery, [
                counsellingRoundId, record.collegeName, record.courseName, record.category
            ], (err, existing) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                if (existing) {
                    // Update existing record
                    const updateQuery = `
                        UPDATE counselling_data SET
                            all_india_rank = ?, quota = ?, cutoff_rank = ?, 
                            seats_available = ?, fees_amount = ?
                        WHERE id = ?
                    `;
                    
                    const self = this;
                    db.run(updateQuery, [
                        record.allIndiaRank, record.quota, record.cutoffRank,
                        record.seats, record.fees, existing.id
                    ], function(err) {
                        if (err) reject(err);
                        else {
                            self.importStats.updatedRecords++;
                            resolve();
                        }
                    });
                } else {
                    // Insert new record
                    const insertQuery = `
                        INSERT INTO counselling_data (
                            counselling_round_id, college_id, college_name, course_name,
                            all_india_rank, quota, category, cutoff_rank, seats_available, fees_amount
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `;
                    
                    const self = this;
                    db.run(insertQuery, [
                        counsellingRoundId, 0, record.collegeName, record.courseName,
                        record.allIndiaRank, record.quota, record.category, record.cutoffRank,
                        record.seats, record.fees
                    ], function(err) {
                        if (err) reject(err);
                        else {
                            self.importStats.importedRecords++;
                            resolve();
                        }
                    });
                }
            });
        });
    }

    getCounsellingTypeName(typeCode, quota, state) {
        const names = {
            'AIQ_PG': 'All India Quota Postgraduate',
            'AIQ_UG': 'All India Quota Undergraduate',
            'KEA': 'Karnataka Examinations Authority',
            'COMEDK': 'Consortium of Medical, Engineering and Dental Colleges of Karnataka'
        };
        return names[typeCode] || `${quota} Counselling`;
    }

    getCounsellingTypeDescription(typeCode, quota, state) {
        const descriptions = {
            'AIQ_PG': 'Centralized counselling for PG seats across India',
            'AIQ_UG': 'Centralized counselling for UG seats across India',
            'KEA': 'State counselling for Karnataka medical colleges',
            'COMEDK': 'Private college counselling in Karnataka'
        };
        return descriptions[typeCode] || `${quota} counselling for ${state}`;
    }

    getQuotaType(quota, state) {
        if (quota === 'AIQ' || quota === 'All India') return 'Central';
        if (state === 'Karnataka') return 'State';
        return 'Private';
    }

    getAuthority(typeCode, quota, state) {
        const authorities = {
            'AIQ_PG': 'MCC',
            'AIQ_UG': 'MCC',
            'KEA': 'KEA',
            'COMEDK': 'COMEDK'
        };
        return authorities[typeCode] || 'Local Authority';
    }

    generateImportReport() {
        console.log('\n📊 Counselling Data Import Report');
        console.log('==================================');
        console.log(`Total Records Processed: ${this.importStats.totalRecords}`);
        console.log(`New Records Imported: ${this.importStats.importedRecords}`);
        console.log(`Existing Records Updated: ${this.importStats.updatedRecords}`);
        console.log(`Skipped Records: ${this.importStats.skippedRecords}`);
        console.log(`Errors: ${this.importStats.errors.length}`);
        console.log(`Warnings: ${this.importStats.warnings.length}`);
        
        if (this.importStats.errors.length > 0) {
            console.log('\n❌ Errors:');
            this.importStats.errors.forEach(error => {
                console.log(`  Row ${error.row}: ${error.error}`);
            });
        }
        
        if (this.importStats.warnings.length > 0) {
            console.log('\n⚠️  Warnings:');
            this.importStats.warnings.forEach(warning => {
                console.log(`  Row ${warning.row}: ${warning.warning}`);
            });
        }
        
        console.log('\n🎉 Counselling data import completed successfully!');
    }
}

// Run if called directly
if (require.main === module) {
    const importer = new CounsellingDataImporter();
    
    // Check if file path is provided
    const filePath = process.argv[2];
    if (!filePath) {
        console.error('❌ Please provide the Excel file path:');
        console.error('   node import-counselling-data.js <excel-file-path>');
        process.exit(1);
    }
    
    importer.importFromExcel(filePath)
        .then(() => {
            console.log('\n✅ Counselling data import completed successfully!');
        })
        .catch(error => {
            console.error('\n❌ Import failed:', error.message);
            process.exit(1);
        });
}

module.exports = { CounsellingDataImporter };
