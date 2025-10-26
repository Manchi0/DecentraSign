# Blockchain Integration Guide

This document explains how to use the Sui blockchain, Walrus storage, and Seal encryption features integrated into DecentraSign.

## Overview

DecentraSign now includes full blockchain capabilities:

- **Sui Blockchain**: Decentralized contract management and signing
- **Walrus Storage**: Distributed file storage for documents
- **Seal Encryption**: End-to-end encryption for private contracts
- **Wallet Integration**: Connect with Sui wallets (via Chrome extension)

## Getting Started

### 1. Install Sui Wallet

Install a Sui wallet browser extension:
- [Sui Wallet](https://chrome.google.com/webstore/detail/sui-wallet)
- [Suiet Wallet](https://chrome.google.com/webstore/detail/suiet-wallet)
- [Ethos Wallet](https://chrome.google.com/webstore/detail/ethos-wallet)

### 2. Connect Your Wallet

1. Click the **"Connect Wallet"** button in the navbar
2. Select your preferred wallet
3. Approve the connection request

### 3. Get Testnet SUI Tokens

You'll need testnet SUI tokens to create contracts:

1. Visit the [Sui Testnet Faucet](https://discord.com/channels/916379725201563759/971488439931392130)
2. Join the Sui Discord and request tokens in the `#testnet-faucet` channel
3. Or use the CLI: `sui client faucet`

## Features

### Creating Contracts

#### Public Contracts

Public contracts are visible to anyone and can be accessed by multiple parties:

```jsx
import { ContractCreator } from './components/ContractCreator';

function MyPage() {
  return (
    <ContractCreator
      onContractCreated={(result) => {
        console.log('Contract created:', result);
      }}
    />
  );
}
```

#### Private Contracts

Private contracts use Seal encryption and are only accessible to specified parties:

```jsx
import { ContractCreator } from './components/ContractCreator';

// Create a private two-party contract
// Enter the second party's Sui wallet address
// Documents will be encrypted end-to-end
```

### Uploading Documents

#### Upload to Public Contracts

Public documents are stored on Walrus without encryption:

```jsx
import { storeBlob } from './utils/walrusStorage';

const uploadPublicDocument = async (file) => {
  const fileData = await fileToUint8Array(file);
  const { blobId } = await storeBlob(fileData, 'service1');
  console.log('Uploaded to Walrus:', blobId);
};
```

#### Upload to Private Contracts

Private documents are encrypted with Seal before uploading:

```jsx
import { PrivateDocumentUpload } from './components/PrivateDocumentUpload';

function PrivateContractPage({ contractId, capId, encryptionKeyId }) {
  return (
    <PrivateDocumentUpload
      contractId={contractId}
      capId={capId}
      encryptionKeyId={encryptionKeyId}
      onFileUploaded={(blobId) => {
        console.log('Encrypted document uploaded:', blobId);
      }}
    />
  );
}
```

### Viewing Documents

```jsx
import { DocumentViewer } from './components/DocumentViewer';

function ViewDocument({ blobId, encryptionKeyId, isPrivate }) {
  return (
    <DocumentViewer
      blobId={blobId}
      encryptionKeyId={isPrivate ? encryptionKeyId : null}
      isPrivate={isPrivate}
    />
  );
}
```

## Component Reference

### `<ContractCreator />`

Creates new blockchain contracts (public or private).

**Props:**
- `onContractCreated?: (result) => void` - Callback when contract is created

### `<PrivateDocumentUpload />`

Handles encrypted document uploads for private contracts.

**Props:**
- `contractId: string` - The contract object ID
- `capId: string` - The contract capability object ID
- `encryptionKeyId: string` - The encryption key ID for this contract
- `onFileUploaded?: (blobId: string) => void` - Callback when upload completes

### `<DocumentViewer />`

Views and downloads documents from Walrus.

**Props:**
- `blobId: string` - The Walrus blob ID
- `encryptionKeyId?: string` - Encryption key ID for private documents
- `isPrivate?: boolean` - Whether this is an encrypted document

## Hooks Reference

### `useContract()`

Hook for contract operations.

```jsx
import { useContract } from './hooks/useContract';

function MyComponent() {
  const {
    createPublicContract,
    createPrivateContract,
    addToAllowlist,
    removeFromAllowlist,
    getContractInfo,
  } = useContract();

  const handleCreate = async () => {
    await createPublicContract('My Contract');
  };
}
```

**Methods:**
- `createPublicContract(name: string)` - Create a public contract
- `createPrivateContract(name: string, party2Address: string, encryptionKeyId: string)` - Create a private two-party contract
- `addToAllowlist(allowlistId: string, capId: string, userAddress: string)` - Add user to contract
- `removeFromAllowlist(allowlistId: string, capId: string, userAddress: string)` - Remove user from contract
- `getContractInfo(allowlistId: string)` - Get contract information

## Utility Functions

### Walrus Storage

```jsx
import { storeBlob, retrieveBlob, getBlobViewUrl } from './utils/walrusStorage';

// Store data
const { blobId } = await storeBlob(uint8ArrayData, 'service1');

// Retrieve data
const data = await retrieveBlob(blobId, 'service1');

// Get URL for viewing
const url = getBlobViewUrl(blobId, 'service1');
```

### Seal Encryption

```jsx
import {
  createSealClient,
  encryptData,
  decryptData,
  fileToUint8Array
} from './utils/sealEncryption';

// Create Seal client
const sealClient = createSealClient(suiClient);

// Encrypt
const { encryptedObject } = await encryptData(
  sealClient,
  packageId,
  encryptionKeyId,
  data
);

// Decrypt
const decryptedData = await decryptData(
  sealClient,
  packageId,
  encryptionKeyId,
  encryptedData
);
```

## Configuration

### Network Configuration

Edit `src/config/networkConfig.js` to configure networks:

```js
import { createNetworkConfig } from '@mysten/dapp-kit';

const { networkConfig } = createNetworkConfig({
  testnet: {
    url: getFullnodeUrl('testnet'),
    variables: {
      packageId: 'YOUR_PACKAGE_ID',
    },
  },
});
```

### Constants

Edit `src/config/constants.js` to update:
- Package IDs
- Walrus service endpoints
- Seal key server IDs
- File size limits

## Move Smart Contracts

The Move contracts are located in `move/sources/`:

### `allowlist.move`

Manages contract access control and document publishing.

**Key functions:**
- `create_allowlist(name)` - Create public contract
- `create_private_contract(name, party1, party2, encryption_key_id)` - Create private contract
- `add(allowlist, cap, account)` - Add user to contract
- `remove(allowlist, cap, account)` - Remove user from contract
- `publish(allowlist, cap, blob_id)` - Attach document to contract

### `subscription.move`

Manages subscription-based access control.

### `utils.move`

Utility functions for the contract modules.

## Deploying Contracts

To deploy your Move contracts:

```bash
cd move
sui client publish --gas-budget 100000000
```

Update the package IDs in `src/config/constants.js` after deployment.

## Chrome Extension Integration

The Sui wallet extensions provide:
- Wallet connection and management
- Transaction signing
- Account management
- Network switching

Users interact with the blockchain through these extensions, which handle:
- Private key management
- Transaction approval
- Gas payment

## Architecture

```
┌─────────────────┐
│   React App     │
│  (DecentraSign) │
└────────┬────────┘
         │
    ┌────┴────┬──────────┬──────────┐
    │         │          │          │
┌───▼───┐ ┌──▼──┐ ┌─────▼────┐ ┌──▼──────┐
│ Sui   │ │Seal │ │ Walrus   │ │ Wallet  │
│dApp   │ │Client│ │ Storage  │ │Extension│
│ Kit   │ │     │ │          │ │         │
└───┬───┘ └──┬──┘ └─────┬────┘ └──┬──────┘
    │        │          │          │
    └────────┴──────────┴──────────┘
                  │
         ┌────────▼────────┐
         │  Sui Blockchain │
         │    (Testnet)    │
         └─────────────────┘
```

## Security Best Practices

1. **Private Keys**: Never share your private keys or seed phrases
2. **Testnet Only**: Use testnet for development and testing
3. **Verify Transactions**: Always review transactions before signing
4. **Access Control**: Use private contracts for sensitive documents
5. **Walrus Services**: Rotate between Walrus services for redundancy

## Troubleshooting

### Wallet Connection Issues

- Ensure wallet extension is installed and unlocked
- Check that you're on the correct network (testnet)
- Try disconnecting and reconnecting

### Transaction Failures

- Ensure you have sufficient testnet SUI tokens
- Check gas budget is adequate
- Verify contract addresses are correct

### Encryption/Decryption Errors

- Ensure you're authorized to access the private contract
- Verify the encryption key ID is correct
- Check that Seal key servers are accessible

### Walrus Upload Failures

- Try a different Walrus service (use the dropdown)
- Ensure file size is under 10 MiB
- Check network connectivity

## Resources

- [Sui Documentation](https://docs.sui.io/)
- [Seal Documentation](https://docs.sui.io/standards/seal)
- [Walrus Documentation](https://docs.walrus.site/)
- [dApp Kit Guide](https://sdk.mystenlabs.com/dapp-kit)

## Support

For issues or questions:
1. Check the browser console for error messages
2. Verify wallet connection and network settings
3. Review this documentation
4. Check the Sui Discord for community support
