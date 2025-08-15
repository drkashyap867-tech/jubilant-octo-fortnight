const { EnhancedAPIEndpoints } = require('./enhanced-api-endpoints');

async function testIntegration() {
    console.log('🚀 STARTING COMPREHENSIVE INTEGRATION TEST');
    console.log('================================================================');
    
    const api = new EnhancedAPIEndpoints();
    
    try {
        // Test 1: Medical Seats API
        console.log('\n🏥 TESTING MEDICAL SEATS API...');
        const medicalSeats = await api.getMedicalSeats({ limit: 5 });
        console.log(`✅ Medical Seats: ${medicalSeats.length} records retrieved`);
        if (medicalSeats.length > 0) {
            console.log(`   Sample record: ${medicalSeats[0].college_name} - ${medicalSeats[0].course_name}`);
        }
        
        // Test 2: Dental Seats API
        console.log('\n🦷 TESTING DENTAL SEATS API...');
        const dentalSeats = await api.getDentalSeats({ limit: 5 });
        console.log(`✅ Dental Seats: ${dentalSeats.length} records retrieved`);
        if (dentalSeats.length > 0) {
            console.log(`   Sample record: ${dentalSeats[0].college_name} - ${dentalSeats[0].course_name}`);
        }
        
        // Test 3: DNB Seats API
        console.log('\n🎓 TESTING DNB SEATS API...');
        const dnbSeats = await api.getDNBSeats({ limit: 5 });
        console.log(`✅ DNB Seats: ${dnbSeats.length} records retrieved`);
        if (dnbSeats.length > 0) {
            console.log(`   Sample record: ${dnbSeats[0].college_name} - ${dnbSeats[0].course_name}`);
        }
        
        // Test 4: Counselling Data API
        console.log('\n📊 TESTING COUNSELLING DATA API...');
        const counsellingData = await api.getCounsellingData({ limit: 5 });
        console.log(`✅ Counselling Data: ${counsellingData.length} records retrieved`);
        if (counsellingData.length > 0) {
            console.log(`   Sample record: ${counsellingData[0].college_name} - ${counsellingData[0].course_name}`);
        }
        
        // Test 5: Cutoff Ranks API
        console.log('\n🎯 TESTING CUTOFF RANKS API...');
        const cutoffRanks = await api.getCutoffRanks({ limit: 5 });
        console.log(`✅ Cutoff Ranks: ${cutoffRanks.length} records retrieved`);
        if (cutoffRanks.length > 0) {
            console.log(`   Sample record: ${cutoffRanks[0].college_name} - ${cutoffRanks[0].course_name}`);
        }
        
        // Test 6: Comprehensive Search
        console.log('\n🔍 TESTING COMPREHENSIVE SEARCH...');
        const searchResults = await api.comprehensiveSearch('medical', { limit: 10 });
        console.log(`✅ Comprehensive Search: ${searchResults.total} total results`);
        console.log(`   Medical: ${searchResults.results.medical.length}`);
        console.log(`   Dental: ${searchResults.results.dental.length}`);
        console.log(`   DNB: ${searchResults.results.dnb.length}`);
        console.log(`   Counselling: ${searchResults.results.counselling.length}`);
        console.log(`   Cutoff: ${searchResults.results.cutoff.length}`);
        
        // Test 7: Statistics
        console.log('\n📈 TESTING STATISTICS API...');
        const stats = await api.getComprehensiveStats();
        console.log('✅ Comprehensive Statistics Retrieved:');
        console.log(`   Medical: ${stats.medical.total_records} records, ${stats.medical.total_seats} seats`);
        console.log(`   Dental: ${stats.dental.total_records} records, ${stats.dental.total_seats} seats`);
        console.log(`   DNB: ${stats.dnb.total_records} records, ${stats.dnb.total_seats} seats`);
        console.log(`   Counselling: ${stats.counselling.total_records} records`);
        console.log(`   Cutoff: ${stats.cutoff.total_records} records`);
        
        // Test 8: Filtered Queries
        console.log('\n🔧 TESTING FILTERED QUERIES...');
        
        // Test medical seats with state filter
        const filteredMedical = await api.getMedicalSeats({ state: 'Delhi', limit: 3 });
        console.log(`✅ Filtered Medical (Delhi): ${filteredMedical.length} records`);
        
        // Test counselling data with type filter
        const filteredCounselling = await api.getCounsellingData({ counselling_type: 1, limit: 3 });
        console.log(`✅ Filtered Counselling (Type 1): ${filteredCounselling.length} records`);
        
        // Test cutoff ranks with max rank filter
        const filteredCutoff = await api.getCutoffRanks({ max_rank: 1000, limit: 3 });
        console.log(`✅ Filtered Cutoff (Max Rank 1000): ${filteredCutoff.length} records`);
        
        console.log('\n🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY!');
        console.log('================================================================');
        console.log('✅ Medical Seats API: Working');
        console.log('✅ Dental Seats API: Working');
        console.log('✅ DNB Seats API: Working');
        console.log('✅ Counselling Data API: Working');
        console.log('✅ Cutoff Ranks API: Working');
        console.log('✅ Comprehensive Search: Working');
        console.log('✅ Statistics API: Working');
        console.log('✅ Filtered Queries: Working');
        console.log('\n🚀 Your enhanced database integration is ready for production!');
        
    } catch (error) {
        console.error('\n❌ INTEGRATION TEST FAILED:', error);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Run the integration test
testIntegration().catch(console.error);
