"use client";

import { ethers } from "ethers";
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { IntegerInput } from "~~/components/scaffold-eth";
import externalContracts from "~~/contracts/externalContracts";
import Confetti from 'react-confetti';

import { Address } from "~~/components/scaffold-eth";
import { LOTTERY } from "../../../contracts/addresses";
import { useWallet, InputTransactionData } from "@aptos-labs/wallet-adapter-react";

const LotteryDetails = () => {
  
  // TODO use router instead
  const id = 2;

  // AVS contracts
  const avsContractAddress = externalContracts[17000].LotteryServiceManager.address;
  const abi = externalContracts[17000].LotteryServiceManager.abi;
  const privateKey = process.env.PRIVATE_KEY;


  const { account, signAndSubmitTransaction } = useWallet();
  const aptosConfig = new AptosConfig({
    network: Network.CUSTOM,
    fullnode: 'https://aptos.devnet.m1.movementlabs.xyz',
    indexer: 'https://indexer.devnet.m1.movementlabs.xyz/',
    faucet: 'https://faucet2.movementlabs.xyz'
  });
  const aptos = new Aptos(aptosConfig);

  const [lotteryDetails, setLotteryDetails] = useState<any>(null);
  const [tokensToBuy, setTokensToBuy] = useState<string | bigint>("");
  const [yieldPercentage, setYieldPercentage] = useState<number>(10);
  const [AvsAproved, setAvsAproved] = useState<boolean>(false);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);

  useEffect(() => {
    if (id) {
      fetchLotteryDetails(id);
    }
  }, [id]);

  const fetchLotteryDetails = async (lotteryId: number) => {
    console.log("fetching lottery details", lotteryId);
    try {
      const lotteryResource = await aptos.getAccountResource({
        accountAddress: LOTTERY,
        resourceType: `${LOTTERY}::lottery::LotteriesManager`
      });
      console.log("lotteryResource:", lotteryResource);

      const lottery = lotteryResource.lotteries.data.find((l: any) => l.key === lotteryId.toString());
      console.log("lottery:", lottery);
      setLotteryDetails(lottery.value);

      console.log("confetti:", showConfetti);
    } catch (e: any) {
      console.log("error fetching lottery details", e);
    }
  };



  const placeBet = async () => {
    if (!account) {
      console.log("No account connected");
      return;
    };

    const transaction: InputTransactionData = {
      data: {
        function: `${LOTTERY}::lottery::place_bet`,
        functionArguments: [id, (BigInt(tokensToBuy) * 100000000n).toString()] // TODO get amount from input
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
    }
  };

  const createAvsTask = async () => {
    try {
      // if (!privateKey) {
      //   // TODO: add popup with error
      //   // TODO: check valid private key
      //   console.error("Private key is required for creating AVS task");
      //   return;
      // }

      const provider = new ethers.JsonRpcProvider("https://1rpc.io/holesky");
      const wallet = new ethers.Wallet("2a5a57362214599f2fb8b4ef4925a36fb80006c8be82d0819763668e08333120", provider);

      const contract = new ethers.Contract(avsContractAddress, abi, wallet);

      // console.log(`Creating new task with name: ${randomName}`);
      const tx = await contract.createNewTask(id, lotteryDetails.signer_cap.account, []);
      await tx.wait();
      console.log("Task created successfully");
    } catch (error) {
      console.error("Error creating task:", error);
    }
  }

  const drawWinner = async () => {
    if (!account) {
      console.log("No account connected");
      return;
    };

    const transaction: InputTransactionData = {
      data: {
        function: `${LOTTERY}::lottery::draw_winner`,
        functionArguments: [id]
      }
    };
    try {
      // sign and submit transaction to chain
      const response = await signAndSubmitTransaction(transaction);
      // wait for transaction
      await aptos.waitForTransaction({ transactionHash: response.hash });
    } catch (error: any) {
      console.log("error", error);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!lotteryDetails) {
    return <div>Loading...</div>;
  }

  const formatMoveAmounts = (amount: number) => {
    return parseFloat(((amount/100000000) ).toFixed(8).toString());
  }

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
                {lotteryDetails.players.map((player: any, i: number) => (
                  <tr key={i}>
                    <td colSpan={3} className="py-3.5">
                      {formatAddress(player)}
                    </td>
                    <td className="col-span-1 text-lg">
                      <span> {player.amount} </span>
                    </td>
                    <td className="col-span-1 text-lg">
                      <span> {new Date(player.date).toLocaleString()} </span>
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
            <div>{formatMoveAmounts(lotteryDetails.total_amount )} MOVE</div>
          </div>
          
          <div className="flex flex-col items-center space-y-4 bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-3 m-4 w-full max-w-lg">
            <span className="text-xl"> Buy tickets </span>
            <div>1 ticket = 1 MOVE</div>
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
              disabled={!lotteryDetails.is_open}
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
            <div>{lotteryDetails.is_open || lotteryDetails.winning_address === '0x0' ? "..." : formatAddress(lotteryDetails.winning_address)}</div>
            <div>{!lotteryDetails.is_open && lotteryDetails.winning_address === account?.address ? "Congratulations, you won! " : ""}</div>

            {!lotteryDetails.is_open && lotteryDetails.winning_address === account?.address && <Confetti />}
          
          </div>
          
          {lotteryDetails.is_open && lotteryDetails.winning_address == '0x0' && 
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
            <div>{lotteryDetails.is_open ? "OPEN" : "CLOSED"}</div>
          </div>
          <div className="flex flex-col items-center space-y-4 bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-3 m-4 w-full max-w-lg">
            <span className="text-xl"> Total prize pool: </span>
            <div>{formatMoveAmounts(lotteryDetails.total_amount )} MOVE</div>
            <span className="text-xl"> Number of players: </span>
            <div>{lotteryDetails.players.length}</div>
          </div>
          <div className="flex flex-col items-center space-y-4 bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-3 m-4 w-full max-w-lg">

            <span className="text-xl"> Profit for owner: </span>
            <div>{yieldPercentage} %</div>
            <div>{formatMoveAmounts(lotteryDetails.total_amount * (yieldPercentage / 100)) } MOVE</div>
            {lotteryDetails.is_open &&
            <div>
              <button
                className="btn btn-secondary mt-2"
                onClick={async () => {
                  try {
                    await createAvsTask();
                  } catch (err) {
                    console.error("Error calling createAvsTask function");
                  }
                }}
              >
                Create AVS Task
              </button>
              
              <button
                className="btn btn-secondary mt-2"
                disabled={!AvsAproved}
                onClick={async () => {
                  try {
                    // await claimYield();
                  } catch (err) {
                    console.error("Error calling drawWinner function");
                  }
                }}
              >
                Claim Yield
              </button>
              </div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LotteryDetails;
