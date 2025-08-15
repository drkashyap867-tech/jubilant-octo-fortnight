const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class PerfectDataAnalyzer {
    constructor() {
        this.dbPath = path.join(__dirname, 'data', 'cutoff_ranks_enhanced.db');
        this.db = null;
        this.analysisResults = {
            missingData: {},
            importIssues: {},
            recommendations: []
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

    async analyzeExcelFilePerfection(filePath) {
        try {
            const filename = path.basename(filePath);
            console.log(`\n🔍 PERFECTION ANALYSIS: ${filename}`);
            
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            
            console.log(`  📄 Sheet: ${sheetName}`);
            console.log(`  📊 Total rows: ${rawData.length}`);
            
            if (filename.startsWith('AIQ_')) {
                return this.analyzeAIQFilePerfection(rawData, filename);
            } else if (filename.startsWith('KEA_')) {
                return this.analyzeKEAFilePerfection(rawData, filename);
            }
            
        } catch (error) {
            console.error(`❌ Error analyzing ${filePath}:`, error.message);
            return null;
        }
    }

    analyzeAIQFilePerfection(rawData, filename) {
        try {
            if (rawData.length < 2) {
                return { expectedRecords: 0, issues: ['Insufficient data rows'] };
            }

            const headers = rawData[0];
            const dataRows = rawData.slice(1);
            
            console.log(`  📋 Headers: ${headers.slice(0, 5).join(' | ')}`);
            console.log(`  📊 Data rows: ${dataRows.length}`);
            
            // Analyze column structure
            const columnAnalysis = this.analyzeAIQColumns(headers);
            console.log(`  🏗️  Column structure: ${JSON.stringify(columnAnalysis)}`);
            
            // Count valid records
            let validRecords = 0;
            let invalidRecords = 0;
            let emptyRecords = 0;
            
            for (let i = 0; i < dataRows.length; i++) {
                const row = dataRows[i];
                if (!row || row.length === 0) {
                    emptyRecords++;
                    continue;
                }
                
                const hasRequiredData = this.hasRequiredAIQData(row, columnAnalysis);
                if (hasRequiredData) {
                    validRecords++;
                } else {
                    invalidRecords++;
                }
            }
            
            console.log(`  ✅ Valid records: ${validRecords}`);
            console.log(`  ❌ Invalid records: ${invalidRecords}`);
            console.log(`  ⬜ Empty records: ${emptyRecords}`);
            
            return { 
                expectedRecords: validRecords, 
                issues: [],
                columnAnalysis: columnAnalysis
            };
            
        } catch (error) {
            console.error(`  ❌ Error in AIQ analysis:`, error.message);
            return { expectedRecords: 0, issues: [error.message] };
        }
    }

    analyzeAIQColumns(headers) {
        const analysis = {
            collegeCol: -1,
            courseCol: -1,
            quotaCol: -1,
            categoryCol: -1,
            rankCol: -1,
            seatsCol: -1,
            feesCol: -1
        };
        
        headers.forEach((header, index) => {
            const headerStr = header?.toString().toLowerCase() || '';
            
            if (headerStr.includes('college') || headerStr.includes('institute') || headerStr.includes('hospital')) {
                analysis.collegeCol = index;
            } else if (headerStr.includes('course') || headerStr.includes('specialization')) {
                analysis.courseCol = index;
            } else if (headerStr.includes('quota') || headerStr.includes('category')) {
                analysis.quotaCol = index;
            } else if (headerStr.includes('category') || headerStr.includes('reservation')) {
                analysis.categoryCol = index;
            } else if (headerStr.includes('rank') || headerStr.includes('cutoff') || headerStr.includes('all india')) {
                analysis.rankCol = index;
            } else if (headerStr.includes('seat') || headerStr.includes('vacancy')) {
                analysis.seatsCol = index;
            } else if (headerStr.includes('fee') || headerStr.includes('cost')) {
                analysis.feesCol = index;
            }
        });
        
        return analysis;
    }

    hasRequiredAIQData(row, columnAnalysis) {
        const college = row[columnAnalysis.collegeCol]?.toString().trim();
        const course = row[columnAnalysis.courseCol]?.toString().trim();
        const quota = row[columnAnalysis.quotaCol]?.toString().trim();
        const category = row[columnAnalysis.categoryCol]?.toString().trim();
        const rank = row[columnAnalysis.rankCol]?.toString().trim();
        
        return college && course && quota && category && rank && !isNaN(parseInt(rank));
    }

    analyzeKEAFilePerfection(rawData, filename) {
        try {
            if (rawData.length < 3) {
                return { expectedRecords: 0, issues: ['Insufficient data rows'] };
            }

            let courseCount = 0;
            let categoryCount = 0;
            let rankCount = 0;
            let collegeCount = 0;
            let otherCount = 0;
            let emptyCount = 0;

            for (let i = 0; i < rawData.length; i++) {
                const row = rawData[i];
                if (!row || !row[0]) {
                    emptyCount++;
                    continue;
                }

                const cell = row[0].toString().trim();
                if (cell === '' || cell === 'Grand Total') {
                    emptyCount++;
                    continue;
                }

                if (this.isKEACollege(cell)) {
                    collegeCount++;
                } else if (this.isKEACourse(cell)) {
                    courseCount++;
                } else if (this.isKEACategory(cell)) {
                    categoryCount++;
                } else if (this.isKEARank(cell)) {
                    rankCount++;
                } else {
                    otherCount++;
                }
            }
            
            console.log(`  🏫 Colleges: ${collegeCount}`);
            console.log(`  📚 Courses: ${courseCount}`);
            console.log(`  🏷️  Categories: ${categoryCount}`);
            console.log(`  📊 Ranks: ${rankCount}`);
            console.log(`  ❓ Other: ${otherCount}`);
            console.log(`  ⬜ Empty: ${emptyCount}`);
            
            const potentialRecords = Math.min(courseCount, categoryCount, rankCount);
            console.log(`  💡 Potential records: ${potentialRecords}`);
            
            return { expectedRecords: potentialRecords, issues: [] };
            
        } catch (error) {
            console.error(`  ❌ Error in KEA analysis:`, error.message);
            return { expectedRecords: 0, issues: [error.message] };
        }
    }

    isKEACollege(value) {
        return value.includes(',') && (
            value.includes('INSTITUTE') || 
            value.includes('COLLEGE') || 
            value.includes('HOSPITAL') ||
            value.includes('MEDICAL') ||
            value.includes('DENTAL')
        );
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

    async getDatabaseRecordsForFile(filename) {
        try {
            const fileInfo = this.parseFilename(filename);
            if (!fileInfo) {
                return { databaseRecords: 0, issues: ['Filename parsing failed'] };
            }

            console.log(`  🎯 Looking for: ${fileInfo.counsellingType} ${fileInfo.year} ${fileInfo.roundName}`);

            const query = `
                SELECT COUNT(*) as count 
                FROM cutoff_ranks_enhanced 
                WHERE counselling_type = ? 
                AND counselling_year = ? 
                AND round_name = ?
            `;
            const params = [fileInfo.counsellingType, fileInfo.year, fileInfo.roundName];

            const result = await this.queryOne(query, params);
            const count = result ? result.count : 0;
            
            console.log(`  💾 Database records: ${count}`);
            
            return { databaseRecords: count, issues: [] };

        } catch (error) {
            console.error(`  ❌ Error querying database:`, error.message);
            return { databaseRecords: 0, issues: [error.message] };
        }
    }

    parseFilename(filename) {
        // AIQ_PG_2023_R1_CLEANED.xlsx
        const aiqMatch = filename.match(/AIQ_(PG|UG)_(\d{4})_R(\d+)/);
        if (aiqMatch) {
            return {
                counsellingType: `AIQ_${aiqMatch[1]}`,
                year: parseInt(aiqMatch[2]),
                roundName: `Round ${aiqMatch[3]}`
            };
        }

        // AIQ_PG_2023_SPECIAL_STRAY_CLEANED.xlsx
        const specialStrayMatch = filename.match(/AIQ_(PG|UG)_(\d{4})_SPECIAL_STRAY/);
        if (specialStrayMatch) {
            return {
                counsellingType: `AIQ_${specialStrayMatch[1]}`,
                year: parseInt(specialStrayMatch[2]),
                roundName: 'SPECIAL_STRAY'
            };
        }

        // AIQ_PG_2023_STRAY_CLEANED.xlsx
        const strayMatch = filename.match(/AIQ_(PG|UG)_(\d{4})_STRAY/);
        if (strayMatch) {
            return {
                counsellingType: `AIQ_${strayMatch[1]}`,
                year: parseInt(strayMatch[2]),
                roundName: 'STRAY'
            };
        }

        // KEA_2023_MEDICAL_R1_CLEANED.xlsx
        const keaMatch = filename.match(/KEA_(\d{4})_(MEDICAL|DENTAL)_R(\d+)/);
        if (keaMatch) {
            return {
                counsellingType: 'KEA',
                year: parseInt(keaMatch[1]),
                roundName: `Round ${keaMatch[2]}`
            };
        }

        // KEA_2023_MEDICAL_EXTENDED_STRAY_CLEANED.xlsx
        const keaExtendedMatch = filename.match(/KEA_(\d{4})_(MEDICAL|DENTAL)_EXTENDED_STRAY/);
        if (keaExtendedMatch) {
            return {
                counsellingType: 'KEA',
                year: parseInt(keaExtendedMatch[1]),
                roundName: 'EXTENDED_STRAY'
            };
        }

        // KEA_2023_MEDICAL_STRAY_CLEANED.xlsx
        const keaStrayMatch = filename.match(/KEA_(\d{4})_(MEDICAL|DENTAL)_STRAY/);
        if (keaStrayMatch) {
            return {
                counsellingType: 'KEA',
                year: parseInt(keaStrayMatch[1]),
                roundName: 'STRAY'
            };
        }

        // KEA_2023_DENTAL_MOPUP_CLEANED.xlsx
        const keaMopupMatch = filename.match(/KEA_(\d{4})_(MEDICAL|DENTAL)_MOPUP/);
        if (keaMopupMatch) {
            return {
                counsellingType: 'KEA',
                year: parseInt(keaMopupMatch[1]),
                roundName: 'MOPUP'
            };
        }

        return null;
    }

    async analyzeDatabaseGaps() {
        try {
            console.log('\n🔍 Analyzing Database Gaps...');
            
            // Check for missing years and rounds
            const missingData = await this.identifyMissingData();
            
            // Check for data quality issues
            const qualityIssues = await this.checkDataQuality();
            
            // Generate recommendations
            const recommendations = this.generateRecommendations(missingData, qualityIssues);
            
            this.analysisResults.missingData = missingData;
            this.analysisResults.qualityIssues = qualityIssues;
            this.analysisResults.recommendations = recommendations;
            
            return { missingData, qualityIssues, recommendations };
            
        } catch (error) {
            console.error('Error analyzing database gaps:', error.message);
        }
    }

    async identifyMissingData() {
        try {
            const missingData = [];
            
            // Check for expected years and rounds
            const expectedYears = [2023, 2024];
            const expectedRounds = ['Round 1', 'Round 2', 'Round 3', 'Round 4', 'Round 5', 'STRAY', 'EXTENDED_STRAY', 'MOPUP', 'SPECIAL_STRAY'];

            // Check AIQ data completeness
            for (const year of expectedYears) {
                for (const round of ['Round 1', 'Round 2', 'Round 3', 'Round 4', 'Round 5']) {
                    const aiqPG = await this.queryOne(`
                        SELECT COUNT(*) as count 
                        FROM cutoff_ranks_enhanced 
                        WHERE counselling_type = 'AIQ_PG' 
                        AND counselling_year = ? 
                        AND round_name = ?
                    `, [year, round]);
                    
                    const aiqUG = await this.queryOne(`
                        SELECT COUNT(*) as count 
                        FROM cutoff_ranks_enhanced 
                        WHERE counselling_type = 'AIQ_UG' 
                        AND counselling_year = ? 
                        AND round_name = ?
                    `, [year, round]);

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
                    const keaData = await this.queryOne(`
                        SELECT COUNT(*) as count 
                        FROM cutoff_ranks_enhanced 
                        WHERE counselling_type = 'KEA' 
                        AND counselling_year = ? 
                        AND round_name = ?
                    `, [year, round]);

                    if (!keaData || keaData.count === 0) {
                        missingData.push(`KEA ${year} ${round} - Missing or empty`);
                    }
                }
            }

            return missingData;
            
        } catch (error) {
            console.error('Error identifying missing data:', error.message);
            return [];
        }
    }

    async checkDataQuality() {
        try {
            const qualityIssues = [];
            
            // Check for null values
            const nullChecks = await this.queryAll(`
                SELECT 
                    COUNT(*) as total_records,
                    COUNT(CASE WHEN cutoff_rank IS NULL OR cutoff_rank = 0 THEN 1 END) as null_ranks,
                    COUNT(CASE WHEN college_id IS NULL THEN 1 END) as null_colleges,
                    COUNT(CASE WHEN course_id IS NULL THEN 1 END) as null_courses,
                    COUNT(CASE WHEN counselling_type IS NULL THEN 1 END) as null_counselling_type,
                    COUNT(CASE WHEN counselling_year IS NULL THEN 1 END) as null_year,
                    COUNT(CASE WHEN round_name IS NULL THEN 1 END) as null_round
                FROM cutoff_ranks_enhanced
            `);
            
            const stats = nullChecks[0];
            
            if (stats.null_ranks > 0) qualityIssues.push(`Null cutoff ranks: ${stats.null_ranks}`);
            if (stats.null_colleges > 0) qualityIssues.push(`Null college IDs: ${stats.null_colleges}`);
            if (stats.null_courses > 0) qualityIssues.push(`Null course IDs: ${stats.null_courses}`);
            if (stats.null_counselling_type > 0) qualityIssues.push(`Null counselling types: ${stats.null_counselling_type}`);
            if (stats.null_year > 0) qualityIssues.push(`Null years: ${stats.null_year}`);
            if (stats.null_round > 0) qualityIssues.push(`Null rounds: ${stats.null_round}`);
            
            return qualityIssues;
            
        } catch (error) {
            console.error('Error checking data quality:', error.message);
            return [];
        }
    }

    generateRecommendations(missingData, qualityIssues) {
        const recommendations = [];
        
        if (missingData.length > 0) {
            recommendations.push(`Import missing data for ${missingData.length} patterns`);
        }
        
        if (qualityIssues.length > 0) {
            recommendations.push(`Fix ${qualityIssues.length} data quality issues`);
        }
        
        if (recommendations.length === 0) {
            recommendations.push('Database appears to be complete and healthy');
        }
        
        return recommendations;
    }

    async queryOne(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    async queryAll(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async runPerfectAnalysis() {
        try {
            console.log('🚀 Starting PERFECT Data Analysis for 100% Efficiency...');
            
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

            console.log(`📁 Found ${excelFiles.length} Excel files to analyze`);

            let totalExcelRecords = 0;
            let totalDatabaseRecords = 0;
            let discrepancies = [];

            // Analyze each file in detail
            for (const file of excelFiles) {
                const filePath = path.join(cleanedCutoffsDir, file);
                
                // Analyze Excel file
                const excelAnalysis = await this.analyzeExcelFilePerfection(filePath);
                
                // Get database records for this file
                const dbAnalysis = await this.getDatabaseRecordsForFile(file);
                
                if (excelAnalysis && dbAnalysis) {
                    totalExcelRecords += excelAnalysis.expectedRecords;
                    totalDatabaseRecords += dbAnalysis.databaseRecords;
                    
                    const discrepancy = excelAnalysis.expectedRecords - dbAnalysis.databaseRecords;
                    if (discrepancy !== 0) {
                        discrepancies.push({
                            file: file,
                            excelRecords: excelAnalysis.expectedRecords,
                            dbRecords: dbAnalysis.databaseRecords,
                            discrepancy: discrepancy
                        });
                    }
                }
                
                console.log(`  📊 Discrepancy: ${excelAnalysis.expectedRecords - dbAnalysis.databaseRecords}`);
                console.log('  ' + '─'.repeat(60));
            }

            // Analyze database gaps
            const gapAnalysis = await this.analyzeDatabaseGaps();

            // Summary
            console.log('\n' + '='.repeat(80));
            console.log('🎯 PERFECT DATA ANALYSIS SUMMARY FOR 100% EFFICIENCY');
            console.log('='.repeat(80));
            console.log(`📁 Files analyzed: ${excelFiles.length}`);
            console.log(`📊 Total Excel records: ${totalExcelRecords.toLocaleString()}`);
            console.log(`💾 Total database records: ${totalDatabaseRecords.toLocaleString()}`);
            console.log(`❌ Total discrepancy: ${(totalExcelRecords - totalDatabaseRecords).toLocaleString()}`);
            console.log(`📈 Current efficiency: ${((totalDatabaseRecords / totalExcelRecords) * 100).toFixed(2)}%`);
            
            if (discrepancies.length > 0) {
                console.log('\n❌ FILES WITH DISCREPANCIES:');
                discrepancies.forEach(d => {
                    console.log(`  ${d.file}: Excel=${d.excelRecords}, DB=${d.dbRecords}, Diff=${d.discrepancy}`);
                });
            }

            if (gapAnalysis.missingData.length > 0) {
                console.log('\n❌ MISSING DATA PATTERNS:');
                gapAnalysis.missingData.forEach(item => console.log(`  - ${item}`));
            }

            if (gapAnalysis.qualityIssues.length > 0) {
                console.log('\n⚠️  DATA QUALITY ISSUES:');
                gapAnalysis.qualityIssues.forEach(issue => console.log(`  - ${issue}`));
            }

            console.log('\n💡 RECOMMENDATIONS FOR 100% PERFECTION:');
            gapAnalysis.recommendations.forEach(rec => console.log(`  - ${rec}`));

            console.log('\n🎯 ROADMAP TO 100% EFFICIENCY:');
            console.log(`  1. Import missing ${(totalExcelRecords - totalDatabaseRecords).toLocaleString()} records`);
            console.log(`  2. Fix ${gapAnalysis.qualityIssues.length} quality issues`);
            console.log(`  3. Address ${gapAnalysis.missingData.length} missing patterns`);
            console.log(`  4. Achieve 100% data coverage`);

        } catch (error) {
            console.error('❌ Perfect analysis failed:', error.message);
        } finally {
            await this.disconnect();
        }
    }
}

// Run the perfect analysis
const analyzer = new PerfectDataAnalyzer();
analyzer.runPerfectAnalysis();
