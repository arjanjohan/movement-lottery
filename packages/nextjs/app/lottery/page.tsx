"use client";

import { useState } from "react";
import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { AddressInput, IntegerInput } from "~~/components/scaffold-eth";
import { useWallet, InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { BuyEvents } from "./components/BuyEvents";
import { TopHolders } from "./components/TopHolders";


const moduleAddress = "TODO";

const Lottery: NextPage = () => {
  const { account, signAndSubmitTransaction } = useWallet();
  const aptosConfig = new AptosConfig({ network: Network.CUSTOM });
  const aptos = new Aptos(aptosConfig);

  const [tokensToBuy, setTokensToBuy] = useState<string | bigint>("");
  const [transactionInProgress, setTransactionInProgress] = useState<boolean>(false);

  const placeBet = async () => {
    if (!account) {
      console.log("No account connected");
      return;
    };
    setTransactionInProgress(true);

    const transaction: InputTransactionData = {
      data: {
        function: `${moduleAddress}::Lottery::place_bet`,
        functionArguments: [tokensToBuy] // TODO get amount from input
      }
    }
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
  }

  const drawWinner = async () => {
    if (!account) {
      console.log("No account connected");
      return;
    };
    setTransactionInProgress(true);

    const transaction: InputTransactionData = {
      data: {
        function: `${moduleAddress}::Lottery::draw_winner`,
        functionArguments: []
      }
    }
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
  }


  return (

    <div className="py-10 px-10">
      <div className="grid grid-cols-3 max-lg:grid-cols-1">

        <div className="max-lg:row-start-3">
          <BuyEvents buys={[]} />
        </div>

        <div className="flex flex-col items-center pt-4 max-lg:row-start-1">
          <div className="flex flex-col items-center space-y-4 bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-3 m-4 w-full max-w-lg">
            <span className="text-xl"> Buy lottery tickets </span>
            <div>1 ticket per MOVE</div>
          </div>
          <div className="w-full flex flex-col space-y-2">
            <IntegerInput
              placeholder="amount of tickets to buy"
              value={tokensToBuy.toString()}
              onChange={value => setTokensToBuy(value)}
              disableMultiplyBy1e18
            />
          </div>

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
            Buy Tokens
          </button>

          <div className="flex flex-col items-center space-y-4 bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-3 m-4 w-full max-w-lg">
            <span className="text-xl"> Winner: </span>
            <div>...</div>
          </div>
          <button
            className="btn btn-secondary mt-2"
            onClick={async () => {
              try {
                await drawWinner();
              } catch (err) {
                console.error("Error calling place_bet function");
              }
            }}
          >
            Draw winner
          </button>
        </div>


        <div className="flex flex-col items-center space-y-4 bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-3 m-4 w-full max-w-lg">
          <span className="text-xl"> Total price pool: </span>
          <div>0 MOVE</div>
          <span className="text-xl"> Number of players: </span>
          <div>0</div>
          <span className="text-xl"> APY for owner: </span>
          <div>10%</div>
          <div>0 MOVE</div>

        </div>

      </div>
    </div>
  );
};

export default Lottery;
