const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class EnhancedAPIEndpoints {
    constructor() {
        this.medicalDbPath = path.join(__dirname, 'data/medical_seats.db');
        this.dentalDbPath = path.join(__dirname, 'data/dental_seats.db');
        this.dnbDbPath = path.join(__dirname, 'data/dnb_seats.db');
        this.counsellingDbPath = path.join(__dirname, 'data/counselling.db');
        this.cutoffDbPath = path.join(__dirname, 'data/cutoff_ranks.db');
        this.collegesDbPath = path.join(__dirname, 'data/colleges.db');
    }

    // ===== MEDICAL SEATS API =====
    async getMedicalSeats(filters = {}) {
        const db = new sqlite3.Database(this.medicalDbPath);
        
        try {
            let query = `
                SELECT 
                    m.*,
                    m.college_name,
                    m.state,
                    m.city,
                    m.management_type,
                    m.establishment_year,
                    m.quota_type as quota
                FROM medical_courses m
                WHERE 1=1
            `;
            
            const params = [];
            
            if (filters.state) {
                query += ' AND m.state LIKE ?';
                params.push(`%${filters.state}%`);
            }
            
            if (filters.college_type) {
                query += ' AND m.course_type LIKE ?';
                params.push(`%${filters.college_type}%`);
            }
            
            if (filters.course_name) {
                query += ' AND m.course_name LIKE ?';
                params.push(`%${filters.course_name}%`);
            }
            
            if (filters.quota) {
                query += ' AND m.quota_type LIKE ?';
                params.push(`%${filters.quota}%`);
            }
            
            query += ' ORDER BY m.college_name, m.course_name LIMIT ?';
            params.push(filters.limit || 100);
            
            const results = await this.runQuery(db, query, params);
            return results;
            
        } finally {
            db.close();
        }
    }

    // ===== DENTAL SEATS API =====
    async getDentalSeats(filters = {}) {
        const db = new sqlite3.Database(this.dentalDbPath);
        
        try {
            let query = `
                SELECT 
                    d.*,
                    d.college_name,
                    d.state,
                    d.city,
                    d.management_type,
                    d.establishment_year,
                    d.quota_type as quota
                FROM dental_courses d
                WHERE 1=1
            `;
            
            const params = [];
            
            if (filters.state) {
                query += ' AND d.state LIKE ?';
                params.push(`%${filters.state}%`);
            }
            
            if (filters.college_type) {
                query += ' AND d.course_type LIKE ?';
                params.push(`%${filters.college_type}%`);
            }
            
            if (filters.course_name) {
                query += ' AND d.course_name LIKE ?';
                params.push(`%${filters.course_name}%`);
            }
            
            if (filters.quota) {
                query += ' AND d.quota_type LIKE ?';
                params.push(`%${filters.quota}%`);
            }
            
            query += ' ORDER BY d.college_name, d.course_name LIMIT ?';
            params.push(filters.limit || 100);
            
            const results = await this.runQuery(db, query, params);
            return results;
            
        } finally {
            db.close();
        }
    }

    // ===== DNB SEATS API =====
    async getDNBSeats(filters = {}) {
        const db = new sqlite3.Database(this.dnbDbPath);
        
        try {
            let query = `
                SELECT 
                    dn.*,
                    dn.college_name,
                    dn.state,
                    dn.city,
                    dn.hospital_type as management_type,
                    dn.accreditation,
                    dn.quota_type as quota
                FROM dnb_courses dn
                WHERE 1=1
            `;
            
            const params = [];
            
            if (filters.state) {
                query += ' AND dn.state LIKE ?';
                params.push(`%${filters.state}%`);
            }
            
            if (filters.college_type) {
                query += ' AND dn.course_type LIKE ?';
                params.push(`%${filters.college_type}%`);
            }
            
            if (filters.course_name) {
                query += ' AND dn.course_name LIKE ?';
                params.push(`%${filters.course_name}%`);
            }
            
            if (filters.quota) {
                query += ' AND dn.quota_type LIKE ?';
                params.push(`%${filters.quota}%`);
            }
            
            query += ' ORDER BY dn.college_name, dn.course_name LIMIT ?';
            params.push(filters.limit || 100);
            
            const results = await this.runQuery(db, query, params);
            return results;
            
        } finally {
            db.close();
        }
    }

    // ===== COUNSELLING DATA API =====
    async getCounsellingData(filters = {}) {
        const db = new sqlite3.Database(this.counsellingDbPath);
        
        try {
            let query = `
                SELECT 
                    cd.*,
                    ct.type_name as counselling_type_name,
                    cr.round_name as round_name
                FROM counselling_data cd
                JOIN counselling_types ct ON cd.counselling_type_id = ct.id
                JOIN counselling_rounds cr ON cd.counselling_round_id = cr.id
                WHERE 1=1
            `;
            
            const params = [];
            
            if (filters.counselling_type) {
                query += ' AND cd.counselling_type_id = ?';
                params.push(filters.counselling_type);
            }
            
            if (filters.academic_year) {
                query += ' AND cd.academic_year = ?';
                params.push(filters.academic_year);
            }
            
            if (filters.round_id) {
                query += ' AND cd.counselling_round_id = ?';
                params.push(filters.round_id);
            }
            
            if (filters.college_name) {
                query += ' AND cd.college_name LIKE ?';
                params.push(`%${filters.college_name}%`);
            }
            
            if (filters.course_name) {
                query += ' AND cd.course_name LIKE ?';
                params.push(`%${filters.course_name}%`);
            }
            
            if (filters.quota) {
                query += ' AND cd.quota LIKE ?';
                params.push(`%${filters.quota}%`);
            }
            
            if (filters.category) {
                query += ' AND cd.category LIKE ?';
                params.push(`%${filters.category}%`);
            }
            
            query += ' ORDER BY cd.college_name, cd.course_name LIMIT ?';
            params.push(filters.limit || 100);
            
            const results = await this.runQuery(db, query, params);
            return results;
            
        } finally {
            db.close();
        }
    }

    // ===== CUTOFF RANKS API =====
    async getCutoffRanks(filters = {}) {
        const db = new sqlite3.Database(this.cutoffDbPath);
        
        try {
            let query = `
                SELECT 
                    cr.*,
                    CASE 
                        WHEN cr.counselling_type_id = 1 THEN 'AIQ_PG'
                        WHEN cr.counselling_type_id = 2 THEN 'AIQ_UG'
                        WHEN cr.counselling_type_id = 3 THEN 'KEA'
                        ELSE 'UNKNOWN'
                    END as counselling_type_name,
                    CASE 
                        WHEN cr.counselling_round_id = 1 THEN 'R1'
                        WHEN cr.counselling_round_id = 2 THEN 'R2'
                        WHEN cr.counselling_round_id = 3 THEN 'R3'
                        WHEN cr.counselling_round_id = 4 THEN 'R4'
                        WHEN cr.counselling_round_id = 5 THEN 'R5'
                        WHEN cr.counselling_round_id = 6 THEN 'STRAY'
                        WHEN cr.counselling_round_id = 7 THEN 'SPECIAL_STRAY'
                        WHEN cr.counselling_round_id = 8 THEN 'MOPUP'
                        WHEN cr.counselling_round_id = 9 THEN 'EXTENDED_STRAY'
                        WHEN cr.counselling_round_id = 10 THEN 'STRAY_BDS'
                        ELSE 'UNKNOWN'
                    END as round_name
                FROM cutoff_ranks cr
                WHERE 1=1
            `;
            
            const params = [];
            
            if (filters.counselling_type_id) {
                query += ' AND cr.counselling_type_id = ?';
                params.push(filters.counselling_type_id);
            }
            
            if (filters.academic_year) {
                query += ' AND cr.academic_year = ?';
                params.push(filters.academic_year);
            }
            
            if (filters.round_id) {
                query += ' AND cr.counselling_round_id = ?';
                params.push(filters.round_id);
            }
            
            if (filters.college_name) {
                query += ' AND cr.college_name LIKE ?';
                params.push(`%${filters.college_name}%`);
            }
            
            if (filters.course_name) {
                query += ' AND cr.course_name LIKE ?';
                params.push(`%${filters.course_name}%`);
            }
            
            if (filters.quota) {
                query += ' AND cr.quota LIKE ?';
                params.push(`%${filters.quota}%`);
            }
            
            if (filters.category) {
                query += ' AND cr.category LIKE ?';
                params.push(`%${filters.category}%`);
            }
            
            if (filters.max_rank) {
                query += ' AND cr.cutoff_rank <= ?';
                params.push(filters.max_rank);
            }
            
            query += ' ORDER BY cr.cutoff_rank ASC, cr.college_name LIMIT ?';
            params.push(filters.limit || 100);
            
            const results = await this.runQuery(db, query, params);
            return results;
            
        } finally {
            db.close();
        }
    }

    // ===== COMPREHENSIVE SEARCH API =====
    async comprehensiveSearch(searchTerm, filters = {}) {
        const results = {
            medical: [],
            dental: [],
            dnb: [],
            counselling: [],
            cutoff: []
        };
        
        try {
            // Search across all databases
            if (!filters.exclude_medical) {
                results.medical = await this.searchMedicalSeats(searchTerm, filters);
            }
            
            if (!filters.exclude_dental) {
                results.dental = await this.searchDentalSeats(searchTerm, filters);
            }
            
            if (!filters.exclude_dnb) {
                results.dnb = await this.searchDNBSeats(searchTerm, filters);
            }
            
            if (!filters.exclude_counselling) {
                results.counselling = await this.searchCounsellingData(searchTerm, filters);
            }
            
            if (!filters.exclude_cutoff) {
                results.cutoff = await this.searchCutoffRanks(searchTerm, filters);
            }
            
            // Calculate totals
            const totalResults = results.medical.length + results.dental.length + 
                               results.dnb.length + results.counselling.length + results.cutoff.length;
            
            return {
                results,
                total: totalResults,
                searchTerm,
                filters,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('Comprehensive search error:', error);
            throw error;
        }
    }

    // ===== SEARCH HELPER METHODS =====
    async searchMedicalSeats(searchTerm, filters = {}) {
        const db = new sqlite3.Database(this.medicalDbPath);
        
        try {
            const query = `
                SELECT 
                    m.*,
                    m.college_name,
                    m.state,
                    m.course_type
                FROM medical_courses m
                WHERE (
                    m.college_name LIKE ? OR 
                    m.course_name LIKE ? OR 
                    m.state LIKE ?
                )
                ORDER BY m.college_name, m.course_name
                LIMIT ?
            `;
            
            const params = [
                `%${searchTerm}%`,
                `%${searchTerm}%`,
                `%${searchTerm}%`,
                filters.limit || 50
            ];
            
            return await this.runQuery(db, query, params);
            
        } finally {
            db.close();
        }
    }

    async searchDentalSeats(searchTerm, filters = {}) {
        const db = new sqlite3.Database(this.dentalDbPath);
        
        try {
            const query = `
                SELECT 
                    d.*,
                    d.college_name,
                    d.state,
                    d.course_type
                FROM dental_courses d
                WHERE (
                    d.college_name LIKE ? OR 
                    d.course_name LIKE ? OR 
                    d.state LIKE ?
                )
                ORDER BY d.college_name, d.course_name
                LIMIT ?
            `;
            
            const params = [
                `%${searchTerm}%`,
                `%${searchTerm}%`,
                `%${searchTerm}%`,
                filters.limit || 50
            ];
            
            return await this.runQuery(db, query, params);
            
        } finally {
                db.close();
        }
    }

    async searchDNBSeats(searchTerm, filters = {}) {
        const db = new sqlite3.Database(this.dnbDbPath);
        
        try {
            const query = `
                SELECT 
                    dn.*,
                    dn.college_name,
                    dn.state,
                    dn.course_type
                FROM dnb_courses dn
                WHERE (
                    dn.college_name LIKE ? OR 
                    dn.college_name LIKE ? OR 
                    dn.state LIKE ?
                )
                ORDER BY dn.college_name, dn.course_name
                LIMIT ?
            `;
            
            const params = [
                `%${searchTerm}%`,
                `%${searchTerm}%`,
                `%${searchTerm}%`,
                filters.limit || 50
            ];
            
            return await this.runQuery(db, query, params);
            
        } finally {
            db.close();
        }
    }

    async searchCounsellingData(searchTerm, filters = {}) {
        const db = new sqlite3.Database(this.counsellingDbPath);
        
        try {
            const query = `
                SELECT 
                    cd.*,
                    ct.type_name as counselling_type_name,
                    cr.round_name as round_name
                FROM counselling_data cd
                JOIN counselling_types ct ON cd.counselling_type_id = ct.id
                JOIN counselling_rounds cr ON cd.counselling_round_id = cr.id
                WHERE (
                    cd.college_name LIKE ? OR 
                    cd.course_name LIKE ? OR 
                    cd.quota LIKE ? OR
                    cd.category LIKE ?
                )
                ORDER BY cd.college_name, cd.course_name
                LIMIT ?
            `;
            
            const params = [
                `%${searchTerm}%`,
                `%${searchTerm}%`,
                `%${searchTerm}%`,
                `%${searchTerm}%`,
                filters.limit || 50
            ];
            
            return await this.runQuery(db, query, params);
            
        } finally {
            db.close();
        }
    }

    async searchCutoffRanks(searchTerm, filters = {}) {
        const db = new sqlite3.Database(this.cutoffDbPath);
        
        try {
            const query = `
                SELECT 
                    cr.*,
                    CASE 
                        WHEN cr.counselling_type_id = 1 THEN 'AIQ_PG'
                        WHEN cr.counselling_type_id = 2 THEN 'AIQ_UG'
                        WHEN cr.counselling_type_id = 3 THEN 'KEA'
                        ELSE 'UNKNOWN'
                    END as counselling_type_name
                FROM cutoff_ranks cr
                WHERE (
                    cr.college_name LIKE ? OR 
                    cr.course_name LIKE ? OR 
                    cr.quota LIKE ? OR
                    cr.category LIKE ?
                )
                ORDER BY cr.cutoff_rank ASC, cr.college_name
                LIMIT ?
            `;
            
            const params = [
                `%${searchTerm}%`,
                `%${searchTerm}%`,
                `%${searchTerm}%`,
                `%${searchTerm}%`,
                filters.limit || 50
            ];
            
            return await this.runQuery(db, query, params);
            
        } finally {
            db.close();
        }
    }

    // ===== STATISTICS API =====
    async getComprehensiveStats() {
        try {
            const stats = {
                medical: await this.getMedicalStats(),
                dental: await this.getDentalStats(),
                dnb: await this.getDNBStats(),
                counselling: await this.getCounsellingStats(),
                cutoff: await this.getCutoffStats(),
                timestamp: new Date().toISOString()
            };
            
            return stats;
            
        } catch (error) {
            console.error('Get comprehensive stats error:', error);
            throw error;
        }
    }

    async getMedicalStats() {
        const db = new sqlite3.Database(this.medicalDbPath);
        
        try {
            const query = `
                SELECT 
                    COUNT(*) as total_records,
                    COUNT(DISTINCT college_id) as unique_colleges,
                    COUNT(DISTINCT course_name) as unique_courses,
                    COUNT(DISTINCT quota_type) as quota_types,
                    SUM(total_seats) as total_seats
                FROM medical_courses
            `;
            
            const results = await this.runQuery(db, query);
            return results[0];
            
        } finally {
            db.close();
        }
    }

    async getDentalStats() {
        const db = new sqlite3.Database(this.dentalDbPath);
        
        try {
            const query = `
                SELECT 
                    COUNT(*) as total_records,
                    COUNT(DISTINCT college_id) as unique_colleges,
                    COUNT(DISTINCT course_name) as unique_courses,
                    COUNT(DISTINCT quota_type) as quota_types,
                    SUM(total_seats) as total_seats
                FROM dental_courses
            `;
            
            const results = await this.runQuery(db, query);
            return results[0];
            
        } finally {
            db.close();
        }
    }

    async getDNBStats() {
        const db = new sqlite3.Database(this.dnbDbPath);
        
        try {
            const query = `
                SELECT 
                    COUNT(*) as total_records,
                    COUNT(DISTINCT college_id) as unique_colleges,
                    COUNT(DISTINCT course_name) as unique_courses,
                    COUNT(DISTINCT quota_type) as quota_types,
                    SUM(total_seats) as total_seats
                FROM dnb_courses
            `;
            
            const results = await this.runQuery(db, query);
            return results[0];
            
        } finally {
            db.close();
        }
    }

    async getCounsellingStats() {
        const db = new sqlite3.Database(this.counsellingDbPath);
        
        try {
            const query = `
                SELECT 
                    COUNT(*) as total_records,
                    COUNT(DISTINCT counselling_type_id) as counselling_types,
                    COUNT(DISTINCT counselling_round_id) as rounds,
                    COUNT(DISTINCT academic_year) as years,
                    COUNT(DISTINCT quota) as quota_types,
                    COUNT(DISTINCT category) as categories
                FROM counselling_data
            `;
            
            const results = await this.runQuery(db, query);
            return results[0];
            
        } finally {
            db.close();
        }
    }

    async getCutoffStats() {
        const db = new sqlite3.Database(this.cutoffDbPath);
        
        try {
            const query = `
                SELECT 
                    COUNT(*) as total_records,
                    COUNT(DISTINCT counselling_type_id) as counselling_types,
                    COUNT(DISTINCT counselling_round_id) as rounds,
                    COUNT(DISTINCT academic_year) as years,
                    COUNT(DISTINCT quota) as quota_types,
                    COUNT(DISTINCT category) as categories,
                    MIN(cutoff_rank) as lowest_rank,
                    MAX(cutoff_rank) as highest_rank,
                    AVG(cutoff_rank) as average_rank
                FROM cutoff_ranks
            `;
            
            const results = await this.runQuery(db, query);
            return results[0];
            
        } finally {
            db.close();
        }
    }

    // ===== UTILITY METHODS =====
    async runQuery(db, sql, params = []) {
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async runQuerySingle(db, sql, params = []) {
        return new Promise((resolve, reject) => {
            db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }
}

module.exports = { EnhancedAPIEndpoints };
