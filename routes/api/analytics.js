const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Data file paths
const PROCESSED_DATA_PATH = path.join(__dirname, '../../../data/processed');

/**
 * GET /api/analytics/dashboard - Get analytics dashboard data
 */
router.get('/dashboard', async (req, res) => {
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

    // Calculate dashboard metrics
    const totalColleges = collegesData.length;
    const totalSeats = collegesData.reduce((sum, c) => sum + (parseInt(c.total_seats) || 0), 0);
    const states = [...new Set(collegesData.map(c => c.state).filter(Boolean))];
    const cities = [...new Set(collegesData.map(c => c.city).filter(Boolean))];

    // Management type distribution
    const managementDistribution = collegesData.reduce((acc, college) => {
      const type = college.management_type || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // State-wise distribution (top 8)
    const stateDistribution = collegesData.reduce((acc, college) => {
      const state = college.state || 'Unknown';
      acc[state] = (acc[state] || 0) + 1;
      return acc;
    }, {});

    const topStates = Object.entries(stateDistribution)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([state, count]) => ({ state, count }));

    // Establishment year distribution by decade
    const decadeDistribution = collegesData.reduce((acc, college) => {
      const year = parseInt(college.establishment_year);
      if (year) {
        const decade = Math.floor(year / 10) * 10;
        acc[decade] = (acc[decade] || 0) + 1;
      }
      return acc;
    }, {});

    const decadeChart = Object.entries(decadeDistribution)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([decade, count]) => ({ decade: `${decade}s`, count }));

    // Course distribution
    const courseDistribution = collegesData.reduce((acc, college) => {
      const courses = college.courses_offered?.split(',').map(c => c.trim()) || [];
      courses.forEach(course => {
        acc[course] = (acc[course] || 0) + 1;
      });
      return acc;
    }, {});

    const topCourses = Object.entries(courseDistribution)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([course, count]) => ({ course, count }));

    res.json({
      success: true,
      data: {
        overview: {
          totalColleges,
          totalSeats,
          statesCovered: states.length,
          citiesCovered: cities.length
        },
        charts: {
          managementDistribution,
          stateDistribution: topStates,
          decadeDistribution: decadeChart,
          courseDistribution: topCourses
        },
        metrics: {
          avgSeatsPerCollege: totalColleges > 0 ? Math.round(totalSeats / totalColleges) : 0,
          collegesPerState: states.length > 0 ? Math.round(totalColleges / states.length) : 0
        }
      }
    });

  } catch (error) {
    console.error('Error fetching analytics dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics dashboard',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/trends - Get trend analysis
 */
router.get('/trends', async (req, res) => {
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

    // Year-wise trends
    const yearTrends = collegesData.reduce((acc, college) => {
      const year = parseInt(college.establishment_year);
      if (year) {
        if (!acc[year]) acc[year] = { colleges: 0, seats: 0 };
        acc[year].colleges += 1;
        acc[year].seats += parseInt(college.total_seats) || 0;
      }
      return acc;
    }, {});

    const yearChart = Object.entries(yearTrends)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([year, data]) => ({
        year: parseInt(year),
        colleges: data.colleges,
        seats: data.seats
      }));

    // Regional analysis
    const regionalData = collegesData.reduce((acc, college) => {
      const state = college.state;
      if (state) {
        if (!acc[state]) acc[state] = { colleges: 0, seats: 0, types: {} };
        acc[state].colleges += 1;
        acc[state].seats += parseInt(college.total_seats) || 0;
        
        const type = college.management_type || 'Unknown';
        acc[state].types[type] = (acc[state].types[type] || 0) + 1;
      }
      return acc;
    }, {});

    const regionalChart = Object.entries(regionalData)
      .map(([state, data]) => ({
        state,
        colleges: data.colleges,
        seats: data.seats,
        types: data.types
      }))
      .sort((a, b) => b.colleges - a.colleges)
      .slice(0, 15);

    res.json({
      success: true,
      data: {
        yearTrends: yearChart,
        regionalAnalysis: regionalChart,
        summary: {
          totalYears: Object.keys(yearTrends).length,
          totalRegions: Object.keys(regionalData).length,
          avgCollegesPerYear: Object.values(yearTrends).reduce((sum, data) => sum + data.colleges, 0) / Object.keys(yearTrends).length
        }
      }
    });

  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trends',
      message: error.message
    });
  }
});

module.exports = router;
