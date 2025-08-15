const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class SuperIntelligentCleaner {
    constructor() {
        this.counsellingDbPath = path.join(__dirname, 'data/counselling.db');
        this.cleaningResults = {
            totalRecords: 0,
            cleanedRecords: 0,
            errors: [],
            typeResults: {
                aiq_pg: { total: 0, cleaned: 0 },
                aiq_ug: { total: 0, cleaned: 0 },
                kea: { total: 0, cleaned: 0 }
            }
        };
    }

    async superCleanAllData() {
        console.log('🧠 SUPER INTELLIGENT DATA CLEANING - FINAL PERFECTION');
        console.log('========================================================');
        
        try {
            // Step 1: Analyze actual duplicate patterns
            await this.analyzeActualDuplicates();
            
            // Step 2: Super clean AIQ_PG data
            await this.superCleanAIQPGData();
            
            // Step 3: Super clean AIQ_UG data
            await this.superCleanAIQUGData();
            
            // Step 4: Super clean KEA data
            await this.superCleanKEAData();
            
            // Step 5: Final verification
            await this.finalVerification();
            
            // Step 6: Print comprehensive summary
            this.printSuperCleaningSummary();
            
        } catch (error) {
            console.error('❌ Super intelligent cleaning failed:', error.message);
            this.cleaningResults.errors.push(error.message);
        }
    }

    async analyzeActualDuplicates() {
        console.log('\n🔍 ANALYZING ACTUAL DUPLICATE PATTERNS...');
        
        const db = new sqlite3.Database(this.counsellingDbPath);
        
        try {
            // Count records by type
            this.cleaningResults.typeResults.aiq_pg.total = await this.getRecordCount(db, `
                SELECT COUNT(*) FROM counselling_data WHERE counselling_type_id = 1
            `);
            
            this.cleaningResults.typeResults.aiq_ug.total = await this.getRecordCount(db, `
                SELECT COUNT(*) FROM counselling_data WHERE counselling_type_id = 2
            `);
            
            this.cleaningResults.typeResults.kea.total = await this.getRecordCount(db, `
                SELECT COUNT(*) FROM counselling_data WHERE counselling_type_id = 3
            `);
            
            this.cleaningResults.totalRecords = this.cleaningResults.typeResults.aiq_pg.total + 
                                               this.cleaningResults.typeResults.aiq_ug.total + 
                                               this.cleaningResults.typeResults.kea.total;
            
            // Show examples of actual duplicates
            console.log('📊 ACTUAL DUPLICATE ANALYSIS:');
            console.log(`  AIQ_PG records: ${this.cleaningResults.typeResults.aiq_pg.total}`);
            console.log(`  AIQ_UG records: ${this.cleaningResults.typeResults.aiq_ug.total}`);
            console.log(`  KEA records: ${this.cleaningResults.typeResults.kea.total}`);
            console.log(`  Total records: ${this.cleaningResults.totalRecords}`);
            
            // Show examples of actual duplicate patterns
            const duplicateExamples = await this.getActualDuplicateExamples(db);
            if (duplicateExamples.length > 0) {
                console.log('\n🔍 EXAMPLES OF ACTUAL DUPLICATE PATTERNS:');
                duplicateExamples.slice(0, 3).forEach((example, index) => {
                    console.log(`  ${index + 1}. ${example.college_name}`);
                });
            }
            
        } finally {
            db.close();
        }
    }

    async getActualDuplicateExamples(db) {
        return new Promise((resolve, reject) => {
            db.all(`
                SELECT DISTINCT college_name 
                FROM counselling_data 
                WHERE college_name LIKE '%%,%%' 
                LIMIT 5
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async superCleanAIQPGData() {
        console.log('\n🧠 SUPER CLEANING AIQ_PG DATA...');
        
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
                    // Super clean each field
                    const superCleanedCollege = this.superCleanCollegeName(record.college_name);
                    const superCleanedCourse = this.superCleanCourseName(record.course_name);
                    const superCleanedQuota = this.superCleanQuota(record.quota);
                    const superCleanedCategory = this.superCleanCategory(record.category);
                    
                    // Update record
                    await this.runQuery(db, `
                        UPDATE counselling_data 
                        SET college_name = ?, course_name = ?, quota = ?, category = ?, updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    `, [superCleanedCollege, superCleanedCourse, superCleanedQuota, superCleanedCategory, record.id]);
                    
                    this.cleaningResults.typeResults.aiq_pg.cleaned++;
                    this.cleaningResults.cleanedRecords++;
                    
                    if ((i + 1) % 1000 === 0) {
                        console.log(`📊 AIQ_PG Progress: ${i + 1}/${records.length} records super cleaned`);
                    }
                    
                } catch (error) {
                    this.cleaningResults.errors.push(`Failed to super clean AIQ_PG record ${record.id}: ${error.message}`);
                }
            }
            
            // Commit transaction
            await this.runQuery(db, 'COMMIT');
            console.log('✅ AIQ_PG data super cleaned successfully');
            
        } catch (error) {
            await this.runQuery(db, 'ROLLBACK');
            throw error;
        } finally {
            db.close();
        }
    }

    async superCleanAIQUGData() {
        console.log('\n🧠 SUPER CLEANING AIQ_UG DATA...');
        
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
                    // Super clean each field
                    const superCleanedCollege = this.superCleanCollegeName(record.college_name);
                    const superCleanedCourse = this.superCleanCourseName(record.course_name);
                    const superCleanedQuota = this.superCleanQuota(record.quota);
                    const superCleanedCategory = this.superCleanCategory(record.category);
                    
                    // Update record
                    await this.runQuery(db, `
                        UPDATE counselling_data 
                        SET college_name = ?, course_name = ?, quota = ?, category = ?, updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    `, [superCleanedCollege, superCleanedCourse, superCleanedQuota, superCleanedCategory, record.id]);
                    
                    this.cleaningResults.typeResults.aiq_ug.cleaned++;
                    this.cleaningResults.cleanedRecords++;
                    
                    if ((i + 1) % 1000 === 0) {
                        console.log(`📊 AIQ_UG Progress: ${i + 1}/${records.length} records super cleaned`);
                    }
                    
                } catch (error) {
                    this.cleaningResults.errors.push(`Failed to super clean AIQ_UG record ${record.id}: ${error.message}`);
                }
            }
            
            // Commit transaction
            await this.runQuery(db, 'COMMIT');
            console.log('✅ AIQ_UG data super cleaned successfully');
            
        } catch (error) {
            await this.runQuery(db, 'ROLLBACK');
            throw error;
        } finally {
            db.close();
        }
    }

    async superCleanKEAData() {
        console.log('\n🧠 SUPER CLEANING KEA DATA...');
        
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
                    // Super clean each field
                    const superCleanedCollege = this.superCleanCollegeName(record.college_name);
                    const superCleanedCourse = this.superCleanCourseName(record.course_name);
                    const superCleanedQuota = this.superCleanQuota(record.quota);
                    const superCleanedCategory = this.superCleanCategory(record.category);
                    
                    // Update record
                    await this.runQuery(db, `
                        UPDATE counselling_data 
                        SET college_name = ?, course_name = ?, quota = ?, category = ?, updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    `, [superCleanedCollege, superCleanedCourse, superCleanedQuota, superCleanedCategory, record.id]);
                    
                    this.cleaningResults.typeResults.kea.cleaned++;
                    this.cleaningResults.cleanedRecords++;
                    
                    if ((i + 1) % 1000 === 0) {
                        console.log(`📊 KEA Progress: ${i + 1}/${records.length} records super cleaned`);
                    }
                    
                } catch (error) {
                    this.cleaningResults.errors.push(`Failed to super clean KEA record ${record.id}: ${error.message}`);
                }
            }
            
            // Commit transaction
            await this.runQuery(db, 'COMMIT');
            console.log('✅ KEA data super cleaned successfully');
            
        } catch (error) {
            await this.runQuery(db, 'ROLLBACK');
            throw error;
        } finally {
            db.close();
        }
    }

    superCleanCollegeName(college) {
        if (typeof college === 'string') {
            let cleaned = college;
            
            // Handle patterns like "COLLEGE,COLLEGE, ADDRESS" -> "COLLEGE, ADDRESS"
            if (cleaned.includes(',') && cleaned.split(',').length > 2) {
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

    superCleanCourseName(course) {
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

    superCleanQuota(quota) {
        if (typeof quota === 'string') {
            // Remove extra spaces and normalize
            return quota.replace(/\s+/g, ' ').trim();
        }
        return quota;
    }

    superCleanCategory(category) {
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
        console.log('\n🔍 FINAL VERIFICATION OF ALL SUPER CLEANING...');
        
        const db = new sqlite3.Database(this.counsellingDbPath);
        
        try {
            // Check remaining actual duplicates
            const remainingDuplicates = await this.getRecordCount(db, `
                SELECT COUNT(*) FROM counselling_data 
                WHERE college_name LIKE '%%,%%'
            `);
            
            if (remainingDuplicates === 0) {
                console.log('✅ ALL ACTUAL DUPLICATES HAVE BEEN ELIMINATED!');
            } else {
                console.log(`⚠️ ${remainingDuplicates} duplicate patterns still remain`);
            }
            
            // Show final counts
            const finalAIQPG = await this.getRecordCount(db, `SELECT COUNT(*) FROM counselling_data WHERE counselling_type_id = 1`);
            const finalAIQUG = await this.getRecordCount(db, `SELECT COUNT(*) FROM counselling_data WHERE counselling_type_id = 2`);
            const finalKEA = await this.getRecordCount(db, `SELECT COUNT(*) FROM counselling_data WHERE counselling_type_id = 3`);
            
            console.log('\n📊 FINAL RECORD COUNTS:');
            console.log(`  AIQ_PG: ${finalAIQPG} records`);
            console.log(`  AIQ_UG: ${finalAIQUG} records`);
            console.log(`  KEA: ${finalKEA} records`);
            console.log(`  Total: ${finalAIQPG + finalAIQUG + finalKEA} records`);
            
            // Show super cleaned examples
            console.log('\n🧠 SUPER CLEANED DATA EXAMPLES:');
            const superCleanedExamples = await this.getSuperCleanedExamples(db);
            superCleanedExamples.forEach((example, index) => {
                console.log(`  ${index + 1}. ${example.college_name} | ${example.course_name}`);
            });
            
        } finally {
            db.close();
        }
    }

    async getSuperCleanedExamples(db) {
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

    printSuperCleaningSummary() {
        console.log('\n📊 SUPER INTELLIGENT CLEANING SUMMARY');
        console.log('=======================================');
        console.log(`📁 Total records processed: ${this.cleaningResults.totalRecords}`);
        console.log(`🧠 Total records super cleaned: ${this.cleaningResults.cleanedRecords}`);
        console.log(`❌ Errors: ${this.cleaningResults.errors.length}`);
        
        console.log('\n🔧 SUPER CLEANING RESULTS BY TYPE:');
        console.log(`  AIQ_PG: ${this.cleaningResults.typeResults.aiq_pg.cleaned}/${this.cleaningResults.typeResults.aiq_pg.total} super cleaned`);
        console.log(`  AIQ_UG: ${this.cleaningResults.typeResults.aiq_ug.cleaned}/${this.cleaningResults.typeResults.aiq_ug.total} super cleaned`);
        console.log(`  KEA: ${this.cleaningResults.typeResults.kea.cleaned}/${this.cleaningResults.typeResults.kea.total} super cleaned`);
        
        if (this.cleaningResults.errors.length > 0) {
            console.log('\n❌ ERRORS ENCOUNTERED:');
            this.cleaningResults.errors.forEach((error, index) => {
                console.log(`  ${index + 1}. ${error}`);
            });
        }
        
        if (this.cleaningResults.cleanedRecords === this.cleaningResults.totalRecords) {
            console.log('\n🎉 ALL DATA SUCCESSFULLY SUPER CLEANED TO PERFECTION! 🎉');
        } else {
            console.log(`\n⚠️ ${this.cleaningResults.totalRecords - this.cleaningResults.cleanedRecords} records failed to super clean`);
        }
    }
}

// Run if called directly
if (require.main === module) {
    const cleaner = new SuperIntelligentCleaner();
    cleaner.superCleanAllData()
        .then(() => {
            console.log('\n✅ Super intelligent cleaning complete!');
        })
        .catch(error => {
            console.error('\n❌ Super intelligent cleaning failed:', error.message);
        });
}

module.exports = { SuperIntelligentCleaner };
