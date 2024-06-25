"use client";

import { useState, useEffect } from "react";
import type { NextPage } from "next";
import { Address } from "~~/components/scaffold-eth";
import { IntegerInput } from "~~/components/scaffold-eth";
import { useWallet, InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { LOTTERY } from "../../contracts/addresses";
import { Address as AddressType } from "viem";

export type Buy = {
  address: AddressType;
  amount: number;
  date: string;
};

export type BuyEventsProps = {
  buys: Buy[];
};

const Lottery: NextPage = () => {
  const { account, signAndSubmitTransaction } = useWallet();
  const aptosConfig = new AptosConfig({
    network: Network.CUSTOM,
    fullnode: 'https://aptos.devnet.m1.movementlabs.xyz',
    indexer: 'https://indexer.devnet.m1.movementlabs.xyz/',
    faucet: 'https://faucet2.movementlabs.xyz'
  });
  const aptos = new Aptos(aptosConfig);

  const [tokensToBuy, setTokensToBuy] = useState<string | bigint>("");
  const [transactionInProgress, setTransactionInProgress] = useState<boolean>(false);
  const [numberOfTicketsSold, setNumberOfTicketsSold] = useState<number>(0);
  const [buys, setBuys] = useState<Buy[]>([]);
  const [lotteryIsOpen, setLotteryIsOpen] = useState<boolean>(false);
  const [lotteryWinner, setLotteryWinner] = useState<string>("0x0");
  const [numberOfPlayers, setNumberOfPlayers] = useState<number>(0);
  const [yieldPercentage, setYieldPercentage] = useState<number>(10);

  // const fetchEvents = async () => {
  //   try {
  //     const events = await aptos.getModuleEventsByEventType({
  //       eventType: `${LOTTERY}::lottery::TicketEvent`,
  //       options: { limit: 10 }
  //     });
  //     console.log("events", events);
  //     const parsedEvents = events.map(event => ({
  //       address: event.data.addr,
  //       amount: event.data.amount,
  //       date: new Date(1000).toLocaleString(),
  //       // date: new Date(event.timestamp / 1000).toLocaleString(),
  //     }));
  //     setBuys(parsedEvents);
  //   } catch (error) {
  //     console.error("Failed to fetch events:", error);
  //   }
  // };

  useEffect(() => {
    // fetchEvents();
    fetchLottery();
  }, [account?.address]);

  const fetchLottery = async () => {
    try {
      const lotteryResource = await aptos.getAccountResource(
        {
          accountAddress:LOTTERY,
          resourceType:`${LOTTERY}::lottery::Lotts`
        }
      );
      console.log("lotteryResource:", lotteryResource);
      if (lotteryResource) {
        setLotteryIsOpen(lotteryResource.is_open);
        setNumberOfTicketsSold(lotteryResource.total_amount);
        setLotteryWinner(lotteryResource.winner);
        setNumberOfPlayers(lotteryResource.players.length);
      } else {
        console.log("no lotteryResource")
      }
    } catch (e: any) {
      console.log("error fetching lotteryResource", e)
    }
  };


  const placeBet = async () => {
    if (!account) {
      console.log("No account connected");
      return;
    };
    setTransactionInProgress(true);

    const transaction: InputTransactionData = {
      data: {
        function: `${LOTTERY}::lottery::place_bet`,
        functionArguments: [(BigInt(tokensToBuy) * 100000000n).toString()] // TODO get amount from input
      }
    };
    console.log("transaction", transaction);
    try {
      // sign and submit transaction to chain
      const response = await signAndSubmitTransaction(transaction);
      // wait for transaction
      await aptos.waitForTransaction({ transactionHash: response.hash });
      // fetchEvents(); // Refresh events after placing a bet
    } catch (error: any) {
      console.log("error", error);
    } finally {
      setTransactionInProgress(false);
    }
  };



  // const withdraw = async () => {
  //   if (!account) {
  //     console.log("No account connected");
  //     return;
  //   };
  //   setTransactionInProgress(true);

  //   const transaction: InputTransactionData = {
  //     data: {
  //       function: `${LOTTERY}::lottery::withdraw`,
  //       functionArguments: [] // TODO get amount from input
  //     }
  //   };
  //   console.log("transaction", transaction);
  //   try {
  //     // sign and submit transaction to chain
  //     const response = await signAndSubmitTransaction(transaction);
  //     // wait for transaction
  //     await aptos.waitForTransaction({ transactionHash: response.hash });
  //     // fetchEvents(); // Refresh events after placing a bet
  //   } catch (error: any) {
  //     console.log("error", error);
  //   } finally {
  //     setTransactionInProgress(false);
  //   }
  // };


  const drawWinner = async () => {
    if (!account) {
      console.log("No account connected");
      return;
    };
    setTransactionInProgress(true);

    const transaction: InputTransactionData = {
      data: {
        function: `${LOTTERY}::lottery::draw_winner`,
        functionArguments: []
      }
    };
    try {
      // sign and submit transaction to chain
      const response = await signAndSubmitTransaction(transaction);
      // wait for transaction
      await aptos.waitForTransaction({ transactionHash: response.hash });
    } catch (error: any) {
      console.log("error", error);
    } finally {
      setTransactionInProgress(false);
    }
  };


  return (
    <div className="py-10 px-10">
      <div className="grid grid-cols-3 max-lg:grid-cols-1">
        <div className="max-lg:row-start-3">
          <div className="mx-10">
            <div className="flex w-auto justify-center h-10">
              <p className="flex justify-center text-lg font-bold">Recent Ticket Sales</p>
            </div>
            <table className="mt-4 p-2 bg-base-100 table table-zebra shadow-lg w-full overflow-hidden">
              <thead className="text-accent text-lg">
                <tr>
                  <th className="bg-primary text-lg" colSpan={3}>
                    <span>Address</span>
                  </th>
                  <th className="bg-primary text-lg">
                    <span>Amount</span>
                  </th>
                  <th className="bg-primary text-lg">
                    <span>Date</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {buys.map(({ address, amount, date }, i) => (
                  <tr key={i}>
                    <td colSpan={3} className="py-3.5">
                      <Address address={address} size="lg" />
                    </td>
                    <td className="col-span-1 text-lg">
                      <span> {amount} </span>
                    </td>
                    <td className="col-span-1 text-lg">
                      <span> {date} </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex flex-col items-center pt-4 max-lg:row-start-1">
          <img src="/logo.png" width={200} />
          <div className="flex flex-col items-center space-y-4 bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-3 m-4 w-full max-w-lg">
            <span className="text-xl"> Prize pool </span>
            <div>
            {(numberOfTicketsSold/100000000).toString()} MOVE</div>
          </div>
          <div className="flex flex-col items-center space-y-4 bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-3 m-4 w-full max-w-lg">
            <span className="text-xl"> Buy tickets </span>
            <div>1 ticket = 1 MOVE</div>
            {/* 100000000 is 1 move */}
            <div className="flex flex-col space-y-2">
              <IntegerInput
                placeholder="amount of tickets to buy"
                value={tokensToBuy}
                onChange={value => setTokensToBuy(value)}
                disableMultiplyBy1e18
              />
            </div>
            Total: {tokensToBuy ? tokensToBuy.toString() : 0} MOVE
            <button
              className="btn btn-secondary mt-2"
              onClick={async () => {
                try {
                  await placeBet();
                } catch (err) {
                  console.error("Error calling place_bet function");
                }
              }}
            >
              Buy Tickets
            </button>
          </div>
          <div className="flex flex-col items-center space-y-4 bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-3 m-4 w-full max-w-lg">
            <span className="text-xl"> Winner: </span>
            <div>{lotteryIsOpen || lotteryWinner == '0x0' ? "..." : lotteryWinner}</div>
          </div>
          {lotteryIsOpen && lotteryWinner == '0x0' && 
          <button
            className="btn btn-secondary mt-2"
            onClick={async () => {
              try {
                await drawWinner();
              } catch (err) {
                console.error("Error calling drawWinner function");
              }
            }}
          >
            Draw winner
          </button>}
        </div>
        <div className="flex flex-col items-center pt-4 max-lg:row-start-1">
          <div className="flex flex-col items-center space-y-4 bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-3 m-4 w-full max-w-lg">
          <span className="text-xl"> Lottery status: </span>
            <div>{lotteryIsOpen ? "OPEN" : "CLOSED"}</div>
            </div>
            <div className="flex flex-col items-center space-y-4 bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-3 m-4 w-full max-w-lg">
            <span className="text-xl"> Total price pool: </span>
            <div>{numberOfTicketsSold/100000000} MOVE</div>
            <span className="text-xl"> Number of players: </span>
            <div>{numberOfPlayers}</div>
            </div>
            <div className="flex flex-col items-center space-y-4 bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-3 m-4 w-full max-w-lg">

            <span className="text-xl"> APY for owner: </span>
            <div>{yieldPercentage} %</div>
            <div>{(numberOfTicketsSold/100000000) * (yieldPercentage / 100) } MOVE</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lottery;
