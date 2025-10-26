# DecentraSign - Self-Enforcing Smart Contracts

A blockchain-powered contract platform that doesn't just prove you agreed to terms—it actually **enforces** them. Built with React, Framer Motion, and Sui blockchain, featuring AI contract parsing and zero-knowledge authentication.

## Design Philosophy

This project deliberately avoids generic "AI slop" aesthetics by:

- **Typography**: Using Fraunces (elegant serif) and Outfit (modern sans-serif) for a distinctive, professional look
- **Color Palette**: Blockchain-inspired blues and teals combined with warm accent tones for sophisticated UX
- **Motion**: Smooth, purposeful animations using Framer Motion for page transitions and micro-interactions
- **Backgrounds**: Layered gradients and atmospheric effects with subtle blockchain-themed glows

## The Problem We Solve

**DocuSign** proves you *agreed* to terms.
**DecentraSign** actually *enforces* those terms.

No manual payments, no trusting the other party, no lawyers for small disputes. Your contract becomes an autonomous agent that executes itself on the Sui blockchain.

### Traditional Contract (DocuSign)
- ✍️ Sign in DocuSign (done)
- 💸 Manually wire $2K upfront (3 days, $30 fee)
- ⏳ Wait and hope they deliver
- 💸 Manually wire $3K on completion (3+ days, $30 fee)
- ⚖️ Hire lawyer if they don't deliver ($5K+)

### DecentraSign
- ✍️ Both sign with Google login (30 seconds)
- 💸 $2K instantly sent to freelancer on blockchain
- ✅ They mark "complete" → you approve
- 💸 $3K instantly sent (or auto-reduced if late)
- ⚖️ Built-in arbitration if needed ($50)

## Core Features

### 1. AI Contract Parser
- Upload any PDF/Word contract
- AI extracts: parties, payments, deadlines, milestones, penalties
- Generates human-readable summary: "Alice pays Bob $5K total: $2K upfront, $3K on delivery by Dec 15th. $100/day late fee."
- Flags ambiguous terms for clarification
- **Alternative**: Template-based parser for users who prefer predictable results

### 2. Smart Contract Code Generation (Coming Soon)
- AI writes Sui Move code that:
  - Holds all funds in escrow
  - Automatically releases payments when conditions are met
  - Calculates penalties/bonuses based on blockchain timestamps
  - Enforces multi-signature approval for deliverables

### 3. Zero-Knowledge Login (Coming Soon)
- Sign with Google via Enoki zkLogin
- No seed phrases or crypto wallet needed
- Blockchain identity created invisibly in background
- Cross-platform Sui identity

### 4. Immutable Document Storage (Coming Soon)
- Original contracts stored on Walrus (Sui's decentralized storage)
- Document hash recorded on blockchain
- Can't be deleted, altered, or censored
- Pay once, stored forever (no monthly fees)

### 5. Automated Execution Engine (Coming Soon)
- Instant payments via Sui blockchain
- Auto-calculated penalties and adjustments
- No wire transfers, no PayPal fees, no 3-day holds
- Sub-second finality (vs. Ethereum's 12+ seconds)

### 6. Built-In Dispute Resolution (Coming Soon)
- 3-step arbitration process
- Upload evidence to decentralized storage
- Neutral arbitrator voting
- 2-of-3 multisig protection ($50 fee vs. $5K+ lawyer fees)

## Tech Stack

### Frontend
- **React 19** - Modern React with hooks
- **Vite** - Lightning-fast build tool and dev server
- **React Router DOM** - Client-side routing
- **Framer Motion** - Smooth animations and page transitions

### Blockchain (Coming Soon)
- **Sui Blockchain** - Sub-second finality, parallel execution, low gas fees
- **Move Language** - Safe smart contract development
- **Enoki zkLogin** - Zero-knowledge authentication via Google OAuth
- **Walrus** - Decentralized storage for contract documents

### AI/ML (Mock Implementation)
- Contract parsing and term extraction (currently simulated)
- Smart contract code generation (planned)

## Design System

### Colors
```css
/* Primary blockchain colors */
--blockchain-blue: #4A90E2
--deep-blue: #1A3A52
--crypto-purple: #7B68EE
--sui-blue: #6FBCF0

/* Accent colors */
--terracotta: #D4744A
--gold: #F39C12
--success-green: #5EC269

/* Neutral palette */
--cream: #FAF7F0
--off-white: #FFF8F0
--charcoal: #2D3436
```

### Typography
- **Headings**: Fraunces (serif, weights 300-900)
- **Body**: Outfit (sans-serif, weights 300-700)

### Animation Timings
- Page transitions: 0.6-0.8s ease-out
- Micro-interactions: 0.3-0.4s ease
- Staggered reveals: 0.05-0.1s delay increments

## Getting Started

### Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

3. **Open in browser**
   Navigate to http://localhost:5173/

### Testing the App

1. **Landing Page** - View blockchain value proposition and feature comparison
2. **Upload Contract** - Test drag-and-drop or click to upload a PDF/DOC file
3. **Choose Parser** - Select AI Parser or Template Parser (currently simulated)
4. **View Extracted Terms** - See parties, payments, deadlines, and penalties
5. **Review Page** (Coming Soon) - View generated Sui Move smart contract code
6. **Sign Page** (Coming Soon) - Sign with Google OAuth via zkLogin

## Project Structure

```
src/
├── pages/
│   ├── Landing.jsx    # Hero, value proposition, feature comparison
│   ├── Upload.jsx     # AI contract parser with method selection
│   ├── Review.jsx     # Smart contract code review (coming soon)
│   ├── Sign.jsx       # zkLogin signature (coming soon)
│   └── Dashboard.jsx  # Active contracts dashboard (coming soon)
├── App.jsx            # Main router and navigation
├── App.css            # Complete blockchain-themed design system
└── index.css          # Global resets
```

## Key Features by Page

### Landing
- Hero section emphasizing blockchain enforcement vs. traditional contracts
- Traditional vs. DecentraSign comparison cards
- 6 core feature cards with blockchain icons
- "Why Sui?" section with technical benefits
- Smooth scroll navigation and staggered animations

### Upload (AI Contract Parser)
- Drag-and-drop file upload (PDF, DOC, DOCX)
- Choose between AI Parser or Template Parser
- Simulated parsing with loading animation
- Extracted terms display:
  - Parties (names, roles, emails)
  - Payments (amounts, types, descriptions)
  - Deadlines (milestones, dates, penalties)
- Ambiguous terms flagging (AI mode only)
- Human-readable contract summary

### Review (Coming Soon)
- Display generated Sui Move smart contract code
- Line-by-line explanation of contract logic
- Escrow, payment release, and penalty calculation
- Edit contract parameters before deployment
- Deploy to Sui testnet/mainnet

### Sign (Coming Soon)
- Google OAuth login via Enoki zkLogin
- No wallet setup required
- Cryptographic signature on Sui blockchain
- Contract activation with multi-party signatures

### Dashboard (Coming Soon)
- Active contracts overview
- Payment status and history
- Milestone tracking
- Dispute resolution interface
- Blockchain transaction verification

## Why Sui Blockchain?

- **Sub-second finality**: Payments settle instantly (vs. Ethereum's 12+ seconds)
- **Parallel execution**: Multiple contracts execute simultaneously without congestion
- **Low gas fees**: $0.001 per transaction vs. Ethereum's $5-50
- **Move language**: Built-in safety features prevent common smart contract bugs
- **Timestamp precision**: Globally agreed-upon time for deadline enforcement
- **Deterministic execution**: Same inputs = same outputs, always

## Development Notes

### Current Implementation
- Mock AI parsing (3-second simulation for AI, 1.5s for template)
- localStorage for passing data between pages
- Responsive design with mobile breakpoints
- CSS custom properties for blockchain-themed design
- Framer Motion for all page transitions and animations

### Production Requirements
- Backend API for actual AI contract parsing
- Sui blockchain integration for smart contract deployment
- Enoki zkLogin SDK for Google OAuth authentication
- Walrus API for decentralized document storage
- Smart contract templates in Sui Move language

## Roadmap

### Phase 1 (Current)
- [x] Blockchain-themed UI/UX
- [x] Landing page with value proposition
- [x] AI contract parser interface (mock)
- [x] Extracted terms display
- [ ] Contract review page
- [ ] Sui Move code generation (mock)

### Phase 2
- [ ] Backend API for real AI parsing (using GPT-4/Claude)
- [ ] Sui blockchain integration
- [ ] Enoki zkLogin implementation
- [ ] Smart contract deployment
- [ ] Wallet integration for payments

### Phase 3
- [ ] Walrus document storage integration
- [ ] Multi-party signature workflows
- [ ] Automated payment execution
- [ ] Penalty calculation engine
- [ ] Dashboard for active contracts

### Phase 4
- [ ] Dispute resolution system
- [ ] Arbitrator marketplace
- [ ] Contract templates
- [ ] Email/SMS notifications
- [ ] Mobile app (React Native)

## How to Test

### Manual Testing
1. Run `npm run dev` and open http://localhost:5173/
2. **Landing Page**:
   - Scroll through sections
   - Check comparison cards animation
   - Click "Create Smart Contract"
3. **Upload Page**:
   - Drag and drop a PDF file
   - Choose "AI Parser" or "Template Parser"
   - Wait for parsing animation
   - Review extracted terms (parties, payments, deadlines)
   - Check ambiguous terms warning (AI mode only)
4. **Navigation**: Test all navbar links

### Testing Checklist
- [ ] Hero animations on Landing page
- [ ] Comparison cards slide in correctly
- [ ] Feature cards have hover effects
- [ ] "Why Sui?" section displays properly
- [ ] File upload drag-and-drop works
- [ ] Both parser options function correctly
- [ ] Parsing animation plays
- [ ] Extracted terms display all sections
- [ ] Mobile responsive design works
- [ ] All buttons have proper hover states

## License

MIT

## Credits

Built with a focus on high-quality, non-generic design that respects users' intelligence. Blockchain-powered, AI-enhanced, but never "AI slop."
