module yield_addr::YieldGeneratingProtocol {
    use aptos_framework::coin::{Self, Coin, transfer};
    use aptos_framework::aptos_coin::AptosCoin;
    use std::signer;
    use std::error;

    struct Deposits has key, store, drop {
        owner: address,
        total_deposit: u64,
    }

    /// Error codes
    const E_NOT_INITIALIZED: u64 = 1;
    const E_NOT_ENOUGH_BALANCE: u64 = 2;

    /// Initialize the deposit tracking for a user.
    public entry fun initialize(owner: &signer) {
        let owner_addr = signer::address_of(owner);
        if (!exists<Deposits>(owner_addr)) {
            let deposits = Deposits {
                owner: owner_addr,
                total_deposit: 0,
            };
            move_to(owner, deposits);
        }
    }

    /// Allows a user to deposit AptosCoin and records the deposit details.
    public entry fun deposit(owner: &signer, amount: u64) acquires Deposits {
        let owner_addr = signer::address_of(owner);

        // Ensure the deposit tracking has been initialized for this user
        assert!(exists<Deposits>(owner_addr), error::not_found(E_NOT_INITIALIZED));

        // Transfer AptosCoin from sender to the contract's address
        // TODO correct this
        transfer<AptosCoin>(owner, owner_addr, amount);

        // Update the total deposit
        let deposits_ref = borrow_global_mut<Deposits>(owner_addr);
        deposits_ref.total_deposit = deposits_ref.total_deposit + amount;
    }

    /// Allows a user to withdraw their balance along with accrued yield.
    public entry fun withdraw(owner: &signer) acquires Deposits {
        let owner_addr = signer::address_of(owner);

        // Ensure the deposit tracking has been initialized for this user
        assert!(exists<Deposits>(owner_addr), error::not_found(E_NOT_INITIALIZED));

        let deposits_ref = borrow_global_mut<Deposits>(owner_addr);
        let total_amount = deposits_ref.total_deposit;

        // Ensure there is enough balance to withdraw
        assert!(total_amount > 0, error::invalid_argument(E_NOT_ENOUGH_BALANCE));

        // Calculate the total amount including yield (10% of total deposit)
        let total_with_yield = total_amount + (total_amount / 10);

        // Reset the total deposit
        deposits_ref.total_deposit = 0;

        // Transfer the total amount back to the user
        // TODO correct this
        transfer<AptosCoin>(owner, owner_addr, total_with_yield);
    }
}
