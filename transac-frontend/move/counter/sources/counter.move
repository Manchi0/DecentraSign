module counter::payments {
    use 0x2::coin;
    use 0x2::sui::SUI;
    use 0x2::event;
    use 0x2::object::{UID};
    use 0x2::clock::{Clock};

    // Events
    public struct PaymentRequestCreated has copy, drop {
        request_id: u64,
        requester: address,
        recipient: address,
        amount: u64,
        description: vector<u8>,
        due_date: u64,
    }

    public struct PaymentRequestAccepted has copy, drop {
        request_id: u64,
        payer: address,
        requester: address,
        amount: u64,
    }

    public struct PaymentSent has copy, drop {
        from: address,
        to: address,
        amount: u64,
    }

    // Payment Request struct
    public struct PaymentRequest has key, store {
        id: UID,
        requester: address,
        recipient: address,
        amount: u64,
        description: vector<u8>,
        due_date: u64,
        is_paid: bool,
        created_at: u64,
    }

    // Global state to track requests
    public struct PaymentRequestManager has key {
        id: UID,
        next_request_id: u64,
    }

    // Initialize the payment request manager
    fun init(ctx: &mut TxContext) {
        let manager = PaymentRequestManager {
            id: object::new(ctx),
            next_request_id: 0,
        };
        transfer::share_object(manager);
    }

    // Create a payment request
    public fun create_payment_request(
        manager: &mut PaymentRequestManager,
        recipient: address,
        amount: u64,
        description: vector<u8>,
        due_date: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let request_id = manager.next_request_id;
        manager.next_request_id = request_id + 1;

        let request = PaymentRequest {
            id: object::new(ctx),
            requester: tx_context::sender(ctx),
            recipient,
            amount,
            description,
            due_date,
            is_paid: false,
            created_at: 0x2::clock::timestamp_ms(clock),
        };

        transfer::public_transfer(request, recipient);

        event::emit(PaymentRequestCreated {
            request_id,
            requester: tx_context::sender(ctx),
            recipient,
            amount,
            description,
            due_date,
        });
    }

    // Accept and pay a payment request
    public fun accept_payment_request(
        request: &mut PaymentRequest,
        mut payment_coin: coin::Coin<SUI>,
        ctx: &mut TxContext
    ) {
        assert!(!request.is_paid, 0);
        assert!(request.amount <= coin::value(&payment_coin), 1);

        let requester = request.requester;
        let recipient = request.recipient;
        let amount = request.amount;

        // Mark as paid
        request.is_paid = true;

        // Split the payment
        let payment = coin::split(&mut payment_coin, amount, ctx);
        
        // Transfer payment to recipient
        transfer::public_transfer(payment, recipient);
        
        // Return remaining coin to payer
        transfer::public_transfer(payment_coin, tx_context::sender(ctx));

        event::emit(PaymentRequestAccepted {
            request_id: 0, // We'll handle this differently
            payer: tx_context::sender(ctx),
            requester,
            amount,
        });
    }

    // Simple payment function (keeping the original)
    public fun pay_sui(
        mut coin_in: coin::Coin<SUI>,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let to_send = coin::split(&mut coin_in, amount, ctx);
        transfer::public_transfer(to_send, recipient);
        transfer::public_transfer(coin_in, tx_context::sender(ctx));
        event::emit(PaymentSent { from: tx_context::sender(ctx), to: recipient, amount });
    }
}