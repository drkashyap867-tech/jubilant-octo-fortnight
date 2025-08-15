const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'data', 'cutoff_ranks_enhanced.db');
const db = new sqlite3.Database(dbPath);

console.log('🚀 Starting Cutoff Database Enhancement...');

// Sample data for enhancement
const sampleData = {
  colleges: [
    { name: 'AIIMS Delhi', state: 'Delhi', city: 'New Delhi', type: 'Government' },
    { name: 'JIPMER Puducherry', state: 'Puducherry', city: 'Puducherry', type: 'Government' },
    { name: 'Maulana Azad Medical College', state: 'Delhi', city: 'New Delhi', type: 'Government' },
    { name: 'Lady Hardinge Medical College', state: 'Delhi', city: 'New Delhi', type: 'Government' },
    { name: 'Vardhman Mahavir Medical College', state: 'Delhi', city: 'New Delhi', type: 'Government' },
    { name: 'Kasturba Medical College', state: 'Karnataka', city: 'Manipal', type: 'Private' },
    { name: 'St. John\'s Medical College', state: 'Karnataka', city: 'Bangalore', type: 'Private' },
    { name: 'JSS Medical College', state: 'Karnataka', city: 'Mysore', type: 'Private' },
    { name: 'Kempegowda Institute of Medical Sciences', state: 'Karnataka', city: 'Bangalore', type: 'Private' },
    { name: 'Sapthagiri Institute of Medical Sciences', state: 'Karnataka', city: 'Bangalore', type: 'Private' }
  ],

  courses: [
    { name: 'MBBS', type: 'medical', duration: 5 },
    { name: 'MD General Medicine', type: 'medical', duration: 3 },
    { name: 'MD Pediatrics', type: 'medical', duration: 3 },
    { name: 'MD Obstetrics & Gynecology', type: 'medical', duration: 3 },
    { name: 'MD Surgery', type: 'medical', duration: 3 },
    { name: 'MD Psychiatry', type: 'medical', duration: 3 },
    { name: 'MD Dermatology', type: 'medical', duration: 3 },
    { name: 'MD Radiology', type: 'medical', duration: 3 },
    { name: 'MD Anesthesiology', type: 'medical', duration: 3 },
    { name: 'MD Pathology', type: 'medical', duration: 3 },
    { name: 'BDS', type: 'dental', duration: 5 },
    { name: 'MDS Orthodontics', type: 'dental', duration: 3 },
    { name: 'MDS Periodontics', type: 'dental', duration: 3 },
    { name: 'MDS Oral Surgery', type: 'dental', duration: 3 }
  ]
};

async function enhanceDatabase() {
  try {
    console.log('📊 Enhancing colleges table...');
    await insertColleges();

    console.log('📚 Enhancing courses table...');
    await insertCourses();

    console.log('🎯 Enhancing cutoff data...');
    await insertCutoffData();

    console.log('✅ Database enhancement completed successfully!');

  } catch (error) {
    console.error('❌ Error enhancing database:', error);
  } finally {
    db.close();
  }
}

function insertColleges() {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO colleges (name, location, state, type) 
      VALUES (?, ?, ?, ?)
    `);

    sampleData.colleges.forEach(college => {
      stmt.run(college.name, college.city, college.state, college.type);
    });

    stmt.finalize((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function insertCourses() {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO courses (name, type, duration) 
      VALUES (?, ?, ?)
    `);

    sampleData.courses.forEach(course => {
      stmt.run(course.name, course.type, course.duration);
    });

    stmt.finalize((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function insertCutoffData() {
  return new Promise((resolve, reject) => {
    // Generate realistic cutoff data
    const cutoffData = generateCutoffData();

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO cutoff_ranks_enhanced 
      (college_id, course_id, counselling_type, counselling_year, round_number, 
       round_name, aiq_quota, aiq_category, state_category, state_quota,
       cutoff_rank, seats_available, fees_amount) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    cutoffData.forEach(record => {
      stmt.run(
        record.college_id, record.course_id, record.counselling_type,
        record.counselling_year, record.round_number, record.round_name,
        record.aiq_quota, record.aiq_category, record.state_category, record.state_quota,
        record.cutoff_rank, record.seats_available, record.fees_amount
      );
    });

    stmt.finalize((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function generateCutoffData() {
  const data = [];
  let id = 1;

  // Generate data for each college and course combination
  for (let collegeId = 1; collegeId <= 10; collegeId++) {
    for (let courseId = 1; courseId <= 13; courseId++) {
      // AIQ PG data
      if (courseId > 1) { // MD courses
        data.push({
          id: id++,
          college_id: collegeId,
          course_id: courseId,
          counselling_type: 'AIQ_PG',
          counselling_year: 2024,
          round_number: 1,
          round_name: 'Round 1',
          aiq_quota: 'AIQ',
          aiq_category: 'UR',
          state_category: null,
          state_quota: null,
          cutoff_rank: Math.floor(Math.random() * 5000) + 1000,
          seats_available: Math.floor(Math.random() * 20) + 5,
          fees_amount: Math.floor(Math.random() * 50000) + 100000
        });

        data.push({
          id: id++,
          college_id: collegeId,
          course_id: courseId,
          counselling_type: 'AIQ_PG',
          counselling_year: 2024,
          round_number: 1,
          round_name: 'Round 1',
          aiq_quota: 'AIQ',
          aiq_category: 'OBC-NCL',
          state_category: null,
          state_quota: null,
          cutoff_rank: Math.floor(Math.random() * 8000) + 2000,
          seats_available: Math.floor(Math.random() * 15) + 3,
          fees_amount: Math.floor(Math.random() * 50000) + 100000
        });
      }

      // AIQ UG data (MBBS/BDS)
      if (courseId === 1 || courseId === 11) {
        data.push({
          id: id++,
          college_id: collegeId,
          course_id: courseId,
          counselling_type: 'AIQ_UG',
          counselling_year: 2024,
          round_number: 1,
          round_name: 'Round 1',
          aiq_quota: 'AIQ',
          aiq_category: 'UR',
          state_category: null,
          state_quota: null,
          cutoff_rank: Math.floor(Math.random() * 10000) + 5000,
          seats_available: Math.floor(Math.random() * 50) + 20,
          fees_amount: Math.floor(Math.random() * 100000) + 500000
        });
      }

      // KEA data for Karnataka colleges
      if (collegeId >= 6 && collegeId <= 10) {
        data.push({
          id: id++,
          college_id: collegeId,
          course_id: courseId,
          counselling_type: 'KEA',
          counselling_year: 2024,
          round_number: 1,
          round_name: 'Round 1',
          aiq_quota: null,
          aiq_category: null,
          state_category: 'GM',
          state_quota: 'Government',
          cutoff_rank: Math.floor(Math.random() * 15000) + 8000,
          seats_available: Math.floor(Math.random() * 30) + 10,
          fees_amount: Math.floor(Math.random() * 50000) + 200000
        });
      }
    }
  }

  return data;
}

// Run the enhancement
enhanceDatabase();
