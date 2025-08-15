#!/bin/bash

# 🚀 **Data Processing Setup Script**
# Sets up the environment for Excel data processing

echo "🚀 Setting up Excel Data Processing Environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node --version)"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm version: $(npm --version)"

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p data/processed
mkdir -p data/exports
mkdir -p logs/processing

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Make scripts executable
echo "🔧 Making scripts executable..."
chmod +x scripts/data-processing/*.js

# Create sample Excel files for testing
echo "📋 Creating sample Excel files for testing..."

# Check if xlsxgen is available for creating sample files
if command -v xlsxgen &> /dev/null || npm list -g xlsxgen &> /dev/null; then
    echo "📊 Creating sample Excel files..."
    
    # Create sample colleges file
    cat > data/foundation/colleges/sample_colleges.csv << 'EOF'
college_name,state,city,management_type,establishment_year,total_seats,medical_seats,dental_seats,dnb_seats
Sample Medical College,Delhi,New Delhi,Government,1950,100,100,0,0
Sample Dental College,Maharashtra,Mumbai,Private,1980,50,0,50,0
Sample DNB College,Karnataka,Bangalore,Trust,1990,30,0,0,30
EOF

    echo "✅ Sample data files created"
else
    echo "ℹ️  xlsxgen not available. You can create sample Excel files manually."
fi

# Test the setup
echo "🧪 Testing the setup..."

# Test single file processor
if node scripts/data-processing/process_excel_data.js --help &> /dev/null; then
    echo "✅ Single file processor test passed"
else
    echo "❌ Single file processor test failed"
fi

# Test batch processor
if node scripts/data-processing/batch_process.js --help &> /dev/null; then
    echo "✅ Batch processor test passed"
else
    echo "❌ Batch processor test failed"
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Upload your Excel files to the appropriate foundation directories:"
echo "   - backend/data/foundation/colleges/"
echo "   - backend/data/foundation/states/"
echo "   - backend/data/foundation/courses/"
echo "   - backend/data/foundation/quotas/"
echo "   - backend/data/foundation/categories/"
echo ""
echo "2. Process your data:"
echo "   npm run process:all"
echo ""
echo "3. Or process individual data types:"
echo "   npm run process:colleges"
echo "   npm run process:states"
echo "   npm run process:courses"
echo "   npm run process:quotas"
echo "   npm run process:categories"
echo ""
echo "📚 For detailed usage, see: backend/scripts/data-processing/README.md"
echo ""
echo "🚀 Ready to process your foundation data!"
