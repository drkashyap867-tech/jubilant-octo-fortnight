const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const SQLiteSetup = require('./sqlite-setup');

class CounsellingDataImporter extends SQLiteSetup {
    constructor() {
        super();
        this.counsellingTypes = {
            'AIQ_PG': { name: 'All India Quota Post Graduate', quota_type: 'all_india' },
            'AIQ_UG': { name: 'All India Quota Under Graduate', quota_type: 'all_india' },
            'KEA': { name: 'Karnataka State Counselling', quota_type: 'state' }
        };
        
        this.roundOrder = {
            'R1': 1, 'R2': 2, 'R3': 3, 'R4': 4, 'R5': 5,
            'MOPUP': 3, 'STRAY': 6, 'EXTENDED_STRAY': 7, 'EXTENDED_SPECIAL_STRAY': 8,
            'SPECIAL_STRAY': 9, 'STRAY_BDS': 10
        };
    }

    async importCounsellingData(dataDirectory) {
        try {
            console.log('🚀 Starting Counselling Data Import...');
            
            // Initialize database
            await this.initialize();
            
            // Setup counselling types
            await this.setupCounsellingTypes();
            
            // Process each counselling type directory
            const counsellingDirs = await this.getCounsellingDirectories(dataDirectory);
            
            for (const dir of counsellingDirs) {
                await this.processCounsellingDirectory(dir);
            }
            
            console.log('🎉 Counselling Data Import Completed!');
            
        } catch (error) {
            console.error('❌ Import failed:', error);
            throw error;
        } finally {
            this.close();
        }
    }

    async setupCounsellingTypes() {
        console.log('🏗️  Setting up counselling types...');
        
        for (const [code, info] of Object.entries(this.counsellingTypes)) {
            await this.runQuery(`
                INSERT OR IGNORE INTO counselling_types (type_code, name, description, quota_type)
                VALUES (?, ?, ?, ?)
            `, [code, info.name, info.description, info.quota_type]);
        }
        
        // Verify types were created
        const types = await this.runSelect('SELECT * FROM counselling_types');
        console.log('✅ Counselling types created:', types.map(t => t.type_code).join(', '));
    }

    async getCounsellingDirectories(dataDirectory) {
        const dirs = [];
        const items = fs.readdirSync(dataDirectory);
        
        for (const item of items) {
            const fullPath = path.join(dataDirectory, item);
            if (fs.statSync(fullPath).isDirectory()) {
                dirs.push({
                    path: fullPath,
                    name: item,
                    type: this.parseCounsellingType(item)
                });
            }
        }
        
        return dirs;
    }

    parseCounsellingType(dirName) {
        if (dirName.startsWith('AIQ_PG')) return 'AIQ_PG';
        if (dirName.startsWith('AIQ_UG')) return 'AIQ_UG';
        if (dirName.startsWith('KEA')) return 'KEA';
        return null;
    }

    async processCounsellingDirectory(dirInfo) {
        console.log(`📁 Processing ${dirInfo.name}...`);
        
        const files = fs.readdirSync(dirInfo.path).filter(file => 
            file.endsWith('.xlsx') || file.endsWith('.xls')
        );
        
        for (const file of files) {
            await this.processCounsellingFile(dirInfo, file);
        }
    }

    async processCounsellingFile(dirInfo, filename) {
        try {
            console.log(`📄 Processing ${filename}...`);
            
            const filePath = path.join(dirInfo.path, filename);
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet);
            
            // Parse filename to extract round information
            const roundInfo = this.parseRoundInfo(filename);
            
            if (!roundInfo) {
                console.log(`⏭️  Skipping ${filename} - could not parse round info`);
                return;
            }
            
            // Create or get counselling round
            const roundId = await this.createCounsellingRound(dirInfo, roundInfo);
            
            if (!roundId) {
                console.log(`⏭️  Skipping ${filename} - could not create counselling round`);
                return;
            }
            
            // Process the data
            await this.processCounsellingData(data, roundId, dirInfo.type);
            
            console.log(`✅ Processed ${filename} - ${data.length} records`);
            
        } catch (error) {
            console.error(`❌ Error processing ${filename}:`, error);
        }
    }

    parseRoundInfo(filename) {
        const parts = filename.split('_');
        let year, roundName;
        
        // Handle different naming patterns
        if (filename.includes('KEA')) {
            // KEA files: KEA_2023_MEDICAL_R1.xlsx
            year = parts[1]; // 2023
            // Extract everything after the last underscore but before .xlsx
            roundName = filename.split('_').slice(-1)[0].replace('.xlsx', '').replace('.xls', '');
        } else {
            // AIQ files: AIQ_PG_2023_SPECIAL_STRAY.xlsx
            // Find the year by looking for a 4-digit number
            const yearMatch = filename.match(/(\d{4})/);
            year = yearMatch ? yearMatch[1] : null;
            
            // For AIQ files, we need to handle multi-word round names
            if (filename.includes('SPECIAL_STRAY')) {
                roundName = 'SPECIAL_STRAY';
            } else if (filename.includes('STRAY_BDS')) {
                roundName = 'STRAY_BDS';
            } else if (filename.includes('EXTENDED_STRAY')) {
                roundName = 'EXTENDED_STRAY';
            } else if (filename.includes('EXTENDED_SPECIAL_STRAY')) {
                roundName = 'EXTENDED_SPECIAL_STRAY';
            } else {
                // Regular rounds like R1, R2, R3, STRAY
                roundName = parts[parts.length - 1].replace('.xlsx', '').replace('.xls', '');
            }
        }
        
        if (!year) {
            console.error(`❌ Could not extract year from filename: ${filename}`);
            return null;
        }
        
        return {
            year: parseInt(year),
            roundName: roundName,
            roundOrder: this.roundOrder[roundName] || 999,
            roundType: this.getRoundType(roundName)
        };
    }

    getRoundType(roundName) {
        if (roundName.startsWith('R')) return 'regular';
        if (roundName === 'MOPUP') return 'mopup';
        if (roundName === 'STRAY') return 'stray';
        if (roundName.includes('EXTENDED')) return 'extended';
        return 'special';
    }

    async createCounsellingRound(dirInfo, roundInfo) {
        try {
            const typeId = await this.getCounsellingTypeId(dirInfo.type);
            
            if (!typeId) {
                console.error(`❌ Counselling type not found: ${dirInfo.type}`);
                return null;
            }
            
            const result = await this.runQuery(`
                INSERT OR IGNORE INTO counselling_rounds 
                (counselling_type_id, year, round_name, round_order, round_type, status)
                VALUES (?, ?, ?, ?, ?, 'completed')
            `, [typeId, roundInfo.year, roundInfo.roundName, roundInfo.roundOrder, roundInfo.roundType]);
            
            // Get the round ID
            const rounds = await this.runSelect(`
                SELECT id FROM counselling_rounds 
                WHERE counselling_type_id = ? AND year = ? AND round_name = ?
            `, [typeId, roundInfo.year, roundInfo.roundName]);
            
            if (rounds.length === 0) {
                console.error(`❌ Failed to create counselling round: ${dirInfo.type} ${roundInfo.year} ${roundInfo.roundName}`);
                return null;
            }
            
            return rounds[0].id;
        } catch (error) {
            console.error(`❌ Error creating counselling round:`, error);
            return null;
        }
    }

    async getCounsellingTypeId(typeCode) {
        const types = await this.runSelect('SELECT id FROM counselling_types WHERE type_code = ?', [typeCode]);
        return types[0].id;
    }

    async processCounsellingData(data, roundId, counsellingType) {
        for (const record of data) {
            try {
                // Map columns based on counselling type
                const mappedData = this.mapCounsellingColumns(record, counsellingType);
                
                // Find college and course
                const collegeId = await this.findCollegeId(mappedData.collegeName);
                const courseId = await this.findCourseId(collegeId, mappedData.courseName);
                
                if (collegeId && courseId) {
                    // Insert counselling data
                    await this.runQuery(`
                        INSERT OR REPLACE INTO counselling_data 
                        (counselling_round_id, college_id, course_id, all_india_rank, 
                         quota, category, cutoff_rank, seats_available, fees_amount)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        roundId, collegeId, courseId, mappedData.rank,
                        mappedData.quota, mappedData.category, mappedData.cutoffRank,
                        mappedData.seats, mappedData.fees
                    ]);
                }
                
            } catch (error) {
                console.error('Error processing record:', error, record);
            }
        }
    }

    mapCounsellingColumns(record, counsellingType) {
        // Handle different column names and structures
        const mapping = {
            'AIQ_PG': {
                rank: record['ALL INDIA RANK'] || record['RANK'],
                quota: record['QUOTA'] || 'AIQ',
                collegeName: record['COLLEGE/INSTITUTE'] || record['COLLEGE'],
                courseName: record['COURSE'],
                category: record['CATEGORY'],
                cutoffRank: record['CUTOFF RANK'],
                seats: record['SEATS'] || 1,
                fees: record['FEES'] || 0
            },
            'AIQ_UG': {
                rank: record['ALL INDIA RANK'] || record['RANK'],
                quota: record['QUOTA'] || 'AIQ',
                collegeName: record['COLLEGE/INSTITUTE'] || record['COLLEGE'],
                courseName: record['COURSE'],
                category: record['CATEGORY'],
                cutoffRank: record['CUTOFF RANK'],
                seats: record['SEATS'] || 1,
                fees: record['FEES'] || 0
            },
            'KEA': {
                rank: record['ALL INDIA RANK'] || record['RANK'],
                quota: record['STATE'] || 'Karnataka',
                collegeName: record['COLLEGE/INSTITUTE'] || record['COLLEGE'],
                courseName: record['COURSE'],
                category: record['CATEGORY'],
                cutoffRank: record['CUTOFF RANK'],
                seats: record['SEATS'] || 1,
                fees: record['FEES'] || 0
            }
        };
        
        return mapping[counsellingType] || mapping['AIQ_PG'];
    }

    async findCollegeId(collegeName) {
        if (!collegeName) return null;
        
        const colleges = await this.runSelect(`
            SELECT id FROM colleges WHERE name LIKE ?
        `, [`%${collegeName}%`]);
        
        return colleges.length > 0 ? colleges[0].id : null;
    }

    async findCourseId(collegeId, courseName) {
        if (!collegeId || !courseName) return null;
        
        const courses = await this.runSelect(`
            SELECT id FROM courses WHERE college_id = ? AND course_name LIKE ?
        `, [collegeId, `%${courseName}%`]);
        
        return courses.length > 0 ? courses[0].id : null;
    }

    async generateImportReport() {
        console.log('\n📊 Counselling Import Report');
        console.log('============================');
        
        const [totalRounds, totalData, byType, byYear] = await Promise.all([
            this.runSelect('SELECT COUNT(*) as count FROM counselling_rounds'),
            this.runSelect('SELECT COUNT(*) as count FROM counselling_data'),
            this.runSelect(`
                SELECT ct.name, COUNT(cr.id) as rounds, COUNT(cd.id) as records
                FROM counselling_types ct
                LEFT JOIN counselling_rounds cr ON ct.id = cr.counselling_type_id
                LEFT JOIN counselling_data cd ON cr.id = cd.counselling_round_id
                GROUP BY ct.id
            `),
            this.runSelect(`
                SELECT year, COUNT(*) as rounds, COUNT(cd.id) as records
                FROM counselling_rounds cr
                LEFT JOIN counselling_data cd ON cr.id = cd.counselling_round_id
                GROUP BY year
                ORDER BY year DESC
            `)
        ]);
        
        console.log(`Total Counselling Rounds: ${totalRounds[0].count}`);
        console.log(`Total Counselling Records: ${totalData[0].count}`);
        
        console.log('\nBy Counselling Type:');
        byType.forEach(type => {
            console.log(`  ${type.name}: ${type.rounds} rounds, ${type.records} records`);
        });
        
        console.log('\nBy Year:');
        byYear.forEach(year => {
            console.log(`  ${year.year}: ${year.rounds} rounds, ${year.records} records`);
        });
    }
}

// Run import if called directly
if (require.main === module) {
    const importer = new CounsellingDataImporter();
    const dataDir = process.argv[2] || path.join(__dirname, '..', 'counselling_data');
    
    importer.importCounsellingData(dataDir)
        .then(() => {
            console.log('🚀 Counselling import completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Import failed:', error);
            process.exit(1);
        });
}

module.exports = CounsellingDataImporter;
