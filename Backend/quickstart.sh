#!/bin/bash

# DecentraSign Backend Quick Start Script
# This script sets up and tests the backend

set -e  # Exit on error

echo "================================================"
echo "DecentraSign Backend Quick Start"
echo "================================================"
echo ""

# Check Python version
echo "🔍 Checking Python version..."
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "   Found Python $python_version"

# Check if in Backend directory
if [ ! -f "requirements.txt" ]; then
    echo "❌ Error: Please run this script from the Backend directory"
    exit 1
fi

# Check for Tesseract
echo ""
echo "🔍 Checking for Tesseract OCR..."
if command -v tesseract &> /dev/null; then
    tesseract_version=$(tesseract --version 2>&1 | head -1)
    echo "   ✅ $tesseract_version"
else
    echo "   ❌ Tesseract not found!"
    echo "   Install with:"
    echo "   - macOS: brew install tesseract"
    echo "   - Ubuntu: sudo apt-get install tesseract-ocr"
    exit 1
fi

# Check for Poppler
echo ""
echo "🔍 Checking for Poppler (PDF processing)..."
if command -v pdfinfo &> /dev/null; then
    echo "   ✅ Poppler found"
else
    echo "   ⚠️  Poppler not found (needed for PDF processing)"
    echo "   Install with:"
    echo "   - macOS: brew install poppler"
    echo "   - Ubuntu: sudo apt-get install poppler-utils"
fi

# Create virtual environment
echo ""
echo "📦 Setting up virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "   ✅ Virtual environment created"
else
    echo "   ✅ Virtual environment already exists"
fi

# Activate virtual environment
echo ""
echo "🔄 Activating virtual environment..."
source venv/bin/activate
echo "   ✅ Virtual environment activated"

# Install dependencies
echo ""
echo "📥 Installing Python dependencies..."
pip install --upgrade pip > /dev/null 2>&1
pip install -r requirements.txt
echo "   ✅ Dependencies installed"

# Check for .env file
echo ""
echo "🔍 Checking for configuration..."
if [ ! -f ".env" ]; then
    echo "   ⚠️  .env file not found"
    echo "   Creating from .env.example..."
    cp .env.example .env
    echo "   ⚠️  Please edit .env and add your ANTHROPIC_API_KEY"
    echo ""
    read -p "   Do you have your Anthropic API key? (y/n): " has_key
    if [ "$has_key" = "y" ]; then
        read -p "   Enter your API key: " api_key
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s/your_anthropic_api_key_here/$api_key/" .env
        else
            sed -i "s/your_anthropic_api_key_here/$api_key/" .env
        fi
        echo "   ✅ API key saved to .env"
    else
        echo ""
        echo "   Get your API key from: https://console.anthropic.com/"
        echo "   Then edit .env and add it"
        exit 1
    fi
else
    echo "   ✅ .env file found"
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Check if API key is set
if [ -z "$ANTHROPIC_API_KEY" ] || [ "$ANTHROPIC_API_KEY" = "your_anthropic_api_key_here" ]; then
    echo ""
    echo "❌ ANTHROPIC_API_KEY is not set in .env"
    echo "   Please edit .env and add your API key"
    echo "   Get it from: https://console.anthropic.com/"
    exit 1
fi

# Run tests
echo ""
echo "🧪 Running tests..."
python test_parser.py

# Start server
echo ""
echo "================================================"
echo "🚀 Starting Flask server..."
echo "================================================"
echo ""
echo "Server will start at: http://localhost:5000"
echo ""
echo "Test with:"
echo "  curl http://localhost:5000/health"
echo ""
echo "Upload a contract:"
echo "  curl -X POST http://localhost:5000/api/upload-contract \\"
echo "    -F 'file=@your_contract.pdf'"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""
echo "================================================"
echo ""

python app.py
