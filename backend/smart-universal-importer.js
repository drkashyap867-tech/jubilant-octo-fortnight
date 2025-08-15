const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database connection
const dbPath = path.join(__dirname, 'data', 'cutoff_ranks_enhanced.db');
const db = new sqlite3.Database(dbPath);

console.log('🚀 SMART UNIVERSAL IMPORTER - AIQ & KEA DETECTION & ROUTING');
console.log('=' .repeat(80));

// Enhanced pattern recognition for AIQ vs KEA detection
function detectFileType(filename, sheetData) {
    console.log(`🔍 Detecting file type for: ${filename}`);
    
    // Check filename patterns first
    if (filename.toLowerCase().includes('aiq')) {
        console.log('✅ Detected as AIQ file (filename pattern)');
        return 'AIQ';
    }
    
    if (filename.toLowerCase().includes('kea')) {
        console.log('✅ Detected as KEA file (filename pattern)');
        return 'KEA';
    }
    
    // Check sheet structure patterns
    const firstFewRows = sheetData.slice(0, 10);
    const allText = firstFewRows.flat().join(' ').toLowerCase();
    
    // AIQ indicators
    if (allText.includes('all india quota') || 
        allText.includes('aiq') ||
        allText.includes('management/paid seats quota') ||
        allText.includes('central quota')) {
        console.log('✅ Detected as AIQ file (content pattern)');
        return 'AIQ';
    }
    
    // KEA indicators
    if (allText.includes('karnataka') || 
        allText.includes('kea') ||
        allText.includes('state quota') ||
        allText.includes('karnataka state')) {
        console.log('✅ Detected as KEA file (content pattern)');
        return 'KEA';
    }
    
    // Default to AIQ if uncertain (most files are AIQ)
    console.log('⚠️  Uncertain file type, defaulting to AIQ');
    return 'AIQ';
}

// AIQ Import Logic (Vertical data flow)
function importAIQData(filename, sheetData, counsellingType, counsellingYear, roundNumber) {
    console.log(`🎯 Processing AIQ file: ${filename}`);
    
    // Extract college columns from header row
    const headerRow = sheetData[0];
    const collegeColumns = [];
    
    for (let colIndex = 0; colIndex < headerRow.length; colIndex++) {
        const header = headerRow[colIndex];
        if (header && typeof header === 'string' && header.trim()) {
            // Extract college name from header (remove location info)
            const collegeName = header.split(',')[0].trim();
            if (collegeName && collegeName.length > 10) { // Valid college name
                collegeColumns.push({
                    colIndex,
                    collegeName,
                    header: header.trim()
                });
            }
        }
    }
    
    console.log(`📋 Found ${collegeColumns.length} college columns`);
    
    let totalRecords = 0;
    
    // Process each college column
    for (const collegeCol of collegeColumns) {
        console.log(`🏫 Processing college: ${collegeCol.collegeName}`);
        
        let currentCourse = null;
        let currentCategory = null;
        let currentQuota = null;
        let currentSeats = null;
        
        // Process rows vertically in this column
        for (let rowIndex = 1; rowIndex < sheetData.length; rowIndex++) {
            const cellValue = sheetData[rowIndex][collegeCol.colIndex];
            if (!cellValue) continue;
            
            const cellStr = String(cellValue).trim();
            
            // Detect course
            if (isAIQCourse(cellStr)) {
                currentCourse = cellStr;
                currentCategory = null;
                currentQuota = null;
                currentSeats = null;
                console.log(`  📚 Course: ${currentCourse}`);
                continue;
            }
            
            // Detect category
            if (isAIQCategory(cellStr)) {
                currentCategory = cellStr;
                currentQuota = null;
                currentSeats = null;
                console.log(`  🏷️  Category: ${currentCategory}`);
                continue;
            }
            
            // Detect quota
            if (isAIQQuota(cellStr)) {
                currentQuota = cellStr;
                currentSeats = null;
                console.log(`  🎯 Quota: ${currentQuota}`);
                continue;
            }
            
            // Detect seats (optional)
            if (isAIQSeats(cellStr)) {
                currentSeats = cellStr;
                continue;
            }
            
            // Detect rank
            if (isAIQRank(cellStr) && currentCourse && currentCategory && currentQuota) {
                const rank = cleanRank(cellStr);
                if (rank) {
                    // Insert into database
                    insertCutoffRecord(
                        collegeCol.collegeName,
                        currentCourse,
                        counsellingType,
                        counsellingYear,
                        roundNumber,
                        currentQuota,
                        currentCategory,
                        null, // state_category
                        null, // state_quota
                        rank,
                        currentSeats || 1,
                        null // fees
                    );
                    totalRecords++;
                }
            }
        }
    }
    
    console.log(`✅ AIQ import completed: ${totalRecords} records`);
    return totalRecords;
}

// KEA Import Logic (Row-based with quota as STATE)
function importKEAData(filename, sheetData, counsellingType, counsellingYear, roundNumber) {
    console.log(`🎯 Processing KEA file: ${filename}`);
    
    let totalRecords = 0;
    
    // KEA files are row-based: COLLEGE | COURSE | CATEGORY | RANK
    for (let rowIndex = 1; rowIndex < sheetData.length; rowIndex++) {
        const row = sheetData[rowIndex];
        if (!row || row.length < 4) continue;
        
        const college = String(row[0] || '').trim();
        const course = String(row[1] || '').trim();
        const category = String(row[2] || '').trim();
        const rank = String(row[3] || '').trim();
        
        if (!college || !course || !category || !rank) continue;
        
        // Clean and validate data
        const cleanRank = cleanRank(rank);
        if (!cleanRank) continue;
        
        // For KEA, quota is always "STATE" (as per your suggestion)
        const quota = "STATE";
        
        // Insert into database
        insertCutoffRecord(
            college,
            course,
            counsellingType,
            counsellingYear,
            roundNumber,
            quota, // Always "STATE" for KEA
            category,
            null, // state_category
            null, // state_quota
            cleanRank,
            1, // Default seats
            null // fees
        );
        
        totalRecords++;
    }
    
    console.log(`✅ KEA import completed: ${totalRecords} records`);
    return totalRecords;
}

// Enhanced pattern recognition functions
function isAIQCourse(text) {
    const coursePatterns = [
        /^M\.?B\.?B\.?S\.?/i,
        /^M\.?D\.?/i,
        /^M\.?S\.?/i,
        /^B\.?D\.?S\.?/i,
        /^B\.?H\.?M\.?S\.?/i,
        /^B\.?A\.?M\.?S\.?/i,
        /^B\.?P\.?T\.?/i,
        /^B\.?O\.?T\.?/i,
        /^B\.?P\.?H\.?A\.?R\.?M\.?A\.?/i,
        /^DIPLOMA/i,
        /^POST GRADUATE/i,
        /^UNDERGRADUATE/i
    ];
    
    return coursePatterns.some(pattern => pattern.test(text));
}

function isAIQCategory(text) {
    const categoryPatterns = [
        /^UR$/i,
        /^OBC$/i,
        /^SC$/i,
        /^ST$/i,
        /^EWS$/i,
        /^OPEN$/i,
        /^GENERAL$/i,
        /^RESERVED$/i,
        /^PWD$/i,
        /^PH$/i
    ];
    
    return categoryPatterns.some(pattern => pattern.test(text));
}

function isAIQQuota(text) {
    const quotaPatterns = [
        /GENERAL/i,
        /RESERVED/i,
        /MANAGEMENT/i,
        /PAID SEATS/i,
        /NRI/i,
        /FOREIGN/i,
        /CENTRAL/i,
        /ALL INDIA/i,
        /AIQ/i
    ];
    
    return quotaPatterns.some(pattern => pattern.test(text));
}

function isAIQSeats(text) {
    return /^\d+$/.test(text) && parseInt(text) > 0 && parseInt(text) < 1000;
}

function isAIQRank(text) {
    const rank = cleanRank(text);
    return rank && parseInt(rank) > 0 && parseInt(rank) < 1000000;
}

function cleanRank(text) {
    if (!text) return null;
    
    // Remove spaces and non-numeric characters
    let cleaned = String(text).replace(/\s+/g, '').replace(/[^\d]/g, '');
    
    // Handle common rank formatting issues
    if (cleaned.length === 0) return null;
    
    const rankNum = parseInt(cleaned);
    if (isNaN(rankNum) || rankNum <= 0) return null;
    
    return rankNum.toString();
}

// Database insertion function
function insertCutoffRecord(college, course, counsellingType, counsellingYear, roundName, aiqQuota, aiqCategory, stateCategory, stateQuota, cutoffRank, seatsAvailable, feesAmount) {
    return new Promise((resolve, reject) => {
        // First, ensure college exists
        db.get("SELECT id FROM colleges WHERE name = ?", [college], (err, collegeRow) => {
            if (err) {
                console.error(`❌ Error checking college: ${err.message}`);
                reject(err);
                return;
            }
            
            let collegeId;
            if (collegeRow) {
                collegeId = collegeRow.id;
            } else {
                // Insert new college
                db.run("INSERT INTO colleges (name, state, city, stream) VALUES (?, ?, ?, ?)", 
                    [college, 'Unknown', 'Unknown', 'medical'], function(err) {
                    if (err) {
                        if (err.code === 'SQLITE_CONSTRAINT') {
                            // College already exists, try to get its ID
                            db.get("SELECT id FROM colleges WHERE name = ?", [college], (err2, row) => {
                                if (err2) {
                                    console.error(`❌ Error getting college ID: ${err2.message}`);
                                    reject(err2);
                                    return;
                                }
                                collegeId = row.id;
                                insertCourse();
                            });
                        } else {
                            console.error(`❌ Error inserting college: ${err.message}`);
                            reject(err);
                        }
                        return;
                    }
                    collegeId = this.lastID;
                    insertCourse();
                });
                return;
            }
            
            insertCourse();
            
            function insertCourse() {
                // Ensure course exists
                db.get("SELECT id FROM courses WHERE name = ?", [course], (err, courseRow) => {
                    if (err) {
                        console.error(`❌ Error checking course: ${err.message}`);
                        reject(err);
                        return;
                    }
                    
                    let courseId;
                    if (courseRow) {
                        courseId = courseRow.id;
                    } else {
                        // Insert new course
                        db.run("INSERT INTO courses (name, stream, branch) VALUES (?, ?, ?)", 
                            [course, 'medical', 'Unknown'], function(err) {
                            if (err) {
                                if (err.code === 'SQLITE_CONSTRAINT') {
                                    // Course already exists, try to get its ID
                                    db.get("SELECT id FROM courses WHERE name = ?", [course], (err2, row) => {
                                        if (err2) {
                                            console.error(`❌ Error getting course ID: ${err2.message}`);
                                            reject(err2);
                                            return;
                                        }
                                        courseId = row.id;
                                        insertCutoff();
                                    });
                                } else {
                                    console.error(`❌ Error inserting course: ${err.message}`);
                                    reject(err);
                                }
                                return;
                            }
                            courseId = this.lastID;
                            insertCutoff();
                        });
                        return;
                    }
                    
                    insertCutoff();
                    
                    function insertCutoff() {
                        // Insert cutoff record
                        const sql = `
                            INSERT INTO cutoff_ranks_enhanced 
                            (college_id, course_id, counselling_type, counselling_year, round_name, 
                             aiq_quota, aiq_category, state_category, state_quota, cutoff_rank, 
                             seats_available, fees_amount)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `;
                        
                        db.run(sql, [
                            collegeId, courseId, counsellingType, counsellingYear, roundName,
                            aiqQuota, aiqCategory, stateCategory, stateQuota, cutoffRank,
                            seatsAvailable, feesAmount
                        ], function(err) {
                            if (err) {
                                console.error(`❌ Error inserting cutoff: ${err.message}`);
                                reject(err);
                                return;
                            }
                            resolve();
                        });
                    }
                });
            }
        });
    });
}

// Main import function
async function importAllData() {
    console.log('🚀 Starting SMART UNIVERSAL IMPORT...');
    
    const dataDir = path.join(__dirname, 'data', 'cleaned_cutoffs');
    if (!fs.existsSync(dataDir)) {
        console.error(`❌ Data directory not found: ${dataDir}`);
        return;
    }
    
    const files = fs.readdirSync(dataDir).filter(file => 
        file.endsWith('.xlsx') || file.endsWith('.xls')
    );
    
    console.log(`📁 Found ${files.length} Excel files to process`);
    
    let totalAIQRecords = 0;
    let totalKEARecords = 0;
    let totalFiles = 0;
    
    for (const file of files) {
        try {
            console.log(`\n📄 Processing file: ${file}`);
            
            const filePath = path.join(dataDir, file);
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            if (sheetData.length < 2) {
                console.log(`⚠️  Skipping ${file}: insufficient data`);
                continue;
            }
            
            // Detect file type
            const fileType = detectFileType(file, sheetData);
            
            // Parse filename for metadata
            const metadata = parseFilename(file);
            
            if (fileType === 'AIQ') {
                const records = await importAIQData(
                    file, 
                    sheetData, 
                    metadata.counsellingType, 
                    metadata.counsellingYear, 
                    metadata.roundNumber
                );
                totalAIQRecords += records;
            } else if (fileType === 'KEA') {
                const records = await importKEAData(
                    file, 
                    sheetData, 
                    metadata.counsellingType, 
                    metadata.counsellingYear, 
                    metadata.roundNumber
                );
                totalKEARecords += records;
            }
            
            totalFiles++;
            
        } catch (error) {
            console.error(`❌ Error processing ${file}: ${error.message}`);
        }
    }
    
    console.log('\n🎉 SMART UNIVERSAL IMPORT COMPLETED!');
    console.log('=' .repeat(80));
    console.log(`📊 Total files processed: ${totalFiles}`);
    console.log(`🏫 AIQ records imported: ${totalAIQRecords}`);
    console.log(`🎯 KEA records imported: ${totalKEARecords}`);
    console.log(`📈 Total records: ${totalAIQRecords + totalKEARecords}`);
    
    db.close();
}

// Enhanced filename parser
function parseFilename(filename) {
    const name = filename.toLowerCase();
    
    // Default values
    let counsellingType = 'AIQ_UG';
    let counsellingYear = '2023';
    let roundNumber = '1';
    
    // Detect counselling type
    if (name.includes('pg') || name.includes('postgraduate')) {
        counsellingType = 'AIQ_PG';
    } else if (name.includes('ug') || name.includes('undergraduate')) {
        counsellingType = 'AIQ_UG';
    } else if (name.includes('kea')) {
        counsellingType = 'KEA';
    }
    
    // Detect year
    const yearMatch = name.match(/(20\d{2})/);
    if (yearMatch) {
        counsellingYear = yearMatch[1];
    }
    
    // Detect round
    const roundMatch = name.match(/r(\d+)/i);
    if (roundMatch) {
        roundNumber = roundMatch[1];
    }
    
    return { counsellingType, counsellingYear, roundNumber };
}

// Run the import
if (require.main === module) {
    importAllData().catch(console.error);
}

module.exports = { importAllData, detectFileType };
