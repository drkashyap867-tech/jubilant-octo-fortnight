# 🗺️ **States Foundation Data**

## 📁 **Location**: `backend/data/foundation/states/`

## 🎯 **Purpose**
This directory contains the **COMPLETE LIST** of Indian states, territories, and cities that will be used for location validation and cross-referencing.

## 📋 **Required Files**

### **1. `indian_states.csv`** ⭐ **CRITICAL**
- **Purpose**: Complete list of all Indian states and territories
- **Format**: CSV with state information
- **Content**: State names, codes, capitals, regions

### **2. `state_metadata.json`**
- **Purpose**: Extended state information and metadata
- **Format**: JSON with state details
- **Content**: Population, area, medical education hubs

### **3. `city_mapping.json`**
- **Purpose**: Cities within each state
- **Format**: JSON with city-state relationships
- **Content**: City names, districts, population

## 🚨 **UPLOAD YOUR FOUNDATION DATA HERE**

**Place your master states and cities data in this directory:**

```bash
# Navigate to this directory
cd backend/data/foundation/states/

# Upload your files here
# - indian_states.csv
# - state_metadata.json
# - city_mapping.json
# - Any other foundation state data
```

## 🔍 **Data Validation**
Once uploaded, this data will be used to:
- ✅ Validate college locations
- ✅ Cross-reference state and city data
- ✅ Ensure geographical consistency
- ✅ Provide location reference for the platform

---

**⚠️ DO NOT EDIT THESE FILES DIRECTLY - They are foundation data!**
