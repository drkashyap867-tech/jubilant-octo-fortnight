# 🔄 **VERSION CONTROL & BACKUP SYSTEM GUIDE**

## **🎯 OVERVIEW**

This system provides **TWO types of data protection**:

1. **🔄 MANUAL VERSIONS** - Created ONLY when you ask
2. **🔄 AUTOMATIC BACKUPS** - Created automatically when necessary

## **📋 KEY FEATURES**

- ✅ **Manual Control**: Versions created only when you request them
- ✅ **Smart Backups**: Automatic backups for large changes and errors
- ✅ **Easy Rollback**: Rollback to any previous version
- ✅ **Space Management**: Automatic cleanup of old versions
- ✅ **Configuration**: Customizable backup settings

---

## **🚀 MANUAL VERSION CONTROL**

### **📝 Creating a Manual Version**

**Manual versions are created ONLY when you explicitly ask for them:**

```bash
# Create version with description
node scripts/version-control-manager.js create "After importing medical data"

# Create version without description (uses timestamp)
node scripts/version-control-manager.js create
```

**Example Output:**
```
🔄 Creating manual version: v2.20241220.1430.manual
📝 Description: After importing medical data
✅ Manual version v2.20241220.1430.manual created successfully!
📁 Version file: data/versions/v2.20241220.1430.manual.json
```

### **📋 Listing All Versions**

```bash
node scripts/version-control-manager.js list
```

**Example Output:**
```
📋 Available Versions

────────────────────────────────────────────────────────────────────────────────────────────────────
🔄 MANUAL VERSIONS:
   v2.20241220.1430.manual    | After importing medical data
                              | Created: 2024-12-20T14:30:00.000Z | Size: 2.5MB
   v2.20241220.1200.manual    | Before major update
                              | Created: 2024-12-20T12:00:00.000Z | Size: 2.3MB

────────────────────────────────────────────────────────────────────────────────────────────────────
🔄 AUTO-BACKUPS:
   backup_2024-12-20T14-30-00_large_import_comprehensive_5000_records | large_import_comprehensive_5000_records
                                                                      | Created: 2024-12-20T14:30:00.000Z | Size: 2.5MB
────────────────────────────────────────────────────────────────────────────────────────────────────
```

### **🔄 Rolling Back to a Version**

```bash
# Rollback to specific version
node scripts/version-control-manager.js rollback v2.20241220.1200.manual
```

**Example Output:**
```
🔄 Rolling back to version: v2.20241220.1200.manual
📝 Version description: Before major update
🔄 Creating backup before rollback...
✅ Pre-rollback backup created: backup_2024-12-20T15-00-00_pre_rollback_v2.20241220.1200.manual
✅ Successfully rolled back to version v2.20241220.1200.manual
```

---

## **🔄 AUTOMATIC BACKUP SYSTEM**

### **📊 When Automatic Backups Are Created**

The system automatically creates backups in these situations:

1. **📈 Large Data Changes** (>1000 records)
   - During comprehensive imports
   - When bulk data updates occur

2. **❌ Error Situations**
   - Import failures
   - System errors
   - Data corruption detected

3. **🔄 Before Rollbacks**
   - Pre-rollback backup
   - Post-rollback backup

### **📁 Automatic Backup Locations**

```
data/
├── auto-backups/           # Automatic backups
│   ├── backup_2024-12-20T14-30-00_large_import_comprehensive_5000_records.json
│   ├── backup_2024-12-20T15-00-00_pre_rollback_v2.20241220.1200.manual.json
│   └── backup_2024-12-20T15-05-00_post_rollback_v2.20241220.1200.manual.json
├── versions/               # Manual versions
│   ├── v2.20241220.1430.manual.json
│   └── v2.20241220.1200.manual.json
└── backups/                # Legacy backups (if any)
```

---

## **⚙️ CONFIGURATION**

### **📋 Current Settings**

```bash
node scripts/version-control-manager.js config show
```

**Default Configuration:**
```json
{
  "autoBackup": {
    "enabled": true,
    "frequency": "daily",
    "maxBackups": 10,
    "backupOnImport": true,
    "backupOnError": true,
    "backupOnLargeChanges": true,
    "largeChangeThreshold": 1000
  },
  "manualVersions": {
    "maxVersions": 20,
    "requireDescription": true,
    "autoCleanup": true
  },
  "retention": {
    "autoBackups": "30days",
    "manualVersions": "1year",
    "errorBackups": "7days"
  }
}
```

### **🔧 Customizing Settings**

Edit `data/config/backup-config.json`:

```json
{
  "autoBackup": {
    "enabled": true,
    "largeChangeThreshold": 500,    // Lower threshold for more frequent backups
    "maxBackups": 15                // Keep more backups
  },
  "manualVersions": {
    "maxVersions": 30,              // Keep more manual versions
    "requireDescription": false     // Allow versions without descriptions
  }
}
```

---

## **📊 WORKFLOW EXAMPLES**

### **🔄 Scenario 1: Regular Import with Manual Version**

```bash
# 1. Import your data (creates automatic backup if large)
node scripts/comprehensive-import-processor.js import

# 2. Review the results
node scripts/comprehensive-import-processor.js status

# 3. Create manual version when satisfied
node scripts/version-control-manager.js create "Data import completed successfully"

# 4. List all versions
node scripts/version-control-manager.js list
```

### **🔄 Scenario 2: Testing Changes with Rollback**

```bash
# 1. Create version before making changes
node scripts/version-control-manager.js create "Before testing new features"

# 2. Make your changes/test features

# 3. If something goes wrong, rollback
node scripts/version-control-manager.js rollback v2.20241220.1430.manual

# 4. Verify rollback worked
node scripts/version-control-manager.js list
```

### **🔄 Scenario 3: Managing Multiple Versions**

```bash
# 1. Create version for each major milestone
node scripts/version-control-manager.js create "Phase 1: Foundation data"
node scripts/version-control-manager.js create "Phase 2: Medical colleges added"
node scripts/version-control-manager.js create "Phase 3: Dental colleges added"

# 2. List all versions
node scripts/version-control-manager.js list

# 3. Rollback to any specific phase
node scripts/version-control-manager.js rollback v2.20241220.1200.manual
```

---

## **🚨 TROUBLESHOOTING**

### **❌ "Version not found" error**
- Check version number spelling exactly
- Use `list` command to see available versions
- Ensure version file exists in `data/versions/`

### **❌ "Permission denied" error**
- Make script executable: `chmod +x scripts/version-control-manager.js`
- Check file permissions on data directories

### **❌ "Database versioning failed" error**
- Ensure database versioning system is working
- Check database connection
- Verify foundation data exists

### **⚠️ "No automatic backup created"**
- Check if auto-backup is enabled in config
- Verify change threshold settings
- Check if change is large enough to trigger backup

---

## **📈 BEST PRACTICES**

### **🔄 When to Create Manual Versions**

1. **✅ Before Major Changes**
   - Large data imports
   - System updates
   - Feature deployments

2. **✅ After Successful Operations**
   - Data imports completed
   - System updates successful
   - Major milestones reached

3. **✅ Before Testing**
   - New features
   - Data modifications
   - System experiments

### **🔄 When Automatic Backups Happen**

1. **📈 Large Data Changes** (automatic)
   - Imports > 1000 records
   - Bulk updates
   - System migrations

2. **❌ Error Recovery** (automatic)
   - Import failures
   - System errors
   - Data corruption

3. **🔄 Rollback Safety** (automatic)
   - Pre-rollback backup
   - Post-rollback backup

---

## **🎯 SUMMARY**

### **🔄 Manual Versions (Your Control)**
- Created ONLY when you ask
- Perfect for milestones and major changes
- Easy rollback capability
- Long-term retention

### **🔄 Automatic Backups (System Control)**
- Created automatically when needed
- Protects against data loss
- Manages space efficiently
- Short-term retention

### **🚀 Key Commands**
```bash
# Manual version control
node scripts/version-control-manager.js create "Description"
node scripts/version-control-manager.js list
node scripts/version-control-manager.js rollback <version>

# Configuration
node scripts/version-control-manager.js config show

# Manual backup
node scripts/version-control-manager.js backup "reason"
```

---

## **🎉 READY TO USE?**

Your version control system is now ready! 

**Remember:**
- **Manual versions** = Created only when you ask
- **Automatic backups** = Created automatically when necessary
- **Easy rollback** = Return to any previous state
- **Space management** = Automatic cleanup of old files

**Start by creating your first manual version after a successful import!** 🚀✨
