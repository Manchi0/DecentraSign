# Sui Rent Payment Smart Contract

A comprehensive smart contract system for managing rental agreements on the Sui blockchain with automated payment scheduling, late fee calculation, and mediator-based dispute resolution.

## Features

### Core Functionality
- **Lease Agreement Management**: Create and manage rental contracts on-chain
- **Payment Scheduling**: Automatic generation of monthly payment schedules
- **Autopay Support**: Enable/disable automated monthly payments
- **Late Fee Calculation**: Automatic 5% daily late fee for overdue payments
- **Escrow System**: Secure holding of rent payments until landlord withdrawal
- **Mediator System**: Optional third-party mediator for dispute resolution
- **Payment Tracking**: Complete payment history and receipts

### Contract Features
- Landlord and tenant addresses
- Property location metadata
- Configurable lease duration and renewal terms
- Utility payment responsibility tracking
- Real-time payment status
- Event emission for all major actions

## Architecture

### Smart Contract Modules

```
rent_payment/
└── sources/
    └── rent_agreement.move    # Main contract module
```

### Key Structs

1. **LeaseAgreement**: Main lease contract object
   - Landlord/tenant addresses
   - Payment terms and schedule
   - Autopay settings
   - Escrow balance
   - Active status

2. **PaymentSchedule**: Individual payment entry
   - Due date and amount
   - Payment status
   - Late fees applied

3. **PaymentReceipt**: Payment proof
   - Transaction details
   - Amounts paid
   - Timestamp

4. **MediatorApproval**: Cancellation approval
   - Mediator authorization
   - Cancellation reason

## Installation & Deployment

### Prerequisites

```bash
# Install Sui CLI
curl -fsSL https://install.sui.io | sh

# Verify installation
sui --version
```

### Build the Contract

```bash
cd contracts/rent_payment
sui move build
```

### Deploy to Testnet

```bash
# Deploy the package
sui client publish --gas-budget 100000000

# Save the package ID from the output
export PACKAGE_ID="0x..."
```

### Deploy to Mainnet

```bash
sui client publish --gas-budget 100000000 --network mainnet
```

## Usage Examples

### Creating a Lease

```move
// Example transaction to create a 6-month lease starting Jan 31, 2026
sui client call \
  --package $PACKAGE_ID \
  --module rent_agreement \
  --function create_lease \
  --args \
    "0xlandlord_address" \
    "0xtenant_address" \
    "123 Main St, San Francisco, CA" \
    2500000000 \  // 2.5 SUI in MIST
    1738281600 \  // Jan 31, 2026 timestamp
    6 \           // 6 months duration
    false \       // Not renewing
    true \        // Autopay enabled
    true \        // Tenant pays utilities
    "0xmediator_address" \
  --gas-budget 10000000
```

### Making a Payment

```move
sui client call \
  --package $PACKAGE_ID \
  --module rent_agreement \
  --function make_payment \
  --args \
    @lease_id \
    @payment_schedule_id \
    @coin_object \
    1740960000 \  // Current timestamp
  --gas-budget 10000000
```

### Toggling Autopay

```move
sui client call \
  --package $PACKAGE_ID \
  --module rent_agreement \
  --function toggle_autopay \
  --args \
    @lease_id \
    1740960000 \
  --gas-budget 5000000
```

## Payment Schedule Example

For a 6-month lease starting January 31, 2026:

| Payment # | Due Date  | Amount (SUI) | Status |
|-----------|-----------|--------------|--------|
| 1         | Feb 28, 2026 | 2.5       | Pending |
| 2         | Mar 30, 2026 | 2.5       | Pending |
| 3         | Apr 29, 2026 | 2.5       | Pending |
| 4         | May 29, 2026 | 2.5       | Pending |
| 5         | Jun 28, 2026 | 2.5       | Pending |
| 6         | Jul 28, 2026 | 2.5       | Pending |

## Late Fee Calculation

Late fees are calculated at **5% per day** on the base rent amount:

```
Late Fee = Base Rent × 0.05 × Days Late

Examples:
- 1 day late on 2.5 SUI: 0.125 SUI late fee
- 5 days late on 2.5 SUI: 0.625 SUI late fee
- 10 days late on 2.5 SUI: 1.25 SUI late fee
```

## Autopay Flow

### With Autopay Enabled

```
Day 0 (Due Date)
  ↓
Scheduler checks payment status
  ↓
If not paid → Automatic payment execution
  ↓
Payment confirmation + Receipt generation
  ↓
Notification sent to tenant
```

### Manual Payment

```
Tenant initiates payment
  ↓
Late fee calculated (if overdue)
  ↓
Total amount verified
  ↓
Payment transferred to escrow
  ↓
Receipt generated
  ↓
Payment marked as complete
```

## Cancellation Process

### Without Prior Payments
- Either party can cancel directly
- No mediator required
- Immediate cancellation

### With Prior Payments
1. Request cancellation
2. Mediator notified
3. Mediator reviews case
4. Mediator approves/denies
5. If approved, lease marked inactive

## Events

The contract emits events for all major actions:

- `LeaseCreatedEvent`: New lease created
- `PaymentMadeEvent`: Payment completed
- `AutopayToggleEvent`: Autopay enabled/disabled
- `CancellationRequestEvent`: Cancellation requested
- `LateFeeAppliedEvent`: Late fee charged

## Integration

### Python Backend
See `Backend/sui_integration/rent_contract.py` for Python integration.

### JavaScript/TypeScript Frontend
See `Frontend/utils/suiRentContract.ts` for TypeScript integration.

### Autopay Scheduler
See `Backend/sui_integration/autopay_scheduler.py` for automated payment processing.

## Security Considerations

1. **Access Control**: Only authorized addresses can perform actions
2. **Payment Verification**: Amount validation before acceptance
3. **Escrow Protection**: Funds held securely until withdrawal
4. **Mediator Authority**: Cancellations require mediator approval
5. **Timestamp Validation**: Prevents backdating of payments

## Testing

### Unit Tests

```bash
sui move test
```

### Integration Tests

```bash
# Run Python tests
cd Backend/sui_integration
pytest test_rent_contract.py

# Run TypeScript tests
cd Frontend
npm test
```

## Gas Costs (Approximate)

| Operation | Gas Budget | Estimated Cost |
|-----------|------------|----------------|
| Create Lease | 10M MIST | ~0.01 SUI |
| Create Payment Schedule | 5M MIST | ~0.005 SUI |
| Make Payment | 10M MIST | ~0.01 SUI |
| Toggle Autopay | 5M MIST | ~0.005 SUI |
| Withdraw Rent | 5M MIST | ~0.005 SUI |

## Limitations

- Assumes 30 days per month for scheduling
- Late fees are linear (5% per day, not compounded)
- Maximum 3 automatic retry attempts for failed autopay
- Requires external scheduler for autopay processing

## Future Enhancements

- [ ] Support for multiple payment methods (SUI, USDC, etc.)
- [ ] Compound late fee calculation
- [ ] Partial payment support
- [ ] Multi-tenant support (roommates)
- [ ] Rent increase clauses
- [ ] Security deposit handling
- [ ] Maintenance request system
- [ ] NFT-based lease certificates

## License

MIT License - see LICENSE file for details

## Support

For issues or questions:
- GitHub Issues: [Your repo URL]
- Documentation: [Your docs URL]
- Discord: [Your Discord server]
