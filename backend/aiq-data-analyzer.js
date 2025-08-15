const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

class AIQDataAnalyzer {
    constructor() {
        this.patterns = {
            courses: new Set(),
            quotas: new Set(),
            categories: new Set(),
            unknown: new Set()
        };
        this.fileAnalysis = {};
    }

    analyzeAIQFile(filePath) {
        try {
            const filename = path.basename(filePath);
            console.log(`\n🔍 ANALYZING: ${filename}`);
            
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            
            if (rawData.length < 2) return;

            const headers = rawData[0];
            const dataRows = rawData.slice(1);
            
            console.log(`  📊 Rows: ${rawData.length}, Data: ${dataRows.length}`);
            console.log(`  📋 Headers: ${headers.slice(0, 3).join(' | ')}`);

            // Analyze each college column
            for (let colIndex = 0; colIndex < headers.length; colIndex++) {
                const header = headers[colIndex]?.toString().trim();
                if (!header || header === '') continue;

                const collegeName = this.extractCollegeName(header);
                if (!collegeName) continue;

                console.log(`    🏫 College: ${collegeName}`);
                this.analyzeCollegeColumn(rawData, colIndex, collegeName);
            }

        } catch (error) {
            console.error(`❌ Error analyzing ${filePath}:`, error.message);
        }
    }

    extractCollegeName(header) {
        const parts = header.split(',');
        return parts[0]?.trim() || header;
    }

    analyzeCollegeColumn(rawData, colIndex, collegeName) {
        let courseCount = 0;
        let quotaCount = 0;
        let categoryCount = 0;
        let rankCount = 0;
        let unknownCount = 0;

        // Analyze first 100 rows for patterns
        for (let rowIndex = 1; rowIndex < Math.min(101, rawData.length); rowIndex++) {
            const row = rawData[rowIndex];
            if (!row || row.length <= colIndex) continue;

            const cellValue = row[colIndex]?.toString().trim();
            if (!cellValue || cellValue === '') continue;

            // Categorize the cell value
            if (this.isCourse(cellValue)) {
                this.patterns.courses.add(cellValue);
                courseCount++;
            } else if (this.isQuota(cellValue)) {
                this.patterns.quotas.add(cellValue);
                quotaCount++;
            } else if (this.isCategory(cellValue)) {
                this.patterns.categories.add(cellValue);
                categoryCount++;
            } else if (this.isRank(cellValue)) {
                rankCount++;
            } else {
                this.patterns.unknown.add(cellValue);
                unknownCount++;
            }
        }

        console.log(`      📚 Courses: ${courseCount}, 🏷️ Quotas: ${quotaCount}, 🎯 Categories: ${categoryCount}, 📊 Ranks: ${rankCount}, ❓ Unknown: ${unknownCount}`);
    }

    isCourse(value) {
        const coursePatterns = [
            /^M\.D\./i, /^M\.S\./i, /^MBBS/i, /^BDS/i, /^MDS/i, /^DNB/i, /^DIPLOMA/i,
            /^GENERAL MEDICINE/i, /^SURGERY/i, /^PEDIATRICS/i, /^OBSTETRICS/i, /^GYNECOLOGY/i,
            /^PSYCHIATRY/i, /^DERMATOLOGY/i, /^ORTHOPEDICS/i, /^RADIOLOGY/i, /^ANESTHESIA/i,
            /^BIOCHEMISTRY/i, /^PHYSIOLOGY/i, /^ANATOMY/i, /^MICROBIOLOGY/i, /^PHARMACOLOGY/i,
            /^FORENSIC MEDICINE/i, /^COMMUNITY MEDICINE/i, /^RESPIRATORY MEDICINE/i,
            /^TRANSFUSION MEDICINE/i, /^EMERGENCY MEDICINE/i, /^HOSPITAL ADMINISTRATION/i,
            /^CHILD HEALTH/i, /^PUBLIC HEALTH/i, /^PREVENTIVE MEDICINE/i, /^PATHOLOGY/i,
            /^LABORATORY MEDICINE/i, /^CLINICAL PHARMACOLOGY/i, /^IMMUNOLOGY/i,
            /^CONSERVATIVE DENTISTRY/i, /^ORAL SURGERY/i, /^PROSTHODONTICS/i, /^PAEDODONTICS/i,
            /^PERIODONTICS/i, /^ORTHODONTICS/i, /^ORAL MEDICINE/i, /^ORAL PATHOLOGY/i,
            /^PUBLIC HEALTH DENTISTRY/i, /^COMMUNITY DENTISTRY/i,
            /^MEDICAL/i, /^DENTAL/i, /^CLINICAL/i, /^SPECIALIZATION/i
        ];
        return coursePatterns.some(pattern => pattern.test(value));
    }

    isQuota(value) {
        const quotaPatterns = [
            /^ALL INDIA$/i, /^ALL INDIA QUOTA$/i, /^CENTRAL QUOTA$/i, /^STATE QUOTA$/i,
            /^MANAGEMENT\/PAID SEATS QUOTA$/i, /^MANAGEMENT\/ PAID SEATS QUOTA$/i,
            /^MANAGEMENT QUOTA$/i, /^PAID SEATS QUOTA$/i, /^NRI QUOTA$/i,
            /^DELHI UNIVERSITY QUOTA$/i, /^IP UNIVERSITY QUOTA$/i, /^CENTRAL INSTITUTE QUOTA$/i,
            /^GOVERNMENT QUOTA$/i, /^PRIVATE QUOTA$/i, /^OPEN QUOTA$/i
        ];
        return quotaPatterns.some(pattern => pattern.test(value));
    }

    isCategory(value) {
        const categoryPatterns = [
            /^OPEN$/i, /^OBC$/i, /^SC$/i, /^ST$/i, /^EWS$/i, /^PH$/i, /^PWD$/i,
            /^OBC PWD$/i, /^SC PWD$/i, /^ST PWD$/i, /^EWS PWD$/i, /^OPEN PWD$/i,
            /^GENERAL$/i, /^UR$/i, /^RESERVED$/i, /^UNRESERVED$/i, /^CATEGORY 1$/i,
            /^CATEGORY 2$/i, /^CATEGORY 3$/i, /^CATEGORY 4$/i, /^CATEGORY 5$/i
        ];
        return categoryPatterns.some(pattern => pattern.test(value));
    }

    isRank(value) {
        const cleanValue = value.replace(/\s+/g, '');
        return /^\d+$/.test(cleanValue);
    }

    generateEnhancedPatterns() {
        console.log('\n🎯 ENHANCED PATTERN RECOMMENDATIONS:');
        
        console.log('\n📚 MISSING COURSE PATTERNS:');
        this.patterns.unknown.forEach(value => {
            if (this.isLikelyCourse(value)) {
                console.log(`  Course: "${value}"`);
            }
        });

        console.log('\n🏷️ MISSING QUOTA PATTERNS:');
        this.patterns.unknown.forEach(value => {
            if (this.isLikelyQuota(value)) {
                console.log(`  Quota: "${value}"`);
            }
        });

        console.log('\n🎯 MISSING CATEGORY PATTERNS:');
        this.patterns.unknown.forEach(value => {
            if (this.isLikelyCategory(value)) {
                console.log(`  Category: "${value}"`);
            }
        });

        console.log('\n❓ UNKNOWN PATTERNS (Need Investigation):');
        this.patterns.unknown.forEach(value => {
            if (!this.isLikelyCourse(value) && !this.isLikelyQuota(value) && !this.isLikelyCategory(value)) {
                console.log(`  Unknown: "${value}"`);
            }
        });
    }

    isLikelyCourse(value) {
        return value.includes('MEDICINE') || value.includes('SURGERY') || 
               value.includes('DENTAL') || value.includes('CLINICAL') ||
               value.includes('SPECIALIZATION') || value.includes('DIPLOMA') ||
               value.includes('HEALTH') || value.includes('THERAPY');
    }

    isLikelyQuota(value) {
        return value.includes('QUOTA') || value.includes('SEATS') || 
               value.includes('MANAGEMENT') || value.includes('PAID') ||
               value.includes('RESERVATION') || value.includes('ALLOCATION');
    }

    isLikelyCategory(value) {
        return value.includes('OPEN') || value.includes('OBC') || 
               value.includes('SC') || value.includes('ST') || 
               value.includes('EWS') || value.includes('PH') || 
               value.includes('PWD') || value.includes('GENERAL') ||
               value.includes('RESERVED') || value.includes('UNRESERVED');
    }

    runAnalysis() {
        console.log('🚀 Starting AIQ Data Pattern Analysis...');
        
        const cleanedCutoffsDir = './data/cleaned_cutoffs';
        if (!fs.existsSync(cleanedCutoffsDir)) {
            console.log('❌ Cleaned cutoffs directory not found');
            return;
        }

        const items = fs.readdirSync(cleanedCutoffsDir);
        const aiqFiles = items.filter(item => 
            item.startsWith('AIQ_') && (item.endsWith('.xlsx') || item.endsWith('.xls'))
        ).sort();

        console.log(`📁 Found ${aiqFiles.length} AIQ Excel files to analyze`);

        // Analyze first 5 files for patterns
        const filesToAnalyze = aiqFiles.slice(0, 5);
        filesToAnalyze.forEach(file => {
            const filePath = path.join(cleanedCutoffsDir, file);
            this.analyzeAIQFile(filePath);
        });

        // Generate enhanced patterns
        this.generateEnhancedPatterns();

        console.log('\n📊 PATTERN SUMMARY:');
        console.log(`  Courses found: ${this.patterns.courses.size}`);
        console.log(`  Quotas found: ${this.patterns.quotas.size}`);
        console.log(`  Categories found: ${this.patterns.categories.size}`);
        console.log(`  Unknown patterns: ${this.patterns.unknown.size}`);
    }
}

const analyzer = new AIQDataAnalyzer();
analyzer.runAnalysis();
