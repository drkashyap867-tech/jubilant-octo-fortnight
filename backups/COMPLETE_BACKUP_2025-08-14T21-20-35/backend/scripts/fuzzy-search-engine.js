#!/usr/bin/env node

/**
 * 🔍 Fuzzy Search Engine for Medical College Database
 * Advanced search, matching, and correction capabilities
 * Integrates with typo correction and version control systems
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const IntelligentTypoCorrector = require('./intelligent-typo-corrector');

class FuzzySearchEngine {
  constructor() {
    this.importsPath = path.join(__dirname, '../data/imports');
    this.processedPath = path.join(__dirname, '../data/processed');
    this.searchIndexPath = path.join(__dirname, '../data/search-index');
    
    this.typoCorrector = new IntelligentTypoCorrector();
    this.searchIndex = {};
    this.collegeDatabase = {};
    
    this.ensureDirectories();
    this.initializeSearchEngine();
  }

  /**
   * Ensure all necessary directories exist
   */
  ensureDirectories() {
    [this.searchIndexPath].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Initialize the search engine
   */
  initializeSearchEngine() {
    console.log('🔍 Initializing Fuzzy Search Engine...');
    this.loadCollegeDatabase();
    this.buildSearchIndex();
    console.log('✅ Fuzzy Search Engine initialized successfully!');
  }

  /**
   * Load college database from import files
   */
  loadCollegeDatabase() {
    console.log('📚 Loading College Database...');
    
    const database = {
      medical: {},
      dental: {},
      dnb: {},
      metadata: {
        totalColleges: 0,
        totalCourses: 0,
        totalSeats: 0,
        lastUpdated: new Date().toISOString()
      }
    };

    // Load medical colleges
    const medicalPath = path.join(this.importsPath, 'medical');
    if (fs.existsSync(medicalPath)) {
      const medicalFiles = fs.readdirSync(medicalPath).filter(f => f.endsWith('.xlsx'));
      if (medicalFiles.length > 0) {
        const medicalData = this.loadExcelData(path.join(medicalPath, medicalFiles[0]));
        database.medical = this.processCollegeData(medicalData, 'medical');
        console.log(`🏥 Loaded ${Object.keys(database.medical).length} medical colleges`);
      }
    }

    // Load dental colleges
    const dentalPath = path.join(__dirname, '../data/imports/dental');
    if (fs.existsSync(dentalPath)) {
      const dentalFiles = fs.readdirSync(dentalPath).filter(f => f.endsWith('.xlsx'));
      if (dentalFiles.length > 0) {
        const dentalData = this.loadExcelData(path.join(dentalPath, dentalFiles[0]));
        database.dental = this.processCollegeData(dentalData, 'dental');
        console.log(`🦷 Loaded ${Object.keys(database.dental).length} dental colleges`);
      }
    }

    // Load DNB hospitals
    const dnbPath = path.join(__dirname, '../data/imports/dnb');
    if (fs.existsSync(dnbPath)) {
      const dnbFiles = fs.readdirSync(dnbPath).filter(f => f.endsWith('.xlsx'));
      if (dnbFiles.length > 0) {
        const dnbData = this.loadExcelData(path.join(dnbPath, dnbFiles[0]));
        database.dnb = this.processCollegeData(dnbData, 'dnb');
        console.log(`🏥 Loaded ${Object.keys(dnbData).length} DNB hospitals`);
      }
    }

    // Calculate metadata
    database.metadata.totalColleges = Object.keys(database.medical).length + 
                                    Object.keys(database.dental).length + 
                                    Object.keys(database.dnb).length;
    
    this.collegeDatabase = database;
    this.saveCollegeDatabase();
    
    console.log(`📊 College Database loaded: ${database.metadata.totalColleges} total colleges`);
  }

  /**
   * Load Excel data from file
   */
  loadExcelData(filePath) {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetNames = workbook.SheetNames;
      const worksheet = workbook.Sheets[sheetNames[0]];
      
      // Convert to JSON with headers
      const rawData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',
        blankrows: false
      });

      if (rawData.length < 2) {
        throw new Error('Insufficient data in Excel file');
      }

      const headers = rawData[0];
      const dataRows = rawData.slice(1);
      
      return { headers, dataRows };
    } catch (error) {
      console.error(`Error loading Excel file ${filePath}:`, error.message);
      return { headers: [], dataRows: [] };
    }
  }

  /**
   * Process college data from Excel
   */
  processCollegeData(excelData, type) {
    const colleges = {};
    const { headers, dataRows } = excelData;
    
    if (headers.length === 0 || dataRows.length === 0) {
      return colleges;
    }

    // Analyze headers to find key columns
    const columnMapping = this.analyzeCollegeHeaders(headers);
    
    dataRows.forEach((row, rowIndex) => {
      try {
        const collegeData = this.extractCollegeData(row, columnMapping, type);
        if (collegeData.name) {
          const collegeId = this.generateCollegeId(collegeData.name, type);
          colleges[collegeId] = {
            ...collegeData,
            id: collegeId,
            type: type,
            rowIndex: rowIndex + 2,
            searchableText: this.generateSearchableText(collegeData)
          };
        }
      } catch (error) {
        console.warn(`⚠️  Skipping row ${rowIndex + 2}: ${error.message}`);
      }
    });
    
    return colleges;
  }

  /**
   * Analyze Excel headers for college data
   */
  analyzeCollegeHeaders(headers) {
    const mapping = {
      name: null,
      city: null,
      state: null,
      course: null,
      seats: null,
      fees: null,
      type: null,
      address: null,
      phone: null,
      email: null,
      website: null
    };

    headers.forEach((header, index) => {
      const cleanHeader = header.toString().toLowerCase().trim();
      
      if (cleanHeader.includes('name') || cleanHeader.includes('college') || cleanHeader.includes('institute')) {
        mapping.name = index;
      } else if (cleanHeader.includes('city') || cleanHeader.includes('location')) {
        mapping.city = index;
      } else if (cleanHeader.includes('state')) {
        mapping.state = index;
      } else if (cleanHeader.includes('course') || cleanHeader.includes('program')) {
        mapping.course = index;
      } else if (cleanHeader.includes('seat') || cleanHeader.includes('capacity')) {
        mapping.seats = index;
      } else if (cleanHeader.includes('fee') || cleanHeader.includes('cost')) {
        mapping.fees = index;
      } else if (cleanHeader.includes('type') || cleanHeader.includes('category')) {
        mapping.type = index;
      } else if (cleanHeader.includes('address')) {
        mapping.address = index;
      } else if (cleanHeader.includes('phone') || cleanHeader.includes('contact')) {
        mapping.phone = index;
      } else if (cleanHeader.includes('email')) {
        mapping.email = index;
      } else if (cleanHeader.includes('website') || cleanHeader.includes('url')) {
        mapping.website = index;
      }
    });

    console.log(`🔍 Column mapping for college data:`, mapping);
    return mapping;
  }

  /**
   * Extract college data from row
   */
  extractCollegeData(row, columnMapping, type) {
    const data = {};
    
    Object.entries(columnMapping).forEach(([key, index]) => {
      if (index !== null && row[index] !== undefined) {
        data[key] = row[index].toString().trim();
      }
    });
    
    // Set default values for missing fields
    if (!data.type) data.type = type;
    if (!data.seats) data.seats = '0';
    if (!data.fees) data.fees = 'N/A';
    
    return data;
  }

  /**
   * Generate unique college ID
   */
  generateCollegeId(name, type) {
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const timestamp = Date.now().toString(36);
    return `${type}_${cleanName}_${timestamp}`;
  }

  /**
   * Generate searchable text for college
   */
  generateSearchableText(collegeData) {
    const searchableFields = [
      collegeData.name,
      collegeData.city,
      collegeData.state,
      collegeData.course,
      collegeData.type,
      collegeData.address
    ].filter(Boolean);
    
    return searchableFields.join(' ').toLowerCase();
  }

  /**
   * Save college database to file
   */
  saveCollegeDatabase() {
    const dbPath = path.join(this.searchIndexPath, 'college-database.json');
    fs.writeFileSync(dbPath, JSON.stringify(this.collegeDatabase, null, 2));
    console.log(`💾 College database saved to: ${dbPath}`);
  }

  /**
   * Build search index for fast fuzzy searching
   */
  buildSearchIndex() {
    console.log('🔍 Building search index...');
    
    this.searchIndex = {
      colleges: {},
      courses: {},
      cities: {},
      states: {},
      keywords: {},
      lastBuilt: new Date().toISOString()
    };

    // Index all colleges
    Object.values(this.collegeDatabase).forEach(category => {
      if (typeof category === 'object' && category !== null) {
        Object.values(category).forEach(college => {
          if (college && typeof college === 'object' && college.id) {
            this.indexCollege(college);
          }
        });
      }
    });

    this.saveSearchIndex();
    console.log(`✅ Search index built with ${Object.keys(this.searchIndex.colleges).length} colleges indexed`);
  }

  /**
   * Index a single college
   */
  indexCollege(college) {
    const { id, name, city, state, course, type, searchableText } = college;
    
    // Index by college name
    this.searchIndex.colleges[id] = {
      id,
      name,
      city,
      state,
      course,
      type,
      searchableText
    };

    // Index by course
    if (course) {
      if (!this.searchIndex.courses[course]) {
        this.searchIndex.courses[course] = [];
      }
      this.searchIndex.courses[course].push(id);
    }

    // Index by city
    if (city) {
      if (!this.searchIndex.cities[city]) {
        this.searchIndex.cities[city] = [];
      }
      this.searchIndex.cities[city].push(id);
    }

    // Index by state
    if (state) {
      if (!this.searchIndex.states[state]) {
        this.searchIndex.states[state] = [];
      }
      this.searchIndex.states[state].push(id);
    }

    // Index by keywords
    const keywords = this.extractKeywords(searchableText);
    keywords.forEach(keyword => {
      if (!this.searchIndex.keywords[keyword]) {
        this.searchIndex.keywords[keyword] = [];
      }
      if (!this.searchIndex.keywords[keyword].includes(id)) {
        this.searchIndex.keywords[keyword].push(id);
      }
    });
  }

  /**
   * Extract keywords from searchable text
   */
  extractKeywords(text) {
    const words = text.split(/\s+/);
    const keywords = [];
    
    words.forEach(word => {
      if (word.length > 2) { // Only meaningful words
        const cleanWord = word.replace(/[^a-z0-9]/g, '');
        if (cleanWord.length > 2) {
          keywords.push(cleanWord);
          
          // Add partial matches for fuzzy search
          for (let i = 3; i <= cleanWord.length; i++) {
            keywords.push(cleanWord.substring(0, i));
          }
        }
      }
    });
    
    return [...new Set(keywords)]; // Remove duplicates
  }

  /**
   * Save search index to file
   */
  saveSearchIndex() {
    const indexPath = path.join(this.searchIndexPath, 'search-index.json');
    fs.writeFileSync(indexPath, JSON.stringify(this.searchIndex, null, 2));
  }

  /**
   * Perform fuzzy search across college database
   */
  async fuzzySearch(query, options = {}) {
    const {
      type = 'all',
      city = null,
      state = null,
      course = null,
      limit = 50,
      threshold = 0.6
    } = options;

    console.log(`🔍 Performing fuzzy search for: "${query}"`);
    
    const searchResults = [];
    const queryLower = query.toLowerCase();
    
    // Get relevant colleges based on filters
    let collegesToSearch = [];
    
    if (type === 'all') {
      Object.values(this.collegeDatabase).forEach(category => {
        if (typeof category === 'object' && category !== null) {
          collegesToSearch.push(...Object.values(category));
        }
      });
    } else if (this.collegeDatabase[type]) {
      collegesToSearch = Object.values(this.collegeDatabase[type]);
    }

    // Apply additional filters
    if (city) {
      collegesToSearch = collegesToSearch.filter(college => 
        college.city && college.city.toLowerCase().includes(city.toLowerCase())
      );
    }
    
    if (state) {
      collegesToSearch = collegesToSearch.filter(college => 
        college.state && college.state.toLowerCase().includes(state.toLowerCase())
      );
    }
    
    if (course) {
      collegesToSearch = collegesToSearch.filter(college => 
        college.course && college.course.toLowerCase().includes(course.toLowerCase())
      );
    }

    // Perform fuzzy search
    collegesToSearch.forEach(college => {
      if (college && college.searchableText) {
        const similarity = this.calculateSimilarity(queryLower, college.searchableText);
        
        if (similarity >= threshold) {
          searchResults.push({
            college,
            similarity,
            score: this.calculateSearchScore(queryLower, college, similarity)
          });
        }
      }
    });

    // Sort by relevance score
    searchResults.sort((a, b) => b.score - a.score);
    
    // Apply limit
    const limitedResults = searchResults.slice(0, limit);
    
    console.log(`✅ Found ${limitedResults.length} results for "${query}"`);
    
    return {
      query,
      results: limitedResults,
      totalFound: searchResults.length,
      filters: { type, city, state, course },
      searchTime: Date.now()
    };
  }

  /**
   * Calculate similarity between query and text
   */
  calculateSimilarity(query, text) {
    if (query === text) return 1.0;
    
    const queryWords = query.split(/\s+/);
    const textWords = text.split(/\s+/);
    
    let totalSimilarity = 0;
    
    queryWords.forEach(queryWord => {
      let bestWordSimilarity = 0;
      
      textWords.forEach(textWord => {
        const wordSimilarity = this.calculateWordSimilarity(queryWord, textWord);
        if (wordSimilarity > bestWordSimilarity) {
          bestWordSimilarity = wordSimilarity;
        }
      });
      
      totalSimilarity += bestWordSimilarity;
    });
    
    return totalSimilarity / queryWords.length;
  }

  /**
   * Calculate similarity between two words
   */
  calculateWordSimilarity(word1, word2) {
    if (word1 === word2) return 1.0;
    
    const maxLength = Math.max(word1.length, word2.length);
    let matches = 0;
    
    for (let i = 0; i < Math.min(word1.length, word2.length); i++) {
      if (word1[i] === word2[i]) {
        matches++;
      }
    }
    
    // Add bonus for partial matches
    if (word1.includes(word2) || word2.includes(word1)) {
      matches += Math.min(word1.length, word2.length) * 0.5;
    }
    
    return matches / maxLength;
  }

  /**
   * Calculate search relevance score
   */
  calculateSearchScore(query, college, similarity) {
    let score = similarity * 100; // Base score from similarity
    
    // Boost score for exact matches
    if (college.name.toLowerCase().includes(query.toLowerCase())) {
      score += 50;
    }
    
    if (college.city && college.city.toLowerCase().includes(query.toLowerCase())) {
      score += 30;
    }
    
    if (college.course && college.course.toLowerCase().includes(query.toLowerCase())) {
      score += 25;
    }
    
    // Boost for recent or verified data
    if (college.rowIndex) {
      score += 10; // Small boost for having row index
    }
    
    return Math.min(100, score); // Cap at 100
  }

  /**
   * Search and suggest corrections for typos
   */
  async searchWithCorrections(query, options = {}) {
    console.log(`🔍🔧 Searching with typo corrections for: "${query}"`);
    
    // First, try to correct the query using typo correction
    const correctedQuery = await this.correctQuery(query);
    
    // Perform search with both original and corrected queries
    const originalResults = await this.fuzzySearch(query, options);
    const correctedResults = await this.fuzzySearch(correctedQuery, options);
    
    // Merge and deduplicate results
    const mergedResults = this.mergeSearchResults(originalResults, correctedResults);
    
    return {
      originalQuery: query,
      correctedQuery: correctedQuery,
      results: mergedResults.results,
      totalFound: mergedResults.totalFound,
      corrections: {
        original: query,
        corrected: correctedQuery,
        wasCorrected: query !== correctedQuery
      },
      searchTime: Date.now()
    };
  }

  /**
   * Correct query using typo correction system
   */
  async correctQuery(query) {
    try {
      // Use the typo corrector to fix the query
      const correction = this.typoCorrector.correctSingleValue(query, 'search_query', 'general');
      
      if (correction.corrected !== query && correction.confidence > 0.7) {
        console.log(`🔧 Query corrected: "${query}" → "${correction.corrected}" (confidence: ${correction.confidence})`);
        return correction.corrected;
      }
      
      return query;
    } catch (error) {
      console.warn('Typo correction failed, using original query:', error.message);
      return query;
    }
  }

  /**
   * Merge search results from multiple queries
   */
  mergeSearchResults(originalResults, correctedResults) {
    const mergedColleges = new Map();
    
    // Add original results
    originalResults.results.forEach(result => {
      mergedColleges.set(result.college.id, {
        ...result,
        source: 'original'
      });
    });
    
    // Add corrected results, keeping the higher score
    correctedResults.results.forEach(result => {
      const existing = mergedColleges.get(result.college.id);
      
      if (!existing || result.score > existing.score) {
        mergedColleges.set(result.college.id, {
          ...result,
          source: 'corrected'
        });
      }
    });
    
    // Convert back to array and sort by score
    const mergedResults = Array.from(mergedColleges.values())
      .sort((a, b) => b.score - a.score);
    
    return {
      results: mergedResults,
      totalFound: mergedResults.length
    };
  }

  /**
   * Get college details by ID
   */
  getCollegeById(collegeId) {
    // Search across all categories
    for (const category of Object.values(this.collegeDatabase)) {
      if (typeof category === 'object' && category !== null) {
        if (category[collegeId]) {
          return category[collegeId];
        }
      }
    }
    return null;
  }

  /**
   * Get statistics about the college database
   */
  getDatabaseStats() {
    const stats = {
      totalColleges: 0,
      byType: {},
      byState: {},
      byCity: {},
      byCourse: {},
      lastUpdated: this.collegeDatabase.metadata?.lastUpdated || new Date().toISOString()
    };

    Object.entries(this.collegeDatabase).forEach(([type, colleges]) => {
      if (type !== 'metadata' && typeof colleges === 'object') {
        stats.byType[type] = Object.keys(colleges).length;
        stats.totalColleges += Object.keys(colleges).length;

        Object.values(colleges).forEach(college => {
          if (college && typeof college === 'object') {
            // Count by state
            if (college.state) {
              stats.byState[college.state] = (stats.byState[college.state] || 0) + 1;
            }

            // Count by city
            if (college.city) {
              stats.byCity[college.city] = (stats.byCity[college.city] || 0) + 1;
            }

            // Count by course
            if (college.course) {
              stats.byCourse[college.course] = (stats.byCourse[college.course] || 0) + 1;
            }
          }
        });
      }
    });

    return stats;
  }

  /**
   * Export search results to various formats
   */
  exportSearchResults(searchResults, format = 'json') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    switch (format.toLowerCase()) {
      case 'json':
        const jsonPath = path.join(this.searchIndexPath, `search-results-${timestamp}.json`);
        fs.writeFileSync(jsonPath, JSON.stringify(searchResults, null, 2));
        return jsonPath;
        
      case 'csv':
        const csvPath = path.join(this.searchIndexPath, `search-results-${timestamp}.csv`);
        const csvContent = this.convertToCSV(searchResults.results);
        fs.writeFileSync(csvPath, csvContent);
        return csvPath;
        
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Convert search results to CSV
   */
  convertToCSV(results) {
    if (results.length === 0) return '';
    
    const headers = ['Name', 'City', 'State', 'Course', 'Type', 'Seats', 'Similarity', 'Score'];
    const csvRows = [headers.join(',')];
    
    results.forEach(result => {
      const college = result.college;
      const row = [
        `"${college.name || ''}"`,
        `"${college.city || ''}"`,
        `"${college.state || ''}"`,
        `"${college.course || ''}"`,
        `"${college.type || ''}"`,
        `"${college.seats || ''}"`,
        result.similarity.toFixed(3),
        result.score.toFixed(1)
      ];
      csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
  }

  /**
   * Rebuild search index
   */
  async rebuildSearchIndex() {
    console.log('🔧 Rebuilding search index...');
    this.loadCollegeDatabase();
    this.buildSearchIndex();
    console.log('✅ Search index rebuilt successfully!');
  }
}

// CLI interface
async function main() {
  const searchEngine = new FuzzySearchEngine();
  const command = process.argv[2];
  
  switch (command) {
    case 'search':
      const query = process.argv[3];
      if (query) {
        const results = await searchEngine.fuzzySearch(query);
        console.log(`\n🔍 Search Results for "${query}":`);
        results.results.slice(0, 10).forEach((result, index) => {
          const college = result.college;
          console.log(`${index + 1}. ${college.name} (${college.city}, ${college.state})`);
          console.log(`   Course: ${college.course} | Seats: ${college.seats} | Score: ${result.score.toFixed(1)}`);
        });
      } else {
        console.error('Please specify search query');
      }
      break;
      
    case 'search-corrected':
      const searchQuery = process.argv[3];
      if (searchQuery) {
        const results = await searchEngine.searchWithCorrections(searchQuery);
        console.log(`\n🔍🔧 Search Results with Corrections:`);
        console.log(`Original: "${results.originalQuery}"`);
        console.log(`Corrected: "${results.correctedQuery}"`);
        console.log(`Results: ${results.totalFound} found`);
      } else {
        console.error('Please specify search query');
      }
      break;
      
    case 'stats':
      const stats = searchEngine.getDatabaseStats();
      console.log('\n📊 College Database Statistics:');
      console.log(`Total Colleges: ${stats.totalColleges}`);
      console.log('By Type:', stats.byType);
      console.log('By State:', stats.byState);
      break;
      
    case 'rebuild':
      await searchEngine.rebuildSearchIndex();
      break;
      
    default:
      console.log('🔍 Fuzzy Search Engine for College Database\n');
      console.log('Usage:');
      console.log('  node scripts/fuzzy-search-engine.js search <query>           - Search colleges');
      console.log('  node scripts/fuzzy-search-engine.js search-corrected <query> - Search with typo corrections');
      console.log('  node scripts/fuzzy-search-engine.js stats                    - Show database statistics');
      console.log('  node scripts/fuzzy-search-engine.js rebuild                  - Rebuild search index');
      break;
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = FuzzySearchEngine;
