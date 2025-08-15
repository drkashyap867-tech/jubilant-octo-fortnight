# 🏷️ **Categories Foundation Data**

## 📁 **Location**: `backend/data/foundation/categories/`

## 🎯 **Purpose**
This directory contains the **CLASSIFICATION AND ORGANIZATION** systems that will be used for categorizing colleges, courses, and other entities across the platform.

## 📋 **Required Files**

### **1. `college_categories.csv`** ⭐ **CRITICAL**
- **Purpose**: Complete classification of college types
- **Format**: CSV with category information
- **Content**: Government, Private, Trust, Society, Autonomous

### **2. `course_categories.csv`** ⭐ **CRITICAL**
- **Purpose**: Complete classification of course types
- **Format**: CSV with category information
- **Content**: Undergraduate, Postgraduate, Diploma, Certificate

### **3. `management_categories.csv`**
- **Purpose**: Detailed management type classifications
- **Format**: CSV with management details
- **Content**: Management structures and variations

### **4. `category_hierarchy.json`**
- **Purpose**: Hierarchical category relationships
- **Format**: JSON with category structure
- **Content**: Parent-child category relationships

## 🚨 **UPLOAD YOUR FOUNDATION DATA HERE**

**Place your master category and classification data in this directory:**

```bash
# Navigate to this directory
cd backend/data/foundation/categories/

# Upload your files here
# - college_categories.csv
# - course_categories.csv
# - management_categories.csv
# - category_hierarchy.json
# - Any other foundation category data
```

## 🔍 **Data Validation**
Once uploaded, this data will be used to:
- ✅ Validate college and course classifications
- ✅ Cross-reference category information
- ✅ Ensure classification consistency
- ✅ Provide category reference for the platform

---

**⚠️ DO NOT EDIT THESE FILES DIRECTLY - They are foundation data!**
