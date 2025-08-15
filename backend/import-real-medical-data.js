const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

class RealMedicalDataImporter {
    constructor() {
        this.dataDir = path.join(__dirname, 'data');
        this.medicalDbPath = path.join(this.dataDir, 'medical_seats.db');
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
            console.log('🏥 Starting Real Medical Data Import...');
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

            // Validate required columns
            this.validateRequiredColumns(headers);

            // Process data rows
            await this.processDataRows(dataRows, headers);

            // Generate import report
            this.generateImportReport();

        } catch (error) {
            console.error('❌ Import failed:', error.message);
            throw error;
        }
    }

    validateRequiredColumns(headers) {
        const required = ['COURSE', 'STATE', 'COLLEGE/INSTITUTE', 'SEATS'];
        const missing = required.filter(field => !headers.includes(field));
        
        if (missing.length > 0) {
            throw new Error(`Missing required columns: ${missing.join(', ')}`);
        }
    }

    async processDataRows(dataRows, headers) {
        console.log('\n🔄 Processing real medical data rows...');
        
        const db = new sqlite3.Database(this.medicalDbPath);
        
        try {
            for (let i = 0; i < dataRows.length; i++) {
                const row = dataRows[i];
                this.importStats.totalRecords++;
                
                try {
                    // Extract data using column indices
                    const record = this.extractRecord(row, headers);
                    
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

    extractRecord(row, headers) {
        const record = {};
        
        // Map headers to record fields
        headers.forEach((header, index) => {
            if (header && row[index] !== undefined) {
                record[header] = row[index];
            }
        });
        
        return record;
    }

    validateRecord(record) {
        // Check if essential fields are present
        if (!record['COURSE'] || !record['STATE'] || !record['COLLEGE/INSTITUTE']) {
            return false;
        }
        
        // Check if seats is a valid number
        if (record['SEATS'] && isNaN(parseInt(record['SEATS']))) {
            return false;
        }
        
        return true;
    }

    normalizeRecord(record) {
        const normalized = {};
        
        // Map your Excel columns to database fields
        normalized.courseName = record['COURSE'] || '';
        normalized.state = record['STATE'] || '';
        normalized.collegeName = record['COLLEGE/INSTITUTE'] || '';
        normalized.universityName = record['UNIVERSITY NAME'] || '';
        normalized.managementType = record['MANAGEMENT OF THE COLLEGE'] || '';
        normalized.establishmentYear = record['YEAR OF INCEPTION OF COLLEGE'] || '';
        normalized.totalSeats = parseInt(record['SEATS']) || 0;
        
        // Set defaults and normalize values
        normalized.collegeCode = '';
        normalized.city = this.extractCityFromCollegeName(record['COLLEGE/INSTITUTE']);
        normalized.courseType = this.determineCourseType(record['COURSE']);
        normalized.quotaType = 'All India';
        normalized.academicYear = '2024-25';
        normalized.feeStructure = '';
        normalized.cutoffRank = null;
        
        // Set default seat allocations (you can modify these based on your data)
        normalized.generalSeats = Math.ceil(normalized.totalSeats * 0.5);
        normalized.obcSeats = Math.ceil(normalized.totalSeats * 0.27);
        normalized.scSeats = Math.ceil(normalized.totalSeats * 0.15);
        normalized.stSeats = Math.ceil(normalized.totalSeats * 0.075);
        normalized.ewsSeats = Math.ceil(normalized.totalSeats * 0.1);
        
        return normalized;
    }

    extractCityFromCollegeName(collegeName) {
        if (!collegeName) return '';
        
        // Try to extract city from college name
        const cityPatterns = [
            /,\s*([^,]+?)(?:\s*,|\s*$)/,  // Extract text after last comma
            /in\s+([^,]+?)(?:\s*,|\s*$)/i, // Extract text after "in"
            /at\s+([^,]+?)(?:\s*,|\s*$)/i  // Extract text after "at"
        ];
        
        for (const pattern of cityPatterns) {
            const match = collegeName.match(pattern);
            if (match && match[1]) {
                return match[1].trim();
            }
        }
        
        return '';
    }

    determineCourseType(courseName) {
        if (!courseName) return 'Undergraduate';
        
        const courseNameLower = courseName.toLowerCase();
        
        if (courseNameLower.includes('mbbs') || courseNameLower.includes('bds')) {
            return 'Undergraduate';
        } else if (courseNameLower.includes('md') || courseNameLower.includes('ms') || 
                   courseNameLower.includes('mds') || courseNameLower.includes('dnb')) {
            return 'Postgraduate';
        }
        
        return 'Postgraduate'; // Default to postgraduate for other courses
    }

    async importRecord(db, record) {
        return new Promise((resolve, reject) => {
            // Check if record already exists
            const checkQuery = `
                SELECT id FROM medical_courses 
                WHERE college_name = ? AND course_name = ? AND academic_year = ?
            `;
            
            db.get(checkQuery, [
                record.collegeName, 
                record.courseName, 
                record.academicYear
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
                            sc_seats = ?, st_seats = ?, ews_seats = ?, updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    `;
                    
                    db.run(updateQuery, [
                        record.state, record.city, record.managementType, record.establishmentYear,
                        record.courseType, record.totalSeats, record.generalSeats, record.obcSeats,
                        record.scSeats, record.stSeats, record.ewsSeats, existing.id
                    ], function(err) {
                        if (err) reject(err);
                        else {
                            this.importStats.updatedRecords++;
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
        console.log('\n📊 Real Medical Data Import Report');
        console.log('====================================');
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
        
        console.log('\n🎉 Real medical data import completed successfully!');
    }
}

// Run if called directly
if (require.main === module) {
    const importer = new RealMedicalDataImporter();
    
    // Check if file path is provided
    const filePath = process.argv[2];
    if (!filePath) {
        console.error('❌ Please provide the Excel file path:');
        console.error('   node import-real-medical-data.js <excel-file-path>');
        process.exit(1);
    }
    
    importer.importFromExcel(filePath)
        .then(() => {
            console.log('\n✅ Real medical data import completed successfully!');
        })
        .catch(error => {
            console.error('\n❌ Import failed:', error.message);
            process.exit(1);
        });
}

module.exports = { RealMedicalDataImporter };
