module lottery_addr::lottery {

    use 0x1::signer;
    use 0x1::vector;
    use 0x1::coin;
    use 0x1::aptos_coin::AptosCoin;
    use 0x1::aptos_account;
    use 0x1::aptos_coin;
    use 0x1::timestamp;
    use 0x1::account;
    use 0x1::randomness;
    use 0x1::simple_map::{Self, SimpleMap};

    /// Error codes
    const STARTING_PRICE_IS_LESS: u64 = 0;
    const E_NOT_ENOUGH_COINS: u64 = 101;
    const PLAYERS_LESS_THAN_THREE: u64 = 2;
    const EINVALID_REWARD_AMOUNT: u64 = 3;
    const LESS_PRICE: u64 = 4;
    const EINSUFFICIENT_BALANCE: u64 = 5;

    struct Lotts has store, key {
        is_open: bool,
        players: vector<address>,
        tickets: SimpleMap<address, u64>, // Store the number of tickets for each player
        winner: address,
        total_amount: u64,
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

    /// Initializes the yield module with a resource account.
    fun init_module(deployer: &signer) {
        // Create the resource account
        let (resource_account, signer_cap) = account::create_resource_account(deployer, vector::empty());

        // Acquire a signer for the resource account
        let resource_account_signer = account::create_signer_with_capability(&signer_cap);

        // Initialize an AptosCoin coin store in the resource account
        coin::register<AptosCoin>(&resource_account_signer);

        let b_lot = Lotts {
            is_open: true,
            total_amount: 0,
            players: vector::empty<address>(),
            tickets: simple_map::new<address, u64>(),
            winner: @0x0,
        };
        move_to(deployer, b_lot);
    }

    public entry fun place_bet(from: &signer, amount: u64) acquires Lotts {
        let from_acc_balance: u64 = coin::balance<AptosCoin>(signer::address_of(from));
        let addr = signer::address_of(from);

        assert!(amount <= from_acc_balance, E_NOT_ENOUGH_COINS);
        aptos_account::transfer(from, @lottery_addr, amount);

        let b_store = borrow_global_mut<Lotts>(@lottery_addr);

        if (simple_map::contains_key(&b_store.tickets, &addr)) {
            let current_tickets = simple_map::borrow(&b_store.tickets, &addr);
            let total_tickets = *current_tickets + amount;
            simple_map::upsert(&mut b_store.tickets, addr, total_tickets);
        } else {
            vector::push_back(&mut b_store.players, addr);
            simple_map::add(&mut b_store.tickets, addr, amount);
        };

        b_store.total_amount = b_store.total_amount + amount;
    }


  #[view]
    public fun get_coin_balance(from: &signer): u64 {
        let from_acc_balance: u64 = coin::balance<AptosCoin>(signer::address_of(from));
        return from_acc_balance
    }

  #[view]
    public fun get_total_amount(): u64 acquires Lotts {
        let b_store = borrow_global<Lotts>(@lottery_addr);
        return b_store.total_amount
    }

  #[view]
    public fun get_total_players(): u64 acquires Lotts {
        let b_store = borrow_global<Lotts>(@lottery_addr);
        let total_players = vector::length(&b_store.players);
        return total_players
    }

  #[view]
    public fun get_player_tickets(user: address): u64 acquires Lotts {
        let b_store = borrow_global<Lotts>(@lottery_addr);
        if (simple_map::contains_key(&b_store.tickets, &user)) {
            return *simple_map::borrow(&b_store.tickets, &user)
        } else {
            return 0
        }
    }

    #[randomness]
    entry fun draw_winner(acc: &signer) acquires Lotts {
        let addr = signer::address_of(acc);
        let b_store = borrow_global_mut<Lotts>(addr);
        let total_players = vector::length(&b_store.players);

        assert_is_owner(addr);
        assert!(total_players >= 3, PLAYERS_LESS_THAN_THREE);

        // Calculate the total number of tickets
        let total_tickets = 0;
        let i = 0;
        while (i < total_players) {
            let player = *vector::borrow(&b_store.players, i);
            let player_tickets = *simple_map::borrow(&b_store.tickets, &player);
            total_tickets = total_tickets + player_tickets;
            i = i + 1;
        };

        // // Draw a random ticket
        let winner_ticket = randomness::u64_range(0, total_tickets);

        // // Find the corresponding winner
        let cumulative_tickets = 0;
        let winner_idx = 0; // TODO just give address of winner?

        let j = 0;
        while (j < total_players) {
            let player = *vector::borrow(&b_store.players, j);
            cumulative_tickets = cumulative_tickets + *simple_map::borrow(&b_store.tickets, &player);
            if (winner_ticket < cumulative_tickets) {
                winner_idx = j;
                break;
                j = j + 1;
            }
        };

        let better = *vector::borrow(&b_store.players, winner_idx);
        b_store.winner = better;
        let amount = b_store.total_amount;

        aptos_account::transfer(acc, better, amount);
        b_store.total_amount = 0;
    }
}