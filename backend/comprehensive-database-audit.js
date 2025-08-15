const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class ComprehensiveDatabaseAudit {
    constructor() {
        this.dbPath = path.join(__dirname, 'data', 'cutoff_ranks_enhanced.db');
        this.db = null;
        this.auditResults = {
            totalExcelFiles: 0,
            totalExpectedRecords: 0,
            totalDatabaseRecords: 0,
            missingRecords: 0,
            dataDiscrepancies: [],
            fileAnalysis: {},
            summary: {}
        };
    }

    async connect() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    async disconnect() {
        if (this.db) {
            return new Promise((resolve) => {
                this.db.close((err) => {
                    if (err) console.error('Error closing database:', err);
                    resolve();
                });
            });
        }
    }

    async analyzeExcelFile(filePath) {
        try {
            const filename = path.basename(filePath);
            console.log(`\n🔍 Analyzing: ${filename}`);
            
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            
            const analysis = {
                filename: filename,
                totalRows: rawData.length,
                sheetName: sheetName,
                expectedRecords: 0,
                dataStructure: 'unknown',
                issues: []
            };

            // Determine file type and analyze accordingly
            if (filename.startsWith('AIQ_')) {
                analysis.dataStructure = 'AIQ';
                analysis.expectedRecords = this.analyzeAIQFile(rawData);
            } else if (filename.startsWith('KEA_')) {
                analysis.dataStructure = 'KEA';
                analysis.expectedRecords = this.analyzeKEAFile(rawData);
            } else {
                analysis.issues.push('Unknown file type');
            }

            console.log(`  📊 Expected records: ${analysis.expectedRecords}`);
            this.auditResults.fileAnalysis[filename] = analysis;
            this.auditResults.totalExpectedRecords += analysis.expectedRecords;

            return analysis;

        } catch (error) {
            console.error(`❌ Error analyzing ${filePath}:`, error.message);
            return {
                filename: path.basename(filePath),
                expectedRecords: 0,
                issues: [error.message]
            };
        }
    }

    analyzeAIQFile(rawData) {
        try {
            if (rawData.length < 2) return 0;

            // AIQ files have headers in first row, data starts from second row
            let recordCount = 0;
            for (let i = 1; i < rawData.length; i++) {
                const row = rawData[i];
                if (row && row.length > 0 && row[0] && row[0].toString().trim() !== '') {
                    recordCount++;
                }
            }
            return recordCount;
        } catch (error) {
            return 0;
        }
    }

    analyzeKEAFile(rawData) {
        try {
            if (rawData.length < 3) return 0;

            let courseCount = 0;
            let categoryCount = 0;
            let rankCount = 0;

            for (let i = 0; i < rawData.length; i++) {
                const row = rawData[i];
                if (!row || !row[0]) continue;

                const cell = row[0].toString().trim();
                if (cell === '' || cell === 'Grand Total') continue;

                if (this.isKEACourse(cell)) courseCount++;
                else if (this.isKEACategory(cell)) categoryCount++;
                else if (this.isKEARank(cell)) rankCount++;
            }

            // Return minimum of the three counts as potential records
            return Math.min(courseCount, categoryCount, rankCount);
        } catch (error) {
            return 0;
        }
    }

    isKEACourse(value) {
        const coursePatterns = [
            /^M\.D\./i, /^M\.S\./i, /^MBBS/i, /^BDS/i, /^MDS/i, /^DNB/i, /^DIPLOMA/i,
            /^GENERAL MEDICINE/i, /^SURGERY/i, /^PEDIATRICS/i, /^OBSTETRICS/i, /^GYNECOLOGY/i,
            /^PSYCHIATRY/i, /^DERMATOLOGY/i, /^ORTHOPEDICS/i, /^RADIOLOGY/i, /^ANESTHESIA/i,
            /^BIOCHEMISTRY/i, /^PHYSIOLOGY/i, /^ANATOMY/i, /^MICROBIOLOGY/i, /^PHARMACOLOGY/i,
            /^FORENSIC MEDICINE/i, /^COMMUNITY MEDICINE/i, /^RESPIRATORY MEDICINE/i,
            /^TRANSFUSION MEDICINE/i, /^EMERGENCY MEDICINE/i, /^HOSPITAL ADMINISTRATION/i,
            /^CHILD HEALTH/i, /^PUBLIC HEALTH/i, /^CONSERVATIVE DENTISTRY/i, /^ORAL SURGERY/i,
            /^PROSTHODONTICS/i, /^PAEDODONTICS/i, /^PERIODONTICS/i, /^ORTHODONTICS/i
        ];
        return coursePatterns.some(pattern => pattern.test(value));
    }

    isKEACategory(value) {
        const categoryPatterns = [
            /^GMPH$/i, /^GMP$/i, /^SC$/i, /^ST$/i, /^OBC$/i, /^CAT1$/i, /^CAT2$/i, /^CAT3$/i, /^CAT4$/i,
            /^GENERAL$/i, /^OPEN$/i, /^UR$/i, /^EWS$/i, /^PH$/i, /^PWD$/i, /^GM$/i, /^2AG$/i, /^2AH$/i,
            /^OPN$/i, /^MNG$/i, /^NRI$/i, /^ME$/i, /^SCG$/i, /^MU$/i, /^2BH$/i, /^MM$/i, /^GMH$/i, /^STG$/i,
            /^2BG$/i, /^ALL INDIA$/i, /^CENTRAL$/i, /^STATE$/i
        ];
        return categoryPatterns.some(pattern => pattern.test(value));
    }

    isKEARank(value) {
        return /^\d+$/.test(value);
    }

    async getDatabaseStats() {
        try {
            console.log('\n📊 Getting Database Statistics...');
            
            // Total records by counselling type
            const counsellingStats = await this.queryAll(`
                SELECT counselling_type, COUNT(*) as count 
                FROM cutoff_ranks_enhanced 
                GROUP BY counselling_type 
                ORDER BY counselling_type
            `);

            // Records by year
            const yearStats = await this.queryAll(`
                SELECT counselling_year, COUNT(*) as count 
                FROM cutoff_ranks_enhanced 
                GROUP BY counselling_year 
                ORDER BY counselling_year
            `);

            // Records by round
            const roundStats = await this.queryAll(`
                SELECT counselling_type, round_name, COUNT(*) as count 
                FROM cutoff_ranks_enhanced 
                GROUP BY counselling_type, round_name 
                ORDER BY counselling_type, round_name
            `);

            // Total unique colleges and courses
            const collegeCount = await this.queryOne('SELECT COUNT(DISTINCT college_id) as count FROM cutoff_ranks_enhanced');
            const courseCount = await this.queryOne('SELECT COUNT(DISTINCT course_id) as count FROM cutoff_ranks_enhanced');

            this.auditResults.databaseStats = {
                counsellingStats,
                yearStats,
                roundStats,
                collegeCount: collegeCount.count,
                courseCount: courseCount.count
            };

            // Calculate total database records
            this.auditResults.totalDatabaseRecords = counsellingStats.reduce((sum, stat) => sum + stat.count, 0);

            console.log(`  📊 Total database records: ${this.auditResults.totalDatabaseRecords}`);
            console.log(`  🏫 Unique colleges: ${collegeCount.count}`);
            console.log(`  📚 Unique courses: ${courseCount.count}`);

        } catch (error) {
            console.error('Error getting database stats:', error.message);
        }
    }

    async crossCheckData() {
        try {
            console.log('\n🔍 Cross-checking Data Integrity...');
            
            // Check for missing data patterns
            const missingDataChecks = [];

            // Check AIQ data completeness
            const aiqData = await this.queryAll(`
                SELECT counselling_year, round_name, COUNT(*) as count 
                FROM cutoff_ranks_enhanced 
                WHERE counselling_type LIKE 'AIQ_%' 
                GROUP BY counselling_year, round_name 
                ORDER BY counselling_year, round_name
            `);

            // Check KEA data completeness
            const keaData = await this.queryAll(`
                SELECT counselling_year, round_name, COUNT(*) as count 
                FROM cutoff_ranks_enhanced 
                WHERE counselling_type = 'KEA' 
                GROUP BY counselling_year, round_name 
                ORDER BY counselling_year, round_name
            `);

            // Check for data quality issues
            const qualityIssues = await this.queryAll(`
                SELECT 
                    COUNT(*) as total_records,
                    COUNT(CASE WHEN cutoff_rank IS NULL OR cutoff_rank = 0 THEN 1 END) as null_ranks,
                    COUNT(CASE WHEN college_id IS NULL THEN 1 END) as null_colleges,
                    COUNT(CASE WHEN course_id IS NULL THEN 1 END) as null_courses
                FROM cutoff_ranks_enhanced
            `);

            this.auditResults.dataQuality = {
                aiqData,
                keaData,
                qualityIssues: qualityIssues[0]
            };

            // Identify potential missing data
            this.identifyMissingData();

        } catch (error) {
            console.error('Error cross-checking data:', error.message);
        }
    }

    identifyMissingData() {
        try {
            console.log('\n🔍 Identifying Missing Data...');
            
            const missingData = [];

            // Check for expected years and rounds
            const expectedYears = [2023, 2024];
            const expectedRounds = ['Round 1', 'Round 2', 'Round 3', 'Round 4', 'Round 5', 'STRAY', 'EXTENDED_STRAY', 'MOPUP', 'SPECIAL_STRAY'];

            // Check AIQ data completeness
            for (const year of expectedYears) {
                for (const round of ['Round 1', 'Round 2', 'Round 3', 'Round 4', 'Round 5']) {
                    const aiqPG = this.auditResults.dataQuality.aiqData.find(d => 
                        d.counselling_year === year && d.round_name === round && d.counselling_type === 'AIQ_PG'
                    );
                    const aiqUG = this.auditResults.dataQuality.aiqData.find(d => 
                        d.counselling_year === year && d.round_name === round && d.counselling_type === 'AIQ_UG'
                    );

                    if (!aiqPG || aiqPG.count === 0) {
                        missingData.push(`AIQ_PG ${year} ${round} - Missing or empty`);
                    }
                    if (!aiqUG || aiqUG.count === 0) {
                        missingData.push(`AIQ_UG ${year} ${round} - Missing or empty`);
                    }
                }
            }

            // Check KEA data completeness
            for (const year of expectedYears) {
                for (const round of expectedRounds) {
                    const keaData = this.auditResults.dataQuality.keaData.find(d => 
                        d.counselling_year === year && d.round_name === round
                    );

                    if (!keaData || keaData.count === 0) {
                        missingData.push(`KEA ${year} ${round} - Missing or empty`);
                    }
                }
            }

            this.auditResults.missingData = missingData;
            this.auditResults.missingRecords = this.auditResults.totalExpectedRecords - this.auditResults.totalDatabaseRecords;

            console.log(`  ❌ Missing records: ${this.auditResults.missingRecords}`);
            console.log(`  📋 Missing data patterns: ${missingData.length}`);

        } catch (error) {
            console.error('Error identifying missing data:', error.message);
        }
    }

    async generateAuditReport() {
        try {
            console.log('\n📋 Generating Comprehensive Audit Report...');
            
            const report = {
                timestamp: new Date().toISOString(),
                summary: {
                    totalExcelFiles: this.auditResults.totalExcelFiles,
                    totalExpectedRecords: this.auditResults.totalExpectedRecords,
                    totalDatabaseRecords: this.auditResults.totalDatabaseRecords,
                    missingRecords: this.auditResults.missingRecords,
                    importEfficiency: ((this.auditResults.totalDatabaseRecords / this.auditResults.totalExpectedRecords) * 100).toFixed(2) + '%'
                },
                fileAnalysis: this.auditResults.fileAnalysis,
                databaseStats: this.auditResults.databaseStats,
                dataQuality: this.auditResults.dataQuality,
                missingData: this.auditResults.missingData,
                recommendations: this.generateRecommendations()
            };

            // Save report to file
            const reportPath = path.join(__dirname, 'database-audit-report.json');
            fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
            console.log(`  📄 Report saved to: ${reportPath}`);

            // Display summary
            this.displayAuditSummary(report);

            return report;

        } catch (error) {
            console.error('Error generating audit report:', error.message);
        }
    }

    generateRecommendations() {
        const recommendations = [];

        if (this.auditResults.missingRecords > 0) {
            recommendations.push(`Investigate missing ${this.auditResults.missingRecords} records`);
        }

        if (this.auditResults.dataQuality.qualityIssues.null_ranks > 0) {
            recommendations.push(`Fix ${this.auditResults.dataQuality.qualityIssues.null_ranks} records with null cutoff ranks`);
        }

        if (this.auditResults.dataQuality.qualityIssues.null_colleges > 0) {
            recommendations.push(`Fix ${this.auditResults.dataQuality.qualityIssues.null_colleges} records with null college IDs`);
        }

        if (this.auditResults.missingData.length > 0) {
            recommendations.push(`Address ${this.auditResults.missingData.length} missing data patterns`);
        }

        if (recommendations.length === 0) {
            recommendations.push('Database appears to be complete and healthy');
        }

        return recommendations;
    }

    displayAuditSummary(report) {
        console.log('\n' + '='.repeat(80));
        console.log('📊 COMPREHENSIVE DATABASE AUDIT SUMMARY');
        console.log('='.repeat(80));
        
        console.log(`📁 Excel Files Analyzed: ${report.summary.totalExcelFiles}`);
        console.log(`📊 Expected Records: ${report.summary.totalExpectedRecords.toLocaleString()}`);
        console.log(`💾 Database Records: ${report.summary.totalDatabaseRecords.toLocaleString()}`);
        console.log(`❌ Missing Records: ${report.summary.missingRecords.toLocaleString()}`);
        console.log(`📈 Import Efficiency: ${report.summary.importEfficiency}`);
        
        console.log('\n🏗️  Database Structure:');
        console.log(`  🏫 Unique Colleges: ${report.databaseStats.collegeCount}`);
        console.log(`  📚 Unique Courses: ${report.databaseStats.courseCount}`);
        
        console.log('\n🔍 Data Quality:');
        console.log(`  📊 Total Records: ${report.dataQuality.qualityIssues.total_records}`);
        console.log(`  ❌ Null Ranks: ${report.dataQuality.qualityIssues.null_ranks}`);
        console.log(`  ❌ Null Colleges: ${report.dataQuality.qualityIssues.null_colleges}`);
        console.log(`  ❌ Null Courses: ${report.dataQuality.qualityIssues.null_courses}`);
        
        if (report.missingData.length > 0) {
            console.log('\n❌ Missing Data Patterns:');
            report.missingData.forEach(item => console.log(`  - ${item}`));
        }
        
        console.log('\n💡 Recommendations:');
        report.recommendations.forEach(rec => console.log(`  - ${rec}`));
        
        console.log('='.repeat(80));
    }

    async queryAll(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async queryOne(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    async runAudit() {
        try {
            console.log('🚀 Starting Comprehensive Database Audit...');
            
            await this.connect();
            
            // Get all Excel files
            const cleanedCutoffsDir = './data/cleaned_cutoffs';
            if (!fs.existsSync(cleanedCutoffsDir)) {
                throw new Error('Cleaned cutoffs directory not found');
            }

            const items = fs.readdirSync(cleanedCutoffsDir);
            const excelFiles = items.filter(item => 
                (item.endsWith('.xlsx') || item.endsWith('.xls')) &&
                (item.startsWith('AIQ_') || item.startsWith('KEA_'))
            ).sort();

            this.auditResults.totalExcelFiles = excelFiles.length;
            console.log(`📁 Found ${excelFiles.length} Excel files to analyze`);

            // Analyze each Excel file
            for (const file of excelFiles) {
                const filePath = path.join(cleanedCutoffsDir, file);
                await this.analyzeExcelFile(filePath);
            }

            // Get database statistics
            await this.getDatabaseStats();

            // Cross-check data integrity
            await this.crossCheckData();

            // Generate comprehensive report
            const report = await this.generateAuditReport();

            return report;

        } catch (error) {
            console.error('❌ Audit failed:', error.message);
        } finally {
            await this.disconnect();
        }
    }
}

// Run the comprehensive audit
const auditor = new ComprehensiveDatabaseAudit();
auditor.runAudit();
