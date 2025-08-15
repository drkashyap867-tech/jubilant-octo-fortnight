const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class PrecisionDataPolisher {
    constructor() {
        this.counsellingDbPath = path.join(__dirname, 'data/counselling.db');
        this.polishingResults = {
            totalRecords: 0,
            polishedRecords: 0,
            errors: [],
            typeResults: {
                aiq_pg: { total: 0, polished: 0 },
                aiq_ug: { total: 0, polished: 0 },
                kea: { total: 0, polished: 0 }
            }
        };
    }

    async polishAllData() {
        console.log('✨ PRECISION DATA POLISHING - FINAL FORMATTING PERFECTION');
        console.log('==========================================================');
        
        try {
            // Step 1: Analyze current formatting issues
            await this.analyzeFormattingIssues();
            
            // Step 2: Polish AIQ_PG data
            await this.polishAIQPGData();
            
            // Step 3: Polish AIQ_UG data
            await this.polishAIQUGData();
            
            // Step 4: Polish KEA data
            await this.polishKEAData();
            
            // Step 5: Final verification
            await this.finalVerification();
            
            // Step 6: Print comprehensive summary
            this.printPolishingSummary();
            
        } catch (error) {
            console.error('❌ Precision polishing failed:', error.message);
            this.polishingResults.errors.push(error.message);
        }
    }

    async analyzeFormattingIssues() {
        console.log('\n🔍 ANALYZING CURRENT FORMATTING ISSUES...');
        
        const db = new sqlite3.Database(this.counsellingDbPath);
        
        try {
            // Count records by type
            this.polishingResults.typeResults.aiq_pg.total = await this.getRecordCount(db, `
                SELECT COUNT(*) FROM counselling_data WHERE counselling_type_id = 1
            `);
            
            this.polishingResults.typeResults.aiq_ug.total = await this.getRecordCount(db, `
                SELECT COUNT(*) FROM counselling_data WHERE counselling_type_id = 2
            `);
            
            this.polishingResults.typeResults.kea.total = await this.getRecordCount(db, `
                SELECT COUNT(*) FROM counselling_data WHERE counselling_type_id = 3
            `);
            
            this.polishingResults.totalRecords = this.polishingResults.typeResults.aiq_pg.total + 
                                               this.polishingResults.typeResults.aiq_ug.total + 
                                               this.polishingResults.typeResults.kea.total;
            
            // Show examples of current issues
            console.log('📊 CURRENT FORMATTING ANALYSIS:');
            console.log(`  AIQ_PG records: ${this.polishingResults.typeResults.aiq_pg.total}`);
            console.log(`  AIQ_UG records: ${this.polishingResults.typeResults.aiq_ug.total}`);
            console.log(`  KEA records: ${this.polishingResults.typeResults.kea.total}`);
            console.log(`  Total records: ${this.polishingResults.totalRecords}`);
            
            // Show examples of duplicate college names
            const duplicateExamples = await this.getDuplicateCollegeExamples(db);
            if (duplicateExamples.length > 0) {
                console.log('\n🔍 EXAMPLES OF DUPLICATE COLLEGE NAMES:');
                duplicateExamples.slice(0, 3).forEach((example, index) => {
                    console.log(`  ${index + 1}. ${example.college_name}`);
                });
            }
            
        } finally {
            db.close();
        }
    }

    async getDuplicateCollegeExamples(db) {
        return new Promise((resolve, reject) => {
            db.all(`
                SELECT DISTINCT college_name 
                FROM counselling_data 
                WHERE college_name LIKE '%,%,%' 
                LIMIT 5
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async polishAIQPGData() {
        console.log('\n✨ POLISHING AIQ_PG DATA...');
        
        const db = new sqlite3.Database(this.counsellingDbPath);
        
        try {
            // Begin transaction
            await this.runQuery(db, 'BEGIN TRANSACTION');
            
            // Get all AIQ_PG records
            const records = await this.getAllRecords(db, 1);
            console.log(`📊 Processing ${records.length} AIQ_PG records...`);
            
            for (let i = 0; i < records.length; i++) {
                const record = records[i];
                
                try {
                    // Polish each field
                    const polishedCollege = this.polishCollegeName(record.college_name);
                    const polishedCourse = this.polishCourseName(record.course_name);
                    const polishedQuota = this.polishQuota(record.quota);
                    const polishedCategory = this.polishCategory(record.category);
                    
                    // Update record
                    await this.runQuery(db, `
                        UPDATE counselling_data 
                        SET college_name = ?, course_name = ?, quota = ?, category = ?, updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    `, [polishedCollege, polishedCourse, polishedQuota, polishedCategory, record.id]);
                    
                    this.polishingResults.typeResults.aiq_pg.polished++;
                    this.polishingResults.polishedRecords++;
                    
                    if ((i + 1) % 1000 === 0) {
                        console.log(`📊 AIQ_PG Progress: ${i + 1}/${records.length} records polished`);
                    }
                    
                } catch (error) {
                    this.polishingResults.errors.push(`Failed to polish AIQ_PG record ${record.id}: ${error.message}`);
                }
            }
            
            // Commit transaction
            await this.runQuery(db, 'COMMIT');
            console.log('✅ AIQ_PG data polished successfully');
            
        } catch (error) {
            await this.runQuery(db, 'ROLLBACK');
            throw error;
        } finally {
            db.close();
        }
    }

    async polishAIQUGData() {
        console.log('\n✨ POLISHING AIQ_UG DATA...');
        
        const db = new sqlite3.Database(this.counsellingDbPath);
        
        try {
            // Begin transaction
            await this.runQuery(db, 'BEGIN TRANSACTION');
            
            // Get all AIQ_UG records
            const records = await this.getAllRecords(db, 2);
            console.log(`📊 Processing ${records.length} AIQ_UG records...`);
            
            for (let i = 0; i < records.length; i++) {
                const record = records[i];
                
                try {
                    // Polish each field
                    const polishedCollege = this.polishCollegeName(record.college_name);
                    const polishedCourse = this.polishCourseName(record.course_name);
                    const polishedQuota = this.polishQuota(record.quota);
                    const polishedCategory = this.polishCategory(record.category);
                    
                    // Update record
                    await this.runQuery(db, `
                        UPDATE counselling_data 
                        SET college_name = ?, course_name = ?, quota = ?, category = ?, updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    `, [polishedCollege, polishedCourse, polishedQuota, polishedCategory, record.id]);
                    
                    this.polishingResults.typeResults.aiq_ug.polished++;
                    this.polishingResults.polishedRecords++;
                    
                    if ((i + 1) % 1000 === 0) {
                        console.log(`📊 AIQ_UG Progress: ${i + 1}/${records.length} records polished`);
                    }
                    
                } catch (error) {
                    this.polishingResults.errors.push(`Failed to polish AIQ_UG record ${record.id}: ${error.message}`);
                }
            }
            
            // Commit transaction
            await this.runQuery(db, 'COMMIT');
            console.log('✅ AIQ_UG data polished successfully');
            
        } catch (error) {
            await this.runQuery(db, 'ROLLBACK');
            throw error;
        } finally {
            db.close();
        }
    }

    async polishKEAData() {
        console.log('\n✨ POLISHING KEA DATA...');
        
        const db = new sqlite3.Database(this.counsellingDbPath);
        
        try {
            // Begin transaction
            await this.runQuery(db, 'BEGIN TRANSACTION');
            
            // Get all KEA records
            const records = await this.getAllRecords(db, 3);
            console.log(`📊 Processing ${records.length} KEA records...`);
            
            for (let i = 0; i < records.length; i++) {
                const record = records[i];
                
                try {
                    // Polish each field
                    const polishedCollege = this.polishCollegeName(record.college_name);
                    const polishedCourse = this.polishCourseName(record.course_name);
                    const polishedQuota = this.polishQuota(record.quota);
                    const polishedCategory = this.polishCategory(record.category);
                    
                    // Update record
                    await this.runQuery(db, `
                        UPDATE counselling_data 
                        SET college_name = ?, course_name = ?, quota = ?, category = ?, updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    `, [polishedCollege, polishedCourse, polishedQuota, polishedCategory, record.id]);
                    
                    this.polishingResults.typeResults.kea.polished++;
                    this.polishingResults.polishedRecords++;
                    
                    if ((i + 1) % 1000 === 0) {
                        console.log(`📊 KEA Progress: ${i + 1}/${records.length} records polished`);
                    }
                    
                } catch (error) {
                    this.polishingResults.errors.push(`Failed to polish KEA record ${record.id}: ${error.message}`);
                }
            }
            
            // Commit transaction
            await this.runQuery(db, 'COMMIT');
            console.log('✅ KEA data polished successfully');
            
        } catch (error) {
            await this.runQuery(db, 'ROLLBACK');
            throw error;
        } finally {
            db.close();
        }
    }

    polishCollegeName(college) {
        if (typeof college === 'string') {
            // Remove duplicate text patterns
            let cleaned = college;
            
            // Handle patterns like "COLLEGE,, NEW DELHI,COLLEGE,, NEW DELHI"
            if (cleaned.includes(',,') && cleaned.includes(',')) {
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
            
            // Remove extra spaces and normalize
            cleaned = cleaned.replace(/\s+/g, ' ').trim();
            
            // Remove trailing commas
            cleaned = cleaned.replace(/,\s*$/, '');
            
            return cleaned;
        }
        return college;
    }

    polishCourseName(course) {
        if (typeof course === 'string') {
            // Fix spacing issues in course names
            let cleaned = course;
            
            // Fix "M.D. (RADIO- DIAGNOSIS)" -> "M.D. (RADIO-DIAGNOSIS)"
            cleaned = cleaned.replace(/\(\s*([^)]+)\s*\)/g, (match, content) => {
                return `(${content.replace(/\s+/g, '')})`;
            });
            
            // Remove extra spaces and normalize
            cleaned = cleaned.replace(/\s+/g, ' ').trim();
            
            return cleaned;
        }
        return course;
    }

    polishQuota(quota) {
        if (typeof quota === 'string') {
            // Remove extra spaces and normalize
            return quota.replace(/\s+/g, ' ').trim();
        }
        return quota;
    }

    polishCategory(category) {
        if (typeof category === 'string') {
            // Remove extra spaces and normalize
            return category.replace(/\s+/g, ' ').trim();
        }
        return category;
    }

    async getAllRecords(db, counsellingTypeId) {
        return new Promise((resolve, reject) => {
            db.all(`
                SELECT id, college_name, course_name, quota, category
                FROM counselling_data 
                WHERE counselling_type_id = ?
            `, [counsellingTypeId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async finalVerification() {
        console.log('\n🔍 FINAL VERIFICATION OF ALL POLISHING...');
        
        const db = new sqlite3.Database(this.counsellingDbPath);
        
        try {
            // Show final counts
            const finalAIQPG = await this.getRecordCount(db, `SELECT COUNT(*) FROM counselling_data WHERE counselling_type_id = 1`);
            const finalAIQUG = await this.getRecordCount(db, `SELECT COUNT(*) FROM counselling_data WHERE counselling_type_id = 2`);
            const finalKEA = await this.getRecordCount(db, `SELECT COUNT(*) FROM counselling_data WHERE counselling_type_id = 3`);
            
            console.log('\n📊 FINAL RECORD COUNTS:');
            console.log(`  AIQ_PG: ${finalAIQPG} records`);
            console.log(`  AIQ_UG: ${finalAIQUG} records`);
            console.log(`  KEA: ${finalKEA} records`);
            console.log(`  Total: ${finalAIQPG + finalAIQUG + finalKEA} records`);
            
            // Show polished examples
            console.log('\n✨ POLISHED DATA EXAMPLES:');
            const polishedExamples = await this.getPolishedExamples(db);
            polishedExamples.forEach((example, index) => {
                console.log(`  ${index + 1}. ${example.college_name} | ${example.course_name}`);
            });
            
        } finally {
            db.close();
        }
    }

    async getPolishedExamples(db) {
        return new Promise((resolve, reject) => {
            db.all(`
                SELECT college_name, course_name 
                FROM counselling_data 
                WHERE counselling_type_id = 1 
                LIMIT 3
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
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

    printPolishingSummary() {
        console.log('\n📊 PRECISION DATA POLISHING SUMMARY');
        console.log('====================================');
        console.log(`📁 Total records processed: ${this.polishingResults.totalRecords}`);
        console.log(`✨ Total records polished: ${this.polishingResults.polishedRecords}`);
        console.log(`❌ Errors: ${this.polishingResults.errors.length}`);
        
        console.log('\n🔧 POLISHING RESULTS BY TYPE:');
        console.log(`  AIQ_PG: ${this.polishingResults.typeResults.aiq_pg.polished}/${this.polishingResults.typeResults.aiq_pg.total} polished`);
        console.log(`  AIQ_UG: ${this.polishingResults.typeResults.aiq_ug.polished}/${this.polishingResults.typeResults.aiq_ug.total} polished`);
        console.log(`  KEA: ${this.polishingResults.typeResults.kea.polished}/${this.polishingResults.typeResults.kea.total} polished`);
        
        if (this.polishingResults.errors.length > 0) {
            console.log('\n❌ ERRORS ENCOUNTERED:');
            this.polishingResults.errors.forEach((error, index) => {
                console.log(`  ${index + 1}. ${error}`);
            });
        }
        
        if (this.polishingResults.polishedRecords === this.polishingResults.totalRecords) {
            console.log('\n🎉 ALL DATA SUCCESSFULLY POLISHED TO PERFECTION! 🎉');
        } else {
            console.log(`\n⚠️ ${this.polishingResults.totalRecords - this.polishingResults.polishedRecords} records failed to polish`);
        }
    }
}

// Run if called directly
if (require.main === module) {
    const polisher = new PrecisionDataPolisher();
    polisher.polishAllData()
        .then(() => {
            console.log('\n✅ Precision data polishing complete!');
        })
        .catch(error => {
            console.error('\n❌ Precision data polishing failed:', error.message);
        });
}

module.exports = { PrecisionDataPolisher };
