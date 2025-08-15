const CutoffRanksSetup = require('./cutoff-ranks-setup');

async function add2023Data() {
    const db = new CutoffRanksSetup();
    
    try {
        await db.initialize();
        console.log('✅ Connected to Cutoff Ranks Database');
        
        // Add 2023 sample data
        const sample2023Data = [
            {
                college_id: 1,
                course_id: 1,
                counselling_type: 'AIQ',
                counselling_year: 2023,
                round_number: 1,
                round_name: 'Round 1',
                quota_type: 'General',
                category: 'UR',
                cutoff_rank: 1200,
                cutoff_percentile: 99.2,
                seats_available: 12,
                seats_filled: 10,
                fees_amount: 14000,
                special_remarks: '2023 data - High competition'
            },
            {
                college_id: 1,
                course_id: 1,
                counselling_type: 'AIQ',
                counselling_year: 2023,
                round_number: 1,
                round_name: 'Round 1',
                quota_type: 'OBC',
                category: 'OBC-NCL',
                cutoff_rank: 2000,
                cutoff_percentile: 98.1,
                seats_available: 6,
                seats_filled: 5,
                fees_amount: 14000,
                special_remarks: '2023 data - OBC category'
            },
            {
                college_id: 1,
                course_id: 1,
                counselling_type: 'KEA',
                counselling_year: 2023,
                round_name: 'Round 1',
                quota_type: 'State',
                category: 'UR',
                cutoff_rank: 1000,
                cutoff_percentile: 99.5,
                seats_available: 18,
                seats_filled: 15,
                fees_amount: 11000,
                special_remarks: '2023 data - State quota'
            },
            {
                college_id: 1,
                course_id: 1,
                counselling_type: 'AIQ',
                counselling_year: 2023,
                round_number: 2,
                round_name: 'Round 2',
                quota_type: 'General',
                category: 'UR',
                cutoff_rank: 1400,
                cutoff_percentile: 98.8,
                seats_available: 3,
                seats_filled: 2,
                fees_amount: 14000,
                special_remarks: '2023 data - Second round'
            }
        ];
        
        console.log('📝 Adding 2023 sample data...');
        
        let successCount = 0;
        for (const record of sample2023Data) {
            try {
                await db.insertCutoffRank(record);
                successCount++;
                console.log(`✅ Added: ${record.counselling_type} ${record.round_name} ${record.category} - Rank ${record.cutoff_rank}`);
            } catch (error) {
                console.error(`❌ Error adding record:`, error.message);
            }
        }
        
        console.log(`\n🎯 Successfully added ${successCount} 2023 records!`);
        
        // Show updated statistics
        const stats = await db.runQueryAll(`
            SELECT 
                COUNT(*) as total_records,
                COUNT(DISTINCT counselling_year) as years_covered,
                MIN(counselling_year) as earliest_year,
                MAX(counselling_year) as latest_year
            FROM cutoff_ranks
        `);
        
        console.log('\n📊 Updated Database Statistics:');
        console.log('Total Records:', stats[0].total_records);
        console.log('Years Covered:', stats[0].years_covered);
        console.log('Year Range:', stats[0].earliest_year, 'to', stats[0].latest_year);
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await db.close();
    }
}

if (require.main === module) {
    add2023Data();
}

module.exports = { add2023Data };
