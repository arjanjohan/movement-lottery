<div align="center">
  <h1 align="center">🎰 WinWin Lottery on Movement</h1>
  <a href="https://winwin-lottery.vercel.app/">Website</a> |
  <a href="https://github.com/arjanjohan/move-lottery">Repo</a>
</h4>
  
![logo](assets/logo.png)
</div>

🎰 WinWin Lottery on Movement is the first and only on-chain lottery with 100% (or more) Return To Player (RTP). The pooled money in the lottery contract is put to work, until the lottery closes and the winner randomly selected. The  lottery pool is earning yield according to pre-defined rules that all parties (players and organizers) have agreed upon. The winning player(s) receive 100% of the total pool, and the creator/organizer gets the yield that was earned. To safeguard the integrity of the lottery, an Eigenlayer AVS is ensuring that the yield is earned in a fair manner and the prize pool is never at risk.

⚙️ Built using Move, Eigenlayer, Movement, React and Typescript.

🧱 I build this project using [Scaffold-ETH 2](https://scaffoldeth.io/), modifying it to work with Move contracts instead of Solidity/EVM. I did this because the Move starter kit repos that I found did not have a pretty and clean frontend. After the hackathon, I want to continue working on this. Having an easy and intuitive scaffolding tool/repo will be a great tool for all Movement developers.

<!-- - ✅ **Contract Hot Reload**: The frontend auto-adapts to your smart contract as you edit it.
- 🪝 **[Scaffold hooks](https://docs.scaffoldeth.io/hooks/)**: Collection of React hooks wrapper around [wagmi](https://wagmi.sh/) to simplify interactions with smart contracts with typescript autocompletion.
- 🧱 [**Components**](https://docs.scaffoldeth.io/components/): Collection of common web3 components to quickly build your frontend.
- 🔐 **Integration with Wallet Providers**: Connect to different wallet providers and interact with the AVS smart contracts. -->
## Diagram

![dashboard 1](assets/diagram.png)

## Screenshots

| Landingpage                   | Create Lottery and Overview page                     |
| --------------------------------- | --------------------------------- |
| ![dashboard 1](assets/1.png) | ![dashboard 2](assets/2.png) |

|  Lottery page                   | AVS Dashboard                     |
| --------------------------------- | --------------------------------- |
| ![dashboard 3](assets/3.png) | ![dashboard 4](assets/4.png) |

## Contracts

### Lottery
The Lottery contract is the core of our dApp. After each sale, there is an x% chance of closing the lottery. This makes the WinWin lottery twice as exciting, because you don't know when the winner will be decided. When the lottery closes, one player is chosen randomly and he receives 100% of the prize pool. During the duration of the lottery, the pool is used to earn yield. Upon closing, the lottery owner/organizer receives this yield.

#### create_lottery
Creates a new lottery in exchange for a small fee. Takes in a u64 value between 100 and 200, which is the RTP (Return To Player) percentage. 

#### place_bet
Swap MOVE tokens for lottery tickets at a 1:1 rate. It takes the amount and lottery_id as inputs. The amount paid for the ticket is automatically transferred to the yield contract.

#### draw_winner
Closes the lottery and randomly determines the winner. Takes a lottery_id as input. After selecting the winner, the lottery pool money is withdrawn from the yield contract and transferred to the player.

### Yield
The Yield contract serves as an example for the happy flow scenario. It's a very simple (and lucrative) yield generating contract, where each deposit earns 10% upon withdrawal. After deploying the contract, it needs to be funded by the deployer so it can pay the yield. Obviously it's only for testing purposes, to showcase how the lottery works.

#### deposit
Lets any user deposit tokens into the contract. The address and amount is recorded in the contract.

#### withdraw
Withdraws all tokens for this user. The total amount is the sum of all deposits and the yield that was generated between the deposit and withdrawal. For testing purposes the yield is fixed at 10% upon withdrawal.

## Next steps

#### Lottery
- Include Aptos randomness module (code is there, but not working on Movement M1 devnet)
- Display recent ticket sales (cannot read events, no indexer on Movement M1 devnet)
- Automate closing of lottery
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
- [Presentation video](TODO)
#### Vercel
- [Lottery dApp](https://winwin-lottery.vercel.app/)
- [AVS dashboard](https://winwin-avs.vercel.app/)

#### Github repos
- [Github: Lottery dApp and Move contracts](https://github.com/arjanjohan/move-lottery)
- [Github: Lottery AVS](https://github.com/arjanjohan/avs-lottery)

#### Contracts

- [Deployed Lottery contract on Movement M1](https://explorer.devnet.m1.movementlabs.xyz/account/0xdae25764db6f5f9b6954f3475991a2a97a9f367dba8f110b96b9957c5ed8074f?network=devnet)
- [Deployed Yield contract on Movement M1](https://explorer.devnet.m1.movementlabs.xyz/account/0x07261beac6e023ed2ba91de8e784c4ae66ef008e62c6ffd989410a7d344fa776?network=devnet)
- [Deployed Lottery AVS on Ethereum Holesky](https://holesky.etherscan.io/address/0x1081ded255574EC1dF6948DfEc3442c54B1De19A)

## Team

- [arjanjohan](https://x.com/arjanjohan/)
