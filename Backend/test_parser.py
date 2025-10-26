"""
Test script for contract parser
Run this to verify the parser is working correctly
"""

import os
import json
from contract_parse import ContractParser

# Sample contract text for testing
SAMPLE_CONTRACT = """
FREELANCE DESIGN CONTRACT

This Agreement is made on January 1, 2026, between:

CLIENT: Alice Johnson
Email: alice.johnson@email.com
Address: 123 Main Street, San Francisco, CA

CONTRACTOR: Bob Martinez
Email: bob.martinez@email.com
Address: 456 Oak Avenue, New York, NY
Role: Freelance Graphic Designer

PROJECT SCOPE:
Bob Martinez agrees to design and deliver 3 original logo concepts for Alice Johnson's new business.

PAYMENT TERMS:
1. Upfront Payment: $1,000 USD (due upon contract signing)
2. Completion Payment: $2,000 USD (due upon client approval of final deliverable)
3. Total Contract Value: $3,000 USD
4. Payment Method: Cryptocurrency (SUI) via smart contract escrow

TIMELINE:
- Start Date: January 15, 2026
- Deadline: February 15, 2026 (14 days from start)
- Client approval required within 48 hours of submission

DELIVERABLES:
- 3 unique logo concepts in PNG format (300 DPI)
- Source files (AI/PSD format)
- Style guide documentation

LATE PENALTIES:
If work is delivered after the deadline:
- Late fee: $100 per day
- Maximum penalty: $500 (5 days)
- Penalty will be automatically deducted from completion payment

CANCELLATION POLICY:
Either party may cancel with 7 days written notice.
Upfront payment is non-refundable.

WARRANTY:
Contractor guarantees all work is original and does not infringe on any copyrights.

DISPUTE RESOLUTION:
Any disputes will be resolved through binding arbitration.
Arbitrator fee: $50 (split between parties)

SIGNATURES:
Client: ___________________ Date: ___________
Contractor: ________________ Date: ___________
"""


def test_basic_parsing():
    """Test basic contract parsing functionality."""
    print("="*60)
    print("TEST 1: Basic Contract Parsing")
    print("="*60)

    try:
        parser = ContractParser()
        result = parser.parse_contract(SAMPLE_CONTRACT)

        print("\n✅ Parsing successful!")
        print("\nParsed Data:")
        print(json.dumps(result, indent=2))

        # Generate summary
        summary = parser.generate_human_summary(result)
        print("\n" + summary)

        return True

    except Exception as e:
        print(f"\n❌ Parsing failed: {str(e)}")
        return False


def test_json_output():
    """Test that output is valid JSON."""
    print("\n" + "="*60)
    print("TEST 2: JSON Output Validation")
    print("="*60)

    try:
        parser = ContractParser()
        result = parser.parse_contract(SAMPLE_CONTRACT)

        # Try to serialize to JSON
        json_str = json.dumps(result, indent=2)
        print("\n✅ Output is valid JSON!")

        # Try to deserialize
        parsed_back = json.loads(json_str)
        print("✅ JSON can be deserialized!")

        # Check required fields
        required_fields = ['parties', 'payments', 'deadlines', 'deliverables', '_metadata']
        missing_fields = [field for field in required_fields if field not in parsed_back]

        if missing_fields:
            print(f"⚠️  Warning: Missing fields: {missing_fields}")
        else:
            print("✅ All required fields present!")

        return True

    except json.JSONDecodeError as e:
        print(f"\n❌ Invalid JSON output: {str(e)}")
        return False
    except Exception as e:
        print(f"\n❌ Test failed: {str(e)}")
        return False


def test_field_extraction():
    """Test that specific fields are correctly extracted."""
    print("\n" + "="*60)
    print("TEST 3: Field Extraction Accuracy")
    print("="*60)

    try:
        parser = ContractParser()
        result = parser.parse_contract(SAMPLE_CONTRACT)

        # Expected values
        expected = {
            'parties.client.name': 'Alice Johnson',
            'parties.contractor.name': 'Bob Martinez',
            'payments.upfront': 1000,
            'payments.completion': 2000,
            'payments.total': 3000,
            'penalties.late_fee_per_day': 100,
            'penalties.max_penalty': 500
        }

        all_correct = True
        for key, expected_value in expected.items():
            keys = key.split('.')
            actual_value = result
            for k in keys:
                actual_value = actual_value.get(k)
                if actual_value is None:
                    break

            if actual_value == expected_value:
                print(f"✅ {key}: {actual_value}")
            else:
                print(f"❌ {key}: Expected {expected_value}, got {actual_value}")
                all_correct = False

        if all_correct:
            print("\n✅ All fields extracted correctly!")
        else:
            print("\n⚠️  Some fields were not extracted correctly")

        return all_correct

    except Exception as e:
        print(f"\n❌ Test failed: {str(e)}")
        return False


def test_file_parsing():
    """Test parsing from actual files (if available)."""
    print("\n" + "="*60)
    print("TEST 4: File Parsing (PDF/DOCX)")
    print("="*60)

    # Check if sample files exist
    test_files = [
        'sample_contract.pdf',
        'sample_contract.docx',
        '../test_contract.pdf',
        '../test_contract.docx'
    ]

    found_files = [f for f in test_files if os.path.exists(f)]

    if not found_files:
        print("⚠️  No test files found. Skipping file parsing test.")
        print(f"   Looked for: {', '.join(test_files)}")
        return True

    try:
        parser = ContractParser()

        for file_path in found_files:
            print(f"\nTesting file: {file_path}")
            result = parser.parse_contract_from_file(file_path)
            print(f"✅ Successfully parsed {file_path}")

            # Show brief summary
            if 'parties' in result:
                parties = result['parties']
                if 'client' in parties:
                    print(f"   Client: {parties['client'].get('name', 'N/A')}")
                if 'contractor' in parties:
                    print(f"   Contractor: {parties['contractor'].get('name', 'N/A')}")

        return True

    except Exception as e:
        print(f"\n❌ File parsing failed: {str(e)}")
        return False


def run_all_tests():
    """Run all tests."""
    print("\n" + "="*60)
    print("DECENTRASIGN CONTRACT PARSER TEST SUITE")
    print("="*60)

    # Check for API key
    api_key = os.getenv('ANTHROPIC_API_KEY')
    if not api_key:
        print("\n❌ ERROR: ANTHROPIC_API_KEY not set!")
        print("Please set your API key:")
        print("export ANTHROPIC_API_KEY='your-api-key-here'")
        return

    print(f"\n✅ API key found: {api_key[:20]}...")

    # Run tests
    tests = [
        ("Basic Parsing", test_basic_parsing),
        ("JSON Output Validation", test_json_output),
        ("Field Extraction", test_field_extraction),
        ("File Parsing", test_file_parsing)
    ]

    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"\n❌ {test_name} crashed: {str(e)}")
            results.append((test_name, False))

    # Summary
    print("\n\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")

    print("\n" + "="*60)
    print(f"RESULTS: {passed}/{total} tests passed")
    print("="*60)

    if passed == total:
        print("\n🎉 All tests passed!")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")


if __name__ == "__main__":
    run_all_tests()
