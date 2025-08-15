const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class IntelligentDataCleaner {
    constructor() {
        this.counsellingDbPath = path.join(__dirname, 'data/counselling.db');
        this.cleaningResults = {
            totalRecords: 0,
            cleanedRecords: 0,
            errors: [],
            cleaningStats: {
                ranksFixed: 0,
                quotasFixed: 0,
                collegesFixed: 0,
                coursesFixed: 0,
                categoriesFixed: 0
            }
        };
    }

    async cleanAllCorruptedData() {
        console.log('🧠 INTELLIGENT DATA CLEANING - AUTOMATIC CORRUPTION FIX');
        console.log('========================================================');
        
        try {
            // Step 1: Analyze current corruption
            await this.analyzeCorruption();
            
            // Step 2: Clean all corrupted fields intelligently
            await this.cleanAllFields();
            
            // Step 3: Verify cleaning results
            await this.verifyCleaning();
            
            // Step 4: Print comprehensive summary
            this.printCleaningSummary();
            
        } catch (error) {
            console.error('❌ Intelligent cleaning failed:', error.message);
            this.cleaningResults.errors.push(error.message);
        }
    }

    async analyzeCorruption() {
        console.log('\n🔍 ANALYZING DATA CORRUPTION PATTERNS...');
        
        const db = new sqlite3.Database(this.counsellingDbPath);
        
        try {
            // Count total records for this file
            this.cleaningResults.totalRecords = await this.getRecordCount(db, `
                SELECT COUNT(*) FROM counselling_data 
                WHERE counselling_type_id = 1 
                AND academic_year = '2023-2024' 
                AND counselling_round_id = 3
            `);
            
            console.log(`📊 Total AIQ_PG_2023_R3 records: ${this.cleaningResults.totalRecords}`);
            
            // Analyze corruption patterns
            const rankCorruption = await this.getRecordCount(db, `
                SELECT COUNT(*) FROM counselling_data 
                WHERE counselling_type_id = 1 
                AND academic_year = '2023-2024' 
                AND counselling_round_id = 3 
                AND all_india_rank LIKE '% %'
            `);
            
            const quotaCorruption = await this.getRecordCount(db, `
                SELECT COUNT(*) FROM counselling_data 
                WHERE counselling_type_id = 1 
                AND academic_year = '2023-2024' 
                AND counselling_round_id = 3 
                AND quota LIKE '% %'
            `);
            
            const collegeCorruption = await this.getRecordCount(db, `
                SELECT COUNT(*) FROM counselling_data 
                WHERE counselling_type_id = 1 
                AND academic_year = '2023-2024' 
                AND counselling_round_id = 3 
                AND college_name LIKE '% %'
            `);
            
            const courseCorruption = await this.getRecordCount(db, `
                SELECT COUNT(*) FROM counselling_data 
                WHERE counselling_type_id = 1 
                AND academic_year = '2023-2024' 
                AND counselling_round_id = 3 
                AND course_name LIKE '% %'
            `);
            
            const categoryCorruption = await this.getRecordCount(db, `
                SELECT COUNT(*) FROM counselling_data 
                WHERE counselling_type_id = 1 
                AND academic_year = '2023-2024' 
                AND counselling_round_id = 3 
                AND category LIKE '% %'
            `);
            
            console.log('📊 CORRUPTION ANALYSIS:');
            console.log(`  Ranks with spaces: ${rankCorruption}`);
            console.log(`  Quotas with spaces: ${quotaCorruption}`);
            console.log(`  Colleges with spaces: ${collegeCorruption}`);
            console.log(`  Courses with spaces: ${courseCorruption}`);
            console.log(`  Categories with spaces: ${categoryCorruption}`);
            
        } finally {
            db.close();
        }
    }

    async cleanAllFields() {
        console.log('\n🧹 INTELLIGENTLY CLEANING ALL CORRUPTED FIELDS...');
        
        const db = new sqlite3.Database(this.counsellingDbPath);
        
        try {
            // Begin transaction for better performance
            await this.runQuery(db, 'BEGIN TRANSACTION');
            
            // Get all corrupted records
            const corruptedRecords = await this.getCorruptedRecords(db);
            console.log(`📊 Processing ${corruptedRecords.length} records for cleaning...`);
            
            for (let i = 0; i < corruptedRecords.length; i++) {
                const record = corruptedRecords[i];
                
                try {
                    // Clean each field intelligently
                    const cleanedRank = this.intelligentlyCleanRank(record.all_india_rank);
                    const cleanedQuota = this.intelligentlyCleanQuota(record.quota);
                    const cleanedCollege = this.intelligentlyCleanCollege(record.college_name);
                    const cleanedCourse = this.intelligentlyCleanCourse(record.course_name);
                    const cleanedCategory = this.intelligentlyCleanCategory(record.category);
                    
                    // Update the record with cleaned data
                    await this.runQuery(db, `
                        UPDATE counselling_data 
                        SET all_india_rank = ?, quota = ?, college_name = ?, course_name = ?, category = ?, updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    `, [cleanedRank, cleanedQuota, cleanedCollege, cleanedCourse, cleanedCategory, record.id]);
                    
                    this.cleaningResults.cleanedRecords++;
                    
                    // Track cleaning statistics
                    if (cleanedRank !== record.all_india_rank) this.cleaningResults.cleaningStats.ranksFixed++;
                    if (cleanedQuota !== record.quota) this.cleaningResults.cleaningStats.quotasFixed++;
                    if (cleanedCollege !== record.college_name) this.cleaningResults.cleaningStats.collegesFixed++;
                    if (cleanedCourse !== record.course_name) this.cleaningResults.cleaningStats.coursesFixed++;
                    if (cleanedCategory !== record.category) this.cleaningResults.cleaningStats.categoriesFixed++;
                    
                    if ((i + 1) % 1000 === 0) {
                        console.log(`📊 Progress: ${i + 1}/${corruptedRecords.length} records cleaned`);
                    }
                    
                } catch (error) {
                    this.cleaningResults.errors.push(`Failed to clean record ${record.id}: ${error.message}`);
                }
            }
            
            // Commit transaction
            await this.runQuery(db, 'COMMIT');
            console.log('✅ All records cleaned successfully');
            
        } catch (error) {
            // Rollback on error
            await this.runQuery(db, 'ROLLBACK');
            throw error;
        } finally {
            db.close();
        }
    }

    intelligentlyCleanRank(rank) {
        if (typeof rank === 'string') {
            // Remove all spaces and convert to number
            const cleanRank = rank.replace(/\s+/g, '');
            const numericRank = parseInt(cleanRank);
            
            // Validate the rank
            if (!isNaN(numericRank) && numericRank > 0) {
                return numericRank;
            }
        }
        return rank;
    }

    intelligentlyCleanQuota(quota) {
        if (typeof quota === 'string') {
            // Common quota patterns and their corrections
            const quotaCorrections = {
                'ALL INDIA': 'ALL INDIA',
                'MANAGE MENT/PAI D SEATS QUOTA': 'MANAGEMENT/PAID SEATS QUOTA',
                'NON- RESIDENT INDIAN': 'NON-RESIDENT INDIAN',
                'DNB QUOTA': 'DNB QUOTA',
                'DELHI UNIVERSIT Y QUOTA': 'DELHI UNIVERSITY QUOTA',
                'IP UNIVERSIT Y QUOTA': 'IP UNIVERSITY QUOTA',
                'MUSLIM MINORITY QUOTA': 'MUSLIM MINORITY QUOTA',
                'JAIN MINORITY QUOTA': 'JAIN MINORITY QUOTA',
                'ALIGARH MUSLIM UNIVERSIT Y': 'ALIGARH MUSLIM UNIVERSITY',
                'BANARAS HINDU UNIVERSIT Y': 'BANARAS HINDU UNIVERSITY'
            };
            
            // Try to find exact match first
            if (quotaCorrections[quota]) {
                return quotaCorrections[quota];
            }
            
            // General space cleaning
            return quota.replace(/\s+/g, ' ').trim();
        }
        return quota;
    }

    intelligentlyCleanCollege(college) {
        if (typeof college === 'string') {
            // Remove duplicate text patterns
            let cleaned = college;
            
            // Fix common patterns
            cleaned = cleaned.replace(/MEDICA L COLLEG E/g, 'MEDICAL COLLEGE');
            cleaned = cleaned.replace(/UNIVERSIT Y/g, 'UNIVERSITY');
            cleaned = cleaned.replace(/GOVERNM ENT/g, 'GOVERNMENT');
            cleaned = cleaned.replace(/COLLEG E/g, 'COLLEGE');
            cleaned = cleaned.replace(/INSTITUT E/g, 'INSTITUTE');
            cleaned = cleaned.replace(/HOSPITA L/g, 'HOSPITAL');
            cleaned = cleaned.replace(/DEPARTMEN T/g, 'DEPARTMENT');
            cleaned = cleaned.replace(/RESEARC H/g, 'RESEARCH');
            cleaned = cleaned.replace(/TELANGAN A/g, 'TELANGANA');
            cleaned = cleaned.replace(/MAHARAS HTRA/g, 'MAHARASHTRA');
            cleaned = cleaned.replace(/RAJASTHA N/g, 'RAJASTHAN');
            cleaned = cleaned.replace(/ANDHRA PRADES H/g, 'ANDHRA PRADESH');
            cleaned = cleaned.replace(/WEST BENGAL/g, 'WEST BENGAL');
            cleaned = cleaned.replace(/UTTAR PRADES H/g, 'UTTAR PRADESH');
            
            // Remove extra spaces and normalize
            cleaned = cleaned.replace(/\s+/g, ' ').trim();
            
            return cleaned;
        }
        return college;
    }

    intelligentlyCleanCourse(course) {
        if (typeof course === 'string') {
            // Fix common course name patterns
            let cleaned = course;
            
            // Fix medical course patterns
            cleaned = cleaned.replace(/M\.D\. \(DERM\.,VENE\. AND LEPROSY\)/g, 'M.D. (DERMATOLOGY)');
            cleaned = cleaned.replace(/M\.D\. \(RADIO- DIAGNOS IS\)/g, 'M.D. (RADIO-DIAGNOSIS)');
            cleaned = cleaned.replace(/M\.D\. \(GENERA L MEDICIN E\)/g, 'M.D. (GENERAL MEDICINE)');
            cleaned = cleaned.replace(/M\.D\. \(PATHOLOG Y\)/g, 'M.D. (PATHOLOGY)');
            cleaned = cleaned.replace(/M\.D\. \(MICROBI OLOGY\)/g, 'M.D. (MICROBIOLOGY)');
            cleaned = cleaned.replace(/M\.D\. \(BIOCHE MISTRY\)/g, 'M.D. (BIOCHEMISTRY)');
            cleaned = cleaned.replace(/M\.S\. \(OBSTETRICS AND GYNECOLOG Y\)/g, 'M.S. (OBSTETRICS AND GYNECOLOGY)');
            cleaned = cleaned.replace(/M\.S\. \(GENERA L SURGER Y\)/g, 'M.S. (GENERAL SURGERY)');
            cleaned = cleaned.replace(/M\.S\. \(ORTHOPEDIC S\)/g, 'M.S. (ORTHOPEDICS)');
            cleaned = cleaned.replace(/M\.S\. \(OPHTHALMOLOG Y\)/g, 'M.S. (OPHTHALMOLOGY)');
            cleaned = cleaned.replace(/M\.S\. \(ENT\)/g, 'M.S. (ENT)');
            cleaned = cleaned.replace(/M\.S\. \(NEUROSURGER Y\)/g, 'M.S. (NEUROSURGERY)');
            cleaned = cleaned.replace(/M\.S\. \(CARDIOVASCULA R SURGER Y\)/g, 'M.S. (CARDIOVASCULAR SURGERY)');
            cleaned = cleaned.replace(/M\.S\. \(PLASTI C SURGER Y\)/g, 'M.S. (PLASTIC SURGERY)');
            cleaned = cleaned.replace(/M\.S\. \(UROLOG Y\)/g, 'M.S. (UROLOGY)');
            cleaned = cleaned.replace(/M\.S\. \(PEDIATRI C SURGER Y\)/g, 'M.S. (PEDIATRIC SURGERY)');
            
            // Remove extra spaces and normalize
            cleaned = cleaned.replace(/\s+/g, ' ').trim();
            
            return cleaned;
        }
        return course;
    }

    intelligentlyCleanCategory(category) {
        if (typeof category === 'string') {
            // Fix common category patterns
            let cleaned = category;
            
            // Fix category names
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

    async getCorruptedRecords(db) {
        return new Promise((resolve, reject) => {
            db.all(`
                SELECT id, all_india_rank, quota, college_name, course_name, category
                FROM counselling_data 
                WHERE counselling_type_id = 1 
                AND academic_year = '2023-2024' 
                AND counselling_round_id = 3
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async verifyCleaning() {
        console.log('\n🔍 VERIFYING CLEANING RESULTS...');
        
        const db = new sqlite3.Database(this.counsellingDbPath);
        
        try {
            // Check if any corrupted records remain
            const remainingCorrupted = await this.getRecordCount(db, `
                SELECT COUNT(*) FROM counselling_data 
                WHERE counselling_type_id = 1 
                AND academic_year = '2023-2024' 
                AND counselling_round_id = 3 
                AND (all_india_rank LIKE '% %' OR quota LIKE '% %' OR college_name LIKE '% %' OR course_name LIKE '% %' OR category LIKE '% %')
            `);
            
            if (remainingCorrupted === 0) {
                console.log('✅ All corruption has been eliminated!');
            } else {
                console.log(`⚠️ ${remainingCorrupted} corrupted records still remain`);
            }
            
            // Show sample of cleaned records
            console.log('\n📋 Sample of cleaned records:');
            const sampleRecords = await this.getSampleRecords(db);
            sampleRecords.forEach((record, index) => {
                console.log(`  ${index + 1}. Rank: ${record.all_india_rank} | ${record.course_name} | ${record.college_name.substring(0, 50)}...`);
            });
            
        } finally {
            db.close();
        }
    }

    async getSampleRecords(db) {
        return new Promise((resolve, reject) => {
            db.all(`
                SELECT all_india_rank, course_name, college_name 
                FROM counselling_data 
                WHERE counselling_type_id = 1 
                AND academic_year = '2023-2024' 
                AND counselling_round_id = 3 
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

    printCleaningSummary() {
        console.log('\n📊 INTELLIGENT CLEANING SUMMARY');
        console.log('================================');
        console.log(`📁 Total records processed: ${this.cleaningResults.totalRecords}`);
        console.log(`🧹 Records cleaned: ${this.cleaningResults.cleanedRecords}`);
        console.log(`❌ Errors: ${this.cleaningResults.errors.length}`);
        
        console.log('\n🔧 CLEANING STATISTICS:');
        console.log(`  Ranks fixed: ${this.cleaningResults.cleaningStats.ranksFixed}`);
        console.log(`  Quotas fixed: ${this.cleaningResults.cleaningStats.quotasFixed}`);
        console.log(`  Colleges fixed: ${this.cleaningResults.cleaningStats.collegesFixed}`);
        console.log(`  Courses fixed: ${this.cleaningResults.cleaningStats.coursesFixed}`);
        console.log(`  Categories fixed: ${this.cleaningResults.cleaningStats.categoriesFixed}`);
        
        if (this.cleaningResults.errors.length > 0) {
            console.log('\n❌ ERRORS ENCOUNTERED:');
            this.cleaningResults.errors.forEach((error, index) => {
                console.log(`  ${index + 1}. ${error}`);
            });
        }
        
        if (this.cleaningResults.cleanedRecords === this.cleaningResults.totalRecords) {
            console.log('\n🎉 ALL DATA SUCCESSFULLY CLEANED! 🎉');
        } else {
            console.log(`\n⚠️ ${this.cleaningResults.totalRecords - this.cleaningResults.cleanedRecords} records failed to clean`);
        }
    }
}

// Run if called directly
if (require.main === module) {
    const cleaner = new IntelligentDataCleaner();
    cleaner.cleanAllCorruptedData()
        .then(() => {
            console.log('\n✅ Intelligent data cleaning complete!');
        })
        .catch(error => {
            console.error('\n❌ Intelligent data cleaning failed:', error.message);
        });
}

module.exports = { IntelligentDataCleaner };
