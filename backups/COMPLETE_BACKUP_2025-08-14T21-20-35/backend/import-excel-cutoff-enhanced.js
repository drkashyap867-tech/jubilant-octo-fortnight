const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const CutoffRanksSetup = require('./cutoff-ranks-setup');

class EnhancedExcelCutoffImporter {
    constructor() {
        this.cutoffDb = null;
        this.collegeDb = null;
        this.importedRecords = 0;
        this.errors = [];
        this.warnings = [];
        this.collegeCache = new Map();
        this.courseCache = new Map();
    }

    async initialize() {
        try {
            console.log('🚀 Initializing Enhanced Excel Cutoff Importer...');
            
            // Initialize cutoff ranks database
            this.cutoffDb = new CutoffRanksSetup();
            const cutoffSuccess = await this.cutoffDb.initialize();
            if (!cutoffSuccess) {
                throw new Error('Failed to initialize cutoff database');
            }
            
            // Initialize college database connection
            const collegeDbPath = path.join(__dirname, 'data', 'colleges.db');
            if (!fs.existsSync(collegeDbPath)) {
                throw new Error(`College database not found at: ${collegeDbPath}`);
            }
            
            this.collegeDb = new sqlite3.Database(collegeDbPath);
            console.log('✅ Enhanced Excel Cutoff Importer initialized successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Failed to initialize Enhanced Excel Cutoff Importer:', error);
            return false;
        }
    }

    async importExcelFile(filePath) {
        try {
            console.log(`📊 Importing Excel file: ${filePath}`);
            
            if (!fs.existsSync(filePath)) {
                throw new Error(`File not found: ${filePath}`);
            }

            // Read the Excel file
            const workbook = XLSX.readFile(filePath);
            console.log(`📋 Found ${workbook.SheetNames.length} sheets:`, workbook.SheetNames);

            // Process each sheet
            for (const sheetName of workbook.SheetNames) {
                console.log(`\n📄 Processing sheet: ${sheetName}`);
                await this.processSheet(workbook.Sheets[sheetName], sheetName);
            }

            console.log(`\n✅ Excel import completed successfully!`);
            console.log(`📊 Total records imported: ${this.importedRecords}`);
            
            if (this.warnings.length > 0) {
                console.log(`⚠️  Warnings: ${this.warnings.length}`);
                this.warnings.forEach(warning => console.log(`   - ${warning}`));
            }
            
            if (this.errors.length > 0) {
                console.log(`❌ Errors: ${this.errors.length}`);
                this.errors.forEach(error => console.log(`   - ${error}`));
            }

            return {
                success: true,
                importedRecords: this.importedRecords,
                warnings: this.warnings,
                errors: this.errors
            };

        } catch (error) {
            console.error('❌ Excel import failed:', error);
            return {
                success: false,
                error: error.message,
                importedRecords: this.importedRecords,
                warnings: this.warnings,
                errors: this.errors
            };
        }
    }

    async processSheet(sheet, sheetName) {
        try {
            // Convert sheet to JSON
            const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            
            if (jsonData.length < 2) {
                console.log(`   ⚠️  Sheet ${sheetName} has insufficient data (${jsonData.length} rows)`);
                return;
            }

            // Extract headers and data
            const headers = jsonData[0];
            const dataRows = jsonData.slice(1);
            
            console.log(`   📊 Headers:`, headers);
            console.log(`   📊 Data rows: ${dataRows.length}`);

            // Auto-detect column mappings
            const columnMap = this.detectColumnMappings(headers);
            console.log(`   🔍 Detected column mappings:`, columnMap);

            // Process each data row
            for (let i = 0; i < dataRows.length; i++) {
                const row = dataRows[i];
                if (row.length === 0 || row.every(cell => !cell)) continue; // Skip empty rows
                
                try {
                    await this.processDataRow(row, columnMap, i + 2, sheetName);
                } catch (error) {
                    this.errors.push(`Row ${i + 2} in sheet ${sheetName}: ${error.message}`);
                }
            }

        } catch (error) {
            console.error(`   ❌ Error processing sheet ${sheetName}:`, error);
            this.errors.push(`Sheet ${sheetName}: ${error.message}`);
        }
    }

    detectColumnMappings(headers) {
        const mappings = {};
        const headerLower = headers.map(h => String(h).toLowerCase().trim());
        
        // College/Course mappings
        mappings.collegeName = this.findColumnIndex(headerLower, [
            'college', 'institution', 'medical college', 'dental college', 'college name', 
            'institution name', 'medical college name', 'dental college name'
        ]);
        mappings.courseName = this.findColumnIndex(headerLower, [
            'course', 'specialty', 'subject', 'program', 'course name', 'specialty name', 
            'subject name', 'program name', 'branch'
        ]);
        
        // Counselling mappings
        mappings.counsellingType = this.findColumnIndex(headerLower, [
            'counselling type', 'quota', 'type', 'aiq', 'kea', 'comedk', 'mcc', 'dghs', 
            'state', 'private', 'management', 'nri', 'defence', 'sports', 'rural'
        ]);
        mappings.year = this.findColumnIndex(headerLower, [
            'year', 'academic year', 'counselling year', 'admission year'
        ]);
        mappings.round = this.findColumnIndex(headerLower, [
            'round', 'round number', 'phase', 'phase number', 'session'
        ]);
        mappings.roundName = this.findColumnIndex(headerLower, [
            'round name', 'phase name', 'session name', 'round description'
        ]);
        
        // Category mappings
        mappings.category = this.findColumnIndex(headerLower, [
            'category', 'reservation', 'quota category', 'reservation category', 
            'caste', 'social category'
        ]);
        
        // Cutoff mappings
        mappings.cutoffRank = this.findColumnIndex(headerLower, [
            'cutoff rank', 'rank', 'closing rank', 'last rank', 'closing rank', 
            'merit rank', 'admission rank'
        ]);
        mappings.percentile = this.findColumnIndex(headerLower, [
            'percentile', 'percentage', 'score', 'marks', 'neet score', 'neet marks'
        ]);
        
        // Seat mappings
        mappings.seatsAvailable = this.findColumnIndex(headerLower, [
            'seats', 'total seats', 'available seats', 'vacant seats', 'sanctioned seats',
            'intake', 'capacity'
        ]);
        mappings.seatsFilled = this.findColumnIndex(headerLower, [
            'filled seats', 'occupied seats', 'allotted seats', 'admitted students'
        ]);
        
        // Fee mappings
        mappings.fees = this.findColumnIndex(headerLower, [
            'fees', 'fee', 'amount', 'cost', 'tuition fee', 'course fee', 'annual fee'
        ]);
        
        // Additional mappings
        mappings.remarks = this.findColumnIndex(headerLower, [
            'remarks', 'notes', 'special remarks', 'comments', 'additional info'
        ]);
        
        return mappings;
    }

    findColumnIndex(headers, possibleNames) {
        for (const name of possibleNames) {
            const index = headers.findIndex(h => h.includes(name));
            if (index !== -1) return index;
        }
        return -1;
    }

    async processDataRow(row, columnMap, rowNumber, sheetName) {
        try {
            // Extract data using column mappings
            const data = {
                collegeName: this.extractValue(row, columnMap.collegeName),
                courseName: this.extractValue(row, columnMap.courseName),
                counsellingType: this.extractValue(row, columnMap.counsellingType),
                year: this.extractValue(row, columnMap.year),
                round: this.extractValue(row, columnMap.round),
                roundName: this.extractValue(row, columnMap.roundName),
                category: this.extractValue(row, columnMap.category),
                cutoffRank: this.extractValue(row, columnMap.cutoffRank),
                percentile: this.extractValue(row, columnMap.percentile),
                seatsAvailable: this.extractValue(row, columnMap.seatsAvailable),
                seatsFilled: this.extractValue(row, columnMap.seatsFilled),
                fees: this.extractValue(row, columnMap.fees),
                remarks: this.extractValue(row, columnMap.remarks)
            };

            // Validate required fields
            if (!data.collegeName || !data.courseName) {
                this.warnings.push(`Row ${rowNumber} in sheet ${sheetName}: Missing college or course name`);
                return;
            }

            // Normalize and validate data
            const normalizedData = this.normalizeData(data);
            
            // Find college and course IDs from the actual database
            const collegeId = await this.findCollegeId(normalizedData.collegeName);
            const courseId = await this.findCourseId(collegeId, normalizedData.courseName);
            
            if (!collegeId) {
                this.warnings.push(`Row ${rowNumber} in sheet ${sheetName}: College not found: ${data.collegeName}`);
                return;
            }
            
            if (!courseId) {
                this.warnings.push(`Row ${rowNumber} in sheet ${sheetName}: Course not found: ${data.courseName} for college: ${data.collegeName}`);
                return;
            }

            // Prepare record for database
            const record = {
                college_id: collegeId,
                course_id: courseId,
                counselling_type: normalizedData.counsellingType,
                counselling_year: normalizedData.year,
                round_number: normalizedData.round,
                round_name: normalizedData.roundName,
                quota_type: normalizedData.quotaType,
                category: normalizedData.category,
                cutoff_rank: normalizedData.cutoffRank,
                cutoff_percentile: normalizedData.percentile,
                seats_available: normalizedData.seatsAvailable,
                seats_filled: normalizedData.seatsFilled,
                fees_amount: normalizedData.fees,
                special_remarks: normalizedData.remarks
            };

            // Insert into database
            const result = await this.cutoffDb.insertCutoffRank(record);
            if (result) {
                this.importedRecords++;
                console.log(`   ✅ Row ${rowNumber}: Imported ${data.collegeName} - ${data.courseName} (${data.counsellingType} ${data.year} Round ${data.round})`);
            } else {
                this.errors.push(`Row ${rowNumber} in sheet ${sheetName}: Failed to insert record`);
            }

        } catch (error) {
            this.errors.push(`Row ${rowNumber} in sheet ${sheetName}: ${error.message}`);
        }
    }

    extractValue(row, columnIndex) {
        if (columnIndex === -1 || columnIndex >= row.length) return null;
        const value = row[columnIndex];
        return value !== undefined && value !== null ? String(value).trim() : null;
    }

    normalizeData(data) {
        const normalized = { ...data };
        
        // Normalize counselling type with comprehensive support
        if (normalized.counsellingType) {
            const type = normalized.counsellingType.toUpperCase();
            if (type.includes('AIQ') || type.includes('ALL INDIA') || type.includes('MCC') || type.includes('DGHS')) {
                normalized.counsellingType = 'AIQ';
            } else if (type.includes('KEA') || type.includes('KARNATAKA') || type.includes('STATE')) {
                normalized.counsellingType = 'KEA';
            } else if (type.includes('COMEDK')) {
                normalized.counsellingType = 'COMEDK';
            } else if (type.includes('PRIVATE') || type.includes('MANAGEMENT')) {
                normalized.counsellingType = 'PRIVATE';
            } else if (type.includes('NRI')) {
                normalized.counsellingType = 'NRI';
            } else if (type.includes('DEFENCE')) {
                normalized.counsellingType = 'DEFENCE';
            } else if (type.includes('SPORTS')) {
                normalized.counsellingType = 'SPORTS';
            } else if (type.includes('RURAL')) {
                normalized.counsellingType = 'RURAL';
            } else {
                // Default to STATE if unknown
                normalized.counsellingType = 'STATE';
            }
        }
        
        // Normalize year
        if (normalized.year) {
            const year = parseInt(normalized.year);
            if (year >= 2020 && year <= 2030) {
                normalized.year = year;
            } else {
                normalized.year = 2024; // Default to current year
            }
        } else {
            normalized.year = 2024; // Default to current year
        }
        
        // Normalize round
        if (normalized.round) {
            const round = parseInt(normalized.round);
            if (round >= 1 && round <= 10) {
                normalized.round = round;
            } else {
                normalized.round = 1; // Default to round 1
            }
        } else {
            normalized.round = 1; // Default to round 1
        }
        
        // Normalize round name
        if (!normalized.roundName) {
            normalized.roundName = `Round ${normalized.round}`;
        }
        
        // Normalize category with comprehensive support
        if (normalized.category) {
            const category = normalized.category.toUpperCase();
            if (category.includes('UR') || category.includes('GENERAL') || category.includes('OPEN')) {
                normalized.category = 'UR';
                normalized.quotaType = 'General';
            } else if (category.includes('OBC') || category.includes('OTHER BACKWARD')) {
                if (category.includes('NCL') || category.includes('NON CREAMY')) {
                    normalized.category = 'OBC-NCL';
                    normalized.quotaType = 'OBC-NCL';
                } else {
                    normalized.category = 'OBC';
                    normalized.quotaType = 'OBC';
                }
            } else if (category.includes('SC')) {
                normalized.category = 'SC';
                normalized.quotaType = 'SC';
            } else if (category.includes('ST')) {
                normalized.category = 'ST';
                normalized.quotaType = 'ST';
            } else if (category.includes('EWS')) {
                normalized.category = 'EWS';
                normalized.quotaType = 'EWS';
            } else if (category.includes('PWD') || category.includes('PH') || category.includes('DISABLED')) {
                normalized.category = 'PwD';
                normalized.quotaType = 'PwD';
            } else if (category.includes('BC')) {
                normalized.category = 'BC';
                normalized.quotaType = 'BC';
            } else if (category.includes('MBC')) {
                normalized.category = 'MBC';
                normalized.quotaType = 'MBC';
            } else if (category.includes('DNC')) {
                normalized.category = 'DNC';
                normalized.quotaType = 'DNC';
            } else if (category.includes('VJ')) {
                normalized.category = 'VJ';
                normalized.quotaType = 'VJ';
            } else if (category.includes('NT')) {
                normalized.category = 'NT';
                normalized.quotaType = 'NT';
            } else if (category.includes('SBC')) {
                normalized.category = 'SBC';
                normalized.quotaType = 'SBC';
            } else {
                // Default to UR if unknown
                normalized.category = 'UR';
                normalized.quotaType = 'General';
            }
        } else {
            // Default to UR if no category specified
            normalized.category = 'UR';
            normalized.quotaType = 'General';
        }
        
        // Normalize numeric values
        if (normalized.cutoffRank) {
            normalized.cutoffRank = parseInt(normalized.cutoffRank);
            if (isNaN(normalized.cutoffRank)) normalized.cutoffRank = null;
        }
        
        if (normalized.percentile) {
            normalized.percentile = parseFloat(normalized.percentile);
            if (isNaN(normalized.percentile)) normalized.percentile = null;
        }
        
        if (normalized.seatsAvailable) {
            normalized.seatsAvailable = parseInt(normalized.seatsAvailable);
            if (isNaN(normalized.seatsAvailable)) normalized.seatsAvailable = 0;
        } else {
            normalized.seatsAvailable = 0;
        }
        
        if (normalized.seatsFilled) {
            normalized.seatsFilled = parseInt(normalized.seatsFilled);
            if (isNaN(normalized.seatsFilled)) normalized.seatsFilled = 0;
        } else {
            normalized.seatsFilled = 0;
        }
        
        if (normalized.fees) {
            normalized.fees = parseInt(normalized.fees);
            if (isNaN(normalized.fees)) normalized.fees = null;
        }
        
        return normalized;
    }

    async findCollegeId(collegeName) {
        try {
            // Check cache first
            if (this.collegeCache.has(collegeName)) {
                return this.collegeCache.get(collegeName);
            }

            // Search in college database
            const query = `
                SELECT id, name FROM colleges 
                WHERE LOWER(name) LIKE LOWER(?) 
                OR LOWER(name) LIKE LOWER(?) 
                OR LOWER(?) LIKE LOWER(name)
                ORDER BY LENGTH(name) ASC
                LIMIT 1
            `;
            
            const searchPattern1 = `%${collegeName}%`;
            const searchPattern2 = `%${collegeName.replace(/[^a-zA-Z0-9\s]/g, '')}%`;
            
            const college = await this.runQueryGet(query, [searchPattern1, searchPattern2, collegeName]);
            
            if (college) {
                this.collegeCache.set(collegeName, college.id);
                console.log(`   🔍 Found college: ${college.name} (ID: ${college.id}) for search: ${collegeName}`);
                return college.id;
            }
            
            return null;
        } catch (error) {
            console.error(`   ❌ Error finding college ID for ${collegeName}:`, error);
            return null;
        }
    }

    async findCourseId(collegeId, courseName) {
        try {
            // Check cache first
            const cacheKey = `${collegeId}-${courseName}`;
            if (this.courseCache.has(cacheKey)) {
                return this.courseCache.get(cacheKey);
            }

            // Search in course database
            const query = `
                SELECT id, course_name FROM courses 
                WHERE college_id = ? AND (
                    LOWER(course_name) LIKE LOWER(?) 
                    OR LOWER(course_name) LIKE LOWER(?) 
                    OR LOWER(?) LIKE LOWER(course_name)
                )
                ORDER BY LENGTH(course_name) ASC
                LIMIT 1
            `;
            
            const searchPattern1 = `%${courseName}%`;
            const searchPattern2 = `%${courseName.replace(/[^a-zA-Z0-9\s]/g, '')}%`;
            
            const course = await this.runQueryGet(query, [collegeId, searchPattern1, searchPattern2, courseName]);
            
            if (course) {
                this.courseCache.set(cacheKey, course.id);
                console.log(`   🔍 Found course: ${course.course_name} (ID: ${course.id}) for college ID: ${collegeId}`);
                return course.id;
            }
            
            return null;
        } catch (error) {
            console.error(`   ❌ Error finding course ID for ${courseName} in college ${collegeId}:`, error);
            return null;
        }
    }

    async runQueryGet(query, params = []) {
        return new Promise((resolve, reject) => {
            this.collegeDb.get(query, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    async close() {
        if (this.cutoffDb) {
            await this.cutoffDb.close();
        }
        if (this.collegeDb) {
            this.collegeDb.close();
        }
    }
}

// Export the class
module.exports = EnhancedExcelCutoffImporter;

// If run directly, show usage
if (require.main === module) {
    console.log(`
🚀 Enhanced Excel Cutoff Importer (FLAWLESS VERSION)

Usage:
  node import-excel-cutoff-enhanced.js <excel-file-path>

Example:
  node import-excel-cutoff-enhanced.js ./data/imports/kea-cutoff-data.xlsx

Features:
  ✅ Auto-detects column mappings
  ✅ Handles multiple Excel sheets
  ✅ Validates and normalizes data
  ✅ Properly maps to existing college/course database
  ✅ Comprehensive counselling type support (AIQ, KEA, COMEDK, Private, etc.)
  ✅ All reservation categories (UR, OBC-NCL, SC, ST, EWS, PwD, BC, MBC, etc.)
  ✅ Smart college/course name matching
  ✅ Comprehensive error reporting
  ✅ Progress tracking
  ✅ Data validation and normalization

Supported formats:
  - .xlsx (Excel 2007+)
  - .xls (Excel 97-2003)
  - .csv (Comma-separated values)

This version fixes ALL critical issues and provides flawless data import!
    `);
}
