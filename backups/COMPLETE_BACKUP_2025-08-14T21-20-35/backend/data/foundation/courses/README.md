# 🎓 **Courses Foundation Data**

## 📁 **Location**: `backend/data/foundation/courses/`

## 🎯 **Purpose**
This directory contains the **COMPLETE COURSE CATALOG** of all medical, dental, and DNB programs that will be used for course validation and cross-referencing.

## 📋 **Required Files**

### **1. `medical_courses.csv`** ⭐ **CRITICAL**
- **Purpose**: Complete list of all medical degree programs
- **Format**: CSV with course information
- **Content**: MBBS, MD, MS, DM, MCh programs

### **2. `dental_courses.csv`** ⭐ **CRITICAL**
- **Purpose**: Complete list of all dental degree programs
- **Format**: CSV with course information
- **Content**: BDS, MDS programs and specializations

### **3. `dnb_courses.csv`** ⭐ **CRITICAL**
- **Purpose**: Complete list of all DNB programs
- **Format**: CSV with course information
- **Content**: DNB specializations and programs

### **4. `course_metadata.json`**
- **Purpose**: Extended course information and requirements
- **Format**: JSON with course details
- **Content**: Duration, eligibility, specializations

## 🚨 **UPLOAD YOUR FOUNDATION DATA HERE**

**Place your master course catalog data in this directory:**

```bash
# Navigate to this directory
cd backend/data/foundation/courses/

# Upload your files here
# - medical_courses.csv
# - dental_courses.csv
# - dnb_courses.csv
# - course_metadata.json
# - Any other foundation course data
```

## 🔍 **Data Validation**
Once uploaded, this data will be used to:
- ✅ Validate college course offerings
- ✅ Cross-reference course information
- ✅ Ensure course consistency
- ✅ Provide course reference for the platform

---

**⚠️ DO NOT EDIT THESE FILES DIRECTLY - They are foundation data!**
