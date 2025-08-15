const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class MegaDatabaseCleaner {
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

    async cleanAllDatabases() {
        console.log('🧹 MEGA DATABASE CLEANING - COMPREHENSIVE CORRUPTION FIX');
        console.log('==========================================================');
        
        try {
            // Step 1: Analyze all corruption
            await this.analyzeAllCorruption();
            
            // Step 2: Clean AIQ_PG data
            await this.cleanAIQPGData();
            
            // Step 3: Clean AIQ_UG data
            await this.cleanAIQUGData();
            
            // Step 4: Clean KEA data
            await this.cleanKEAData();
            
            // Step 5: Final verification
            await this.finalVerification();
            
            // Step 6: Print comprehensive summary
            this.printMegaCleaningSummary();
            
        } catch (error) {
            console.error('❌ Mega cleaning failed:', error.message);
            this.cleaningResults.errors.push(error.message);
        }
    }

    async analyzeAllCorruption() {
        console.log('\n🔍 ANALYZING ALL DATABASE CORRUPTION...');
        
        const db = new sqlite3.Database(this.counsellingDbPath);
        
        try {
            // Count total records by type
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
            
            console.log('📊 CORRUPTION ANALYSIS:');
            console.log(`  AIQ_PG records: ${this.cleaningResults.typeResults.aiq_pg.total}`);
            console.log(`  AIQ_UG records: ${this.cleaningResults.typeResults.aiq_ug.total}`);
            console.log(`  KEA records: ${this.cleaningResults.typeResults.kea.total}`);
            console.log(`  Total records: ${this.cleaningResults.totalRecords}`);
            
        } finally {
            db.close();
        }
    }

    async cleanAIQPGData() {
        console.log('\n🧹 CLEANING AIQ_PG DATA...');
        
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
                    // Clean each field
                    const cleanedRank = this.cleanRank(record.all_india_rank);
                    const cleanedQuota = this.cleanQuota(record.quota);
                    const cleanedCollege = this.cleanCollege(record.college_name);
                    const cleanedCourse = this.cleanCourse(record.course_name);
                    const cleanedCategory = this.cleanCategory(record.category);
                    
                    // Update record
                    await this.runQuery(db, `
                        UPDATE counselling_data 
                        SET all_india_rank = ?, quota = ?, college_name = ?, course_name = ?, category = ?, updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    `, [cleanedRank, cleanedQuota, cleanedCollege, cleanedCourse, cleanedCategory, record.id]);
                    
                    this.cleaningResults.typeResults.aiq_pg.cleaned++;
                    this.cleaningResults.cleanedRecords++;
                    
                    if ((i + 1) % 1000 === 0) {
                        console.log(`📊 AIQ_PG Progress: ${i + 1}/${records.length} records cleaned`);
                    }
                    
                } catch (error) {
                    this.cleaningResults.errors.push(`Failed to clean AIQ_PG record ${record.id}: ${error.message}`);
                }
            }
            
            // Commit transaction
            await this.runQuery(db, 'COMMIT');
            console.log('✅ AIQ_PG data cleaned successfully');
            
        } catch (error) {
            await this.runQuery(db, 'ROLLBACK');
            throw error;
        } finally {
            db.close();
        }
    }

    async cleanAIQUGData() {
        console.log('\n🧹 CLEANING AIQ_UG DATA...');
        
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
                    // Clean each field
                    const cleanedRank = this.cleanRank(record.all_india_rank);
                    const cleanedQuota = this.cleanQuota(record.quota);
                    const cleanedCollege = this.cleanCollege(record.college_name);
                    const cleanedCourse = this.cleanCourse(record.course_name);
                    const cleanedCategory = this.cleanCategory(record.category);
                    
                    // Update record
                    await this.runQuery(db, `
                        UPDATE counselling_data 
                        SET all_india_rank = ?, quota = ?, college_name = ?, course_name = ?, category = ?, updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    `, [cleanedRank, cleanedQuota, cleanedCollege, cleanedCourse, cleanedCategory, record.id]);
                    
                    this.cleaningResults.typeResults.aiq_ug.cleaned++;
                    this.cleaningResults.cleanedRecords++;
                    
                    if ((i + 1) % 1000 === 0) {
                        console.log(`📊 AIQ_UG Progress: ${i + 1}/${records.length} records cleaned`);
                    }
                    
                } catch (error) {
                    this.cleaningResults.errors.push(`Failed to clean AIQ_UG record ${record.id}: ${error.message}`);
                }
            }
            
            // Commit transaction
            await this.runQuery(db, 'COMMIT');
            console.log('✅ AIQ_UG data cleaned successfully');
            
        } catch (error) {
            await this.runQuery(db, 'ROLLBACK');
            throw error;
        } finally {
            db.close();
        }
    }

    async cleanKEAData() {
        console.log('\n🧹 CLEANING KEA DATA...');
        
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
                    // Clean each field
                    const cleanedRank = this.cleanRank(record.all_india_rank);
                    const cleanedQuota = this.cleanQuota(record.quota);
                    const cleanedCollege = this.cleanCollege(record.college_name);
                    const cleanedCourse = this.cleanCourse(record.course_name);
                    const cleanedCategory = this.cleanCategory(record.category);
                    
                    // Update record
                    await this.runQuery(db, `
                        UPDATE counselling_data 
                        SET all_india_rank = ?, quota = ?, college_name = ?, course_name = ?, category = ?, updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    `, [cleanedRank, cleanedQuota, cleanedCollege, cleanedCourse, cleanedCategory, record.id]);
                    
                    this.cleaningResults.typeResults.kea.cleaned++;
                    this.cleaningResults.cleanedRecords++;
                    
                    if ((i + 1) % 1000 === 0) {
                        console.log(`📊 KEA Progress: ${i + 1}/${records.length} records cleaned`);
                    }
                    
                } catch (error) {
                    this.cleaningResults.errors.push(`Failed to clean KEA record ${record.id}: ${error.message}`);
                }
            }
            
            // Commit transaction
            await this.runQuery(db, 'COMMIT');
            console.log('✅ KEA data cleaned successfully');
            
        } catch (error) {
            await this.runQuery(db, 'ROLLBACK');
            throw error;
        } finally {
            db.close();
        }
    }

    cleanRank(rank) {
        if (typeof rank === 'string') {
            // Handle special cases like "1(A)", "1(B)", etc.
            if (rank.includes('(') && rank.includes(')')) {
                const baseRank = rank.split('(')[0];
                const suffix = rank.split('(')[1].split(')')[0];
                return `${baseRank}(${suffix})`;
            }
            
            // Remove all spaces and convert to number if possible
            const cleanRank = rank.replace(/\s+/g, '');
            const numericRank = parseInt(cleanRank);
            
            if (!isNaN(numericRank) && numericRank > 0) {
                return numericRank;
            }
            
            return cleanRank;
        }
        return rank;
    }

    cleanQuota(quota) {
        if (typeof quota === 'string') {
            // Remove extra spaces and normalize
            return quota.replace(/\s+/g, ' ').trim();
        }
        return quota;
    }

    cleanCollege(college) {
        if (typeof college === 'string') {
            // Remove extra spaces and normalize
            return college.replace(/\s+/g, ' ').trim();
        }
        return college;
    }

    cleanCourse(course) {
        if (typeof course === 'string') {
            // Remove extra spaces and normalize
            return course.replace(/\s+/g, ' ').trim();
        }
        return course;
    }

    cleanCategory(category) {
        if (typeof category === 'string') {
            // Remove extra spaces and normalize
            return category.replace(/\s+/g, ' ').trim();
        }
        return category;
    }

    async getAllRecords(db, counsellingTypeId) {
        return new Promise((resolve, reject) => {
            db.all(`
                SELECT id, all_india_rank, quota, college_name, course_name, category
                FROM counselling_data 
                WHERE counselling_type_id = ?
            `, [counsellingTypeId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async finalVerification() {
        console.log('\n🔍 FINAL VERIFICATION OF ALL CLEANING...');
        
        const db = new sqlite3.Database(this.counsellingDbPath);
        
        try {
            // Check remaining corruption
            const remainingCorruption = await this.getRecordCount(db, `
                SELECT COUNT(*) FROM counselling_data 
                WHERE (all_india_rank LIKE '% %' OR quota LIKE '% %' OR college_name LIKE '% %' OR course_name LIKE '% %' OR category LIKE '% %')
            `);
            
            if (remainingCorruption === 0) {
                console.log('✅ ALL CORRUPTION HAS BEEN ELIMINATED!');
            } else {
                console.log(`⚠️ ${remainingCorruption} corrupted records still remain`);
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
            
        } finally {
            db.close();
        }
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

    printMegaCleaningSummary() {
        console.log('\n📊 MEGA DATABASE CLEANING SUMMARY');
        console.log('==================================');
        console.log(`📁 Total records processed: ${this.cleaningResults.totalRecords}`);
        console.log(`🧹 Total records cleaned: ${this.cleaningResults.cleanedRecords}`);
        console.log(`❌ Errors: ${this.cleaningResults.errors.length}`);
        
        console.log('\n🔧 CLEANING RESULTS BY TYPE:');
        console.log(`  AIQ_PG: ${this.cleaningResults.typeResults.aiq_pg.cleaned}/${this.cleaningResults.typeResults.aiq_pg.total} cleaned`);
        console.log(`  AIQ_UG: ${this.cleaningResults.typeResults.aiq_ug.cleaned}/${this.cleaningResults.typeResults.aiq_ug.total} cleaned`);
        console.log(`  KEA: ${this.cleaningResults.typeResults.kea.cleaned}/${this.cleaningResults.typeResults.kea.total} cleaned`);
        
        if (this.cleaningResults.errors.length > 0) {
            console.log('\n❌ ERRORS ENCOUNTERED:');
            this.cleaningResults.errors.forEach((error, index) => {
                console.log(`  ${index + 1}. ${error}`);
            });
        }
        
        if (this.cleaningResults.cleanedRecords === this.cleaningResults.totalRecords) {
            console.log('\n🎉 ALL DATABASES SUCCESSFULLY CLEANED! 🎉');
        } else {
            console.log(`\n⚠️ ${this.cleaningResults.totalRecords - this.cleaningResults.cleanedRecords} records failed to clean`);
        }
    }
}

// Run if called directly
if (require.main === module) {
    const cleaner = new MegaDatabaseCleaner();
    cleaner.cleanAllDatabases()
        .then(() => {
            console.log('\n✅ Mega database cleaning complete!');
        })
        .catch(error => {
            console.error('\n❌ Mega database cleaning failed:', error.message);
        });
}

module.exports = { MegaDatabaseCleaner };
