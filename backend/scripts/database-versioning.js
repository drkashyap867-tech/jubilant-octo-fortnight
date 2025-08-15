const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * 🗄️ Simplified Database Versioning System
 * Based on previous project architecture but simplified to avoid complexity issues
 */
class DatabaseVersioning {
  constructor() {
    this.backupDir = path.join(__dirname, '../../database_backups');
    this.versionFile = path.join(__dirname, '../../database_backups/versions.json');
    this.currentVersion = null;
    this.ensureBackupDirectory();
  }

  /**
   * Ensure backup directory exists
   */
  ensureBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
    
    if (!fs.existsSync(this.versionFile)) {
      this.initializeVersionFile();
    }
  }

  /**
   * Initialize version tracking file
   */
  initializeVersionFile() {
    const initialVersions = {
      current: '1.0.0',
      history: [
        {
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          description: 'Initial database setup',
          backupFile: null
        }
      ]
    };
    
    fs.writeFileSync(this.versionFile, JSON.stringify(initialVersions, null, 2));
    this.currentVersion = '1.0.0';
  }

  /**
   * Load current version information
   */
  loadVersionInfo() {
    try {
      const versionData = JSON.parse(fs.readFileSync(this.versionFile, 'utf8'));
      this.currentVersion = versionData.current;
      return versionData;
    } catch (error) {
      console.error('Error loading version info:', error.message);
      this.initializeVersionFile();
      return this.loadVersionInfo();
    }
  }

  /**
   * Create a new version with backup
   */
  async createVersion(version, description, dataPath = null) {
    try {
      const versionData = this.loadVersionInfo();
      
      // Create backup if data path provided
      let backupFile = null;
      if (dataPath && fs.existsSync(dataPath)) {
        backupFile = await this.createBackup(version, dataPath);
      }
      
      // Add to history
      versionData.history.push({
        version,
        timestamp: new Date().toISOString(),
        description,
        backupFile
      });
      
      // Update current version
      versionData.current = version;
      
      // Save version info
      fs.writeFileSync(this.versionFile, JSON.stringify(versionData, null, 2));
      this.currentVersion = version;
      
      console.log(`✅ Version ${version} created successfully`);
      console.log(`📝 Description: ${description}`);
      if (backupFile) {
        console.log(`💾 Backup: ${backupFile}`);
      }
      
      return { success: true, version, backupFile };
    } catch (error) {
      console.error(`❌ Error creating version ${version}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create backup file
   */
  async createBackup(version, dataPath) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `backup_v${version}_${timestamp}.json`;
      const backupPath = path.join(this.backupDir, backupFileName);
      
      // Read data and create backup
      const data = fs.readFileSync(dataPath, 'utf8');
      const backup = {
        version,
        timestamp: new Date().toISOString(),
        data: data,
        checksum: this.calculateChecksum(data)
      };
      
      fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
      return backupFileName;
    } catch (error) {
      console.error('Error creating backup:', error.message);
      return null;
    }
  }

  /**
   * Calculate checksum for data integrity
   */
  calculateChecksum(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Get current version
   */
  getCurrentVersion() {
    this.loadVersionInfo();
    return this.currentVersion;
  }

  /**
   * Get version history
   */
  getVersionHistory() {
    const versionData = this.loadVersionInfo();
    return versionData.history;
  }

  /**
   * List available backups
   */
  listBackups() {
    try {
      const files = fs.readdirSync(this.backupDir);
      return files.filter(file => file.startsWith('backup_') && file.endsWith('.json'));
    } catch (error) {
      console.error('Error listing backups:', error.message);
      return [];
    }
  }

  /**
   * Validate backup integrity
   */
  validateBackup(backupFileName) {
    try {
      const backupPath = path.join(this.backupDir, backupFileName);
      const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
      
      const calculatedChecksum = this.calculateChecksum(backupData.data);
      const isValid = calculatedChecksum === backupData.checksum;
      
      return {
        isValid,
        backupFileName,
        version: backupData.version,
        timestamp: backupData.timestamp,
        checksum: backupData.checksum,
        calculatedChecksum
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message
      };
    }
  }

  /**
   * Get system status
   */
  getSystemStatus() {
    try {
      const versionData = this.loadVersionInfo();
      const backups = this.listBackups();
      const validBackups = backups.filter(backup => this.validateBackup(backup).isValid);
      
      return {
        currentVersion: versionData.current,
        totalVersions: versionData.history.length,
        totalBackups: backups.length,
        validBackups: validBackups.length,
        systemHealthy: validBackups.length > 0,
        lastUpdate: versionData.history[versionData.history.length - 1]?.timestamp
      };
    } catch (error) {
      return {
        error: error.message,
        systemHealthy: false
      };
    }
  }
}

module.exports = DatabaseVersioning;
