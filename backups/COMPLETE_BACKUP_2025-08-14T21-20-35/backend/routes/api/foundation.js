const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Foundation data paths
const FOUNDATION_PATH = path.join(__dirname, '../../../data/foundation');
const PROCESSED_PATH = path.join(__dirname, '../../../data/processed');

/**
 * GET /api/foundation - Get all foundation data overview
 */
router.get('/', async (req, res) => {
  try {
    const foundationData = {
      states: { count: 0, lastUpdated: null },
      courses: { count: 0, lastUpdated: null },
      categories: { count: 0, lastUpdated: null },
      quotas: { count: 0, lastUpdated: null },
      colleges: { count: 0, lastUpdated: null }
    };

    // Check each foundation data type
    const dataTypes = ['states', 'courses', 'categories', 'quotas', 'colleges'];
    
    for (const type of dataTypes) {
      const typePath = path.join(FOUNDATION_PATH, type);
      const processedPath = path.join(PROCESSED_PATH, `${type}_processed.json`);
      
      if (fs.existsSync(typePath)) {
        const files = fs.readdirSync(typePath).filter(f => f.endsWith('.xlsx'));
        if (files.length > 0) {
          const filePath = path.join(typePath, files[0]);
          const stats = fs.statSync(filePath);
          foundationData[type].lastUpdated = stats.mtime.toISOString();
        }
      }
      
      // Check for processed data
      if (fs.existsSync(processedPath)) {
        try {
          const processedData = JSON.parse(fs.readFileSync(processedPath, 'utf8'));
          foundationData[type].count = processedData.data ? processedData.data.length : 0;
        } catch (error) {
          console.error(`Error reading processed ${type} data:`, error.message);
        }
      }
    }

    res.json({
      success: true,
      data: foundationData,
      message: 'Foundation data overview retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching foundation data overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch foundation data overview',
      message: error.message
    });
  }
});

/**
 * GET /api/foundation/:type - Get specific foundation data
 */
router.get('/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { format = 'json' } = req.query;
    
    if (!['states', 'courses', 'categories', 'quotas', 'colleges'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid data type. Must be one of: states, courses, categories, quotas, colleges'
      });
    }

    // First try to get processed data
    const processedPath = path.join(PROCESSED_PATH, `${type}_processed.json`);
    let data = null;
    let source = 'processed';

    if (fs.existsSync(processedPath)) {
      try {
        const processedData = JSON.parse(fs.readFileSync(processedPath, 'utf8'));
        data = processedData.data || processedData;
      } catch (error) {
        console.error(`Error reading processed ${type} data:`, error.message);
      }
    }

    // Fallback to foundation Excel data
    if (!data) {
      const foundationPath = path.join(FOUNDATION_PATH, type);
      if (fs.existsSync(foundationPath)) {
        const files = fs.readdirSync(foundationPath).filter(f => f.endsWith('.xlsx'));
        if (files.length > 0) {
          source = 'foundation';
          data = { message: `Excel file available: ${files[0]}. Use /api/foundation/${type}/process to convert to JSON.` };
        }
      }
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: `No data found for ${type}`,
        message: `No processed or foundation data available for ${type}`
      });
    }

    res.json({
      success: true,
      data: {
        type,
        source,
        count: Array.isArray(data) ? data.length : 0,
        data: data,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error(`Error fetching ${req.params.type} data:`, error);
    res.status(500).json({
      success: false,
      error: `Failed to fetch ${req.params.type} data`,
      message: error.message
    });
  }
});

/**
 * POST /api/foundation/:type/process - Process Excel foundation data to JSON
 */
router.post('/:type/process', async (req, res) => {
  try {
    const { type } = req.params;
    
    if (!['states', 'courses', 'categories', 'quotas', 'colleges'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid data type. Must be one of: states, courses, categories, quotas, colleges'
      });
    }

    const foundationPath = path.join(FOUNDATION_PATH, type);
    if (!fs.existsSync(foundationPath)) {
      return res.status(404).json({
        success: false,
        error: `Foundation directory not found for ${type}`
      });
    }

    const files = fs.readdirSync(foundationPath).filter(f => f.endsWith('.xlsx'));
    if (files.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No Excel files found for ${type}`
      });
    }

    // Use the enhanced data processor
    const EnhancedDataProcessor = require('../../../scripts/enhanced-data-processor');
    const processor = new EnhancedDataProcessor();

    const excelPath = path.join(foundationPath, files[0]);
    const result = await processor.processExcelFile(excelPath, {
      createVersion: true,
      saveAsCsv: true,
      outputDir: PROCESSED_PATH,
      outputFilename: `${type}_processed.json`,
      description: `Processed ${type} foundation data`
    });

    if (result.success) {
      res.json({
        success: true,
        message: `${type} data processed successfully`,
        data: {
          type,
          processedRecords: result.data.length,
          outputPath: result.outputPath,
          validation: result.validation
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: `Failed to process ${type} data`,
        message: result.error
      });
    }

  } catch (error) {
    console.error(`Error processing ${req.params.type} data:`, error);
    res.status(500).json({
      success: false,
      error: `Failed to process ${req.params.type} data`,
      message: error.message
    });
  }
});

/**
 * GET /api/foundation/:type/search - Search foundation data
 */
router.get('/:type/search', async (req, res) => {
  try {
    const { type } = req.params;
    const { q = '', limit = 50 } = req.query;
    
    if (!['states', 'courses', 'categories', 'quotas', 'colleges'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid data type'
      });
    }

    // Get processed data
    const processedPath = path.join(PROCESSED_PATH, `${type}_processed.json`);
    let data = [];

    if (fs.existsSync(processedPath)) {
      try {
        const processedData = JSON.parse(fs.readFileSync(processedPath, 'utf8'));
        data = processedData.data || processedData;
      } catch (error) {
        console.error(`Error reading processed ${type} data:`, error.message);
      }
    }

    if (data.length === 0) {
      return res.json({
        success: true,
        data: {
          type,
          query: q,
          results: [],
          count: 0
        }
      });
    }

    // Simple search implementation
    let results = data;
    if (q) {
      const query = q.toLowerCase();
      results = data.filter(item => {
        // Search in all string fields
        return Object.values(item).some(value => 
          value && value.toString().toLowerCase().includes(query)
        );
      });
    }

    // Apply limit
    results = results.slice(0, parseInt(limit));

    res.json({
      success: true,
      data: {
        type,
        query: q,
        results,
        count: results.length,
        total: data.length
      }
    });

  } catch (error) {
    console.error(`Error searching ${req.params.type} data:`, error);
    res.status(500).json({
      success: false,
      error: `Failed to search ${req.params.type} data`,
      message: error.message
    });
  }
});

/**
 * GET /api/foundation/:type/validate - Validate foundation data
 */
router.get('/:type/validate', async (req, res) => {
  try {
    const { type } = req.params;
    
    if (!['states', 'courses', 'categories', 'quotas', 'colleges'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid data type'
      });
    }

    // Get processed data
    const processedPath = path.join(PROCESSED_PATH, `${type}_processed.json`);
    let data = [];

    if (fs.existsSync(processedPath)) {
      try {
        const processedData = JSON.parse(fs.readFileSync(processedPath, 'utf8'));
        data = processedData.data || processedData;
      } catch (error) {
        console.error(`Error reading processed ${type} data:`, error.message);
      }
    }

    if (data.length === 0) {
      return res.json({
        success: true,
        data: {
          type,
          validation: {
            totalRecords: 0,
            validRecords: 0,
            invalidRecords: 0,
            errors: []
          }
        }
      });
    }

    // Use the real-time validation system
    const RealTimeValidation = require('../../../scripts/real-time-validation');
    const validation = new RealTimeValidation();
    
    const validationResults = await validation.validateDataset(data);

    res.json({
      success: true,
      data: {
        type,
        validation: validationResults
      }
    });

  } catch (error) {
    console.error(`Error validating ${req.params.type} data:`, error);
    res.status(500).json({
      success: false,
      error: `Failed to validate ${req.params.type} data`,
      message: error.message
    });
  }
});

module.exports = router;
