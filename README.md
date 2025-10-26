# DecentraDoc

Upload any contract → AI reads it and writes blockchain code → Both parties sign with Google → Contract automatically enforces itself (payments, deadlines, penalties—all automatic).

**The Problem We Solve:**
DocuSign proves you *agreed* to terms. DecentraDoc actually *enforces* those terms. No more manual payments, no trusting the other party, no lawyers for small disputes. Your contract becomes an autonomous agent that executes itself.

**Real-World Example:**
```
Traditional Freelance Contract:
✍️  Sign in DocuSign (done)
💸 Manually wire $2K upfront (3 days, $30 fee)
⏳ Wait and hope they deliver
💸 Manually wire $3K on completion (3 more days, $30 fee)
⚖️  Hire lawyer if they don't deliver ($5K+)

DecentraDoc:
✍️  Both sign with Google login (30 seconds)
💸 $2K instantly sent to freelancer
✅ They mark "complete" → you approve
💸 $3K instantly sent (or auto-reduced if late)
⚖️  Built-in arbitration if needed (costs $50)
```

---

## ⚡ Core Features

### 1. **AI Contract Parser**
- Upload PDF/Word doc of any contract
- AI extracts: parties, payment amounts, deadlines, milestones, penalties
- Generates human-readable summary: "Alice pays Bob $5K total: $2K upfront, $3K on delivery by Dec 15th. $100/day late fee."
- Flags ambiguous terms: "Please clarify what 'high quality' means"

**Blockchain Enhancement:** AI-generated terms are hashed and stored on Sui—both parties cryptographically prove they reviewed the *exact same interpretation* before signing.

---

### 2. **Smart Contract Code Generation**
AI writes a Sui Move smart contract that:
- Holds all funds in escrow
- Automatically releases payments when conditions are met
- Calculates penalties/bonuses based on timestamps
- Enforces multi-signature approval for deliverables

**Example Generated Code:**
```move
module DecentraDoc::escrow {
    struct Agreement has key {
        client: address,
        freelancer: address,
        upfront: 1000 SUI,
        completion: 2000 SUI,
        deadline: timestamp,
        penalty_per_day: 100 SUI,
        work_delivered: bool,
        approved: bool,
    }
    
    // Auto-releases upfront payment on contract creation
    fun init_payment() { /* instant transfer */ }
    
    // Auto-calculates penalty if late, releases adjusted payment
    public fun release_on_approval() {
        let delay = now() - self.deadline;
        let penalty = min(delay * penalty_per_day, 500);
        transfer(completion - penalty, freelancer);
        transfer(penalty, client); // refund
    }
}
```

**Why Sui?**
- **Sub-second finality:** Payments settle instantly (Ethereum takes 12+ seconds)
- **Parallel execution:** Multiple contracts can execute simultaneously without congestion
- **Low gas fees:** $0.001 per transaction vs. Ethereum's $5-50
- **Move language:** Built-in safety features prevent common smart contract bugs

---

### 2.5 **Contract Parser and Contract Code Generation**

For Users who don't find AI reliable. Template based parsing, with fixed OCR and preset templates for Move code

### 3. **Zero-Knowledge Login (Enoki/zkLogin)**
Users sign contracts with their Google/Apple account—no crypto knowledge required.

**How It Works:**
1. User clicks "Sign with Google"
2. Enoki's zkLogin creates a Sui wallet tied to their email (invisible to them)
3. User approves → signature recorded on-chain
4. Their wallet can now receive payments, sign transactions, all through familiar OAuth

**Benefits:**
- **No seed phrases:** Mom can inherit crypto without knowing what a private key is
- **Decentralized identity:** Their "signature" isn't stored in DocuSign's database—it's a blockchain transaction anyone can verify
- **Cross-platform:** Same identity works across all Sui dApps

**Why This Matters:** 99% of contract signers don't have crypto wallets. Enoki removes the biggest barrier to blockchain adoption.

---

### 4. **Immutable Document Storage (Walrus)**
Original contract PDF is stored on Walrus—Sui's decentralized storage network.

**How It Works:**
- Contract is split into encrypted chunks
- Distributed across global storage nodes
- Document hash recorded on Sui blockchain
- Pay once, stored forever (no monthly fees like AWS S3)

**Benefits:**
- **Can't be deleted:** Even if DecentraDoc shuts down, your contract exists forever
- **Can't be altered:** Any change to the PDF creates a different hash
- **Censorship-resistant:** No government or company can take it down
- **Verifiable:** Anyone can check if the PDF you're holding matches the blockchain hash

**Comparison:** DocuSign stores contracts on their servers. If they go bankrupt, get hacked, or government seizes servers—you lose access. With Walrus, it's physically impossible to lose the document.

---

### 5. **Automated Execution Engine**

**Instant Payments:**
- Client deposits funds → smart contract holds them
- Milestone reached → payment automatically releases
- No wire transfers, no PayPal fees, no 3-day bank holds

**Auto-Calculated Adjustments:**
```
Scenario: Deadline is Dec 15, work delivered Dec 20 (5 days late)

Traditional:
- Freelancer: "Where's my money?"
- Client: "You were late! I'm deducting $500"
- Freelancer: "No, we had a grace period!"
- [Argue for 2 weeks, maybe hire lawyers]

DecentraDoc:
- Dec 20: Freelancer marks work complete
- Smart contract checks blockchain timestamp
- Auto-calculates: 5 days × $100/day = $500 penalty
- Transfers $2,500 to freelancer, refunds $500 to client
- Both parties see audit trail proving the math
```

**Why Sui?**
- **Timestamp precision:** Sui's consensus ensures globally agreed-upon time (down to the millisecond)
- **Deterministic execution:** Same inputs = same outputs, always. No "bank processed it late" excuses
- **Atomic transactions:** Payment + penalty calculation + refund happen as one indivisible operation

---

### 6. **Built-In Dispute Resolution**

**3-Step Process:**
1. Either party clicks "Dispute" → uploads evidence to Walrus (photos, chat logs, etc.)
2. Both parties nominate a neutral arbitrator (or choose from DecentraDoc's verified pool)
3. Arbitrator reviews evidence → votes to release funds
4. 2-of-3 multisig (arbitrator + 1 party) = funds released immediately

**Blockchain Enhancement:**
- **Arbitrator can't steal funds:** Smart contract only allows voting, not direct transfers
- **Decision is permanent:** Recorded on-chain, can't be disputed later
- **Arbitrator reputation:** Their decisions are public—bad arbitrators get low ratings

**Cost:** $50 arbitration fee (vs. $5,000+ for lawyers)

---

### 7. **Signature hosting and tracking**

On Sui

---

## 📊 DecentraDoc vs. DocuSign

| Feature | DocuSign | DecentraDoc |
|---------|----------|-----------|
| **What It Does** | Proves you signed | Proves you signed *AND* enforces terms |
| **Signature Storage** | DocuSign's AWS servers | Sui blockchain (50,000+ validators) |
| **Document Storage** | Centralized database | Walrus (decentralized, permanent) |
| **If Company Dies** | You lose access to contracts | Documents and contracts exist forever |
| **Document Can Be Altered?** | Yes (by admins) | Cryptographically impossible |
| **Payment Processing** | Manual (you wire money yourself) | Automatic (smart contract releases funds) |
| **Payment Speed** | 3-5 business days | Instant (sub-second) |
| **Payment Fees** | $30+ wire fees | $0.001 transaction fee |
| **Late Penalties** | You calculate manually | Auto-calculated by smart contract |
| **Dispute Resolution** | Hire lawyers ($5K+) | Built-in arbitration ($50) |
| **Trust Required** | Trust DocuSign + other party | Trust math (blockchain consensus) |
| **Verification** | Only DocuSign can verify | Anyone, anywhere, anytime can verify |
| **Identity** | Tied to email (DocuSign controls) | Decentralized ID (you control) |
| **Cross-Border** | Subject to DocuSign's jurisdiction | Neutral global network |
| **Crypto Knowledge Required** | N/A | None (zkLogin via Google) |
| **Contract Execution** | ❌ Not possible | ✅ Fully automated |

**Bottom Line:** DocuSign is a digital filing cabinet. DecentraDoc is an autonomous enforcement agent.

---

## 🎨 User Experience: 3-Minute Contract

### **Alice (Client) Perspective:**

**1. Upload Contract (30 seconds)**
- Drags "Freelance_Agreement.pdf" into browser
- AI processes: "Reading contract... Found 2 parties, 3 payment terms, 1 deadline, 1 penalty clause"

**2. Review AI Summary (45 seconds)**
```
📄 Contract Summary:

Parties:
  👤 You (Alice): Client
  👤 Bob Martinez: Freelance Designer

Payments:
  💰 $1,000 → Bob (on signing)
  💰 $2,000 → Bob (when you approve deliverable)
  💰 Total escrowed: $3,000

Timeline:
  📅 Deadline: 14 days from signing
  ⚠️  Late penalty: $100/day (max $500)

Deliverables:
  ✅ 3 logo concepts in PNG format
  ✅ Requires your approval within 48 hours
```
- Alice: "Looks good!" → clicks "Create Smart Contract"

**3. Deposit Funds (30 seconds)**
- Connects bank account or uses credit card
- Deposits $3,000 → held in smart contract escrow
- Status: "Waiting for Bob to sign..."

**4. Bob Signs (he does this in 1 minute)**
- Bob gets email: "Alice invited you to sign a contract"
- Clicks link → logs in with Google (zkLogin creates his wallet invisibly)
- Reviews same summary → clicks "Sign"
- ✨ **Instantly receives $1,000** in his new Sui wallet (shows as "$1,000 USD")

**5. During Work (automatic)**
- Alice sees: "📊 Status: In Progress | ⏱️ 10 days remaining"
- Bob uploads designs to contract → marks "Ready for Review"
- Alice gets notification: "Bob submitted work"

**6. Completion (30 seconds)**
- Alice reviews logos → clicks "Approve"
- ✨ **Bob instantly receives $2,000**
- Contract status: "✅ Completed on time"

**Total time invested by Alice:** 2 minutes
**Total time waiting for payments:** 0 seconds (vs. 6-10 days with traditional methods)

---

### **If Bob Is Late (Automatic Penalty):**

**Scenario:** Bob delivers on day 17 (3 days late)

**What Happens:**
1. Bob marks work complete on day 17
2. Smart contract checks Sui blockchain timestamp
3. Calculates: `(17 - 14) days × $100/day = $300 penalty`
4. Alice clicks "Approve"
5. Smart contract executes:
   - ✨ Bob receives: $2,000 - $300 = **$1,700**
   - ✨ Alice receives: **$300 refund**
6. Both see audit trail:
```
📋 Payment Breakdown:
   Completion payment:     $2,000.00
   Late penalty (3 days):  - $300.00
   ────────────────────────────────
   Total to Bob:           $1,700.00
   Refund to Alice:        $  300.00
   
   🔗 Blockchain proof: sui.io/tx/0xabc123...
```

**No arguments. No manual calculations. Just math.**

---

## 🛠️ Technical Stack (Sui-Focused)

### **Why We Built on Sui**

| Requirement | Why Sui Wins |
|-------------|--------------|
| **Instant payments** | Sub-second finality (vs. 12s on Ethereum, 60s on Bitcoin) |
| **Micro-penalties** | $0.001 gas fees enable small daily penalties (Ethereum's $5+ gas makes this impossible) |
| **Timestamp precision** | Mysticeti consensus gives globally-agreed timestamps to the millisecond |
| **Parallel contracts** | 1000s of contracts can execute simultaneously without slowing down |
| **Asset safety** | Move's object model prevents accidental loss of funds (no "sent to wrong address") |
| **Upgradeability** | Can fix bugs in contracts without redeploying (Ethereum contracts are immutable) |

---

### **Architecture**

```
┌─────────────────────────────────────────────────────────┐
│                     USER INTERFACE                       │
│                  (Next.js + TypeScript)                  │
│  "Upload contract" → "Review AI summary" → "Sign & Pay" │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   AI CONTRACT PARSER                     │
│              (GPT-4 API + Legal Fine-Tuning)             │
│   Extracts: Parties, $$$, Dates, Milestones, Penalties  │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│              SMART CONTRACT GENERATOR                    │
│              (Sui Move Code Generation)                  │
│   Creates: Escrow logic, payment triggers, penalties    │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   SUI BLOCKCHAIN LAYER                   │
├─────────────────────────────────────────────────────────┤
│  🔷 Sui Move Smart Contracts                            │
│     • Escrow wallet holds funds                         │
│     • Milestone tracking                                │
│     • Auto-calculation of penalties/bonuses             │
│     • Multi-sig for disputes                            │
│                                                          │
│  🔷 Enoki (zkLogin)                                     │
│     • Google OAuth → Sui wallet mapping                 │
│     • Zero-knowledge proofs for privacy                 │
│     • No seed phrases, no crypto UX                     │
│                                                          │
│  🔷 Walrus (Decentralized Storage)                      │
│     • Stores original PDF contracts                     │
│     • Stores dispute evidence (photos, logs)            │
│     • Returns content hash → recorded on Sui            │
│     • Pay once, stored forever                          │
│                                                          │
│  🔷 Sui Network Features Used                           │
│     • Timestamp oracle (for deadline enforcement)       │
│     • Fast finality (instant payment settlement)        │
│     • Low gas fees (enables micro-transactions)         │
│     • Object model (safe asset handling)                │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                  EXTERNAL INTEGRATIONS                   │
│  • Bank APIs (deposit fiat → buy SUI)                   │
│  • Email/SMS (notifications)                            │
│  • Future: Oracles for real-world data                  │
└─────────────────────────────────────────────────────────┘
```

---

### **Key Sui Technologies Explained**

#### **1. Sui Move Smart Contracts**
- **What:** Programming language for writing contract logic
- **Why Sui's Move:** Safer than Solidity (Ethereum's language)
  - Assets can't accidentally be deleted or duplicated
  - Move's "abilities" system prevents common exploits
  - Linear types ensure funds can only be in one place at once

**Example Use:**
```move
// This Move code is impossible to write incorrectly
// The compiler won't let you lose the "coin" object
public fun split_payment(coin: Coin<SUI>) {
    let (half1, half2) = coin::split(coin, amount / 2);
    transfer(half1, client);
    transfer(half2, freelancer);
    // Compiler error if you forget to transfer both halves!
}
```

#### **2. Enoki (zkLogin)**
- **What:** Lets users create blockchain wallets using OAuth (Google, Apple, etc.)
- **How:** Zero-knowledge proofs connect your Google identity to a Sui address without revealing private keys
- **Why Critical:** 99% of users don't have crypto wallets. Enoki removes this barrier.

**Example Use:**
```typescript
// User clicks "Sign with Google"
const { wallet } = await enoki.login({ provider: 'google' });

// Behind the scenes:
// 1. Google authenticates user
// 2. Enoki generates Sui wallet tied to their email
// 3. User can now sign blockchain transactions
// 4. User never sees seed phrases or private keys

// Now the user can sign the contract:
await wallet.signTransaction(contractSignatureTx);
```

#### **3. Walrus (Decentralized Storage)**
- **What:** Sui's storage network (like Arweave or Filecoin, but optimized for Sui)
- **How:** Files are encoded, encrypted, split into chunks, distributed across nodes
- **Cost:** ~$0.10/GB one-time fee (vs. AWS S3's $0.023/GB *per month*)

**Example Use:**
```typescript
// Upload contract PDF to Walrus
const blob = await walrus.store(pdfFile);
// Returns: { 
//   blobId: "0xabc123...", 
//   size: 245000,
//   cost: 0.002 SUI 
// }

// Record the hash on Sui blockchain
await suiClient.executeTransactionBlock({
  transaction: {
    kind: 'moveCall',
    data: {
      function: 'register_document',
      arguments: [blob.blobId, documentHash]
    }
  }
});

// Now the PDF is:
// 1. Permanently stored on Walrus (can't be deleted)
// 2. Hash recorded on Sui (can't be altered)
// 3. Verifiable by anyone forever
```

#### **4. Sui's Timestamp Oracle**
- **What:** Globally agreed-upon time provided by blockchain consensus
- **Why It Matters:** Deadline enforcement requires trustworthy timestamps

**Example Use:**
```move
public fun check_deadline(agreement: &Agreement, ctx: &TxContext) {
    let current_time = tx_context::epoch_timestamp_ms(ctx);
    
    if (current_time > agreement.deadline) {
        let days_late = (current_time - agreement.deadline) / 86400000;
        let penalty = days_late * agreement.penalty_per_day;
        // Auto-deduct penalty from payment
    }
}
```

**Why Sui's Timestamps Are Trusted:**
- Mysticeti consensus: All validators agree on time
- Can't be manipulated by any single party
- Millisecond precision
- Auditable: Anyone can verify the timestamp by checking the blockchain

---

## 🚀 Sui-Specific Advantages in Action

### **Use Case: International Freelance Contract**

**The Setup:**
- Alice (USA) hires Raj (India) for $5,000 software project
- Payment terms: $2K upfront, $3K on completion in 30 days

**Traditional Way (DocuSign + Wire Transfer):**
1. Sign in DocuSign ✓
2. Alice's bank wires $2K: 
   - $45 wire fee
   - 5-7 business days
   - Raj's bank charges ₹500 receiving fee
   - Exchange rate loss: ~3%
3. Raj completes work
4. Alice wires $3K:
   - Another $45 fee
   - Another 5-7 days
   - Another exchange rate loss

**Total cost:** ~$150 in fees + 10-14 days waiting + exchange rate losses
**Risk:** If Raj doesn't deliver, Alice needs to sue internationally (good luck)

---

**DecentraDoc Way (Sui Blockchain):**
1. Both sign via Enoki (30 seconds each)
2. Alice deposits $5K worth of SUI:
   - Smart contract holds it in escrow
   - ✨ Raj instantly receives $2K worth of SUI
   - Gas fee: $0.001
   - No exchange rate loss (SUI is global)
3. Raj completes work in 30 days
4. Alice approves:
   - ✨ Raj instantly receives $3K worth of SUI
   - Gas fee: $0.001
   - Total time: <1 second

**Total cost:** $0.002 in fees
**Risk:** If Raj doesn't deliver, smart contract auto-refunds Alice after deadline

**Sui-Specific Wins:**
- **Sub-second finality:** Payments settle instantly (vs. Ethereum's 12s or Bitcoin's 60min)
- **Global accessibility:** Sui validators are distributed worldwide—no single country controls it
- **Low gas fees:** $0.001/tx enables this business model (Ethereum's $5-50 gas makes it uneconomical)
- **Enoki makes it seamless:** Raj's parents in India can receive inheritance via Google login

---

## 🎯 Why This Is a Killer Hackathon Project

### **Checks Every Box:**

✅ **Uses Sui deeply:** Move contracts, Enoki, Walrus, timestamps—not just "we deployed to Sui"
✅ **Solves real problem:** $2.3T contract dispute market, 60% freelancer non-payment rate
✅ **AI + Blockchain:** The two hottest technologies, working together
✅ **Instant "wow" demo:** Upload PDF → watch AI write code → instant payments
✅ **Judges will relate:** Everyone has signed a contract and been burned
✅ **Clear moat:** The more contracts processed, the smarter the AI gets

### **The Unfair Advantage:**

**Why Competitors Can't Copy This on Ethereum:**
1. **Gas fees:** Auto-calculating a $100 penalty would cost $20 in gas on Ethereum (economically impossible)
2. **Speed:** 12-second finality means payments take 12+ seconds (Sui: <1 second)
3. **No zkLogin:** Ethereum has no equivalent to Enoki—users need MetaMask
4. **Storage costs:** Storing PDFs on Arweave/IPFS requires separate services (Walrus is native to Sui)

**This literally only works on Sui.**

---

## 💎 The Closing Argument

DocuSign solved signatures. We solved **everything that happens after.**

- Your contract isn't stored on a company's server—it's permanent and global
- Your signature isn't in a database—it's a cryptographic proof on a blockchain
- Your payments aren't manual—they're code that executes itself
- Your disputes aren't going to court—they're resolved by math

**DecentraDoc turns contracts from promises into programs.**

And it only works because of Sui's speed, Enoki's simplicity, Walrus's permanence, and Move's safety.

---

**Built on:** Sui • Walrus • Enoki • Move
**Powered by:** Tesseract + AI (Claude Sonnet) + Blockchain Consensus
**Result:** Contracts that enforce themselves


**Stack:**
Python Backend- OCR (tesseract), LLM (Claude), Text processing and extraction
Flask for connections
React site
Oauth/Enocio for login
Seal for encryption of documents
Walrus for decentralized hosting of files.
Sui for signature storage and change tracking in files, and for ensuring transaction (move)

File should have addresses and essential info


*Legal agreements, evolved.*