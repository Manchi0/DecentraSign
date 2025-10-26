# DecentraSign Integration - Upload to Contract Creation

## Overview

This integration connects the document parsing functionality from the Upload page with the contract creation system from contract-frontend. The flow now automatically:

1. **Extracts contract terms** from uploaded PDF documents using AI
2. **Creates smart contracts** with extracted information
3. **Uploads encrypted documents** to the blockchain
4. **Provides shareable links** for contract access

## New Components Added

### ContractCreation.jsx

- Modal component for creating smart contracts
- Auto-populates contract name from extracted terms
- Collects party wallet addresses
- Integrates with blockchain contract creation

### DocumentUpload.jsx

- Modal component for uploading encrypted documents
- Simulates Walrus encryption and storage
- Provides shareable contract links
- Shows upload progress and success states

## Updated Flow

### 1. Document Upload & Parsing

- User uploads PDF document
- AI extracts contract terms (parties, payments, deadlines)
- Terms are displayed for review

### 2. Contract Creation

- Click "Create Smart Contract" button
- ContractCreation modal opens
- Contract name auto-populated from extracted summary
- User enters other party's wallet address
- Contract is created on blockchain

### 3. Document Upload

- DocumentUpload modal opens automatically
- User uploads the same PDF document
- Document is encrypted and stored
- Shareable link is generated

### 4. Review & Finalization

- Review page shows all contract details
- Displays smart contract information
- Shows document upload details
- User can edit terms and finalize

## Data Flow

```
Upload.jsx
├── Extract terms from PDF
├── Open ContractCreation modal
├── Create contract on blockchain
├── Open DocumentUpload modal
├── Encrypt and upload document
└── Navigate to Review page

Review.jsx
├── Display contract info
├── Display upload info
├── Show extracted terms
├── Allow editing
└── Finalize contract
```

## LocalStorage Data Structure

### contractTerms

```json
{
  "summary": "Contract summary text",
  "parties": [
    { "role": "Client", "name": "John Doe", "email": "john@example.com" },
    { "role": "Contractor", "name": "Jane Smith", "email": "jane@example.com" }
  ],
  "payments": [
    {
      "amount": 5000,
      "currency": "USD",
      "type": "Milestone",
      "description": "Initial payment"
    }
  ],
  "deadlines": [
    {
      "milestone": "Project completion",
      "date": "2024-12-31",
      "penalty": 1000,
      "penaltyUnit": "per day"
    }
  ]
}
```

### contractData

```json
{
  "contractName": "Service Agreement with John",
  "party2Address": "0x...",
  "contractId": "contract_1234567890",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "extractedTerms": {
    /* contractTerms object */
  }
}
```

### uploadData

```json
{
  "fileName": "contract.pdf",
  "fileSize": 1024000,
  "contractId": "contract_1234567890",
  "uploadedAt": "2024-01-01T00:00:00.000Z",
  "blobId": "blob_1234567890",
  "shareUrl": "http://localhost:3000/contract/contract_1234567890"
}
```

## Key Features

### Auto-Population

- Contract name is automatically generated from the extracted summary
- Party information is displayed for reference
- Document details are carried through the flow

### Blockchain Integration

- Smart contracts are created with proper party addresses
- Documents are encrypted and stored securely
- Shareable links provide access to contract documents

### User Experience

- Seamless flow from document upload to contract creation
- Clear progress indicators and success states
- Ability to edit and review all information before finalizing

## Technical Notes

### Dependencies

- Uses existing framer-motion for animations
- Integrates with existing React Router navigation
- Maintains compatibility with current styling system

### Error Handling

- Validates required fields before contract creation
- Provides clear error messages for failed operations
- Graceful fallbacks for missing data

### Security

- Simulates encryption for document storage
- Validates wallet addresses
- Secure data handling through localStorage

## Future Enhancements

1. **Real Blockchain Integration**: Replace simulation with actual Sui blockchain calls
2. **Wallet Connection**: Integrate with Sui wallet for automatic address detection
3. **Document Signing**: Add digital signature functionality
4. **Contract Templates**: Pre-defined contract templates based on document type
5. **Multi-party Support**: Support for contracts with more than two parties
