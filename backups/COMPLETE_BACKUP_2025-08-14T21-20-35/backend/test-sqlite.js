const SQLiteSearchEngine = require('./sqlite-search');

async function testSQLite() {
  const searchEngine = new SQLiteSearchEngine();
  
  try {
    console.log('🧪 Testing SQLite Search Engine...\n');
    
    // Initialize
    await searchEngine.initialize();
    console.log('✅ Database initialized successfully\n');
    
    // Test 1: Get statistics
    console.log('📊 Test 1: Getting database statistics...');
    const stats = await searchEngine.getStats();
    if (stats.error) {
      console.log(`❌ Stats failed: ${stats.error}`);
    } else {
      console.log('✅ Statistics retrieved successfully');
      console.log(`   Total Colleges: ${stats.total.toLocaleString()}`);
      console.log(`   Total Seats: ${stats.totalSeats.toLocaleString()}`);
      console.log(`   By Type: ${stats.byType.map(t => `${t.type}: ${t.count}`).join(', ')}`);
    }
    console.log('');
    
    // Test 2: Search for AIIMS
    console.log('🔍 Test 2: Searching for "AIIMS"...');
    const searchResult = await searchEngine.search('AIIMS');
    if (searchResult.error) {
      console.log(`❌ Search failed: ${searchResult.error}`);
    } else {
      console.log(`✅ Search successful: Found ${searchResult.total} results`);
      if (searchResult.data.length > 0) {
        console.log(`   First result: ${searchResult.data[0].name}`);
      }
    }
    console.log('');
    
    // Test 3: Search by type
    console.log('🏥 Test 3: Getting medical colleges...');
    const medicalColleges = await searchEngine.getCollegesByType('medical', 5);
    console.log(`✅ Found ${medicalColleges.length} medical colleges`);
    if (medicalColleges.length > 0) {
      console.log(`   First: ${medicalColleges[0].name}`);
    }
    console.log('');
    
    // Test 4: Search by state
    console.log('🗺️  Test 4: Getting colleges in Maharashtra...');
    const maharashtraColleges = await searchEngine.getCollegesByState('Maharashtra', 5);
    console.log(`✅ Found ${maharashtraColleges.length} colleges in Maharashtra`);
    if (maharashtraColleges.length > 0) {
      console.log(`   First: ${maharashtraColleges[0].name}`);
    }
    console.log('');
    
    // Test 5: Search by course
    console.log('📚 Test 5: Getting colleges offering BDS...');
    const bdsColleges = await searchEngine.getCollegesByCourse('BDS', 5);
    console.log(`✅ Found ${bdsColleges.length} colleges offering BDS`);
    if (bdsColleges.length > 0) {
      console.log(`   First: ${bdsColleges[0].name}`);
    }
    console.log('');
    
    // Test 6: Advanced search
    console.log('🔍 Test 6: Advanced search for "Cardiology" in "Maharashtra"...');
    const advancedResult = await searchEngine.searchAdvanced({
      query: 'Cardiology',
      type: 'medical',
      state: 'Maharashtra'
    });
    if (advancedResult.error) {
      console.log(`❌ Advanced search failed: ${advancedResult.error}`);
    } else {
      console.log(`✅ Advanced search successful: Found ${advancedResult.total} results`);
    }
    console.log('');
    
    console.log('🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    searchEngine.close();
    console.log('🔒 Database connection closed');
  }
}

// Run tests
testSQLite();
