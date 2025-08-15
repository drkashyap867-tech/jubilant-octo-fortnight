const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

class CutoffAPI {
    constructor() {
        this.cutoffDir = path.join(__dirname, '../counselling_data/cutoffs');
        this.cleanedDir = path.join(__dirname, 'data/cleaned_cutoffs');
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    // Get available years
    getAvailableYears() {
        try {
            const years = fs.readdirSync(this.cutoffDir)
                .filter(item => fs.statSync(path.join(this.cutoffDir, item)).isDirectory())
                .filter(item => !item.startsWith('.'))
                .map(dir => {
                    const match = dir.match(/(\d{4})$/);
                    return match ? parseInt(match[1]) : null;
                })
                .filter(year => year !== null)
                .sort((a, b) => b - a); // Latest year first

            return { success: true, data: years };
        } catch (error) {
            console.error('Get available years error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get available categories
    getAvailableCategories() {
        try {
            const categories = fs.readdirSync(this.cutoffDir)
                .filter(item => fs.statSync(path.join(this.cutoffDir, item)).isDirectory())
                .filter(item => !item.startsWith('.'))
                .map(dir => {
                    const match = dir.match(/^([A-Z_]+)_(\d{4})$/);
                    if (match) {
                        return {
                            value: match[1],
                            label: this.formatCategoryLabel(match[1]),
                            year: parseInt(match[2])
                        };
                    }
                    return null;
                })
                .filter(cat => cat !== null)
                .sort((a, b) => a.label.localeCompare(b.label));

            return { success: true, data: categories };
        } catch (error) {
            console.error('Get available categories error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get available rounds for a category and year
    getAvailableRounds(category, year) {
        try {
            const categoryDir = `${category}_${year}`;
            const categoryPath = path.join(this.cutoffDir, categoryDir);
            
            if (!fs.existsSync(categoryPath)) {
                return { success: false, error: 'Category not found' };
            }

            const files = fs.readdirSync(categoryPath)
                .filter(file => file.endsWith('.xlsx') || file.endsWith('.xls'))
                .filter(file => !file.startsWith('.'))
                .map(file => {
                    const match = file.match(/(R\d+|SPECIAL_STRAY|STRAY|MOPUP)/);
                    if (match) {
                        return {
                            value: match[1],
                            label: this.formatRoundLabel(match[1]),
                            filename: file
                        };
                    }
                    return null;
                })
                .filter(round => round !== null)
                .sort((a, b) => this.sortRounds(a.value, b.value));

            return { success: true, data: files };
        } catch (error) {
            console.error('Get available rounds error:', error);
            return { success: false, error: error.message };
        }
    }

    // Search cutoff data
    async searchCutoffData(filters) {
        try {
            const { year, category, round, college, course, quota, minRank, maxRank, limit = 100 } = filters;
            
            // Validate required parameters
            if (!year || !category || !round) {
                return { success: false, error: 'Year, category, and round are required' };
            }

            // Get data from Excel file
            let data;
            if (category === 'KEA') {
                // For KEA, try to get both MEDICAL and DENTAL data
                const medicalData = await this.getCutoffDataFromFile('KEA', year, round);
                const dentalData = await this.getCutoffDataFromFile('KEA', year, round);
                
                // Combine data from both sources
                let combinedData = [];
                if (medicalData.success && medicalData.data) {
                    combinedData = combinedData.concat(medicalData.data);
                }
                if (dentalData.success && dentalData.data) {
                    combinedData = combinedData.concat(dentalData.data);
                }
                
                data = { success: true, data: combinedData };
            } else {
                data = await this.getCutoffDataFromFile(category, year, round);
            }
            
            if (!data.success) {
                return data;
            }

            // Apply filters
            let filteredData = data.data;

            if (college) {
                filteredData = filteredData.filter(item => 
                    item.college_name && item.college_name.toLowerCase().includes(college.toLowerCase())
                );
            }

            if (course) {
                filteredData = filteredData.filter(item => 
                    item.course_name && item.course_name.toLowerCase().includes(course.toLowerCase())
                );
            }

            if (quota) {
                filteredData = filteredData.filter(item => 
                    item.quota && item.quota.toLowerCase().includes(quota.toLowerCase())
                );
            }

            if (minRank) {
                filteredData = filteredData.filter(item => 
                    item.closing_rank && item.closing_rank >= parseInt(minRank)
                );
            }

            if (maxRank) {
                filteredData = filteredData.filter(item => 
                    item.opening_rank && item.opening_rank <= parseInt(maxRank)
                );
            }

            // Apply limit
            filteredData = filteredData.slice(0, parseInt(limit));

            return {
                success: true,
                data: filteredData,
                total: filteredData.length,
                filters: filters
            };

        } catch (error) {
            console.error('Search cutoff data error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get cutoff data from Excel file
    async getCutoffDataFromFile(category, year, round) {
        try {
            const cacheKey = `${category}_${year}_${round}`;
            const now = Date.now();

            // Check cache
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (now - cached.timestamp < this.cacheTimeout) {
                    return cached.data;
                }
            }

            const categoryDir = `${category}_${year}`;
            const categoryPath = path.join(this.cutoffDir, categoryDir);
            
            if (!fs.existsSync(categoryPath)) {
                return { success: false, error: 'Category not found' };
            }

            // First try to find cleaned file
            let cleanedFileName = `${category}_${year}_${round}_CLEANED.xlsx`;
            let cleanedFilePath = path.join(this.cleanedDir, cleanedFileName);
            
            // For KEA files, check both MEDICAL and DENTAL variants
            if (!fs.existsSync(cleanedFilePath) && category === 'KEA') {
                const keaVariants = [
                    `KEA_${year}_MEDICAL_${round}_CLEANED.xlsx`,
                    `KEA_${year}_DENTAL_${round}_CLEANED.xlsx`
                ];
                
                for (const variant of keaVariants) {
                    const variantPath = path.join(this.cleanedDir, variant);
                    if (fs.existsSync(variantPath)) {
                        cleanedFileName = variant;
                        cleanedFilePath = variantPath;
                        break;
                    }
                }
            }
            
            let filePath;
            let isCleaned = false;
            
            if (fs.existsSync(cleanedFilePath)) {
                filePath = cleanedFilePath;
                isCleaned = true;
                console.log(`✅ Using cleaned file: ${cleanedFileName}`);
            } else {
                // Fallback to original file
                const roundFile = fs.readdirSync(categoryPath)
                    .find(file => file.includes(round) && (file.endsWith('.xlsx') || file.endsWith('.xls')));

                if (!roundFile) {
                    return { success: false, error: 'Round file not found' };
                }

                filePath = path.join(categoryPath, roundFile);
                console.log(`⚠️  Using original file: ${roundFile} (no cleaned version found)`);
            }
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Convert to JSON with headers
            const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            if (rawData.length < 2) {
                return { success: false, error: 'No data found in file' };
            }

            // Process the data based on category
            const processedData = this.processCutoffData(rawData, category, year, round);

            // Cache the result
            this.cache.set(cacheKey, {
                timestamp: now,
                data: { success: true, data: processedData }
            });

            return { success: true, data: processedData };

        } catch (error) {
            console.error('Get cutoff data from file error:', error);
            return { success: false, error: error.message };
        }
    }

    // Process raw Excel data into structured format
    processCutoffData(rawData, category, year, round) {
        try {
            const headers = rawData[0];
            const dataRows = rawData.slice(1);
            
            // Check if this is the unusual AIQ format
            if (this.isAIQFormat(headers, dataRows)) {
                return this.processAIQFormat(rawData, category, year, round);
            }
            
            // Check if this is the KEA format
            console.log(`🔍 Checking KEA format for ${category}_${year}_${round}...`);
            if (this.isKEAFormat(headers, dataRows)) {
                console.log(`✅ Detected KEA format, processing...`);
                return this.processKEAFormat(rawData, category, year, round);
            } else {
                console.log(`❌ Not KEA format, checking AIQ...`);
            }
            
            // Standard table format processing
            const columnMap = this.mapColumns(headers, category);
            
            return dataRows.map((row, index) => {
                const item = {
                    id: index + 1,
                    year: year,
                    category: category,
                    round: round,
                    college_name: this.extractValue(row, columnMap.college, headers),
                    course_name: this.extractValue(row, columnMap.course, headers),
                    category: this.extractValue(row, columnMap.category, headers),
                    quota: this.extractValue(row, columnMap.quota, headers),
                    all_india_rank: this.extractNumericValue(row, columnMap.allIndiaRank, headers),
                    state: this.extractValue(row, columnMap.state, headers),
                    total_seats: this.extractNumericValue(row, columnMap.totalSeats, headers),
                    fees_structure: this.extractValue(row, columnMap.fees, headers)
                };

                // Clean up undefined values
                Object.keys(item).forEach(key => {
                    if (item[key] === undefined) {
                        item[key] = null;
                    }
                });

                return item;
            }).filter(item => item.college_name && item.course_name); // Filter out empty rows

        } catch (error) {
            console.error('Process cutoff data error:', error);
            return [];
        }
    }

    // Check if this is the unusual AIQ format
    isAIQFormat(headers, dataRows) {
        if (!headers || !dataRows || dataRows.length < 3) return false;
        
        const headerText = String(headers[0] || '').toLowerCase();
        const firstRow = String(dataRows[0]?.[0] || '').toLowerCase();
        const secondRow = String(dataRows[1]?.[0] || '').toLowerCase();
        
        // AIQ format has: college name in header, MBBS in row 1, OPEN in row 2
        return headerText.includes('college') && 
               (firstRow.includes('mbbs') || firstRow.includes('bds')) &&
               (secondRow.includes('open') || secondRow.includes('general') || secondRow.includes('ur'));
    }

    // Check if this is the KEA format
    isKEAFormat(headers, dataRows) {
        if (!headers || !dataRows || dataRows.length < 3) {
            console.log(`   ❌ Insufficient data: headers=${!!headers}, dataRows=${dataRows?.length}`);
            return false;
        }
        
        const headerText = String(headers[0] || '').toLowerCase();
        const firstRow = String(dataRows[0]?.[0] || '').toLowerCase();
        const secondRow = String(dataRows[1]?.[0] || '').toLowerCase();
        const thirdRow = String(dataRows[2]?.[0] || '');
        
        console.log(`   🔍 KEA Detection Details:`);
        console.log(`      Header: "${headers[0]}" (includes 'college': ${headerText.includes('college')})`);
        console.log(`      Row 1: "${dataRows[0]?.[0]}" (course: ${firstRow.includes('mbbs') || firstRow.includes('bds') || firstRow.includes('md') || firstRow.includes('ms') || firstRow.includes('diploma')})`);
        console.log(`      Row 2: "${dataRows[1]?.[0]}" (not open/general/ur: ${!secondRow.includes('open') && !secondRow.includes('general') && !secondRow.includes('ur')})`);
        console.log(`      Row 3: "${dataRows[2]?.[0]}" (is rank: ${!isNaN(thirdRow) && thirdRow.length > 3})`);
        
        // KEA format has: college name in header, course in row 1, sub-category in row 2, rank in row 3
        // Pattern: Course → Sub-category → Rank (repeats)
        const isKEA = (headerText.includes('college') || headerText.includes('institute')) && 
               (firstRow.includes('mbbs') || firstRow.includes('bds') || firstRow.includes('md') || 
                firstRow.includes('ms') || firstRow.includes('diploma')) &&
               !secondRow.includes('open') && !secondRow.includes('general') && !secondRow.includes('ur') &&
               !isNaN(thirdRow) && thirdRow.length > 3; // Third row should be a rank number
        
        console.log(`   🎯 KEA Format Result: ${isKEA}`);
        return isKEA;
    }

    // Process AIQ format data
    processAIQFormat(rawData, category, year, round) {
        try {
            const collegeName = rawData[0][0]; // College name is in header
            const courseName = rawData[1][0]; // Course is in row 1
            const categoryType = rawData[2][0]; // Category is in row 2
            const quotaInfo = rawData[3][0]; // Quota info is in row 3
            
            // Extract ranks from subsequent rows
            const ranks = [];
            for (let i = 4; i < rawData.length; i++) {
                const rankValue = rawData[i][0];
                if (rankValue && !isNaN(rankValue)) {
                    ranks.push(parseInt(rankValue));
                }
            }
            
            // Create structured data
            const items = [];
            if (ranks.length > 0) {
                // Create one record per rank
                ranks.forEach((rank, index) => {
                    items.push({
                        id: index + 1,
                        year: year,
                        category: category,
                        round: round,
                        college_name: collegeName,
                        course_name: courseName,
                        category: categoryType,
                        quota: quotaInfo,
                        all_india_rank: rank,
                        state: this.extractStateFromCollegeName(collegeName),
                        total_seats: null,
                        fees_structure: null
                    });
                });
            } else {
                // Create single record if no ranks
                items.push({
                    id: 1,
                    year: year,
                    category: category,
                    round: round,
                    college_name: collegeName,
                    course_name: courseName,
                    category: categoryType,
                    quota: quotaInfo,
                    all_india_rank: null,
                    state: this.extractStateFromCollegeName(collegeName),
                    total_seats: null,
                    fees_structure: null
                });
            }
            
            console.log(`✅ Processed AIQ format: ${items.length} records for ${collegeName}`);
            return items;
            
        } catch (error) {
            console.error('Process AIQ format error:', error);
            return [];
        }
    }

    // Process KEA format data
    processKEAFormat(rawData, category, year, round) {
        try {
            const collegeName = rawData[0][0]; // College name is in header
            const items = [];
            let itemId = 1;
            
            // KEA has a 3-row pattern: Course → Sub-category → Rank
            // Process in groups of 3 rows
            for (let i = 1; i < rawData.length - 2; i += 3) {
                const courseRow = rawData[i];
                const subCategoryRow = rawData[i + 1];
                const rankRow = rawData[i + 2];
                
                if (!courseRow?.[0] || !subCategoryRow?.[0] || !rankRow?.[0]) {
                    continue; // Skip incomplete groups
                }
                
                const courseName = String(courseRow[0]).trim();
                const subCategory = String(subCategoryRow[0]).trim();
                const rankValue = String(rankRow[0]).trim();
                
                // Skip if not a valid rank
                if (isNaN(rankValue) || rankValue.length < 3) {
                    continue;
                }
                
                // Skip if course name looks like a number (data alignment issue)
                if (!isNaN(courseName) && courseName.length < 6) {
                    continue;
                }
                
                // Determine quota based on sub-category
                let quota = 'STATE'; // Default for KEA
                if (subCategory.includes('NRI')) {
                    quota = 'NRI';
                } else if (subCategory.includes('MNG') || subCategory.includes('MANAGEMENT')) {
                    quota = 'MANAGEMENT';
                }
                
                // Create record
                items.push({
                    id: itemId++,
                    year: year,
                    category: category,
                    round: round,
                    college_name: collegeName,
                    course_name: courseName,
                    category: subCategory, // Use sub-category as category
                    quota: quota,
                    all_india_rank: parseInt(rankValue),
                    state: this.extractStateFromCollegeName(collegeName),
                    total_seats: null,
                    fees_structure: null
                });
            }
            
            console.log(`✅ Processed KEA format: ${items.length} records for ${collegeName}`);
            return items;
            
        } catch (error) {
            console.error('Process KEA format error:', error);
            return [];
        }
    }

    // Extract state from college name
    extractStateFromCollegeName(collegeName) {
        if (!collegeName) return null;
        
        const statePatterns = [
            'TAMIL NADU', 'KARNATAKA', 'MAHARASHTRA', 'UTTAR PRADESH', 'WEST BENGAL',
            'ANDHRA PRADESH', 'TELANGANA', 'KERALA', 'RAJASTHAN', 'GUJARAT',
            'MADHYA PRADESH', 'BIHAR', 'ASSAM', 'ODISHA', 'JHARKHAND',
            'CHHATTISGARH', 'HARYANA', 'PUNJAB', 'HIMACHAL PRADESH', 'UTTARAKHAND',
            'DELHI (NCT)', 'PUDUCHERRY', 'GOA', 'TRIPURA', 'NAGALAND',
            'MANIPUR', 'MIZORAM', 'ARUNACHAL PRADESH', 'SIKKIM', 'MEGHALAYA'
        ];
        
        for (const state of statePatterns) {
            if (collegeName.includes(state)) {
                return state;
            }
        }
        
        return null;
    }

    // Map Excel columns to data fields based on the actual format
    mapColumns(headers, category) {
        const map = {};
        
        headers.forEach((header, index) => {
            const headerStr = String(header).toLowerCase();
            
            // COLLEGE/INSTITUTE mapping
            if (headerStr.includes('college') || headerStr.includes('institute') || headerStr.includes('hospital')) {
                map.college = index;
            }
            
            // COURSE mapping
            if (headerStr.includes('course') || headerStr.includes('mbbs') || headerStr.includes('md') || headerStr.includes('ms') || headerStr.includes('bds') || headerStr.includes('mds')) {
                map.course = index;
            }
            
            // CATEGORY mapping
            if (headerStr.includes('category') || headerStr.includes('gen') || headerStr.includes('obc') || headerStr.includes('sc') || headerStr.includes('st') || headerStr.includes('ews')) {
                map.category = index;
            }
            
            // QUOTA mapping
            if (headerStr.includes('quota') || headerStr.includes('aiq') || headerStr.includes('state') || headerStr.includes('all india')) {
                map.quota = index;
            }
            
            // ALL INDIA RANK mapping
            if (headerStr.includes('all india rank') || headerStr.includes('rank') || headerStr.includes('air')) {
                map.allIndiaRank = index;
            }
            
            // Additional mappings for other possible columns
            if (headerStr.includes('state')) {
                map.state = index;
            }
            
            if (headerStr.includes('seat') || headerStr.includes('total')) {
                map.totalSeats = index;
            }
            
            if (headerStr.includes('fee') || headerStr.includes('cost')) {
                map.fees = index;
            }
        });

        return map;
    }

    // Extract value from row
    extractValue(row, index, headers) {
        if (index === undefined || !row[index]) return null;
        return String(row[index]).trim();
    }

    // Extract numeric value from row
    extractNumericValue(row, index, headers) {
        if (index === undefined || !row[index]) return null;
        const value = String(row[index]).replace(/[^\d]/g, '');
        return value ? parseInt(value) : null;
    }

    // Format category label
    formatCategoryLabel(category) {
        const labels = {
            'AIQ_UG': 'AIQ Undergraduate',
            'AIQ_PG': 'AIQ Postgraduate',
            'KEA': 'Karnataka (KEA)',
            'KEA_UG': 'Karnataka Undergraduate',
            'KEA_PG': 'Karnataka Postgraduate'
        };
        return labels[category] || category.replace(/_/g, ' ');
    }

    // Format round label
    formatRoundLabel(round) {
        const labels = {
            'R1': 'Round 1',
            'R2': 'Round 2',
            'R3': 'Round 3',
            'R4': 'Round 4',
            'R5': 'Round 5',
            'SPECIAL_STRAY': 'Special Stray',
            'STRAY': 'Stray',
            'MOPUP': 'Mop-up'
        };
        return labels[round] || round;
    }

    // Sort rounds in logical order
    sortRounds(a, b) {
        const order = ['R1', 'R2', 'R3', 'R4', 'R5', 'SPECIAL_STRAY', 'STRAY', 'MOPUP'];
        return order.indexOf(a) - order.indexOf(b);
    }

    // Get cutoff trends
    async getCutoffTrends(filters) {
        try {
            const { college, course, quota, years = 3 } = filters;
            
            if (!college || !course) {
                return { success: false, error: 'College and course are required' };
            }

            const trends = [];
            const currentYear = new Date().getFullYear();

            for (let i = 0; i < years; i++) {
                const year = currentYear - i;
                
                // Try to get data for this year
                const yearData = await this.getYearTrendData(year, college, course, quota);
                if (yearData) {
                    trends.push(yearData);
                }
            }

            return {
                success: true,
                data: trends.sort((a, b) => a.year - b.year),
                filters: filters
            };

        } catch (error) {
            console.error('Get cutoff trends error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get year trend data
    async getYearTrendData(year, college, course, quota) {
        try {
            // Get available categories for this year
            const categories = fs.readdirSync(this.cutoffDir)
                .filter(item => item.includes(`_${year}`))
                .filter(item => !item.startsWith('.'));

            for (const category of categories) {
                const rounds = await this.getAvailableRounds(category.split('_')[0], year);
                if (!rounds.success) continue;

                // Try to find data in R1 (most representative)
                const r1Round = rounds.data.find(r => r.value === 'R1');
                if (r1Round) {
                    const data = await this.getCutoffDataFromFile(category.split('_')[0], year, 'R1');
                    if (data.success) {
                        const match = data.data.find(item => 
                            item.college_name && item.college_name.toLowerCase().includes(college.toLowerCase()) &&
                            item.course_name && item.course_name.toLowerCase().includes(course.toLowerCase())
                        );
                        
                        if (match) {
                            return {
                                year: year,
                                category: category.split('_')[0],
                                opening_rank: match.opening_rank,
                                closing_rank: match.closing_rank,
                                total_seats: match.total_seats
                            };
                        }
                    }
                }
            }

            return null;

        } catch (error) {
            console.error('Get year trend data error:', error);
            return null;
        }
    }


}

module.exports = { CutoffAPI };
