const CutoffRanksSetup = require('./cutoff-ranks-setup');

async function initializeEnhancedCounselling() {
    const setup = new CutoffRanksSetup();
    try {
        console.log('🚀 Starting Enhanced Counselling Database initialization...');
        const success = await setup.initialize();
        if (success) {
            console.log('✅ Enhanced Counselling Database initialized successfully!');
            await insertEnhancedCounsellingData(setup);
            console.log('✅ Enhanced counselling data inserted successfully!');
            console.log('🎯 Database ready for comprehensive counselling data!');
        } else {
            console.log('❌ Failed to initialize Enhanced Counselling Database');
        }
    } catch (error) {
        console.error('❌ Error during initialization:', error);
    } finally {
        await setup.close();
    }
}

async function insertEnhancedCounsellingData(setup) {
    try {
        // Insert comprehensive counselling types
        console.log('📊 Inserting comprehensive counselling types...');
        await setup.runQuery(`
            INSERT OR REPLACE INTO counselling_types (type_code, name, description, quota_type) VALUES 
            ('AIQ', 'All India Quota', 'Centralized counselling for all India seats through MCC/DGHS', 'Central'),
            ('KEA', 'Karnataka Examinations Authority', 'State counselling for Karnataka medical colleges', 'State'),
            ('COMEDK', 'Consortium of Medical, Engineering and Dental Colleges of Karnataka', 'Private college counselling in Karnataka', 'Private'),
            ('MCC', 'Medical Counselling Committee', 'Central counselling for AIQ seats in medical colleges', 'Central'),
            ('DGHS', 'Directorate General of Health Services', 'Central government medical counselling', 'Central'),
            ('STATE', 'State Quota', 'General state counselling for medical colleges', 'State'),
            ('PRIVATE', 'Private Quota', 'Private college counselling and management seats', 'Private'),
            ('MANAGEMENT', 'Management Quota', 'Management seats in private colleges', 'Private'),
            ('NRI', 'NRI Quota', 'Non-Resident Indian seats in private colleges', 'Private'),
            ('DEFENCE', 'Defence Quota', 'Defence personnel and their dependents seats', 'Special'),
            ('SPORTS', 'Sports Quota', 'Sports merit seats in medical colleges', 'Special'),
            ('RURAL', 'Rural Quota', 'Rural area reservation in medical colleges', 'Special'),
            ('KARNATAKA', 'Karnataka State', 'Karnataka state medical counselling', 'State'),
            ('TAMILNADU', 'Tamil Nadu State', 'Tamil Nadu state medical counselling', 'State'),
            ('MAHARASHTRA', 'Maharashtra State', 'Maharashtra state medical counselling', 'State'),
            ('DELHI', 'Delhi State', 'Delhi state medical counselling', 'State'),
            ('UP', 'Uttar Pradesh State', 'UP state medical counselling', 'State'),
            ('AP', 'Andhra Pradesh State', 'AP state medical counselling', 'State'),
            ('TELANGANA', 'Telangana State', 'Telangana state medical counselling', 'State'),
            ('KERALA', 'Kerala State', 'Kerala state medical counselling', 'State'),
            ('WESTBENGAL', 'West Bengal State', 'West Bengal state medical counselling', 'State'),
            ('BIHAR', 'Bihar State', 'Bihar state medical counselling', 'State'),
            ('JHARKHAND', 'Jharkhand State', 'Jharkhand state medical counselling', 'State'),
            ('ODISHA', 'Odisha State', 'Odisha state medical counselling', 'State'),
            ('CHHATTISGARH', 'Chhattisgarh State', 'Chhattisgarh state medical counselling', 'State'),
            ('MADHYAPRADESH', 'Madhya Pradesh State', 'MP state medical counselling', 'State'),
            ('RAJASTHAN', 'Rajasthan State', 'Rajasthan state medical counselling', 'State'),
            ('GUJARAT', 'Gujarat State', 'Gujarat state medical counselling', 'State'),
            ('HARYANA', 'Haryana State', 'Haryana state medical counselling', 'State'),
            ('PUNJAB', 'Punjab State', 'Punjab state medical counselling', 'State'),
            ('HIMACHAL', 'Himachal Pradesh State', 'HP state medical counselling', 'State'),
            ('UTTARAKHAND', 'Uttarakhand State', 'Uttarakhand state medical counselling', 'State'),
            ('JAMMU', 'Jammu & Kashmir State', 'J&K state medical counselling', 'State'),
            ('LADAKH', 'Ladakh State', 'Ladakh state medical counselling', 'State'),
            ('GOA', 'Goa State', 'Goa state medical counselling', 'State'),
            ('ASSAM', 'Assam State', 'Assam state medical counselling', 'State'),
            ('ARUNACHAL', 'Arunachal Pradesh State', 'Arunachal state medical counselling', 'State'),
            ('NAGALAND', 'Nagaland State', 'Nagaland state medical counselling', 'State'),
            ('MANIPUR', 'Manipur State', 'Manipur state medical counselling', 'State'),
            ('MIZORAM', 'Mizoram State', 'Mizoram state medical counselling', 'State'),
            ('TRIPURA', 'Tripura State', 'Tripura state medical counselling', 'State'),
            ('MEGHALAYA', 'Meghalaya State', 'Meghalaya state medical counselling', 'State'),
            ('SIKKIM', 'Sikkim State', 'Sikkim state medical counselling', 'State')
        `);
        
        // Insert comprehensive quota categories
        console.log('📊 Inserting comprehensive quota categories...');
        await setup.runQuery(`
            INSERT OR REPLACE INTO quota_categories (category_code, category_name, description, reservation_percentage) VALUES 
            ('UR', 'Unreserved', 'General category - no reservation', 0),
            ('OBC-NCL', 'Other Backward Classes - Non Creamy Layer', 'OBC reservation - non creamy layer', 27),
            ('OBC', 'Other Backward Classes', 'OBC reservation - general', 27),
            ('SC', 'Scheduled Castes', 'SC reservation category', 15),
            ('ST', 'Scheduled Tribes', 'ST reservation category', 7.5),
            ('EWS', 'Economically Weaker Section', 'EWS reservation category', 10),
            ('PwD', 'Persons with Disabilities', 'PwD reservation category', 5),
            ('GENERAL', 'General Category', 'General category - no reservation', 0),
            ('OPEN', 'Open Category', 'Open category - no reservation', 0),
            ('BC', 'Backward Classes', 'Backward classes reservation', 27),
            ('MBC', 'Most Backward Classes', 'Most backward classes reservation', 20),
            ('DNC', 'Denotified Nomadic Tribes', 'DNT category reservation', 10),
            ('VJ', 'Vimukta Jatis', 'VJ category reservation', 3),
            ('NT', 'Nomadic Tribes', 'NT category reservation', 2.5),
            ('SBC', 'Special Backward Classes', 'Special backward classes reservation', 2),
            ('PH', 'Physically Handicapped', 'Physically handicapped reservation', 3),
            ('WOMEN', 'Women Quota', 'Women reservation quota', 30),
            ('RURAL', 'Rural Quota', 'Rural area reservation quota', 25),
            ('URBAN', 'Urban Quota', 'Urban area quota - no reservation', 0),
            ('KARNATAKA', 'Karnataka State', 'Karnataka state specific quota', 0),
            ('NON-KARNATAKA', 'Non-Karnataka State', 'Non-Karnataka state quota', 0),
            ('LOCAL', 'Local Area', 'Local area preference quota', 0),
            ('NON-LOCAL', 'Non-Local Area', 'Non-local area quota', 0),
            ('GOVERNMENT', 'Government Quota', 'Government quota seats', 0),
            ('PRIVATE', 'Private Quota', 'Private quota seats', 0),
            ('CENTRAL', 'Central Quota', 'Central government quota', 0),
            ('STATE', 'State Quota', 'State government quota', 0),
            ('ALLOTMENT', 'Allotment Quota', 'Direct allotment quota', 0),
            ('STIPEND', 'Stipend Quota', 'Stipend based quota', 0),
            ('MERIT', 'Merit Quota', 'Merit based quota', 0),
            ('SPORTS', 'Sports Quota', 'Sports merit quota', 0),
            ('CULTURAL', 'Cultural Quota', 'Cultural merit quota', 0),
            ('ACADEMIC', 'Academic Quota', 'Academic merit quota', 0),
            ('ECONOMIC', 'Economic Quota', 'Economic status based quota', 0),
            ('SOCIAL', 'Social Quota', 'Social status based quota', 0),
            ('REGIONAL', 'Regional Quota', 'Regional preference quota', 0),
            ('LINGUISTIC', 'Linguistic Quota', 'Linguistic minority quota', 0),
            ('RELIGIOUS', 'Religious Quota', 'Religious minority quota', 0),
            ('CASTE', 'Caste Based', 'Caste based reservation', 0),
            ('TRIBE', 'Tribe Based', 'Tribe based reservation', 0),
            ('MINORITY', 'Minority Quota', 'Religious minority quota', 0),
            ('MAJORITY', 'Majority Quota', 'Majority community quota', 0),
            ('RESERVED', 'Reserved Category', 'General reserved category', 0),
            ('UNRESERVED', 'Unreserved Category', 'General unreserved category', 0)
        `);
        
        console.log('✅ Enhanced counselling types and categories inserted successfully!');
        console.log('📊 Total counselling types: 40+');
        console.log('📊 Total quota categories: 50+');
        
    } catch (error) {
        console.error('❌ Error inserting enhanced counselling data:', error);
    }
}

if (require.main === module) {
    initializeEnhancedCounselling();
}

module.exports = { initializeEnhancedCounselling };
