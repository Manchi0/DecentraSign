#!/usr/bin/env python3
"""
Test script to verify wallet address extraction and validation
"""

import requests
import json

# Sample contract with valid Sui wallet addresses
test_contract = """
FREELANCE SERVICES AGREEMENT

This Agreement is entered into on January 15, 2024

PARTIES:
Client: Frank Green
Sui Wallet: 0x0249603975feea1050a2b1fc05e5706ef1acf1aa151e05c0e2e11a13c04b82ca

Contractor: Elvin Reed
Sui Wallet: 0x2def20650727468572791a1152f102aaea56f1c46f39cf1ec8c2e8f1db3ea8b2

PROJECT DETAILS:
The Contractor agrees to provide web development services for the Client.

PAYMENT TERMS:
- Upfront Payment: $2,500 upon signing
- Final Payment: $2,500 upon completion
- Total Contract Value: $5,000

DEADLINES:
- Project Completion: March 15, 2024
- Late Penalty: $100 per day after deadline

WALLET INFORMATION:
Payer (Client) Address: 0x0249603975feea1050a2b1fc05e5706ef1acf1aa151e05c0e2e11a13c04b82ca
Receiver (Contractor) Address: 0x2def20650727468572791a1152f102aaea56f1c46f39cf1ec8c2e8f1db3ea8b2

Both parties agree to the terms outlined above.
"""

def test_wallet_extraction():
    """Test the wallet address extraction"""
    print("=" * 70)
    print("🧪 Testing Wallet Address Extraction")
    print("=" * 70)

    # Test endpoint
    url = "http://localhost:5001/api/parse-contract/test"

    payload = {
        "text": test_contract,
        "method": "ai"
    }

    print("\n📤 Sending test contract to parser...")
    print(f"URL: {url}")

    try:
        response = requests.post(url, json=payload, timeout=60)

        print(f"\n📥 Response Status: {response.status_code}")

        if response.status_code == 200:
            result = response.json()

            print("\n✅ Parsing successful!")
            print("\n" + "=" * 70)
            print("📊 EXTRACTED DATA")
            print("=" * 70)

            # Print wallet addresses
            if 'data' in result and 'walletAddresses' in result['data']:
                wallet_addresses = result['data']['walletAddresses']

                print(f"\n🔐 Wallet Addresses Found: {len(wallet_addresses)}")
                print("-" * 70)

                if wallet_addresses:
                    for idx, wallet in enumerate(wallet_addresses, 1):
                        print(f"\n{idx}. {wallet.get('role', 'Unknown Role')}: {wallet.get('name', 'Unknown')}")
                        print(f"   Address: {wallet.get('address', 'N/A')}")
                        print(f"   Length: {len(wallet.get('address', ''))} chars")
                        print(f"   Valid format: {'✅' if wallet.get('address', '').startswith('0x') and len(wallet.get('address', '')) == 66 else '❌'}")
                else:
                    print("\n⚠️  NO WALLET ADDRESSES EXTRACTED!")
                    print("\nThis indicates the AI might not be finding the addresses in the contract.")
            else:
                print("\n❌ No 'walletAddresses' field in response!")

            # Print parties info
            if 'data' in result and 'parties' in result['data']:
                parties = result['data']['parties']
                print(f"\n👥 Parties Found: {len(parties)}")
                for party in parties:
                    print(f"   - {party.get('name', 'Unknown')} ({party.get('role', 'Unknown')})")

            # Print payments
            if 'data' in result and 'payments' in result['data']:
                payments = result['data']['payments']
                print(f"\n💰 Payments Found: {len(payments)}")
                for payment in payments:
                    print(f"   - {payment.get('type', 'Unknown')}: {payment.get('currency', 'USD')} {payment.get('amount', 0):,.2f}")

            # Print raw data for debugging
            print("\n" + "=" * 70)
            print("🔍 RAW PARSED DATA (for debugging)")
            print("=" * 70)
            if 'data' in result and '_raw' in result['data']:
                print(json.dumps(result['data']['_raw'], indent=2))

        else:
            print(f"\n❌ Error: {response.status_code}")
            print(response.text)

    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Could not connect to backend server!")
        print("Make sure the Flask server is running on http://localhost:5001")
    except requests.exceptions.Timeout:
        print("\n❌ ERROR: Request timed out!")
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")

if __name__ == "__main__":
    test_wallet_extraction()
