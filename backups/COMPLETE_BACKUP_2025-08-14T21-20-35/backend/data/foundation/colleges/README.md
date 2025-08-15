# 🏥 **Colleges Foundation Data**

## 📁 **Location**: `backend/data/foundation/colleges/`

## 🎯 **Purpose**
This directory contains the **MASTER LIST** of ALL colleges across India that will be used as the foundation for validation and cross-referencing.

## 📋 **Required Files**

### **1. `all_colleges_master.csv`** ⭐ **CRITICAL**
- **Purpose**: Complete database of all colleges
- **Format**: CSV with comprehensive college information
- **Content**: All colleges with full details

### **2. `college_identifiers.json`**
- **Purpose**: Unique identifiers and codes for each college
- **Format**: JSON with college codes and mappings
- **Content**: College codes, official names, abbreviations

### **3. `college_metadata.json`**
- **Purpose**: Additional metadata and classification
- **Format**: JSON with extended college information
- **Content**: Categories, tags, specializations

## 🚨 **UPLOAD YOUR FOUNDATION DATA HERE**

**Place your master college list files in this directory:**

```bash
# Navigate to this directory
cd backend/data/foundation/colleges/

# Upload your files here
# - all_colleges_master.csv
# - college_identifiers.json  
# - college_metadata.json
# - Any other foundation college data
```

## 🔍 **Data Validation**
Once uploaded, this data will be used to:
- ✅ Validate all imported college data
- ✅ Cross-reference college information
- ✅ Ensure data consistency
- ✅ Provide master reference for the platform

---

**⚠️ DO NOT EDIT THESE FILES DIRECTLY - They are foundation data!**
