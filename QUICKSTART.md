# Quick Start Guide - Blockchain Features

Get up and running with blockchain features in 5 minutes!

## Prerequisites

- Node.js installed
- Chrome browser
- 10 minutes of time

## Step 1: Install Sui Wallet (2 minutes)

1. Open Chrome
2. Go to [Sui Wallet Extension](https://chrome.google.com/webstore/detail/sui-wallet)
3. Click "Add to Chrome"
4. Create a new wallet or import existing one
5. **Save your seed phrase securely!**

## Step 2: Get Testnet Tokens (2 minutes)

### Option A: Discord (Easiest)
1. Join [Sui Discord](https://discord.gg/sui)
2. Go to `#testnet-faucet` channel
3. Type: `!faucet <your-wallet-address>`

### Option B: CLI
```bash
sui client faucet
```

## Step 3: Start Your App (1 minute)

```bash
# Install dependencies (if not done)
npm install

# Start dev server
npm run dev
```

Open: http://localhost:5173

## Step 4: Connect Wallet (30 seconds)

1. Click "Connect Wallet" in navbar
2. Select "Sui Wallet"
3. Click "Connect"
4. Approve the connection

## Step 5: Try Features (2 minutes)

### Create a Contract
1. Navigate to `/blockchain` page
2. Click "Create Contract" tab
3. Enter a contract name
4. Choose "Public" or "Private"
5. If private, enter second party address
6. Click "Create Contract"

### Upload a Document
1. Click "Upload Document" tab
2. Select a Walrus service (any works)
3. Choose a PDF file (< 10 MiB)
4. Click "Upload Encrypted Document"
5. Wait for transaction to complete

### View a Document
1. Click "View Document" tab
2. Click "Decrypt & View" or "View"
3. Document appears in the preview
4. Click "Download" to save locally

## That's It! 🎉

You now have:
- ✅ Blockchain-based contracts
- ✅ Encrypted document storage
- ✅ Decentralized file hosting
- ✅ Wallet-based authentication

## Next Steps

### Deploy Your Smart Contracts

```bash
cd move
sui client publish --gas-budget 100000000
```

Copy the package ID and update `src/config/constants.js`:
```js
export const TESTNET_PACKAGE_ID = '0xYOUR_PACKAGE_ID';
```

### Integrate into Your Existing Pages

Add these components to your existing pages:

**Upload.jsx:**
```jsx
import { ContractCreator } from '../components/ContractCreator';

<ContractCreator onContractCreated={handleCreated} />
```

**Review.jsx:**
```jsx
import { PrivateDocumentUpload } from '../components/PrivateDocumentUpload';

<PrivateDocumentUpload
  contractId={contractId}
  capId={capId}
  encryptionKeyId={keyId}
  onFileUploaded={handleUploaded}
/>
```

**Dashboard.jsx:**
```jsx
import { DocumentViewer } from '../components/DocumentViewer';

<DocumentViewer
  blobId={blobId}
  encryptionKeyId={keyId}
  isPrivate={true}
/>
```

## Common Issues

### "Insufficient funds" error
- Get more testnet tokens from the faucet

### "Wallet not connected"
- Click "Connect Wallet" in navbar
- Make sure wallet extension is unlocked

### "Upload failed"
- Try a different Walrus service from the dropdown
- Check file size (must be < 10 MiB)
- Ensure you have testnet SUI for gas

### "Transaction rejected"
- Check you have enough gas (testnet SUI)
- Try increasing gas budget in the code
- Verify contract addresses are correct

## Resources

- 📖 [Full Integration Guide](./BLOCKCHAIN_INTEGRATION.md)
- 📋 [Integration Summary](./INTEGRATION_SUMMARY.md)
- 🌐 [Sui Documentation](https://docs.sui.io/)
- 💬 [Sui Discord](https://discord.gg/sui)

## Support

Need help? Check:
1. Browser console for errors
2. Wallet extension is unlocked
3. You're on testnet network
4. You have sufficient testnet SUI

Happy building! 🚀
