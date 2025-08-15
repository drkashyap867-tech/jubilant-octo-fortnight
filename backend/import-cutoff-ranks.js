const CutoffRanksSetup = require('./cutoff-ranks-setup');
const path = require('path');
const fs = require('fs');

class CutoffRanksImporter {
  constructor() {
    this.db = null;
  }

  async initialize() {
    try {
      console.log('🔌 Connecting to Cutoff Ranks Database...');
      this.db = new CutoffRanksSetup();
      const success = await this.db.initialize();
      if (success) {
        console.log('✅ Connected to Cutoff Ranks Database');
        return true;
      } else {
        console.log('❌ Failed to connect to Cutoff Ranks Database');
        return false;
      }
    } catch (error) {
      console.error('❌ Error connecting to database:', error);
      return false;
    }
  }

  async importFromJSON(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        return false;
      }

      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      console.log(`📝 Importing ${data.length} records from ${filePath}`);

      let successCount = 0;
      for (const record of data) {
        try {
          await this.db.insertCutoffRank(record);
          successCount++;
        } catch (error) {
          console.error(`❌ Error importing record:`, error.message);
        }
      }

      console.log(`✅ Successfully imported ${successCount}/${data.length} records`);
      return successCount;
    } catch (error) {
      console.error('❌ Error importing from JSON:', error);
      return false;
    }
  }

  async importSampleData() {
    try {
      console.log('📝 Importing sample cutoff ranks data...');
      
      const sampleData = [
        {
          college_id: 1,
          course_id: 1,
          counselling_type: 'AIQ',
          counselling_year: 2024,
          round_number: 1,
          round_name: 'Round 1',
          quota_type: 'General',
          category: 'UR',
          cutoff_rank: 1500,
          cutoff_percentile: 98.5,
          seats_available: 10,
          seats_filled: 8,
          fees_amount: 15000,
          special_remarks: 'High demand course'
        },
        {
          college_id: 1,
          course_id: 1,
          counselling_type: 'AIQ',
          counselling_year: 2024,
          round_number: 1,
          round_name: 'Round 1',
          quota_type: 'OBC',
          category: 'OBC-NCL',
          cutoff_rank: 2500,
          cutoff_percentile: 97.2,
          seats_available: 5,
          seats_filled: 4,
          fees_amount: 15000,
          special_remarks: 'Reserved category'
        },
        {
          college_id: 1,
          course_id: 1,
          counselling_type: 'AIQ',
          counselling_year: 2024,
          round_number: 2,
          round_name: 'Round 2',
          quota_type: 'General',
          category: 'UR',
          cutoff_rank: 1800,
          cutoff_percentile: 97.8,
          seats_available: 2,
          seats_filled: 1,
          fees_amount: 15000,
          special_remarks: 'Second round'
        },
        {
          college_id: 1,
          course_id: 1,
          counselling_type: 'KEA',
          counselling_year: 2024,
          round_number: 1,
          round_name: 'Round 1',
          quota_type: 'State',
          category: 'UR',
          cutoff_rank: 1200,
          cutoff_percentile: 99.1,
          seats_available: 15,
          seats_filled: 12,
          fees_amount: 12000,
          special_remarks: 'State quota'
        }
      ];

      let successCount = 0;
      for (const record of sampleData) {
        try {
          await this.db.insertCutoffRank(record);
          successCount++;
        } catch (error) {
          console.error(`❌ Error importing sample record:`, error.message);
        }
      }

      console.log(`✅ Sample data imported: ${successCount} records`);
      return successCount;
    } catch (error) {
      console.error('❌ Sample data import failed:', error);
      throw error;
    }
  }

  async close() {
    if (this.db) {
      await this.db.close();
    }
  }
}

// Sample data structure for reference
const sampleDataStructure = {
  college_id: "Integer - ID from main colleges table",
  course_id: "Integer - ID from main courses table", 
  counselling_type: "String - AIQ/KEA/COMEDK",
  counselling_year: "Integer - Year of counselling (currently 2023-2024)",
  round_number: "Integer - Round number",
  round_name: "String - Round name (e.g., 'Round 1')",
  quota_type: "String - General/OBC/SC/ST/EWS",
  category: "String - UR/OBC-NCL/SC/ST/EWS/PwD",
  cutoff_rank: "Integer - Cutoff rank",
  cutoff_percentile: "Float - Cutoff percentile",
  seats_available: "Integer - Total seats available",
  seats_filled: "Integer - Seats filled",
  fees_amount: "Integer - Fees in rupees",
  special_remarks: "String - Additional notes"
};

if (require.main === module) {
  const importer = new CutoffRanksImporter();
  importer.initialize()
    .then(async (success) => {
      if (success) {
        await importer.importSampleData();
        console.log('🎯 Sample data import completed!');
      }
    })
    .catch(console.error)
    .finally(() => importer.close());
}

module.exports = { CutoffRanksImporter, sampleDataStructure };
