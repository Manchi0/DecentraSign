module rent_payment::rent_agreement {
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::event;
    use std::string::{Self, String};

    // ==================== Error Codes ====================
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_ALREADY_PAID: u64 = 2;
    const E_PAYMENT_NOT_DUE: u64 = 3;
    const E_INVALID_AMOUNT: u64 = 4;
    const E_LEASE_EXPIRED: u64 = 5;
    const E_ALREADY_CANCELLED: u64 = 6;
    const E_MEDIATOR_REQUIRED: u64 = 7;
    const E_PAYMENT_OVERDUE: u64 = 8;

    // ==================== Constants ====================
    const LATE_FEE_RATE: u64 = 5; // 5% per day
    const SECONDS_PER_DAY: u64 = 86400;
    const PERCENTAGE_PRECISION: u64 = 100;

    // ==================== Structs ====================

    /// Main lease agreement object
    public struct LeaseAgreement has key, store {
        id: UID,
        landlord: address,
        tenant: address,
        property_location: String,
        monthly_rent: u64,
        start_timestamp: u64,
        end_timestamp: u64,
        is_renewing: bool,
        autopay_enabled: bool,
        utilities_paid_by_tenant: bool,
        late_fee_enabled: bool,
        mediator_address: Option<address>,
        is_active: bool,
        total_payments_made: u64,
        escrow_balance: Balance<SUI>,
    }

    /// Individual payment schedule entry
    public struct PaymentSchedule has key, store {
        id: UID,
        lease_id: ID,
        payment_number: u64,
        due_timestamp: u64,
        amount: u64,
        is_paid: bool,
        paid_timestamp: Option<u64>,
        late_fee_applied: u64,
    }

    /// Payment receipt for record keeping
    public struct PaymentReceipt has key, store {
        id: UID,
        lease_id: ID,
        payment_schedule_id: ID,
        payer: address,
        amount_paid: u64,
        late_fee: u64,
        payment_timestamp: u64,
    }

    /// Mediator approval for cancellation
    public struct MediatorApproval has key, store {
        id: UID,
        lease_id: ID,
        mediator: address,
        approved: bool,
        reason: String,
        timestamp: u64,
    }

    // ==================== Events ====================

    public struct LeaseCreatedEvent has copy, drop {
        lease_id: ID,
        landlord: address,
        tenant: address,
        monthly_rent: u64,
        start_timestamp: u64,
        end_timestamp: u64,
    }

    public struct PaymentMadeEvent has copy, drop {
        lease_id: ID,
        payment_schedule_id: ID,
        tenant: address,
        amount: u64,
        late_fee: u64,
        timestamp: u64,
    }

    public struct AutopayToggleEvent has copy, drop {
        lease_id: ID,
        enabled: bool,
        timestamp: u64,
    }

    public struct CancellationRequestEvent has copy, drop {
        lease_id: ID,
        requester: address,
        timestamp: u64,
    }

    public struct LateFeeAppliedEvent has copy, drop {
        lease_id: ID,
        payment_schedule_id: ID,
        late_fee: u64,
        days_late: u64,
    }

    // ==================== Public Functions ====================

    /// Create a new lease agreement
    public fun create_lease(
        landlord: address,
        tenant: address,
        property_location: vector<u8>,
        monthly_rent: u64,
        start_timestamp: u64,
        duration_months: u64,
        is_renewing: bool,
        autopay_enabled: bool,
        utilities_paid_by_tenant: bool,
        mediator: Option<address>,
        ctx: &mut TxContext
    ): LeaseAgreement {
        let lease_id = object::new(ctx);
        let lease_id_copy = object::uid_to_inner(&lease_id);

        // Calculate end timestamp (approximate: 30 days per month)
        let end_timestamp = start_timestamp + (duration_months * 30 * SECONDS_PER_DAY);

        let lease = LeaseAgreement {
            id: lease_id,
            landlord,
            tenant,
            property_location: string::utf8(property_location),
            monthly_rent,
            start_timestamp,
            end_timestamp,
            is_renewing,
            autopay_enabled,
            utilities_paid_by_tenant,
            late_fee_enabled: true,
            mediator_address: mediator,
            is_active: true,
            total_payments_made: 0,
            escrow_balance: balance::zero(),
        };

        event::emit(LeaseCreatedEvent {
            lease_id: lease_id_copy,
            landlord,
            tenant,
            monthly_rent,
            start_timestamp,
            end_timestamp,
        });

        lease
    }

    /// Create payment schedule for the lease
    public fun create_payment_schedule(
        lease: &LeaseAgreement,
        payment_number: u64,
        due_timestamp: u64,
        ctx: &mut TxContext
    ): PaymentSchedule {
        PaymentSchedule {
            id: object::new(ctx),
            lease_id: object::id(lease),
            payment_number,
            due_timestamp,
            amount: lease.monthly_rent,
            is_paid: false,
            paid_timestamp: option::none(),
            late_fee_applied: 0,
        }
    }

    /// Make a rent payment
    public fun make_payment(
        lease: &mut LeaseAgreement,
        schedule: &mut PaymentSchedule,
        payment: Coin<SUI>,
        current_timestamp: u64,
        ctx: &mut TxContext
    ): PaymentReceipt {
        // Verify payment is from tenant
        assert!(tx_context::sender(ctx) == lease.tenant, E_NOT_AUTHORIZED);

        // Verify payment not already made
        assert!(!schedule.is_paid, E_ALREADY_PAID);

        // Verify lease is active
        assert!(lease.is_active, E_LEASE_EXPIRED);

        // Calculate late fee if payment is overdue
        let late_fee = calculate_late_fee(
            schedule.amount,
            schedule.due_timestamp,
            current_timestamp
        );

        let total_due = schedule.amount + late_fee;
        let payment_amount = coin::value(&payment);

        assert!(payment_amount >= total_due, E_INVALID_AMOUNT);

        // Add payment to escrow
        let payment_balance = coin::into_balance(payment);
        balance::join(&mut lease.escrow_balance, payment_balance);

        // Update schedule
        schedule.is_paid = true;
        schedule.paid_timestamp = option::some(current_timestamp);
        schedule.late_fee_applied = late_fee;

        // Update lease
        lease.total_payments_made = lease.total_payments_made + 1;

        // Emit events
        if (late_fee > 0) {
            let days_late = (current_timestamp - schedule.due_timestamp) / SECONDS_PER_DAY;
            event::emit(LateFeeAppliedEvent {
                lease_id: object::id(lease),
                payment_schedule_id: object::id(schedule),
                late_fee,
                days_late,
            });
        };

        event::emit(PaymentMadeEvent {
            lease_id: object::id(lease),
            payment_schedule_id: object::id(schedule),
            tenant: lease.tenant,
            amount: schedule.amount,
            late_fee,
            timestamp: current_timestamp,
        });

        // Create receipt
        PaymentReceipt {
            id: object::new(ctx),
            lease_id: object::id(lease),
            payment_schedule_id: object::id(schedule),
            payer: tx_context::sender(ctx),
            amount_paid: schedule.amount,
            late_fee,
            payment_timestamp: current_timestamp,
        }
    }

    /// Process autopay (called by backend service)
    public fun process_autopay(
        lease: &mut LeaseAgreement,
        schedule: &mut PaymentSchedule,
        payment: Coin<SUI>,
        current_timestamp: u64,
        ctx: &mut TxContext
    ): PaymentReceipt {
        // Verify autopay is enabled
        assert!(lease.autopay_enabled, E_NOT_AUTHORIZED);

        // Process as regular payment
        make_payment(lease, schedule, payment, current_timestamp, ctx)
    }

    /// Landlord withdraws funds from escrow
    public fun withdraw_rent(
        lease: &mut LeaseAgreement,
        amount: u64,
        ctx: &mut TxContext
    ): Coin<SUI> {
        assert!(tx_context::sender(ctx) == lease.landlord, E_NOT_AUTHORIZED);
        assert!(balance::value(&lease.escrow_balance) >= amount, E_INVALID_AMOUNT);

        let withdrawn = balance::split(&mut lease.escrow_balance, amount);
        coin::from_balance(withdrawn, ctx)
    }

    /// Toggle autopay setting
    public fun toggle_autopay(
        lease: &mut LeaseAgreement,
        current_timestamp: u64,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == lease.tenant, E_NOT_AUTHORIZED);

        lease.autopay_enabled = !lease.autopay_enabled;

        event::emit(AutopayToggleEvent {
            lease_id: object::id(lease),
            enabled: lease.autopay_enabled,
            timestamp: current_timestamp,
        });
    }

    /// Request cancellation (requires mediator if payments exist)
    public fun request_cancellation(
        lease: &mut LeaseAgreement,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == lease.tenant || sender == lease.landlord, E_NOT_AUTHORIZED);

        // If payments have been made, mediator is required
        if (lease.total_payments_made > 0) {
            assert!(option::is_some(&lease.mediator_address), E_MEDIATOR_REQUIRED);
        };

        event::emit(CancellationRequestEvent {
            lease_id: object::id(lease),
            requester: sender,
            timestamp: tx_context::epoch_timestamp_ms(ctx) / 1000,
        });
    }

    /// Mediator approves cancellation
    public fun approve_cancellation(
        lease: &mut LeaseAgreement,
        reason: vector<u8>,
        ctx: &mut TxContext
    ): MediatorApproval {
        let sender = tx_context::sender(ctx);

        // Verify sender is the assigned mediator
        assert!(option::is_some(&lease.mediator_address), E_MEDIATOR_REQUIRED);
        assert!(sender == *option::borrow(&lease.mediator_address), E_NOT_AUTHORIZED);

        lease.is_active = false;

        MediatorApproval {
            id: object::new(ctx),
            lease_id: object::id(lease),
            mediator: sender,
            approved: true,
            reason: string::utf8(reason),
            timestamp: tx_context::epoch_timestamp_ms(ctx) / 1000,
        }
    }

    // ==================== Helper Functions ====================

    /// Calculate late fee based on days overdue
    fun calculate_late_fee(
        base_amount: u64,
        due_timestamp: u64,
        current_timestamp: u64
    ): u64 {
        if (current_timestamp <= due_timestamp) {
            return 0
        };

        let seconds_late = current_timestamp - due_timestamp;
        let days_late = seconds_late / SECONDS_PER_DAY;

        // Calculate 5% per day compounded
        let late_fee = (base_amount * LATE_FEE_RATE * days_late) / PERCENTAGE_PRECISION;

        late_fee
    }

    // ==================== View Functions ====================

    public fun get_lease_details(lease: &LeaseAgreement): (
        address, // landlord
        address, // tenant
        u64,     // monthly_rent
        u64,     // start_timestamp
        u64,     // end_timestamp
        bool,    // is_active
        bool,    // autopay_enabled
        u64      // total_payments_made
    ) {
        (
            lease.landlord,
            lease.tenant,
            lease.monthly_rent,
            lease.start_timestamp,
            lease.end_timestamp,
            lease.is_active,
            lease.autopay_enabled,
            lease.total_payments_made
        )
    }

    public fun get_payment_details(schedule: &PaymentSchedule): (
        u64,  // payment_number
        u64,  // due_timestamp
        u64,  // amount
        bool, // is_paid
        u64   // late_fee_applied
    ) {
        (
            schedule.payment_number,
            schedule.due_timestamp,
            schedule.amount,
            schedule.is_paid,
            schedule.late_fee_applied
        )
    }

    public fun get_escrow_balance(lease: &LeaseAgreement): u64 {
        balance::value(&lease.escrow_balance)
    }

    public fun is_payment_overdue(schedule: &PaymentSchedule, current_timestamp: u64): bool {
        !schedule.is_paid && current_timestamp > schedule.due_timestamp
    }
}
