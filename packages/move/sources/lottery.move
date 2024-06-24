module lottery_addr::Lottery {

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
        players: vector<address>,
        tickets: SimpleMap<address, u64>, // Store the number of tickets for each player
        winner: address,
        totalamount: u64,
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

    public fun initialize(acc: &signer) {
        let addr = signer::address_of(acc);

        assert_is_owner(addr);
        assert_uninitialized(addr);

        let b_lot = Lotts {
            totalamount: 0,
            players: vector::empty<address>(),
            tickets: simple_map::new<address, u64>(),
            winner: @0x0,
        };
        move_to(acc, b_lot);
    }

    public entry fun place_bet(from: &signer, to_address: address, amount: u64) acquires Lotts {
        let from_acc_balance: u64 = coin::balance<AptosCoin>(signer::address_of(from));
        let addr = signer::address_of(from);

        assert!(amount <= from_acc_balance, E_NOT_ENOUGH_COINS);
        aptos_account::transfer(from, to_address, amount);

        let b_store = borrow_global_mut<Lotts>(to_address);

        if (simple_map::contains_key(&b_store.tickets, &addr)) {
            let current_tickets = simple_map::borrow(&b_store.tickets, &addr);
            let total_tickets = *current_tickets + amount;
            simple_map::add(&mut b_store.tickets, addr, total_tickets);
        } else {
            vector::push_back(&mut b_store.players, addr);
            simple_map::add(&mut b_store.tickets, addr, amount);
        };

        b_store.totalamount = b_store.totalamount + amount;
    }

    public fun get_balance(acc: &signer): u64 acquires Lotts {
        let addr = signer::address_of(acc);
        let b_store = borrow_global_mut<Lotts>(addr);

        assert_is_owner(addr);
        return b_store.totalamount
    }

    public fun get_number_of_players(store_addr: address): u64 acquires Lotts {
        let b_store = borrow_global<Lotts>(store_addr);
        let total_players = vector::length(&b_store.players);
        return total_players
    }

    public fun get_number_of_tickets(user: address, store_addr: address): u64 acquires Lotts {
        let b_store = borrow_global<Lotts>(store_addr);
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
        let amount = b_store.totalamount;

        aptos_account::transfer(acc, better, amount);
        b_store.totalamount = 0;
    }
}