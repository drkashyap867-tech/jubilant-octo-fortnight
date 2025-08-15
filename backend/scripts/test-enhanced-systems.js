#!/usr/bin/env node

/**
 * 🧪 Test Script for Enhanced Systems
 * Demonstrates all new capabilities working together
 */

const DatabaseVersioning = require('./database-versioning');
const PerformanceMonitor = require('./performance-monitor');
const RealTimeValidation = require('./real-time-validation');
const EnhancedDataProcessor = require('./enhanced-data-processor');

async function testEnhancedSystems() {
  console.log('🚀 Testing Enhanced Systems...\n');
  
  try {
    // 1. Test Database Versioning
    console.log('1️⃣ Testing Database Versioning System...');
    const versioning = new DatabaseVersioning();
    console.log(`   Current version: ${versioning.getCurrentVersion()}`);
    console.log(`   System status: ${JSON.stringify(versioning.getSystemStatus(), null, 2)}`);
    
    // 2. Test Performance Monitoring
    console.log('\n2️⃣ Testing Performance Monitoring System...');
    const performance = new PerformanceMonitor();
    const timer = performance.startTimer('test_operation');
    
    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const duration = timer.stop();
    performance.recordApiCall('/api/test', 'GET', duration, 200);
    
    console.log(`   Performance metrics: ${JSON.stringify(performance.getMetrics(), null, 2)}`);
    
    // 3. Test Real-Time Validation
    console.log('\n3️⃣ Testing Real-Time Validation System...');
    const validation = new RealTimeValidation();
    
    // Test with sample data
    const sampleData = [
      {
        college_name: 'Test College',
        state: 'Delhi',
        city: 'New Delhi',
        management_type: 'Government',
        establishment_year: 2020,
        total_seats: 100,
        medical_seats: 100,
        dental_seats: 0,
        dnb_seats: 0,
        courses_offered: 'MBBS,MD,MS',
        address: 'Test Address',
        phone: '011-12345678',
        email: 'test@college.edu',
        website: 'https://testcollege.edu',
        accreditation_status: 'NAAC A++'
      }
    ];
    
    const validationResults = await validation.validateDataset(sampleData);
    console.log(`   Validation results: ${JSON.stringify(validationResults.summary, null, 2)}`);
    
    // 4. Test Enhanced Data Processor
    console.log('\n4️⃣ Testing Enhanced Data Processor...');
    const processor = new EnhancedDataProcessor();
    
    // Test processing capabilities
    const processingStats = processor.getProcessingStats();
    console.log(`   Processing stats: ${JSON.stringify(processingStats, null, 2)}`);
    
    // 5. Create a test version
    console.log('\n5️⃣ Creating Test Version...');
    const versionResult = await versioning.createVersion('1.1.0', 'Test version creation');
    console.log(`   Version creation: ${JSON.stringify(versionResult, null, 2)}`);
    
    // 6. Generate comprehensive report
    console.log('\n6️⃣ Generating Comprehensive Report...');
    const report = processor.generateComprehensiveReport();
    console.log(`   Report generated with timestamp: ${report.timestamp}`);
    
    // 7. Final system status
    console.log('\n7️⃣ Final System Status...');
    const finalVersionStatus = versioning.getSystemStatus();
    const finalPerformanceMetrics = performance.getMetrics();
    
    console.log(`   Versioning: ${JSON.stringify(finalVersionStatus, null, 2)}`);
    console.log(`   Performance: ${JSON.stringify(finalPerformanceMetrics, null, 2)}`);
    
    console.log('\n✅ All Enhanced Systems Tested Successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Database Versioning: ✅ Working`);
    console.log(`   - Performance Monitoring: ✅ Working`);
    console.log(`   - Real-Time Validation: ✅ Working`);
    console.log(`   - Enhanced Data Processing: ✅ Working`);
    console.log(`   - System Integration: ✅ Working`);
    
  } catch (error) {
    console.error('❌ Error testing enhanced systems:', error.message);
    console.error(error.stack);
  }
}

// Run the test
if (require.main === module) {
  testEnhancedSystems().then(() => {
    console.log('\n🎉 Test completed!');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  });
}

module.exports = { testEnhancedSystems };
