<div align="center">
  <h1 align="center">🎰 WinWin Lottery on Movement</h1>
  <a href="https://winwin-lottery.vercel.app/">Website</a> |
  <a href="https://github.com/arjanjohan/move-lottery">Repo</a>
  
![logo](assets/logo.png)
</div>

🎰 WinWin Lottery on Movement is the first and only on-chain lottery with 100% (or more) Return To Player (RTP). The pooled money in the lottery contract is put to work, until the lottery closes and the winner randomly selected. The  lottery pool is earning yield according to pre-defined rules that all parties (players and organizers) have agreed upon. The winning player(s) receive 100% of the total pool, and the creator/organizer gets the yield that was earned. To safeguard the integrity of the lottery, an Eigenlayer AVS is ensuring that the yield is earned in a fair manner and the prize pool is never at risk.

⚙️ Built using Move, Eigenlayer, Movement, React and Typescript.

🧱 I build this project using [Scaffold-ETH 2](https://scaffoldeth.io/), modifying it to work with Move contracts instead of Solidity/EVM. I did this because the Move starter kit repos that I found did not have a pretty and clean frontend. After the hackathon, I want to continue working on this. Having an easy and intuitive scaffolding tool/repo will be a great tool for all Movement developers.

## Diagram

![dashboard 1](assets/diagram.png)

## Screenshots

| Landing page                      | Create and Overview               |
| --------------------------------- | --------------------------------- |
| ![dashboard 1](screenshots/1.png) | ![dashboard 2](screenshots/2.png) |

|  Lottery                          | AVS Dashboard                     |
| --------------------------------- | --------------------------------- |
| ![dashboard 3](screenshots/3.png) | ![dashboard 4](screenshots/4.png) |

## Contracts


### [lottery.move](https://github.com/arjanjohan/movement-lottery/blob/c7197d795937307828d028e42ca620f033aa72be/packages/move/lottery/sources/lottery.move)

The Lottery contract is the core of our dApp. After each ticket sale, the proceeds are send to a yield earning protocol, where the money earns interest for the organizer. When the lottery closes, the money is withdrawn from the yield earning protocol. Then,one player is chosen randomly and he receives 100% of the original prize pool. Any profits made on the yield earning protocol are for the organizer.

#### create_lottery
Creates a new lottery in exchange for a small fee. Takes in a u64 value between 100 and 200, which is the RTP (Return To Player) percentage. 

#### place_bet
Swap MOVE tokens for lottery tickets at a 1:1 rate. It takes the amount and lottery_id as inputs. The amount paid for the ticket is automatically transferred to the yield contract.

#### draw_winner
Closes the lottery and randomly determines the winner. Takes a lottery_id as input. After selecting the winner, the lottery pool money is withdrawn from the yield contract and transferred to the player.

### [yield.move](https://github.com/arjanjohan/movement-lottery/blob/c7197d795937307828d028e42ca620f033aa72be/packages/move/yield/sources/yield.move)

The Yield contract serves as an example for the happy flow scenario. It's a very simple (and lucrative) yield generating contract, where each deposit earns 10% upon withdrawal. After deploying the contract, it needs to be funded by the deployer so it can pay the yield. Obviously it's only for testing purposes, to showcase how the lottery works.

#### deposit
Lets any user deposit tokens into the contract. The address and amount is recorded in the contract.

#### withdraw
Withdraws all tokens for this user. The total amount is the sum of all deposits and the yield that was generated between the deposit and withdrawal. For testing purposes the yield is fixed at 10% upon withdrawal.

### [LotteryServiceManager.sol](https://github.com/arjanjohan/avs-lottery/blob/afc48c3bf907eed73ddec030c60fd3285792d44a/packages/foundry/contracts/LotteryServiceManager.sol)

This is the AVS contract for the WinWin Lottery. It is used to verify if the lottery contract/owner is using the pool money to earn yield according to the rules set when creating the contract. It verifies the used yield protocol (MOVE address) against a list of approved yield protocols.

#### createNewTask
Creates a new task on the contract which contains all lottery information, including an array of approved yield protocols (MOVE addresses). Emits a NewTaskCreated event.

#### respondToTask
Callable by operators registered to this AVS. Takes in a task and a signature containing the address of the yield protocol used by the lottery. The smart contract verifies if the address of the yield protocol exists in the array of approved yield protocol addresses.

### [operator/index.ts](https://github.com/arjanjohan/avs-lottery/blob/afc48c3bf907eed73ddec030c60fd3285792d44a/operator/index.ts)

This is a script for the AVS operator. The script watches for new tasks submitted to the AVS. It uses the lotteryId specified in the task to query the Movement M1 blockchain, to see which yield protocol (address) was used by the specified lottery. The operator responds to the task, providing the address of the used yield protocol, after checking if this address exists in the array of allowed yield protocols.

## Next steps

#### Lottery
- Include Aptos randomness module (code is there, but not working on Movement M1 devnet)
- Display recent ticket sales (cannot read events, no indexer on Movement M1 devnet)
- Automate the closing of the lottery
  - Based on time, amount or randomness? Have this as option for creator/owner

#### Scaffold-Move
 During the hackathon I used Scaffold-ETH 2 as the base for the frontend, replacing all EVM components by Move equivalents. After the hackathon I want to continue building a scaffold-eth like repo for Move, to use with Movement Labs.
- Create deploy script that copies the account address to nextJS after deployment
- Create a Debug page
  - Display all deployed Move contracts
  - Interact with all read and write functions
- Add faucet button
- Add block explorer for local networks

## Links

#### Presentation
- [Presentation slides](https://docs.google.com/presentation/d/1OYDtBUJdDUf8DOLzdxWaw5Tu8mV8_wMIrQSRr73XafI/edit?usp=sharing)
- [Presentation video](https://www.loom.com/share/ba038643f748406c96bf1960cfc14f4e?sid=d0902396-0f2d-48b2-8d83-7519b565a6cb)

#### Vercel
- [Lottery dApp](https://winwin-lottery.vercel.app/)
- [AVS dashboard](https://winwin-avs.vercel.app/)

#### Github repos
- [Github: Lottery dApp and Move contracts](https://github.com/arjanjohan/move-lottery)
- [Github: Lottery AVS](https://github.com/arjanjohan/avs-lottery)

#### Contracts

- [Deployed Lottery contract on Movement Testnet](https://explorer.movementnetwork.xyz/account/0xa07117682b5fffc9046832f396fd4289f0a38b6925abc63148856b35c80604a8/modules/code/lottery?network=testnet)
- [Deployed Yield contract on Movement Testnet](https://explorer.movementnetwork.xyz/account/0x483efcc3335f5eaf91af6b752443b074589dde04df8595937aa161ea9daf7d86/modules/code/yield?network=testnet)
- [Deployed Lottery AVS on Ethereum Holesky](https://holesky.etherscan.io/address/0x1081ded255574EC1dF6948DfEc3442c54B1De19A)

## Team

- [arjanjohan](https://x.com/arjanjohan/)
