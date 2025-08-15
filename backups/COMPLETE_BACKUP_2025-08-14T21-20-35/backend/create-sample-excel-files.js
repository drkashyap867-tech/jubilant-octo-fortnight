const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

class SampleExcelFileCreator {
    constructor() {
        this.dataDir = path.join(__dirname, 'data', 'imports');
        this.ensureDirectories();
    }

    ensureDirectories() {
        const dirs = [
            path.join(this.dataDir, 'medical'),
            path.join(this.dataDir, 'dental'),
            path.join(this.dataDir, 'counselling')
        ];
        
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    createMedicalSeatsSample() {
        console.log('🏥 Creating Medical Seats Sample Excel...');
        
        const data = [
            // Headers
            [
                'COLLEGE/INSTITUTE', 'COLLEGE_CODE', 'STATE', 'CITY', 'MANAGEMENT_TYPE', 
                'ESTABLISHMENT_YEAR', 'COURSE_NAME', 'COURSE_TYPE', 'TOTAL_SEATS', 
                'GENERAL_SEATS', 'OBC_SEATS', 'SC_SEATS', 'ST_SEATS', 'EWS_SEATS',
                'QUOTA_TYPE', 'ACADEMIC_YEAR', 'FEE_STRUCTURE', 'CUTOFF_RANK'
            ],
            // Sample data rows
            [
                'AIIMS Delhi', 'AIIMS001', 'Delhi', 'New Delhi', 'Government',
                1956, 'MBBS', 'Undergraduate', 100, 50, 27, 15, 8, 10,
                'All India', '2024-25', '₹10,000/year', 100
            ],
            [
                'JIPMER Puducherry', 'JIPMER001', 'Puducherry', 'Puducherry', 'Government',
                1964, 'MBBS', 'Undergraduate', 150, 75, 40, 22, 11, 15,
                'All India', '2024-25', '₹12,000/year', 150
            ],
            [
                'Mysore Medical College', 'MMC001', 'Karnataka', 'Mysore', 'Government',
                1924, 'MBBS', 'Undergraduate', 200, 100, 54, 30, 15, 20,
                'State', '2024-25', '₹8,000/year', 200
            ],
            [
                'Bangalore Medical College', 'BMC001', 'Karnataka', 'Bangalore', 'Government',
                1955, 'MBBS', 'Undergraduate', 180, 90, 48, 27, 13, 18,
                'State', '2024-25', '₹8,000/year', 180
            ],
            [
                'AIIMS Delhi', 'AIIMS001', 'Delhi', 'New Delhi', 'Government',
                1956, 'MD General Medicine', 'Postgraduate', 20, 10, 5, 3, 1, 2,
                'All India', '2024-25', '₹15,000/year', 500
            ],
            [
                'JIPMER Puducherry', 'JIPMER001', 'Puducherry', 'Puducherry', 'Government',
                1964, 'MS General Surgery', 'Postgraduate', 15, 7, 4, 2, 1, 1,
                'All India', '2024-25', '₹18,000/year', 600
            ]
        ];

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        
        // Set column widths
        const colWidths = [
            { wch: 25 }, // COLLEGE/INSTITUTE
            { wch: 12 }, // COLLEGE_CODE
            { wch: 15 }, // STATE
            { wch: 15 }, // CITY
            { wch: 15 }, // MANAGEMENT_TYPE
            { wch: 15 }, // ESTABLISHMENT_YEAR
            { wch: 20 }, // COURSE_NAME
            { wch: 15 }, // COURSE_TYPE
            { wch: 12 }, // TOTAL_SEATS
            { wch: 12 }, // GENERAL_SEATS
            { wch: 12 }, // OBC_SEATS
            { wch: 12 }, // SC_SEATS
            { wch: 12 }, // ST_SEATS
            { wch: 12 }, // EWS_SEATS
            { wch: 15 }, // QUOTA_TYPE
            { wch: 15 }, // ACADEMIC_YEAR
            { wch: 20 }, // FEE_STRUCTURE
            { wch: 15 }  // CUTOFF_RANK
        ];
        worksheet['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Medical_Seats');
        
        const filePath = path.join(this.dataDir, 'medical', 'sample-medical-seats.xlsx');
        XLSX.writeFile(workbook, filePath);
        
        console.log(`   ✅ Created: ${filePath}`);
        return filePath;
    }

    createDentalSeatsSample() {
        console.log('🦷 Creating Dental Seats Sample Excel...');
        
        const data = [
            // Headers
            [
                'COLLEGE/INSTITUTE', 'COLLEGE_CODE', 'STATE', 'CITY', 'MANAGEMENT_TYPE', 
                'ESTABLISHMENT_YEAR', 'COURSE_NAME', 'COURSE_TYPE', 'TOTAL_SEATS', 
                'GENERAL_SEATS', 'OBC_SEATS', 'SC_SEATS', 'ST_SEATS', 'EWS_SEATS',
                'QUOTA_TYPE', 'ACADEMIC_YEAR', 'FEE_STRUCTURE', 'CUTOFF_RANK'
            ],
            // Sample data rows
            [
                'AIIMS Delhi', 'AIIMS001', 'Delhi', 'New Delhi', 'Government',
                1956, 'BDS', 'Undergraduate', 50, 25, 13, 7, 4, 5,
                'All India', '2024-25', '₹12,000/year', 300
            ],
            [
                'JIPMER Puducherry', 'JIPMER001', 'Puducherry', 'Puducherry', 'Government',
                1964, 'BDS', 'Undergraduate', 60, 30, 16, 9, 4, 6,
                'All India', '2024-25', '₹14,000/year', 350
            ],
            [
                'Mysore Dental College', 'MDC001', 'Karnataka', 'Mysore', 'Government',
                1980, 'BDS', 'Undergraduate', 100, 50, 27, 15, 8, 10,
                'State', '2024-25', '₹10,000/year', 400
            ],
            [
                'Bangalore Dental College', 'BDC001', 'Karnataka', 'Bangalore', 'Government',
                1985, 'BDS', 'Undergraduate', 80, 40, 21, 12, 6, 8,
                'State', '2024-25', '₹10,000/year', 380
            ],
            [
                'AIIMS Delhi', 'AIIMS001', 'Delhi', 'New Delhi', 'Government',
                1956, 'MDS Orthodontics', 'Postgraduate', 10, 5, 2, 1, 1, 1,
                'All India', '2024-25', '₹20,000/year', 800
            ]
        ];

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        
        // Set column widths
        const colWidths = [
            { wch: 25 }, // COLLEGE/INSTITUTE
            { wch: 12 }, // COLLEGE_CODE
            { wch: 15 }, // STATE
            { wch: 15 }, // CITY
            { wch: 15 }, // MANAGEMENT_TYPE
            { wch: 15 }, // ESTABLISHMENT_YEAR
            { wch: 20 }, // COURSE_NAME
            { wch: 15 }, // COURSE_TYPE
            { wch: 12 }, // TOTAL_SEATS
            { wch: 12 }, // GENERAL_SEATS
            { wch: 12 }, // OBC_SEATS
            { wch: 12 }, // SC_SEATS
            { wch: 12 }, // ST_SEATS
            { wch: 12 }, // EWS_SEATS
            { wch: 15 }, // QUOTA_TYPE
            { wch: 15 }, // ACADEMIC_YEAR
            { wch: 20 }, // FEE_STRUCTURE
            { wch: 15 }  // CUTOFF_RANK
        ];
        worksheet['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Dental_Seats');
        
        const filePath = path.join(this.dataDir, 'dental', 'sample-dental-seats.xlsx');
        XLSX.writeFile(workbook, filePath);
        
        console.log(`   ✅ Created: ${filePath}`);
        return filePath;
    }

    createCounsellingDataSample() {
        console.log('🎯 Creating Counselling Data Sample Excel...');
        
        const data = [
            // Headers
            [
                'ALL INDIA RANK', 'QUOTA', 'COLLEGE/INSTITUTE', 'COURSE', 'CATEGORY',
                'CUTOFF RANK', 'SEATS', 'FEES', 'COUNSELLING_TYPE', 'YEAR', 'ROUND'
            ],
            // Sample data rows - AIQ_PG
            [
                150, 'AIQ', 'AIIMS Delhi', 'MD General Medicine', 'UR',
                150, 1, 15000, 'AIQ_PG', 2024, 1
            ],
            [
                200, 'AIQ', 'AIIMS Delhi', 'MD General Medicine', 'OBC-NCL',
                200, 1, 15000, 'AIQ_PG', 2024, 1
            ],
            [
                300, 'AIQ', 'AIIMS Delhi', 'MD General Medicine', 'SC',
                300, 1, 15000, 'AIQ_PG', 2024, 1
            ],
            [
                400, 'AIQ', 'AIIMS Delhi', 'MD General Medicine', 'ST',
                400, 1, 15000, 'AIQ_PG', 2024, 1
            ],
            [
                500, 'AIQ', 'AIIMS Delhi', 'MD General Medicine', 'EWS',
                500, 1, 15000, 'AIQ_PG', 2024, 1
            ],
            // Sample data rows - AIQ_UG
            [
                100, 'AIQ', 'AIIMS Delhi', 'MBBS', 'UR',
                100, 1, 10000, 'AIQ_UG', 2024, 1
            ],
            [
                150, 'AIQ', 'AIIMS Delhi', 'MBBS', 'OBC-NCL',
                150, 1, 10000, 'AIQ_UG', 2024, 1
            ],
            [
                250, 'AIQ', 'AIIMS Delhi', 'MBBS', 'SC',
                250, 1, 10000, 'AIQ_UG', 2024, 1
            ],
            // Sample data rows - KEA
            [
                1000, 'STATE', 'Mysore Medical College', 'MBBS', 'UR',
                1000, 1, 8000, 'KEA', 2024, 1
            ],
            [
                1200, 'STATE', 'Mysore Medical College', 'MBBS', 'OBC-NCL',
                1200, 1, 8000, 'KEA', 2024, 1
            ],
            [
                1500, 'STATE', 'Mysore Medical College', 'MBBS', 'SC',
                1500, 1, 8000, 'KEA', 2024, 1
            ],
            [
                2000, 'STATE', 'Mysore Medical College', 'MBBS', 'ST',
                2000, 1, 8000, 'KEA', 2024, 1
            ],
            [
                2500, 'STATE', 'Mysore Medical College', 'MBBS', 'EWS',
                2500, 1, 8000, 'KEA', 2024, 1
            ]
        ];

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        
        // Set column widths
        const colWidths = [
            { wch: 15 }, // ALL INDIA RANK
            { wch: 12 }, // QUOTA
            { wch: 25 }, // COLLEGE/INSTITUTE
            { wch: 20 }, // COURSE
            { wch: 15 }, // CATEGORY
            { wch: 15 }, // CUTOFF RANK
            { wch: 10 }, // SEATS
            { wch: 12 }, // FEES
            { wch: 20 }, // COUNSELLING_TYPE
            { wch: 10 }, // YEAR
            { wch: 10 }  // ROUND
        ];
        worksheet['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Counselling_Data');
        
        const filePath = path.join(this.dataDir, 'counselling', 'sample-counselling-data.xlsx');
        XLSX.writeFile(workbook, filePath);
        
        console.log(`   ✅ Created: ${filePath}`);
        return filePath;
    }

    createAllSampleFiles() {
        console.log('🚀 Creating All Sample Excel Files...\n');
        
        try {
            const medicalFile = this.createMedicalSeatsSample();
            const dentalFile = this.createDentalSeatsSample();
            const counsellingFile = this.createCounsellingDataSample();
            
            console.log('\n📁 Sample Files Created Successfully!');
            console.log('=====================================');
            console.log(`🏥 Medical Seats: ${medicalFile}`);
            console.log(`🦷 Dental Seats: ${dentalFile}`);
            console.log(`🎯 Counselling Data: ${counsellingFile}`);
            
            console.log('\n🎯 Ready for Testing!');
            console.log('You can now test the importers with these sample files.');
            
        } catch (error) {
            console.error('❌ Failed to create sample files:', error.message);
            throw error;
        }
    }
}

// Run if called directly
if (require.main === module) {
    const creator = new SampleExcelFileCreator();
    creator.createAllSampleFiles();
}

module.exports = { SampleExcelFileCreator };
