const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class SmartSearchEngine {
    constructor() {
        this.medicalDbPath = path.join(__dirname, 'data', 'medical_seats.db');
        this.dentalDbPath = path.join(__dirname, 'data', 'dental_seats.db');
        this.dnbDbPath = path.join(__dirname, 'data', 'dnb_seats.db');
        this.collegesDbPath = path.join(__dirname, 'data', 'colleges.db');
        
        this.medicalDb = null;
        this.dentalDb = null;
        this.dnbDb = null;
        this.collegesDb = null;
        
        // Simple in-memory cache for performance
        this.cache = {
            streams: null,
            courses: {},
            states: null,
            lastCacheUpdate: 0
        };
        
        this.searchConfig = {
            enableSemantic: true,
            enableFuzzy: true,
            enableAbbreviations: true,
            enableSynonyms: true
        };
        
        // Common abbreviations and synonyms
        this.abbreviations = {
            'AJ': ['A.J.', 'A J', 'AJ.', 'AJ INSTITUTE', 'AJ COLLEGE', 'AJ MEDICAL', 'AJ DENTAL'],
            'A.J.': ['AJ', 'A J', 'AJ.', 'AJ INSTITUTE', 'AJ COLLEGE', 'AJ MEDICAL', 'AJ DENTAL'],
            'A J': ['AJ', 'A.J.', 'AJ.', 'AJ INSTITUTE', 'AJ COLLEGE', 'AJ MEDICAL', 'AJ DENTAL'],
            'AJ.': ['AJ', 'A.J.', 'A J', 'AJ INSTITUTE', 'AJ COLLEGE', 'AJ MEDICAL', 'AJ DENTAL'],
            'DR': ['DR.', 'DOCTOR', 'DRS', 'DR MEDICAL', 'DR COLLEGE'],
            'DR.': ['DR', 'DOCTOR', 'DRS', 'DR MEDICAL', 'DR COLLEGE'],
            'DRS': ['DRS.', 'DR.', 'DOCTORS', 'DRS MEDICAL', 'DRS COLLEGE'],
            'GOVT': ['GOVT.', 'GOVERNMENT', 'GOVERNMENTAL', 'GOVT MEDICAL', 'GOVT COLLEGE'],
            'GOVT.': ['GOVT', 'GOVERNMENT', 'GOVERNMENTAL', 'GOVT MEDICAL', 'GOVT COLLEGE'],
            'INST': ['INST.', 'INSTITUTE', 'INSTITUTION', 'INST MEDICAL', 'INST DENTAL'],
            'INST.': ['INST', 'INSTITUTE', 'INSTITUTION', 'INST MEDICAL', 'INST DENTAL'],
            'COLL': ['COLL.', 'COLLEGE', 'COLL MEDICAL', 'COLL DENTAL'],
            'COLL.': ['COLL', 'COLLEGE', 'COLL MEDICAL', 'COLL DENTAL'],
            'HOSP': ['HOSP.', 'HOSPITAL', 'HOSP MEDICAL', 'HOSP COLLEGE'],
            'HOSP.': ['HOSP', 'HOSPITAL', 'HOSP MEDICAL', 'HOSP COLLEGE'],
            'UNIV': ['UNIV.', 'UNIVERSITY', 'UNIV MEDICAL', 'UNIV COLLEGE'],
            'UNIV.': ['UNIV', 'UNIVERSITY', 'UNIV MEDICAL', 'UNIV COLLEGE'],
            'RES': ['RES.', 'RESEARCH', 'RES MEDICAL', 'RES COLLEGE'],
            'RES.': ['RES', 'RESEARCH', 'RES MEDICAL', 'RES COLLEGE'],
            'SCI': ['SCI.', 'SCIENCES', 'SCIENCE', 'SCI MEDICAL', 'SCI COLLEGE'],
            'SCI.': ['SCI', 'SCIENCES', 'SCIENCE', 'SCI MEDICAL', 'SCI COLLEGE'],
            'TECH': ['TECH.', 'TECHNOLOGY', 'TECHNICAL', 'TECH MEDICAL', 'TECH COLLEGE'],
            'TECH.': ['TECH', 'TECHNOLOGY', 'TECHNICAL', 'TECH MEDICAL', 'TECH COLLEGE'],
            'MED': ['MED.', 'MEDICAL', 'MEDICINE', 'MED COLLEGE', 'MED INSTITUTE'],
            'MED.': ['MED', 'MEDICAL', 'MEDICINE', 'MED COLLEGE', 'MED INSTITUTE'],
            'DENT': ['DENT.', 'DENTAL', 'DENT COLLEGE', 'DENT INSTITUTE'],
            'DENT.': ['DENT', 'DENTAL', 'DENT COLLEGE', 'DENT INSTITUTE'],
            'MBBS': ['M.B.B.S', 'MBBS.', 'MEDICAL', 'MBBS COURSE'],
            'BDS': ['B.D.S', 'BDS.', 'DENTAL', 'BDS COURSE'],
            'MD': ['M.D', 'MD.', 'POST GRADUATE', 'MD COURSE'],
            'MS': ['M.S', 'MS.', 'POST GRADUATE', 'MS COURSE'],
            'DNB': ['D.N.B', 'DNB.', 'DIPLOMATE', 'DNB COURSE'],
            'MDS': ['M.D.S', 'MDS.', 'POST GRADUATE DENTAL', 'MDS COURSE'],
            'HUBBALLI': ['HUBLI', 'HUBLI CITY', 'HUBLI-DHARWAD', 'HUBLI DHARWAD'],
            'HUBLI': ['HUBBALLI', 'HUBLI CITY', 'HUBLI-DHARWAD', 'HUBLI DHARWAD']
        };
        
        // State synonyms and variations
        this.stateSynonyms = {
            'KARNATAKA': ['KAR', 'KA', 'BANGALORE', 'BENGALURU', 'MANGALORE'],
            'ANDHRA PRADESH': ['AP', 'ANDHRA', 'VISAKHAPATNAM', 'VIJAYAWADA'],
            'TAMIL NADU': ['TN', 'TAMILNADU', 'CHENNAI', 'MADRAS'],
            'MAHARASHTRA': ['MH', 'MAH', 'MUMBAI', 'BOMBAY', 'PUNE'],
            'KERALA': ['KL', 'KER', 'THIRUVANANTHAPURAM', 'TRIVANDRUM'],
            'DELHI': ['DL', 'DEL', 'NEW DELHI', 'DELHI (NCT)'],
            'WEST BENGAL': ['WB', 'BENGAL', 'KOLKATA', 'CALCUTTA'],
            'UTTAR PRADESH': ['UP', 'UTTAR', 'LUCKNOW', 'KANPUR'],
            'TELANGANA': ['TS', 'TEL', 'HYDERABAD', 'SECUNDERABAD'],
            'GUJARAT': ['GJ', 'GUJ', 'AHMEDABAD', 'SURAT'],
            'RAJASTHAN': ['RJ', 'RAJ', 'JAIPUR', 'JODHPUR'],
            'MADHYA PRADESH': ['MP', 'MADHYA', 'BHOPAL', 'INDORE'],
            'HARYANA': ['HR', 'HAR', 'CHANDIGARH', 'GURGAON'],
            'PUNJAB': ['PB', 'PUN', 'CHANDIGARH', 'AMRITSAR'],
            'BIHAR': ['BR', 'BIH', 'PATNA', 'GAYA'],
            'ORISSA': ['OR', 'ORI', 'ODISHA', 'BHUBANESWAR'],
            'JHARKHAND': ['JH', 'JHA', 'RANCHI', 'JAMSHEDPUR'],
            'CHHATTISGARH': ['CG', 'CHH', 'RAIPUR', 'BILASPUR'],
            'ASSAM': ['AS', 'ASS', 'GUWAHATI', 'DIBRUGARH'],
            'MANIPUR': ['MN', 'MAN', 'IMPHAL', 'THOUBAL'],
            'MEGHALAYA': ['ML', 'MEG', 'SHILLONG', 'TURA'],
            'NAGALAND': ['NL', 'NAG', 'KOHIMA', 'DIMAPUR'],
            'TRIPURA': ['TR', 'TRI', 'AGARTALA', 'UDAIPUR'],
            'ARUNACHAL PRADESH': ['AR', 'ARU', 'ITANAGAR', 'NAHARLAGUN'],
            'MIZORAM': ['MZ', 'MIZ', 'AIZAWL', 'LUNGLEI'],
            'SIKKIM': ['SK', 'SIK', 'GANGTOK', 'NAMCHI'],
            'GOA': ['GA', 'GOA', 'PANAJI', 'MARGAO'],
            'UTTARAKHAND': ['UK', 'UTT', 'DEHRADUN', 'HARIDWAR'],
            'HIMACHAL PRADESH': ['HP', 'HIM', 'SHIMLA', 'MANALI'],
            'JAMMU AND KASHMIR': ['JK', 'J&K', 'SRINAGAR', 'JAMMU'],
            'LADAKH': ['LA', 'LAD', 'LEH', 'KARGIL'],
            'CHANDIGARH': ['CH', 'CHA', 'CHANDIGARH'],
            'DADRA AND NAGAR HAVELI': ['DN', 'DNH', 'SILVASSA'],
            'DAMAN AND DIU': ['DD', 'DAM', 'DAMAN', 'DIU'],
            'LAKSHADWEEP': ['LD', 'LAK', 'KAVARATTI'],
            'ANDAMAN AND NICOBAR': ['AN', 'A&N', 'PORT BLAIR'],
            'PUDUCHERRY': ['PY', 'PUD', 'PONDICHERRY', 'PONDY']
        };
    }

    async initialize() {
        if (this.medicalDb && this.dentalDb && this.dnbDb && this.collegesDb) {
            return; // Already initialized
        }

        try {
            // Initialize connections to all databases with performance optimizations
            this.medicalDb = new sqlite3.Database(this.medicalDbPath);
            this.dentalDb = new sqlite3.Database(this.dentalDbPath);
            this.dnbDb = new sqlite3.Database(this.dnbDbPath);
            this.collegesDb = new sqlite3.Database(this.collegesDbPath);
            
            // Apply performance optimizations to all databases
            const dbs = [this.medicalDb, this.dentalDb, this.dnbDb, this.collegesDb];
            for (const db of dbs) {
                db.run('PRAGMA journal_mode = WAL');
                db.run('PRAGMA synchronous = NORMAL');
                db.run('PRAGMA cache_size = 10000');
                db.run('PRAGMA temp_store = MEMORY');
                db.run('PRAGMA mmap_size = 268435456'); // 256MB memory mapping
            }
            
            console.log('✅ Smart Search Engine initialized successfully!');
        } catch (error) {
            console.error('❌ Failed to initialize Smart Search Engine:', error);
            throw error;
        }
    }

    async close() {
        if (this.medicalDb) {
            this.medicalDb.close();
            this.medicalDb = null;
        }
        if (this.dentalDb) {
            this.dentalDb.close();
            this.dentalDb = null;
        }
        if (this.dnbDb) {
            this.dnbDb.close();
            this.dnbDb = null;
        }
        if (this.collegesDb) {
            this.collegesDb.close();
            this.collegesDb = null;
        }
        console.log('🔒 Search Engine connections closed');
    }

    async runSelect(db, sql, params = []) {
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async runQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve({ lastID: this.lastID, changes: this.changes });
            });
        });
    }

    // 🧠 SMART SEARCH ENGINE - Main Method
    async smartSearch(query, filters = {}) {
        try {
            await this.initialize();
            
            if (!query.trim()) {
                return { data: [], total: 0, error: 'Query parameter is required' };
            }

            console.log(`🔍 Smart Search: "${query}" with filters:`, filters);
            
            // Extract course type from query (MBBS, MD, MS, BDS, DNB, etc.)
            const courseType = this.extractCourseType(query);
            console.log('🎯 Extracted course type:', courseType);
            
            // Step 1: Generate search variations
            const searchVariations = this.generateVariations(query);
            console.log('📝 Search variations:', searchVariations);
            
            // Step 2: Execute multi-strategy search
            const searchResults = await this.executeMultiStrategySearch(searchVariations, filters);
            
            // Step 3: Apply course filtering if course type was detected
            let filteredResults = searchResults;
            if (courseType) {
                console.log(`🎯 Filtering results by course type: ${courseType}`);
                filteredResults = this.filterByCourseType(searchResults, courseType);
                console.log(`🎯 After filtering: ${filteredResults.length} results`);
            }
            
            // Step 4: Apply intelligent ranking and scoring
            const rankedResults = this.applyIntelligentRanking(filteredResults, query);
            
            // Step 5: Remove duplicates and format results
            const finalResults = this.formatAndDeduplicate(rankedResults);
            
            console.log(`✅ Smart Search completed: ${finalResults.length} results found`);
            
            return {
                data: finalResults,
                total: finalResults.length,
                query: query,
                courseType: courseType,
                filters: filters,
                searchVariations: searchVariations,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('❌ Smart Search error:', error);
            return { data: [], total: 0, error: error.message };
        }
    }
    
    // 🎯 Extract course type from search query
    extractCourseType(query) {
        const queryLower = query.toLowerCase();
        
        // Medical courses - handle various formats
        if (queryLower.includes('mbbs') || queryLower.includes('m.b.b.s') || queryLower.includes('bachelor')) {
            return 'MBBS';
        }
        if (queryLower.includes('md ') || queryLower.includes('m.d') || queryLower.includes('doctor of medicine')) {
            return 'MD';
        }
        if (queryLower.includes('ms ') || queryLower.includes('m.s') || queryLower.includes('master of surgery')) {
            return 'MS';
        }
        if (queryLower.includes('dm ') || queryLower.includes('d.m') || queryLower.includes('doctorate of medicine')) {
            return 'DM';
        }
        if (queryLower.includes('m.ch') || queryLower.includes('mch')) {
            return 'MCh';
        }
        
        // Dental courses
        if (queryLower.includes('bds') || queryLower.includes('b.d.s') || queryLower.includes('bachelor of dental')) {
            return 'BDS';
        }
        if (queryLower.includes('mds') || queryLower.includes('m.d.s') || queryLower.includes('master of dental')) {
            return 'MDS';
        }
        
        // DNB courses
        if (queryLower.includes('dnb') || queryLower.includes('d.n.b') || queryLower.includes('national board')) {
            return 'DNB';
        }
        
        // If no specific course type found, return null for broad search
        return null;
    }
    
    // 🎯 Filter results by course type
    filterByCourseType(results, courseType) {
        if (!courseType) {
            return results; // No course type specified, return all results
        }
        
        console.log(`🎯 Filtering by course type: ${courseType}`);
        
        return results.filter(result => {
            const courseName = (result.course_name || result.course || '').toLowerCase();
            
            switch (courseType) {
                case 'MBBS':
                    return courseName.includes('mbbs') || courseName.includes('m.b.b.s') || courseName.includes('bachelor');
                case 'MD':
                    return (courseName.includes('md ') || courseName.includes('m.d')) && !courseName.includes('mbbs') && !courseName.includes('m.b.b.s');
                case 'MS':
                    return (courseName.includes('ms ') || courseName.includes('m.s')) && !courseName.includes('mbbs') && !courseName.includes('m.b.b.s');
                case 'DM':
                    return (courseName.includes('dm ') || courseName.includes('d.m')) && !courseName.includes('mbbs') && !courseName.includes('m.b.b.s');
                case 'MCh':
                    return courseName.includes('m.ch') || courseName.includes('mch');
                case 'BDS':
                    return courseName.includes('bds') || courseName.includes('b.d.s') || courseName.includes('bachelor of dental');
                case 'MDS':
                    return courseName.includes('mds') || courseName.includes('m.d.s') || courseName.includes('master of dental');
                case 'DNB':
                    return courseName.includes('dnb') || courseName.includes('d.n.b') || courseName.includes('national board');
                default:
                    return true;
            }
        });
    }

    // 🔄 Generate intelligent search variations
    generateVariations(query) {
        const variations = new Set();
        const normalized = query.toUpperCase().trim();
        
        // Add original query
        variations.add(normalized);
        
        // Handle abbreviations and common patterns
        if (normalized.length <= 5) {
            // Likely an abbreviation - add common variations
            if (normalized === 'AJ') {
                variations.add('A.J.');
                variations.add('A J');
                variations.add('AJ.');
                variations.add('AJ INSTITUTE');
                variations.add('AJ COLLEGE');
                variations.add('AJ MEDICAL');
                variations.add('AJ DENTAL');
            } else if (normalized === 'A.J.') {
                variations.add('AJ');
                variations.add('A J');
                variations.add('AJ.');
                variations.add('AJ INSTITUTE');
                variations.add('AJ COLLEGE');
                variations.add('AJ MEDICAL');
                variations.add('AJ DENTAL');
            } else if (normalized === 'A J') {
                variations.add('AJ');
                variations.add('A.J.');
                variations.add('AJ.');
                variations.add('AJ INSTITUTE');
                variations.add('AJ COLLEGE');
                variations.add('AJ MEDICAL');
                variations.add('AJ DENTAL');
            }
        }
        
        // Abbreviation expansions
        if (this.abbreviations[normalized]) {
            this.abbreviations[normalized].forEach(exp => variations.add(exp));
        }
        
        // Check if query is part of any abbreviation (reverse lookup)
        Object.keys(this.abbreviations).forEach(abbr => {
            if (this.abbreviations[abbr].includes(normalized)) {
                variations.add(abbr);
                // Also add other variations of this abbreviation
                this.abbreviations[abbr].forEach(exp => variations.add(exp));
            }
        });
        
        // State variations
        Object.keys(this.stateSynonyms).forEach(state => {
            if (this.stateSynonyms[state].includes(normalized)) {
                variations.add(state);
            }
        });
        
        // Partial matches for longer queries
        if (normalized.length > 2) {
            variations.add(normalized.substring(0, normalized.length - 1));
            variations.add(normalized.substring(1));
        }
        
        // Word variations
        const words = normalized.split(/\s+/);
        words.forEach(word => {
            if (word.length > 2) {
                variations.add(word);
                // Add common suffixes
                ['S', 'ES', 'ING', 'ED'].forEach(suffix => {
                    variations.add(word + suffix);
                });
            }
        });
        
        // Special abbreviation patterns
        if (normalized.includes('AJ')) {
            variations.add('AJ.');
            variations.add('A.J');
            variations.add('A J');
            variations.add('AJ INSTITUTE');
            variations.add('AJ COLLEGE');
        }
        
        // Handle dots and spaces in abbreviations
        if (normalized.includes('.')) {
            variations.add(normalized.replace(/\./g, ''));
            variations.add(normalized.replace(/\./g, ' '));
        }
        
        if (normalized.includes(' ')) {
            variations.add(normalized.replace(/\s+/g, ''));
            variations.add(normalized.replace(/\s+/g, '.'));
        }
        
        return Array.from(variations);
    }

    // 🔍 Check if query is a location search
    isLocationQuery(query) {
        const locationKeywords = ['city', 'state', 'district', 'village', 'town', 'area', 'region'];
        const normalizedQuery = query.toLowerCase();
        return locationKeywords.some(keyword => normalizedQuery.includes(keyword));
    }

    // 🔄 Execute multi-strategy search
    async executeMultiStrategySearch(searchVariations, filters) {
        const allResults = [];
        
        for (const variation of searchVariations) {
            try {
                // Try exact search first
                const exactResults = await this.searchExact(variation, filters);
                allResults.push(...exactResults);
                
                // If no exact results, try fuzzy search
                if (exactResults.length === 0) {
                    const fuzzyResults = await this.searchFuzzy(variation, filters);
                    allResults.push(...fuzzyResults);
                }
                
                // If still no results, try semantic search
                if (allResults.length === 0) {
                    const semanticResults = await this.searchSemantic(variation, filters);
                    allResults.push(...semanticResults);
                }
                
                // Finally, try abbreviation search
                if (allResults.length === 0) {
                    const abbreviationResults = await this.searchAbbreviations(variation, filters);
                    allResults.push(...abbreviationResults);
                }
                
            } catch (error) {
                console.error(`Error in search strategy for variation "${variation}":`, error);
            }
        }
        
        return allResults;
    }

    // 🔍 Exact search strategy
    async searchExact(query, filters) {
        const { stream, course, state } = filters;
        
        let results = [];
        
        // Search in medical database
        if (!stream || stream === 'medical') {
            const medicalResults = await this.runSelect(this.medicalDb, `
                SELECT 
                    id, college_name as name, state, 'medical' as college_type, 
                    city as address, establishment_year, management_type as management, 
                    course_name, total_seats as seats, quota_type, fee_structure
                FROM medical_courses 
                WHERE (
                    college_name LIKE ? OR 
                    course_name LIKE ? OR 
                    state LIKE ? OR
                    city LIKE ?
                )
                ${course ? 'AND course_name LIKE ?' : ''}
                ${state ? 'AND state = ?' : ''}
                LIMIT 50
            `, [
                `%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`,
                ...(course ? [`%${course}%`] : []),
                ...(state ? [state] : [])
            ]);
            results.push(...medicalResults.map(r => ({ ...r, strategy: 'exact', variation: query })));
        }
        
        // Search in dental database
        if (!stream || stream === 'dental') {
            const dentalResults = await this.runSelect(this.dentalDb, `
                SELECT 
                    id, college_name as name, state, 'dental' as college_type, 
                    city as address, establishment_year, management_type as management, 
                    course_name, total_seats as seats, quota_type, fee_structure
                FROM dental_courses 
                WHERE (
                    college_name LIKE ? OR 
                    course_name LIKE ? OR 
                    state LIKE ? OR
                    city LIKE ?
                )
                ${course ? 'AND course_name LIKE ?' : ''}
                ${state ? 'AND state = ?' : ''}
                LIMIT 50
            `, [
                `%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`,
                ...(course ? [`%${course}%`] : []),
                ...(state ? [state] : [])
            ]);
            results.push(...dentalResults.map(r => ({ ...r, strategy: 'exact', variation: query })));
        }
        
        // Search in DNB database
        if (!stream || stream === 'dnb') {
            const dnbResults = await this.runSelect(this.dnbDb, `
                SELECT 
                    id, college_name as name, state, 'dnb' as college_type, 
                    city as address, hospital_type as management, 
                    course_name, total_seats as seats, quota_type, fee_structure
                FROM dnb_courses 
                WHERE (
                    college_name LIKE ? OR 
                    course_name LIKE ? OR 
                    state LIKE ? OR
                    city LIKE ?
                )
                ${course ? 'AND course_name LIKE ?' : ''}
                ${state ? 'AND state = ?' : ''}
                LIMIT 50
            `, [
                `%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`,
                ...(course ? [`%${course}%`] : []),
                ...(state ? [state] : [])
            ]);
            results.push(...dnbResults.map(r => ({ ...r, strategy: 'exact', variation: query })));
        }
        
        return results;
    }

    // 🔍 Fuzzy search strategy
    async searchFuzzy(query, filters) {
        const { stream, course, state } = filters;
        
        // Use SQLite's built-in fuzzy matching with LIKE patterns
        const patterns = this.generateFuzzyPatterns(query);
        let results = [];
        
        // Search in medical database
        if (!stream || stream === 'medical') {
            for (const pattern of patterns) {
                const medicalResults = await this.runSelect(this.medicalDb, `
                    SELECT 
                        id, college_name as name, state, 'medical' as college_type, 
                        city as address, establishment_year, management_type as management, 
                        course_name, total_seats as seats, quota_type, fee_structure
                    FROM medical_courses 
                    WHERE (
                        college_name LIKE ? OR 
                        course_name LIKE ? OR 
                        state LIKE ? OR
                        city LIKE ?
                    )
                    ${course ? 'AND course_name LIKE ?' : ''}
                    ${state ? 'AND state = ?' : ''}
                    LIMIT 20
                `, [
                    pattern, pattern, pattern, pattern,
                    ...(course ? [`%${course}%`] : []),
                    ...(state ? [state] : [])
                ]);
                results.push(...medicalResults.map(r => ({ ...r, strategy: 'fuzzy', variation: query })));
            }
        }
        
        // Search in dental database
        if (!stream || stream === 'dental') {
            for (const pattern of patterns) {
                const dentalResults = await this.runSelect(this.dentalDb, `
                    SELECT 
                        id, college_name as name, state, 'dental' as college_type, 
                        city as address, establishment_year, management_type as management, 
                        course_name, total_seats as seats, quota_type, fee_structure
                    FROM dental_courses 
                    WHERE (
                        college_name LIKE ? OR 
                        course_name LIKE ? OR 
                        state LIKE ? OR
                        city LIKE ?
                    )
                    ${course ? 'AND course_name LIKE ?' : ''}
                    ${state ? 'AND state = ?' : ''}
                    LIMIT 20
                `, [
                    pattern, pattern, pattern, pattern,
                    ...(course ? [`%${course}%`] : []),
                    ...(state ? [state] : [])
                ]);
                results.push(...dentalResults.map(r => ({ ...r, strategy: 'fuzzy', variation: query })));
            }
        }
        
        // Search in DNB database
        if (!stream || stream === 'dnb') {
            for (const pattern of patterns) {
                const dnbResults = await this.runSelect(this.dnbDb, `
                    SELECT 
                        id, college_name as name, state, 'dnb' as college_type, 
                        city as address, hospital_type as management, 
                        course_name, total_seats as seats, quota_type, fee_structure
                    FROM dnb_courses 
                    WHERE (
                        college_name LIKE ? OR 
                        course_name LIKE ? OR 
                        state LIKE ? OR
                        city LIKE ?
                    )
                    ${course ? 'AND course_name LIKE ?' : ''}
                    ${state ? 'AND state = ?' : ''}
                    LIMIT 20
                `, [
                    pattern, pattern, pattern, pattern,
                    ...(course ? [`%${course}%`] : []),
                    ...(state ? [state] : [])
                ]);
                results.push(...dnbResults.map(r => ({ ...r, strategy: 'fuzzy', variation: query })));
            }
        }
        
        return results;
    }

    // 🧠 Semantic search strategy
    async searchSemantic(query, filters) {
        const { stream, course, state } = filters;
        
        // Find colleges with similar characteristics
        let results = [];
        
        // Search in medical database
        if (!stream || stream === 'medical') {
            const medicalResults = await this.runSelect(this.medicalDb, `
                SELECT 
                    id, college_name as name, state, 'medical' as college_type, 
                    city as address, establishment_year, management_type as management, 
                    course_name, total_seats as seats, quota_type, fee_structure
                FROM medical_courses 
                WHERE (
                    course_type = ? OR
                    state = ? OR
                    management_type = ? OR
                    course_name LIKE ? OR
                    city LIKE ?
                )
                ${course ? 'AND course_name LIKE ?' : ''}
                ${state ? 'AND state = ?' : ''}
                LIMIT 20
            `, [
                query, query, query, `%${query}%`, `%${query}%`,
                ...(course ? [`%${course}%`] : []),
                ...(state ? [state] : [])
            ]);
            results.push(...medicalResults.map(r => ({ ...r, strategy: 'semantic', variation: query })));
        }
        
        // Search in dental database
        if (!stream || stream === 'dental') {
            const dentalResults = await this.runSelect(this.dentalDb, `
                SELECT 
                    id, college_name as name, state, 'dental' as college_type, 
                    city as address, establishment_year, management_type as management, 
                    course_name, total_seats as seats, quota_type, fee_structure
                FROM dental_courses 
                WHERE (
                    course_type = ? OR
                    state = ? OR
                    management_type = ? OR
                    course_name LIKE ? OR
                    city LIKE ?
                )
                ${course ? 'AND course_name LIKE ?' : ''}
                ${state ? 'AND state = ?' : ''}
                LIMIT 20
            `, [
                query, query, query, `%${query}%`, `%${query}%`,
                ...(course ? [`%${course}%`] : []),
                ...(state ? [state] : [])
            ]);
            results.push(...dentalResults.map(r => ({ ...r, strategy: 'semantic', variation: query })));
        }
        
        // Search in DNB database
        if (!stream || stream === 'dnb') {
            const dnbResults = await this.runSelect(this.dnbDb, `
                SELECT 
                    id, college_name as name, state, 'dnb' as college_type, 
                    city as address, hospital_type as management, 
                    course_name, total_seats as seats, quota_type, fee_structure
                FROM dnb_courses 
                WHERE (
                    course_type = ? OR
                    state = ? OR
                    hospital_type = ? OR
                    course_name LIKE ? OR
                    city LIKE ?
                )
                ${course ? 'AND course_name LIKE ?' : ''}
                ${state ? 'AND state = ?' : ''}
                LIMIT 20
            `, [
                query, query, query, `%${query}%`, `%${query}%`,
                ...(course ? [`%${query}%`] : []),
                ...(state ? [state] : [])
            ]);
            results.push(...dnbResults.map(r => ({ ...r, strategy: 'semantic', variation: query })));
        }
        
        return results;
    }

    // 🔍 Abbreviation search strategy
    async searchAbbreviations(query, filters) {
        const { stream, course, state } = filters;
        
        // Search for colleges that might match abbreviation patterns
        let results = [];
        
        // Search in medical database
        if (!stream || stream === 'medical') {
            const medicalResults = await this.runSelect(this.medicalDb, `
                SELECT 
                    id, college_name as name, state, 'medical' as college_type, 
                    city as address, establishment_year, management_type as management, 
                    course_name, total_seats as seats, quota_type, fee_structure
                FROM medical_courses 
                WHERE (
                    college_name LIKE ? OR
                    college_name LIKE ? OR
                    college_name LIKE ? OR
                    city LIKE ?
                )
                ${course ? 'AND course_name LIKE ?' : ''}
                ${state ? 'AND state = ?' : ''}
                LIMIT 20
            `, [
                `%${query}%`,
                `%${query}%`,
                `%${query}%`,
                `%${query}%`,
                ...(course ? [`%${query}%`] : []),
                ...(state ? [state] : [])
            ]);
            results.push(...medicalResults.map(r => ({ ...r, strategy: 'abbreviation', variation: query })));
        }
        
        // Search in dental database
        if (!stream || stream === 'dental') {
            const dentalResults = await this.runSelect(this.dentalDb, `
                SELECT 
                    id, college_name as name, state, 'dental' as college_type, 
                    city as address, establishment_year, management_type as management, 
                    course_name, total_seats as seats, quota_type, fee_structure
                FROM dental_courses 
                WHERE (
                    college_name LIKE ? OR
                    college_name LIKE ? OR
                    college_name LIKE ? OR
                    city LIKE ?
                )
                ${course ? 'AND course_name LIKE ?' : ''}
                ${state ? 'AND state = ?' : ''}
                LIMIT 20
            `, [
                `%${query}%`,
                `%${query}%`,
                `%${query}%`,
                `%${query}%`,
                ...(course ? [`%${query}%`] : []),
                ...(state ? [state] : [])
            ]);
            results.push(...dentalResults.map(r => ({ ...r, strategy: 'abbreviation', variation: query })));
        }
        
        // Search in DNB database
        if (!stream || stream === 'dnb') {
            const dnbResults = await this.runSelect(this.dnbDb, `
                SELECT 
                    id, college_name as name, state, 'dnb' as college_type, 
                    city as address, hospital_type as management, 
                    course_name, total_seats as seats, quota_type, fee_structure
                FROM dnb_courses 
                WHERE (
                    college_name LIKE ? OR
                    college_name LIKE ? OR
                    college_name LIKE ? OR
                    city LIKE ?
                )
                ${course ? 'AND course_name LIKE ?' : ''}
                ${state ? 'AND state = ?' : ''}
                LIMIT 20
            `, [
                `%${query}%`,
                `%${query}%`,
                `%${query}%`,
                `%${query}%`,
                ...(course ? [`%${query}%`] : []),
                ...(state ? [state] : [])
            ]);
            results.push(...dnbResults.map(r => ({ ...r, strategy: 'abbreviation', variation: query })));
        }
        
        return results;
    }

    // 🎯 Generate fuzzy patterns for matching
    generateFuzzyPatterns(query) {
        const patterns = [];
        const normalized = query.toUpperCase();
        
        // Exact pattern
        patterns.push(`%${normalized}%`);
        
        // Pattern with wildcards for common variations
        if (normalized.includes('.')) {
            patterns.push(`%${normalized.replace(/\./g, '%')}%`);
        }
        
        // Pattern with spaces
        if (normalized.includes(' ')) {
            patterns.push(`%${normalized.replace(/\s+/g, '%')}%`);
        }
        
        // Pattern with common separators
        patterns.push(`%${normalized.replace(/[.,\s]/g, '%')}%`);
        
        return patterns;
    }

    // 🏆 Apply intelligent ranking and scoring
    applyIntelligentRanking(results, originalQuery) {
        return results.map(result => {
            const score = this.calculateSmartScore(result, originalQuery);
            return { ...result, smartScore: score };
        }).sort((a, b) => b.smartScore - a.smartScore);
    }

    // 🧮 Calculate smart score for ranking
    calculateSmartScore(result, query) {
        let score = 0;
        const normalizedName = (result.name || '').toUpperCase();
        const normalizedQuery = query.toUpperCase();
        
        // Base score from search strategy
        const strategyScores = {
            'exact': 1000,
            'fuzzy': 800,
            'semantic': 600,
            'abbreviation': 700
        };
        
        score += strategyScores[result.strategy] || 500;
        
        // 🎯 PRIORITY 1: Exact match bonus (highest priority)
        if (normalizedName === normalizedQuery) {
            score += 1000;
        }
        
        // 🎯 PRIORITY 2: Starts with query (very high priority)
        else if (normalizedName.startsWith(normalizedQuery)) {
            score += 800;
        }
        
        // 🎯 PRIORITY 3: Query starts with college name (high priority)
        else if (normalizedQuery.startsWith(normalizedName)) {
            score += 700;
        }
        
        // 🎯 PRIORITY 4: Contains query (medium priority)
        else if (normalizedName.includes(normalizedQuery)) {
            score += 500;
        }
        
        // 🎯 PRIORITY 5: Partial word match (lower priority)
        else {
            const words = normalizedQuery.split(/\s+/);
            let wordMatches = 0;
            words.forEach(word => {
                if (normalizedName.includes(word)) wordMatches++;
            });
            score += wordMatches * 200;
        }
        
        // 🎯 PRIORITY 6: State match bonus
        if (result.state && result.state.toUpperCase().includes(normalizedQuery)) {
            score += 300;
        }
        
        // 🎯 PRIORITY 7: Course match bonus
        if (result.course_name && result.course_name.toUpperCase().includes(normalizedQuery)) {
            score += 250;
        }
        
        // 🎯 PRIORITY 8: Management type bonus
        if (result.management && result.management.toUpperCase().includes(normalizedQuery)) {
            score += 200;
        }
        
        // 🎯 PRIORITY 9: Location bonus (city/address)
        if (result.address && result.address.toUpperCase().includes(normalizedQuery)) {
            score += 150;
        }
        
        // 🎯 PRIORITY 10: Seats availability bonus
        if (result.seats && result.seats > 0) {
            score += Math.min(result.seats / 10, 100); // Cap at 100 points
        }
        
        return Math.round(score);
    }

    // 🎯 Format and deduplicate search results
    formatAndDeduplicate(results) {
        if (!Array.isArray(results) || results.length === 0) {
            return [];
        }

        const formatted = [];
        const seen = new Set();

        results.forEach(result => {
            if (!result || !result.name) return;

            // Create unique key based on college name and course
            const key = `${result.name}_${result.course_name || 'unknown'}`;
            if (seen.has(key)) return;
            seen.add(key);

            // Format the result to match expected structure
            formatted.push({
                id: result.id,
                course_id: result.id, // Use the same ID since each record represents a course
                name: result.name,
                type: result.college_type,
                state: result.state,
                seats: result.seats || 0,
                course: result.course_name || '',
                address: result.address || '',
                year_established: result.establishment_year,
                management_type: result.management || '',
                university: result.affiliation || '',
                quota_details: result.quota_type ? { [result.quota_type]: result.seats || 0 } : null,
                cutoff_ranks: null, // Not available in current structure
                fees_structure: result.fees_structure ? { amount: result.fee_structure } : null,
                searchScore: result.smartScore || 0,
                searchStrategy: result.strategy || 'unknown',
                matchedVariation: result.variation || ''
            });
        });

        return formatted;
    }

    // 📊 Get database statistics
    async getStats() {
        try {
            await this.initialize();
            
            const [medicalStats, dentalStats, dnbStats] = await Promise.all([
                this.runSelect(this.medicalDb, 'SELECT COUNT(DISTINCT college_name) as count, SUM(total_seats) as total_seats FROM medical_courses'),
                this.runSelect(this.dentalDb, 'SELECT COUNT(DISTINCT college_name) as count, SUM(total_seats) as total_seats FROM dental_courses'),
                this.runSelect(this.dnbDb, 'SELECT COUNT(DISTINCT college_name) as count, SUM(total_seats) as total_seats FROM dnb_courses')
            ]);
            
            const totalColleges = (medicalStats[0]?.count || 0) + (dentalStats[0]?.count || 0) + (dnbStats[0]?.count || 0);
            const totalSeats = (medicalStats[0]?.total_seats || 0) + (dentalStats[0]?.total_seats || 0) + (dnbStats[0]?.total_seats || 0);
            
            return {
                total: totalColleges,
                totalColleges: totalColleges, // Total unique colleges
                totalSeats: totalSeats,
                byType: [
                    { type: 'medical', count: medicalStats[0]?.count || 0, seats: medicalStats[0]?.total_seats || 0 },
                    { type: 'dental', count: dentalStats[0]?.count || 0, seats: dentalStats[0]?.total_seats || 0 },
                    { type: 'dnb', count: dnbStats[0]?.count || 0, seats: dnbStats[0]?.total_seats || 0 }
                ],
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('Stats error:', error);
            throw error;
        }
    }

    // 🎯 Get courses by stream
    async getCoursesByStream(stream) {
        try {
            await this.initialize();
            
            let courses = [];
            
            if (stream === 'medical') {
                courses = await this.runSelect(this.medicalDb, `
                    SELECT DISTINCT course_name as name, 'medical' as stream
                    FROM medical_courses
                    WHERE course_name IS NOT NULL AND course_name != ''
                    ORDER BY course_name
                `);
            } else if (stream === 'dental') {
                courses = await this.runSelect(this.dentalDb, `
                    SELECT DISTINCT course_name as name, 'dental' as stream
                    FROM dental_courses
                    WHERE course_name IS NOT NULL AND course_name != ''
                    ORDER BY course_name
                `);
            } else if (stream === 'dnb') {
                courses = await this.runSelect(this.dnbDb, `
                    SELECT DISTINCT course_name as name, 'dnb' as stream
                    FROM dnb_courses
                    WHERE course_name IS NOT NULL AND course_name != ''
                    ORDER BY course_name
                `);
            } else {
                // Get courses from all streams
                return await this.getAllCourses();
            }
            
            return courses;
            
        } catch (error) {
            console.error('Get courses by stream error:', error);
            throw error;
        }
    }

    // 🎯 Get all courses
    async getAllCourses() {
        try {
            await this.initialize();
            
            // Get courses from all three databases
            const medicalCourses = await this.runSelect(this.medicalDb, `
                SELECT DISTINCT course_name as name, 'medical' as stream
                FROM medical_courses
                WHERE course_name IS NOT NULL AND course_name != ''
                ORDER BY course_name
            `);
            
            const dentalCourses = await this.runSelect(this.dentalDb, `
                SELECT DISTINCT course_name as name, 'dental' as stream
                FROM dental_courses
                WHERE course_name IS NOT NULL AND course_name != ''
                ORDER BY course_name
            `);
            
            const dnbCourses = await this.runSelect(this.dnbDb, `
                SELECT DISTINCT course_name as name, 'dnb' as stream
                FROM dnb_courses
                WHERE course_name IS NOT NULL AND course_name != ''
                ORDER BY course_name
            `);
            
            // Combine all courses
            const allCourses = [
                ...medicalCourses,
                ...dentalCourses,
                ...dnbCourses
            ];
            
            return allCourses;
            
        } catch (error) {
            console.error('Get all courses error:', error);
            throw error;
        }
    }

    // 🎯 Get intelligent search suggestions
    async getSearchSuggestionsIntelligent(query, limit = 10) {
        try {
            await this.initialize();
            
            const normalizedQuery = query.toUpperCase().trim();
            if (normalizedQuery.length < 2) return [];
            
            // Understand user intent
            const intent = this.analyzeUserIntent(normalizedQuery);
            console.log('🎯 User intent:', intent);
            
            let suggestions = [];
            
            // Special handling for DNB queries - search for DNB hospitals
            if (intent.courseType === 'DNB') {
                suggestions = await this.getDNBHospitalSuggestions(normalizedQuery, limit);
            }
            // If user is looking for a specific course type, prioritize that
            else if (intent.courseType) {
                suggestions = await this.getCourseTypeSuggestions(intent.courseType, limit);
            }
            
            // If user is looking for a location, prioritize that
            if (intent.location && suggestions.length < limit) {
                const locationSuggestions = await this.getLocationSuggestions(normalizedQuery, limit - suggestions.length);
                suggestions.push(...locationSuggestions);
            }
            
            // If user is looking for a college, prioritize that
            if (intent.college && suggestions.length < limit) {
                const collegeSuggestions = await this.getCollegeSuggestions(normalizedQuery, limit - suggestions.length);
                suggestions.push(...collegeSuggestions);
            }
            
            // Remove duplicates and limit results
            const uniqueSuggestions = this.removeDuplicateSuggestions(suggestions, limit);
            
            return uniqueSuggestions;
            
        } catch (error) {
            console.error('Get intelligent search suggestions error:', error);
            return [];
        }
    }

    // 🏥 Get DNB hospital suggestions
    async getDNBHospitalSuggestions(query, limit) {
        try {
            // Search for DNB hospitals in the comprehensive_colleges table
            const sql = `
                SELECT DISTINCT
                    'hospital' as type,
                    c.college_name as value,
                    c.college_name as display,
                    c.state,
                    'dnb' as stream,
                    'Hospital' as category
                FROM comprehensive_colleges c
                WHERE c.college_type = 'dnb' 
                AND (
                    c.college_name LIKE ? OR 
                    c.state LIKE ? OR 
                    c.city LIKE ?
                )
                ORDER BY c.college_name
                LIMIT ?
            `;
            
            const results = await this.runSelect(this.collegesDb, sql, [
                `%${query}%`,
                `%${query}%`,
                `%${query}%`,
                limit
            ]);
            
            return results.map(result => ({
                type: result.type,
                value: result.value,
                display: `${result.value} (DNB Hospital)`,
                category: result.category,
                stream: result.stream,
                state: result.state
            }));
            
        } catch (error) {
            console.error('Error getting DNB hospital suggestions:', error);
            return [];
        }
    }

    // 🧠 Analyze what the user is looking for
    analyzeUserIntent(query) {
        const intent = {
            courseType: null,
            location: null,
            college: null,
            stream: null
        };
        
        // Check for course types
        if (query.includes('MBBS') || query.includes('M.B.B.S')) {
            intent.courseType = 'MBBS';
        } else if (query.includes('MD')) {
            intent.courseType = 'MD';
        } else if (query.includes('MS')) {
            intent.courseType = 'MS';
        } else if (query.includes('DM')) {
            intent.courseType = 'DM';
        } else if (query.includes('MCH') || query.includes('M.CH')) {
            intent.courseType = 'MCh';
        } else if (query.includes('BDS')) {
            intent.courseType = 'BDS';
        } else if (query.includes('MDS')) {
            intent.courseType = 'MDS';
        } else if (query.includes('DNB')) {
            intent.courseType = 'DNB';
        }
        
        // Check for streams
        if (query.includes('MEDICAL') || query.includes('MED')) {
            intent.stream = 'medical';
        } else if (query.includes('DENTAL') || query.includes('DENT')) {
            intent.stream = 'dental';
        } else if (query.includes('DNB')) {
            intent.stream = 'dnb';
        }
        
        // Check for location indicators
        if (query.includes('IN') || query.includes('AT') || query.includes('NEAR')) {
            intent.location = true;
        }
        
        // Check for college indicators
        if (query.includes('COLLEGE') || query.includes('INSTITUTE') || query.includes('HOSPITAL')) {
            intent.college = true;
        }
        
        return intent;
    }

    // 🎓 Get suggestions for specific course types
    async getCourseTypeSuggestions(courseType, limit) {
        try {
            const fs = require('fs');
            const path = require('path');
            
            const coursesPath = path.join(__dirname, 'data/foundation/extracted-courses.json');
            if (!fs.existsSync(coursesPath)) return [];
            
            const coursesData = JSON.parse(fs.readFileSync(coursesPath, 'utf8'));
            const allCourses = [
                ...coursesData.medical,
                ...coursesData.dental,
                ...coursesData.dnb
            ];
            
            // Find courses matching the type
            const matchingCourses = allCourses
                .filter(course => course.type === courseType)
                .slice(0, limit);
            
            return matchingCourses.map(course => ({
                type: 'course',
                value: course.name,
                display: `${course.name} (${course.stream})`,
                category: 'Course',
                stream: course.stream,
                state: 'All India'
            }));
            
        } catch (error) {
            console.error('Error getting course type suggestions:', error);
            return [];
        }
    }

    // 🗺️ Get location-based suggestions
    async getLocationSuggestions(location, limit) {
        try {
            const sql = `
                SELECT DISTINCT
                    'city' as type,
                    c.city as value,
                    c.city as display,
                    c.state,
                    c.college_type as stream,
                    'City' as category
                FROM comprehensive_colleges c
                WHERE c.city LIKE ? AND c.city != '' AND c.city IS NOT NULL
                ORDER BY c.city
                LIMIT ?
            `;
            
            const results = await this.runSelect(this.collegesDb, sql, [`%${location}%`, limit]);
            return results;
            
        } catch (error) {
            console.error('Error getting location suggestions:', error);
            return [];
        }
    }

    // 🏫 Get college-based suggestions
    async getCollegeSuggestions(college, limit) {
        try {
            const sql = `
                SELECT DISTINCT
                    'college' as type,
                    c.college_name as value,
                    c.college_name as display,
                    c.state,
                    c.college_type as stream,
                    'College' as category
                FROM comprehensive_colleges c
                WHERE c.college_name LIKE ?
                ORDER BY c.college_name
                LIMIT ?
            `;
            
            const results = await this.runSelect(this.collegesDb, sql, [`%${college}%`, limit]);
            return results;
            
        } catch (error) {
            console.error('Error getting college suggestions:', error);
            return [];
        }
    }

    // 🔄 Remove duplicate suggestions
    removeDuplicateSuggestions(suggestions, limit) {
            const seen = new Set();
        const unique = [];
        
        for (const suggestion of suggestions) {
            if (unique.length >= limit) break;
            
            const key = `${suggestion.type}:${suggestion.value}`;
            if (!seen.has(key)) {
                seen.add(key);
                unique.push(suggestion);
            }
        }
        
        return unique;
    }

    // 🎯 Get available streams - SIMPLIFIED with caching
    async getAvailableStreams() {
        try {
            // Check cache first (cache for 5 minutes)
            if (this.cache.streams && (Date.now() - this.cache.lastCacheUpdate) < 300000) {
                return this.cache.streams;
            }
            
            const sql = `
                SELECT DISTINCT 
                    college_type as value,
                    UPPER(college_type) as label,
                    COUNT(*) as count
                FROM comprehensive_colleges 
                GROUP BY college_type 
                ORDER BY college_type ASC
            `;
            
            const results = await this.runSelect(this.collegesDb, sql, []);
            const streams = results.map(result => ({
                    value: result.value,
                label: result.label,
                count: result.count
            }));
            
            // Update cache
            this.cache.streams = streams;
            this.cache.lastCacheUpdate = Date.now();
            
            return streams;
            
        } catch (error) {
            console.error('Get available streams error:', error);
            // Fallback to hardcoded values (in alphabetical order)
            return [
                { value: 'dental', label: 'DENTAL', count: 500 },
                { value: 'dnb', label: 'DNB', count: 200 },
                { value: 'medical', label: 'MEDICAL', count: 1000 }
            ];
        }
    }

    // 📚 Get available courses - SIMPLIFIED
    async getAvailableCourses(stream = null) {
        try {
            if (stream) {
                // For specific stream, return course types
                const courseTypes = {
                    'medical': ['Diploma', 'MD', 'MBBS', 'MS'],
                    'dental': ['BDS', 'Diploma', 'MDS'],
                    'dnb': ['DNB - General Medicine', 'DNB - Orthopedics', 'DNB - Pediatrics', 'DNB - Surgery']
                };
                
                const types = courseTypes[stream.toLowerCase()] || [];
                return types.map(type => ({
                    value: type,
                    label: type,
                    count: 1,
                    stream: stream
                }));
            }
            
            // Return all course types (in alphabetical order)
            return [
                { value: 'BDS', label: 'BDS', count: 500, stream: 'dental' },
                { value: 'Diploma', label: 'Diploma', count: 400, stream: 'medical' },
                { value: 'DNB', label: 'DNB', count: 200, stream: 'dnb' },
                { value: 'MD', label: 'MD', count: 800, stream: 'medical' },
                { value: 'MBBS', label: 'MBBS', count: 1000, stream: 'medical' },
                { value: 'MDS', label: 'MDS', count: 300, stream: 'dental' },
                { value: 'MS', label: 'MS', count: 600, stream: 'medical' }
            ];
            
        } catch (error) {
            console.error('Get available courses error:', error);
            return [];
        }
    }

    // 🌍 Get available states - SIMPLIFIED with caching
    async getAvailableStates() {
        try {
            // Check cache first (cache for 5 minutes)
            if (this.cache.states && (Date.now() - this.cache.lastCacheUpdate) < 300000) {
                return this.cache.states;
            }
            
            const sql = `
                SELECT DISTINCT 
                    state as value,
                    state as label,
                    COUNT(*) as count
                FROM comprehensive_colleges 
                WHERE state IS NOT NULL AND state != ''
                GROUP BY state 
                ORDER BY state ASC
            `;
            
            const results = await this.runSelect(this.collegesDb, sql, []);
            const states = results.map(result => ({
                value: result.value,
                label: result.value.toUpperCase(), // Ensure uppercase for uniformity
                count: result.count
            }));
            
            // Update cache
            this.cache.states = states;
            this.cache.lastCacheUpdate = Date.now();
            
            return states;
            
        } catch (error) {
            console.error('Get available states error:', error);
            // Fallback to hardcoded values (also in uppercase)
            return [
                { value: 'Karnataka', label: 'KARNATAKA', count: 1000 },
                { value: 'Maharashtra', label: 'MAHARASHTRA', count: 800 },
                { value: 'Tamil Nadu', label: 'TAMIL NADU', count: 600 },
                { value: 'Delhi', label: 'DELHI', count: 500 },
                { value: 'Kerala', label: 'KERALA', count: 400 }
            ];
        }
    }

    // 🎯 Get college by ID
    async getCollegeById(id) {
        try {
            await this.initialize();
            
            const results = await this.runSelect(this.collegesDb, `
                SELECT 
                    c.id, c.name, c.state, c.college_type, c.address, c.establishment_year,
                    c.management, c.affiliation,
                    co.id as course_id, co.course_name, co.seats, co.quota_details, co.cutoff_ranks, co.fees_structure
                FROM colleges c
                LEFT JOIN courses co ON c.id = co.college_id
                WHERE c.id = ?
            `, [id]);
            
            if (results.length === 0) return null;
            
            return this.formatAndDeduplicate(results)[0];
            
        } catch (error) {
            console.error('Get college by ID error:', error);
            throw error;
        }
    }

    // 🎯 Get colleges by type
    async getCollegesByType(type, limit = 100) {
        try {
            await this.initialize();
            
            const results = await this.runSelect(this.collegesDb, `
                SELECT 
                    c.id, c.name, c.state, c.college_type, c.address, c.establishment_year,
                    c.management, c.affiliation,
                    co.id as course_id, co.course_name, co.seats, co.quota_details, co.cutoff_ranks, co.fees_structure
                FROM colleges c
                LEFT JOIN courses co ON c.id = co.college_id
                WHERE c.college_type = ?
                LIMIT ?
            `, [type, limit]);
            
            return this.formatAndDeduplicate(results);
            
        } catch (error) {
            console.error('Get colleges by type error:', error);
            throw error;
        }
    }

    // 🎯 Get colleges by state
    async getCollegesByState(state, limit = 100) {
        try {
            await this.initialize();
            
            const results = await this.runSelect(this.collegesDb, `
                SELECT 
                    c.id, c.name, c.state, c.college_type, c.address, c.establishment_year,
                    c.management, c.affiliation,
                    co.id as course_id, co.course_name, co.seats, co.quota_details, co.cutoff_ranks, co.fees_structure
                FROM colleges c
                LEFT JOIN courses co ON c.id = co.college_id
                WHERE c.state LIKE ?
                LIMIT ?
            `, [`%${state}%`, limit]);
            
            return this.formatAndDeduplicate(results);
            
        } catch (error) {
            console.error('Get colleges by state error:', error);
            throw error;
        }
    }

    // 🎯 Get courses by stream
    async getCoursesByStream(stream) {
        try {
            await this.initialize();
            
            const results = await this.runSelect(this.collegesDb, `
                SELECT DISTINCT co.course_name as name, c.college_type as stream
                FROM colleges c
                LEFT JOIN courses co ON c.id = co.college_id
                WHERE c.college_type = ?
                ORDER BY co.course_name
            `, [stream]);
            
            return results.map(r => ({ name: r.name, stream: r.stream }));
            
        } catch (error) {
            console.error('Get courses by stream error:', error);
            throw error;
        }
    }

    // 🎯 Get all courses
    async getAllCourses() {
        try {
            await this.initialize();
            
            const results = await this.runSelect(this.collegesDb, `
                SELECT DISTINCT co.course_name as name, c.college_type as stream
                FROM colleges c
                LEFT JOIN courses co ON c.id = co.college_id
                ORDER BY c.college_type, co.course_name
            `);
            
            return results.map(r => ({ name: r.name, stream: r.stream }));
            
        } catch (error) {
            console.error('Get all courses error:', error);
            throw error;
        }
    }

    // 🔍 Get auto-complete suggestions
    async getAutoCompleteSuggestions(query, filters = {}) {
        try {
            await this.initialize();
            
            const { stream, limit = 10 } = filters;
            const normalizedQuery = query.toUpperCase().trim();
            
            if (normalizedQuery.length < 2) {
                return [];
            }
            
            let sql = `
                SELECT DISTINCT
                    'college' as type,
                    c.name as value,
                    c.name as display,
                    c.state,
                    c.college_type as stream,
                    'College' as category
                FROM colleges c
                WHERE c.name LIKE ?
                
                UNION ALL
                
                SELECT DISTINCT
                    'course' as type,
                    co.course_name as value,
                    co.course_name as display,
                    c.state,
                    c.college_type as stream,
                    'Course' as category
                FROM colleges c
                LEFT JOIN courses co ON c.id = co.college_id
                WHERE co.course_name LIKE ?
                
                UNION ALL
                
                SELECT DISTINCT
                    'city' as type,
                    c.address as value,
                    SUBSTR(c.address, 1, INSTR(c.address, ',') - 1) as display,
                    c.state,
                    c.college_type as stream,
                    'City' as category
                FROM colleges c
                WHERE c.address LIKE ? AND c.address != ''
                
                UNION ALL
                
                SELECT DISTINCT
                    'state' as type,
                    c.state as value,
                    c.state as display,
                    c.state as state,
                    c.college_type as stream,
                    'State' as category
                FROM colleges c
                WHERE c.state LIKE ?
            `;
            
            const params = [
                `%${normalizedQuery}%`,
                `%${normalizedQuery}%`,
                `%${normalizedQuery}%`,
                `%${normalizedQuery}%`
            ];
            
            if (stream) {
                sql += ' AND c.college_type = ?';
                params.push(stream);
            }
            
            sql += ' ORDER BY type, display LIMIT ?';
            params.push(limit * 4); // Get more results to allow for filtering
            
            const results = await this.runSelect(this.collegesDb, sql, params);
            
            // Process and deduplicate results
            const suggestions = [];
            const seen = new Set();
            
            for (const result of results) {
                if (suggestions.length >= limit) break;
                
                let display = result.display;
                let category = result.category;
                
                // Clean up city names
                if (result.type === 'city') {
                    display = display.replace(/^[,\s]+|[,\s]+$/g, ''); // Remove leading/trailing commas and spaces
                    if (display.length < 3) continue; // Skip very short city names
                }
                
                // Create unique key
                const key = `${result.type}:${display}`;
                if (seen.has(key)) continue;
                seen.add(key);
                
                // Add stream info to display
                if (result.stream) {
                    display += ` (${result.stream.charAt(0).toUpperCase() + result.stream.slice(1)})`;
                }
                
                suggestions.push({
                    type: result.type,
                    value: result.value,
                    display: display,
                    category: category,
                    stream: result.stream,
                    state: result.state
                });
            }
            
            return suggestions.slice(0, limit);
            
        } catch (error) {
            console.error('Auto-complete suggestions error:', error);
            return [];
        }
    }

    // 🔍 Legacy search method for backward compatibility
    async search(query, filters = {}) {
        return this.enhancedComprehensiveSearch(query, filters);
    }

    // 🚀 Enhanced Search with Result Grouping and Better Formatting
    async enhancedSearch(query, filters = {}, limit = 50) {
        try {
            await this.initialize();
            
            console.log('🚀 Enhanced Search:', { query, filters, limit });
            
            // Get basic search results
            const basicResults = await this.search(query, filters);
            
            if (!basicResults.data || basicResults.data.length === 0) {
                return {
                    data: [],
                    total: 0,
                    groupedResults: [],
                    query: query,
                    filters: filters,
                    timestamp: new Date().toISOString()
                };
            }
            
            // Group results by college
            const groupedResults = this.groupResultsByCollege(basicResults.data);
            
            // Apply additional filters if specified
            let filteredResults = groupedResults;
            if (filters.stream) {
                filteredResults = filteredResults.filter(group => 
                    group.stream === filters.stream
                );
            }
            
            if (filters.courseType) {
                filteredResults = filteredResults.filter(group => 
                    group.courses.some(course => 
                        course.course_name.toLowerCase().includes(filters.courseType.toLowerCase())
                    )
                );
            }
            
            if (filters.state) {
                filteredResults = filteredResults.filter(group => 
                    group.state.toLowerCase().includes(filters.state.toLowerCase())
                );
            }
            
            if (filters.city) {
                filteredResults = filteredResults.filter(group => 
                    group.city && group.city.toLowerCase().includes(filters.city.toLowerCase())
                );
            }
            
            // Sort by relevance and limit results
            const sortedResults = this.sortByRelevance(filteredResults, query);
            const limitedResults = sortedResults.slice(0, limit);
            
            return {
                data: basicResults.data,
                total: basicResults.total,
                groupedResults: limitedResults,
                totalGroups: limitedResults.length,
                query: query,
                filters: filters,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('Enhanced search error:', error);
            throw error;
        }
    }
    
    // 🔧 Group search results by college
    groupResultsByCollege(results) {
        const grouped = {};
        
        results.forEach(result => {
            // Safely handle null/undefined values
            const collegeName = result.college_name || result.name || 'Unknown College';
            const state = result.state || 'Unknown State';
            const type = result.type || 'unknown';
            const address = result.address || '';
            
            const key = `${collegeName}_${state}_${type}`;
            
            if (!grouped[key]) {
                grouped[key] = {
                    college_name: collegeName,
                    state: state,
                    city: result.city || (address ? address.split(',')[0]?.trim() : '') || '',
                    type: type,
                    stream: type,
                    address: address,
                    totalSeats: 0,
                    courses: [],
                    courseCount: 0
                };
            }
            
            // Add course information
            const courseInfo = {
                course_name: result.course_name || result.course || 'Unknown Course',
                seats: parseInt(result.seats) || 0,
                quota_details: result.quota_details || '',
                cutoff_ranks: result.cutoff_ranks || '',
                fees_structure: result.fees_structure || ''
            };
            
            grouped[key].courses.push(courseInfo);
            grouped[key].totalSeats += courseInfo.seats;
            grouped[key].courseCount = grouped[key].courses.length;
        });
        
        return Object.values(grouped);
    }
    
    // 🎯 Sort results by relevance
    sortByRelevance(groupedResults, query) {
        const queryLower = query.toLowerCase();
        
        return groupedResults.sort((a, b) => {
            let scoreA = 0;
            let scoreB = 0;
            
            // Exact college name match gets highest score
            if (a.college_name && a.college_name.toLowerCase().includes(queryLower)) scoreA += 100;
            if (b.college_name && b.college_name.toLowerCase().includes(queryLower)) scoreB += 100;
            
            // State match
            if (a.state && a.state.toLowerCase().includes(queryLower)) scoreA += 50;
            if (b.state && b.state.toLowerCase().includes(queryLower)) scoreB += 50;
            
            // City match
            if (a.city && a.city.toLowerCase().includes(queryLower)) scoreA += 30;
            if (b.city && b.city.toLowerCase().includes(queryLower)) scoreB += 30;
            
            // Course match
            const courseMatchA = a.courses && a.courses.some(course => 
                course.course_name && course.course_name.toLowerCase().includes(queryLower)
            );
            const courseMatchB = b.courses && b.courses.some(course => 
                course.course_name && course.course_name.toLowerCase().includes(queryLower)
            );
            
            if (courseMatchA) scoreA += 20;
            if (courseMatchB) scoreB += 20;
            
            // More courses = higher score (more comprehensive)
            scoreA += (a.courseCount || 0);
            scoreB += (b.courseCount || 0);
            
            // More seats = higher score
            scoreA += Math.min((a.totalSeats || 0) / 100, 10);
            scoreB += Math.min((b.totalSeats || 0) / 100, 10);
            
            return scoreB - scoreA;
        });
    }

    // 🔍 Generate search variations for better matching
    generateSearchVariations(query) {
        const variations = [query];
        
        // Add common variations
        if (query.includes(' ')) {
            variations.push(query.replace(/\s+/g, ''));
            variations.push(query.split(' ').join('.'));
        }
        
        // Add partial matches for longer queries
        if (query.length > 3) {
            variations.push(query.substring(0, query.length - 1));
            variations.push(query.substring(1));
        }
        
        return variations.slice(0, 5); // Limit to 5 variations
    }
    
    // 🎯 Calculate smart search score
    calculateSmartScore(result, query) {
        let score = 0;
        const queryLower = query.toLowerCase();
        
        // Exact matches get highest score
        if (result.name && result.name.toLowerCase().includes(queryLower)) score += 1000;
        if (result.course && result.course.toLowerCase().includes(queryLower)) score += 800;
        if (result.state && result.state.toLowerCase().includes(queryLower)) score += 600;
        if (result.city && result.city.toLowerCase().includes(queryLower)) score += 400;
        
        // Partial matches
        if (result.name && result.name.toLowerCase().includes(queryLower.substring(0, 3))) score += 200;
        if (result.course && result.course.toLowerCase().includes(queryLower.substring(0, 3))) score += 150;
        
        return score;
    }
    
    // 🔧 Remove duplicates and format results
    formatAndDeduplicate(results) {
        const seen = new Set();
        const uniqueResults = [];
        
        for (const result of results) {
            const key = `${result.name}_${result.course}_${result.type}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueResults.push(result);
            }
        }
        
        // Sort by search score (highest first)
        return uniqueResults.sort((a, b) => (b.searchScore || 0) - (a.searchScore || 0));
    }

    // 🏗️ Initialize comprehensive college database
    async initializeComprehensiveCollegeDB() {
        try {
            console.log('🏗️ Initializing comprehensive college database...');
            
            // Create comprehensive colleges table if it doesn't exist
            await this.collegesDb.exec(`
                CREATE TABLE IF NOT EXISTS comprehensive_colleges (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    college_name TEXT NOT NULL,
                    normalized_name TEXT,
                    college_code TEXT,
                    address TEXT,
                    city TEXT,
                    state TEXT,
                    pincode TEXT,
                    phone TEXT,
                    email TEXT,
                    website TEXT,
                    college_type TEXT NOT NULL,
                    establishment_year INTEGER,
                    management_type TEXT,
                    university TEXT,
                    total_courses INTEGER DEFAULT 0,
                    total_seats INTEGER DEFAULT 0,
                    search_score REAL DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // Create comprehensive courses table if it doesn't exist
            await this.collegesDb.exec(`
                CREATE TABLE IF NOT EXISTS comprehensive_courses (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    college_id INTEGER NOT NULL,
                    course_name TEXT NOT NULL,
                    normalized_name TEXT,
                    course_type TEXT NOT NULL,
                    specialization TEXT,
                    duration INTEGER,
                    total_seats INTEGER DEFAULT 0,
                    quota_details TEXT,
                    cutoff_ranks TEXT,
                    fees_structure TEXT,
                    entrance_exam TEXT,
                    search_score REAL DEFAULT 0,
                    search_priority INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (college_id) REFERENCES comprehensive_colleges(id)
                )
            `);
            
            // Create indexes for better performance
            await this.collegesDb.exec(`
                CREATE INDEX IF NOT EXISTS idx_comp_college_name ON comprehensive_colleges(college_name);
                CREATE INDEX IF NOT EXISTS idx_comp_college_type ON comprehensive_colleges(college_type);
                CREATE INDEX IF NOT EXISTS idx_comp_state ON comprehensive_colleges(state);
                CREATE INDEX IF NOT EXISTS idx_comp_city ON comprehensive_colleges(city);
                CREATE INDEX IF NOT EXISTS idx_comp_course_name ON comprehensive_courses(course_name);
                CREATE INDEX IF NOT EXISTS idx_comp_course_type ON comprehensive_courses(course_type);
            `);
            
            console.log('✅ Comprehensive college database structure created');
            
            // Populate with data from existing databases
            await this.populateComprehensiveCollegeDB();
            
        } catch (error) {
            console.error('❌ Failed to initialize comprehensive college database:', error);
        }
    }
    
    // 📊 Populate comprehensive college database with existing data
    async populateComprehensiveCollegeDB() {
        try {
            console.log('📊 Populating comprehensive college database...');
            
            // Clear existing data
            console.log('🗑️ Clearing existing data...');
            await this.runInsert(this.collegesDb, 'DELETE FROM comprehensive_courses');
            await this.runInsert(this.collegesDb, 'DELETE FROM comprehensive_colleges');
            console.log('✅ Existing data cleared');
            
            let collegeId = 1;
            const collegesMap = new Map(); // To avoid duplicates
            
            // Process medical colleges
            console.log('🏥 Processing medical colleges...');
            const medicalColleges = await this.runSelect(this.medicalDb, `
                SELECT DISTINCT 
                    college_name, state, city, establishment_year, 
                    management_type
                FROM medical_courses
            `);
            console.log(`📊 Found ${medicalColleges.length} medical colleges`);
            
            for (const college of medicalColleges) {
                const key = `${college.college_name}_${college.state}`;
                if (!collegesMap.has(key)) {
                    collegesMap.set(key, {
                        id: collegeId++,
                        college_name: college.college_name,
                        state: college.state,
                        city: college.city || '',
                        establishment_year: college.establishment_year || 0,
                        management_type: college.management_type || '',
                        university: '', // Not available in medical_courses
                        college_type: 'medical'
                    });
                }
            }
            
            // Process dental colleges
            console.log('🦷 Processing dental colleges...');
            const dentalColleges = await this.runSelect(this.dentalDb, `
                SELECT DISTINCT 
                    college_name, state, city, establishment_year, 
                    management_type
                FROM dental_courses
            `);
            console.log(`📊 Found ${dentalColleges.length} dental colleges`);
            
            for (const college of dentalColleges) {
                const key = `${college.college_name}_${college.state}`;
                if (!collegesMap.has(key)) {
                    collegesMap.set(key, {
                        id: collegeId++,
                        college_name: college.college_name,
                        state: college.state,
                        city: college.city || '',
                        establishment_year: college.establishment_year || 0,
                        management_type: college.management_type || '',
                        university: '', // Not available in dental_courses
                        college_type: 'dental'
                    });
                }
            }
            
            // Process DNB hospitals
            console.log('🏥 Processing DNB hospitals...');
            const dnbHospitals = await this.runSelect(this.dnbDb, `
                SELECT DISTINCT 
                    college_name, state, city, hospital_type, 
                    accreditation
                FROM dnb_courses
            `);
            console.log(`📊 Found ${dnbHospitals.length} DNB hospitals`);
            
            for (const hospital of dnbHospitals) {
                const key = `${hospital.college_name}_${hospital.state}`;
                if (!collegesMap.has(key)) {
                    collegesMap.set(key, {
                        id: collegeId++,
                        college_name: hospital.college_name,
                        state: hospital.state,
                        city: hospital.city || '',
                        establishment_year: 0,
                        management_type: hospital.hospital_type || '',
                        university: hospital.accreditation || '',
                        college_type: 'dnb'
                    });
                }
            }
            
            console.log(`📊 Total unique colleges to insert: ${collegesMap.size}`);
            
            // Insert colleges
            console.log(`📝 Inserting ${collegesMap.size} colleges...`);
            let insertedColleges = 0;
            for (const college of collegesMap.values()) {
                try {
                    await this.runInsert(this.collegesDb, `
                        INSERT INTO comprehensive_colleges (
                            id, college_name, state, city, establishment_year,
                            management_type, university, college_type
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        college.id, college.college_name, college.state, college.city,
                        college.establishment_year, college.management_type, college.university, college.college_type
                    ]);
                    insertedColleges++;
                } catch (error) {
                    console.error(`❌ Failed to insert college ${college.college_name}:`, error);
                }
            }
            console.log(`✅ Inserted ${insertedColleges} colleges`);
            
            // Insert courses
            console.log('📚 Inserting courses...');
            let courseId = 1;
            let insertedCourses = 0;
            
            // Medical courses
            const medicalCourses = await this.runSelect(this.medicalDb, `
                SELECT college_name, course_name, total_seats, fee_structure, 
                       cutoff_rank, state
                FROM medical_courses
            `);
            console.log(`📊 Found ${medicalCourses.length} medical courses`);
            
            for (const course of medicalCourses) {
                const college = collegesMap.get(`${course.college_name}_${course.state}`);
                if (college) {
                    try {
                        await this.runInsert(this.collegesDb, `
                            INSERT INTO comprehensive_courses (
                                id, college_id, course_name, course_type, total_seats,
                                quota_details, cutoff_ranks, fees_structure
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        `, [
                            courseId++, college.id, course.course_name, 'medical',
                            course.total_seats || 0, '', // quota_details not available
                            course.cutoff_rank || '', course.fee_structure || ''
                        ]);
                        insertedCourses++;
                    } catch (error) {
                        console.error(`❌ Failed to insert medical course ${course.course_name}:`, error);
                    }
                }
            }
            
            // Dental courses
            const dentalCourses = await this.runSelect(this.dentalDb, `
                SELECT college_name, course_name, total_seats, fee_structure, 
                       cutoff_rank, state
                FROM dental_courses
            `);
            console.log(`📊 Found ${dentalCourses.length} dental courses`);
            
            for (const course of dentalCourses) {
                const college = collegesMap.get(`${course.college_name}_${course.state}`);
                if (college) {
                    try {
                        await this.runInsert(this.collegesDb, `
                            INSERT INTO comprehensive_courses (
                                id, college_id, course_name, course_type, total_seats,
                                quota_details, cutoff_ranks, fees_structure
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        `, [
                            courseId++, college.id, course.course_name, 'dental',
                            course.total_seats || 0, '', // quota_details not available
                            course.cutoff_rank || '', course.fee_structure || ''
                        ]);
                        insertedCourses++;
                    } catch (error) {
                        console.error(`❌ Failed to insert dental course ${course.course_name}:`, error);
                    }
                }
            }
            
            // DNB courses
            const dnbCourses = await this.runSelect(this.dnbDb, `
                SELECT college_name, course_name, total_seats, fee_structure, 
                       cutoff_rank, state
                FROM dnb_courses
            `);
            console.log(`📊 Found ${dnbCourses.length} DNB courses`);
            
            for (const course of dnbCourses) {
                const college = collegesMap.get(`${course.college_name}_${course.state}`);
                if (college) {
                    try {
                        await this.runInsert(this.collegesDb, `
                            INSERT INTO comprehensive_courses (
                                id, college_id, course_name, course_type, total_seats,
                                quota_details, cutoff_ranks, fees_structure
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        `, [
                            courseId++, college.id, course.course_name, 'dnb',
                            course.total_seats || 0, '', // quota_details not available
                            course.cutoff_rank || '', course.fee_structure || ''
                        ]);
                        insertedCourses++;
                    } catch (error) {
                        console.error(`❌ Failed to insert DNB course ${course.course_name}:`, error);
                    }
                }
            }
            
            console.log(`✅ Inserted ${insertedCourses} courses`);
            
            // Update college statistics
            console.log('📊 Updating college statistics...');
            try {
                await this.collegesDb.exec(`
                    UPDATE comprehensive_colleges 
                    SET total_courses = (
                        SELECT COUNT(*) FROM comprehensive_courses 
                        WHERE college_id = comprehensive_colleges.id
                    ),
                    total_seats = (
                        SELECT COALESCE(SUM(total_seats), 0) FROM comprehensive_courses 
                        WHERE college_id = comprehensive_colleges.id
                    )
                `);
                console.log('✅ College statistics updated');
            } catch (error) {
                console.error('❌ Failed to update college statistics:', error);
            }
            
            console.log('✅ Comprehensive college database populated successfully');
            
        } catch (error) {
            console.error('❌ Failed to populate comprehensive college database:', error);
        }
    }

    // 🔍 Search in comprehensive college database
    async searchComprehensiveCollegeDB(query, filters = {}) {
        try {
            console.log('🔍 Searching comprehensive college database:', { query, filters });
            
            let results = [];
            
            // If we have a course type filter, search for courses first
            if (filters.courseType) {
                console.log('🔍 Searching by course type:', filters.courseType);
                
                // Special handling for DNB - search for DNB hospitals instead of courses
                if (filters.courseType.toUpperCase() === 'DNB') {
                    console.log('🔍 DNB detected - searching for DNB hospitals');
                    
                    let dnbSql = `
                        SELECT DISTINCT
                            c.id, c.college_name as name, c.college_type as type,
                            c.state, c.city, c.establishment_year, c.management_type as management,
                            c.university, c.total_courses, c.total_seats,
                            'DNB Hospital' as course_name, 'DNB' as course_category, c.total_seats as course_seats,
                            '{}' as quota_details, '{}' as cutoff_ranks, '{}' as fees_structure
                        FROM comprehensive_colleges c
                        WHERE c.college_type = 'dnb'
                    `;
                    
                    let dnbParams = [];
                    
                    // If query contains location info (state/city), add location filter
                    if (query.toLowerCase().includes('karnataka') || query.toLowerCase().includes('bangalore') || query.toLowerCase().includes('mangalore') || 
                        query.toLowerCase().includes('in karnataka') || query.toLowerCase().includes('in bangalore') || query.toLowerCase().includes('in mangalore') ||
                        query.toLowerCase().includes('mysore') || query.toLowerCase().includes('in mysore')) {
                        dnbSql += ` AND (c.state LIKE ? OR c.city LIKE ?)`;
                        dnbParams.push('%Karnataka%', '%Karnataka%');
                    }
                    
                    dnbSql += ' ORDER BY c.college_name LIMIT ?';
                    dnbParams.push(filters.limit || 50);
                    
                    const dnbResults = await this.runSelect(this.collegesDb, dnbSql, dnbParams);
                    console.log(`✅ Found ${dnbResults.length} DNB hospital results`);
                    
                    for (const result of dnbResults) {
                        const searchScore = this.calculateComprehensiveSearchScore(result, query);
                        results.push({
                            id: result.id,
                            name: result.name,
                            type: result.type,
                            state: result.state,
                            city: result.city,
                            establishment_year: result.establishment_year,
                            management_type: result.management,
                            university: result.university,
                            total_courses: result.total_courses,
                            seats: result.total_seats,
                            course: result.course_name,
                            course_category: result.course_category,
                            course_seats: result.course_seats,
                            quota_details: result.quota_details,
                            cutoff_ranks: result.cutoff_ranks,
                            fees_structure: result.fees_structure,
                            searchScore: searchScore,
                            searchStrategy: 'dnb_hospital',
                            matchedVariation: query
                        });
                    }
                    
                    return results;
                }
                
                // Regular course search for non-DNB course types
                // Search for courses matching the course type, then filter by location if query contains location info
                let courseSql = `
                    SELECT DISTINCT
                        c.id, c.college_name as name, c.college_type as type,
                        c.state, c.city, c.establishment_year, c.management_type as management,
                        c.university, c.total_courses, c.total_seats,
                        co.course_name, co.course_type as course_category, co.total_seats as course_seats,
                        co.quota_details, co.cutoff_ranks, co.fees_structure
                    FROM comprehensive_colleges c
                    JOIN comprehensive_courses co ON c.id = co.college_id
                    WHERE (
                        co.course_name LIKE ? OR 
                        co.course_name LIKE ? OR 
                        co.course_name LIKE ? OR
                        co.course_name LIKE ? OR
                        co.course_name LIKE ?
                    )
                    AND co.course_name NOT LIKE '%Post%'
                    AND co.course_name NOT LIKE '%Diploma%'
                    AND co.course_name NOT LIKE '%Certificate%'
                `;
                
                let courseParams = [
                    `%${filters.courseType}%`,
                    `%${filters.courseType.replace(/\./g, '')}%`,
                    `%${filters.courseType.replace(/(.)/g, '$1.')}%`,
                    `%${filters.courseType.replace(/\./g, '').toUpperCase()}%`,
                    `%${filters.courseType.replace(/\./g, '').toLowerCase()}%`
                ];
                
                // If query contains location info (state/city), add location filter
                if (query.toLowerCase().includes('karnataka') || query.toLowerCase().includes('bangalore') || query.toLowerCase().includes('mangalore') || 
                    query.toLowerCase().includes('in karnataka') || query.toLowerCase().includes('in bangalore') || query.toLowerCase().includes('in mangalore') ||
                    query.toLowerCase().includes('mysore') || query.toLowerCase().includes('in mysore')) {
                    courseSql += ` AND (c.state LIKE ? OR c.city LIKE ?)`;
                    courseParams.push('%Karnataka%', '%Karnataka%');
                }
                
                courseSql += ' ORDER BY c.college_name, co.course_name LIMIT ?';
                courseParams.push(filters.limit || 50);
                
                const courseResults = await this.runSelect(this.collegesDb, courseSql, courseParams);
                console.log(`✅ Found ${courseResults.length} course results`);
                
                // Apply additional relevance filtering to remove false positives
                const filteredResults = this.filterByCourseType(courseResults, filters.courseType);
                console.log(`✅ After course type filtering: ${filteredResults.length} results`);
                
                for (const result of filteredResults) {
                    const searchScore = this.calculateComprehensiveSearchScore(result, query);
                    results.push({
                        id: result.id,
                        name: result.name,
                        type: result.type,
                        state: result.state,
                        city: result.city,
                        establishment_year: result.establishment_year,
                        management_type: result.management,
                        university: result.university,
                        total_courses: result.total_courses,
                        seats: result.total_seats,
                        course: result.course_name,
                        course_category: result.course_category,
                        course_seats: result.course_seats,
                        quota_details: result.quota_details,
                        cutoff_ranks: result.cutoff_ranks,
                        fees_structure: result.fees_structure,
                        searchScore: searchScore,
                        searchStrategy: 'comprehensive',
                        matchedVariation: query
                    });
                }
            } else {
                // No course type filter, search for colleges first
                console.log('🔍 Searching by college/location only');
                
                let sql = `
                    SELECT DISTINCT
                        c.id, c.college_name as name, c.college_type as type,
                        c.state, c.city, c.establishment_year, c.management_type as management,
                        c.university, c.total_courses, c.total_seats
                    FROM comprehensive_colleges c
                    WHERE (
                        c.college_name LIKE ? OR 
                        c.state LIKE ? OR 
                        c.city LIKE ?
                    )
                `;
                
                const params = [`%${query}%`, `%${query}%`, `%${query}%`];
                
                // Add state filter if specified
                if (filters.state) {
                    sql += ` AND c.state LIKE ?`;
                    params.push(`%${filters.state}%`);
                }
                
                // Add city filter if specified
                if (filters.city) {
                    sql += ` AND c.city LIKE ?`;
                    params.push(`%${filters.city}%`);
                }
                
                sql += ' ORDER BY c.college_name LIMIT ?';
                params.push(filters.limit || 50);
                
                const collegeResults = await this.runSelect(this.collegesDb, sql, params);
                console.log(`✅ Found ${collegeResults.length} colleges`);
                
                for (const college of collegeResults) {
                    // Get courses for this college
                    const courses = await this.runSelect(this.collegesDb, `
                        SELECT 
                            course_name, course_type, total_seats,
                            quota_details, cutoff_ranks, fees_structure
                        FROM comprehensive_courses 
                        WHERE college_id = ?
                        ORDER BY course_name
                    `, [college.id]);
                    
                    if (courses.length > 0) {
                        // Calculate search score
                        const searchScore = this.calculateComprehensiveSearchScore(college, query);
                        
                        // Add each course as a separate result
                        for (const course of courses) {
                            results.push({
                                id: college.id,
                                name: college.name,
                                type: college.type,
                                state: college.state,
                                city: college.city,
                                establishment_year: college.establishment_year,
                                management_type: college.management,
                                university: college.university,
                                total_courses: college.total_courses,
                                seats: college.total_seats,
                                course: course.course_name,
                                course_category: course.course_type,
                                course_seats: course.total_seats,
                                quota_details: course.quota_details,
                                cutoff_ranks: course.cutoff_ranks,
                                fees_structure: course.fees_structure,
                                searchScore: searchScore,
                                searchStrategy: 'comprehensive',
                                matchedVariation: query
                            });
                        }
                    }
                }
            }
            
            // Remove duplicates and sort by search score
            const uniqueResults = this.removeDuplicateResults(results);
            const sortedResults = uniqueResults.sort((a, b) => b.searchScore - a.searchScore);
            
            console.log(`✅ Comprehensive search found ${sortedResults.length} results`);
            return sortedResults;
            
        } catch (error) {
            console.error('Comprehensive college search error:', error);
            throw error;
        }
    }
    
    // 🎯 Calculate comprehensive search score
    calculateComprehensiveSearchScore(result, query) {
        let score = 0;
        const queryLower = query.toLowerCase();
        
        // Exact matches get highest score
        if (result.name && result.name.toLowerCase().includes(queryLower)) score += 1000;
        if (result.course && result.course.toLowerCase().includes(queryLower)) score += 800;
        if (result.state && result.state.toLowerCase().includes(queryLower)) score += 600;
        if (result.city && result.city.toLowerCase().includes(queryLower)) score += 400;
        
        // College type bonus
        if (result.type === 'medical') score += 100;
        if (result.type === 'dental') score += 80;
        if (result.type === 'dnb') score += 60;
        
        // Course count bonus (more courses = higher score)
        score += (result.total_courses || 0) * 10;
        
        // Total seats bonus
        score += Math.min((result.seats || 0) / 100, 50);
        
        return score;
    }
    
    // 🔍 Enhanced comprehensive search - SIMPLIFIED AND ROBUST
    async enhancedComprehensiveSearch(query, filters) {
        try {
            console.log('🚀 Enhanced Comprehensive Search:', { query, filters });
            
            // Simple, robust search approach
            const results = await this.simpleRobustSearch(query, filters);
                
                if (results && results.length > 0) {
                console.log(`✅ Found ${results.length} results`);
                    const groupedResults = this.groupComprehensiveResultsByCollege(results);
                    
                    return {
                    data: groupedResults, // Return grouped results for the API
                        total: results.length,
                    groupedResults: groupedResults,
                    totalGroups: groupedResults.length,
                        query: query,
                        filters: filters,
                        timestamp: new Date().toISOString()
                    };
            }
            
            console.log('❌ No results found');
                return {
                total: 0,
                groupedResults: [],
                totalGroups: 0,
                    query: query,
                    filters: filters,
                    timestamp: new Date().toISOString()
                };
            
        } catch (error) {
            console.error('Comprehensive search error:', error);
            return {
                total: 0,
                groupedResults: [],
                totalGroups: 0,
                query: query,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    // 🎯 Simple, robust search that actually works
    async simpleRobustSearch(query, filters = {}) {
        try {
            const normalizedQuery = query.toLowerCase().trim();
            let results = [];
            
            // Handle compound queries like "DNB in Karnataka"
            const queryParts = this.parseCompoundQuery(normalizedQuery);
            console.log('🔍 Parsed query parts:', queryParts);
            
            // Strategy 1: Search with all parts combined
            results = await this.searchWithQueryParts(queryParts, filters);
            if (results.length > 0) {
                console.log(`✅ Found ${results.length} results with compound search`);
                return results;
            }
            
            // Strategy 2: Direct college search (most reliable)
            results = await this.searchCollegesDirect(normalizedQuery, filters);
            if (results.length > 0) {
                console.log(`✅ Found ${results.length} colleges directly`);
                return results;
            }
            
            // Strategy 3: Course-based search
            results = await this.searchByCourse(normalizedQuery, filters);
            if (results.length > 0) {
                console.log(`✅ Found ${results.length} results by course`);
                return results;
            }
            
            // Strategy 4: Location-based search
            results = await this.searchByLocation(normalizedQuery, filters);
            if (results.length > 0) {
                console.log(`✅ Found ${results.length} results by location`);
                return results;
            }
            
            console.log('❌ No results found with any strategy');
            return [];
            
        } catch (error) {
            console.error('Simple robust search error:', error);
            return [];
        }
    }

    // 🔍 Parse compound queries like "DNB in Karnataka"
    parseCompoundQuery(query) {
        const parts = {
            courseType: null,
            location: null,
            stream: null
        };
        
        // Extract course type
        const courseKeywords = ['mbbs', 'md', 'ms', 'bds', 'dnb', 'medical', 'dental'];
        for (const keyword of courseKeywords) {
            if (query.includes(keyword)) {
                parts.courseType = keyword;
                break;
            }
        }
        
        // Extract location (state/city)
        const locationKeywords = ['in ', 'at ', 'on ', 'near '];
        for (const keyword of locationKeywords) {
            if (query.includes(keyword)) {
                const locationPart = query.split(keyword)[1];
                if (locationPart) {
                    parts.location = locationPart.trim();
                    break;
                }
            }
        }
        
        // Extract stream from course type
        if (parts.courseType === 'dnb') {
            parts.stream = 'dnb';
        } else if (['mbbs', 'md', 'ms'].includes(parts.courseType)) {
            parts.stream = 'medical';
        } else if (['bds', 'mds'].includes(parts.courseType)) {
            parts.stream = 'dental';
        }
        
        return parts;
    }

    // 🔍 Search with parsed query parts
    async searchWithQueryParts(queryParts, filters) {
        try {
            // Smart limit adjustment for broad searches
            let effectiveLimit = filters.limit || 100;
            
            // For broad searches (just course type or stream), increase the limit
            if (queryParts.courseType && !queryParts.location && !filters.state) {
                effectiveLimit = Math.max(effectiveLimit, 500); // Allow up to 500 for broad searches
            }
            
            // For very broad searches (just "DNB colleges", "MBBS colleges"), use even higher limit
            if (queryParts.courseType && !queryParts.location && !filters.state) {
                effectiveLimit = Math.max(effectiveLimit, 1000); // Allow up to 1000 for very broad searches
            }
            
            // Special case: DNB searches should always get high limits due to large dataset
            if (queryParts.courseType === 'dnb' || filters.stream === 'dnb') {
                effectiveLimit = Math.max(effectiveLimit, 1250);
            }
            
            console.log(`🔍 Using effective limit: ${effectiveLimit} for search`);
            
            // First, get unique colleges without JOIN to avoid duplicate rows
            let collegeSql = `
                SELECT DISTINCT
                    c.id, c.college_name as name, c.college_type as type,
                    c.state, c.city, c.establishment_year, c.management_type as management,
                    c.university, c.total_courses, c.total_seats
                FROM comprehensive_colleges c
                WHERE 1=1
            `;
            
            let params = [];
            
            // Add course type filter
            if (queryParts.courseType) {
                if (queryParts.courseType === 'dnb') {
                    collegeSql += ` AND LOWER(c.college_type) = 'dnb'`;
                } else if (['mbbs', 'md', 'ms'].includes(queryParts.courseType)) {
                    collegeSql += ` AND LOWER(c.college_type) = 'medical'`;
                } else if (['bds', 'mds'].includes(queryParts.courseType)) {
                    collegeSql += ` AND LOWER(c.college_type) = 'dental'`;
                }
            }
            
            // Add location filter
            if (queryParts.location) {
                collegeSql += ` AND (LOWER(c.state) LIKE ? OR LOWER(c.city) LIKE ?)`;
                params.push(`%${queryParts.location}%`, `%${queryParts.location}%`);
            }
            
            // Add stream filter from filters parameter
            if (filters.stream) {
                collegeSql += ` AND LOWER(c.college_type) = ?`;
                params.push(filters.stream.toLowerCase());
            }
            
            collegeSql += ` ORDER BY c.college_name LIMIT ?`;
            params.push(effectiveLimit);
            
            const colleges = await this.runSelect(this.collegesDb, collegeSql, params);
            console.log(`🔍 Found ${colleges.length} unique colleges`);
            
            // Now get courses for each college
            const results = [];
            for (const college of colleges) {
                // Get courses for this college
                const coursesSql = `
                    SELECT 
                        co.course_name, co.course_type, co.total_seats as course_seats,
                        co.quota_details, co.cutoff_ranks, co.fees_structure
                    FROM comprehensive_courses co
                    WHERE co.college_id = ?
                    ORDER BY co.course_name
                `;
                
                const courses = await this.runSelect(this.collegesDb, coursesSql, [college.id]);
                
                // Create a result for each course, or one result if no courses
                if (courses.length > 0) {
                    for (const course of courses) {
                        results.push({
                            ...college,
                            course_name: course.course_name,
                            course_category: course.course_type,
                            course_seats: course.course_seats,
                            quota_details: course.quota_details,
                            cutoff_ranks: course.cutoff_ranks,
                            fees_structure: course.fees_structure
                        });
                    }
                } else {
                    // If no courses found, create a default result
                    results.push({
                        ...college,
                        course_name: college.type,
                        course_category: college.type,
                        course_seats: college.total_seats,
                        quota_details: '{}',
                        cutoff_ranks: '{}',
                        fees_structure: '{}'
                    });
                }
            }
            
            console.log(`🔍 Total results after adding courses: ${results.length}`);
            
            return results.map(result => ({
                ...result,
                searchScore: this.calculateSimpleScore(result, queryParts.courseType || ''),
                searchStrategy: 'compound_search'
            }));
            
        } catch (error) {
            console.error('Search with query parts error:', error);
            return [];
        }
    }

    // 🏫 Direct college search - most reliable method
    async searchCollegesDirect(query, filters) {
        try {
            // Smart limit adjustment for broad searches
            let effectiveLimit = filters.limit || 100;
            
            // For broad searches (just course type or stream), increase the limit
            if (!filters.state && !filters.city) {
                effectiveLimit = Math.max(effectiveLimit, 500); // Allow up to 500 for broad searches
            }
            
            // For very broad searches (just "DNB colleges", "MBBS colleges"), use even higher limit
            if (!filters.state && !filters.city) {
                effectiveLimit = Math.max(effectiveLimit, 1000); // Allow up to 1000 for very broad searches
            }
            
            // Special case: DNB searches should always get high limits due to large dataset
            if (filters.stream === 'dnb') {
                effectiveLimit = Math.max(effectiveLimit, 1250);
            }
            
            console.log(`🔍 Using effective limit: ${effectiveLimit} for direct search`);
            
            // First, get unique colleges without JOIN
            let collegeSql = `
                SELECT DISTINCT
                    c.id, c.college_name as name, c.college_type as type,
                    c.state, c.city, c.establishment_year, c.management_type as management,
                    c.university, c.total_courses, c.total_seats
                FROM comprehensive_colleges c
                WHERE (
                    LOWER(c.college_name) LIKE ? OR 
                    LOWER(c.state) LIKE ? OR 
                    LOWER(c.city) LIKE ?
                )
            `;
            
            let params = [`%${query}%`, `%${query}%`, `%${query}%`];
            
            // Add stream filter if specified
            if (filters.stream) {
                collegeSql += ` AND LOWER(c.college_type) = ?`;
                params.push(filters.stream.toLowerCase());
            }
            
            // Add state filter if specified
            if (filters.state) {
                collegeSql += ` AND LOWER(c.state) LIKE ?`;
                params.push(`%${filters.state.toLowerCase()}%`);
            }
            
            collegeSql += ` ORDER BY c.college_name LIMIT ?`;
            params.push(effectiveLimit);
            
            const colleges = await this.runSelect(this.collegesDb, collegeSql, params);
            console.log(`🔍 Found ${colleges.length} unique colleges in direct search`);
            
            // Now get courses for each college
            const results = [];
            for (const college of colleges) {
                // Get courses for this college
                const coursesSql = `
                    SELECT 
                        co.course_name, co.course_type, co.total_seats as course_seats,
                        co.quota_details, co.cutoff_ranks, co.fees_structure
                    FROM comprehensive_courses co
                    WHERE co.college_id = ?
                    ORDER BY co.course_name
                `;
                
                const courses = await this.runSelect(this.collegesDb, coursesSql, [college.id]);
                
                // Create a result for each course, or one result if no courses
                if (courses.length > 0) {
                    for (const course of courses) {
                        results.push({
                            ...college,
                            course_name: course.course_name,
                            course_category: course.course_type,
                            course_seats: course.course_seats,
                            quota_details: course.quota_details,
                            cutoff_ranks: course.cutoff_ranks,
                            fees_structure: course.fees_structure
                        });
                    }
                } else {
                    // If no courses found, create a default result
                    results.push({
                        ...college,
                        course_name: college.type,
                        course_category: college.type,
                        course_seats: college.total_seats,
                        quota_details: '{}',
                        cutoff_ranks: '{}',
                        fees_structure: '{}'
                    });
                }
            }
            
            console.log(`🔍 Total results after adding courses: ${results.length}`);
            
            return results.map(result => ({
                ...result,
                searchScore: this.calculateSimpleScore(result, query),
                searchStrategy: 'direct_college_search'
            }));
            
        } catch (error) {
            console.error('Direct college search error:', error);
            return [];
        }
    }

    // 📚 Course-based search
    async searchByCourse(query, filters) {
        try {
            // Check if query contains course keywords
            const courseKeywords = ['mbbs', 'md', 'ms', 'bds', 'dnb', 'medical', 'dental'];
            const hasCourseKeyword = courseKeywords.some(keyword => query.includes(keyword));
            
            if (!hasCourseKeyword) return [];
            
            // Smart limit adjustment for broad searches
            let effectiveLimit = filters.limit || 100;
            
            // For broad searches (just course type or stream), increase the limit
            if (!filters.state && !filters.city) {
                effectiveLimit = Math.max(effectiveLimit, 500); // Allow up to 500 for broad searches
            }
            
            // For very broad searches (just "DNB colleges", "MBBS colleges"), use even higher limit
            if (!filters.state && !filters.city && !filters.stream) {
                effectiveLimit = Math.max(effectiveLimit, 1000); // Allow up to 1000 for very broad searches
            }
            
            // Special case: DNB searches should always get high limits due to large dataset
            if (filters.stream === 'dnb') {
                effectiveLimit = Math.max(effectiveLimit, 1250);
            }
            
            console.log(`🔍 Using effective limit: ${effectiveLimit} for course search`);
            
            // First, get unique colleges without JOIN
            let collegeSql = `
                SELECT DISTINCT
                    c.id, c.college_name as name, c.college_type as type,
                    c.state, c.city, c.establishment_year, c.management_type as management,
                    c.university, c.total_courses, c.total_seats
                FROM comprehensive_colleges c
                WHERE (
                    LOWER(c.college_name) LIKE ? OR 
                    LOWER(c.state) LIKE ? OR 
                    LOWER(c.city) LIKE ?
                )
            `;
            
            let params = [`%${query}%`, `%${query}%`, `%${query}%`];
            
            // Add stream filter
            if (filters.stream) {
                collegeSql += ` AND LOWER(c.college_type) = ?`;
                params.push(filters.stream.toLowerCase());
            }
            
            collegeSql += ` ORDER BY c.college_name LIMIT ?`;
            params.push(effectiveLimit);
            
            const colleges = await this.runSelect(this.collegesDb, collegeSql, params);
            console.log(`🔍 Found ${colleges.length} unique colleges in course search`);
            
            // Now get courses for each college
            const results = [];
            for (const college of colleges) {
                // Get courses for this college
                const coursesSql = `
                    SELECT 
                        co.course_name, co.course_type, co.total_seats as course_seats,
                        co.quota_details, co.cutoff_ranks, co.fees_structure
                    FROM comprehensive_courses co
                    WHERE co.college_id = ?
                    ORDER BY co.course_name
                `;
                
                const courses = await this.runSelect(this.collegesDb, coursesSql, [college.id]);
                
                // Create a result for each course, or one result if no courses
                if (courses.length > 0) {
                    for (const course of courses) {
                        results.push({
                            ...college,
                            course_name: course.course_name,
                            course_category: course.course_type,
                            course_seats: course.course_seats,
                            quota_details: course.quota_details,
                            cutoff_ranks: course.cutoff_ranks,
                            fees_structure: course.fees_structure
                        });
                    }
                } else {
                    // If no courses found, create a default result
                    results.push({
                        ...college,
                        course_name: college.type,
                        course_category: college.type,
                        course_seats: college.total_seats,
                        quota_details: '{}',
                        cutoff_ranks: '{}',
                        fees_structure: '{}'
                    });
                }
            }
            
            console.log(`🔍 Total results after adding courses: ${results.length}`);
            
            return results.map(result => ({
                ...result,
                searchScore: this.calculateSimpleScore(result, query),
                searchStrategy: 'course_based'
            }));
            
        } catch (error) {
            console.error('Course-based search error:', error);
            return [];
        }
    }

    // 🌍 Location-based search
    async searchByLocation(query, filters) {
        try {
            // Smart limit adjustment for broad searches
            let effectiveLimit = filters.limit || 100;
            
            // For broad searches (just location), increase the limit
            if (!filters.stream) {
                effectiveLimit = Math.max(effectiveLimit, 500); // Allow up to 500 for broad location searches
            }
            
            // For very broad searches (just state name), use even higher limit
            if (!filters.stream && !filters.city) {
                effectiveLimit = Math.max(effectiveLimit, 1000); // Allow up to 1000 for very broad location searches
            }
            
            // Special case: DNB searches should always get high limits due to large dataset
            if (filters.stream === 'dnb') {
                effectiveLimit = Math.max(effectiveLimit, 1250);
            }
            
            console.log(`🔍 Using effective limit: ${effectiveLimit} for location search`);
            
            // First, get unique colleges without JOIN
            let collegeSql = `
                SELECT DISTINCT
                    c.id, c.college_name as name, c.college_type as type,
                    c.state, c.city, c.establishment_year, c.management_type as management,
                    c.university, c.total_courses, c.total_seats
                FROM comprehensive_colleges c
                WHERE (
                    LOWER(c.state) LIKE ? OR 
                    LOWER(c.city) LIKE ?
                )
            `;
            
            let params = [`%${query}%`, `%${query}%`];
            
            // Add stream filter
            if (filters.stream) {
                collegeSql += ` AND LOWER(c.college_type) = ?`;
                params.push(filters.stream.toLowerCase());
            }
            
            collegeSql += ` ORDER BY c.college_name LIMIT ?`;
            params.push(effectiveLimit);
            
            const colleges = await this.runSelect(this.collegesDb, collegeSql, params);
            console.log(`🔍 Found ${colleges.length} unique colleges in location search`);
            
            // Now get courses for each college
            const results = [];
            for (const college of colleges) {
                // Get courses for this college
                const coursesSql = `
                    SELECT 
                        co.course_name, co.course_type, co.total_seats as course_seats,
                        co.quota_details, co.cutoff_ranks, co.fees_structure
                    FROM comprehensive_courses co
                    WHERE co.college_id = ?
                    ORDER BY co.course_name
                `;
                
                const courses = await this.runSelect(this.collegesDb, coursesSql, [college.id]);
                
                // Create a result for each course, or one result if no courses
                if (courses.length > 0) {
                    for (const course of courses) {
                        results.push({
                            ...college,
                            course_name: course.course_name,
                            course_category: course.course_type,
                            course_seats: course.course_seats,
                            quota_details: course.quota_details,
                            cutoff_ranks: course.cutoff_ranks,
                            fees_structure: course.fees_structure
                        });
                    }
                } else {
                    // If no courses found, create a default result
                    results.push({
                        ...college,
                        course_name: college.type,
                        course_category: college.type,
                        course_seats: college.total_seats,
                        quota_details: '{}',
                        cutoff_ranks: '{}',
                        fees_structure: '{}'
                    });
                }
            }
            
            console.log(`🔍 Total results after adding courses: ${results.length}`);
            
            return results.map(result => ({
                ...result,
                searchScore: this.calculateSimpleScore(result, query),
                searchStrategy: 'location_based'
            }));
            
        } catch (error) {
            console.error('Location-based search error:', error);
            return [];
        }
    }

    // 🎯 Simple scoring algorithm
    calculateSimpleScore(result, query) {
        let score = 0;
        const normalizedQuery = query.toLowerCase();
        
        // College name match (highest priority)
        if (result.name && result.name.toLowerCase().includes(normalizedQuery)) {
            score += 100;
        }
        
        // State match
        if (result.state && result.state.toLowerCase().includes(normalizedQuery)) {
            score += 50;
        }
        
        // City match
        if (result.city && result.city.toLowerCase().includes(normalizedQuery)) {
            score += 30;
        }
        
        // Course match
        if (result.course_name && result.course_name.toLowerCase().includes(normalizedQuery)) {
            score += 40;
        }
        
        return score;
    }

    // 🔧 Run INSERT/UPDATE/DELETE operations
    async runInsert(db, sql, params = []) {
        console.log(`🔧 Running INSERT/UPDATE/DELETE: ${sql.substring(0, 50)}...`);
        console.log(`🔧 Parameters:`, params);
        
        return new Promise((resolve, reject) => {
            db.run(sql, params, function(err) {
                if (err) {
                    console.error(`❌ Database operation failed:`, err);
                    reject(err);
                } else {
                    console.log(`✅ Database operation successful: lastID=${this.lastID}, changes=${this.changes}`);
                    resolve({ lastID: this.lastID, changes: this.changes });
                }
            });
        });
    }

    removeDuplicateResults(results) {
        const seen = new Set();
        const uniqueResults = [];
        
        for (const result of results) {
            const key = `${result.id}_${result.course}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueResults.push(result);
            }
        }
        
        return uniqueResults;
    }

    // 🔧 Group comprehensive results by college
    groupComprehensiveResultsByCollege(results) {
        const grouped = {};
        
        results.forEach(result => {
            const collegeName = result.name || 'Unknown College';
            const state = result.state || 'Unknown State';
            const collegeType = result.type || 'unknown';
            
            const key = `${collegeName}_${state}_${collegeType}`;
            
            if (!grouped[key]) {
                grouped[key] = {
                    college_name: collegeName,
                    state: state,
                    city: result.city || '',
                    college_type: collegeType,
                    establishment_year: result.establishment_year || 0,
                    management_type: result.management || '',
                    university: result.university || '',
                    total_courses: result.total_courses || 0,
                    total_seats: result.total_seats || 0,
                    courses: [],
                    search_score: result.searchScore || 0
                };
            }
            
            // Add course information - include all real courses
            if (result.course_name && 
                result.course_name !== 'College' && 
                result.course_name !== 'Location Match' &&
                result.course_name !== 'Compound Search' &&
                result.course_name !== result.type) { // Don't add if course_name is same as college type
                
                const courseInfo = {
                    course_name: result.course_name,
                    course_type: result.course_category || 'unknown',
                    seats: result.course_seats || 0,
                    quota_details: result.quota_details || '',
                    cutoff_ranks: result.cutoff_ranks || '',
                    fees_structure: result.fees_structure || ''
                };
                
                grouped[key].courses.push(courseInfo);
            }
        });
        
        return Object.values(grouped);
    }
}

module.exports = SmartSearchEngine;
