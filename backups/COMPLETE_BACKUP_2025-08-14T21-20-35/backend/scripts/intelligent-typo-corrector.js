#!/usr/bin/env node

/**
 * 🧠 Intelligent Typo Error Corrector
 * Advanced AI-powered typo correction with learning capabilities
 * Learns from common errors file and continuously improves
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

class IntelligentTypoCorrector {
  constructor() {
    this.commonErrorsPath = path.join(__dirname, '../data/common_error/ERROR_AND_CORRECTED.xlsx');
    this.learningDataPath = path.join(__dirname, '../data/common_error/learning-data.json');
    this.correctionStatsPath = path.join(__dirname, '../data/common_error/correction-stats.json');
    
    this.learningData = null;
    this.correctionStats = null;
    
    this.initializeSystem();
  }

  /**
   * Initialize the correction system
   */
  initializeSystem() {
    console.log('🧠 Initializing Intelligent Typo Correction System...');
    this.loadLearningData();
    this.loadCorrectionStats();
  }

  /**
   * Load learning data from file
   */
  loadLearningData() {
    try {
      if (fs.existsSync(this.learningDataPath)) {
        this.learningData = JSON.parse(fs.readFileSync(this.learningDataPath, 'utf8'));
        console.log(`📚 Loaded ${this.learningData.totalCorrections} learning corrections`);
      } else {
        this.learningData = this.createDefaultLearningData();
        this.saveLearningData();
      }
    } catch (error) {
      console.error('Error loading learning data:', error.message);
      this.learningData = this.createDefaultLearningData();
    }
  }

  /**
   * Load correction statistics
   */
  loadCorrectionStats() {
    try {
      if (fs.existsSync(this.correctionStatsPath)) {
        this.correctionStats = JSON.parse(fs.readFileSync(this.correctionStatsPath, 'utf8'));
      } else {
        this.correctionStats = this.createDefaultCorrectionStats();
        this.saveCorrectionStats();
      }
    } catch (error) {
      console.error('Error loading correction stats:', error.message);
      this.correctionStats = this.createDefaultCorrectionStats();
    }
  }

  /**
   * Create default learning data structure
   */
  createDefaultLearningData() {
    return {
      totalCorrections: 0,
      corrections: {},
      patterns: {},
      contextRules: {},
      confidenceScores: {},
      lastUpdated: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  /**
   * Create default correction statistics
   */
  createDefaultCorrectionStats() {
    return {
      totalProcessed: 0,
      totalCorrected: 0,
      accuracyRate: 0,
      confidenceScores: [],
      fieldAccuracy: {},
      patternSuccess: {},
      learningProgress: {},
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Save learning data to file
   */
  saveLearningData() {
    try {
      const dir = path.dirname(this.learningDataPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      this.learningData.lastUpdated = new Date().toISOString();
      fs.writeFileSync(this.learningDataPath, JSON.stringify(this.learningData, null, 2));
    } catch (error) {
      console.error('Error saving learning data:', error.message);
    }
  }

  /**
   * Save correction statistics
   */
  saveCorrectionStats() {
    try {
      const dir = path.dirname(this.correctionStatsPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      this.correctionStats.lastUpdated = new Date().toISOString();
      fs.writeFileSync(this.correctionStatsPath, JSON.stringify(this.correctionStats, null, 2));
    } catch (error) {
      console.error('Error saving correction stats:', error.message);
    }
  }

  /**
   * Load and analyze common errors from Excel file
   */
  async loadCommonErrors() {
    try {
      console.log('📊 Loading common errors from Excel file...');
      
      if (!fs.existsSync(this.commonErrorsPath)) {
        throw new Error('Common errors Excel file not found');
      }

      const workbook = XLSX.readFile(this.commonErrorsPath);
      const sheetNames = workbook.SheetNames;
      const worksheet = workbook.Sheets[sheetNames[0]];
      
      // Convert to JSON with headers
      const rawData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',
        blankrows: false
      });

      if (rawData.length < 2) {
        throw new Error('Insufficient data in Excel file (need at least header + 1 row)');
      }

      const headers = rawData[0];
      const dataRows = rawData.slice(1);
      
      console.log(`📊 Found ${dataRows.length} error-correction pairs with ${headers.length} columns`);
      
      // Analyze headers to find error and correction columns
      const columnMapping = this.analyzeColumnHeaders(headers);
      
      // Process error-correction pairs
      const errorCorrections = this.processErrorCorrections(dataRows, columnMapping);
      
      // Learn from the common errors
      await this.learnFromCommonErrors(errorCorrections);
      
      console.log(`✅ Successfully loaded and learned from ${errorCorrections.length} error-correction pairs`);
      
      return errorCorrections;
      
    } catch (error) {
      console.error('❌ Error loading common errors:', error.message);
      return [];
    }
  }

  /**
   * Analyze Excel headers to find error and correction columns
   */
  analyzeColumnHeaders(headers) {
    const mapping = {
      error: null,
      corrected: null,
      field: null,
      context: null,
      frequency: null
    };

    headers.forEach((header, index) => {
      const cleanHeader = header.toString().toLowerCase().trim();
      
      if (cleanHeader.includes('error') || cleanHeader.includes('wrong') || cleanHeader.includes('incorrect')) {
        mapping.error = index;
      } else if (cleanHeader.includes('correct') || cleanHeader.includes('right') || cleanHeader.includes('fixed')) {
        mapping.corrected = index;
      } else if (cleanHeader.includes('field') || cleanHeader.includes('column') || cleanHeader.includes('attribute')) {
        mapping.field = index;
      } else if (cleanHeader.includes('context') || cleanHeader.includes('situation') || cleanHeader.includes('condition')) {
        mapping.context = index;
      } else if (cleanHeader.includes('frequency') || cleanHeader.includes('count') || cleanHeader.includes('occurrence')) {
        mapping.frequency = index;
      }
    });

    // If we can't find specific columns, make educated guesses
    if (mapping.error === null && mapping.corrected === null) {
      if (headers.length >= 2) {
        mapping.error = 0;
        mapping.corrected = 1;
      }
    }

    console.log('🔍 Column mapping analysis:', mapping);
    return mapping;
  }

  /**
   * Process error-correction pairs from Excel data
   */
  processErrorCorrections(dataRows, columnMapping) {
    const errorCorrections = [];
    
    dataRows.forEach((row, rowIndex) => {
      try {
        const error = row[columnMapping.error] || '';
        const corrected = row[columnMapping.corrected] || '';
        const field = columnMapping.field !== null ? row[columnMapping.field] || '' : '';
        const context = columnMapping.context !== null ? row[columnMapping.context] || '' : '';
        const frequency = columnMapping.frequency !== null ? parseInt(row[columnMapping.frequency]) || 1 : 1;
        
        if (error && corrected && error !== corrected) {
          errorCorrections.push({
            error: error.toString().trim(),
            corrected: corrected.toString().trim(),
            field: field.toString().trim(),
            context: context.toString().trim(),
            frequency: frequency,
            rowIndex: rowIndex + 2,
            patterns: this.extractPatterns(error, corrected),
            similarity: this.calculateSimilarity(error, corrected)
          });
        }
      } catch (error) {
        console.warn(`⚠️  Skipping row ${rowIndex + 2}: ${error.message}`);
      }
    });
    
    return errorCorrections;
  }

  /**
   * Extract patterns from error-correction pairs
   */
  extractPatterns(error, corrected) {
    const patterns = {
      characterSubstitutions: [],
      insertions: [],
      deletions: [],
      transpositions: [],
      capitalization: false,
      spacing: false,
      punctuation: false
    };

    const errorLower = error.toLowerCase();
    const correctedLower = corrected.toLowerCase();
    
    // Character substitutions
    for (let i = 0; i < Math.min(error.length, corrected.length); i++) {
      if (errorLower[i] !== correctedLower[i]) {
        patterns.characterSubstitutions.push({
          position: i,
          from: error[i],
          to: corrected[i],
          context: this.getCharacterContext(error, i)
        });
      }
    }
    
    // Insertions and deletions
    if (error.length < corrected.length) {
      patterns.insertions.push({
        count: corrected.length - error.length,
        positions: this.findInsertionPositions(error, corrected)
      });
    } else if (error.length > corrected.length) {
      patterns.deletions.push({
        count: error.length - corrected.length,
        positions: this.findDeletionPositions(error, corrected)
      });
    }
    
    // Transpositions
    patterns.transpositions = this.findTranspositions(error, corrected);
    
    // Other patterns
    patterns.capitalization = error !== corrected && errorLower === correctedLower;
    patterns.spacing = error.replace(/\s+/g, '') !== corrected.replace(/\s+/g, '');
    patterns.punctuation = this.hasPunctuationDifference(error, corrected);
    
    return patterns;
  }

  /**
   * Get character context for pattern analysis
   */
  getCharacterContext(text, position) {
    const start = Math.max(0, position - 2);
    const end = Math.min(text.length, position + 3);
    return text.substring(start, end);
  }

  /**
   * Find insertion positions
   */
  findInsertionPositions(error, corrected) {
    const positions = [];
    let errorIndex = 0;
    
    for (let i = 0; i < corrected.length; i++) {
      if (errorIndex < error.length && error[errorIndex] === corrected[i]) {
        errorIndex++;
      } else {
        positions.push(i);
      }
    }
    
    return positions;
  }

  /**
   * Find deletion positions
   */
  findDeletionPositions(error, corrected) {
    const positions = [];
    let correctedIndex = 0;
    
    for (let i = 0; i < error.length; i++) {
      if (correctedIndex < corrected.length && corrected[correctedIndex] === error[i]) {
        correctedIndex++;
      } else {
        positions.push(i);
      }
    }
    
    return positions;
  }

  /**
   * Find transpositions
   */
  findTranspositions(error, corrected) {
    const transpositions = [];
    
    for (let i = 0; i < error.length - 1; i++) {
      if (i < corrected.length - 1) {
        if (error[i] === corrected[i + 1] && error[i + 1] === corrected[i]) {
          transpositions.push({
            position: i,
            characters: error.substring(i, i + 2)
          });
        }
      }
    }
    
    return transpositions;
  }

  /**
   * Check for punctuation differences
   */
  hasPunctuationDifference(error, corrected) {
    const errorPunct = error.replace(/[^.,!?;:]/g, '');
    const correctedPunct = corrected.replace(/[^.,!?;:]/g, '');
    return errorPunct !== correctedPunct;
  }

  /**
   * Calculate similarity between error and correction
   */
  calculateSimilarity(error, corrected) {
    // Simple similarity calculation
    const errorLower = error.toLowerCase();
    const correctedLower = corrected.toLowerCase();
    
    if (errorLower === correctedLower) return 1.0;
    
    const maxLength = Math.max(error.length, corrected.length);
    let matches = 0;
    
    for (let i = 0; i < Math.min(error.length, corrected.length); i++) {
      if (errorLower[i] === correctedLower[i]) {
        matches++;
      }
    }
    
    return matches / maxLength;
  }

  /**
   * Learn from common errors to improve correction
   */
  async learnFromCommonErrors(errorCorrections) {
    console.log('🧠 Learning from common errors to improve correction accuracy...');
    
    errorCorrections.forEach(correction => {
      // Add to learning data
      const key = `${correction.field}:${correction.context}`;
      
      if (!this.learningData.corrections[key]) {
        this.learningData.corrections[key] = [];
      }
      
      this.learningData.corrections[key].push({
        error: correction.error,
        corrected: correction.corrected,
        patterns: correction.patterns,
        similarity: correction.similarity,
        frequency: correction.frequency,
        learnedAt: new Date().toISOString()
      });
      
      // Learn patterns
      this.learnPatterns(correction);
      
      // Learn context rules
      this.learnContextRules(correction);
      
      this.learningData.totalCorrections++;
    });
    
    // Update confidence scores
    this.updateConfidenceScores();
    
    // Save learning data
    this.saveLearningData();
    
    console.log(`✅ Learned ${errorCorrections.length} new correction patterns`);
  }

  /**
   * Learn patterns from corrections
   */
  learnPatterns(correction) {
    const patterns = correction.patterns;
    
    // Character substitution patterns
    patterns.characterSubstitutions.forEach(sub => {
      const patternKey = `sub_${sub.from}_${sub.to}`;
      if (!this.learningData.patterns[patternKey]) {
        this.learningData.patterns[patternKey] = {
          count: 0,
          contexts: [],
          confidence: 0
        };
      }
      
      this.learningData.patterns[patternKey].count++;
      this.learningData.patterns[patternKey].contexts.push(correction.context);
    });
    
    // Other pattern types
    if (patterns.capitalization) {
      this.learnPattern('capitalization', correction);
    }
    if (patterns.spacing) {
      this.learnPattern('spacing', correction);
    }
    if (patterns.punctuation) {
      this.learnPattern('punctuation', correction);
    }
  }

  /**
   * Learn a specific pattern type
   */
  learnPattern(patternType, correction) {
    const patternKey = patternType;
    
    if (!this.learningData.patterns[patternKey]) {
      this.learningData.patterns[patternKey] = {
        count: 0,
        contexts: [],
        confidence: 0
      };
    }
    
    this.learningData.patterns[patternKey].count++;
    this.learningData.patterns[patternKey].contexts.push(correction.context);
  }

  /**
   * Learn context rules
   */
  learnContextRules(correction) {
    const contextKey = correction.context || 'general';
    
    if (!this.learningData.contextRules[contextKey]) {
      this.learningData.contextRules[contextKey] = {
        corrections: [],
        fieldSpecific: {},
        confidence: 0
      };
    }
    
    this.learningData.contextRules[contextKey].corrections.push({
      error: correction.error,
      corrected: correction.corrected,
      field: correction.field,
      frequency: correction.frequency
    });
    
    // Field-specific rules
    if (correction.field) {
      if (!this.learningData.contextRules[contextKey].fieldSpecific[correction.field]) {
        this.learningData.contextRules[contextKey].fieldSpecific[correction.field] = [];
      }
      
      this.learningData.contextRules[contextKey].fieldSpecific[correction.field].push({
        error: correction.error,
        corrected: correction.corrected,
        frequency: correction.frequency
      });
    }
  }

  /**
   * Update confidence scores based on learning
   */
  updateConfidenceScores() {
    // Update pattern confidence
    Object.keys(this.learningData.patterns).forEach(patternKey => {
      const pattern = this.learningData.patterns[patternKey];
      pattern.confidence = Math.min(1.0, pattern.count / 10); // Higher count = higher confidence
    });
    
    // Update context rule confidence
    Object.keys(this.learningData.contextRules).forEach(contextKey => {
      const context = this.learningData.contextRules[contextKey];
      context.confidence = Math.min(1.0, context.corrections.length / 5);
    });
  }

  /**
   * Correct typos in data using learned patterns
   */
  async correctTypos(data, field = null, context = null) {
    console.log(`🔧 Correcting typos in data (${data.length} records)...`);
    
    const startTime = Date.now();
    let totalCorrected = 0;
    let totalProcessed = 0;
    const corrections = [];
    
    data.forEach((record, recordIndex) => {
      totalProcessed++;
      
      if (typeof record === 'object') {
        // Process object fields
        Object.keys(record).forEach(key => {
          if (typeof record[key] === 'string' && record[key].trim()) {
            const correction = this.correctSingleValue(record[key], key, context);
            
            if (correction.corrected !== record[key]) {
              record[key] = correction.corrected;
              totalCorrected++;
              
              corrections.push({
                recordIndex,
                field: key,
                original: correction.original,
                corrected: correction.corrected,
                confidence: correction.confidence,
                method: correction.method
              });
            }
          }
        });
      } else if (typeof record === 'string') {
        // Process string directly
        const correction = this.correctSingleValue(record, field, context);
        
        if (correction.corrected !== record) {
          data[recordIndex] = correction.corrected;
          totalCorrected++;
          
          corrections.push({
            recordIndex,
            field: field || 'unknown',
            original: correction.original,
            corrected: correction.corrected,
            confidence: correction.confidence,
            method: correction.method
          });
        }
      }
    });
    
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    // Update statistics
    this.updateCorrectionStats(totalProcessed, totalCorrected, corrections);
    
    console.log(`✅ Typo correction completed:`);
    console.log(`   📊 Records processed: ${totalProcessed}`);
    console.log(`   🔧 Corrections made: ${totalCorrected}`);
    console.log(`   ⏱️  Processing time: ${processingTime}ms`);
    console.log(`   📈 Accuracy rate: ${((totalCorrected / totalProcessed) * 100).toFixed(2)}%`);
    
    return {
      data,
      corrections,
      stats: {
        totalProcessed,
        totalCorrected,
        processingTime,
        accuracyRate: (totalCorrected / totalProcessed) * 100
      }
    };
  }

  /**
   * Correct a single value using learned patterns
   */
  correctSingleValue(value, field, context) {
    const original = value;
    let corrected = value;
    let confidence = 0;
    let method = 'none';
    
    // Try exact match corrections first
    const exactMatch = this.findExactMatch(value, field, context);
    if (exactMatch) {
      corrected = exactMatch.corrected;
      confidence = exactMatch.confidence;
      method = 'exact_match';
    } else {
      // Try pattern-based corrections
      const patternCorrection = this.applyPatternCorrections(value, field, context);
      if (patternCorrection.corrected !== value) {
        corrected = patternCorrection.corrected;
        confidence = patternCorrection.confidence;
        method = 'pattern_based';
      }
      
      // Try fuzzy matching
      if (confidence < 0.7) {
        const fuzzyCorrection = this.applyFuzzyCorrections(value, field, context);
        if (fuzzyCorrection.confidence > confidence) {
          corrected = fuzzyCorrection.corrected;
          confidence = fuzzyCorrection.confidence;
          method = 'fuzzy_match';
        }
      }
    }
    
    return {
      original,
      corrected,
      confidence,
      method
    };
  }

  /**
   * Find exact match corrections
   */
  findExactMatch(value, field, context) {
    const contextKey = context || 'general';
    
    if (this.learningData.contextRules[contextKey]) {
      const contextRule = this.learningData.contextRules[contextKey];
      
      // Check field-specific corrections first
      if (field && contextRule.fieldSpecific[field]) {
        const fieldCorrection = contextRule.fieldSpecific[field].find(
          c => c.error.toLowerCase() === value.toLowerCase()
        );
        
        if (fieldCorrection) {
          return {
            corrected: fieldCorrection.corrected,
            confidence: 0.95,
            frequency: fieldCorrection.frequency
          };
        }
      }
      
      // Check general context corrections
      const generalCorrection = contextRule.corrections.find(
        c => c.error.toLowerCase() === value.toLowerCase()
      );
      
      if (generalCorrection) {
        return {
          corrected: generalCorrection.corrected,
          confidence: 0.9,
          frequency: generalCorrection.frequency
        };
      }
    }
    
    return null;
  }

  /**
   * Apply pattern-based corrections
   */
  applyPatternCorrections(value, field, context) {
    let corrected = value;
    let confidence = 0;
    
    // Apply learned patterns
    Object.keys(this.learningData.patterns).forEach(patternKey => {
      const pattern = this.learningData.patterns[patternKey];
      
      if (pattern.confidence > 0.5) {
        const patternCorrection = this.applyPattern(value, patternKey, pattern);
        
        if (patternCorrection.corrected !== value && patternCorrection.confidence > confidence) {
          corrected = patternCorrection.corrected;
          confidence = patternCorrection.confidence;
        }
      }
    });
    
    return { corrected, confidence };
  }

  /**
   * Apply a specific pattern
   */
  applyPattern(value, patternKey, pattern) {
    let corrected = value;
    let confidence = pattern.confidence;
    
    if (patternKey.startsWith('sub_')) {
      // Character substitution pattern
      const parts = patternKey.split('_');
      if (parts.length === 3) {
        const from = parts[1];
        const to = parts[2];
        corrected = value.replace(new RegExp(from, 'gi'), to);
      }
    } else if (patternKey === 'capitalization') {
      // Capitalization pattern
      corrected = this.fixCapitalization(value);
      confidence *= 0.8; // Lower confidence for capitalization fixes
    } else if (patternKey === 'spacing') {
      // Spacing pattern
      corrected = this.fixSpacing(value);
      confidence *= 0.7; // Lower confidence for spacing fixes
    }
    
    return { corrected, confidence };
  }

  /**
   * Fix capitalization issues
   */
  fixCapitalization(value) {
    // Common capitalization rules
    const words = value.split(' ');
    const corrected = words.map(word => {
      if (word.length === 0) return word;
      
      // Keep common abbreviations in uppercase
      if (['MBBS', 'MD', 'MS', 'BDS', 'MDS', 'DNB', 'PhD', 'Dr', 'Prof'].includes(word.toUpperCase())) {
        return word.toUpperCase();
      }
      
      // Capitalize first letter, lowercase rest
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });
    
    return corrected.join(' ');
  }

  /**
   * Fix spacing issues
   */
  fixSpacing(value) {
    // Remove multiple spaces
    let corrected = value.replace(/\s+/g, ' ');
    
    // Fix spacing around punctuation
    corrected = corrected.replace(/\s*([.,!?;:])\s*/g, '$1 ');
    
    // Trim leading/trailing spaces
    corrected = corrected.trim();
    
    return corrected;
  }

  /**
   * Apply fuzzy corrections
   */
  applyFuzzyCorrections(value, field, context) {
    let bestCorrection = { corrected: value, confidence: 0 };
    
    // Search through all learned corrections
    Object.keys(this.learningData.corrections).forEach(contextKey => {
      this.learningData.corrections[contextKey].forEach(correction => {
        const similarity = this.calculateSimilarity(value, correction.error);
        
        if (similarity > 0.8 && similarity > bestCorrection.confidence) {
          bestCorrection = {
            corrected: correction.corrected,
            confidence: similarity * 0.9 // Slightly lower confidence for fuzzy matches
          };
        }
      });
    });
    
    return bestCorrection;
  }

  /**
   * Update correction statistics
   */
  updateCorrectionStats(totalProcessed, totalCorrected, corrections) {
    this.correctionStats.totalProcessed += totalProcessed;
    this.correctionStats.totalCorrected += totalCorrected;
    this.correctionStats.accuracyRate = (this.correctionStats.totalCorrected / this.correctionStats.totalProcessed) * 100;
    
    // Update field accuracy
    corrections.forEach(correction => {
      if (!this.correctionStats.fieldAccuracy[correction.field]) {
        this.correctionStats.fieldAccuracy[correction.field] = { total: 0, corrected: 0 };
      }
      
      this.correctionStats.fieldAccuracy[correction.field].total++;
      if (correction.corrected !== correction.original) {
        this.correctionStats.fieldAccuracy[correction.field].corrected++;
      }
    });
    
    // Update pattern success rates
    corrections.forEach(correction => {
      if (!this.correctionStats.patternSuccess[correction.method]) {
        this.correctionStats.patternSuccess[correction.method] = { total: 0, successful: 0 };
      }
      
      this.correctionStats.patternSuccess[correction.method].total++;
      if (correction.corrected !== correction.original) {
        this.correctionStats.patternSuccess[correction.method].successful++;
      }
    });
    
    // Update learning progress
    this.correctionStats.learningProgress = {
      totalPatterns: Object.keys(this.learningData.patterns).length,
      totalContextRules: Object.keys(this.learningData.contextRules).length,
      totalCorrections: this.learningData.totalCorrections,
      lastLearningUpdate: this.learningData.lastUpdated
    };
    
    this.saveCorrectionStats();
  }

  /**
   * Generate comprehensive correction report
   */
  generateCorrectionReport() {
    const report = {
      timestamp: new Date().toISOString(),
      learningData: this.learningData,
      correctionStats: this.correctionStats,
      systemHealth: this.assessSystemHealth(),
      recommendations: this.generateRecommendations()
    };
    
    return report;
  }

  /**
   * Assess system health and performance
   */
  assessSystemHealth() {
    const health = {
      learningEfficiency: 0,
      correctionAccuracy: 0,
      patternCoverage: 0,
      overallScore: 0
    };
    
    // Learning efficiency
    health.learningEfficiency = Math.min(1.0, this.learningData.totalCorrections / 100);
    
    // Correction accuracy
    health.correctionAccuracy = this.correctionStats.accuracyRate / 100;
    
    // Pattern coverage
    health.patternCoverage = Math.min(1.0, Object.keys(this.learningData.patterns).length / 50);
    
    // Overall score
    health.overallScore = (health.learningEfficiency + health.correctionAccuracy + health.patternCoverage) / 3;
    
    return health;
  }

  /**
   * Generate improvement recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    
    if (this.learningData.totalCorrections < 50) {
      recommendations.push('Add more error-correction examples to improve learning');
    }
    
    if (this.correctionStats.accuracyRate < 80) {
      recommendations.push('Review and refine correction patterns for better accuracy');
    }
    
    if (Object.keys(this.learningData.patterns).length < 20) {
      recommendations.push('Diversify error types to improve pattern recognition');
    }
    
    return recommendations;
  }

  /**
   * Export learning data for analysis
   */
  exportLearningData() {
    const exportPath = path.join(__dirname, '../data/common_error/learning-export.json');
    const exportData = {
      timestamp: new Date().toISOString(),
      learningData: this.learningData,
      correctionStats: this.correctionStats,
      systemHealth: this.assessSystemHealth()
    };
    
    try {
      fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
      console.log(`📤 Learning data exported to: ${exportPath}`);
      return exportPath;
    } catch (error) {
      console.error('Error exporting learning data:', error.message);
      return null;
    }
  }
}

// CLI interface
async function main() {
  const corrector = new IntelligentTypoCorrector();
  const command = process.argv[2];
  
  switch (command) {
    case 'load':
      await corrector.loadCommonErrors();
      break;
      
    case 'correct':
      const filePath = process.argv[3];
      if (filePath) {
        // Load and correct data from file
        try {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          const result = await corrector.correctTypos(data);
          console.log('✅ Correction completed successfully');
        } catch (error) {
          console.error('Error processing file:', error.message);
        }
      } else {
        console.error('Please specify file path to correct');
      }
      break;
      
    case 'report':
      const report = corrector.generateCorrectionReport();
      console.log('📊 Correction System Report\n');
      console.log('─'.repeat(80));
      console.log(`System Health Score: ${(report.systemHealth.overallScore * 100).toFixed(1)}%`);
      console.log(`Total Corrections Learned: ${report.learningData.totalCorrections}`);
      console.log(`Correction Accuracy: ${report.correctionStats.accuracyRate.toFixed(2)}%`);
      console.log(`Pattern Coverage: ${Object.keys(report.learningData.patterns).length} patterns`);
      console.log('─'.repeat(80));
      break;
      
    case 'export':
      corrector.exportLearningData();
      break;
      
    default:
      console.log('🧠 Intelligent Typo Corrector\n');
      console.log('Usage:');
      console.log('  node scripts/intelligent-typo-corrector.js load           - Load and learn from common errors');
      console.log('  node scripts/intelligent-typo-corrector.js correct <file> - Correct typos in data file');
      console.log('  node scripts/intelligent-typo-corrector.js report         - Generate system report');
      console.log('  node scripts/intelligent-typo-corrector.js export         - Export learning data');
      break;
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = IntelligentTypoCorrector;
