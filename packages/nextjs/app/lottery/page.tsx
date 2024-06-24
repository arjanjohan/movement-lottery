"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { AddressInput, IntegerInput } from "~~/components/scaffold-eth";
import { useWallet, InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { BuyEvents } from "./components/BuyEvents";
import { TopHolders } from "./components/TopHolders";


const moduleAddress = "0xe7d3094cd0bd1949396f576dee4ac3c2dbf194e24701bbf7d73a79d91b5c8eaa";

const Lottery: NextPage = () => {
  const { account, signAndSubmitTransaction } = useWallet();
  const aptosConfig = new AptosConfig({
    network: Network.CUSTOM,

    fullnode: 'https://aptos.devnet.m1.movementlabs.xyz',
    indexer: 'https://indexer.devnet.m1.movementlabs.xyz/'
  });
  const aptos = new Aptos(aptosConfig);

  const [tokensToBuy, setTokensToBuy] = useState<string | bigint>("");
  const [transactionInProgress, setTransactionInProgress] = useState<boolean>(false);
  const [numberOfTicketsSold, setNumberOfTicketsSold] = useState<number>(0);
  const [accountOwnedTokens, setAccountOwnedTokens] = useState<any>([]);


  
  useEffect(() => {
    fetchPool();
  }, [account?.address]);
  type Coin = { coin: { value: string } };
  const fetchPool = async () => {
    // THIS WORKS
    const resource = await aptos.getAccountResource<Coin>({
      accountAddress: moduleAddress, //user
      resourceType: "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>",
    });
    console.log("resource", resource)
    
    // const tokens = await aptos.getAccountOwnedTokens({ accountAddress: "0x8ac0b631e6c85b6309bde38e75b13dc2bd39e086c13f8566b14025430fdd197c" });
    // setAccountOwnedTokens(tokens);
    // console.log("tokens", tokens);
    try {
      const depositsResource = await aptos.getAccountResource({
        accountAddress: moduleAddress,
        resourceType: `${moduleAddress}::lottery::total_amount`,
      });
      console.log("depositsResource", depositsResource);
      if (depositsResource) {
        setNumberOfTicketsSold(depositsResource.data.totalamount);
      } else {
        setNumberOfTicketsSold(0);
      }
    } catch (e: any) {
      
      console.error("Error fetching pool:", e);
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
        function: `${moduleAddress}::lottery::place_bet`,
        functionArguments: [tokensToBuy] // TODO get amount from input
      }
    }
    console.log("transaction", transaction);
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
        function: `${moduleAddress}::lottery::draw_winner`,
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
          <img src="/logo.png" width={200}/>
          <div className="flex flex-col items-center space-y-4 bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-3 m-4 w-full max-w-lg">
            <span className="text-xl"> Prize pool </span>
            <div>{numberOfTicketsSold} USD</div>
          </div>
          <div className="flex flex-col items-center space-y-4 bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-3 m-4 w-full max-w-lg">
            <span className="text-xl"> Buy tickets </span>
            <div>1 ticket per MOVE</div>
            <div className=" flex flex-col space-y-2">
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
          <button
            className="btn btn-secondary mt-2"
            onClick={async () => {
              try {
                await fetchPool();
              } catch (err) {
                console.error("Error calling P function", err);
              }
            }}
          >
            fetchPool
          </button>
          </div>
          

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
                console.error("Error calling drawWinner function");
              }
            }}
          >
            Draw winner
          </button>
        </div>


        <div className="flex flex-col items-center pt-4 max-lg:row-start-1">    
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
    </div>
  );
};

export default Lottery;
