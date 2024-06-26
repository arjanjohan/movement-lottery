module yield_addr::yield {
    use aptos_framework::coin::{Self, Coin, transfer};
    use aptos_framework::aptos_coin::AptosCoin;
    use std::signer;
    use aptos_framework::account;
    use std::error;
    use 0x1::simple_map::{Self, SimpleMap};
    use std::vector;

    struct Yield has key {
        signer_cap: account::SignerCapability,
        deposits: SimpleMap<address, u64>,
        rate: u64,
    }

    /// Error codes
    const E_NOT_INITIALIZED: u64 = 1;
    const E_NOT_ENOUGH_BALANCE: u64 = 2;

    // / Initializes the yield module with a resource account.
    fun init_module(deployer: &signer) {
        // Create the resource account
        let (resource_account, signer_cap) = account::create_resource_account(deployer, vector::empty());

        // Acquire a signer for the resource account
        let resource_account_signer = account::create_signer_with_capability(&signer_cap);

        // Initialize an AptosCoin coin store in the resource account
        coin::register<AptosCoin>(&resource_account_signer);

        // Initialize the Yield struct with an empty deposits map
        let yield_struct = Yield {
            signer_cap,
            deposits: simple_map::create<address, u64>(),
            rate: 10,
        };

        // Fund the resource account with an initial balance (9 Move)   
        let amount = 900000000;     
        transfer<AptosCoin>(deployer, signer::address_of(&resource_account), amount);


        move_to(deployer, yield_struct);
    }

    /// Allows a user to deposit AptosCoin and records the deposit details.
    public entry fun deposit(owner: &signer, amount: u64) acquires Yield {
        let owner_addr = signer::address_of(owner);
        let yield_struct = borrow_global_mut<Yield>(@yield_addr);
        let resource_signer = account::create_signer_with_capability(&yield_struct.signer_cap);

        // Ensure the deposit tracking has been initialized for this user
        if (!simple_map::contains_key(&yield_struct.deposits, &owner_addr)) {
            simple_map::add(&mut yield_struct.deposits, owner_addr, 0);
        };

        // Transfer AptosCoin from sender to the resource account's address
        transfer<AptosCoin>(owner, signer::address_of(&resource_signer), amount);

        // Update the total deposit
        let current_deposit = simple_map::borrow_mut(&mut yield_struct.deposits, &owner_addr);
        *current_deposit = *current_deposit + amount;
    }

    /// Allows a user to withdraw their balance along with accrued yield.
    public entry fun withdraw(owner: &signer) acquires Yield {
        let owner_addr = signer::address_of(owner);
        let yield_struct = borrow_global_mut<Yield>(@yield_addr);
        let resource_signer = account::create_signer_with_capability(&yield_struct.signer_cap);

        // Ensure the deposit tracking has been initialized for this user
        assert!(simple_map::contains_key(&yield_struct.deposits, &owner_addr), error::not_found(E_NOT_INITIALIZED));

        let current_deposit = simple_map::borrow_mut(&mut yield_struct.deposits, &owner_addr);
        let total_amount = *current_deposit;

        // Ensure there is enough balance to withdraw
        assert!(total_amount > 0, error::invalid_argument(E_NOT_ENOUGH_BALANCE));

        // Calculate the total amount including yield (10% of total deposit)
        let total_with_yield = total_amount * 110 / 100;

        // Reset the total deposit
        *current_deposit = 0;

        // Transfer the total amount back to the user
        transfer<AptosCoin>(&resource_signer, owner_addr, total_with_yield);
    }

    /// Returns the total deposit balance for a given address.
    public fun get_balance(owner: address): u64 acquires Yield {
        let yield = borrow_global_mut<Yield>(@yield_addr);
        if (!simple_map::contains_key(&yield.deposits, &owner)) {
            return 0
        };
        let deposit = simple_map::borrow(&yield.deposits, &owner);
        *deposit
    }

}
