# 🎓 Counselling Data Integration Guide

## 📁 **Directory Structure**

Place your counselling Excel files in the following structure:

```
counselling_data/
├── AIQ_PG_2023/           # All India Quota Post Graduate 2023
│   ├── AIQ_PG_2023_R1.xlsx
│   ├── AIQ_PG_2023_R2.xlsx
│   ├── AIQ_PG_2023_STRAY.xlsx
│   └── AIQ_PG_2023_SPECIAL_STRAY.xlsx
├── AIQ_PG_2024/           # All India Quota Post Graduate 2024
│   ├── AIQ_PG_2024_R1.xlsx
│   └── ...
├── AIQ_UG_2023/           # All India Quota Under Graduate 2023
│   ├── AIQ_UG_2023_R1.xlsx
│   ├── AIQ_UG_2023_STRAY.xlsx
│   └── AIQ_UG_2023_STRAY_BDS.xlsx
├── AIQ_UG_2024/           # All India Quota Under Graduate 2024
│   ├── AIQ_UG_2024_R1.xlsx
│   └── AIQ_UG_2024_SPECIAL_STRAY.xlsx
├── KEA_2023/              # Karnataka State Counselling 2023
│   ├── KEA_2023_MEDICAL_R1.xlsx
│   ├── KEA_2023_DENTAL_R1.xlsx
│   ├── KEA_2023_MEDICAL_R3.xlsx
│   ├── KEA_2023_MEDICAL_STRAY.xlsx
│   ├── KEA_2023_DENTAL_STRAY.xlsx
│   └── KEA_2023_MEDICAL_EXTENDED_STRAY.xlsx
└── KEA_2024/              # Karnataka State Counselling 2024
    ├── KEA_2024_MEDICAL_R4.xlsx
    ├── KEA_2024_MEDICAL_R5.xlsx
    ├── KEA_2024_DENTAL_R4.xlsx
    └── KEA_2024_DENTAL_R5.xlsx
```

## 📊 **File Naming Convention**

### **AIQ (All India Quota)**
- **AIQ_PG_2023_R1.xlsx** → Post Graduate, 2023, Round 1
- **AIQ_UG_2023_STRAY.xlsx** → Under Graduate, 2023, Stray Round
- **AIQ_UG_2023_STRAY_BDS.xlsx** → Under Graduate, 2023, Stray Round (BDS specific)

### **KEA (Karnataka State)**
- **KEA_2023_MEDICAL_R1.xlsx** → Medical, 2023, Round 1
- **KEA_2023_DENTAL_R3.xlsx** → Dental, 2023, Round 3
- **KEA_2023_MEDICAL_EXTENDED_STRAY.xlsx** → Medical, 2023, Extended Stray

## 🔄 **Round Progression**

1. **R1, R2, R3** → Regular rounds
2. **MOPUP** → Round 3 equivalent (vacant seats)
3. **STRAY** → Vacant seats after regular rounds
4. **EXTENDED_STRAY** → More vacant seats
5. **EXTENDED_SPECIAL_STRAY** → Final round

## 📋 **Required Excel Columns**

### **AIQ Files (AIQ_PG, AIQ_UG)**
- `ALL INDIA RANK` or `RANK` → Candidate's rank
- `QUOTA` → Quota type (AIQ, etc.)
- `COLLEGE/INSTITUTE` or `COLLEGE` → College name
- `COURSE` → Course name (MBBS, BDS, MD, MS, DNB, MDS)
- `CATEGORY` → Category (General, OBC, SC, ST, EWS)

### **KEA Files**
- `ALL INDIA RANK` or `RANK` → Candidate's rank
- `COLLEGE/INSTITUTE` or `COLLEGE` → College name
- `COURSE` → Course name
- `CATEGORY` → Category
- `STATE` → State (Karnataka)

### **Optional Columns**
- `CUTOFF RANK` → Cutoff rank for the round
- `SEATS` → Number of seats
- `FEES` → Course fees

## 🚀 **Import Process**

### **Step 1: Place Your Files**
Copy your Excel files to the appropriate directories in `counselling_data/`

### **Step 2: Run the Import**
```bash
# Import counselling data only
npm run counselling:import

# Or setup database and import counselling data
npm run counselling:setup
```

### **Step 3: Verify Import**
The system will automatically:
- Detect counselling types (AIQ_PG, AIQ_UG, KEA)
- Parse round information from filenames
- Map Excel columns to database fields
- Link counselling data to existing colleges and courses
- Generate import reports

## 🎯 **Smart Features**

### **Auto-Detection**
- **File Type**: Automatically detects AIQ vs KEA
- **Round Order**: Understands round progression (R1 → R2 → STRAY → EXTENDED)
- **Column Mapping**: Handles different Excel column names
- **Data Validation**: Ensures data integrity

### **Data Linking**
- **College Matching**: Links counselling data to existing college database
- **Course Matching**: Associates counselling records with specific courses
- **Quota Handling**: Manages different quota systems (AIQ vs State)

### **Performance**
- **Batch Processing**: Handles large Excel files efficiently
- **Indexed Queries**: Fast search and analysis
- **Memory Efficient**: Processes files without loading everything into memory

## 📈 **What You'll Get**

### **Enhanced College Cards**
- Counselling schedule for each college
- Quota breakdown and seat availability
- Cutoff ranks and trends
- Round-wise progression

### **Counselling Dashboard**
- Multi-year counselling data
- Round comparison and analysis
- Quota-wise seat allocation
- Trend analysis and predictions

### **Smart Search**
- Find colleges by counselling type
- Filter by rounds and years
- Search by cutoff ranks
- Quota-specific results

## 🔧 **Troubleshooting**

### **Common Issues**
1. **File Not Found**: Ensure files are in correct directories
2. **Column Mismatch**: Check column names match required format
3. **College Not Found**: College must exist in main database first
4. **Course Not Found**: Course must exist in main database first

### **Data Validation**
- Empty or invalid ranks are skipped
- Missing college/course data is logged
- Duplicate records are handled gracefully
- Import reports show success/failure counts

## 🎉 **Result**

After import, your website will have:
- **Complete counselling data** across all rounds and years
- **Smart search** with counselling filters
- **Trend analysis** and cutoff predictions
- **Interactive counselling dashboard**
- **Real-time alerts** for important dates

Your college database becomes a **comprehensive counselling platform**! 🎓✨
