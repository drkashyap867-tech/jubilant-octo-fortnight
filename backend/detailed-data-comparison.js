const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class DetailedDataComparison {
    constructor() {
        this.dbPath = path.join(__dirname, 'data', 'cutoff_ranks_enhanced.db');
        this.db = null;
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

    async analyzeExcelFileDetailed(filePath) {
        try {
            const filename = path.basename(filePath);
            console.log(`\n🔍 DETAILED ANALYSIS: ${filename}`);
            
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            
            console.log(`  📄 Sheet: ${sheetName}`);
            console.log(`  📊 Total rows: ${rawData.length}`);
            
            if (filename.startsWith('AIQ_')) {
                return this.analyzeAIQFileDetailed(rawData, filename);
            } else if (filename.startsWith('KEA_')) {
                return this.analyzeKEAFileDetailed(rawData, filename);
            }
            
        } catch (error) {
            console.error(`❌ Error analyzing ${filePath}:`, error.message);
            return null;
        }
    }

    analyzeAIQFileDetailed(rawData, filename) {
        try {
            if (rawData.length < 2) {
                console.log(`  ❌ Insufficient data rows`);
                return { expectedRecords: 0, issues: ['Insufficient data rows'] };
            }

            // AIQ files have headers in first row, data starts from second row
            let recordCount = 0;
            let emptyRows = 0;
            let headerRow = rawData[0];
            
            console.log(`  📋 Headers: ${headerRow ? headerRow.slice(0, 5).join(' | ') : 'None'}`);
            
            for (let i = 1; i < rawData.length; i++) {
                const row = rawData[i];
                if (row && row.length > 0 && row[0] && row[0].toString().trim() !== '') {
                    recordCount++;
                } else {
                    emptyRows++;
                }
            }
            
            console.log(`  📊 Data rows: ${recordCount}`);
            console.log(`  ⬜ Empty rows: ${emptyRows}`);
            console.log(`  💡 Expected records: ${recordCount}`);
            
            return { expectedRecords: recordCount, issues: [] };
            
        } catch (error) {
            console.error(`  ❌ Error in AIQ analysis:`, error.message);
            return { expectedRecords: 0, issues: [error.message] };
        }
    }

    analyzeKEAFileDetailed(rawData, filename) {
        try {
            if (rawData.length < 3) {
                console.log(`  ❌ Insufficient data rows`);
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
            
            // Calculate potential records based on the structure
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
            // Extract file info from filename
            const fileInfo = this.parseFilename(filename);
            if (!fileInfo) {
                console.log(`  ❌ Could not parse filename: ${filename}`);
                return { databaseRecords: 0, issues: ['Filename parsing failed'] };
            }

            console.log(`  🎯 Looking for: ${fileInfo.counsellingType} ${fileInfo.year} ${fileInfo.roundName}`);

            let query, params;
            if (fileInfo.counsellingType === 'KEA') {
                query = `
                    SELECT COUNT(*) as count 
                    FROM cutoff_ranks_enhanced 
                    WHERE counselling_type = ? 
                    AND counselling_year = ? 
                    AND round_name = ?
                `;
                params = [fileInfo.counsellingType, fileInfo.year, fileInfo.roundName];
            } else {
                query = `
                    SELECT COUNT(*) as count 
                    FROM cutoff_ranks_enhanced 
                    WHERE counselling_type = ? 
                    AND counselling_year = ? 
                    AND round_name = ?
                `;
                params = [fileInfo.counsellingType, fileInfo.year, fileInfo.roundName];
            }

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

    async queryOne(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    async runDetailedComparison() {
        try {
            console.log('🚀 Starting Detailed Data Comparison...');
            
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
                const excelAnalysis = await this.analyzeExcelFileDetailed(filePath);
                
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

            // Summary
            console.log('\n' + '='.repeat(80));
            console.log('📊 DETAILED COMPARISON SUMMARY');
            console.log('='.repeat(80));
            console.log(`📁 Files analyzed: ${excelFiles.length}`);
            console.log(`📊 Total Excel records: ${totalExcelRecords.toLocaleString()}`);
            console.log(`💾 Total database records: ${totalDatabaseRecords.toLocaleString()}`);
            console.log(`❌ Total discrepancy: ${(totalExcelRecords - totalDatabaseRecords).toLocaleString()}`);
            
            if (discrepancies.length > 0) {
                console.log('\n❌ FILES WITH DISCREPANCIES:');
                discrepancies.forEach(d => {
                    console.log(`  ${d.file}: Excel=${d.excelRecords}, DB=${d.dbRecords}, Diff=${d.discrepancy}`);
                });
            }

        } catch (error) {
            console.error('❌ Detailed comparison failed:', error.message);
        } finally {
            await this.disconnect();
        }
    }
}

// Run the detailed comparison
const comparer = new DetailedDataComparison();
comparer.runDetailedComparison();
