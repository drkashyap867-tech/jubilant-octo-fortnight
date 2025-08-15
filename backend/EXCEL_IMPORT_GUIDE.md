# 📊 Excel Import Guide for Counselling Data

## 🎯 **Expected Excel Format**

Your Excel file should have **one sheet** with the following columns (headers in row 1):

### **📋 Required Columns:**

| Column Header | Description | Example Values | Required |
|---------------|-------------|----------------|----------|
| **College Name** | Full college name | "Mysore Medical College and Research Institute" | ✅ Yes |
| **Course Name** | Course/specialty name | "MBBS", "MS - Orthopaedics", "MD - Medicine" | ✅ Yes |
| **Counselling Type** | Type of counselling | "AIQ", "KEA", "COMEDK", "STATE", "PRIVATE" | ✅ Yes |
| **Year** | Academic year | "2023", "2024" | ✅ Yes |
| **Round** | Round number | "1", "2", "3" | ✅ Yes |
| **Category** | Reservation category | "UR", "OBC-NCL", "SC", "ST", "EWS" | ✅ Yes |
| **Cutoff Rank** | Closing rank | "1500", "2200", "5000" | ✅ Yes |

### **📋 Optional Columns:**

| Column Header | Description | Example Values | Required |
|---------------|-------------|----------------|----------|
| **Round Name** | Round description | "Round 1", "Phase 1", "Session 1" | ❌ No |
| **Percentile** | NEET percentile | "97.2", "95.8", "90.1" | ❌ No |
| **Seats Available** | Total seats | "10", "25", "50" | ❌ No |
| **Seats Filled** | Filled seats | "8", "20", "45" | ❌ No |
| **Fees** | Annual fees | "15000", "50000", "100000" | ❌ No |
| **Remarks** | Special notes | "NRI seats", "Management quota" | ❌ No |

## 📊 **Sample Excel Data**

Here's what your Excel sheet should look like:

| College Name | Course Name | Counselling Type | Year | Round | Category | Cutoff Rank | Percentile | Seats | Fees | Remarks |
|--------------|-------------|------------------|------|-------|----------|-------------|------------|-------|------|---------|
| Mysore Medical College | MBBS | KEA | 2024 | 1 | UR | 2200 | 97.2 | 25 | 15000 | - |
| Mysore Medical College | MBBS | KEA | 2024 | 1 | OBC-NCL | 3500 | 94.1 | 15 | 15000 | - |
| Mysore Medical College | MBBS | KEA | 2024 | 1 | SC | 8500 | 87.3 | 8 | 15000 | - |
| Mysore Medical College | MBBS | KEA | 2024 | 1 | ST | 12000 | 83.5 | 4 | 15000 | - |
| Mysore Medical College | MBBS | AIQ | 2024 | 1 | UR | 1800 | 98.1 | 5 | 15000 | - |
| Mysore Medical College | MS - Orthopaedics | KEA | 2024 | 1 | UR | 1500 | 98.8 | 3 | 25000 | - |

## 🔍 **Column Name Variations (Auto-Detected)**

Our system automatically detects these variations:

### **College Name:**
- "College", "Institution", "Medical College", "Dental College"
- "College Name", "Institution Name", "Medical College Name"

### **Course Name:**
- "Course", "Specialty", "Subject", "Program"
- "Course Name", "Specialty Name", "Subject Name", "Branch"

### **Counselling Type:**
- "Counselling Type", "Quota", "Type", "AIQ", "KEA", "COMEDK"
- "MCC", "DGHS", "State", "Private", "Management", "NRI"

### **Year:**
- "Year", "Academic Year", "Counselling Year", "Admission Year"

### **Round:**
- "Round", "Round Number", "Phase", "Phase Number", "Session"

### **Category:**
- "Category", "Reservation", "Quota Category", "Reservation Category"
- "Caste", "Social Category"

### **Cutoff Rank:**
- "Cutoff Rank", "Rank", "Closing Rank", "Last Rank"
- "Merit Rank", "Admission Rank"

## 🚀 **How to Import**

### **Step 1: Save Your Excel File**
Save your Excel file in: `backend/data/imports/your-file-name.xlsx`

### **Step 2: Run Import Command**
```bash
cd backend
node import-excel-cutoff-enhanced.js ./data/imports/your-file-name.xlsx
```

### **Step 3: Watch the Magic!**
The system will:
- 🔍 Auto-detect all your columns
- 📊 Process thousands of records
- 🎯 Map to existing colleges and courses
- ✅ Validate and normalize all data
- 📈 Show progress and results

## ✨ **Features**

- **🎯 Smart Column Detection** - Works with any column names
- **🏫 College Matching** - Finds exact college matches in database
- **📚 Course Matching** - Maps courses to correct colleges
- **🔄 Data Normalization** - Converts all formats to standard
- **📊 Comprehensive Support** - All counselling types and categories
- **🚀 Fast Processing** - Handles large files efficiently
- **📝 Detailed Reporting** - Shows success, warnings, and errors

## 🎉 **Ready to Import!**

Your counselling database is now **PERFECT** and ready for real data!

Just follow the format above and we'll import everything flawlessly! 🚀✨
