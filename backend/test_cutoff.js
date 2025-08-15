const { CutoffAPI } = require('./cutoff-api');
const path = require('path');

async function testCutoffAPI() {
    try {
        console.log('🧪 Testing Cutoff API...\n');
        
        const cutoffAPI = new CutoffAPI();
        
        // Test 1: Get available years
        console.log('1️⃣ Testing getAvailableYears...');
        const years = cutoffAPI.getAvailableYears();
        console.log('Years:', years);
        
        // Test 2: Get available categories
        console.log('\n2️⃣ Testing getAvailableCategories...');
        const categories = cutoffAPI.getAvailableCategories();
        console.log('Categories:', categories);
        
        // Test 3: Get available rounds
        console.log('\n3️⃣ Testing getAvailableRounds...');
        const rounds = cutoffAPI.getAvailableRounds('AIQ_UG', 2024);
        console.log('Rounds:', rounds);
        
        // Test 4: Get cutoff data from file
        console.log('\n4️⃣ Testing getCutoffDataFromFile...');
        const data = await cutoffAPI.getCutoffDataFromFile('AIQ_UG', 2024, 'R1');
        console.log('Data result:', {
            success: data.success,
            dataLength: data.data ? data.data.length : 0,
            error: data.error
        });
        
        if (data.success && data.data.length > 0) {
            console.log('\n📊 Sample data:');
            console.log('First item:', data.data[0]);
            console.log('Total items:', data.data.length);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
testCutoffAPI();
