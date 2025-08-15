const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

class CutoffDataCleaner {
    constructor() {
        this.cutoffDir = path.join(__dirname, '../counselling_data/cutoffs');
        this.cleanedDir = path.join(__dirname, 'data/cleaned_cutoffs');
        this.ensureCleanedDirectory();
    }

    ensureCleanedDirectory() {
        if (!fs.existsSync(this.cleanedDir)) {
            fs.mkdirSync(this.cleanedDir, { recursive: true });
        }
    }

    // Fix rank spacing issues (e.g., "10248 0" -> "102480")
    cleanRankData(rankValue) {
        if (!rankValue) return rankValue;
        
        let rankStr = String(rankValue).trim();
        
        // Fix space after 5 digits issue
        // Pattern: 5 digits + space + 1+ digits
        const rankPattern = /^(\d{5})\s+(\d+)$/;
        const match = rankStr.match(rankPattern);
        
        if (match) {
            const fixedRank = match[1] + match[2];
            console.log(`🔧 Fixed rank: "${rankStr}" -> "${fixedRank}"`);
            return fixedRank;
        }
        
        // Remove any other spaces in rank numbers
        if (rankStr.includes(' ')) {
            const cleanedRank = rankStr.replace(/\s+/g, '');
            if (cleanedRank !== rankStr) {
                console.log(`🔧 Cleaned rank: "${rankStr}" -> "${cleanedRank}"`);
                return cleanedRank;
            }
        }
        
        return rankStr;
    }

    // Fix typo issues in quota and category fields
    cleanQuotaData(quotaValue) {
        if (!quotaValue) return quotaValue;
        
        let quotaStr = String(quotaValue).trim();
        
        // Fix specific typos
        const typoFixes = {
            'MANAGE MENT/PAI D SEATS QUOTA': 'MANAGEMENT/PAID SEATS QUOTA',
            'MANAGE MENT': 'MANAGEMENT',
            'PAI D SEATS': 'PAID SEATS',
            'PAI D': 'PAID',
            'MANAGE MENT/PAI D': 'MANAGEMENT/PAID',
            'OPEN CATEGORY': 'OPEN',
            'GENERAL CATEGORY': 'GENERAL',
            'UR CATEGORY': 'UR',
            'OBC CATEGORY': 'OBC',
            'SC CATEGORY': 'SC',
            'ST CATEGORY': 'ST',
            'EWS CATEGORY': 'EWS'
        };
        
        for (const [typo, fix] of Object.entries(typoFixes)) {
            if (quotaStr.includes(typo)) {
                const fixedQuota = quotaStr.replace(typo, fix);
                console.log(`🔧 Fixed quota typo: "${quotaStr}" -> "${fixedQuota}"`);
                return fixedQuota;
            }
        }
        
        return quotaStr;
    }

    // Clean college names
    cleanCollegeName(collegeName) {
        if (!collegeName) return collegeName;
        
        let name = String(collegeName).trim();
        
        // Remove duplicate college names (common in AIQ files)
        // Pattern: "COLLEGE NAME, COLLEGE NAME, STATE"
        const duplicatePattern = /^([^,]+),\s*\1\s*,/;
        const match = name.match(duplicatePattern);
        
        if (match) {
            const cleanedName = name.replace(duplicatePattern, match[1] + ',');
            console.log(`🔧 Fixed duplicate college name: "${name}" -> "${cleanedName}"`);
            return cleanedName;
        }
        
        return name;
    }

    // Clean course names
    cleanCourseName(courseName) {
        if (!courseName) return courseName;
        
        let name = String(courseName).trim();
        
        // Fix common course name issues
        const courseFixes = {
            'M.D. (': 'MD ',
            'M.S. (': 'MS ',
            'M.D. ': 'MD ',
            'M.S. ': 'MS ',
            'B.D.S. ': 'BDS ',
            'M.D.S. ': 'MDS ',
            'DIPLOMA IN ': 'Diploma ',
            'DIPLOMA ': 'Diploma '
        };
        
        for (const [typo, fix] of Object.entries(courseFixes)) {
            if (name.includes(typo)) {
                name = name.replace(typo, fix);
            }
        }
        
        // Remove trailing parentheses and clean up
        name = name.replace(/\)$/, '').trim();
        
        return name;
    }

    // Process a single Excel file
    async cleanExcelFile(filePath) {
        try {
            console.log(`\n🧹 Cleaning file: ${path.basename(filePath)}`);
            
            if (!fs.existsSync(filePath)) {
                console.error(`❌ File not found: ${filePath}`);
                return false;
            }

            // Read the Excel file
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            // Convert to JSON with headers
            const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            if (rawData.length < 2) {
                console.log(`⚠️  No data found in ${path.basename(filePath)}`);
                return false;
            }

            const headers = rawData[0];
            const dataRows = rawData.slice(1);
            
            console.log(`📊 Processing ${dataRows.length} rows...`);
            
            // Find column indices
            const columnMap = this.mapColumns(headers);
            
            // Clean each row
            let cleanedRows = 0;
            let totalFixes = 0;
            
            for (let i = 0; i < dataRows.length; i++) {
                const row = dataRows[i];
                const originalRow = [...row];
                let rowFixes = 0;
                
                // Clean rank data
                if (columnMap.rank !== -1 && row[columnMap.rank]) {
                    const originalRank = row[columnMap.rank];
                    const cleanedRank = this.cleanRankData(originalRank);
                    if (cleanedRank !== originalRank) {
                        row[columnMap.rank] = cleanedRank;
                        rowFixes++;
                    }
                }
                
                // Clean quota/category data
                if (columnMap.quota !== -1 && row[columnMap.quota]) {
                    const originalQuota = row[columnMap.quota];
                    const cleanedQuota = this.cleanQuotaData(originalQuota);
                    if (cleanedQuota !== originalQuota) {
                        row[columnMap.quota] = cleanedQuota;
                        rowFixes++;
                    }
                }
                
                // Clean college names
                if (columnMap.college !== -1 && row[columnMap.college]) {
                    const originalCollege = row[columnMap.college];
                    const cleanedCollege = this.cleanCollegeName(originalCollege);
                    if (cleanedCollege !== originalCollege) {
                        row[columnMap.college] = cleanedCollege;
                        rowFixes++;
                    }
                }
                
                // Clean course names
                if (columnMap.course !== -1 && row[columnMap.course]) {
                    const originalCourse = row[columnMap.course];
                    const cleanedCourse = this.cleanCourseName(originalCourse);
                    if (cleanedCourse !== originalCourse) {
                        row[columnMap.course] = cleanedCourse;
                        rowFixes++;
                    }
                }
                
                if (rowFixes > 0) {
                    cleanedRows++;
                    totalFixes += rowFixes;
                }
            }
            
            console.log(`✅ Cleaned ${cleanedRows} rows with ${totalFixes} total fixes`);
            
            // Create cleaned workbook
            const cleanedWorkbook = XLSX.utils.book_new();
            const cleanedWorksheet = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
            XLSX.utils.book_append_sheet(cleanedWorkbook, cleanedWorksheet, sheetName);
            
            // Save cleaned file
            const fileName = path.basename(filePath, path.extname(filePath));
            const cleanedFilePath = path.join(this.cleanedDir, `${fileName}_CLEANED.xlsx`);
            XLSX.writeFile(cleanedWorkbook, cleanedFilePath);
            
            console.log(`💾 Saved cleaned file: ${cleanedFilePath}`);
            
            return true;
            
        } catch (error) {
            console.error(`❌ Error cleaning file ${filePath}:`, error);
            return false;
        }
    }

    // Map columns based on headers
    mapColumns(headers) {
        const headersLower = headers.map(h => String(h).toLowerCase());
        
        return {
            college: this.findColumnIndex(headersLower, ['college', 'institute', 'hospital']),
            course: this.findColumnIndex(headersLower, ['course', 'mbbs', 'md', 'ms', 'bds', 'mds']),
            quota: this.findColumnIndex(headersLower, ['quota', 'category', 'reservation']),
            rank: this.findColumnIndex(headersLower, ['rank', 'cutoff', 'closing rank', 'merit rank']),
            state: this.findColumnIndex(headersLower, ['state', 'location']),
            seats: this.findColumnIndex(headersLower, ['seats', 'total seats', 'available seats'])
        };
    }

    findColumnIndex(headers, possibleNames) {
        for (const name of possibleNames) {
            const index = headers.findIndex(h => h.includes(name));
            if (index !== -1) return index;
        }
        return -1;
    }

    // Clean all cutoff files
    async cleanAllCutoffFiles() {
        try {
            console.log('🚀 Starting comprehensive cutoff data cleaning...\n');
            
            const cutoffDirs = fs.readdirSync(this.cutoffDir)
                .filter(item => fs.statSync(path.join(this.cutoffDir, item)).isDirectory())
                .filter(item => !item.startsWith('.'));

            let totalFiles = 0;
            let cleanedFiles = 0;
            let totalFixes = 0;

            for (const dir of cutoffDirs) {
                console.log(`\n📁 Processing directory: ${dir}`);
                const dirPath = path.join(this.cutoffDir, dir);
                const files = fs.readdirSync(dirPath)
                    .filter(file => file.endsWith('.xlsx') || file.endsWith('.xls'))
                    .filter(file => !file.startsWith('.'));

                for (const file of files) {
                    totalFiles++;
                    const filePath = path.join(dirPath, file);
                    const success = await this.cleanExcelFile(filePath);
                    if (success) cleanedFiles++;
                }
            }

            console.log(`\n🎉 Data cleaning completed!`);
            console.log(`📊 Total files processed: ${totalFiles}`);
            console.log(`✅ Successfully cleaned: ${cleanedFiles}`);
            console.log(`📁 Cleaned files saved to: ${this.cleanedDir}`);

            return {
                success: true,
                totalFiles,
                cleanedFiles,
                cleanedDir: this.cleanedDir
            };

        } catch (error) {
            console.error('❌ Data cleaning failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Generate cleaning report
    generateCleaningReport() {
        try {
            const reportPath = path.join(this.cleanedDir, 'CLEANING_REPORT.md');
            const report = `# Cutoff Data Cleaning Report

## Summary
- **Date**: ${new Date().toISOString()}
- **Total Files Processed**: ${this.totalFiles || 'Unknown'}
- **Successfully Cleaned**: ${this.cleanedFiles || 'Unknown'}

## Issues Fixed

### 1. Rank Spacing Issues
- Fixed ranks with spaces after 5 digits (e.g., "10248 0" → "102480")
- Removed all unnecessary spaces in rank numbers

### 2. Typo Corrections
- "MANAGE MENT" → "MANAGEMENT"
- "PAI D SEATS" → "PAID SEATS"
- "MANAGE MENT/PAI D SEATS QUOTA" → "MANAGEMENT/PAID SEATS QUOTA"

### 3. College Name Cleanup
- Removed duplicate college names
- Standardized formatting

### 4. Course Name Cleanup
- Standardized MD/MS/BDS/MDS abbreviations
- Cleaned up parentheses and formatting

## Files Cleaned
${this.cleanedFiles ? 'All files have been processed and cleaned.' : 'No files were successfully cleaned.'}

## Next Steps
1. Review cleaned files in: \`${this.cleanedDir}\`
2. Import cleaned data into the cutoff database
3. Verify data quality improvements
`;

            fs.writeFileSync(reportPath, report);
            console.log(`📋 Cleaning report saved: ${reportPath}`);

        } catch (error) {
            console.error('❌ Failed to generate cleaning report:', error);
        }
    }
}

// Main execution
async function main() {
    const cleaner = new CutoffDataCleaner();
    
    try {
        const result = await cleaner.cleanAllCutoffFiles();
        
        if (result.success) {
            cleaner.generateCleaningReport();
        }
        
    } catch (error) {
        console.error('❌ Main execution failed:', error);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { CutoffDataCleaner };
