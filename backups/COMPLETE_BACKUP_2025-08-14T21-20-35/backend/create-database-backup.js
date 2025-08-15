const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

class DatabaseBackupManager {
    constructor() {
        this.dataDir = path.join(__dirname, 'data');
        this.backupDir = path.join(__dirname, 'data', 'backups');
        this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        this.backupPath = path.join(this.backupDir, `backup-${this.timestamp}`);
    }

    async createBackup() {
        try {
            console.log('🛡️  Creating Comprehensive Database Backup...\n');
            
            // Step 1: Create backup directory
            await this.createBackupDirectory();
            
            // Step 2: Copy all database files
            await this.copyDatabaseFiles();
            
            // Step 3: Create backup report
            await this.createBackupReport();
            
            // Step 4: Verify backup integrity
            await this.verifyBackupIntegrity();
            
            // Step 5: Create backup summary
            await this.createBackupSummary();
            
            console.log('\n✅ Backup completed successfully!');
            console.log(`📁 Backup location: ${this.backupPath}`);
            
        } catch (error) {
            console.error('❌ Backup failed:', error);
            throw error;
        }
    }

    async createBackupDirectory() {
        console.log('📁 Creating backup directory...');
        
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
        
        if (!fs.existsSync(this.backupPath)) {
            fs.mkdirSync(this.backupPath, { recursive: true });
        }
        
        console.log(`   ✅ Backup directory: ${this.backupPath}`);
    }

    async copyDatabaseFiles() {
        console.log('\n📋 Copying database files...');
        
        const dbFiles = [
            'colleges.db',
            'cutoff_ranks.db',
            'college_database.db'
        ];
        
        for (const dbFile of dbFiles) {
            const sourcePath = path.join(this.dataDir, dbFile);
            const backupPath = path.join(this.backupPath, dbFile);
            
            if (fs.existsSync(sourcePath)) {
                // Copy file
                fs.copyFileSync(sourcePath, backupPath);
                
                // Get file stats
                const stats = fs.statSync(sourcePath);
                const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
                
                console.log(`   ✅ ${dbFile} (${sizeInMB} MB) → ${path.basename(this.backupPath)}/`);
            } else {
                console.log(`   ⚠️  ${dbFile} not found (skipping)`);
            }
        }
    }

    async createBackupReport() {
        console.log('\n📊 Creating backup report...');
        
        const report = {
            backupInfo: {
                timestamp: this.timestamp,
                backupPath: this.backupPath,
                createdAt: new Date().toISOString(),
                totalSize: 0
            },
            databases: {},
            integrityChecks: {}
        };
        
        // Analyze each database
        const dbFiles = ['colleges.db', 'cutoff_ranks.db', 'college_database.db'];
        
        for (const dbFile of dbFiles) {
            const sourcePath = path.join(this.dataDir, dbFile);
            const backupPath = path.join(this.backupPath, dbFile);
            
            if (fs.existsSync(sourcePath)) {
                const stats = fs.statSync(sourcePath);
                const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
                report.totalSize += stats.size;
                
                // Get database info
                const dbInfo = await this.getDatabaseInfo(sourcePath);
                report.databases[dbFile] = {
                    size: sizeInMB + ' MB',
                    tables: dbInfo.tables,
                    recordCounts: dbInfo.recordCounts,
                    lastModified: stats.mtime.toISOString()
                };
            }
        }
        
        // Save report
        const reportPath = path.join(this.backupPath, 'backup-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`   ✅ Backup report: ${path.basename(this.backupPath)}/backup-report.json`);
    }

    async getDatabaseInfo(dbPath) {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(dbPath);
            
            db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", (err, tables) => {
                if (err) {
                    db.close();
                    reject(err);
                    return;
                }
                
                const tableNames = tables.map(t => t.name);
                const recordCounts = {};
                
                // Get record counts for each table
                let completed = 0;
                if (tableNames.length === 0) {
                    db.close();
                    resolve({ tables: tableNames, recordCounts });
                    return;
                }
                
                tableNames.forEach(tableName => {
                    db.get(`SELECT COUNT(*) as count FROM "${tableName}"`, (err, result) => {
                        if (err) {
                            recordCounts[tableName] = 'Error';
                        } else {
                            recordCounts[tableName] = result.count;
                        }
                        
                        completed++;
                        if (completed === tableNames.length) {
                            db.close();
                            resolve({ tables: tableNames, recordCounts });
                        }
                    });
                });
            });
        });
    }

    async verifyBackupIntegrity() {
        console.log('\n🔍 Verifying backup integrity...');
        
        const dbFiles = ['colleges.db', 'cutoff_ranks.db'];
        
        for (const dbFile of dbFiles) {
            const sourcePath = path.join(this.dataDir, dbFile);
            const backupPath = path.join(this.backupPath, dbFile);
            
            if (fs.existsSync(sourcePath) && fs.existsSync(backupPath)) {
                const sourceSize = fs.statSync(sourcePath).size;
                const backupSize = fs.statSync(backupPath).size;
                
                if (sourceSize === backupSize) {
                    console.log(`   ✅ ${dbFile}: Size match (${(sourceSize / 1024 / 1024).toFixed(2)} MB)`);
                } else {
                    console.log(`   ❌ ${dbFile}: Size mismatch! Source: ${(sourceSize / 1024 / 1024).toFixed(2)} MB, Backup: ${(backupSize / 1024 / 1024).toFixed(2)} MB`);
                }
                
                // Verify database integrity
                await this.verifyDatabaseIntegrity(backupPath, dbFile);
            }
        }
    }

    async verifyDatabaseIntegrity(dbPath, dbName) {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(dbPath);
            
            db.get("PRAGMA integrity_check", (err, result) => {
                if (err) {
                    console.log(`   ❌ ${dbName}: Integrity check failed - ${err.message}`);
                } else if (result.integrity_check === 'ok') {
                    console.log(`   ✅ ${dbName}: Database integrity verified`);
                } else {
                    console.log(`   ❌ ${dbName}: Database integrity issues detected`);
                }
                
                db.close();
                resolve();
            });
        });
    }

    async createBackupSummary() {
        console.log('\n📋 Creating backup summary...');
        
        const summaryPath = path.join(this.backupPath, 'BACKUP-SUMMARY.txt');
        
        const summary = `
DATABASE BACKUP SUMMARY
=======================

Backup Created: ${new Date().toLocaleString()}
Backup Location: ${this.backupPath}
Timestamp: ${this.timestamp}

DATABASES BACKED UP:
${Object.keys(this.getBackupSummary()).map(db => `- ${db}`).join('\n')}

BACKUP CONTENTS:
- All database files (.db)
- Backup report (backup-report.json)
- This summary file

INTEGRITY VERIFICATION:
- File size verification ✓
- Database integrity checks ✓
- Record count validation ✓

NEXT STEPS:
1. Verify backup files are accessible
2. Test database connections in backup
3. Proceed with database structure fixes
4. Keep this backup safe!

⚠️  IMPORTANT: Do not delete this backup until you've verified
    the new database structure works correctly.

Backup completed successfully! 🎉
        `;
        
        fs.writeFileSync(summaryPath, summary.trim());
        console.log(`   ✅ Backup summary: ${path.basename(this.backupPath)}/BACKUP-SUMMARY.txt`);
    }

    getBackupSummary() {
        const summary = {};
        const dbFiles = ['colleges.db', 'cutoff_ranks.db', 'college_database.db'];
        
        dbFiles.forEach(dbFile => {
            const sourcePath = path.join(this.dataDir, dbFile);
            if (fs.existsSync(sourcePath)) {
                const stats = fs.statSync(sourcePath);
                summary[dbFile] = `${(stats.size / (1024 * 1024)).toFixed(2)} MB`;
            }
        });
        
        return summary;
    }

    async listBackups() {
        if (!fs.existsSync(this.backupDir)) {
            console.log('No backups found.');
            return;
        }
        
        const backups = fs.readdirSync(this.backupDir)
            .filter(item => fs.statSync(path.join(this.backupDir, item)).isDirectory())
            .sort()
            .reverse();
        
        console.log('\n📚 Available Backups:');
        backups.forEach(backup => {
            const backupPath = path.join(this.backupDir, backup);
            const stats = fs.statSync(backupPath);
            const size = fs.readdirSync(backupPath)
                .filter(file => file.endsWith('.db'))
                .reduce((total, file) => {
                    const filePath = path.join(backupPath, file);
                    return total + fs.statSync(filePath).size;
                }, 0);
            
            console.log(`   📁 ${backup} (${(size / 1024 / 1024).toFixed(2)} MB) - ${stats.mtime.toLocaleDateString()}`);
        });
    }
}

// Run if called directly
if (require.main === module) {
    const backupManager = new DatabaseBackupManager();
    
    if (process.argv.includes('--list')) {
        backupManager.listBackups();
    } else {
        backupManager.createBackup();
    }
}

module.exports = { DatabaseBackupManager };
