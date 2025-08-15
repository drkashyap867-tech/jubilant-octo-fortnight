const express = require('express');
const path = require('path');
const cors = require('cors');
const SmartSearchEngine = require('./sqlite-search');
// const CutoffRanksSetup = require('./cutoff-ranks-setup');
const { EnhancedAPIEndpoints } = require('./enhanced-api-endpoints');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Smart Search Engine
const searchEngine = new SmartSearchEngine();

// Initialize Cutoff Ranks Database (temporarily disabled)
// let cutoffRanksDb = null;

// Initialize Enhanced API Endpoints
const enhancedAPI = new EnhancedAPIEndpoints();

// API Routes
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        message: 'College Database API is running!'
    });
});

app.get('/api/stats', async (req, res) => {
    try {
        const stats = await searchEngine.getStats();
        res.json(stats);
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Failed to get statistics' });
    }
});

app.get('/api/search', async (req, res) => {
    try {
        const { q: query, stream, course, state, limit = 50 } = req.query;
        
        console.log('🔍 Search request received:', { query, stream, course, state, limit });
        
        if (!query || query.trim().length === 0) {
            return res.status(400).json({
                error: 'Query parameter is required'
            });
        }

        const filters = { stream, course, state, limit: parseInt(limit) };
        console.log('🔍 Applying filters:', filters);
        
        const results = await searchEngine.search(query, filters);
        
        console.log('🔍 Search results count:', results.data ? results.data.length : 0);
        
        // Return in the format expected by the frontend
        res.json({
            data: results.data || [],
            total: results.total || 0,
            query: query,
            filters: filters,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ 
            error: 'Search failed', 
            details: error.message 
        });
    }
});

app.get('/api/colleges/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const college = await searchEngine.getCollegeById(parseInt(id));
        
        if (!college) {
            return res.status(404).json({ error: 'College not found' });
        }
        
        res.json(college);
    } catch (error) {
        console.error('Get college error:', error);
        res.status(500).json({ error: 'Failed to get college' });
    }
});

app.get('/api/colleges/type/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const { limit = 100 } = req.query;
        const colleges = await searchEngine.getCollegesByType(type, parseInt(limit));
        
        res.json({ data: colleges, total: colleges.length });
    } catch (error) {
        console.error('Get colleges by type error:', error);
        res.status(500).json({ error: 'Failed to get colleges' });
    }
});

app.get('/api/colleges/state/:state', async (req, res) => {
    try {
        const { state } = req.params;
        const { limit = 100 } = req.query;
        const colleges = await searchEngine.getCollegesByState(state, parseInt(limit));
        
        res.json({ data: colleges, total: colleges.length });
    } catch (error) {
        console.error('Get colleges by state error:', error);
        res.status(500).json({ error: 'Failed to get colleges' });
    }
});

// Enhanced search endpoint with result grouping
app.get('/api/search/enhanced', async (req, res) => {
    try {
        const { q: query, stream, courseType, state, city, limit = 50 } = req.query;
        
        console.log('🚀 Enhanced search request:', { query, stream, courseType, state, city, limit });
        
        if (!query || query.trim().length === 0) {
            return res.status(400).json({
                error: 'Query parameter is required'
            });
        }

        const filters = { 
            stream, 
            courseType, 
            state, 
            city, 
            limit: parseInt(limit) 
        };
        
        const results = await searchEngine.enhancedSearch(query, filters);
        
        console.log('🚀 Enhanced search results:', {
            total: results.total,
            groupedResults: results.totalGroups,
            query: query
        });
        
        res.json(results);
        
    } catch (error) {
        console.error('Enhanced search error:', error);
        res.status(500).json({ 
            error: 'Enhanced search failed', 
            details: error.message 
        });
    }
});

// Smart search endpoint for testing the enhanced search engine
app.get('/api/smart-search', async (req, res) => {
    try {
        const { q, type, state, limit = 20 } = req.query;
        
        if (!q) {
            return res.status(400).json({ error: 'Query parameter "q" is required' });
        }
        
        console.log(`🧠 Smart Search Request: "${q}" with filters:`, { type, state, limit });
        
        const results = await searchEngine.smartSearch(q, { type, state, limit: parseInt(limit) });
        
        // Add search analytics
        const searchAnalytics = {
            query: q,
            filters: { type, state },
            totalResults: results.total,
            searchVariations: results.searchVariations || [],
            strategyBreakdown: {
                exact: results.data.filter(r => r.searchStrategy === 'exact').length,
                fuzzy: results.data.filter(r => r.searchStrategy === 'fuzzy').length,
                semantic: results.data.filter(r => r.searchStrategy === 'semantic').length,
                abbreviation: results.data.filter(r => r.searchStrategy === 'abbreviation').length
            },
            scoreDistribution: {
                high: results.data.filter(r => r.searchScore >= 1000).length,
                medium: results.data.filter(r => r.searchScore >= 500 && r.searchScore < 1000).length,
                low: results.data.filter(r => r.searchScore < 500).length
            },
            topMatches: results.data.slice(0, 5).map(r => ({
                name: r.name,
                score: r.searchScore,
                strategy: r.searchStrategy,
                matchedVariation: r.matchedVariation
            }))
        };
        
        res.json({
            success: true,
            searchAnalytics,
            results: results.data,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Smart search error:', error);
        res.status(500).json({ 
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Get courses (filtered by stream or all)
app.get('/api/courses', async (req, res) => {
    try {
        const { stream } = req.query;
        let courses = [];
        
        if (stream) {
            // Get courses filtered by stream
            courses = await searchEngine.getCoursesByStream(stream);
        } else {
            // Get all courses
            courses = await searchEngine.getAllCourses();
        }
        
        res.json(courses);
    } catch (error) {
        console.error('Get courses error:', error);
        res.status(500).json({ error: 'Failed to get courses' });
    }
});

// Auto-complete suggestions
app.get('/api/autocomplete', async (req, res) => {
    try {
        const { q: query, stream, limit = 10 } = req.query;
        
        if (!query || query.trim().length === 0) {
            return res.json({ suggestions: [] });
        }
        
        const suggestions = await searchEngine.getAutoCompleteSuggestions(query, { stream, limit: parseInt(limit) });
        
        res.json({
            suggestions,
            query: query,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Auto-complete error:', error);
        res.status(500).json({ error: 'Failed to get suggestions' });
    }
});

// Search suggestions endpoint
app.get('/api/search/suggestions', async (req, res) => {
    try {
        const { q: query } = req.query;
        
        if (!query || query.trim().length < 2) {
            return res.json({
                success: true,
                data: []
            });
        }

        // Use the search engine to get suggestions
        const suggestions = await searchEngine.getSearchSuggestionsIntelligent(query, 10);
        
        res.json({
            success: true,
            data: suggestions
        });
        
    } catch (error) {
        console.error('Search suggestions error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get search suggestions',
            message: error.message
        });
    }
});

// Get all courses for a specific college
app.get('/api/colleges/:id/courses', async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 100 } = req.query;
        
        const results = await searchEngine.runSelect(`
            SELECT 
                co.id as course_id,
                co.course_name,
                co.seats,
                co.quota_details,
                co.cutoff_ranks,
                co.fees_structure,
                c.id as college_id,
                c.name as college_name,
                c.state,
                c.college_type,
                c.address,
                c.establishment_year,
                c.management,
                c.affiliation
            FROM colleges c
            LEFT JOIN courses co ON c.id = co.college_id
            WHERE c.id = ?
            ORDER BY co.course_name
            LIMIT ?
        `, [id, limit]);
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'College not found' });
        }
        
        // Group by college and organize courses
        const collegeInfo = {
            id: results[0].college_id,
            name: results[0].college_name,
            state: results[0].state,
            type: results[0].college_type,
            address: results[0].address,
            year_established: results[0].establishment_year,
            management_type: results[0].management,
            university: results[0].affiliation,
            total_courses: results.length,
            total_seats: results.reduce((sum, course) => sum + (course.seats || 0), 0),
            courses: results.map(course => ({
                id: course.course_id,
                name: course.course_name,
                seats: course.seats || 0,
                quota_details: course.quota_details ? JSON.parse(course.quota_details) : null,
                cutoff_ranks: course.cutoff_ranks ? JSON.parse(course.cutoff_ranks) : null,
                fees_structure: course.fees_structure ? JSON.parse(course.fees_structure) : null
            }))
        };
        
        res.json(collegeInfo);
        
    } catch (error) {
        console.error('Get college courses error:', error);
        res.status(500).json({ error: 'Failed to get college courses' });
    }
});

// ===== CUTOFF RANKS API ENDPOINTS =====

// Get cutoff ranks for a specific course at a college
app.get('/api/cutoff-ranks/:collegeId/:courseId', async (req, res) => {
    try {
        if (!cutoffRanksDb) {
            return res.status(503).json({ error: 'Cutoff ranks database not initialized' });
        }
        
        const { collegeId, courseId } = req.params;
        const { counsellingType, year } = req.query;
        
        const cutoffRanks = await cutoffRanksDb.getCutoffRanks(
            parseInt(collegeId), 
            parseInt(courseId), 
            counsellingType, 
            year ? parseInt(year) : null
        );
        
        res.json({
            college_id: parseInt(collegeId),
            course_id: parseInt(courseId),
            cutoff_ranks: cutoffRanks,
            total_records: cutoffRanks.length
        });
    } catch (error) {
        console.error('Get cutoff ranks error:', error);
        res.status(500).json({ error: 'Failed to get cutoff ranks' });
    }
});

// Search cutoff ranks with filters
app.get('/api/cutoff-ranks/search', async (req, res) => {
    try {
        if (!cutoffRanksDb) {
            return res.status(503).json({ error: 'Cutoff ranks database not initialized' });
        }
        
        const { q: searchTerm, counsellingType, year, quotaType, category } = req.query;
        
        const results = await cutoffRanksDb.searchCutoffRanks(searchTerm, {
            counsellingType,
            year: year ? parseInt(year) : null,
            quotaType,
            category
        });
        
        res.json({
            data: results,
            total: results.length,
            query: searchTerm,
            filters: { counsellingType, year, quotaType, category }
        });
    } catch (error) {
        console.error('Search cutoff ranks error:', error);
        res.status(500).json({ error: 'Failed to search cutoff ranks' });
    }
});

// Insert new cutoff rank data
app.post('/api/cutoff-ranks', async (req, res) => {
    try {
        if (!cutoffRanksDb) {
            return res.status(503).json({ error: 'Cutoff ranks database not initialized' });
        }
        
        const cutoffData = req.body;
        
        // Validate required fields
        const requiredFields = ['college_id', 'course_id', 'counselling_type', 'counselling_year', 
                              'round_number', 'round_name', 'quota_type', 'category', 'cutoff_rank', 'seats_available'];
        
        for (const field of requiredFields) {
            if (!cutoffData[field]) {
                return res.status(400).json({ error: `Missing required field: ${field}` });
            }
        }
        
        const result = await cutoffRanksDb.insertCutoffRank(cutoffData);
        
        res.status(201).json({
            message: 'Cutoff rank data inserted successfully',
            id: result.lastID,
            changes: result.changes
        });
    } catch (error) {
        console.error('Insert cutoff rank error:', error);
        res.status(500).json({ error: 'Failed to insert cutoff rank data' });
    }
});

// Get cutoff ranks statistics
app.get('/api/cutoff-ranks/stats', async (req, res) => {
    try {
        if (!cutoffRanksDb) {
            return res.status(503).json({ error: 'Cutoff ranks database not initialized' });
        }
        
        const stats = await cutoffRanksDb.runQueryAll(`
            SELECT 
                COUNT(*) as total_records,
                COUNT(DISTINCT college_id) as unique_colleges,
                COUNT(DISTINCT course_id) as unique_courses,
                COUNT(DISTINCT counselling_type) as counselling_types,
                COUNT(DISTINCT counselling_year) as years_covered,
                MIN(counselling_year) as earliest_year,
                MAX(counselling_year) as latest_year
            FROM cutoff_ranks
        `);
        
        res.json({
            statistics: stats[0],
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Get cutoff ranks stats error:', error);
        res.status(500).json({ error: 'Failed to get cutoff ranks statistics' });
    }
});

// ===== END CUTOFF RANKS API ENDPOINTS =====

// ===== ENHANCED DATABASE API ENDPOINTS =====

// Get Medical Seats with filters
app.get('/api/medical-seats', async (req, res) => {
    try {
        const filters = {
            state: req.query.state,
            college_type: req.query.college_type,
            course_name: req.query.course_name,
            quota: req.query.quota,
            limit: parseInt(req.query.limit) || 100
        };
        
        const results = await enhancedAPI.getMedicalSeats(filters);
        
        res.json({
            data: results,
            total: results.length,
            filters: filters,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Get medical seats error:', error);
        res.status(500).json({ error: 'Failed to get medical seats' });
    }
});

// Get Dental Seats with filters
app.get('/api/dental-seats', async (req, res) => {
    try {
        const filters = {
            state: req.query.state,
            college_type: req.query.college_type,
            course_name: req.query.course_name,
            quota: req.query.quota,
            limit: parseInt(req.query.limit) || 100
        };
        
        const results = await enhancedAPI.getDentalSeats(filters);
        
        res.json({
            data: results,
            total: results.length,
            filters: filters,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Get dental seats error:', error);
        res.status(500).json({ error: 'Failed to get dental seats' });
    }
});

// Get DNB Seats with filters
app.get('/api/dnb-seats', async (req, res) => {
    try {
        const filters = {
            state: req.query.state,
            college_type: req.query.college_type,
            course_name: req.query.course_name,
            quota: req.query.quota,
            limit: parseInt(req.query.limit) || 100
        };
        
        const results = await enhancedAPI.getDNBSeats(filters);
        
        res.json({
            data: results,
            total: results.length,
            filters: filters,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Get DNB seats error:', error);
        res.status(500).json({ error: 'Failed to get DNB seats' });
    }
});

// Get Counselling Data with filters
app.get('/api/counselling-data', async (req, res) => {
    try {
        const filters = {
            counselling_type: req.query.counselling_type,
            academic_year: req.query.academic_year,
            round_id: req.query.round_id,
            college_name: req.query.college_name,
            course_name: req.query.course_name,
            quota: req.query.quota,
            category: req.query.category,
            limit: parseInt(req.query.limit) || 100
        };
        
        const results = await enhancedAPI.getCounsellingData(filters);
        
        res.json({
            data: results,
            total: results.length,
            filters: filters,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Get counselling data error:', error);
        res.status(500).json({ error: 'Failed to get counselling data' });
    }
});

// Get Cutoff Ranks with enhanced filters
app.get('/api/cutoff-ranks-enhanced', async (req, res) => {
    try {
        const filters = {
            counselling_type_id: req.query.counselling_type_id ? parseInt(req.query.counselling_type_id) : null,
            academic_year: req.query.academic_year,
            round_id: req.query.round_id ? parseInt(req.query.round_id) : null,
            college_name: req.query.college_name,
            course_name: req.query.course_name,
            quota: req.query.quota,
            category: req.query.category,
            max_rank: req.query.max_rank ? parseInt(req.query.max_rank) : null,
            limit: parseInt(req.query.limit) || 100
        };
        
        const results = await enhancedAPI.getCutoffRanks(filters);
        
        res.json({
            data: results,
            total: results.length,
            filters: filters,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Get enhanced cutoff ranks error:', error);
        res.status(500).json({ error: 'Failed to get enhanced cutoff ranks' });
    }
});

// Comprehensive search across all databases
app.get('/api/comprehensive-search', async (req, res) => {
    try {
        const { q: searchTerm, ...filters } = req.query;
        
        if (!searchTerm || searchTerm.trim().length === 0) {
            return res.status(400).json({
                error: 'Search term "q" is required'
            });
        }
        
        const results = await enhancedAPI.comprehensiveSearch(searchTerm, filters);
        
        res.json({
            success: true,
            ...results
        });
        
    } catch (error) {
        console.error('Comprehensive search error:', error);
        res.status(500).json({ 
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Get comprehensive statistics
app.get('/api/comprehensive-stats', async (req, res) => {
    try {
        const stats = await enhancedAPI.getComprehensiveStats();
        
        res.json({
            success: true,
            ...stats
        });
        
    } catch (error) {
        console.error('Get comprehensive stats error:', error);
        res.status(500).json({ 
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// ===== END ENHANCED DATABASE API ENDPOINTS =====

// Get detailed information for a specific course at a college
app.get('/api/colleges/:collegeId/courses/:courseId', async (req, res) => {
    try {
        const { collegeId, courseId } = req.params;
        
        const results = await searchEngine.runSelect(`
            SELECT 
                c.id as college_id,
                c.name as college_name,
                c.state,
                c.college_type,
                c.address,
                c.establishment_year,
                c.management,
                c.affiliation,
                co.id as course_id,
                co.course_name,
                co.seats,
                co.quota_details,
                co.cutoff_ranks,
                co.fees_structure
            FROM colleges c
            JOIN courses co ON c.id = co.college_id
            WHERE c.id = ? AND co.id = ?
        `, [collegeId, courseId]);
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }
        
        const course = results[0];
        
        // Parse JSON fields
        const quotaDetails = course.quota_details ? JSON.parse(course.quota_details) : null;
        const oldCutoffRanks = course.cutoff_ranks ? JSON.parse(course.cutoff_ranks) : null;
        
        // Get cutoff ranks from dedicated database
        let newCutoffRanks = [];
        if (cutoffRanksDb) {
            try {
                newCutoffRanks = await cutoffRanksDb.getCutoffRanks(parseInt(collegeId), parseInt(courseId));
            } catch (error) {
                console.error('Error fetching cutoff ranks from dedicated DB:', error);
            }
        }
        
        // Organize quota and cutoff information by category
        const categoryBreakdown = organizeCategoryData(quotaDetails, oldCutoffRanks, newCutoffRanks);
        
        // Debug logging
        console.log('🔍 Server - quotaDetails:', quotaDetails);
        console.log('🔍 Server - oldCutoffRanks:', oldCutoffRanks);
        console.log('🔍 Server - newCutoffRanks:', newCutoffRanks);
        console.log('🔍 Server - categoryBreakdown:', categoryBreakdown);
        console.log('🔍 Server - categoryBreakdown length:', categoryBreakdown?.length);
        
        const courseInfo = {
            college: {
                id: course.college_id,
                name: course.college_name,
                state: course.state,
                type: course.college_type,
                address: course.address,
                year_established: course.establishment_year,
                management_type: course.management,
                university: course.affiliation
            },
            course: {
                id: course.course_id,
                name: course.course_name,
                seats: course.seats || 0
            },
            categoryBreakdown: categoryBreakdown
        };
        
        console.log('🔍 Server - Final courseInfo:', JSON.stringify(courseInfo, null, 2));
        res.json(courseInfo);
        
    } catch (error) {
        console.error('Get course details error:', error);
        res.status(500).json({ error: 'Failed to get course details' });
    }
    
    // Helper function to organize category data
    function organizeCategoryData(quotaDetails, oldCutoffRanks, newCutoffRanks) {
        console.log('🔍 organizeCategoryData called with:');
        console.log('  - quotaDetails:', quotaDetails);
        console.log('  - oldCutoffRanks:', oldCutoffRanks);
        console.log('  - newCutoffRanks:', newCutoffRanks);
        
        if (!quotaDetails && !oldCutoffRanks && (!newCutoffRanks || newCutoffRanks.length === 0)) {
            console.log('🔍 No data available, returning empty array');
            return [];
        }
        
        // Get all unique categories from old data
        const categories = new Set();
        if (quotaDetails) {
            Object.keys(quotaDetails).forEach(cat => categories.add(cat));
        }
        if (oldCutoffRanks) {
            Object.keys(oldCutoffRanks).forEach(cat => categories.add(cat));
        }
        
        // Add categories from new cutoff ranks data
        if (newCutoffRanks && newCutoffRanks.length > 0) {
            newCutoffRanks.forEach(record => {
                categories.add(record.category);
            });
        }
        
        console.log('🔍 Categories found:', Array.from(categories));
        
        // Organize data by category
        const result = Array.from(categories).map(category => {
            const quota = quotaDetails && quotaDetails[category] !== null ? quotaDetails[category] : null;
            const oldCutoff = oldCutoffRanks && oldCutoffRanks[category] !== null ? oldCutoffRanks[category] : null;
            
            // Get new cutoff ranks data for this category
            const newCutoffs = newCutoffRanks ? newCutoffRanks.filter(record => record.category === category) : [];
            
            const item = {
                category: category.toUpperCase(),
                quota: quota,
                old_cutoff_rank: oldCutoff,
                new_cutoff_ranks: newCutoffs.length > 0 ? newCutoffs : null,
                has_data: quota !== null || oldCutoff !== null || newCutoffs.length > 0
            };
            
            console.log(`🔍 Category ${category}:`, item);
            return item;
        }).filter(item => item.has_data);
        
        console.log('🔍 Final result:', result);
        return result;
    }
});

// 🚀 Comprehensive College Search Endpoint
app.get('/api/search/comprehensive', async (req, res) => {
    try {
        const { q: query, stream, courseType, state, city, limit = 50 } = req.query;

        console.log('🚀 Comprehensive search request:', { query, stream, courseType, state, city, limit });

        if (!query || query.trim().length === 0) {
            return res.status(400).json({
                error: 'Query parameter is required'
            });
        }

        const filters = {
            stream,
            courseType,
            state,
            city,
            limit: parseInt(limit)
        };

        const results = await searchEngine.enhancedComprehensiveSearch(query, filters);

        console.log('🚀 Comprehensive search results:', {
            total: results.total,
            groupedResults: results.totalGroups,
            query: query
        });

        res.json(results);

    } catch (error) {
        console.error('Comprehensive search error:', error);
        res.status(500).json({
            error: 'Comprehensive search failed',
            details: error.message
        });
    }
});

// 🏗️ Initialize Comprehensive College Database Endpoint
app.post('/api/admin/init-comprehensive-db', async (req, res) => {
    try {
        console.log('🏗️ Initializing comprehensive college database...');
        
        await searchEngine.initializeComprehensiveCollegeDB();
        
        res.json({
            success: true,
            message: 'Comprehensive college database initialized successfully',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Failed to initialize comprehensive college database:', error);
        res.status(500).json({
            error: 'Failed to initialize comprehensive college database',
            details: error.message
        });
    }
});

// ===== DROPDOWN DATA API ENDPOINTS =====

// Get all available streams
app.get('/api/dropdown/streams', async (req, res) => {
    try {
        const streams = await searchEngine.getAvailableStreams();
        res.json({
            success: true,
            data: streams
        });
    } catch (error) {
        console.error('Get streams error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get streams',
            message: error.message
        });
    }
});

// Get all available courses
app.get('/api/dropdown/courses', async (req, res) => {
    try {
        const { stream } = req.query;
        const courses = await searchEngine.getAvailableCourses(stream);
        res.json({
            success: true,
            data: courses
        });
    } catch (error) {
        console.error('Get courses error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get courses',
            message: error.message
        });
    }
});

// Get all available states
app.get('/api/dropdown/states', async (req, res) => {
    try {
        const states = await searchEngine.getAvailableStates();
        res.json({
            success: true,
            data: states
        });
    } catch (error) {
        console.error('Get states error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get states',
            message: error.message
        });
    }
});

// ===== END DROPDOWN DATA API ENDPOINTS =====

// Serve the main page for all other routes (SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, async () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    
    try {
        await searchEngine.initialize();
        console.log('✅ SQLite database initialized successfully');
        
        // Initialize Cutoff Ranks Database (temporarily disabled)
        // cutoffRanksDb = new CutoffRanksSetup();
        // const cutoffSuccess = await cutoffRanksDb.initialize();
        // if (cutoffSuccess) {
        //     console.log('✅ Cutoff Ranks Database initialized successfully');
        // } else {
        //     console.log('❌ Failed to initialize Cutoff Ranks Database');
        // }
    } catch (error) {
        console.error('❌ Failed to initialize database:', error);
    }
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down server...');
    if (searchEngine) searchEngine.close();
    if (cutoffRanksDb) await cutoffRanksDb.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down server...');
    if (searchEngine) searchEngine.close();
    if (cutoffRanksDb) await cutoffRanksDb.close();
    process.exit(0);
});
