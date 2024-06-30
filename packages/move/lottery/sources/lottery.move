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
    use std::bcs;
    use yield_addr::yield;

    /// Error codes
    const USER_IS_NOT_CREATOR: u64 = 0;
    const NOT_ENOUGH_COINS: u64 = 1;
    const NO_PLAYERS: u64 = 2;
    const LOTTERY_IS_NOT_CLOSED: u64 = 3;
    const LOTTERY_IS_CLOSED: u64 = 4;
    const YIELD_IS_ALREADY_CLAIMED: u64 = 5;

    struct Lottery has store, key {
        signer_cap: account::SignerCapability,
        creator_address: address,
        is_open: bool,
        players: vector<address>,
        tickets: SimpleMap<address, u64>, // Store the number of tickets for each player
        winning_ticket: u64,
        winning_address: address,
        total_amount: u64,
        rtp_percentage: u64,
        yield_earned: u64,
        yield_claimed: bool,
        yield_contract: address,
    }

    struct LotteriesManager has store, key {
        signer_cap: account::SignerCapability,
        lotteries: SimpleMap<u64, Lottery>,
        next_lottery_id: u64,
        create_fee: u64,
    }

    #[event]
    struct TicketEvent has drop, store {
        addr: address,
        amount: u64,
        lottery_id: u64,
    }

    #[event]
    struct WinnerEvent has drop, store {
        addr: address,
        amount: u64,
        lottery_id: u64,
    }

    fun init_module(deployer: &signer) {
        // Create the resource account
        let (_, signer_cap) = account::create_resource_account(deployer, vector::empty());

        // Acquire a signer for the resource account
        let resource_account_signer = account::create_signer_with_capability(&signer_cap);

        // Initialize an AptosCoin coin store in the resource account
        coin::register<AptosCoin>(&resource_account_signer);

        let manager = LotteriesManager {
            signer_cap: signer_cap,
            lotteries: simple_map::new<u64, Lottery>(),
            next_lottery_id: 1,
            create_fee: 20000000 // 0.2 MOVE create fee
        };
        move_to(deployer, manager);
    }

    public entry fun create_lottery(from: &signer, rtp_percentage: u64) acquires LotteriesManager {
        let manager = borrow_global_mut<LotteriesManager>(@lottery_addr);
        let manager_resource_account_signer = account::create_signer_with_capability(&manager.signer_cap);

        let manager_resource_addr = signer::address_of(&manager_resource_account_signer);
        aptos_account::transfer(from, manager_resource_addr, manager.create_fee);

        // Create a new resource account for the lottery
        let seed = bcs::to_bytes(&manager.next_lottery_id);
        let (_, signer_cap) = account::create_resource_account(&manager_resource_account_signer, seed);
        let resource_account_signer = account::create_signer_with_capability(&signer_cap);

        // Initialize an AptosCoin coin store in the resource account
        coin::register<AptosCoin>(&resource_account_signer);

        let lottery = Lottery {
            signer_cap: signer_cap,
            creator_address: signer::address_of(from),
            is_open: true,
            players: vector::empty<address>(),
            tickets: simple_map::new<address, u64>(),
            winning_ticket: 0,
            winning_address: @0x0,
            total_amount: 0,
            rtp_percentage: rtp_percentage,
            yield_earned: 0,
            yield_claimed: false,
            yield_contract: @yield_addr,
        };

        let lottery_id = manager.next_lottery_id;
        simple_map::add(&mut manager.lotteries, lottery_id, lottery);
        manager.next_lottery_id = lottery_id + 1;
    }

    public entry fun place_bet(from: &signer, lottery_id: u64, amount: u64) acquires LotteriesManager {
        let from_acc_balance: u64 = coin::balance<AptosCoin>(signer::address_of(from));
        let addr = signer::address_of(from);
        let manager = borrow_global_mut<LotteriesManager>(@lottery_addr);
        let lottery = simple_map::borrow_mut(&mut manager.lotteries, &lottery_id);
        let resource_account_signer = account::create_signer_with_capability(&lottery.signer_cap);
        let resource_addr = signer::address_of(&resource_account_signer);

        assert!(amount <= from_acc_balance, NOT_ENOUGH_COINS);
        assert!(lottery.is_open, LOTTERY_IS_CLOSED);

        aptos_account::transfer(from, resource_addr, amount);

        if (simple_map::contains_key(&lottery.tickets, &addr)) {
            let current_tickets = simple_map::borrow(&lottery.tickets, &addr);
            let total_tickets = *current_tickets + amount;
            simple_map::upsert(&mut lottery.tickets, addr, total_tickets);
        } else {
            vector::push_back(&mut lottery.players, addr);
            simple_map::add(&mut lottery.tickets, addr, amount);
        };

        lottery.total_amount = lottery.total_amount + amount;

        // Define an event.
        let event = TicketEvent {
            addr: addr,
            amount: amount,
            lottery_id: lottery_id,
        };

        // Deposit funds to yield contract
        yield::deposit(&resource_account_signer, amount);

        // Emit the event just defined.
        0x1::event::emit(event);
    }

    // TODO: Replace by using randomness module
    fun random() : u64 {
        let t=timestamp::now_microseconds();
        return t
    }

    public entry fun draw_winner(from: &signer, lottery_id: u64) acquires LotteriesManager {
        let manager = borrow_global_mut<LotteriesManager>(@lottery_addr);
        let lottery = simple_map::borrow_mut(&mut manager.lotteries, &lottery_id);
        assert!(lottery.is_open, LOTTERY_IS_CLOSED);

        let resource_account_signer = account::create_signer_with_capability(&lottery.signer_cap);
        let resource_addr = signer::address_of(&resource_account_signer);

        let total_players = vector::length(&lottery.players);

        assert!(total_players >= 1, NO_PLAYERS);

        // Calculate the total number of tickets
        let total_tickets = 0;
        let i = 0;
        while (i < total_players) {
            let player = *vector::borrow(&lottery.players, i);
            let player_tickets = *simple_map::borrow(&lottery.tickets, &player);
            total_tickets = total_tickets + player_tickets;
            i = i + 1;
        };

        // TODO: Randomness doesnt work, fix this
        let winner_ticket = random() % total_tickets;
        lottery.winning_ticket = winner_ticket;

        // Find the corresponding winner
        let cumulative_tickets = 0;
        let winner_idx = 0;
        let j = 0;
        while (j < total_players) {
            let player = *vector::borrow(&lottery.players, j);
            cumulative_tickets = cumulative_tickets + *simple_map::borrow(&lottery.tickets, &player);
            if (winner_ticket < cumulative_tickets) {
                winner_idx = j;
                break
            };
            j = j + 1;
        };

        let better = *vector::borrow(&lottery.players, winner_idx);
        lottery.winning_address = better;
        // let amount = lottery.total_amount * (lottery.rtp_percentage) / 100; // this requires extra checks
        let amount = lottery.total_amount;

        // Withdraw from yield contract and determine yield earned
        let resource_balance_before: u64 = coin::balance<AptosCoin>(resource_addr);
        yield::withdraw(&resource_account_signer);
        let resource_balance_after: u64 = coin::balance<AptosCoin>(resource_addr);

        let yield_earned = 0;
        if (resource_balance_after > (resource_balance_before + amount)){
            yield_earned = resource_balance_after - resource_balance_before - amount;
        };
        lottery.yield_earned = yield_earned;

        // Transfer winnings to winner and close lottery
        aptos_account::transfer(&resource_account_signer, better, amount);
        lottery.is_open = false;

        // Emit the winner event
        let event = WinnerEvent {
            addr: better,
            amount: amount,
            lottery_id: lottery_id,
        };
        0x1::event::emit(event);
    }

    #[randomness]
    entry fun draw_winner_random(from: &signer, lottery_id: u64) acquires LotteriesManager {
        let manager = borrow_global_mut<LotteriesManager>(@lottery_addr);
        let lottery = simple_map::borrow_mut(&mut manager.lotteries, &lottery_id);
        let resource_account_signer = account::create_signer_with_capability(&lottery.signer_cap);
        let resource_addr = signer::address_of(&resource_account_signer);

        let total_players = vector::length(&lottery.players);

        assert!(total_players >= 1, NO_PLAYERS);

        // Calculate the total number of tickets
        let total_tickets = 0;
        let i = 0;
        while (i < total_players) {
            let player = *vector::borrow(&lottery.players, i);
            let player_tickets = *simple_map::borrow(&lottery.tickets, &player);
            total_tickets = total_tickets + player_tickets;
            i = i + 1;
        };

        let winner_ticket = randomness::u64_range(0, total_tickets);
        lottery.winning_ticket = winner_ticket;

        // Find the corresponding winner
        let cumulative_tickets = 0;
        let winner_idx = 0;
        let j = 0;
        while (j < total_players) {
            let player = *vector::borrow(&lottery.players, j);
            cumulative_tickets = cumulative_tickets + *simple_map::borrow(&lottery.tickets, &player);
            if (winner_ticket < cumulative_tickets) {
                winner_idx = j;
                break
            };
            j = j + 1;
        };

        let better = *vector::borrow(&lottery.players, winner_idx);
        lottery.winning_address = better;
        let amount = lottery.total_amount;

        // Withdraw from yield contract and determine yield earned
        let resource_balance_before: u64 = coin::balance<AptosCoin>(resource_addr);
        yield::withdraw(&resource_account_signer);
        let resource_balance_after: u64 = coin::balance<AptosCoin>(resource_addr);
        
        let yield_earned = 0;
        if (resource_balance_after > (resource_balance_before + amount)){
            yield_earned = resource_balance_after - resource_balance_before - amount;
        };
        lottery.yield_earned = yield_earned;

        // Transfer winnings to winner and close lottery
        aptos_account::transfer(&resource_account_signer, better, amount);
        lottery.is_open = false;

        // Emit the winner event
        let event = WinnerEvent {
            addr: better,
            amount: amount,
            lottery_id: lottery_id,
        };
        0x1::event::emit(event);
    }

    public entry fun claim_yield(from: &signer, lottery_id: u64) acquires LotteriesManager {
        let addr = signer::address_of(from);
        let manager = borrow_global_mut<LotteriesManager>(@lottery_addr);
        let lottery = simple_map::borrow_mut(&mut manager.lotteries, &lottery_id);
        let resource_account_signer = account::create_signer_with_capability(&lottery.signer_cap);

        assert!(lottery.is_open == false, LOTTERY_IS_NOT_CLOSED);
        assert!(lottery.yield_claimed == false, YIELD_IS_ALREADY_CLAIMED);
        assert!(addr == lottery.creator_address, USER_IS_NOT_CREATOR);
        let amount = lottery.yield_earned;
        aptos_account::transfer(&resource_account_signer, addr, amount);
        lottery.yield_claimed = true;
    }
}
