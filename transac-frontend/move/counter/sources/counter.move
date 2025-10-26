module counter::payments {
    use 0x2::tx_context::sender;
    use 0x2::coin;
    use 0x2::sui::SUI;
    use 0x2::transfer;
    use 0x2::event;

    public struct PaymentSent has copy, drop {
        from: address,
        to: address,
        amount: u64,
    }

    public fun pay_sui(
        mut coin_in: coin::Coin<SUI>,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let to_send = coin::split(&mut coin_in, amount, ctx);
        transfer::public_transfer(to_send, recipient);
        transfer::public_transfer(coin_in, sender(ctx));
        event::emit(PaymentSent { from: sender(ctx), to: recipient, amount });
    }
}
