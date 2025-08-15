const sqlite3 = require('sqlite3').verbose();
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

class CollegeExcelImporter {
    constructor() {
        this.dataDir = path.join(__dirname, 'data');
        this.collegeDbPath = path.join(this.dataDir, 'colleges.db');
        this.backupDir = path.join(this.dataDir, 'imports', 'college');
        
        // Create backup directory
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
    }

    async importCollegeData(excelFilePath) {
        try {
            console.log('🏫 Starting College Excel Import...\n');
            
            // Step 1: Validate Excel file
            if (!this.validateExcelFile(excelFilePath)) {
                throw new Error('Invalid Excel file');
            }
            
            // Step 2: Read and parse Excel data
            const excelData = await this.readExcelFile(excelFilePath);
            console.log(`   📊 Excel file read: ${excelData.length} rows found`);
            
            // Step 3: Validate column structure
            const columnMapping = this.detectColumnMapping(excelData[0]);
            console.log('   🔍 Column mapping detected:', columnMapping);
            
            // Step 4: Process and validate data
            const processedData = await this.processExcelData(excelData, columnMapping);
            console.log(`   ✅ Data processed: ${processedData.valid.length} valid, ${processedData.invalid.length} invalid`);
            
            // Step 5: Import valid data to database
            const importResults = await this.importToDatabase(processedData.valid);
            console.log(`   📥 Import completed: ${importResults.inserted} inserted, ${importResults.updated} updated`);
            
            // Step 6: Generate import report
            await this.generateImportReport(excelFilePath, processedData, importResults, columnMapping);
            
            console.log('\n🎉 College Excel Import Completed Successfully!');
            return {
                success: true,
                totalRows: excelData.length,
                validRows: processedData.valid.length,
                invalidRows: processedData.invalid.length,
                inserted: importResults.inserted,
                updated: importResults.updated,
                reportPath: path.join(this.backupDir, 'import-report.txt')
            };
            
        } catch (error) {
            console.error('❌ College Excel Import Failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    validateExcelFile(filePath) {
        if (!fs.existsSync(filePath)) {
            console.error('   ❌ Excel file not found:', filePath);
            return false;
        }
        
        const ext = path.extname(filePath).toLowerCase();
        if (!['.xlsx', '.xls', '.csv'].includes(ext)) {
            console.error('   ❌ Invalid file format. Expected: .xlsx, .xls, or .csv');
            return false;
        }
        
        console.log('   ✅ Excel file validated:', path.basename(filePath));
        return true;
    }

    async readExcelFile(filePath) {
        try {
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            // Convert to JSON with header row
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            if (jsonData.length < 2) {
                throw new Error('Excel file must have at least a header row and one data row');
            }
            
            // Separate header and data
            const headers = jsonData[0];
            const dataRows = jsonData.slice(1);
            
            // Convert to array of objects
            const result = dataRows.map(row => {
                const obj = {};
                headers.forEach((header, index) => {
                    if (header && row[index] !== undefined) {
                        obj[header] = row[index];
                    }
                });
                return obj;
            });
            
            return result;
            
        } catch (error) {
            throw new Error(`Failed to read Excel file: ${error.message}`);
        }
    }

    detectColumnMapping(firstRow) {
        const expectedColumns = {
            'name': ['name', 'college_name', 'institution_name', 'college', 'institution'],
            'address': ['address', 'location', 'full_address', 'street_address'],
            'city': ['city', 'city_name', 'location_city'],
            'state': ['state', 'state_name', 'location_state'],
            'pincode': ['pincode', 'pin_code', 'postal_code', 'zip_code'],
            'phone': ['phone', 'phone_number', 'contact_number', 'telephone'],
            'email': ['email', 'email_id', 'email_address'],
            'website': ['website', 'web_site', 'url', 'web_address'],
            'college_type': ['college_type', 'type', 'institution_type', 'category'],
            'affiliation': ['affiliation', 'affiliated_to', 'university', 'board'],
            'established_year': ['established_year', 'year_established', 'founded_year', 'establishment_year'],
            'nirf_rank': ['nirf_rank', 'nirf_ranking', 'ranking', 'rank'],
            'naac_grade': ['naac_grade', 'naac_rating', 'accreditation', 'grade'],
            'facilities': ['facilities', 'infrastructure', 'amenities', 'features']
        };
        
        const mapping = {};
        const firstRowKeys = Object.keys(firstRow);
        
        for (const [expectedKey, possibleNames] of Object.entries(expectedColumns)) {
            for (const possibleName of possibleNames) {
                const foundKey = firstRowKeys.find(key => 
                    key && key.toLowerCase().includes(possibleName.toLowerCase())
                );
                if (foundKey) {
                    mapping[expectedKey] = foundKey;
                    break;
                }
            }
        }
        
        return mapping;
    }

    async processExcelData(excelData, columnMapping) {
        const valid = [];
        const invalid = [];
        
        for (let i = 0; i < excelData.length; i++) {
            const row = excelData[i];
            const rowNumber = i + 2; // +2 because Excel is 1-indexed and we have header
            
            try {
                const processedRow = this.processRow(row, columnMapping, rowNumber);
                if (processedRow.isValid) {
                    valid.push(processedRow.data);
                } else {
                    invalid.push({
                        rowNumber,
                        data: row,
                        errors: processedRow.errors
                    });
                }
            } catch (error) {
                invalid.push({
                    rowNumber,
                    data: row,
                    errors: [`Processing error: ${error.message}`]
                });
            }
        }
        
        return { valid, invalid };
    }

    processRow(row, columnMapping, rowNumber) {
        const errors = [];
        const processedData = {};
        
        // Required fields validation
        const requiredFields = ['name'];
        for (const field of requiredFields) {
            if (!columnMapping[field] || !row[columnMapping[field]]) {
                errors.push(`Missing required field: ${field}`);
            }
        }
        
        if (errors.length > 0) {
            return { isValid: false, errors, data: null };
        }
        
        // Process each field
        for (const [expectedKey, sourceKey] of Object.entries(columnMapping)) {
            if (sourceKey && row[sourceKey] !== undefined) {
                const value = this.processFieldValue(expectedKey, row[sourceKey]);
                processedData[expectedKey] = value;
            }
        }
        
        // Add normalized fields for search
        if (processedData.name) {
            processedData.normalized_name = this.normalizeText(processedData.name);
        }
        if (processedData.city) {
            processedData.normalized_city = this.normalizeText(processedData.city);
        }
        if (processedData.state) {
            processedData.normalized_state = this.normalizeText(processedData.state);
        }
        if (processedData.college_type) {
            processedData.normalized_college_type = this.normalizeText(processedData.college_type);
        }
        
        // Add timestamps
        processedData.created_at = new Date().toISOString();
        processedData.updated_at = new Date().toISOString();
        
        return { isValid: true, data: processedData, errors: [] };
    }

    processFieldValue(fieldName, value) {
        if (value === null || value === undefined || value === '') {
            return null;
        }
        
        const stringValue = String(value).trim();
        
        switch (fieldName) {
            case 'established_year':
            case 'nirf_rank':
                const num = parseInt(stringValue);
                return isNaN(num) ? null : num;
                
            case 'aicte_approval':
            case 'ugc_approval':
            case 'pci_approval':
            case 'mci_approval':
            case 'hostel_available':
            case 'transport_available':
                const lowerValue = stringValue.toLowerCase();
                if (['yes', 'true', '1', 'approved', 'available'].includes(lowerValue)) {
                    return 1;
                } else if (['no', 'false', '0', 'not approved', 'not available'].includes(lowerValue)) {
                    return 0;
                }
                return null;
                
            default:
                return stringValue;
        }
    }

    async importToDatabase(validData) {
        const db = new sqlite3.Database(this.collegeDbPath);
        let inserted = 0;
        let updated = 0;
        
        try {
            for (const row of validData) {
                // Check if college already exists (by name)
                const existing = await this.runQueryAll(db, 
                    'SELECT id FROM colleges WHERE normalized_name = ?', 
                    [row.normalized_name]
                );
                
                if (existing.length > 0) {
                    // Update existing record
                    await this.runQuery(db, `
                        UPDATE colleges SET 
                            address = ?, city = ?, normalized_city = ?, state = ?, normalized_state = ?,
                            pincode = ?, phone = ?, email = ?, website = ?, college_type = ?, 
                            normalized_college_type = ?, affiliation = ?, established_year = ?, 
                            nirf_rank = ?, naac_grade = ?, facilities = ?, updated_at = ?
                        WHERE normalized_name = ?
                    `, [
                        row.address, row.city, row.normalized_city, row.state, row.normalized_state,
                        row.pincode, row.phone, row.email, row.website, row.college_type,
                        row.normalized_college_type, row.affiliation, row.established_year,
                        row.nirf_rank, row.naac_grade, row.facilities, row.updated_at,
                        row.normalized_name
                    ]);
                    updated++;
                } else {
                    // Insert new record
                    await this.runQuery(db, `
                        INSERT INTO colleges (
                            name, normalized_name, address, city, normalized_city, state, normalized_state,
                            pincode, phone, email, website, college_type, normalized_college_type,
                            affiliation, established_year, nirf_rank, naac_grade, facilities
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        row.name, row.normalized_name, row.address, row.city, row.normalized_city,
                        row.state, row.normalized_state, row.pincode, row.phone, row.email,
                        row.website, row.college_type, row.normalized_college_type, row.affiliation,
                        row.established_year, row.nirf_rank, row.naac_grade, row.facilities
                    ]);
                    inserted++;
                }
            }
        } finally {
            db.close();
        }
        
        return { inserted, updated };
    }

    async generateImportReport(excelFilePath, processedData, importResults, columnMapping) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportPath = path.join(this.backupDir, `import-report-${timestamp}.txt`);
        
        const report = `
COLLEGE EXCEL IMPORT REPORT
===========================

Import Date: ${new Date().toLocaleString()}
Excel File: ${path.basename(excelFilePath)}
Report Generated: ${timestamp}

IMPORT SUMMARY:
- Total Rows in Excel: ${processedData.valid.length + processedData.invalid.length}
- Valid Rows: ${processedData.valid.length}
- Invalid Rows: ${processedData.invalid.length}
- Successfully Inserted: ${importResults.inserted}
- Successfully Updated: ${importResults.updated}

COLUMN MAPPING:
${Object.entries(columnMapping).map(([expected, source]) => `- ${expected} → ${source}`).join('\n')}

DATA VALIDATION:
- Required fields checked: name
- Data type validation: established_year, nirf_rank, boolean fields
- Text normalization: names, cities, states, types
- Duplicate detection: by normalized name

INVALID ROWS DETAILS:
${processedData.invalid.map(row => `Row ${row.rowNumber}: ${row.errors.join(', ')}`).join('\n')}

IMPORT STATUS: ${importResults.inserted + importResults.updated > 0 ? 'SUCCESS' : 'FAILED'}
        `;
        
        fs.writeFileSync(reportPath, report.trim());
        console.log(`   📋 Import report generated: ${path.basename(reportPath)}`);
    }

    normalizeText(text) {
        if (!text) return '';
        return text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    async runQuery(db, query, params = []) {
        return new Promise((resolve, reject) => {
            db.run(query, params, function(err) {
                if (err) reject(err);
                else resolve({ lastID: this.lastID, changes: this.changes });
            });
        });
    }

    async runQueryAll(db, query, params = []) {
        return new Promise((resolve, reject) => {
            db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
}

// Run if called directly
if (require.main === module) {
    const importer = new CollegeExcelImporter();
    
    if (process.argv.length < 3) {
        console.log('Usage: node import-college-excel.js <excel-file-path>');
        console.log('Example: node import-college-excel.js ./data/imports/colleges.xlsx');
        process.exit(1);
    }
    
    const excelFilePath = process.argv[2];
    importer.importCollegeData(excelFilePath)
        .then(result => {
            if (result.success) {
                console.log('\n📊 Import Summary:');
                console.log(`   Total Rows: ${result.totalRows}`);
                console.log(`   Valid: ${result.validRows}`);
                console.log(`   Invalid: ${result.invalidRows}`);
                console.log(`   Inserted: ${result.inserted}`);
                console.log(`   Updated: ${result.updated}`);
                console.log(`   Report: ${result.reportPath}`);
            } else {
                console.error('Import failed:', result.error);
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('Import error:', error);
            process.exit(1);
        });
}

module.exports = { CollegeExcelImporter };
