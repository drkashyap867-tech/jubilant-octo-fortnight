const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

class CutoffDataAnalyzer {
    constructor() {
        this.cutoffDir = path.join(__dirname, '../counselling_data/cutoffs');
    }

    async analyzeCutoffStructure() {
        try {
            console.log('🔍 ANALYZING CUTOFF DATA STRUCTURE...\n');
            
            // Get all cutoff directories
            const cutoffDirs = fs.readdirSync(this.cutoffDir)
                .filter(item => fs.statSync(path.join(this.cutoffDir, item)).isDirectory())
                .filter(item => !item.startsWith('.'));

            console.log(`📁 Found ${cutoffDirs.length} cutoff categories:\n`);

            for (const dir of cutoffDirs) {
                console.log(`🏥 ${dir}:`);
                const dirPath = path.join(this.cutoffDir, dir);
                const files = fs.readdirSync(dirPath)
                    .filter(file => file.endsWith('.xlsx') || file.endsWith('.xls'))
                    .filter(file => !file.startsWith('.'));

                for (const file of files) {
                    console.log(`   📄 ${file}`);
                    await this.analyzeFile(path.join(dirPath, file));
                }
                console.log('');
            }

        } catch (error) {
            console.error('❌ Analysis error:', error);
        }
    }

    async analyzeFile(filePath) {
        try {
            const workbook = XLSX.readFile(filePath);
            const sheetNames = workbook.SheetNames;
            
            console.log(`      📊 Sheets: ${sheetNames.join(', ')}`);
            
            // Analyze first sheet
            const firstSheet = workbook.Sheets[sheetNames[0]];
            const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
            
            if (data.length > 0) {
                const headers = data[0];
                console.log(`      🏷️  Headers (${headers.length}): ${headers.slice(0, 10).join(', ')}${headers.length > 10 ? '...' : ''}`);
                
                // Show sample data
                if (data.length > 1) {
                    const sampleRow = data[1];
                    console.log(`      📝 Sample Row: ${sampleRow.slice(0, 5).join(' | ')}${sampleRow.length > 5 ? '...' : ''}`);
                }
            }
            
        } catch (error) {
            console.error(`      ❌ Error analyzing ${path.basename(filePath)}:`, error.message);
        }
    }

    generateDatabaseSchema() {
        console.log('\n💾 RECOMMENDED DATABASE SCHEMA:\n');
        console.log('```sql');
        console.log('-- Cutoff Data Tables');
        console.log('');
        console.log('-- Main cutoff table');
        console.log('CREATE TABLE cutoff_data (');
        console.log('    id INTEGER PRIMARY KEY AUTOINCREMENT,');
        console.log('    year INTEGER NOT NULL,');
        console.log('    category TEXT NOT NULL, -- AIQ_UG, AIQ_PG, KEA_UG, etc.');
        console.log('    round TEXT NOT NULL, -- R1, R2, R3, etc.');
        console.log('    college_name TEXT NOT NULL,');
        console.log('    course_name TEXT NOT NULL,');
        console.log('    state TEXT,');
        console.log('    quota TEXT, -- AIQ, State, etc.');
        console.log('    category_rank INTEGER,');
        console.log('    opening_rank INTEGER,');
        console.log('    closing_rank INTEGER,');
        console.log('    total_seats INTEGER,');
        console.log('    filled_seats INTEGER,');
        console.log('    vacant_seats INTEGER,');
        console.log('    fees_structure TEXT,');
        console.log('    created_at DATETIME DEFAULT CURRENT_TIMESTAMP');
        console.log(');');
        console.log('');
        console.log('-- Indexes for performance');
        console.log('CREATE INDEX idx_cutoff_year_category ON cutoff_data(year, category);');
        console.log('CREATE INDEX idx_cutoff_college ON cutoff_data(college_name);');
        console.log('CREATE INDEX idx_cutoff_course ON cutoff_data(course_name);');
        console.log('CREATE INDEX idx_cutoff_quota ON cutoff_data(quota);');
        console.log('CREATE INDEX idx_cutoff_ranks ON cutoff_data(opening_rank, closing_rank);');
        console.log('```');
    }

    generateAPIEndpoints() {
        console.log('\n🚀 RECOMMENDED API ENDPOINTS:\n');
        console.log('```javascript');
        console.log('// Cutoff Data API Routes');
        console.log('');
        console.log('// Get available years');
        console.log('GET /api/cutoff/years');
        console.log('');
        console.log('// Get available categories');
        console.log('GET /api/cutoff/categories');
        console.log('');
        console.log('// Get available rounds for a category');
        console.log('GET /api/cutoff/rounds/:category/:year');
        console.log('');
        console.log('// Search cutoff data');
        console.log('GET /api/cutoff/search?year=2024&category=AIQ_UG&round=R1&college=&course=&quota=&minRank=&maxRank=');
        console.log('');
        console.log('// Get cutoff trends');
        console.log('GET /api/cutoff/trends?college=&course=&quota=&years=3');
        console.log('');
        console.log('// Get rank predictor');
        console.log('GET /api/cutoff/predictor?rank=5000&category=AIQ_UG&quota=AIQ');
        console.log('```');
    }
}

// Main execution
async function main() {
    const analyzer = new CutoffDataAnalyzer();
    
    try {
        await analyzer.analyzeCutoffStructure();
        analyzer.generateDatabaseSchema();
        analyzer.generateAPIEndpoints();
    } catch (error) {
        console.error('❌ Main execution error:', error);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { CutoffDataAnalyzer };
