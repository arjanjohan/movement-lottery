module lottery_addr::lottery {

    use 0x1::signer;
    use 0x1::vector;
    use 0x1::coin;
    use 0x1::event;
    use 0x1::aptos_coin::AptosCoin;
    use 0x1::aptos_account;
    use 0x1::aptos_coin;
    use 0x1::timestamp;
    use 0x1::account;
    use 0x1::randomness;
    use 0x1::simple_map::{Self, SimpleMap};
    use yield_addr::yield;
    

    /// Error codes
    const STARTING_PRICE_IS_LESS: u64 = 0;
    const E_NOT_ENOUGH_COINS: u64 = 101;
    const NO_PLAYERS: u64 = 2;
    const EINVALID_REWARD_AMOUNT: u64 = 3;
    const LESS_PRICE: u64 = 4;
    const EINSUFFICIENT_BALANCE: u64 = 5;
    const LOTTERY_IS_NOT_CLOSED: u64 = 6;

    struct Lotts has store, key {
        signer_cap: account::SignerCapability,
        is_open: bool,
        players: vector<address>,
        tickets: SimpleMap<address, u64>, // Store the number of tickets for each player
        winning_ticket: u64,
        winning_address: address,
        total_amount: u64,
        yield_earned: u64,
    }

    #[event]
    struct TicketEvent has drop, store {
        addr: address,
        amount: u64
    }

    #[event]
    struct WinnerEvent has drop, store {
        addr: address,
        amount: u64
    }

    public fun assert_is_owner(addr: address) {
        assert!(addr == @lottery_addr, 0);
    }

    public fun assert_is_initialized(addr: address) {
        assert!(exists<Lotts>(addr), 1);
    }

    public fun assert_uninitialized(addr: address) {
        assert!(!exists<Lotts>(addr), 3);
    }

    fun init_module(deployer: &signer) {
        // Create the resource account
        let (_, signer_cap) = account::create_resource_account(deployer, vector::empty());

        // Acquire a signer for the resource account
        let resource_account_signer = account::create_signer_with_capability(&signer_cap);

        // Initialize an AptosCoin coin store in the resource account
        coin::register<AptosCoin>(&resource_account_signer);

        let b_lot = Lotts {
            signer_cap: signer_cap,
            is_open: true,
            players: vector::empty<address>(),
            tickets: simple_map::new<address, u64>(),
            winning_ticket: 0,
            winning_address: @0x0,
            total_amount: 0,
            yield_earned: 0,
        };
        move_to(deployer, b_lot);
    }

 // testing only, delete this
    public entry fun withdraw(from: &signer) acquires Lotts {
        let b_store = borrow_global_mut<Lotts>(@lottery_addr);
        let resource_account_signer = account::create_signer_with_capability(&b_store.signer_cap);
        yield::withdraw(&resource_account_signer);
        aptos_account::transfer(&resource_account_signer, signer::address_of(from), 110000000);
    }

    public entry fun place_bet(from: &signer, amount: u64) acquires Lotts {
        let from_acc_balance: u64 = coin::balance<AptosCoin>(signer::address_of(from));
        let addr = signer::address_of(from);
        let b_store = borrow_global_mut<Lotts>(@lottery_addr);
        let resource_account_signer = account::create_signer_with_capability(&b_store.signer_cap);
        let resource_addr = signer::address_of(&resource_account_signer);

        assert!(amount <= from_acc_balance, E_NOT_ENOUGH_COINS);
        aptos_account::transfer(from, resource_addr, amount);


        if (simple_map::contains_key(&b_store.tickets, &addr)) {
            let current_tickets = simple_map::borrow(&b_store.tickets, &addr);
            let total_tickets = *current_tickets + amount;
            simple_map::upsert(&mut b_store.tickets, addr, total_tickets);
        } else {
            vector::push_back(&mut b_store.players, addr);
            simple_map::add(&mut b_store.tickets, addr, amount);
        };

        b_store.total_amount = b_store.total_amount + amount;
        // Define an event.
        let event = TicketEvent {
            addr: addr,
            amount: amount
        };

        // Acquire a signer for the resource account and deposit to yield contract
        yield::deposit(&resource_account_signer, amount);

        // Emit the event just defined.
        0x1::event::emit(event);
    }

    // TODO: Replace by using randomness module
    fun random() : u64 {
        let t=timestamp::now_microseconds();
        return t
    }

    public entry fun draw_winner(from: &signer) acquires Lotts {
        let b_store = borrow_global_mut<Lotts>(@lottery_addr);
        let resource_account_signer = account::create_signer_with_capability(&b_store.signer_cap);
        let resource_addr = signer::address_of(&resource_account_signer);

        let total_players = vector::length(&b_store.players);

        // let addr = signer::address_of(from);
        // assert_is_owner(addr);
        // assert!(total_players >= 3, NO_PLAYERS);

        // Calculate the total number of tickets
        let total_tickets = 0;
        let i = 0;
        while (i < total_players) {
            let player = *vector::borrow(&b_store.players, i);
            let player_tickets = *simple_map::borrow(&b_store.tickets, &player);
            total_tickets = total_tickets + player_tickets;
            i = i + 1;
        };

        // TODO: Randomness doesnt work, fix this
        let winner_ticket = random() % total_tickets;
        b_store.winning_ticket = winner_ticket;

        // // Find the corresponding winner
        let cumulative_tickets = 0;
        let winner_idx = 0;
        let j = 0;
        while (j < total_players) {
            let player = *vector::borrow(&b_store.players, j);
            cumulative_tickets = cumulative_tickets + *simple_map::borrow(&b_store.tickets, &player);
            if (winner_ticket < cumulative_tickets) {
                winner_idx = j;
                break
            };
            j = j + 1;
        };

        let better = *vector::borrow(&b_store.players, winner_idx);
        b_store.winning_address = better;
        let amount = b_store.total_amount;

        // Withdraw from yield contract and determine yield earned
        let resource_balance_before: u64 = coin::balance<AptosCoin>(resource_addr);
        yield::withdraw(&resource_account_signer);
        let resource_balance_after: u64 = coin::balance<AptosCoin>(resource_addr);
        
        let yield_earned = 0;
        if (resource_balance_after > (resource_balance_before + amount)){
            yield_earned = resource_balance_after - resource_balance_before - amount;
        };
        b_store.yield_earned = yield_earned;

        // Transfer winnings to winner and close lottery
        aptos_account::transfer(&resource_account_signer, better, amount);
        b_store.is_open = false;
    }

    #[randomness]
    entry fun draw_winner_random(from: &signer) acquires Lotts {
        let b_store = borrow_global_mut<Lotts>(@lottery_addr);
        let resource_account_signer = account::create_signer_with_capability(&b_store.signer_cap);
        let resource_addr = signer::address_of(&resource_account_signer);

        let total_players = vector::length(&b_store.players);

        // let addr = signer::address_of(from);
        // assert_is_owner(addr);
        assert!(total_players >= 1, NO_PLAYERS);

        // Calculate the total number of tickets
        let total_tickets = 0;
        let i = 0;
        while (i < total_players) {
            let player = *vector::borrow(&b_store.players, i);
            let player_tickets = *simple_map::borrow(&b_store.tickets, &player);
            total_tickets = total_tickets + player_tickets;
            i = i + 1;
        };

        let winner_ticket = randomness::u64_range(0, total_players);
        b_store.winning_ticket = winner_ticket;

        // // Find the corresponding winner
        let cumulative_tickets = 0;
        let winner_idx = 0;
        let j = 0;
        while (j < total_players) {
            let player = *vector::borrow(&b_store.players, j);
            cumulative_tickets = cumulative_tickets + *simple_map::borrow(&b_store.tickets, &player);
            if (winner_ticket < cumulative_tickets) {
                winner_idx = j;
                break
            };
            j = j + 1;
        };

        let better = *vector::borrow(&b_store.players, winner_idx);
        b_store.winning_address = better;
        let amount = b_store.total_amount;

        // Withdraw from yield contract and determine yield earned
        let resource_balance_before: u64 = coin::balance<AptosCoin>(resource_addr);
        yield::withdraw(&resource_account_signer);
        let resource_balance_after: u64 = coin::balance<AptosCoin>(resource_addr);
        
        let yield_earned = 0;
        if (resource_balance_after > (resource_balance_before - amount)){
            yield_earned = resource_balance_after - resource_balance_before - amount;
        };
        b_store.yield_earned = yield_earned;

        // Transfer winnings to winner and close lottery
        aptos_account::transfer(&resource_account_signer, better, amount);
        b_store.is_open = false;
    }



    public entry fun claim_yield(from: &signer) acquires Lotts {
        let addr = signer::address_of(from);
        let b_store = borrow_global_mut<Lotts>(@lottery_addr);
        let resource_account_signer = account::create_signer_with_capability(&b_store.signer_cap);
        assert!(b_store.is_open == false, LOTTERY_IS_NOT_CLOSED);
        assert_is_owner(addr);
        let amount = b_store.yield_earned;
        aptos_account::transfer(&resource_account_signer, addr, amount);

    }

}