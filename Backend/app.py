"""
Flask API Server for DecentraSign Contract Parser
Provides REST API endpoints for the ContractParser class
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import tempfile
from datetime import datetime, timezone
from ContractParseAI import ContractParser

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Configuration
UPLOAD_FOLDER = tempfile.gettempdir()
ALLOWED_EXTENSIONS = {'pdf', 'docx', 'doc', 'txt'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def is_valid_sui_address(address):
    """
    Validate if a string is a valid Sui wallet address.
    Sui addresses start with 0x and are 66 characters total (0x + 64 hex characters).
    """
    if not address or not isinstance(address, str):
        return False

    # Remove whitespace
    address = address.strip()

    # Must start with 0x
    if not address.startswith('0x'):
        return False

    # Must be exactly 66 characters (0x + 64 hex chars)
    if len(address) != 66:
        return False

    # Check if the remaining characters are valid hexadecimal
    try:
        int(address[2:], 16)
        return True
    except ValueError:
        return False


def convert_to_frontend_format(parsed_data):
    """Convert ContractParser format to frontend-expected format"""
    # Extract parties
    parties_list = []
    if 'parties' in parsed_data:
        parties_dict = parsed_data['parties']
        if 'client' in parties_dict and parties_dict['client']:
            client = parties_dict['client']
            parties_list.append({
                'name': client.get('name', 'Unknown'),
                'role': client.get('role', 'Client'),
                'email': client.get('email', f"{client.get('name', 'client').lower().replace(' ', '.')}@example.com")
            })
        if 'contractor' in parties_dict and parties_dict['contractor']:
            contractor = parties_dict['contractor']
            parties_list.append({
                'name': contractor.get('name', 'Unknown'),
                'role': contractor.get('role', 'Contractor'),
                'email': contractor.get('email', f"{contractor.get('name', 'contractor').lower().replace(' ', '.')}@example.com")
            })

    # Extract payments
    payments_list = []
    if 'payments' in parsed_data and parsed_data['payments']:
        pay = parsed_data['payments']
        currency = pay.get('currency', 'USD')

        if pay.get('upfront'):
            payments_list.append({
                'amount': pay['upfront'],
                'type': 'Upfront',
                'currency': currency,
                'description': 'Initial payment upon contract signing'
            })
        if pay.get('completion'):
            payments_list.append({
                'amount': pay['completion'],
                'type': 'On Completion',
                'currency': currency,
                'description': 'Final payment upon project completion'
            })
        elif pay.get('total') and not pay.get('upfront'):
            # If only total is specified and no upfront
            payments_list.append({
                'amount': pay['total'],
                'type': 'Total',
                'currency': currency,
                'description': 'Total contract value'
            })

    # Extract deadlines
    deadlines_list = []
    if 'deadlines' in parsed_data and parsed_data['deadlines']:
        dl = parsed_data['deadlines']
        if dl.get('final'):
            penalty_amount = 0
            if 'penalties' in parsed_data and parsed_data['penalties']:
                penalty_amount = parsed_data['penalties'].get(
                    'late_fee_per_day', 0) or 0

            deadlines_list.append({
                'milestone': 'Project Completion',
                'date': dl['final'],
                'penalty': penalty_amount,
                'penaltyUnit': 'per day'
            })

        # Add milestones if any
        if dl.get('milestones'):
            for i, milestone in enumerate(dl['milestones']):
                if isinstance(milestone, dict):
                    deadlines_list.append({
                        'milestone': milestone.get('description', f'Milestone {i+1}'),
                        'date': milestone.get('date', 'TBD'),
                        'penalty': 0,
                        'penaltyUnit': 'per day'
                    })
                else:
                    deadlines_list.append({
                        'milestone': str(milestone),
                        'date': 'TBD',
                        'penalty': 0,
                        'penaltyUnit': 'per day'
                    })

    # Generate summary
    summary = ""
    if parties_list and payments_list:
        party_names = [p['name'] for p in parties_list]
        total_amount = sum(p['amount'] for p in payments_list)
        currency = payments_list[0]['currency'] if payments_list else 'USD'
        summary = f"Contract between {' and '.join(party_names)} for {currency} {total_amount:,.2f} total payment"
        if deadlines_list:
            summary += f" by {deadlines_list[0]['date']}"
        summary += "."
    else:
        summary = parsed_data.get(
            'contract_type', 'Contract') + " - parsed successfully"

    # Extract Sui wallet addresses (with validation)
    wallet_addresses = []
    if 'parties' in parsed_data:
        parties_dict = parsed_data['parties']
        print("\n🔍 DEBUG: Extracting wallet addresses...")
        print(f"📦 Parties data: {json.dumps(parties_dict, indent=2)}")

        # Add payer address (only if valid)
        if 'payer' in parties_dict and parties_dict['payer']:
            payer = parties_dict['payer']
            payer_addr = payer.get('address')
            print(f"💰 Payer address found: {payer_addr}")
            if payer_addr:
                is_valid = is_valid_sui_address(payer_addr)
                print(
                    f"   ✓ Validation result: {is_valid} (length: {len(payer_addr) if payer_addr else 0})")
                if is_valid:
                    wallet_addresses.append({
                        'name': payer.get('name', 'Payer'),
                        'role': 'Payer',
                        'address': payer_addr
                    })
                    print(f"   ✅ Added payer address")

        # Add receiver address (only if valid)
        if 'receiver' in parties_dict and parties_dict['receiver']:
            receiver = parties_dict['receiver']
            receiver_addr = receiver.get('address')
            print(f"📥 Receiver address found: {receiver_addr}")
            if receiver_addr:
                is_valid = is_valid_sui_address(receiver_addr)
                print(
                    f"   ✓ Validation result: {is_valid} (length: {len(receiver_addr) if receiver_addr else 0})")
                if is_valid:
                    wallet_addresses.append({
                        'name': receiver.get('name', 'Receiver'),
                        'role': 'Receiver',
                        'address': receiver_addr
                    })
                    print(f"   ✅ Added receiver address")

        # Also check client and contractor for addresses (only if valid)
        if 'client' in parties_dict and parties_dict['client']:
            client = parties_dict['client']
            client_addr = client.get('address')
            print(f"👤 Client address found: {client_addr}")
            if client_addr:
                is_valid = is_valid_sui_address(client_addr)
                print(
                    f"   ✓ Validation result: {is_valid} (length: {len(client_addr) if client_addr else 0})")
                if is_valid and not any(w['name'] == client.get('name') for w in wallet_addresses):
                    wallet_addresses.append({
                        'name': client.get('name', 'Client'),
                        'role': client.get('role', 'Client'),
                        'address': client_addr
                    })
                    print(f"   ✅ Added client address")

        if 'contractor' in parties_dict and parties_dict['contractor']:
            contractor = parties_dict['contractor']
            contractor_addr = contractor.get('address')
            print(f"🔧 Contractor address found: {contractor_addr}")
            if contractor_addr:
                is_valid = is_valid_sui_address(contractor_addr)
                print(
                    f"   ✓ Validation result: {is_valid} (length: {len(contractor_addr) if contractor_addr else 0})")
                if is_valid and not any(w['name'] == contractor.get('name') for w in wallet_addresses):
                    wallet_addresses.append({
                        'name': contractor.get('name', 'Contractor'),
                        'role': contractor.get('role', 'Contractor'),
                        'address': contractor_addr
                    })
                    print(f"   ✅ Added contractor address")

        print(
            f"\n🎯 Total valid wallet addresses extracted: {len(wallet_addresses)}")
        if wallet_addresses:
            print(
                f"📝 Addresses: {[w['address'][:10] + '...' for w in wallet_addresses]}")

    # Ambiguous terms (not in new format, keep empty)
    ambiguous_terms = []

    return {
        'parties': parties_list,
        'payments': payments_list,
        'deadlines': deadlines_list,
        'walletAddresses': wallet_addresses,
        'summary': summary,
        'ambiguousTerms': ambiguous_terms,
        '_raw': parsed_data  # Include raw data for debugging
    }


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })


@app.route('/api/parse-contract', methods=['POST'])
def parse_contract():
    """
    Main endpoint for contract parsing
    Expects: multipart/form-data with 'file' and 'method' (ai or template)
    Returns: JSON with parsed contract terms
    """
    try:
        # Validate file upload
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400

        if not allowed_file(file.filename):
            return jsonify({"error": "Invalid file type. Only PDF, DOCX, and TXT files are allowed."}), 400

        # Get parsing method
        method = request.form.get('method', 'ai').lower()
        if method not in ['ai', 'template']:
            return jsonify({"error": "Invalid method. Use 'ai' or 'template'."}), 400

        # For now, only AI method is supported with the new parser
        if method == 'template':
            return jsonify({"error": "Template parser not yet integrated with new backend. Please use AI method."}), 400

        # Save uploaded file temporarily
        temp_path = os.path.join(
            app.config['UPLOAD_FOLDER'], f"temp_{datetime.now().timestamp()}_{file.filename}")
        file.save(temp_path)

        try:
            # Check for API key
            if not os.getenv('ANTHROPIC_API_KEY'):
                return jsonify({
                    "error": "Anthropic API key not configured. Please set ANTHROPIC_API_KEY in .env file."
                }), 500

            # Initialize parser and parse contract
            parser = ContractParser()
            parsed_data = parser.parse_contract_from_file(temp_path)

            # Convert to frontend format
            frontend_data = convert_to_frontend_format(parsed_data)

            # Clean up temporary file
            os.remove(temp_path)

            return jsonify({
                "success": True,
                "method": method,
                "data": frontend_data,
                "metadata": {
                    "filename": file.filename,
                    "parsed_at": datetime.now(timezone.utc).isoformat(),
                    "model": "claude-sonnet-4-5"
                }
            })

        except Exception as e:
            # Clean up on error
            if os.path.exists(temp_path):
                os.remove(temp_path)
            raise e

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/parse-contract/test', methods=['POST'])
def test_parser():
    """Test endpoint for debugging"""
    try:
        data = request.json
        text = data.get('text', '')
        method = data.get('method', 'ai')

        if not text:
            return jsonify({"error": "No text provided"}), 400

        if not os.getenv('ANTHROPIC_API_KEY'):
            return jsonify({
                "error": "Anthropic API key not configured."
            }), 500

        # Parse the text directly
        parser = ContractParser()
        parsed_data = parser.parse_contract(text)
        frontend_data = convert_to_frontend_format(parsed_data)

        return jsonify({
            "success": True,
            "data": frontend_data
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


if __name__ == '__main__':
    print("=" * 50)
    print("DecentraSign Contract Parser API")
    print("=" * 50)
    print("Endpoints:")
    print("   - GET  /api/health")
    print("   - POST /api/parse-contract")
    print("   - POST /api/parse-contract/test")
    print("\nStarting server on http://localhost:5001")
    print("=" * 50)

    app.run(debug=True, host='0.0.0.0', port=5001)
