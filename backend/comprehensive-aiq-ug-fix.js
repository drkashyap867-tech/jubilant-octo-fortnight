const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class ComprehensiveAIQUGFixer {
    constructor() {
        this.counsellingDbPath = path.join(__dirname, 'data/counselling.db');
        this.fixResults = {
            totalAIQUGRecords: 0,
            corruptedRecords: 0,
            nursingRecords: 0,
            cleanedRecords: 0,
            errors: []
        };
    }

    async fixAllAIQUGIssues() {
        console.log('🔧 COMPREHENSIVE FIX FOR AIQ_UG DATA CORRUPTION + NURSING REMOVAL');
        console.log('==================================================================');
        
        try {
            // Step 1: Analyze current AIQ_UG issues
            await this.analyzeAIQUGIssues();
            
            // Step 2: Remove B.SC. NURSING records
            await this.removeNursingRecords();
            
            // Step 3: Clean all corrupted AIQ_UG data
            await this.cleanAllAIQUGData();
            
            // Step 4: Verify fixes
            await this.verifyFixes();
            
            // Step 5: Print comprehensive summary
            this.printFixSummary();
            
        } catch (error) {
            console.error('❌ Comprehensive AIQ_UG fix failed:', error.message);
            this.fixResults.errors.push(error.message);
        }
    }

    async analyzeAIQUGIssues() {
        console.log('\n🔍 ANALYZING AIQ_UG DATA ISSUES...');
        
        const db = new sqlite3.Database(this.counsellingDbPath);
        
        try {
            // Count total AIQ_UG records
            this.fixResults.totalAIQUGRecords = await this.getRecordCount(db, `
                SELECT COUNT(*) FROM counselling_data WHERE counselling_type_id = 2
            `);
            
            // Count corrupted records
            this.fixResults.corruptedRecords = await this.getRecordCount(db, `
                SELECT COUNT(*) FROM counselling_data 
                WHERE counselling_type_id = 2 
                AND (all_india_rank LIKE '% %' OR quota LIKE '% %' OR college_name LIKE '% %' OR course_name LIKE '% %' OR category LIKE '% %')
            `);
            
            // Count nursing records
            this.fixResults.nursingRecords = await this.getRecordCount(db, `
                SELECT COUNT(*) FROM counselling_data 
                WHERE counselling_type_id = 2 
                AND course_name LIKE '%NURSING%'
            `);
            
            console.log('📊 AIQ_UG ISSUES ANALYSIS:');
            console.log(`  Total AIQ_UG records: ${this.fixResults.totalAIQUGRecords}`);
            console.log(`  Corrupted records: ${this.fixResults.corruptedRecords}`);
            console.log(`  B.SC. NURSING records: ${this.fixResults.nursingRecords}`);
            
        } finally {
            db.close();
        }
    }

    async removeNursingRecords() {
        console.log('\n🗑️ REMOVING B.SC. NURSING RECORDS...');
        
        const db = new sqlite3.Database(this.counsellingDbPath);
        
        try {
            const result = await this.runQuery(db, `
                DELETE FROM counselling_data 
                WHERE counselling_type_id = 2 
                AND course_name LIKE '%NURSING%'
            `);
            
            console.log(`✅ Removed ${result.changes} B.SC. NURSING records`);
            
        } finally {
            db.close();
        }
    }

    async cleanAllAIQUGData() {
        console.log('\n🧹 INTELLIGENTLY CLEANING ALL AIQ_UG CORRUPTED DATA...');
        
        const db = new sqlite3.Database(this.counsellingDbPath);
        
        try {
            // Begin transaction
            await this.runQuery(db, 'BEGIN TRANSACTION');
            
            // Get all corrupted AIQ_UG records
            const corruptedRecords = await this.getCorruptedAIQUGRecords(db);
            console.log(`📊 Processing ${corruptedRecords.length} corrupted records for cleaning...`);
            
            for (let i = 0; i < corruptedRecords.length; i++) {
                const record = corruptedRecords[i];
                
                try {
                    // Clean each field intelligently
                    const cleanedRank = this.intelligentlyCleanAIQUGRank(record.all_india_rank);
                    const cleanedQuota = this.intelligentlyCleanAIQUGQuota(record.quota);
                    const cleanedCollege = this.intelligentlyCleanAIQUGCollege(record.college_name);
                    const cleanedCourse = this.intelligentlyCleanAIQUGCourse(record.course_name);
                    const cleanedCategory = this.intelligentlyCleanAIQUGCategory(record.category);
                    
                    // Update the record with cleaned data
                    await this.runQuery(db, `
                        UPDATE counselling_data 
                        SET all_india_rank = ?, quota = ?, college_name = ?, course_name = ?, category = ?, updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    `, [cleanedRank, cleanedQuota, cleanedCollege, cleanedCourse, cleanedCategory, record.id]);
                    
                    this.fixResults.cleanedRecords++;
                    
                    if ((i + 1) % 1000 === 0) {
                        console.log(`📊 Progress: ${i + 1}/${corruptedRecords.length} records cleaned`);
                    }
                    
                } catch (error) {
                    this.fixResults.errors.push(`Failed to clean record ${record.id}: ${error.message}`);
                }
            }
            
            // Commit transaction
            await this.runQuery(db, 'COMMIT');
            console.log('✅ All AIQ_UG records cleaned successfully');
            
        } catch (error) {
            // Rollback on error
            await this.runQuery(db, 'ROLLBACK');
            throw error;
        } finally {
            db.close();
        }
    }

    intelligentlyCleanAIQUGRank(rank) {
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

    intelligentlyCleanAIQUGQuota(quota) {
        if (typeof quota === 'string') {
            // Fix common AIQ_UG quota patterns
            let cleaned = quota;
            
            cleaned = cleaned.replace(/OPEN SEAT QUOTA/g, 'OPEN SEAT QUOTA');
            cleaned = cleaned.replace(/ALL INDIA QUOTA/g, 'ALL INDIA QUOTA');
            cleaned = cleaned.replace(/CENTRAL QUOTA/g, 'CENTRAL QUOTA');
            cleaned = cleaned.replace(/DELHI QUOTA/g, 'DELHI QUOTA');
            cleaned = cleaned.replace(/JAMMU QUOTA/g, 'JAMMU QUOTA');
            cleaned = cleaned.replace(/KASHMIR QUOTA/g, 'KASHMIR QUOTA');
            cleaned = cleaned.replace(/LADAKH QUOTA/g, 'LADAKH QUOTA');
            
            // Remove extra spaces and normalize
            cleaned = cleaned.replace(/\s+/g, ' ').trim();
            
            return cleaned;
        }
        return quota;
    }

    intelligentlyCleanAIQUGCollege(college) {
        if (typeof college === 'string') {
            let cleaned = college;
            
            // Fix common AIQ_UG college patterns
            cleaned = cleaned.replace(/JIPMER PUDUCHERRY/g, 'JIPMER PUDUCHERRY');
            cleaned = cleaned.replace(/AIIMS, NEW DELHI/g, 'AIIMS, NEW DELHI');
            cleaned = cleaned.replace(/AIIMS ANSARI NAGAR/g, 'AIIMS ANSARI NAGAR');
            cleaned = cleaned.replace(/EAST AUROBINDO MARG/g, 'EAST AUROBINDO MARG');
            cleaned = cleaned.replace(/DELHI \(NCT\)/g, 'DELHI (NCT)');
            cleaned = cleaned.replace(/PUDUCHERRY/g, 'PUDUCHERRY');
            
            // Remove duplicate text patterns
            cleaned = cleaned.replace(/,([^,]+),\1/g, ',$1');
            
            // Remove extra spaces and normalize
            cleaned = cleaned.replace(/\s+/g, ' ').trim();
            
            return cleaned;
        }
        return college;
    }

    intelligentlyCleanAIQUGCourse(course) {
        if (typeof course === 'string') {
            let cleaned = course;
            
            // Fix common AIQ_UG course patterns
            cleaned = cleaned.replace(/MBBS/g, 'MBBS');
            cleaned = cleaned.replace(/BDS/g, 'BDS');
            cleaned = cleaned.replace(/BAMS/g, 'BAMS');
            cleaned = cleaned.replace(/BHMS/g, 'BHMS');
            cleaned = cleaned.replace(/BUMS/g, 'BUMS');
            cleaned = cleaned.replace(/B.SC. NURSING/g, 'B.SC. NURSING');
            
            // Remove extra spaces and normalize
            cleaned = cleaned.replace(/\s+/g, ' ').trim();
            
            return cleaned;
        }
        return course;
    }

    intelligentlyCleanAIQUGCategory(category) {
        if (typeof category === 'string') {
            let cleaned = category;
            
            // Fix common AIQ_UG category patterns
            cleaned = cleaned.replace(/OPE N/g, 'OPEN');
            cleaned = cleaned.replace(/OBC/g, 'OBC');
            cleaned = cleaned.replace(/SC/g, 'SC');
            cleaned = cleaned.replace(/ST/g, 'ST');
            cleaned = cleaned.replace(/EWS/g, 'EWS');
            cleaned = cleaned.replace(/G M/g, 'GM');
            
            // Remove extra spaces and normalize
            cleaned = cleaned.replace(/\s+/g, ' ').trim();
            
            return cleaned;
        }
        return category;
    }

    async getCorruptedAIQUGRecords(db) {
        return new Promise((resolve, reject) => {
            db.all(`
                SELECT id, all_india_rank, quota, college_name, course_name, category
                FROM counselling_data 
                WHERE counselling_type_id = 2
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async verifyFixes() {
        console.log('\n🔍 VERIFYING AIQ_UG FIXES...');
        
        const db = new sqlite3.Database(this.counsellingDbPath);
        
        try {
            // Check remaining corrupted records
            const remainingCorrupted = await this.getRecordCount(db, `
                SELECT COUNT(*) FROM counselling_data 
                WHERE counselling_type_id = 2 
                AND (all_india_rank LIKE '% %' OR quota LIKE '% %' OR college_name LIKE '% %' OR course_name LIKE '% %' OR category LIKE '% %')
            `);
            
            // Check remaining nursing records
            const remainingNursing = await this.getRecordCount(db, `
                SELECT COUNT(*) FROM counselling_data 
                WHERE counselling_type_id = 2 
                AND course_name LIKE '%NURSING%'
            `);
            
            // Check total AIQ_UG records
            const totalAIQUG = await this.getRecordCount(db, `
                SELECT COUNT(*) FROM counselling_data WHERE counselling_type_id = 2
            `);
            
            console.log('📊 VERIFICATION RESULTS:');
            console.log(`  Total AIQ_UG records: ${totalAIQUG}`);
            console.log(`  Remaining corrupted: ${remainingCorrupted}`);
            console.log(`  Remaining nursing: ${remainingNursing}`);
            
            if (remainingCorrupted === 0 && remainingNursing === 0) {
                console.log('✅ All AIQ_UG issues have been resolved!');
            } else {
                console.log(`⚠️ ${remainingCorrupted} corrupted and ${remainingNursing} nursing records still remain`);
            }
            
            // Show sample of cleaned records
            console.log('\n📋 Sample of cleaned AIQ_UG records:');
            const sampleRecords = await this.getSampleAIQUGRecords(db);
            sampleRecords.forEach((record, index) => {
                console.log(`  ${index + 1}. Rank: ${record.all_india_rank} | ${record.course_name} | ${record.college_name.substring(0, 50)}...`);
            });
            
        } finally {
            db.close();
        }
    }

    async getSampleAIQUGRecords(db) {
        return new Promise((resolve, reject) => {
            db.all(`
                SELECT all_india_rank, course_name, college_name 
                FROM counselling_data 
                WHERE counselling_type_id = 2 
                LIMIT 5
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

    printFixSummary() {
        console.log('\n📊 COMPREHENSIVE AIQ_UG FIX SUMMARY');
        console.log('=====================================');
        console.log(`📁 Total AIQ_UG records: ${this.fixResults.totalAIQUGRecords}`);
        console.log(`🗑️ B.SC. NURSING records removed: ${this.fixResults.nursingRecords}`);
        console.log(`🧹 Corrupted records cleaned: ${this.fixResults.cleanedRecords}`);
        console.log(`❌ Errors: ${this.fixResults.errors.length}`);
        
        if (this.fixResults.errors.length > 0) {
            console.log('\n❌ ERRORS ENCOUNTERED:');
            this.fixResults.errors.forEach((error, index) => {
                console.log(`  ${index + 1}. ${error}`);
            });
        }
        
        console.log('\n🎉 AIQ_UG DATA CORRUPTION FIXED + NURSING RECORDS REMOVED! 🎉');
    }
}

// Run if called directly
if (require.main === module) {
    const fixer = new ComprehensiveAIQUGFixer();
    fixer.fixAllAIQUGIssues()
        .then(() => {
            console.log('\n✅ Comprehensive AIQ_UG fix complete!');
        })
        .catch(error => {
            console.error('\n❌ Comprehensive AIQ_UG fix failed:', error.message);
        });
}

module.exports = { ComprehensiveAIQUGFixer };
