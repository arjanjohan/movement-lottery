module yield_addr::YieldGeneratingProtocol {
    use aptos_framework::coin::{Self, Coin, transfer};
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::timestamp;
    use aptos_std::table::{Self, Table};
    use std::signer;
    use std::vector;
    use std::error;

    struct DepositInfo has store, drop {
        amount: u64,
        block_number: u64,
    }

    struct Deposits has key, store, drop {
        owner: address,
        deposits: vector<DepositInfo>,
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
                deposits: vector::empty<DepositInfo>(),
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

        // Get current block number
        let block_number = timestamp::now_seconds();

        // Transfer AptosCoin from sender to the contract's address
        transfer<AptosCoin>(owner, owner_addr, amount);

        // Record the deposit
        let deposit_info = DepositInfo { amount, block_number };
        let deposits_ref = borrow_global_mut<Deposits>(owner_addr);
        vector::push_back(&mut deposits_ref.deposits, deposit_info);
        deposits_ref.total_deposit = deposits_ref.total_deposit + amount;
    }

    /// Allows a user to withdraw their balance along with accrued yield.
    public entry fun withdraw(owner: &signer) acquires Deposits {
        let owner_addr = signer::address_of(owner);

        // Ensure the deposit tracking has been initialized for this user
        assert!(exists<Deposits>(owner_addr), error::not_found(E_NOT_INITIALIZED));

        let deposits_ref = borrow_global_mut<Deposits>(owner_addr);
        let current_block_number = timestamp::now_seconds();
        let total_amount = 0;

        // Calculate the total amount including yield
        let i = 0;
        while (i < vector::length(&deposits_ref.deposits)) {
            let deposit = vector::borrow(&deposits_ref.deposits, i);
            let blocks_elapsed = current_block_number - deposit.block_number;
            let yield_amount = (deposit.amount * blocks_elapsed) / 100;
            total_amount = total_amount + deposit.amount + yield_amount;
            i = i + 1;
        };

        // Ensure there is enough balance to withdraw
        assert!(total_amount > 0, error::invalid_argument(E_NOT_ENOUGH_BALANCE));

        // Clear the deposits
        deposits_ref.deposits = vector::empty<DepositInfo>();
        deposits_ref.total_deposit = 0;

        // Transfer the total amount back to the user
        // TODO: Transfer from the contract's address
        transfer<AptosCoin>(owner, owner_addr, total_amount);
    }

    // #[test_only]
    // use std::string;
    // #[test_only]
    // use aptos_framework::account;
    // #[test_only]
    // use aptos_framework::coin::BurnCapability;
    // #[test_only]
    // use aptos_framework::aptos_account;

    // #[test_only]
    // fun setup(aptos_framework: &signer, user: &signer): BurnCapability<AptosCoin> {
    //     let (burn_cap, _, mint_cap) = coin::initialize<AptosCoin>(
    //         aptos_framework,
    //         string::utf8(b"TC"),
    //         string::utf8(b"TC"),
    //         8,
    //         false,
    //     );
    //     account::create_account_for_test(signer::address_of(user));
    //     coin::register<AptosCoin>(user);
    //     let coins = coin::mint<AptosCoin>(2000, &mint_cap);
    //     coin::deposit(signer::address_of(user), coins);
    //     coin::destroy_mint_cap(mint_cap);
    //     burn_cap
    // }

    // #[test(aptos_framework = @0x1, user = @0x123)]
    // public entry fun test_deposit_and_withdraw(aptos_framework: &signer, user: &signer) {
    //     let burn_cap = setup(aptos_framework, user);

    //     // Initialize the user account
    //     initialize(user);

    //     // Deposit AptosCoin
    //     deposit(user, 1000);

    //     // Fast forward time
    //     timestamp::fast_forward_seconds(10);

    //     // Withdraw the deposited amount with yield
    //     withdraw(user);

    //     assert!(coin::balance<AptosCoin>(signer::address_of(user)) > 1000, 0);

    //     coin::destroy_burn_cap(burn_cap);
    // }
}
