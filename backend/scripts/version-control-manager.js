#!/usr/bin/env node

/**
 * 🔄 Version Control Manager for Medical College Data
 * Provides manual version control and automatic backup system
 */

const fs = require('fs');
const path = require('path');
const DatabaseVersioning = require('./database-versioning');

class VersionControlManager {
  constructor() {
    this.versioning = new DatabaseVersioning();
    this.backupPath = path.join(__dirname, '../data/backups');
    this.versionsPath = path.join(__dirname, '../data/versions');
    this.autoBackupPath = path.join(__dirname, '../data/auto-backups');
    
    this.ensureDirectories();
    this.loadConfiguration();
  }

  /**
   * Ensure all necessary directories exist
   */
  ensureDirectories() {
    [this.backupPath, this.versionsPath, this.autoBackupPath].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Load configuration for backup settings
   */
  loadConfiguration() {
    const configPath = path.join(__dirname, '../data/config/backup-config.json');
    
    try {
      if (fs.existsSync(configPath)) {
        this.config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } else {
        this.config = this.createDefaultConfig();
        this.saveConfiguration();
      }
    } catch (error) {
      console.error('Error loading backup config, using defaults:', error.message);
      this.config = this.createDefaultConfig();
    }
  }

  /**
   * Create default backup configuration
   */
  createDefaultConfig() {
    return {
      autoBackup: {
        enabled: true,
        frequency: 'daily', // daily, weekly, monthly
        maxBackups: 10,
        backupOnImport: true,
        backupOnError: true,
        backupOnLargeChanges: true,
        largeChangeThreshold: 1000 // records
      },
      manualVersions: {
        maxVersions: 20,
        requireDescription: true,
        autoCleanup: true
      },
      retention: {
        autoBackups: '30days', // 30days, 3months, 1year, forever
        manualVersions: '1year',
        errorBackups: '7days'
      }
    };
  }

  /**
   * Save configuration to file
   */
  saveConfiguration() {
    const configPath = path.join(__dirname, '../data/config/backup-config.json');
    const configDir = path.dirname(configPath);
    
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    fs.writeFileSync(configPath, JSON.stringify(this.config, null, 2));
  }

  /**
   * Create a manual version (ONLY when you ask)
   */
  async createManualVersion(description = null) {
    try {
      if (!description && this.config.manualVersions.requireDescription) {
        throw new Error('Description is required for manual versions');
      }

      const version = this.generateVersionNumber('manual');
      const finalDescription = description || `Manual version created at ${new Date().toLocaleString()}`;
      
      console.log(`🔄 Creating manual version: ${version}`);
      console.log(`📝 Description: ${finalDescription}`);
      
      // Create version using database versioning
      const versionResult = await this.versioning.createVersion(version, finalDescription);
      
      if (versionResult.success) {
        // Create version metadata
        const versionMetadata = {
          version,
          description: finalDescription,
          type: 'manual',
          createdAt: new Date().toISOString(),
          createdBy: 'user',
          dataSnapshot: await this.createDataSnapshot(),
          fileSize: await this.calculateTotalDataSize()
        };
        
        // Save version metadata
        const versionFile = path.join(this.versionsPath, `${version}.json`);
        fs.writeFileSync(versionFile, JSON.stringify(versionMetadata, null, 2));
        
        console.log(`✅ Manual version ${version} created successfully!`);
        console.log(`📁 Version file: ${versionFile}`);
        
        // Cleanup old versions if needed
        if (this.config.manualVersions.autoCleanup) {
          await this.cleanupOldVersions();
        }
        
        return {
          success: true,
          version,
          description: finalDescription,
          filePath: versionFile
        };
      } else {
        throw new Error(versionResult.error);
      }
      
    } catch (error) {
      console.error(`❌ Error creating manual version: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create automatic backup (when system determines it's necessary)
   */
  async createAutoBackup(reason = 'system') {
    try {
      // Check if auto-backup is enabled
      if (!this.config.autoBackup.enabled) {
        console.log('⚠️  Auto-backup is disabled in configuration');
        return { success: false, reason: 'disabled' };
      }

      const backupId = this.generateBackupId(reason);
      const timestamp = new Date().toISOString();
      
      console.log(`🔄 Creating automatic backup: ${backupId}`);
      console.log(`📝 Reason: ${reason}`);
      
      // Create backup data
      const backupData = {
        backupId,
        reason,
        timestamp,
        type: 'auto',
        dataSnapshot: await this.createDataSnapshot(),
        fileSize: await this.calculateTotalDataSize(),
        systemInfo: {
          nodeVersion: process.version,
          platform: process.platform,
          memory: process.memoryUsage(),
          uptime: process.uptime()
        }
      };
      
      // Save backup
      const backupFile = path.join(this.autoBackupPath, `${backupId}.json`);
      fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
      
      console.log(`✅ Auto-backup ${backupId} created successfully!`);
      console.log(`📁 Backup file: ${backupFile}`);
      
      // Cleanup old auto-backups if needed
      await this.cleanupOldAutoBackups();
      
      return {
        success: true,
        backupId,
        reason,
        filePath: backupFile
      };
      
    } catch (error) {
      console.error(`❌ Error creating auto-backup: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create backup on import (automatic)
   */
  async createImportBackup(importType, recordCount) {
    try {
      if (!this.config.autoBackup.backupOnImport) {
        return { success: false, reason: 'import_backup_disabled' };
      }

      // Check if this is a large change
      if (this.config.autoBackup.backupOnLargeChanges && 
          recordCount > this.config.autoBackup.largeChangeThreshold) {
        return await this.createAutoBackup(`large_import_${importType}_${recordCount}_records`);
      }

      return { success: false, reason: 'not_large_enough' };
      
    } catch (error) {
      console.error(`❌ Error creating import backup: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create backup on error (automatic)
   */
  async createErrorBackup(error, context = 'unknown') {
    try {
      if (!this.config.autoBackup.backupOnError) {
        return { success: false, reason: 'error_backup_disabled' };
      }

      return await this.createAutoBackup(`error_${context}_${error.message.substring(0, 50)}`);
      
    } catch (backupError) {
      console.error(`❌ Error creating error backup: ${backupError.message}`);
      return { success: false, error: backupError.message };
    }
  }

  /**
   * Create data snapshot for versioning
   */
  async createDataSnapshot() {
    try {
      const snapshot = {
        timestamp: new Date().toISOString(),
        dataFiles: {},
        totalSize: 0
      };

      // Check processed data files
      const processedPath = path.join(__dirname, '../data/processed');
      if (fs.existsSync(processedPath)) {
        const files = fs.readdirSync(processedPath);
        
        files.forEach(file => {
          if (file.endsWith('.json')) {
            const filePath = path.join(processedPath, file);
            const stats = fs.statSync(filePath);
            
            snapshot.dataFiles[file] = {
              size: stats.size,
              modified: stats.mtime.toISOString(),
              exists: true
            };
            
            snapshot.totalSize += stats.size;
          }
        });
      }

      return snapshot;
      
    } catch (error) {
      console.error('Error creating data snapshot:', error.message);
      return { error: error.message };
    }
  }

  /**
   * Calculate total data size
   */
  async calculateTotalDataSize() {
    try {
      let totalSize = 0;
      const processedPath = path.join(__dirname, '../data/processed');
      
      if (fs.existsSync(processedPath)) {
        const files = fs.readdirSync(processedPath);
        
        files.forEach(file => {
          if (file.endsWith('.json')) {
            const filePath = path.join(processedPath, file);
            const stats = fs.statSync(filePath);
            totalSize += stats.size;
          }
        });
      }
      
      return {
        bytes: totalSize,
        kilobytes: (totalSize / 1024).toFixed(2),
        megabytes: (totalSize / (1024 * 1024)).toFixed(2)
      };
      
    } catch (error) {
      console.error('Error calculating data size:', error.message);
      return { error: error.message };
    }
  }

  /**
   * Generate version number for manual versions
   */
  generateVersionNumber(type) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    
    if (type === 'manual') {
      return `v2.${year}${month}${day}.${hour}${minute}.manual`;
    } else {
      return `v2.${year}${month}${day}.${hour}${minute}`;
    }
  }

  /**
   * Generate backup ID
   */
  generateBackupId(reason) {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const reasonClean = reason.replace(/[^a-zA-Z0-9]/g, '_');
    
    return `backup_${timestamp}_${reasonClean}`;
  }

  /**
   * List all available versions
   */
  listVersions() {
    try {
      console.log('📋 Available Versions\n');
      console.log('─'.repeat(100));
      
      // Manual versions
      console.log('🔄 MANUAL VERSIONS:');
      const manualVersions = this.getVersionFiles('manual');
      
      if (manualVersions.length === 0) {
        console.log('   No manual versions found');
      } else {
        manualVersions.forEach(version => {
          console.log(`   ${version.version.padEnd(25)} | ${version.description}`);
          console.log(`   ${' '.repeat(25)} | Created: ${version.createdAt} | Size: ${version.fileSize.kilobytes}KB`);
        });
      }
      
      console.log('\n─'.repeat(100));
      
      // Auto-backups
      console.log('🔄 AUTO-BACKUPS:');
      const autoBackups = this.getBackupFiles();
      
      if (autoBackups.length === 0) {
        console.log('   No auto-backups found');
      } else {
        autoBackups.forEach(backup => {
          console.log(`   ${backup.backupId.padEnd(35)} | ${backup.reason}`);
          console.log(`   ${' '.repeat(35)} | Created: ${backup.timestamp} | Size: ${backup.fileSize.kilobytes}KB`);
        });
      }
      
      console.log('─'.repeat(100));
      
    } catch (error) {
      console.error('Error listing versions:', error.message);
    }
  }

  /**
   * Get manual version files
   */
  getVersionFiles(type = 'manual') {
    try {
      const versions = [];
      const searchPath = type === 'manual' ? this.versionsPath : this.autoBackupPath;
      
      if (fs.existsSync(searchPath)) {
        const files = fs.readdirSync(searchPath);
        
        files.forEach(file => {
          if (file.endsWith('.json')) {
            const filePath = path.join(searchPath, file);
            const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            versions.push(content);
          }
        });
      }
      
      // Sort by creation date (newest first)
      return versions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
    } catch (error) {
      console.error('Error getting version files:', error.message);
      return [];
    }
  }

  /**
   * Get backup files
   */
  getBackupFiles() {
    return this.getVersionFiles('auto');
  }

  /**
   * Rollback to a specific version
   */
  async rollbackToVersion(versionNumber) {
    try {
      console.log(`🔄 Rolling back to version: ${versionNumber}`);
      
      // Find the version file
      const versionFile = path.join(this.versionsPath, `${versionNumber}.json`);
      if (!fs.existsSync(versionFile)) {
        throw new Error(`Version ${versionNumber} not found`);
      }
      
      const versionData = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
      console.log(`📝 Version description: ${versionData.description}`);
      
      // Create backup before rollback
      console.log('🔄 Creating backup before rollback...');
      const backupResult = await this.createAutoBackup(`pre_rollback_${versionNumber}`);
      
      if (backupResult.success) {
        console.log(`✅ Pre-rollback backup created: ${backupResult.backupId}`);
      }
      
      // Perform rollback using database versioning
      const rollbackResult = await this.versioning.rollbackToVersion(versionNumber);
      
      if (rollbackResult.success) {
        console.log(`✅ Successfully rolled back to version ${versionNumber}`);
        
        // Create post-rollback backup
        await this.createAutoBackup(`post_rollback_${versionNumber}`);
        
        return {
          success: true,
          version: versionNumber,
          description: versionData.description,
          preRollbackBackup: backupResult.backupId
        };
      } else {
        throw new Error(rollbackResult.error);
      }
      
    } catch (error) {
      console.error(`❌ Error during rollback: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cleanup old versions
   */
  async cleanupOldVersions() {
    try {
      const versions = this.getVersionFiles('manual');
      const maxVersions = this.config.manualVersions.maxVersions;
      
      if (versions.length <= maxVersions) {
        return { success: true, message: 'No cleanup needed' };
      }
      
      const versionsToDelete = versions.slice(maxVersions);
      let deletedCount = 0;
      
      versionsToDelete.forEach(version => {
        const versionFile = path.join(this.versionsPath, `${version.version}.json`);
        if (fs.existsSync(versionFile)) {
          fs.unlinkSync(versionFile);
          deletedCount++;
        }
      });
      
      console.log(`🧹 Cleaned up ${deletedCount} old manual versions`);
      return { success: true, deletedCount };
      
    } catch (error) {
      console.error('Error cleaning up old versions:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cleanup old auto-backups
   */
  async cleanupOldAutoBackups() {
    try {
      const backups = this.getBackupFiles();
      const maxBackups = this.config.autoBackup.maxBackups;
      
      if (backups.length <= maxBackups) {
        return { success: true, message: 'No cleanup needed' };
      }
      
      const backupsToDelete = backups.slice(maxBackups);
      let deletedCount = 0;
      
      backupsToDelete.forEach(backup => {
        const backupFile = path.join(this.autoBackupPath, `${backup.backupId}.json`);
        if (fs.existsSync(backupFile)) {
          fs.unlinkSync(backupFile);
          deletedCount++;
        }
      });
      
      console.log(`🧹 Cleaned up ${deletedCount} old auto-backups`);
      return { success: true, deletedCount };
      
    } catch (error) {
      console.error('Error cleaning up old auto-backups:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update backup configuration
   */
  updateConfiguration(newConfig) {
    try {
      this.config = { ...this.config, ...newConfig };
      this.saveConfiguration();
      
      console.log('✅ Backup configuration updated successfully');
      return { success: true };
      
    } catch (error) {
      console.error('Error updating configuration:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Show current configuration
   */
  showConfiguration() {
    console.log('⚙️  Current Backup Configuration\n');
    console.log('─'.repeat(80));
    
    Object.entries(this.config).forEach(([section, settings]) => {
      console.log(`${section.toUpperCase()}:`);
      
      if (typeof settings === 'object') {
        Object.entries(settings).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
      } else {
        console.log(`  ${settings}`);
      }
      
      console.log('');
    });
    
    console.log('─'.repeat(80));
  }
}

// CLI interface
async function main() {
  const manager = new VersionControlManager();
  const command = process.argv[2];
  
  switch (command) {
    case 'create':
      const description = process.argv[3] || null;
      await manager.createManualVersion(description);
      break;
      
    case 'list':
      manager.listVersions();
      break;
      
    case 'rollback':
      const version = process.argv[3];
      if (version) {
        await manager.rollbackToVersion(version);
      } else {
        console.error('❌ Please specify version number to rollback to');
        console.log('Usage: node scripts/version-control-manager.js rollback <version>');
      }
      break;
      
    case 'config':
      const subCommand = process.argv[3];
      if (subCommand === 'show') {
        manager.showConfiguration();
      } else if (subCommand === 'update') {
        console.log('⚠️  Configuration update not implemented in CLI yet');
        console.log('Edit data/config/backup-config.json manually');
      } else {
        console.log('Usage:');
        console.log('  node scripts/version-control-manager.js config show    - Show current config');
        console.log('  node scripts/version-control-manager.js config update - Update config');
      }
      break;
      
    case 'backup':
      const reason = process.argv[3] || 'manual';
      await manager.createAutoBackup(reason);
      break;
      
    default:
      console.log('🔄 Version Control Manager\n');
      console.log('Usage:');
      console.log('  node scripts/version-control-manager.js create [description] - Create manual version');
      console.log('  node scripts/version-control-manager.js list                 - List all versions');
      console.log('  node scripts/version-control-manager.js rollback <version>  - Rollback to version');
      console.log('  node scripts/version-control-manager.js config show         - Show configuration');
      console.log('  node scripts/version-control-manager.js backup [reason]     - Create manual backup');
      break;
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = VersionControlManager;
