# 📊 **Quotas Foundation Data**

## 📁 **Location**: `backend/data/foundation/quotas/`

## 🎯 **Purpose**
This directory contains the **COMPLETE QUOTA AND RESERVATION** system that will be used for quota management and cross-referencing across all colleges.

## 📋 **Required Files**

### **1. `quota_categories.csv`** ⭐ **CRITICAL**
- **Purpose**: Complete list of all quota categories
- **Format**: CSV with quota information
- **Content**: General, SC, ST, OBC, EWS, PwD quotas

### **2. `state_quotas.json`** ⭐ **CRITICAL**
- **Purpose**: State-specific quota allocations and rules
- **Format**: JSON with state quota details
- **Content**: State-wise quota percentages and categories

### **3. `quota_rules.json`**
- **Purpose**: Detailed quota application rules and criteria
- **Format**: JSON with rule specifications
- **Content**: Eligibility criteria, documentation requirements

### **4. `quota_metadata.json`**
- **Purpose**: Additional quota information and classifications
- **Format**: JSON with extended quota details
- **Content**: Quota types, variations, special cases

## 🚨 **UPLOAD YOUR FOUNDATION DATA HERE**

**Place your master quota and reservation data in this directory:**

```bash
# Navigate to this directory
cd backend/data/foundation/quotas/

# Upload your files here
# - quota_categories.csv
# - state_quotas.json
# - quota_rules.json
# - quota_metadata.json
# - Any other foundation quota data
```

## 🔍 **Data Validation**
Once uploaded, this data will be used to:
- ✅ Validate quota allocations across colleges
- ✅ Cross-reference quota rules and categories
- ✅ Ensure quota consistency
- ✅ Provide quota reference for the platform

---

**⚠️ DO NOT EDIT THESE FILES DIRECTLY - They are foundation data!**
