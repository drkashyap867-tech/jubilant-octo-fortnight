const CutoffRanksSetup = require('./cutoff-ranks-setup');

async function testYearFiltering() {
    console.log('🧪 Testing Year Filtering System...\n');
    
    const db = new CutoffRanksSetup();
    
    try {
        await db.initialize();
        console.log('✅ Database initialized');
        
        // Test 1: Get all data
        console.log('\n📊 Test 1: All Data (No Filters)');
        const allData = await db.getCutoffRanks(1, 1);
        console.log(`Total records: ${allData.length}`);
        allData.forEach(record => {
            console.log(`  - ${record.counselling_year} ${record.counselling_type} ${record.round_name}: ${record.category} - Rank ${record.cutoff_rank}`);
        });
        
        // Test 2: Filter by year 2024
        console.log('\n📊 Test 2: 2024 Data Only');
        const data2024 = await db.getCutoffRanks(1, 1, null, 2024);
        console.log(`2024 records: ${data2024.length}`);
        data2024.forEach(record => {
            console.log(`  - ${record.counselling_type} ${record.round_name}: ${record.category} - Rank ${record.cutoff_rank}`);
        });
        
        // Test 3: Filter by year 2023
        console.log('\n📊 Test 3: 2023 Data Only');
        const data2023 = await db.getCutoffRanks(1, 1, null, 2023);
        console.log(`2023 records: ${data2023.length}`);
        data2023.forEach(record => {
            console.log(`  - ${record.counselling_type} ${record.round_name}: ${record.category} - Rank ${record.cutoff_rank}`);
        });
        
        // Test 4: Filter by year + counselling type
        console.log('\n📊 Test 4: 2024 AIQ Data Only');
        const data2024AIQ = await db.getCutoffRanks(1, 1, 'AIQ', 2024);
        console.log(`2024 AIQ records: ${data2024AIQ.length}`);
        data2024AIQ.forEach(record => {
            console.log(`  - ${record.round_name}: ${record.category} - Rank ${record.cutoff_rank}`);
        });
        
        // Test 5: Filter by year + counselling type + round
        console.log('\n📊 Test 5: 2023 AIQ Round 1 Data Only');
        const data2023AIQRound1 = await db.getCutoffRanks(1, 1, 'AIQ', 2023);
        const round1Data = data2023AIQRound1.filter(record => record.round_number === 1);
        console.log(`2023 AIQ Round 1 records: ${round1Data.length}`);
        round1Data.forEach(record => {
            console.log(`  - ${record.category} - Rank ${record.cutoff_rank} (${record.cutoff_percentile}%)`);
        });
        
        // Test 6: Year comparison
        console.log('\n📊 Test 6: Year Comparison for UR Category');
        const urData2023 = data2023.filter(record => record.category === 'UR');
        const urData2024 = data2024.filter(record => record.category === 'UR');
        
        console.log('UR Category Comparison:');
        console.log('  2023:', urData2023.map(r => `Round ${r.round_number}: Rank ${r.cutoff_rank}`).join(', '));
        console.log('  2024:', urData2024.map(r => `Round ${r.round_number}: Rank ${r.cutoff_rank}`).join(', '));
        
        // Test 7: Statistics by year
        console.log('\n📊 Test 7: Statistics by Year');
        const yearStats = await db.runQueryAll(`
            SELECT 
                counselling_year,
                COUNT(*) as total_records,
                COUNT(DISTINCT counselling_type) as counselling_types,
                COUNT(DISTINCT round_number) as rounds,
                AVG(cutoff_rank) as avg_cutoff_rank,
                MIN(cutoff_rank) as min_cutoff_rank,
                MAX(cutoff_rank) as max_cutoff_rank
            FROM cutoff_ranks 
            WHERE college_id = 1 AND course_id = 1
            GROUP BY counselling_year
            ORDER BY counselling_year DESC
        `);
        
        yearStats.forEach(year => {
            console.log(`  ${year.counselling_year}: ${year.total_records} records, ${year.counselling_types} types, ${year.rounds} rounds`);
            console.log(`    Cutoff Range: ${year.min_cutoff_rank} - ${year.max_cutoff_rank} (Avg: ${Math.round(year.avg_cutoff_rank)})`);
        });
        
        console.log('\n🎯 Year filtering test completed successfully!');
        console.log('📅 Note: Currently only 2023-2024 data is available');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await db.close();
    }
}

if (require.main === module) {
    testYearFiltering();
}

module.exports = { testYearFiltering };
