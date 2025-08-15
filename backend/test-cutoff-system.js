const CutoffRanksSetup = require('./cutoff-ranks-setup');

async function testCutoffSystem() {
    console.log('🧪 Testing Cutoff Ranks System...\n');
    
    const db = new CutoffRanksSetup();
    
    try {
        // Initialize database
        await db.initialize();
        console.log('✅ Database initialized');
        
        // Test 1: Get cutoff ranks for college 1, course 1
        console.log('\n📊 Test 1: Get cutoff ranks for College 1, Course 1');
        const cutoffRanks = await db.getCutoffRanks(1, 1);
        console.log(`Found ${cutoffRanks.length} cutoff records:`);
        cutoffRanks.forEach(record => {
            console.log(`  - ${record.counselling_type} ${record.round_name}: ${record.category} - Rank ${record.cutoff_rank} (${record.cutoff_percentile}%)`);
        });
        
        // Test 2: Get cutoff ranks filtered by counselling type
        console.log('\n📊 Test 2: Get AIQ cutoff ranks only');
        const aiqRanks = await db.getCutoffRanks(1, 1, 'AIQ');
        console.log(`Found ${aiqRanks.length} AIQ records:`);
        aiqRanks.forEach(record => {
            console.log(`  - Round ${record.round_number}: ${record.category} - Rank ${record.cutoff_rank}`);
        });
        
        // Test 3: Get cutoff ranks filtered by year
        console.log('\n📊 Test 3: Get 2024 cutoff ranks only');
        const yearRanks = await db.getCutoffRanks(1, 1, null, 2024);
        console.log(`Found ${yearRanks.length} 2024 records:`);
        yearRanks.forEach(record => {
            console.log(`  - ${record.counselling_type} Round ${record.round_number}: ${record.category} - Rank ${record.cutoff_rank}`);
        });
        
        // Test 4: Search cutoff ranks
        console.log('\n📊 Test 4: Search cutoff ranks with filters');
        const searchResults = await db.searchCutoffRanks('AIQ', { counsellingType: 'AIQ', year: 2024 });
        console.log(`Search found ${searchResults.length} results:`);
        searchResults.forEach(record => {
            console.log(`  - ${record.counselling_type} ${record.round_name}: ${record.category} - Rank ${record.cutoff_rank}`);
        });
        
        // Test 5: Get statistics
        console.log('\n📊 Test 5: Database statistics');
        const stats = await db.runQueryAll(`
            SELECT 
                COUNT(*) as total_records,
                COUNT(DISTINCT college_id) as unique_colleges,
                COUNT(DISTINCT course_id) as unique_courses,
                COUNT(DISTINCT counselling_type) as counselling_types,
                COUNT(DISTINCT counselling_year) as years_covered
            FROM cutoff_ranks
        `);
        console.log('Database stats:', stats[0]);
        
        console.log('\n🎯 All tests completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await db.close();
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    testCutoffSystem();
}

module.exports = { testCutoffSystem };
