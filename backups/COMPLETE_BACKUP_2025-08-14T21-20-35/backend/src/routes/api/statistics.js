const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Data file paths
const PROCESSED_DATA_PATH = path.join(__dirname, '../../../data/processed');

/**
 * GET /api/statistics - Get platform statistics
 */
router.get('/', async (req, res) => {
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

    // Calculate comprehensive statistics
    const totalColleges = collegesData.length;
    const totalSeats = collegesData.reduce((sum, c) => sum + (parseInt(c.total_seats) || 0), 0);
    const states = [...new Set(collegesData.map(c => c.state).filter(Boolean))];
    const cities = [...new Set(collegesData.map(c => c.city).filter(Boolean))];
    const managementTypes = [...new Set(collegesData.map(c => c.management_type).filter(Boolean))];

    // Calculate averages and ranges
    const avgSeats = totalColleges > 0 ? Math.round(totalSeats / totalColleges) : 0;
    const avgCollegesPerState = states.length > 0 ? Math.round(totalColleges / states.length) : 0;
    
    const yearRange = collegesData.reduce((range, c) => {
      const year = parseInt(c.establishment_year);
      if (year) {
        range.min = Math.min(range.min, year);
        range.max = Math.max(range.max, year);
      }
      return range;
    }, { min: Infinity, max: -Infinity });

    // Top performing metrics
    const topStates = Object.entries(
      collegesData.reduce((acc, college) => {
        const state = college.state || 'Unknown';
        acc[state] = (acc[state] || 0) + 1;
        return acc;
      }, {})
    )
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([state, count]) => ({ state, count }));

    const topCities = Object.entries(
      collegesData.reduce((acc, college) => {
        const city = college.city || 'Unknown';
        acc[city] = (acc[city] || 0) + 1;
        return acc;
      }, {})
    )
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([city, count]) => ({ city, count }));

    // Management type distribution
    const managementDistribution = managementTypes.reduce((acc, type) => {
      acc[type] = collegesData.filter(c => c.management_type === type).length;
      return acc;
    }, {});

    // Course analysis
    const courseAnalysis = collegesData.reduce((acc, college) => {
      const courses = college.courses_offered?.split(',').map(c => c.trim()) || [];
      courses.forEach(course => {
        if (!acc[course]) acc[course] = { count: 0, colleges: [] };
        acc[course].count += 1;
        acc[course].colleges.push(college.college_name);
      });
      return acc;
    }, {});

    const topCourses = Object.entries(courseAnalysis)
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, 10)
      .map(([course, data]) => ({ course, count: data.count }));

    // Recent establishments (last 10 years)
    const currentYear = new Date().getFullYear();
    const recentColleges = collegesData.filter(c => {
      const year = parseInt(c.establishment_year);
      return year && year >= currentYear - 10;
    }).length;

    // Seat capacity analysis
    const seatCapacity = {
      small: collegesData.filter(c => (parseInt(c.total_seats) || 0) < 100).length,
      medium: collegesData.filter(c => {
        const seats = parseInt(c.total_seats) || 0;
        return seats >= 100 && seats < 500;
      }).length,
      large: collegesData.filter(c => (parseInt(c.total_seats) || 0) >= 500).length
    };

    res.json({
      success: true,
      data: {
        overview: {
          totalColleges,
          totalSeats,
          statesCovered: states.length,
          citiesCovered: cities.length,
          managementTypes: managementTypes.length,
          coursesOffered: Object.keys(courseAnalysis).length
        },
        averages: {
          avgSeatsPerCollege: avgSeats,
          avgCollegesPerState: avgCollegesPerState,
          avgCollegesPerCity: cities.length > 0 ? Math.round(totalColleges / cities.length) : 0
        },
        ranges: {
          establishmentYear: {
            min: yearRange.min === Infinity ? null : yearRange.min,
            max: yearRange.max === -Infinity ? null : yearRange.max,
            span: yearRange.min !== Infinity && yearRange.max !== -Infinity ? 
              yearRange.max - yearRange.min : null
          },
          seatCapacity: {
            min: Math.min(...collegesData.map(c => parseInt(c.total_seats) || 0).filter(v => v > 0)),
            max: Math.max(...collegesData.map(c => parseInt(c.total_seats) || 0))
          }
        },
        topPerformers: {
          states: topStates,
          cities: topCities,
          courses: topCourses
        },
        distributions: {
          management: managementDistribution,
          seatCapacity,
          establishment: {
            recent: recentColleges,
            historical: totalColleges - recentColleges
          }
        },
        metadata: {
          lastUpdated: new Date().toISOString(),
          dataSource: processedFiles.length > 0 ? processedFiles[0] : 'foundation',
          totalRecords: collegesData.length
        }
      }
    });

  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
});

/**
 * GET /api/statistics/unique-values - Get unique values for filters
 */
router.get('/unique-values', async (req, res) => {
  try {
    const { field } = req.query;
    
    if (!field) {
      return res.status(400).json({
        success: false,
        error: 'Field parameter is required'
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

    // Get unique values for the specified field
    const uniqueValues = [...new Set(
      collegesData
        .map(college => college[field])
        .filter(Boolean)
        .sort()
    )];

    res.json({
      success: true,
      data: {
        field,
        count: uniqueValues.length,
        values: uniqueValues
      }
    });

  } catch (error) {
    console.error('Error fetching unique values:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch unique values',
      message: error.message
    });
  }
});

module.exports = router;
