# Old Implementation Logic

This directory contains previous implementations and experimental features that were developed during the project's evolution. The code here represents different approaches to building decentralized contract signing and payment functionalities on the Sui blockchain.

## Directory Structure

```
Old_Imp_logic/
├── frontend/           # Seal-based encryption & allowlist management app
├── transac-frontend/   # Payment request & transaction dApp
└── move/              # Move smart contracts for blockchain logic
```

---

## 1. `frontend/` - Seal Encryption & Allowlist Management

### Overview
A React + TypeScript application demonstrating **Mysten Labs' Seal** encryption library integrated with **Walrus** storage for private contract management. This implementation focuses on encrypted document sharing with fine-grained access control.

### Key Features
- **Allowlist Management**: Create and manage access control lists for contracts
- **Encrypted Storage**: Upload encrypted files to Walrus decentralized storage
- **Private Contracts**: Support for public, two-party, and multi-party private contracts
- **PDF Viewing**: Integrated PDF viewer for contract documents
- **Subscription Services**: Time-based subscription access to contracts

### Main Components

#### Core Components
- `CreateAllowlist.tsx` - Interface for creating new allowlists with access controls
- `Allowlist.tsx` - Display and manage existing allowlists
- `AllowlistView.tsx` - View allowlist members and permissions
- `EncryptAndUpload.tsx` - Encrypt files and upload to Walrus storage
- `CreatePrivateContract.tsx` - Create encrypted private contracts
- `PrivateContractEncryption.tsx` - Handle contract encryption logic

#### Subscription System
- `CreateSubscriptionService.tsx` - Create subscription-based access services
- `SubscriptionService.tsx` - Manage subscription service settings
- `SubscriptionView.tsx` - View active subscriptions
- `OwnedSubscriptionServices.tsx` - Display user's subscription services
- `OwnedAllowlists.tsx` - Display user's owned allowlists

#### Viewers
- `PDFViewer.tsx` - Render PDF documents
- `FileViewer.tsx` - Generic file viewer component

### Technology Stack
```json
{
  "@mysten/dapp-kit": "0.17.7",
  "@mysten/seal": "0.5.2",
  "@mysten/sui": "1.37.6",
  "react": "19.1.0",
  "tailwindcss": "4.1.16",
  "react-router-dom": "7.4.1"
}
```

### Key Features from Dependencies
- **@mysten/seal**: End-to-end encryption for private data
- **Radix UI**: Accessible UI component library
- **Tailwind CSS**: Utility-first styling
- **React Router**: Multi-page routing (admin/view modes)

### Routes
- `/` - Landing page (Create Allowlist)
- `/admin/contract/:id` - Admin view for managing allowlist and uploading encrypted content
- `/view/contract/:id` - User view for accessing allowed contracts

### Use Case
This implementation was designed for scenarios requiring:
- Private document sharing with selective access
- Encrypted contract storage on decentralized infrastructure
- Subscription-based access to protected content
- Multi-party contract agreements with encryption

---

## 2. `transac-frontend/` - Payment Request & Transaction dApp

### Overview
A simpler React + TypeScript dApp branded as **"DecentraSign - Request & Pay"** that handles payment requests, money transfers, and basic Sui object interactions. This was an earlier prototype focusing on the transaction layer.

### Key Features
- **Payment Requests**: Create and manage payment requests on-chain
- **Money Transfer**: Direct SUI token transfers between addresses
- **Request Fulfillment**: View and pay pending payment requests
- **Counter Demo**: Basic Sui shared object interaction example

### Main Components

#### Payment System
- `RequestPayment.tsx` - Form to create new payment requests
- `PaymentRequests.tsx` - List of incoming/outgoing payment requests
- `SendMoney.tsx` - Send SUI to any address
- `PaymentSender.tsx` - Direct payment interface

#### Demo/Testing
- `Counter.tsx` - Display and interact with counter objects
- `CreateCounter.tsx` - Create new counter shared objects

### Technology Stack
```json
{
  "@mysten/dapp-kit": "0.19.6",
  "@mysten/sui": "1.43.1",
  "react": "18.3.1",
  "react-spinners": "0.14.1"
}
```

### Tab-Based Interface
The app uses Radix Themes tabs with five main sections:
1. **Payment Requests** - View and manage requests
2. **Create Request** - Generate new payment requests
3. **Send Money** - Transfer SUI to addresses
4. **Direct Payment** - Immediate payment interface
5. **Counter** - Demo of Sui object interactions

### Configuration Files
- `constants.ts` - Package IDs and network configuration
- `networkConfig.ts` - Sui network setup (mainnet/testnet/devnet)

### Use Case
This implementation served as a proof-of-concept for:
- P2P payment request systems
- On-chain transaction management
- Basic dApp wallet integration
- Testing Sui Move object interactions

---

## 3. `move/` - Smart Contract Layer

### Overview
Move language smart contracts implementing the blockchain logic for both frontend applications. These contracts run on the Sui blockchain and define the on-chain data structures and business logic.

### Package Information
```toml
[package]
name = "walrus"
edition = "2024.beta"

[addresses]
walrus = "0x0"
```

### Contracts

#### `allowlist.move` - Access Control System

**Purpose**: Implements allowlist-based access control for contracts and encrypted data.

**Key Structures**:
```move
public struct Allowlist has key {
    id: UID,
    name: String,
    list: vector<address>,
    is_private: bool,
    contract_type: String,        // "public", "private_two_party", "private_multi_party"
    encryption_key_id: String,    // For private contracts
}

public struct Cap has key {
    id: UID,
    allowlist_id: ID,
}
```

**Functionality**:
- Create allowlists with admin capabilities
- Add/remove addresses from allowlists
- Verify access permissions on-chain
- Support multiple contract types (public/private)
- Associate encryption keys with allowlists

**Key Functions**:
- `create_allowlist()` - Initialize new allowlist with admin cap
- Likely includes: `add_to_allowlist()`, `remove_from_allowlist()`, `verify_access()`

**Use Case**: Gates access to encrypted content stored on Walrus based on blockchain-verified permissions.

---

#### `subscription.move` - Time-Based Access System

**Purpose**: Implements subscription services with fees and time-to-live (TTL) for time-limited access.

**Key Structures**:
```move
public struct Service has key {
    id: UID,
    fee: u64,
    ttl: u64,
    owner: address,
    name: String,
}

public struct Subscription has key {
    id: UID,
    service_id: ID,
    created_at: u64,
}

public struct Cap has key {
    id: UID,
    service_id: ID,
}
```

**Functionality**:
- Create subscription services with pricing
- Set time limits (TTL) for subscriptions
- Process subscription payments
- Track subscription creation time
- Admin capabilities for service management

**Key Functions**:
- `create_service()` - Create new subscription service
- Likely includes: `subscribe()`, `verify_subscription()`, `collect_fees()`

**Use Case**: Enables recurring or time-limited access to contracts/content with on-chain payment verification.

---

#### `utils.move` - Utility Functions

**Purpose**: Shared utility functions used across other contracts.

**Known Functions**:
- `is_prefix()` - String/vector prefix checking (used in allowlist and subscription modules)

**Use Case**: Provides common functionality to avoid code duplication across contracts.

---

### Move Contract Architecture

```
┌─────────────────────────────────────┐
│         Frontend dApps              │
│  (frontend/ & transac-frontend/)    │
└──────────────┬──────────────────────┘
               │ @mysten/sui SDK
               ↓
┌─────────────────────────────────────┐
│      Sui Blockchain Network         │
└──────────────┬──────────────────────┘
               │
       ┌───────┴───────┬──────────────┐
       ↓               ↓              ↓
┌─────────────┐ ┌─────────────┐ ┌──────────┐
│ allowlist   │ │subscription │ │  utils   │
│   .move     │ │   .move     │ │  .move   │
└─────────────┘ └─────────────┘ └──────────┘
```

---

## Relationship Between Components

### Data Flow Example

1. **User Creates Private Contract** (frontend app):
   ```
   User → CreateAllowlist Component
        → Call allowlist.move::create_allowlist()
        → Receive Allowlist ID & Admin Cap
   ```

2. **User Uploads Encrypted File**:
   ```
   User → EncryptAndUpload Component
        → Encrypt file using @mysten/seal
        → Upload to Walrus storage
        → Store blob ID + allowlist reference
   ```

3. **Recipient Access**:
   ```
   Recipient → AllowlistView Component
             → Verify access via allowlist.move
             → Decrypt file using Seal
             → Display in FileViewer/PDFViewer
   ```

---

## Why This Code is "Old"

These implementations represent earlier exploration phases of the project:

1. **frontend/** - Tested Seal encryption integration but may have been too complex for MVP
2. **transac-frontend/** - Explored payment request patterns that were refined in current implementation
3. **move/** - Smart contract patterns that may have been superseded by newer contracts in the main `move/` directory

The current production code likely integrates learnings from these implementations while simplifying the architecture.

---

## Running These Applications

### Frontend (Seal App)

```bash
cd Old_Imp_logic/frontend
npm install
npm run dev
```

### Transaction Frontend

```bash
cd Old_Imp_logic/transac-frontend
npm install
npm run dev
```

### Deploy Move Contracts

```bash
cd Old_Imp_logic/move
sui client publish --gas-budget 100000000
```

---

## Development Notes

### Frontend Apps
- Both use **Vite** as build tool
- TypeScript for type safety
- Radix UI for component library
- @mysten/dapp-kit for wallet connection

### Move Contracts
- Edition: 2024.beta
- Framework: Sui testnet framework
- Pattern: Capability-based access control
- Storage: Integrated with Walrus decentralized storage

---

## Key Learnings & Patterns

### From Frontend Implementation
- Seal encryption provides strong privacy guarantees
- Walrus storage integration for decentralized file hosting
- Allowlist pattern enables flexible access control
- Subscription model works for time-based access

### From Transaction Frontend
- Simple payment request UX
- Direct SUI transfers
- Counter pattern demonstrates Sui shared objects

### From Move Contracts
- Capability objects (Cap) for admin permissions
- Dynamic fields for extensible data storage
- Time-based access via Clock
- Vector-based allowlists for access control

---

## Migration Path

If you need to integrate features from these old implementations:

1. **Review the specific component/contract** you want to migrate
2. **Check current codebase** for similar functionality
3. **Extract and adapt** the relevant logic
4. **Update dependencies** to match current versions
5. **Test thoroughly** in current environment

---

## Documentation References

- [Sui Documentation](https://docs.sui.io/)
- [Mysten Seal](https://github.com/MystenLabs/seal)
- [Walrus Documentation](https://docs.walrus.site/)
- [Move Language Book](https://move-language.github.io/move/)
- [Sui dApp Kit](https://sdk.mystenlabs.com/dapp-kit)

---

## License

Copyright (c) Mysten Labs, Inc.
SPDX-License-Identifier: Apache-2.0
