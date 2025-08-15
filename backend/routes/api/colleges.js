const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Data file paths
const COLLEGES_DATA_PATH = path.join(__dirname, '../../../data/foundation/colleges');
const PROCESSED_DATA_PATH = path.join(__dirname, '../../../data/processed');

/**
 * GET /api/colleges - Get all colleges with filtering and pagination
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = '',
      state = '',
      course = '',
      management = '',
      minSeats = '',
      maxSeats = '',
      minYear = '',
      maxYear = ''
    } = req.query;

    // Load processed colleges data
    let collegesData = [];
    const processedFiles = fs.readdirSync(PROCESSED_DATA_PATH)
      .filter(file => file.includes('colleges') && file.endsWith('.json'))
      .sort((a, b) => fs.statSync(path.join(PROCESSED_DATA_PATH, b)).mtime.getTime() - fs.statSync(path.join(PROCESSED_DATA_PATH, a)).mtime.getTime());

    if (processedFiles.length > 0) {
      const latestFile = processedFiles[0];
      const filePath = path.join(PROCESSED_DATA_PATH, latestFile);
      collegesData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } else {
      // Fallback to foundation data
      const foundationFiles = fs.readdirSync(COLLEGES_DATA_PATH)
        .filter(file => file.endsWith('.json'));
      
      if (foundationFiles.length > 0) {
        const filePath = path.join(COLLEGES_DATA_PATH, foundationFiles[0]);
        collegesData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      }
    }

    // Apply filters
    let filteredData = collegesData.filter(college => {
      // Search filter
      if (search && !college.college_name?.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      
      // State filter
      if (state && college.state !== state) {
        return false;
      }
      
      // Course filter
      if (course && !college.courses_offered?.includes(course)) {
        return false;
      }
      
      // Management filter
      if (management && college.management_type !== management) {
        return false;
      }
      
      // Seats filter
      if (minSeats && college.total_seats < parseInt(minSeats)) {
        return false;
      }
      if (maxSeats && college.total_seats > parseInt(maxSeats)) {
        return false;
      }
      
      // Year filter
      if (minYear && college.establishment_year < parseInt(minYear)) {
        return false;
      }
      if (maxYear && college.establishment_year > parseInt(maxYear)) {
        return false;
      }
      
      return true;
    });

    // Pagination
    const totalRecords = filteredData.length;
    const totalPages = Math.ceil(totalRecords / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedData = filteredData.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedData,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalRecords,
        recordsPerPage: parseInt(limit),
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      filters: {
        search,
        state,
        course,
        management,
        minSeats,
        maxSeats,
        minYear,
        maxYear
      }
    });

  } catch (error) {
    console.error('Error fetching colleges:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch colleges data',
      message: error.message
    });
  }
});

/**
 * GET /api/colleges/statistics - Get college statistics
 */
router.get('/statistics', async (req, res) => {
  try {
    // Load colleges data
    let collegesData = [];
    const processedFiles = fs.readdirSync(PROCESSED_DATA_PATH)
      .filter(file => file.includes('colleges') && file.endsWith('.json'));

    if (processedFiles.length > 0) {
      const latestFile = processedFiles[0];
      const filePath = path.join(PROCESSED_DATA_PATH, latestFile);
      collegesData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }

    // Calculate statistics
    const totalColleges = collegesData.length;
    const states = [...new Set(collegesData.map(c => c.state).filter(Boolean))];
    const cities = [...new Set(collegesData.map(c => c.city).filter(Boolean))];
    const managementTypes = [...new Set(collegesData.map(c => c.management_type).filter(Boolean))];
    
    const totalSeats = collegesData.reduce((sum, c) => sum + (parseInt(c.total_seats) || 0), 0);
    const avgSeats = totalColleges > 0 ? Math.round(totalSeats / totalColleges) : 0;
    
    const yearRange = collegesData.reduce((range, c) => {
      const year = parseInt(c.establishment_year);
      if (year) {
        range.min = Math.min(range.min, year);
        range.max = Math.max(range.max, year);
      }
      return range;
    }, { min: Infinity, max: -Infinity });

    // State-wise distribution
    const stateDistribution = states.reduce((acc, state) => {
      acc[state] = collegesData.filter(c => c.state === state).length;
      return acc;
    }, {});

    // Management type distribution
    const managementDistribution = managementTypes.reduce((acc, type) => {
      acc[type] = collegesData.filter(c => c.management_type === type).length;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        totalColleges,
        totalSeats,
        avgSeats,
        states: states.length,
        cities: cities.length,
        yearRange: {
          min: yearRange.min === Infinity ? null : yearRange.min,
          max: yearRange.max === -Infinity ? null : yearRange.max
        },
        stateDistribution,
        managementDistribution,
        topStates: Object.entries(stateDistribution)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([state, count]) => ({ state, count }))
      }
    });

  } catch (error) {
    console.error('Error fetching college statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch college statistics',
      message: error.message
    });
  }
});

/**
 * GET /api/colleges/:id - Get specific college details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Load colleges data
    let collegesData = [];
    const processedFiles = fs.readdirSync(PROCESSED_DATA_PATH)
      .filter(file => file.includes('colleges') && file.endsWith('.json'));

    if (processedFiles.length > 0) {
      const latestFile = processedFiles[0];
      const filePath = path.join(PROCESSED_DATA_PATH, latestFile);
      collegesData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }

    // Find college by ID or name
    const college = collegesData.find(c => 
      c._row_index == id || 
      c.college_name?.toLowerCase().includes(id.toLowerCase())
    );

    if (!college) {
      return res.status(404).json({
        success: false,
        error: 'College not found'
      });
    }

    res.json({
      success: true,
      data: college
    });

  } catch (error) {
    console.error('Error fetching college details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch college details',
      message: error.message
    });
  }
});

/**
 * GET /api/colleges/search/suggestions - Get search suggestions
 */
router.get('/search/suggestions', async (req, res) => {
  try {
    const { q = '' } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Load colleges data
    let collegesData = [];
    const processedFiles = fs.readdirSync(PROCESSED_DATA_PATH)
      .filter(file => file.includes('colleges') && file.endsWith('.json'));

    if (processedFiles.length > 0) {
      const latestFile = processedFiles[0];
      const filePath = path.join(PROCESSED_DATA_PATH, latestFile);
      collegesData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }

    // Get search suggestions
    const suggestions = collegesData
      .filter(college => 
        college.college_name?.toLowerCase().includes(q.toLowerCase()) ||
        college.city?.toLowerCase().includes(q.toLowerCase()) ||
        college.state?.toLowerCase().includes(q.toLowerCase())
      )
      .slice(0, 10)
      .map(college => ({
        id: college._row_index,
        college_name: college.college_name,
        city: college.city,
        state: college.state,
        type: 'college'
      }));

    res.json({
      success: true,
      data: suggestions
    });

  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch search suggestions',
      message: error.message
    });
  }
});

module.exports = router;
