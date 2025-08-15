const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

class MedicalSeatsImporter {
    constructor() {
        this.dataDir = path.join(__dirname, 'data');
        this.medicalDbPath = path.join(this.dataDir, 'medical_seats.db');
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
            console.log('🏥 Starting Medical Seats Import...');
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
            console.log(`  Mapping header "${header}" (${cleanHeader}) to index ${index}`);
            
            // College information
            if (cleanHeader.includes('college') && cleanHeader.includes('institute')) {
                mapping.collegeName = index;
                console.log(`    -> collegeName = ${index}`);
            } else if (cleanHeader.includes('college_code')) {
                mapping.collegeCode = index;
                console.log(`    -> collegeCode = ${index}`);
            } else if (cleanHeader === 'state') {
                mapping.state = index;
                console.log(`    -> state = ${index}`);
            } else if (cleanHeader === 'city') {
                mapping.city = index;
                console.log(`    -> city = ${index}`);
            } else if (cleanHeader === 'management_type') {
                mapping.managementType = index;
                console.log(`    -> managementType = ${index}`);
            } else if (cleanHeader === 'establishment_year') {
                mapping.establishmentYear = index;
                console.log(`    -> establishmentYear = ${index}`);
            }
            
            // Course information
            else if (cleanHeader === 'course_name') {
                mapping.courseName = index;
                console.log(`    -> courseName = ${index}`);
            } else if (cleanHeader === 'course_type') {
                mapping.courseType = index;
                console.log(`    -> courseType = ${index}`);
            }
            
            // Seats information
            else if (cleanHeader === 'total_seats') {
                mapping.totalSeats = index;
                console.log(`    -> totalSeats = ${index}`);
            } else if (cleanHeader === 'general_seats') {
                mapping.generalSeats = index;
                console.log(`    -> generalSeats = ${index}`);
            } else if (cleanHeader === 'obc_seats') {
                mapping.obcSeats = index;
                console.log(`    -> obcSeats = ${index}`);
            } else if (cleanHeader === 'sc_seats') {
                mapping.scSeats = index;
                console.log(`    -> scSeats = ${index}`);
            } else if (cleanHeader === 'st_seats') {
                mapping.stSeats = index;
                console.log(`    -> stSeats = ${index}`);
            } else if (cleanHeader === 'ews_seats') {
                mapping.ewsSeats = index;
                console.log(`    -> ewsSeats = ${index}`);
            }
            
            // Other information
            else if (cleanHeader === 'quota_type') {
                mapping.quotaType = index;
                console.log(`    -> quotaType = ${index}`);
            } else if (cleanHeader === 'academic_year') {
                mapping.academicYear = index;
                console.log(`    -> academicYear = ${index}`);
            } else if (cleanHeader === 'fee_structure') {
                mapping.feeStructure = index;
                console.log(`    -> feeStructure = ${index}`);
            } else if (cleanHeader === 'cutoff_rank') {
                mapping.cutoffRank = index;
                console.log(`    -> cutoffRank = ${index}`);
            }
        });

        console.log('\n🔍 Final column mapping:', mapping);
        return mapping;
    }

    validateRequiredColumns(mapping) {
        const required = ['collegeName', 'state', 'city', 'courseName', 'totalSeats'];
        const missing = required.filter(field => mapping[field] === undefined);
        
        if (missing.length > 0) {
            throw new Error(`Missing required columns: ${missing.join(', ')}`);
        }
    }

    async processDataRows(dataRows, columnMapping) {
        console.log('\n🔄 Processing data rows...');
        
        const db = new sqlite3.Database(this.medicalDbPath);
        
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
        if (!record.collegeName || !record.state || !record.city || !record.courseName) {
            return false;
        }
        
        // Check if total seats is a valid number
        if (record.totalSeats && isNaN(parseInt(record.totalSeats))) {
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
            if (['totalSeats', 'generalSeats', 'obcSeats', 'scSeats', 'stSeats', 'ewsSeats', 'establishmentYear', 'cutoffRank'].includes(key)) {
                if (value && !isNaN(parseInt(value))) {
                    value = parseInt(value);
                } else {
                    value = null;
                }
            }
            
            normalized[key] = value;
        });
        
        // Set defaults
        normalized.generalSeats = normalized.generalSeats || 0;
        normalized.obcSeats = normalized.obcSeats || 0;
        normalized.scSeats = normalized.scSeats || 0;
        normalized.stSeats = normalized.stSeats || 0;
        normalized.ewsSeats = normalized.ewsSeats || 0;
        normalized.quotaType = normalized.quotaType || 'All India';
        normalized.academicYear = normalized.academicYear || '2024-25';
        normalized.courseType = normalized.courseType || 'Undergraduate';
        
        return normalized;
    }

    async importRecord(db, record) {
        return new Promise((resolve, reject) => {
            // Check if record already exists
            const checkQuery = `
                SELECT id FROM medical_courses 
                WHERE college_name = ? AND course_name = ? AND academic_year = ? AND quota_type = ?
            `;
            
            db.get(checkQuery, [
                record.collegeName, 
                record.courseName, 
                record.academicYear, 
                record.quotaType
            ], (err, existing) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                if (existing) {
                    // Update existing record
                    const updateQuery = `
                        UPDATE medical_courses SET
                            state = ?, city = ?, management_type = ?, establishment_year = ?,
                            course_type = ?, total_seats = ?, general_seats = ?, obc_seats = ?,
                            sc_seats = ?, st_seats = ?, ews_seats = ?, fee_structure = ?,
                            cutoff_rank = ?, updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    `;
                    
                    const self = this;
                    db.run(updateQuery, [
                        record.state, record.city, record.managementType, record.establishmentYear,
                        record.courseType, record.totalSeats, record.generalSeats, record.obcSeats,
                        record.scSeats, record.stSeats, record.ewsSeats, record.feeStructure,
                        record.cutoffRank, existing.id
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
                        INSERT INTO medical_courses (
                            college_id, college_name, college_code, state, city, management_type, establishment_year,
                            course_name, course_type, total_seats, general_seats, obc_seats, sc_seats,
                            st_seats, ews_seats, quota_type, academic_year, fee_structure, cutoff_rank
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `;
                    
                    const self = this;
                    db.run(insertQuery, [
                        0, record.collegeName, record.collegeCode, record.state, record.city,
                        record.managementType, record.establishmentYear, record.courseName,
                        record.courseType, record.totalSeats, record.generalSeats, record.obcSeats,
                        record.scSeats, record.stSeats, record.ewsSeats, record.quotaType,
                        record.academicYear, record.feeStructure, record.cutoffRank
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

    generateImportReport() {
        console.log('\n📊 Medical Seats Import Report');
        console.log('==============================');
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
        
        console.log('\n🎉 Import completed successfully!');
    }
}

// Run if called directly
if (require.main === module) {
    const importer = new MedicalSeatsImporter();
    
    // Check if file path is provided
    const filePath = process.argv[2];
    if (!filePath) {
        console.error('❌ Please provide the Excel file path:');
        console.error('   node import-medical-seats.js <excel-file-path>');
        process.exit(1);
    }
    
    importer.importFromExcel(filePath)
        .then(() => {
            console.log('\n✅ Medical seats import completed successfully!');
        })
        .catch(error => {
            console.error('\n❌ Import failed:', error.message);
            process.exit(1);
        });
}

module.exports = { MedicalSeatsImporter };
