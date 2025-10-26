#!/bin/bash

# API Testing Script
# Tests all endpoints of the DecentraSign backend

BASE_URL="http://localhost:5000"

echo "================================================"
echo "DecentraSign Backend API Tests"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo "Test 1: Health Check"
echo "--------------------"
response=$(curl -s "$BASE_URL/health")
if [[ $response == *"healthy"* ]]; then
    echo -e "${GREEN}✅ PASS${NC}: Health check successful"
    echo "   Response: $response"
else
    echo -e "${RED}❌ FAIL${NC}: Health check failed"
    echo "   Response: $response"
fi
echo ""

# Test 2: Parse Text
echo "Test 2: Parse Contract Text"
echo "----------------------------"
contract_text="FREELANCE CONTRACT
This Agreement is made on January 1, 2026 between Alice Johnson (Client) and Bob Martinez (Contractor).

PAYMENTS:
- Upfront: \$1,000
- Completion: \$2,000
- Total: \$3,000

DEADLINE: February 15, 2026 (14 days)
LATE FEE: \$100 per day (max \$500)

DELIVERABLES:
- 3 logo concepts in PNG format"

response=$(curl -s -X POST "$BASE_URL/api/parse-text" \
  -H "Content-Type: application/json" \
  -d "{\"text\":\"$contract_text\"}")

if [[ $response == *"success"*true* ]]; then
    echo -e "${GREEN}✅ PASS${NC}: Text parsing successful"
    # Extract client name from response
    client=$(echo $response | grep -o '"name"[^,]*' | head -1)
    echo "   Extracted: $client"
else
    echo -e "${RED}❌ FAIL${NC}: Text parsing failed"
    echo "   Response: $response"
fi
echo ""

# Test 3: File Upload (if sample file exists)
echo "Test 3: Upload Contract File"
echo "-----------------------------"

# Create a sample text file to test
echo "Creating sample contract file..."
cat > /tmp/test_contract.txt << 'EOF'
FREELANCE DESIGN CONTRACT

This Agreement is made on January 1, 2026, between:

CLIENT: Alice Johnson
Email: alice.johnson@email.com

CONTRACTOR: Bob Martinez
Email: bob.martinez@email.com
Role: Freelance Graphic Designer

PAYMENT TERMS:
1. Upfront Payment: $1,000 USD
2. Completion Payment: $2,000 USD
3. Total: $3,000 USD

TIMELINE:
Deadline: February 15, 2026

LATE PENALTIES:
Late fee: $100 per day (max $500)

DELIVERABLES:
- 3 logo concepts in PNG format
EOF

# Note: The API expects PDF or DOCX, so this test might fail
# But we're testing the endpoint's error handling
response=$(curl -s -X POST "$BASE_URL/api/upload-contract" \
  -F "file=@/tmp/test_contract.txt")

if [[ $response == *"success"* ]] || [[ $response == *"Invalid file type"* ]]; then
    if [[ $response == *"Invalid file type"* ]]; then
        echo -e "${YELLOW}⚠️  INFO${NC}: Endpoint correctly rejected .txt file"
        echo "   (Only PDF/DOCX supported)"
    else
        echo -e "${GREEN}✅ PASS${NC}: File upload successful"
    fi
else
    echo -e "${RED}❌ FAIL${NC}: Unexpected response"
    echo "   Response: $response"
fi

# Cleanup
rm /tmp/test_contract.txt
echo ""

# Test 4: Validate Contract
echo "Test 4: Validate Contract Data"
echo "-------------------------------"
response=$(curl -s -X POST "$BASE_URL/api/validate-contract" \
  -H "Content-Type: application/json" \
  -d '{
    "contract_data": {
      "parties": {
        "client": {"name": "Alice Johnson"},
        "contractor": {"name": "Bob Martinez"}
      },
      "payments": {
        "upfront": 1000,
        "completion": 2000,
        "total": 3000
      },
      "deadlines": {
        "final": "2026-02-15"
      },
      "deliverables": ["3 logo concepts"]
    }
  }')

if [[ $response == *"is_valid"* ]]; then
    echo -e "${GREEN}✅ PASS${NC}: Validation endpoint working"
    validation=$(echo $response | grep -o '"is_valid"[^,]*')
    echo "   Result: $validation"
else
    echo -e "${RED}❌ FAIL${NC}: Validation failed"
    echo "   Response: $response"
fi
echo ""

# Test 5: Generate Summary
echo "Test 5: Generate Contract Summary"
echo "----------------------------------"
response=$(curl -s -X POST "$BASE_URL/api/contract-summary" \
  -H "Content-Type: application/json" \
  -d '{
    "contract_data": {
      "parties": {
        "client": {"name": "Alice Johnson", "role": "Client"},
        "contractor": {"name": "Bob Martinez", "role": "Designer"}
      },
      "payments": {
        "upfront": 1000,
        "completion": 2000,
        "total": 3000,
        "currency": "USD"
      },
      "deadlines": {
        "final": "2026-02-15"
      },
      "penalties": {
        "late_fee_per_day": 100
      },
      "deliverables": ["3 logo concepts"]
    }
  }')

if [[ $response == *"summary"* ]]; then
    echo -e "${GREEN}✅ PASS${NC}: Summary generation successful"
    echo "   Summary includes contract details"
else
    echo -e "${RED}❌ FAIL${NC}: Summary generation failed"
    echo "   Response: $response"
fi
echo ""

# Test 6: Error Handling - Missing File
echo "Test 6: Error Handling - No File"
echo "---------------------------------"
response=$(curl -s -X POST "$BASE_URL/api/upload-contract")

if [[ $response == *"error"* ]] && [[ $response == *"No file"* ]]; then
    echo -e "${GREEN}✅ PASS${NC}: Correctly handles missing file"
else
    echo -e "${RED}❌ FAIL${NC}: Error handling failed"
    echo "   Response: $response"
fi
echo ""

# Test 7: Error Handling - Invalid Endpoint
echo "Test 7: Error Handling - 404"
echo "-----------------------------"
response=$(curl -s "$BASE_URL/api/invalid-endpoint")

if [[ $response == *"404"* ]] || [[ $response == *"Not found"* ]]; then
    echo -e "${GREEN}✅ PASS${NC}: Correctly returns 404"
else
    echo -e "${RED}❌ FAIL${NC}: Unexpected response"
    echo "   Response: $response"
fi
echo ""

echo "================================================"
echo "API Tests Complete"
echo "================================================"
