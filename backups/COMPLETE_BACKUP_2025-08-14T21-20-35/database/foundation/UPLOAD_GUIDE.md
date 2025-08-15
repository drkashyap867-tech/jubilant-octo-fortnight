# 🚀 **Foundation Data Upload Guide**

## ⚡ **Quick Start - Upload Your Foundation Data**

### **📁 Where to Upload Your Files**

Your foundation data should be uploaded to these specific directories:

```
backend/data/foundation/
├── 📁 colleges/              # 🏥 Upload your master college list here
├── 📁 states/                # 🗺️ Upload your states and cities data here
├── 📁 courses/               # 🎓 Upload your course catalog here
├── 📁 quotas/                # 📊 Upload your quota and reservation data here
├── 📁 categories/            # 🏷️ Upload your classification data here
├── 📁 validation/            # 🔍 Upload validation rules here
└── 📁 reference/             # 📚 Upload reference documents here
```

## 🎯 **Step-by-Step Upload Process**

### **Step 1: Navigate to Foundation Directory**
```bash
cd backend/data/foundation/
```

### **Step 2: Upload College Data**
```bash
cd colleges/
# Upload your files:
# - all_colleges_master.csv
# - college_identifiers.json
# - college_metadata.json
```

### **Step 3: Upload States Data**
```bash
cd ../states/
# Upload your files:
# - indian_states.csv
# - state_metadata.json
# - city_mapping.json
```

### **Step 4: Upload Courses Data**
```bash
cd ../courses/
# Upload your files:
# - medical_courses.csv
# - dental_courses.csv
# - dnb_courses.csv
# - course_metadata.json
```

### **Step 5: Upload Quotas Data**
```bash
cd ../quotas/
# Upload your files:
# - quota_categories.csv
# - state_quotas.json
# - quota_rules.json
```

### **Step 6: Upload Categories Data**
```bash
cd ../categories/
# Upload your files:
# - college_categories.csv
# - course_categories.csv
# - management_categories.csv
```

## 📋 **File Requirements**

### **CSV Files**:
- ✅ **Encoding**: UTF-8
- ✅ **Delimiter**: Comma (,)
- ✅ **Headers**: First row must contain column names
- ✅ **Format**: Standard CSV format

### **JSON Files**:
- ✅ **Format**: Valid JSON syntax
- ✅ **Encoding**: UTF-8
- ✅ **Structure**: Well-organized data structure

## 🚨 **Important Notes**

1. **⚠️ DO NOT EDIT** these files after upload
2. **📁 Keep original files** as backup
3. **🔍 Verify file integrity** after upload
4. **📝 Check file permissions** (should be read-only)
5. **🔄 Version control** all changes

## ✅ **After Upload**

1. **Verify files** are in correct locations
2. **Check file sizes** and formats
3. **Test data access** through the platform
4. **Run validation** against your data
5. **Begin development** using this foundation

## 🆘 **Need Help?**

- Check individual directory README files
- Review main foundation README.md
- Contact data team for assistance
- Verify file formats and structures

---

**🎉 Once uploaded, your foundation data will power the entire platform!**
