const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class UniversalCutoffAPI {
    constructor() {
        this.dbPath = path.join(__dirname, 'data', 'cutoff_ranks_enhanced.db');
        this.db = null;
    }

    async connect() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    async disconnect() {
        if (this.db) {
            return new Promise((resolve) => {
                this.db.close((err) => {
                    if (err) console.error('Error closing database:', err);
                    resolve();
                });
            });
        }
    }

    // Auto-detect counselling system type
    async detectCounsellingSystem(counsellingType) {
        try {
            const result = await this.queryOne(
                'SELECT system_type, parent_authority FROM counselling_types WHERE type_code = ?',
                [counsellingType]
            );
            return result || { system_type: 'UNKNOWN', parent_authority: 'UNKNOWN' };
        } catch (error) {
            console.error('Error detecting counselling system:', error);
            return { system_type: 'UNKNOWN', parent_authority: 'UNKNOWN' };
        }
    }

    // Get available counselling types
    async getAvailableCounsellingTypes() {
        try {
            return await this.queryAll(
                'SELECT type_code, name, description, system_type, parent_authority FROM counselling_types WHERE is_active = 1 ORDER BY system_type, name'
            );
        } catch (error) {
            console.error('Error getting counselling types:', error);
            return [];
        }
    }

    // Get available years
    async getAvailableYears() {
        try {
            return await this.queryAll(
                'SELECT DISTINCT counselling_year FROM cutoff_ranks_enhanced ORDER BY counselling_year DESC'
            );
        } catch (error) {
            console.error('Error getting years:', error);
            return [];
        }
    }

    // Get available rounds for a specific counselling type and year
    async getAvailableRounds(counsellingType, year) {
        try {
            return await this.queryAll(
                'SELECT DISTINCT round_number, round_name FROM cutoff_ranks_enhanced WHERE counselling_type = ? AND counselling_year = ? ORDER BY round_number',
                [counsellingType, year]
            );
        } catch (error) {
            console.error('Error getting rounds:', error);
            return [];
        }
    }

    // Get AIQ-specific data (quotas and categories)
    async getAIQData() {
        try {
            const quotas = await this.queryAll('SELECT quota_code, quota_name, description FROM aiq_quotas WHERE is_active = 1 ORDER BY quota_name');
            const categories = await this.queryAll('SELECT category_code, category_name, description, reservation_percentage FROM aiq_categories WHERE is_active = 1 ORDER BY category_name');
            
            return { quotas, categories };
        } catch (error) {
            console.error('Error getting AIQ data:', error);
            return { quotas: [], categories: [] };
        }
    }

    // Get State-specific data (categories and quotas)
    async getStateData(stateCode) {
        try {
            const categories = await this.queryAll(
                'SELECT category_code, category_name, description, reservation_percentage FROM state_categories WHERE state_code = ? AND is_active = 1 ORDER BY category_name',
                [stateCode]
            );
            const quotas = await this.queryAll(
                'SELECT quota_code, quota_name, description FROM state_quotas WHERE state_code = ? AND is_active = 1 ORDER BY quota_name',
                [stateCode]
            );
            
            return { categories, quotas };
        } catch (error) {
            console.error('Error getting state data:', error);
            return { categories: [], quotas: [] };
        }
    }

    // Universal search that adapts based on counselling type
    async searchCutoffData(filters) {
        try {
            const {
                counselling_type,
                counselling_year,
                round_number,
                college_name,
                course_name,
                aiq_quota,
                aiq_category,
                state_category,
                state_quota,
                max_rank,
                limit = 100
            } = filters;

            // Auto-detect system type
            const systemInfo = await this.detectCounsellingSystem(counselling_type);
            const isAIQ = systemInfo.system_type === 'AIQ';

            // Build dynamic query based on system type
            let query = `
                SELECT 
                    cr.*,
                    c.name as college_name,
                    co.name as course_name
                FROM cutoff_ranks_enhanced cr
                LEFT JOIN colleges c ON cr.college_id = c.id
                LEFT JOIN courses co ON cr.course_id = co.id
                WHERE 1=1
            `;
            
            const params = [];

            // Add filters
            if (counselling_type) {
                query += ' AND cr.counselling_type = ?';
                params.push(counselling_type);
            }

            if (counselling_year) {
                query += ' AND cr.counselling_year = ?';
                params.push(counselling_year);
            }

            if (round_number) {
                query += ' AND cr.round_number = ?';
                params.push(round_number);
            }

            if (college_name) {
                query += ' AND c.name LIKE ?';
                params.push(`%${college_name}%`);
            }

            if (course_name) {
                query += ' AND co.name LIKE ?';
                params.push(`%${course_name}%`);
            }

            if (max_rank) {
                query += ' AND cr.cutoff_rank <= ?';
                params.push(max_rank);
            }

            // System-specific filters
            if (isAIQ) {
                if (aiq_quota) {
                    query += ' AND cr.aiq_quota = ?';
                    params.push(aiq_quota);
                }
                if (aiq_category) {
                    query += ' AND cr.aiq_category = ?';
                    params.push(aiq_category);
                }
            } else {
                if (state_category) {
                    query += ' AND cr.state_category = ?';
                    params.push(state_category);
                }
                if (state_quota) {
                    query += ' AND cr.state_quota = ?';
                    params.push(state_quota);
                }
            }

            query += ' ORDER BY cr.cutoff_rank ASC LIMIT ?';
            params.push(limit);

            const results = await this.queryAll(query, params);

            // Transform results to show appropriate fields
            return results.map(record => {
                if (isAIQ) {
                    return {
                        ...record,
                        quota: record.aiq_quota,
                        category: record.aiq_category,
                        system_type: 'AIQ',
                        display_fields: {
                            quota: record.aiq_quota,
                            category: record.aiq_category
                        }
                    };
                } else {
                    return {
                        ...record,
                        quota: record.state_quota,
                        category: record.state_category,
                        system_type: 'STATE',
                        display_fields: {
                            category: record.state_category,
                            quota: record.state_quota
                        }
                    };
                }
            });

        } catch (error) {
            console.error('Error searching cutoff data:', error);
            return [];
        }
    }

    // Get cutoff trends for analysis
    async getCutoffTrends(filters) {
        try {
            const {
                counselling_type,
                course_name,
                aiq_category,
                state_category,
                years = 3
            } = filters;

            const systemInfo = await this.detectCounsellingSystem(counselling_type);
            const isAIQ = systemInfo.system_type === 'AIQ';

            let categoryField = isAIQ ? 'aiq_category' : 'state_category';
            let categoryValue = isAIQ ? aiq_category : state_category;

            const query = `
                SELECT 
                    cr.counselling_year,
                    cr.round_number,
                    cr.cutoff_rank,
                    cr.seats_available,
                    cr.seats_filled,
                    c.name as college_name,
                    co.name as course_name
                FROM cutoff_ranks_enhanced cr
                LEFT JOIN colleges c ON cr.college_id = c.id
                LEFT JOIN courses co ON cr.course_id = co.id
                WHERE cr.counselling_type = ?
                AND co.name LIKE ?
                AND cr.${categoryField} = ?
                AND cr.counselling_year >= (SELECT MAX(counselling_year) FROM cutoff_ranks_enhanced) - ?
                ORDER BY cr.counselling_year DESC, cr.round_number ASC
            `;

            return await this.queryAll(query, [counselling_type, `%${course_name}%`, categoryValue, years]);

        } catch (error) {
            console.error('Error getting cutoff trends:', error);
            return [];
        }
    }

    // Get statistics for dashboard
    async getStatistics(filters = {}) {
        try {
            const {
                counselling_type,
                counselling_year,
                round_number
            } = filters;

            let whereClause = 'WHERE 1=1';
            const params = [];

            if (counselling_type) {
                whereClause += ' AND counselling_type = ?';
                params.push(counselling_type);
            }

            if (counselling_year) {
                whereClause += ' AND counselling_year = ?';
                params.push(counselling_year);
            }

            if (round_number) {
                whereClause += ' AND round_number = ?';
                params.push(round_number);
            }

            const stats = await this.queryOne(`
                SELECT 
                    COUNT(*) as total_records,
                    COUNT(DISTINCT college_id) as total_colleges,
                    COUNT(DISTINCT course_id) as total_courses,
                    COUNT(DISTINCT counselling_type) as total_counselling_types,
                    MIN(cutoff_rank) as lowest_rank,
                    MAX(cutoff_rank) as highest_rank,
                    AVG(cutoff_rank) as average_rank,
                    SUM(seats_available) as total_seats_available,
                    SUM(seats_filled) as total_seats_filled
                FROM cutoff_ranks_enhanced
                ${whereClause}
            `, params);

            return stats;

        } catch (error) {
            console.error('Error getting statistics:', error);
            return {};
        }
    }

    // Helper methods for database queries
    async queryAll(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }

    async queryOne(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row || null);
            });
        });
    }

    async run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, changes: this.changes });
            });
        });
    }
}

module.exports = UniversalCutoffAPI;
