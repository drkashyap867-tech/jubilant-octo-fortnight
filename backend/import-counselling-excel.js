const sqlite3 = require('sqlite3').verbose();
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

class CounsellingExcelImporter {
    constructor() {
        this.dataDir = path.join(__dirname, 'data');
        this.counsellingDbPath = path.join(this.dataDir, 'counselling.db');
        this.backupDir = path.join(this.dataDir, 'imports', 'counselling');
        
        // Create backup directory
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
    }

    async importCounsellingData(excelFilePath) {
        try {
            console.log('🎯 Starting Counselling Excel Import...\n');
            
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
            
            console.log('\n🎉 Counselling Excel Import Completed Successfully!');
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
            console.error('❌ Counselling Excel Import Failed:', error);
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
            'type_code': ['type_code', 'counselling_type', 'type', 'code', 'counselling_code'],
            'name': ['name', 'counselling_name', 'type_name', 'description', 'title'],
            'description': ['description', 'details', 'info', 'about', 'summary'],
            'quota_type': ['quota_type', 'quota', 'category_type', 'type_category'],
            'authority': ['authority', 'authority_name', 'governing_body', 'organization', 'body'],
            'website': ['website', 'web_site', 'url', 'web_address', 'site'],
            'contact_info': ['contact_info', 'contact', 'contact_details', 'phone', 'email'],
            'is_active': ['is_active', 'active', 'status', 'enabled', 'available'],
            'search_priority': ['search_priority', 'priority', 'rank', 'order', 'sequence']
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
        const requiredFields = ['type_code', 'name'];
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
        
        // Set default values for missing fields
        if (!processedData.quota_type) {
            processedData.quota_type = 'General';
        }
        if (!processedData.is_active) {
            processedData.is_active = 1;
        }
        if (!processedData.search_priority) {
            processedData.search_priority = 50;
        }
        
        // Add timestamps
        processedData.created_at = new Date().toISOString();
        
        return { isValid: true, data: processedData, errors: [] };
    }

    processFieldValue(fieldName, value) {
        if (value === null || value === undefined || value === '') {
            return null;
        }
        
        const stringValue = String(value).trim();
        
        switch (fieldName) {
            case 'is_active':
                const lowerValue = stringValue.toLowerCase();
                if (['yes', 'true', '1', 'active', 'enabled', 'available'].includes(lowerValue)) {
                    return 1;
                } else if (['no', 'false', '0', 'inactive', 'disabled', 'unavailable'].includes(lowerValue)) {
                    return 0;
                }
                return 1; // Default to active
                
            case 'search_priority':
                const num = parseInt(stringValue);
                return isNaN(num) ? 50 : Math.max(0, Math.min(100, num)); // Clamp between 0-100
                
            case 'quota_type':
                // Normalize quota types
                const quota = stringValue.toLowerCase();
                if (['central', 'centralized', 'all india', 'aiq'].includes(quota)) {
                    return 'Central';
                } else if (['state', 'state level', 'regional'].includes(quota)) {
                    return 'State';
                } else if (['private', 'private college', 'management'].includes(quota)) {
                    return 'Private';
                } else {
                    return stringValue.charAt(0).toUpperCase() + stringValue.slice(1);
                }
                
            default:
                return stringValue;
        }
    }

    async importToDatabase(validData) {
        const db = new sqlite3.Database(this.counsellingDbPath);
        let inserted = 0;
        let updated = 0;
        
        try {
            for (const row of validData) {
                // Check if counselling type already exists (by type_code)
                const existing = await this.runQueryAll(db, 
                    'SELECT id FROM counselling_types WHERE type_code = ?', 
                    [row.type_code]
                );
                
                if (existing.length > 0) {
                    // Update existing record
                    await this.runQuery(db, `
                        UPDATE counselling_types SET 
                            name = ?, normalized_name = ?, description = ?, quota_type = ?,
                            authority = ?, website = ?, contact_info = ?, is_active = ?,
                            search_priority = ?
                        WHERE type_code = ?
                    `, [
                        row.name, row.normalized_name, row.description, row.quota_type,
                        row.authority, row.website, row.contact_info, row.is_active,
                        row.search_priority, row.type_code
                    ]);
                    updated++;
                } else {
                    // Insert new record
                    await this.runQuery(db, `
                        INSERT INTO counselling_types (
                            type_code, name, normalized_name, description, quota_type,
                            authority, website, contact_info, is_active, search_priority
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        row.type_code, row.name, row.normalized_name, row.description,
                        row.quota_type, row.authority, row.website, row.contact_info,
                        row.is_active, row.search_priority
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
COUNSELLING EXCEL IMPORT REPORT
===============================

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
- Required fields checked: type_code, name
- Data type validation: is_active (boolean), search_priority (0-100)
- Text normalization: names
- Quota type normalization: Central, State, Private
- Duplicate detection: by type_code

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
    const importer = new CounsellingExcelImporter();
    
    if (process.argv.length < 3) {
        console.log('Usage: node import-counselling-excel.js <excel-file-path>');
        console.log('Example: node import-counselling-excel.js ./data/imports/counselling.xlsx');
        process.exit(1);
    }
    
    const excelFilePath = process.argv[2];
    importer.importCounsellingData(excelFilePath)
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

module.exports = { CounsellingExcelImporter };
