# 📁 **Data Directory - File Processing Guide**

## 🎯 **Purpose**
This directory contains all files related to data processing, imports, exports, and document management for the Medical College Counseling Platform.

## 📂 **Directory Structure**

```
backend/data/
├── 📁 imports/                 # Raw data files for processing
│   ├── 📁 medical/            # Medical college data files
│   ├── 📁 dental/             # Dental college data files
│   ├── 📁 dnb/                # DNB college data files
│   ├── 📁 templates/          # Import templates and schemas
│   └── 📁 historical/         # Previous year data for comparison
├── 📁 documents/              # Document management
│   ├── 📁 uploads/            # User-uploaded documents
│   ├── 📁 templates/          # Document templates
│   └── 📁 generated/          # System-generated documents
├── 📁 config/                 # Configuration files
└── 📄 README.md               # This file
```

## 🚀 **How to Add Files for Processing**

### **1. 📊 College Data Files**

#### **Location**: `backend/data/imports/`
- **Medical Colleges**: `imports/medical/`
- **Dental Colleges**: `imports/dental/`
- **DNB Colleges**: `imports/dnb/`

#### **Supported Formats**:
- ✅ **CSV** (`.csv`) - Recommended for large datasets
- ✅ **Excel** (`.xlsx`, `.xls`) - Good for complex data
- ✅ **JSON** (`.json`) - For structured data

#### **File Naming Convention**:
```
YYYY_MM_DD_college_type_source.csv
Examples:
2024_08_15_medical_colleges_mci.csv
2024_08_15_dental_colleges_dci.csv
2024_08_15_dnb_colleges_nbems.csv
```

### **2. 🖼️ Media & Asset Files**

#### **Location**: `frontend/src/assets/`
- **Images**: `assets/images/`
- **Documents**: `assets/documents/`
- **Fonts**: `assets/fonts/`

#### **Supported Formats**:
- **Images**: PNG, JPG, JPEG, SVG, WebP
- **Documents**: PDF, DOCX, XLSX
- **Fonts**: TTF, OTF, WOFF, WOFF2

### **3. 📝 Document Files**

#### **Location**: `backend/data/documents/`
- **Uploads**: `documents/uploads/`
- **Templates**: `documents/templates/`
- **Generated**: `documents/generated/`

## 📋 **File Processing Workflow**

### **Step 1: Place Files**
```bash
# Navigate to appropriate directory
cd backend/data/imports/medical

# Copy your files here
cp /path/to/your/college_data.csv ./
```

### **Step 2: Validate Files**
```bash
# Check file format and structure
npm run validate:data medical_colleges_2024.csv
```

### **Step 3: Process Files**
```bash
# Import data into database
npm run import:data medical_colleges_2024.csv
```

### **Step 4: Verify Import**
```bash
# Check imported data
npm run verify:import medical_colleges_2024
```

## 🔧 **File Requirements**

### **CSV Files**:
- **Encoding**: UTF-8
- **Delimiter**: Comma (,)
- **Headers**: First row must contain column names
- **Quotes**: Use double quotes for text containing commas

### **Excel Files**:
- **Format**: .xlsx (preferred) or .xls
- **Sheets**: First sheet should contain data
- **Headers**: First row must contain column names
- **Data Types**: Ensure proper data types for each column

### **JSON Files**:
- **Format**: Valid JSON syntax
- **Structure**: Array of objects or single object
- **Encoding**: UTF-8

## 📊 **Data Validation Rules**

### **Required Fields**:
- `college_name` - Name of the college
- `state` - State where college is located
- `city` - City where college is located
- `management_type` - Government/Private/Trust/etc.
- `establishment_year` - Year college was established
- `total_seats` - Total number of seats

### **Field Validation**:
- **College Name**: 3-200 characters, alphanumeric with spaces
- **State**: Must be from predefined list of Indian states
- **Establishment Year**: 1800-2024
- **Seats**: Positive integers, maximum 10,000
- **Email**: Valid email format
- **Website**: Valid URL format

## 🚨 **Common Issues & Solutions**

### **File Too Large**:
- **Issue**: File exceeds 50MB limit
- **Solution**: Split into smaller files or compress

### **Encoding Issues**:
- **Issue**: Special characters not displaying correctly
- **Solution**: Ensure file is saved as UTF-8

### **Format Errors**:
- **Issue**: CSV parsing errors
- **Solution**: Check delimiter and quote usage

### **Validation Failures**:
- **Issue**: Data doesn't meet validation rules
- **Solution**: Review validation rules and fix data

## 📈 **Performance Tips**

### **Large Files**:
- Use CSV format for files > 10,000 records
- Process in batches of 1,000 records
- Enable compression for file uploads

### **Data Quality**:
- Validate data before import
- Use consistent naming conventions
- Regular data cleanup and maintenance

## 🔍 **Monitoring & Logs**

### **Import Logs**:
- Location: `backend/logs/imports/`
- Format: JSON with timestamp and details
- Retention: 90 days

### **Error Reports**:
- Location: `backend/data/processed/errors/`
- Format: CSV with error details
- Action: Review and fix errors before re-import

## 📚 **Additional Resources**

- **Templates**: Check `templates/` directory for sample files
- **Validation Rules**: See `templates/validation_rules.json`
- **API Documentation**: Check `/docs/api/` for import endpoints
- **Support**: Contact development team for assistance

## 🎯 **Next Steps**

1. **Review templates** in the templates directory
2. **Prepare your data** according to the schema
3. **Test with sample data** before importing large files
4. **Follow the workflow** for successful data processing

---

*For technical support or questions about file processing, please refer to the main documentation or contact the development team.*
