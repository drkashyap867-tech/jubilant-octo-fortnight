#!/usr/bin/env node

/**
 * 🎓 Simple Course Extractor
 * Extracts courses from foundation data and organizes them by stream
 */

const fs = require('fs');
const path = require('path');

class CourseExtractor {
    constructor() {
        this.foundationPath = path.join(__dirname, '../data/foundation');
        this.processedPath = path.join(__dirname, '../data/processed');
        this.outputPath = path.join(__dirname, '../data/foundation/extracted-courses.json');
    }

    async extractCourses() {
        console.log('🎓 Extracting courses from foundation data...');
        
        const courses = {
            medical: [],
            dental: [],
            dnb: [],
            metadata: {
                extractedAt: new Date().toISOString(),
                totalCourses: 0
            }
        };

        try {
            // Extract from processed files (they're already cleaned)
            const medicalPath = path.join(this.processedPath, 'medical_processed.csv');
            const dentalPath = path.join(this.processedPath, 'dental_processed.csv');
            const dnbPath = path.join(this.processedPath, 'dnb_processed.csv');

            // Extract medical courses
            if (fs.existsSync(medicalPath)) {
                const content = fs.readFileSync(medicalPath, 'utf8');
                const lines = content.split('\n').slice(1); // Skip header
                
                lines.forEach(line => {
                    if (line.trim()) {
                        const [course] = line.split(',');
                        if (course && course.trim() && !course.includes('COURSE') && !course.includes('SUPER SPECIALITY')) {
                            courses.medical.push({
                                name: course.trim(),
                                type: this.categorizeCourse(course.trim()),
                                stream: 'medical'
                            });
                        }
                    }
                });
            }

            // Extract dental courses
            if (fs.existsSync(dentalPath)) {
                const content = fs.readFileSync(dentalPath, 'utf8');
                const lines = content.split('\n').slice(1);
                
                lines.forEach(line => {
                    if (line.trim()) {
                        const [course] = line.split(',');
                        if (course && course.trim() && !course.includes('COURSE') && !course.includes('SUPER SPECIALITY')) {
                            courses.dental.push({
                                name: course.trim(),
                                type: this.categorizeCourse(course.trim()),
                                stream: 'dental'
                            });
                        }
                    }
                });
            }

            // Extract DNB courses
            if (fs.existsSync(dnbPath)) {
                const content = fs.readFileSync(dnbPath, 'utf8');
                const lines = content.split('\n').slice(1);
                
                lines.forEach(line => {
                    if (line.trim()) {
                        const [course] = line.split(',');
                        if (course && course.trim() && !course.includes('COURSE') && !course.includes('SUPER SPECIALITY')) {
                            courses.dnb.push({
                                name: course.trim(),
                                type: this.categorizeCourse(course.trim()),
                                stream: 'dnb'
                            });
                        }
                    }
                });
            }

            // Calculate totals
            courses.metadata.totalCourses = courses.medical.length + courses.dental.length + courses.dnb.length;

            // Save extracted courses
            fs.writeFileSync(this.outputPath, JSON.stringify(courses, null, 2));
            
            console.log(`✅ Extracted ${courses.medical.length} medical courses`);
            console.log(`✅ Extracted ${courses.dental.length} dental courses`);
            console.log(`✅ Extracted ${courses.dnb.length} DNB courses`);
            console.log(`✅ Total: ${courses.metadata.totalCourses} courses`);
            console.log(`✅ Saved to: ${this.outputPath}`);

            return courses;

        } catch (error) {
            console.error('❌ Error extracting courses:', error);
            return null;
        }
    }

    categorizeCourse(courseName) {
        const name = courseName.toUpperCase();
        
        // MBBS
        if (name.includes('MBBS') || name.includes('M.B.B.S')) {
            return 'MBBS';
        }
        
        // MD courses
        if (name.includes('MD -') || name.includes('MD-')) {
            return 'MD';
        }
        
        // MS courses
        if (name.includes('MS -') || name.includes('MS-')) {
            return 'MS';
        }
        
        // DM courses
        if (name.includes('DM -') || name.includes('DM-')) {
            return 'DM';
        }
        
        // MCh courses
        if (name.includes('M.CH') || name.includes('MCH')) {
            return 'MCh';
        }
        
        // BDS
        if (name.includes('BDS')) {
            return 'BDS';
        }
        
        // MDS
        if (name.includes('MDS')) {
            return 'MDS';
        }
        
        // DNB
        if (name.includes('DNB')) {
            return 'DNB';
        }
        
        // Diploma
        if (name.includes('DIPLOMA')) {
            return 'Diploma';
        }
        
        return 'Other';
    }
}

// Run the extractor
if (require.main === module) {
    const extractor = new CourseExtractor();
    extractor.extractCourses().then(() => {
        console.log('🎯 Course extraction complete!');
        process.exit(0);
    }).catch(error => {
        console.error('❌ Course extraction failed:', error);
        process.exit(1);
    });
}

module.exports = CourseExtractor;
