const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class AIIDataCleaner {
    constructor() {
        this.dbPath = path.join(__dirname, 'data', 'cutoff_ranks_enhanced.db');
        this.db = null;
        this.backupPath = path.join(__dirname, 'data', 'cutoff_ranks_enhanced_BACKUP_BEFORE_AIQ_CLEAR.db');
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

    async createBackup() {
        try {
            console.log('💾 Creating backup before clearing AIQ data...');
            
            if (fs.existsSync(this.dbPath)) {
                fs.copyFileSync(this.dbPath, this.backupPath);
                console.log(`✅ Backup created: ${this.backupPath}`);
            }
        } catch (error) {
            console.error('❌ Backup failed:', error.message);
            throw error;
        }
    }

    async clearAIQData() {
        try {
            console.log('🧹 Clearing existing AIQ data...');
            
            // Count AIQ records before deletion
            const beforeCount = await this.queryOne(`
                SELECT COUNT(*) as count 
                FROM cutoff_ranks_enhanced 
                WHERE counselling_type LIKE 'AIQ_%'
            `);
            
            console.log(`📊 AIQ records before deletion: ${beforeCount.count.toLocaleString()}`);
            
            // Delete all AIQ records
            const result = await this.runQuery(`
                DELETE FROM cutoff_ranks_enhanced 
                WHERE counselling_type LIKE 'AIQ_%'
            `);
            
            console.log(`🗑️  Deleted ${result.changes.toLocaleString()} AIQ records`);
            
            // Verify deletion
            const afterCount = await this.queryOne(`
                SELECT COUNT(*) as count 
                FROM cutoff_ranks_enhanced 
                WHERE counselling_type LIKE 'AIQ_%'
            `);
            
            console.log(`📊 AIQ records after deletion: ${afterCount.count.toLocaleString()}`);
            
            // Get total records
            const totalRecords = await this.queryOne('SELECT COUNT(*) as count FROM cutoff_ranks_enhanced');
            console.log(`📊 Total database records: ${totalRecords.count.toLocaleString()}`);
            
            return result.changes;
            
        } catch (error) {
            console.error('Error clearing AIQ data:', error.message);
            throw error;
        }
    }

    async queryOne(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    async runQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err) {
                if (err) reject(err);
                else resolve({ lastID: this.lastID, changes: this.changes });
            });
        });
    }

    async runCleanup() {
        try {
            console.log('🚀 Starting AIQ Data Cleanup...');
            
            await this.connect();
            
            // Create backup
            await this.createBackup();
            
            // Clear AIQ data
            const deletedCount = await this.clearAIQData();
            
            console.log('\n🎉 AIQ Data Cleanup completed successfully!');
            console.log(`🗑️  Records deleted: ${deletedCount.toLocaleString()}`);
            console.log(`💾 Backup saved: ${this.backupPath}`);
            console.log('✅ Ready for perfect AIQ re-import!');

        } catch (error) {
            console.error('❌ AIQ data cleanup failed:', error.message);
            console.log('💾 Restore from backup if needed');
        } finally {
            await this.disconnect();
        }
    }
}

// Run the cleanup
const cleaner = new AIIDataCleaner();
cleaner.runCleanup();
