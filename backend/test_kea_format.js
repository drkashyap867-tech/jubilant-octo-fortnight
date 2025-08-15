const { CutoffAPI } = require('./cutoff-api');

async function testKEAFormat() {
    try {
        console.log('🧪 Testing KEA Format Processing...\n');
        
        const cutoffAPI = new CutoffAPI();
        
        // Test KEA format detection and processing
        console.log('1️⃣ Testing KEA format detection...');
        
        // Test with KEA 2024 Medical R1
        const keaData = await cutoffAPI.getCutoffDataFromFile('KEA', 2024, 'R1');
        console.log('KEA Data result:', {
            success: keaData.success,
            dataLength: keaData.data ? keaData.data.length : 0,
            error: keaData.error
        });
        
        if (keaData.success && keaData.data.length > 0) {
            console.log('\n📊 Sample KEA data:');
            console.log('First item:', keaData.data[0]);
            console.log('Total items:', keaData.data.length);
            
            // Check for NRI and MNG categories
            const nriItems = keaData.data.filter(item => item.quota === 'NRI');
            const mngItems = keaData.data.filter(item => item.quota === 'MANAGEMENT');
            
            console.log(`\n🔍 KEA Data Analysis:`);
            console.log(`   NRI quota items: ${nriItems.length}`);
            console.log(`   Management quota items: ${mngItems.length}`);
            
            if (nriItems.length > 0) {
                console.log(`   Sample NRI item:`, nriItems[0]);
            }
            if (mngItems.length > 0) {
                console.log(`   Sample Management item:`, mngItems[0]);
            }
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
testKEAFormat();
