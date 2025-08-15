const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class KEA2024MedicalR1Importer {
    constructor() {
        this.dataDir = path.join(__dirname, 'data');
        this.counsellingDbPath = path.join(this.dataDir, 'counselling.db');
        this.excelPath = path.join(__dirname, '../counselling_data/KEA_2024/KEA_2024_MEDICAL_R1.xlsx');
        this.importStats = {
            totalRows: 0,
            importedRecords: 0,
            skippedRecords: 0,
            errors: []
        };
    }

    async importKEA2024MedicalR1() {
        console.log('🚀 IMPORTING KEA_2024_MEDICAL_R1.xlsx - INDIVIDUAL FILE IMPORT...');
        
        try {
            // Read Excel file
            const workbook = XLSX.readFile(this.excelPath);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            const headers = excelData[0];
            const excelRows = excelData.slice(1);
            
            console.log(`📊 Total Excel rows: ${excelRows.length}`);
            console.log(`📋 Headers: ${headers.join(', ')}`);
            
            this.importStats.totalRows = excelRows.length;
            
            // Connect to database
            const db = new sqlite3.Database(this.counsellingDbPath);
            
            // Get counselling type ID for KEA
            const counsellingTypeId = await this.getCounsellingTypeId(db, 'KEA');
            
            // Get counselling round ID for Round 1
            const counsellingRoundId = await this.getCounsellingRoundId(db, 1);
            
            console.log(`🔗 Counselling Type ID: ${counsellingTypeId} (KEA)`);
            console.log(`🔗 Counselling Round ID: ${counsellingRoundId} (Round 1)`);
            
            // Process each row
            for (let i = 0; i < excelRows.length; i++) {
                const row = excelRows[i];
                
                try {
                    // Map Excel columns to database fields (KEA structure is different)
                    const record = {
                        allIndiaRank: row[0] || null,
                        quota: 'STATE', // KEA is state quota
                        collegeName: row[1] || '',
                        courseName: row[2] || '',
                        category: row[3] || '',
                        cutoffRank: row[0] || null, // ALL INDIA RANK is the cutoff rank
                        seats: 1, // Default to 1 seat per record
                        fees: 0, // Default to 0 (not provided in this file)
                        counsellingTypeId: counsellingTypeId,
                        counsellingRoundId: counsellingRoundId,
                        academicYear: '2024-25'
                    };
                    
                    // Skip if critical fields are missing
                    if (!record.collegeName || !record.courseName || !record.category) {
                        this.importStats.skippedRecords++;
                        continue;
                    }
                    
                    // Import the record
                    await this.importCounsellingRecord(db, record);
                    this.importStats.importedRecords++;
                    
                    // Progress indicator
                    if ((i + 1) % 500 === 0) {
                        console.log(`📊 Processed ${i + 1}/${excelRows.length} rows...`);
                    }
                    
                } catch (error) {
                    console.error(`❌ Error processing row ${i + 2}:`, error.message);
                    this.importStats.errors.push(`Row ${i + 2}: ${error.message}`);
                }
            }
            
            // Verify import
            await this.verifyImport(db);
            
            db.close();
            
        } catch (error) {
            console.error('❌ Import failed:', error.message);
            this.importStats.errors.push(error.message);
        }
        
        this.printImportSummary();
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
            'KEA'
        ]);
    }

    async getCounsellingTypeId(db, counsellingType) {
        return new Promise((resolve, reject) => {
            db.get(
                'SELECT id FROM counselling_types WHERE type_code = ?',
                [counsellingType],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row ? row.id : 3); // KEA is ID 3
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

    async verifyImport(db) {
        console.log('🔍 Verifying import...');
        
        const counsellingDataCount = await this.getRecordCount(db, 'counselling_data');
        const counsellingFtsCount = await this.getRecordCount(db, 'counselling_fts');
        
        console.log(`📊 Counselling data records: ${counsellingDataCount}`);
        console.log(`📊 Counselling FTS records: ${counsellingFtsCount}`);
        
        // Verify data integrity
        if (counsellingDataCount >= this.importStats.importedRecords) {
            console.log('✅ Data integrity verified - import successful!');
        } else {
            console.log('❌ Data integrity issue detected!');
        }
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

    printImportSummary() {
        console.log('\n📊 IMPORT SUMMARY FOR KEA_2024_MEDICAL_R1.xlsx:');
        console.log('=====================================');
        console.log(`📊 Total Excel rows: ${this.importStats.totalRows}`);
        console.log(`✅ Imported records: ${this.importStats.importedRecords}`);
        console.log(`⏭️ Skipped records: ${this.importStats.skippedRecords}`);
        console.log(`❌ Errors: ${this.importStats.errors.length}`);
        
        if (this.importStats.errors.length > 0) {
            console.log('\n❌ Errors encountered:');
            this.importStats.errors.slice(0, 5).forEach(error => console.log(`  - ${error}`));
            if (this.importStats.errors.length > 5) {
                console.log(`  ... and ${this.importStats.errors.length - 5} more errors`);
            }
        }
        
        if (this.importStats.importedRecords === this.importStats.totalRows - this.importStats.skippedRecords) {
            console.log('\n🎉 PERFECT! ZERO DISCREPANCIES ACHIEVED!');
        } else {
            console.log('\n⚠️ Some discrepancies detected - need to investigate');
        }
    }
}

// Run if called directly
if (require.main === module) {
    const importer = new KEA2024MedicalR1Importer();
    importer.importKEA2024MedicalR1()
        .then(() => {
            console.log('\n✅ KEA_2024_MEDICAL_R1 import complete!');
        })
        .catch(error => {
            console.error('\n❌ KEA_2024_MEDICAL_R1 import failed:', error.message);
        });
}

module.exports = { KEA2024MedicalR1Importer };
