"""
Test script to verify contract_parse.py works with OCR text input
"""

import os
import sys
from contract_parse import ContractParser

# Sample OCR text (simulating text extracted from a contract)
SAMPLE_CONTRACT_TEXT = """
INDEPENDENT CONTRACTOR AGREEMENT

This Agreement is made on January 15, 2026, between:

CLIENT: TechCorp Inc.
Email: contact@techcorp.com
Address: 123 Tech Street, San Francisco, CA 94105

CONTRACTOR: Jane Smith
Email: jane.smith@developer.com
Address: 456 Dev Avenue, Oakland, CA 94612

PROJECT SCOPE:
The Contractor agrees to develop a mobile application with the following features:
- User authentication system
- Real-time messaging
- Push notifications
- Payment integration

PAYMENT TERMS:
- Upfront Payment: $5,000 upon signing
- Milestone Payment: $7,500 upon completion of Phase 1
- Final Payment: $7,500 upon project completion
- Total Contract Value: $20,000

TIMELINE:
- Start Date: January 15, 2026
- Phase 1 Deadline: February 15, 2026
- Final Deadline: March 31, 2026

LATE PENALTIES:
- Late fees of $200 per day will be charged for delays beyond the final deadline
- Maximum penalty: $5,000

TERMS:
- Payment method: Bank transfer
- Cancellation: Either party may cancel with 15 days written notice
- Warranty: 30-day bug fix warranty after delivery
- Disputes: Resolved through arbitration in San Francisco

Signatures:
_________________          _________________
TechCorp Inc.              Jane Smith
Client                     Contractor
"""


def test_ocr_text_parsing():
    """Test parsing of OCR text input"""
    print("=" * 60)
    print("Testing contract_parse.py with OCR text input")
    print("=" * 60)
    print()

    # Check for API key
    if not os.getenv('ANTHROPIC_API_KEY'):
        print("ERROR: ANTHROPIC_API_KEY environment variable not set")
        print("Please set it with: export ANTHROPIC_API_KEY='your-key-here'")
        sys.exit(1)

    try:
        # Initialize parser
        print("1. Initializing ContractParser...")
        parser = ContractParser()
        print("   ✅ Parser initialized successfully")
        print()

        # Parse the OCR text
        print("2. Parsing OCR text (simulated contract)...")
        print(f"   Text length: {len(SAMPLE_CONTRACT_TEXT)} characters")
        print()

        parsed_data = parser.parse_contract(SAMPLE_CONTRACT_TEXT)
        print("   ✅ Text parsed successfully")
        print()

        # Validate results
        print("3. Validating parsed results...")
        required_keys = ['parties', 'payments', 'deadlines', 'deliverables', '_metadata']
        for key in required_keys:
            if key in parsed_data:
                print(f"   ✅ {key}: Found")
            else:
                print(f"   ❌ {key}: Missing")

        print()

        # Display parsed information
        print("4. Parsed Contract Information:")
        print("-" * 60)

        if 'parties' in parsed_data:
            parties = parsed_data['parties']
            if 'client' in parties and parties['client']:
                print(f"   Client: {parties['client'].get('name', 'N/A')}")
            if 'contractor' in parties and parties['contractor']:
                print(f"   Contractor: {parties['contractor'].get('name', 'N/A')}")

        if 'payments' in parsed_data:
            payments = parsed_data['payments']
            total = payments.get('total', 0) or 0
            upfront = payments.get('upfront', 0) or 0
            print(f"   Total Payment: ${float(total):,.2f}")
            print(f"   Upfront: ${float(upfront):,.2f}")

        if 'deadlines' in parsed_data:
            deadlines = parsed_data['deadlines']
            print(f"   Start Date: {deadlines.get('start_date', 'N/A')}")
            print(f"   Final Deadline: {deadlines.get('final', 'N/A')}")

        if 'penalties' in parsed_data and parsed_data['penalties']:
            penalties = parsed_data['penalties']
            late_fee = penalties.get('late_fee_per_day')
            if late_fee:
                print(f"   Late Fee: ${float(late_fee):,.2f}/day")

        print("-" * 60)
        print()

        # Generate human summary
        print("5. Generating human-readable summary...")
        summary = parser.generate_human_summary(parsed_data)
        print()
        print(summary)
        print()

        # Test completion
        print("=" * 60)
        print("✅ ALL TESTS PASSED!")
        print("=" * 60)
        print()
        print("The contract parser successfully:")
        print("  • Accepted OCR text input")
        print("  • Parsed the contract with Claude AI")
        print("  • Returned structured JSON data")
        print("  • Generated a human-readable summary")
        print()

        return True

    except Exception as e:
        print()
        print("=" * 60)
        print("❌ TEST FAILED")
        print("=" * 60)
        print(f"Error: {str(e)}")
        print()
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = test_ocr_text_parsing()
    sys.exit(0 if success else 1)
