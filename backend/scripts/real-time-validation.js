const fs = require('fs');
const path = require('path');

/**
 * 🔍 Real-Time Data Validation System
 * Based on previous project architecture but simplified and robust
 */
class RealTimeValidation {
  constructor() {
    this.referenceData = {};
    this.validationRules = {};
    this.errorCorrections = {};
    this.initializeValidationSystem();
  }

  /**
   * Initialize validation system
   */
  async initializeValidationSystem() {
    try {
      await this.loadReferenceData();
      await this.loadValidationRules();
      await this.loadErrorCorrections();
      console.log('✅ Real-time validation system initialized');
    } catch (error) {
      console.error('❌ Error initializing validation system:', error.message);
    }
  }

  /**
   * Load reference data for validation
   */
  async loadReferenceData() {
    try {
      const referenceDir = path.join(__dirname, '../../data/foundation');
      
      // Load states
      const statesPath = path.join(referenceDir, 'states');
      if (fs.existsSync(statesPath)) {
        const stateFiles = fs.readdirSync(statesPath).filter(f => f.endsWith('.json'));
        if (stateFiles.length > 0) {
          const statesData = JSON.parse(fs.readFileSync(path.join(statesPath, stateFiles[0]), 'utf8'));
          this.referenceData.states = statesData.map(s => s.state || s.name).filter(Boolean);
        }
      }
      
      // Load courses
      const coursesPath = path.join(referenceDir, 'courses');
      if (fs.existsSync(coursesPath)) {
        const courseFiles = fs.readdirSync(coursesPath).filter(f => f.endsWith('.json'));
        if (courseFiles.length > 0) {
          const coursesData = JSON.parse(fs.readFileSync(path.join(coursesPath, courseFiles[0]), 'utf8'));
          this.referenceData.courses = coursesData.map(c => c.course || c.name).filter(Boolean);
        }
      }
      
      // Load management types
      this.referenceData.managementTypes = [
        'Government', 'Private', 'Trust', 'Society', 'Autonomous'
      ];
      
      console.log(`📚 Loaded ${this.referenceData.states?.length || 0} states, ${this.referenceData.courses?.length || 0} courses`);
    } catch (error) {
      console.error('Error loading reference data:', error.message);
    }
  }

  /**
   * Load validation rules
   */
  async loadValidationRules() {
    this.validationRules = {
      college_name: {
        required: true,
        maxLength: 200,
        pattern: /^[a-zA-Z0-9\s\-\.\(\)]+$/,
        message: 'College name must be 1-200 characters, alphanumeric with spaces, hyphens, dots, and parentheses'
      },
      state: {
        required: true,
        maxLength: 50,
        allowedValues: this.referenceData.states || [],
        message: 'State must be a valid Indian state'
      },
      city: {
        required: true,
        maxLength: 100,
        pattern: /^[a-zA-Z\s\-]+$/,
        message: 'City must be 1-100 characters, alphabetic with spaces and hyphens'
      },
      management_type: {
        required: true,
        allowedValues: this.referenceData.managementTypes,
        message: 'Management type must be Government, Private, Trust, Society, or Autonomous'
      },
      establishment_year: {
        required: true,
        type: 'number',
        min: 1800,
        max: new Date().getFullYear(),
        message: 'Establishment year must be between 1800 and current year'
      },
      total_seats: {
        required: true,
        type: 'number',
        min: 1,
        max: 10000,
        message: 'Total seats must be between 1 and 10,000'
      },
      medical_seats: {
        required: false,
        type: 'number',
        min: 0,
        max: 10000,
        message: 'Medical seats must be between 0 and 10,000'
      },
      dental_seats: {
        required: false,
        type: 'number',
        min: 0,
        max: 10000,
        message: 'Dental seats must be between 0 and 10,000'
      },
      dnb_seats: {
        required: false,
        type: 'number',
        min: 0,
        max: 10000,
        message: 'DNB seats must be between 0 and 10,000'
      },
      courses_offered: {
        required: true,
        maxLength: 500,
        message: 'Courses offered must be provided and under 500 characters'
      },
      address: {
        required: false,
        maxLength: 500,
        message: 'Address must be under 500 characters'
      },
      phone: {
        required: false,
        pattern: /^[\d\-\+\(\)\s]+$/,
        message: 'Phone number must contain only digits, hyphens, plus signs, parentheses, and spaces'
      },
      email: {
        required: false,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Email must be a valid email address'
      },
      website: {
        required: false,
        pattern: /^https?:\/\/.+/,
        message: 'Website must start with http:// or https://'
      },
      accreditation_status: {
        required: false,
        maxLength: 100,
        message: 'Accreditation status must be under 100 characters'
      }
    };
  }

  /**
   * Load error corrections
   */
  async loadErrorCorrections() {
    try {
      const correctionsPath = path.join(__dirname, '../../data/foundation/error_corrections.json');
      if (fs.existsSync(correctionsPath)) {
        this.errorCorrections = JSON.parse(fs.readFileSync(correctionsPath, 'utf8'));
      } else {
        // Create default error corrections
        this.errorCorrections = {
          states: {
            'Delhi': 'Delhi',
            'New Delhi': 'Delhi',
            'Mumbai': 'Maharashtra',
            'Bangalore': 'Karnataka',
            'Chennai': 'Tamil Nadu',
            'Kolkata': 'West Bengal',
            'Hyderabad': 'Telangana'
          },
          management: {
            'Govt': 'Government',
            'Gov': 'Government',
            'Private': 'Private',
            'Pvt': 'Private',
            'Trust': 'Trust',
            'Society': 'Society'
          }
        };
        
        // Save default corrections
        fs.writeFileSync(correctionsPath, JSON.stringify(this.errorCorrections, null, 2));
      }
    } catch (error) {
      console.error('Error loading error corrections:', error.message);
    }
  }

  /**
   * Validate a single college record
   */
  validateCollegeRecord(record, rowIndex) {
    const validationResult = {
      rowIndex,
      isValid: true,
      errors: [],
      warnings: [],
      corrections: [],
      originalData: { ...record }
    };

    // Validate each field
    Object.keys(this.validationRules).forEach(fieldName => {
      const rule = this.validationRules[fieldName];
      const value = record[fieldName];
      
      try {
        const fieldValidation = this.validateField(fieldName, value, rule);
        
        if (!fieldValidation.isValid) {
          validationResult.isValid = false;
          validationResult.errors.push({
            field: fieldName,
            value,
            message: fieldValidation.message,
            rule: rule.message
          });
        }
        
        if (fieldValidation.warning) {
          validationResult.warnings.push({
            field: fieldName,
            value,
            message: fieldValidation.warning
          });
        }
        
        if (fieldValidation.correction) {
          validationResult.corrections.push({
            field: fieldName,
            originalValue: value,
            correctedValue: fieldValidation.correction
          });
          
          // Apply correction
          record[fieldName] = fieldValidation.correction;
        }
      } catch (error) {
        validationResult.errors.push({
          field: fieldName,
          value,
          message: `Validation error: ${error.message}`
        });
        validationResult.isValid = false;
      }
    });

    // Business logic validations
    const businessValidation = this.validateBusinessLogic(record);
    if (!businessValidation.isValid) {
      validationResult.isValid = false;
      validationResult.errors.push(...businessValidation.errors);
    }

    return validationResult;
  }

  /**
   * Validate a single field
   */
  validateField(fieldName, value, rule) {
    const result = {
      isValid: true,
      message: '',
      warning: null,
      correction: null
    };

    // Check required
    if (rule.required && (!value || value.toString().trim() === '')) {
      result.isValid = false;
      result.message = `${fieldName} is required`;
      return result;
    }

    // Skip validation for empty optional fields
    if (!rule.required && (!value || value.toString().trim() === '')) {
      return result;
    }

    // Type validation
    if (rule.type === 'number') {
      const numValue = parseInt(value);
      if (isNaN(numValue)) {
        result.isValid = false;
        result.message = `${fieldName} must be a valid number`;
        return result;
      }
      
      if (rule.min !== undefined && numValue < rule.min) {
        result.isValid = false;
        result.message = `${fieldName} must be at least ${rule.min}`;
        return result;
      }
      
      if (rule.max !== undefined && numValue > rule.max) {
        result.isValid = false;
        result.message = `${fieldName} must be at most ${rule.max}`;
        return result;
      }
    }

    // Length validation
    if (rule.maxLength && value.toString().length > rule.maxLength) {
      result.isValid = false;
      result.message = `${fieldName} must be ${rule.maxLength} characters or less`;
      return result;
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(value.toString())) {
      result.isValid = false;
      result.message = rule.message || `${fieldName} format is invalid`;
      return result;
    }

    // Allowed values validation
    if (rule.allowedValues && rule.allowedValues.length > 0) {
      const normalizedValue = value.toString().trim();
      const normalizedAllowed = rule.allowedValues.map(v => v.toString().trim());
      
      if (!normalizedAllowed.includes(normalizedValue)) {
        // Try to find a correction
        const correction = this.findCorrection(fieldName, normalizedValue);
        if (correction) {
          result.correction = correction;
          result.warning = `Corrected ${fieldName} from "${value}" to "${correction}"`;
        } else {
          result.isValid = false;
          result.message = `${fieldName} must be one of: ${rule.allowedValues.join(', ')}`;
        }
      }
    }

    return result;
  }

  /**
   * Find correction for a field value
   */
  findCorrection(fieldName, value) {
    if (fieldName === 'state' && this.errorCorrections.states) {
      return this.errorCorrections.states[value] || null;
    }
    
    if (fieldName === 'management_type' && this.errorCorrections.management) {
      return this.errorCorrections.management[value] || null;
    }
    
    // Try fuzzy matching for other fields
    return this.fuzzyMatch(value, fieldName);
  }

  /**
   * Fuzzy matching for corrections
   */
  fuzzyMatch(value, fieldName) {
    if (!value) return null;
    
    const normalizedValue = value.toString().toLowerCase().trim();
    let bestMatch = null;
    let bestScore = 0;
    
    if (fieldName === 'state' && this.referenceData.states) {
      this.referenceData.states.forEach(state => {
        const score = this.calculateSimilarity(normalizedValue, state.toLowerCase());
        if (score > bestScore && score > 0.8) {
          bestScore = score;
          bestMatch = state;
        }
      });
    }
    
    return bestMatch;
  }

  /**
   * Calculate similarity between two strings
   */
  calculateSimilarity(str1, str2) {
    if (str1 === str2) return 1;
    if (str1.includes(str2) || str2.includes(str1)) return 0.9;
    
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Levenshtein distance calculation
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Validate business logic
   */
  validateBusinessLogic(record) {
    const result = {
      isValid: true,
      errors: []
    };

    // Check if total seats equals sum of individual seat types
    const totalSeats = parseInt(record.total_seats) || 0;
    const medicalSeats = parseInt(record.medical_seats) || 0;
    const dentalSeats = parseInt(record.dental_seats) || 0;
    const dnbSeats = parseInt(record.dnb_seats) || 0;
    
    const calculatedTotal = medicalSeats + dentalSeats + dnbSeats;
    
    if (totalSeats > 0 && calculatedTotal > 0 && totalSeats !== calculatedTotal) {
      result.errors.push({
        field: 'total_seats',
        value: totalSeats,
        message: `Total seats (${totalSeats}) should equal sum of individual seats (${calculatedTotal})`
      });
    }

    // Check establishment year is not in future
    const currentYear = new Date().getFullYear();
    const establishmentYear = parseInt(record.establishment_year);
    
    if (establishmentYear > currentYear) {
      result.errors.push({
        field: 'establishment_year',
        value: establishmentYear,
        message: `Establishment year (${establishmentYear}) cannot be in the future`
      });
    }

    if (result.errors.length > 0) {
      result.isValid = false;
    }

    return result;
  }

  /**
   * Validate entire dataset
   */
  validateDataset(data) {
    const validationResults = {
      totalRecords: data.length,
      validRecords: 0,
      invalidRecords: 0,
      totalErrors: 0,
      totalWarnings: 0,
      totalCorrections: 0,
      records: [],
      summary: {}
    };

    data.forEach((record, index) => {
      const result = this.validateCollegeRecord(record, index);
      validationResults.records.push(result);
      
      if (result.isValid) {
        validationResults.validRecords++;
      } else {
        validationResults.invalidRecords++;
      }
      
      validationResults.totalErrors += result.errors.length;
      validationResults.totalWarnings += result.warnings.length;
      validationResults.totalCorrections += result.corrections.length;
    });

    // Generate summary
    validationResults.summary = {
      successRate: ((validationResults.validRecords / validationResults.totalRecords) * 100).toFixed(2),
      averageErrorsPerRecord: (validationResults.totalErrors / validationResults.totalRecords).toFixed(2),
      dataQuality: this.assessDataQuality(validationResults)
    };

    return validationResults;
  }

  /**
   * Assess overall data quality
   */
  assessDataQuality(validationResults) {
    const successRate = parseFloat(validationResults.summary.successRate);
    
    if (successRate >= 95) return 'EXCELLENT';
    if (successRate >= 85) return 'GOOD';
    if (successRate >= 70) return 'ACCEPTABLE';
    if (successRate >= 50) return 'NEEDS_IMPROVEMENT';
    return 'POOR';
  }

  /**
   * Generate validation report
   */
  generateValidationReport(validationResults) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: validationResults.summary,
      statistics: {
        totalRecords: validationResults.totalRecords,
        validRecords: validationResults.validRecords,
        invalidRecords: validationResults.invalidRecords,
        totalErrors: validationResults.totalErrors,
        totalWarnings: validationResults.totalWarnings,
        totalCorrections: validationResults.totalCorrections
      },
      recommendations: this.generateValidationRecommendations(validationResults)
    };

    return report;
  }

  /**
   * Generate validation recommendations
   */
  generateValidationRecommendations(validationResults) {
    const recommendations = [];
    
    if (validationResults.invalidRecords > 0) {
      recommendations.push({
        priority: 'HIGH',
        message: `${validationResults.invalidRecords} records have validation errors`,
        action: 'Review and fix invalid records before proceeding'
      });
    }
    
    if (validationResults.totalWarnings > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        message: `${validationResults.totalWarnings} warnings detected`,
        action: 'Review warnings for data quality improvements'
      });
    }
    
    if (validationResults.totalCorrections > 0) {
      recommendations.push({
        priority: 'LOW',
        message: `${validationResults.totalCorrections} automatic corrections applied`,
        action: 'Review corrections to ensure accuracy'
      });
    }
    
    return recommendations;
  }
}

module.exports = RealTimeValidation;
