const CutoffRanksSetup = require('./cutoff-ranks-setup');

async function initializeCutoffDatabase() {
  const setup = new CutoffRanksSetup();
  try {
    console.log('🚀 Starting Cutoff Ranks Database initialization...');
    const success = await setup.initialize();
    if (success) {
      console.log('✅ Cutoff Ranks Database initialized successfully!');
      await insertSampleData(setup);
      console.log('✅ Sample data inserted successfully!');
      console.log('🎯 Database ready for cutoff ranks data!');
    } else {
      console.log('❌ Failed to initialize Cutoff Ranks Database');
    }
  } catch (error) {
    console.error('❌ Error during initialization:', error);
  } finally {
    await setup.close();
  }
}

async function insertSampleData(setup) {
  try {
    // Insert counselling types
    await setup.runQuery(`
      INSERT OR REPLACE INTO counselling_types (type_code, name, description, quota_type) VALUES 
      ('AIQ', 'All India Quota', 'Centralized counselling for all India seats', 'Central'),
      ('KEA', 'Karnataka Examinations Authority', 'State counselling for Karnataka', 'State'),
      ('COMEDK', 'Consortium of Medical, Engineering and Dental Colleges of Karnataka', 'Private college counselling', 'Private')
    `);
    
    // Insert quota categories
    await setup.runQuery(`
      INSERT OR REPLACE INTO quota_categories (category_code, category_name, description, reservation_percentage) VALUES 
      ('UR', 'Unreserved', 'General category', 0),
      ('OBC-NCL', 'Other Backward Classes - Non Creamy Layer', 'OBC reservation', 27),
      ('SC', 'Scheduled Castes', 'SC reservation', 15),
      ('ST', 'Scheduled Tribes', 'ST reservation', 7.5),
      ('EWS', 'Economically Weaker Section', 'EWS reservation', 10),
      ('PwD', 'Persons with Disabilities', 'PwD reservation', 5)
    `);
    
    console.log('✅ Sample counselling types and categories inserted');
  } catch (error) {
    console.error('❌ Error inserting sample data:', error);
  }
}

if (require.main === module) {
  initializeCutoffDatabase();
}

module.exports = { initializeCutoffDatabase };
