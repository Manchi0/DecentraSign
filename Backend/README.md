# DecentraSign Backend API

Flask backend for contract parsing with AI and template-based extraction using Claude.

## Architecture

- **app.py**: Flask REST API server (start this for the web service)
- **ContractParseAI.py**: Core contract parsing module using Claude AI
  - Supports PDF, DOCX, and TXT files
  - Uses PyMuPDF for PDF text extraction with OCR
  - Uses python-docx for DOCX files

## Setup

### 1. Install Dependencies

```bash
cd Backend

# Create virtual environment (first time only)
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Install Tesseract OCR (Required for PDF parsing)

**macOS:**
```bash
brew install tesseract
```

**Ubuntu/Debian:**
```bash
sudo apt-get install tesseract-ocr
```

**Windows:**
Download installer from: https://github.com/UB-Mannheim/tesseract/wiki

### 3. Configure Environment

Create a `.env` file with your Anthropic API key:

```bash
cp .env.example .env
```

Edit `.env` and add your Anthropic API key:
```
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
```

Get your API key from: https://console.anthropic.com/settings/keys

### 4. Run the Server

```bash
# Make sure virtual environment is activated
source venv/bin/activate

# Run the server
python app.py
```

The server will start on `http://localhost:5001`

## API Endpoints

### Health Check
```
GET /api/health
```
Returns server status and timestamp.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-26T03:00:00+00:00"
}
```

### Parse Contract
```
POST /api/parse-contract
Content-Type: multipart/form-data

Parameters:
- file: PDF, DOCX, or TXT file (required)
- method: "ai" (required - template method not yet implemented)
```

**Response:**
```json
{
  "success": true,
  "method": "ai",
  "data": {
    "parties": [
      {"name": "string", "role": "string", "email": "string"}
    ],
    "payments": [
      {"amount": number, "type": "string", "currency": "string", "description": "string"}
    ],
    "deadlines": [
      {"milestone": "string", "date": "YYYY-MM-DD", "penalty": number, "penaltyUnit": "string"}
    ],
    "summary": "string",
    "ambiguousTerms": [],
    "_raw": {...}
  },
  "metadata": {
    "filename": "contract.pdf",
    "parsed_at": "2025-10-26T03:00:00+00:00",
    "model": "claude-sonnet-4-5"
  }
}
```

### Test Parser
```
POST /api/parse-contract/test
Content-Type: application/json

Body:
{
  "text": "Contract text here...",
  "method": "ai"
}
```

**Response:** Same as /api/parse-contract

## Features

### AI Parser (Claude Sonnet 4.5)
- Powered by Anthropic's latest Claude model
- Fully automated contract analysis
- Extracts parties, payments, deadlines, and deliverables
- Handles any contract format (PDF, DOCX, TXT)
- OCR support for scanned documents
- More accurate and context-aware than traditional parsing

### Supported File Formats
- **PDF**: Uses PyMuPDF + Tesseract OCR for text extraction
- **DOCX**: Uses python-docx to extract text and tables
- **TXT**: Direct text file reading

## Error Handling

- Invalid file type: Returns 400 error
- Empty file: Returns 400 error
- Missing Anthropic key: Returns 500 error with instructions
- Parsing failure: Returns 500 with detailed error message

## Development

### Running Tests
```bash
# Activate venv
source venv/bin/activate

# Test with sample contract
python ContractParseAI.py path/to/sample_contract.pdf
```

### Debugging
- Flask debug mode is enabled by default
- Check console output for detailed error messages
- API errors include stack traces in development mode

## Troubleshooting

### "ModuleNotFoundError: No module named 'fitz'"
Install PyMuPDF: `pip install pymupdf`

### "pytesseract is not installed"
Install pytesseract: `pip install pytesseract` and install Tesseract binary

### "TesseractNotFoundError"
Install Tesseract OCR binary (see step 2 above)

### "ANTHROPIC_API_KEY not configured"
Create `.env` file with your API key (see step 3 above)
