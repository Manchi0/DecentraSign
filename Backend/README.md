# DecentraSign Backend

Python backend for parsing and processing contracts using AI and blockchain technology.

## Features

✅ **PDF & DOCX Support** - Parse contracts from PDF and Word documents
✅ **AI-Powered Parsing** - Uses Claude AI to extract contract terms
✅ **JSON Output** - Structured, machine-readable contract data
✅ **RESTful API** - Easy integration with frontend
✅ **OCR Support** - Handles scanned documents with Tesseract
✅ **Human Summaries** - Generates readable contract summaries

## Installation

### Prerequisites

- Python 3.8 or higher
- Tesseract OCR
- Poppler (for PDF processing)

#### Install Tesseract OCR

**macOS:**
```bash
brew install tesseract
brew install poppler
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install tesseract-ocr
sudo apt-get install poppler-utils
```

**Windows:**
Download and install from:
- Tesseract: https://github.com/UB-Mannheim/tesseract/wiki
- Poppler: https://github.com/oschwartz10612/poppler-windows/releases

### Setup

1. **Clone the repository and navigate to backend:**
```bash
cd Backend
```

2. **Create virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Configure environment variables:**
```bash
cp .env.example .env
# Edit .env and add your Anthropic API key
```

## Configuration

Edit `.env` file:

```bash
# Required
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Optional
FLASK_ENV=development
FLASK_DEBUG=True
MAX_FILE_SIZE_MB=10
```

Get your Anthropic API key from: https://console.anthropic.com/

## Usage

### Running the API Server

```bash
python app.py
```

The server will start at `http://localhost:5000`

### Testing the Parser

Run the test suite:
```bash
python test_parser.py
```

### Command Line Usage

Parse a contract file directly:
```bash
python contract_parse.py path/to/contract.pdf
```

Or with DOCX:
```bash
python contract_parse.py path/to/contract.docx
```

## API Endpoints

### 1. Upload and Parse Contract

**Endpoint:** `POST /api/upload-contract`

**Description:** Upload a PDF or DOCX contract file for parsing

**Request:**
- Content-Type: `multipart/form-data`
- Body: Form data with `file` field

**Example with cURL:**
```bash
curl -X POST http://localhost:5000/api/upload-contract \
  -F "file=@contract.pdf"
```

**Example with JavaScript:**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('http://localhost:5000/api/upload-contract', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(result.data.parsed_contract);
```

**Response:**
```json
{
  "success": true,
  "message": "Contract parsed successfully",
  "data": {
    "parsed_contract": {
      "parties": {
        "client": {
          "name": "Alice Johnson",
          "email": "alice@email.com",
          "role": "Client"
        },
        "contractor": {
          "name": "Bob Martinez",
          "email": "bob@email.com",
          "role": "Freelance Designer"
        }
      },
      "payments": {
        "upfront": 1000,
        "completion": 2000,
        "total": 3000,
        "currency": "USD"
      },
      "deadlines": {
        "start_date": "2026-01-15",
        "final": "2026-02-15"
      },
      "penalties": {
        "late_fee_per_day": 100,
        "max_penalty": 500
      },
      "deliverables": [
        "3 logo concepts in PNG format",
        "Source files (AI/PSD format)"
      ],
      "terms": {
        "payment_method": "Cryptocurrency (SUI)",
        "cancellation_policy": "7 days written notice",
        "warranty": "Original work guarantee",
        "dispute_resolution": "Binding arbitration"
      },
      "ambiguities": [],
      "_metadata": {
        "parsed_at": "2026-01-01T10:00:00.000000",
        "model": "claude-3-5-sonnet-20241022",
        "file_hash": "abc123...",
        "file_type": ".pdf"
      }
    },
    "summary": "📄 CONTRACT SUMMARY\n...",
    "file_info": {
      "filename": "contract.pdf",
      "size_bytes": 245000,
      "hash": "abc123..."
    }
  }
}
```

### 2. Parse Text Directly

**Endpoint:** `POST /api/parse-text`

**Description:** Parse contract text without file upload

**Request:**
```json
{
  "text": "FREELANCE CONTRACT\n\nThis agreement..."
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/parse-text \
  -H "Content-Type: application/json" \
  -d '{"text": "Your contract text here..."}'
```

### 3. Validate Contract Data

**Endpoint:** `POST /api/validate-contract`

**Description:** Validate parsed contract data

**Request:**
```json
{
  "contract_data": {
    "parties": {...},
    "payments": {...}
  }
}
```

**Response:**
```json
{
  "success": true,
  "validation": {
    "is_valid": true,
    "warnings": [
      "Contract has 2 ambiguous terms that need clarification"
    ],
    "errors": [],
    "missing_fields": []
  }
}
```

### 4. Generate Contract Summary

**Endpoint:** `POST /api/contract-summary`

**Description:** Generate human-readable summary from parsed data

**Request:**
```json
{
  "contract_data": {
    "parties": {...},
    "payments": {...}
  }
}
```

**Response:**
```json
{
  "success": true,
  "summary": "📄 CONTRACT SUMMARY\n======\n..."
}
```

### 5. Health Check

**Endpoint:** `GET /health`

**Description:** Check if the API is running

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-01T10:00:00.000000",
  "service": "DecentraSign Backend"
}
```

## Python SDK Usage

### Basic Usage

```python
from contract_parse import ContractParser

# Initialize parser
parser = ContractParser()

# Parse from file
result = parser.parse_contract_from_file('contract.pdf')

# Generate summary
summary = parser.generate_human_summary(result)
print(summary)

# Access specific fields
client_name = result['parties']['client']['name']
total_payment = result['payments']['total']
deadline = result['deadlines']['final']
```

### Parse Text Directly

```python
from contract_parse import ContractParser

parser = ContractParser()

contract_text = """
FREELANCE CONTRACT
...
"""

result = parser.parse_contract(contract_text)
```

### Convenience Functions

```python
from contract_parse import parse_pdf, parse_docx, parse_contract_file

# Parse PDF
pdf_result = parse_pdf('contract.pdf')

# Parse DOCX
docx_result = parse_docx('contract.docx')

# Parse any supported file
result = parse_contract_file('contract.pdf')
```

## Output Schema

The parser returns a JSON object with the following structure:

```typescript
{
  parties: {
    client: {
      name: string,
      email: string | null,
      address: string | null,
      role: string
    },
    contractor: {
      name: string,
      email: string | null,
      address: string | null,
      role: string
    }
  },
  payments: {
    upfront: number,
    completion: number,
    total: number,
    schedule: array | null,
    currency: string
  },
  deadlines: {
    start_date: string,  // YYYY-MM-DD
    final: string,       // YYYY-MM-DD
    milestones: array | null
  },
  penalties: {
    late_fee_per_day: number,
    max_penalty: number | null,
    other_penalties: array | null
  },
  deliverables: string[],
  terms: {
    payment_method: string | null,
    cancellation_policy: string | null,
    warranty: string | null,
    dispute_resolution: string | null
  },
  ambiguities: string[],
  _metadata: {
    parsed_at: string,
    model: string,
    text_hash: string,
    file_path: string,
    file_size_bytes: number,
    file_type: string,
    file_hash: string
  }
}
```

## Error Handling

The API returns standardized error responses:

**400 Bad Request:**
```json
{
  "error": "Invalid file type",
  "message": "Only pdf, docx, doc files are allowed"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Processing error",
  "message": "Failed to parse contract: ..."
}
```

## Troubleshooting

### Tesseract Not Found

**Error:** `TesseractNotFoundError`

**Solution:**
```bash
# macOS
brew install tesseract

# Ubuntu
sudo apt-get install tesseract-ocr

# Verify installation
tesseract --version
```

### PDF to Image Conversion Failed

**Error:** `PDFInfoNotInstalledError`

**Solution:**
```bash
# macOS
brew install poppler

# Ubuntu
sudo apt-get install poppler-utils
```

### API Key Not Set

**Error:** `ValueError: ANTHROPIC_API_KEY must be set`

**Solution:**
```bash
export ANTHROPIC_API_KEY='your-api-key-here'
# Or add to .env file
```

### File Too Large

**Error:** `413 Request Entity Too Large`

**Solution:**
Reduce file size or increase `MAX_FILE_SIZE` in `.env`

## Development

### Running Tests

```bash
python test_parser.py
```

### Code Structure

```
Backend/
├── app.py              # Flask API server
├── contract_parse.py   # Contract parser module
├── test_parser.py      # Test suite
├── requirements.txt    # Python dependencies
├── .env.example        # Environment variables template
└── README.md          # This file
```

### Adding New Features

To extend the parser:

1. **Add new extraction logic in `contract_parse.py`:**
```python
def extract_custom_field(self, text):
    # Your logic here
    pass
```

2. **Update the JSON schema in the prompt**

3. **Add validation in `_validate_parsed_data`**

4. **Add tests in `test_parser.py`**

## Production Deployment

### Using Gunicorn

```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Using Docker

Create `Dockerfile`:
```dockerfile
FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```

Build and run:
```bash
docker build -t decentrasign-backend .
docker run -p 5000:5000 -e ANTHROPIC_API_KEY=your_key decentrasign-backend
```

## Security Considerations

- ✅ File size limits enforced
- ✅ File type validation
- ✅ Secure filename handling
- ✅ CORS enabled for frontend
- ⚠️ Add authentication for production
- ⚠️ Use HTTPS in production
- ⚠️ Rate limiting recommended

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: https://github.com/yourusername/decentrasign/issues
- Email: support@decentrasign.io

---

**Built with:** Python • Flask • Anthropic Claude • Tesseract OCR
