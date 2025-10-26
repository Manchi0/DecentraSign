"""
Flask API for DecentraSign Contract Processing
Handles contract upload, parsing, and processing
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import json
from datetime import datetime
import hashlib
from contract_parse import ContractParser, parse_contract_file

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
UPLOAD_FOLDER = '/tmp/contract_uploads'
ALLOWED_EXTENSIONS = {'pdf', 'docx', 'doc'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

# Create upload folder if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Initialize contract parser
contract_parser = ContractParser()


def allowed_file(filename):
    """Check if file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def generate_file_hash(file_path):
    """Generate SHA256 hash of file."""
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'service': 'DecentraSign Backend'
    }), 200


@app.route('/api/upload-contract', methods=['POST'])
def upload_contract():
    """
    Upload and parse a contract file (PDF or DOCX).

    Expected: multipart/form-data with 'file' field

    Returns:
        JSON with parsed contract data
    """
    # Check if file is in request
    if 'file' not in request.files:
        return jsonify({
            'error': 'No file provided',
            'message': 'Please upload a file using the "file" field'
        }), 400

    file = request.files['file']

    # Check if filename is empty
    if file.filename == '':
        return jsonify({
            'error': 'No file selected',
            'message': 'Please select a file to upload'
        }), 400

    # Check if file type is allowed
    if not allowed_file(file.filename):
        return jsonify({
            'error': 'Invalid file type',
            'message': f'Only {", ".join(ALLOWED_EXTENSIONS)} files are allowed'
        }), 400

    file_path = None  # Initialize to avoid undefined variable in exception handlers

    try:
        # Secure the filename
        filename = secure_filename(file.filename)
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        unique_filename = f"{timestamp}_{filename}"
        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)

        # Save file
        file.save(file_path)

        # Check file size
        file_size = os.path.getsize(file_path)
        if file_size > MAX_FILE_SIZE:
            os.remove(file_path)
            return jsonify({
                'error': 'File too large',
                'message': f'Maximum file size is {MAX_FILE_SIZE / (1024*1024)}MB'
            }), 400

        # Generate file hash
        file_hash = generate_file_hash(file_path)

        # Parse the contract
        print(f"Parsing contract: {file_path}")
        parsed_data = contract_parser.parse_contract_from_file(file_path)

        # Generate human-readable summary
        summary = contract_parser.generate_human_summary(parsed_data)

        # Add additional metadata
        parsed_data['_metadata']['file_hash'] = file_hash
        parsed_data['_metadata']['original_filename'] = filename
        parsed_data['_metadata']['upload_timestamp'] = datetime.utcnow().isoformat()

        # Clean up: optionally remove the file after parsing
        # os.remove(file_path)  # Uncomment to delete after processing

        return jsonify({
            'success': True,
            'message': 'Contract parsed successfully',
            'data': {
                'parsed_contract': parsed_data,
                'summary': summary,
                'file_info': {
                    'filename': filename,
                    'size_bytes': file_size,
                    'hash': file_hash
                }
            }
        }), 200

    except ValueError as e:
        # Clean up file on error (only if file was saved)
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
        return jsonify({
            'error': 'Validation error',
            'message': str(e)
        }), 400

    except Exception as e:
        # Clean up file on error (only if file was saved)
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
        return jsonify({
            'error': 'Processing error',
            'message': str(e)
        }), 500


@app.route('/api/parse-text', methods=['POST'])
def parse_text():
    """
    Parse contract text directly (without file upload).

    Expected JSON body:
    {
        "text": "contract text here..."
    }

    Returns:
        JSON with parsed contract data
    """
    data = request.get_json()

    if not data or 'text' not in data:
        return jsonify({
            'error': 'No text provided',
            'message': 'Please provide contract text in the "text" field'
        }), 400

    contract_text = data['text']

    if len(contract_text.strip()) < 100:
        return jsonify({
            'error': 'Text too short',
            'message': 'Contract text must be at least 100 characters'
        }), 400

    try:
        # Parse the contract text
        parsed_data = contract_parser.parse_contract(contract_text)

        # Generate human-readable summary
        summary = contract_parser.generate_human_summary(parsed_data)

        return jsonify({
            'success': True,
            'message': 'Contract parsed successfully',
            'data': {
                'parsed_contract': parsed_data,
                'summary': summary
            }
        }), 200

    except Exception as e:
        return jsonify({
            'error': 'Processing error',
            'message': str(e)
        }), 500


@app.route('/api/validate-contract', methods=['POST'])
def validate_contract():
    """
    Validate parsed contract data to ensure all required fields are present.

    Expected JSON body:
    {
        "contract_data": { ... parsed contract ... }
    }

    Returns:
        Validation results
    """
    data = request.get_json()

    if not data or 'contract_data' not in data:
        return jsonify({
            'error': 'No contract data provided',
            'message': 'Please provide contract data in the "contract_data" field'
        }), 400

    contract_data = data['contract_data']

    # Validation checks
    validation_results = {
        'is_valid': True,
        'warnings': [],
        'errors': [],
        'missing_fields': []
    }

    # Check required fields
    required_fields = {
        'parties': ['client', 'contractor'],
        'payments': ['total'],
        'deadlines': ['final'],
        'deliverables': []
    }

    for field, subfields in required_fields.items():
        if field not in contract_data:
            validation_results['errors'].append(f"Missing required field: {field}")
            validation_results['missing_fields'].append(field)
            validation_results['is_valid'] = False
        elif subfields:
            for subfield in subfields:
                if subfield not in contract_data.get(field, {}):
                    validation_results['warnings'].append(
                        f"Missing recommended field: {field}.{subfield}"
                    )

    # Check for ambiguities
    if 'ambiguities' in contract_data and contract_data['ambiguities']:
        validation_results['warnings'].append(
            f"Contract has {len(contract_data['ambiguities'])} ambiguous terms that need clarification"
        )

    # Check payment totals
    if 'payments' in contract_data:
        payments = contract_data['payments']
        upfront = payments.get('upfront', 0) or 0
        completion = payments.get('completion', 0) or 0
        total = payments.get('total', 0) or 0

        if upfront + completion != total and total > 0:
            validation_results['warnings'].append(
                f"Payment amounts don't add up: {upfront} + {completion} != {total}"
            )

    return jsonify({
        'success': True,
        'validation': validation_results
    }), 200


@app.route('/api/contract-summary', methods=['POST'])
def contract_summary():
    """
    Generate a human-readable summary from parsed contract data.

    Expected JSON body:
    {
        "contract_data": { ... parsed contract ... }
    }

    Returns:
        Human-readable summary
    """
    data = request.get_json()

    if not data or 'contract_data' not in data:
        return jsonify({
            'error': 'No contract data provided',
            'message': 'Please provide contract data in the "contract_data" field'
        }), 400

    contract_data = data['contract_data']

    try:
        summary = contract_parser.generate_human_summary(contract_data)

        return jsonify({
            'success': True,
            'summary': summary
        }), 200

    except Exception as e:
        return jsonify({
            'error': 'Processing error',
            'message': str(e)
        }), 500


@app.errorhandler(413)
def request_entity_too_large(error):
    """Handle file too large error."""
    return jsonify({
        'error': 'File too large',
        'message': f'Maximum file size is {MAX_FILE_SIZE / (1024*1024)}MB'
    }), 413


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    return jsonify({
        'error': 'Not found',
        'message': 'The requested endpoint does not exist'
    }), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors."""
    return jsonify({
        'error': 'Internal server error',
        'message': 'An unexpected error occurred'
    }), 500


if __name__ == '__main__':
    # Check for required environment variables
    if not os.getenv('ANTHROPIC_API_KEY'):
        print("WARNING: ANTHROPIC_API_KEY not set in environment variables")
        print("Please set it before running the server:")
        print("export ANTHROPIC_API_KEY='your-api-key-here'")

    # Run the Flask app
    print("\n" + "="*50)
    print("DecentraSign Backend API")
    print("="*50)
    print(f"Upload folder: {UPLOAD_FOLDER}")
    print(f"Allowed file types: {', '.join(ALLOWED_EXTENSIONS)}")
    print(f"Max file size: {MAX_FILE_SIZE / (1024*1024)}MB")
    print("="*50 + "\n")

    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True
    )
