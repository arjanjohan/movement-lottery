"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { useWallet, InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import { useEffect, useState } from "react";
import { YIELD } from "../../contracts/addresses";


interface DepositInfo {
  amount: number;
  block_number: number;
}
const Yield: NextPage = () => {
  const { account, signAndSubmitTransaction } = useWallet();
  const aptosConfig = new AptosConfig({
    network: Network.CUSTOM,
    fullnode: 'https://aptos.testnet.suzuka.movementlabs.xyz/v1',
    indexer: 'https://indexer.devnet.m1.movementlabs.xyz/',
    faucet: 'https://faucet2.movementlabs.xyz'
  });
  const aptos = new Aptos(aptosConfig);


  const [accountHasDeposits, setAccountHasDeposits] = useState<boolean>(false);
  const [deposits, setDeposits] = useState<DepositInfo[]>([]);
  const [transactionInProgress, setTransactionInProgress] = useState<boolean>(false);


  useEffect(() => {
    fetchDeposits();
  }, [account?.address]);

  const fetchDeposits = async () => {
    if (!account) {
      console.log("No account connected");
      return;
    };
    try {
      const depositsResource = await aptos.getAccountResource({
        accountAddress: YIELD,
        resourceType: `${YIELD}::yield::Yield`,
      });
      console.log("depositsResource", depositsResource);
      // if (depositsResource) {

      // console.log("depositsResource true", depositsResource);
      //   setAccountHasDeposits(true);
      //   setDeposits(depositsResource.total_deposit);
      // } else {

      // console.log("depositsResource false", depositsResource);
      //   setAccountHasDeposits(false);
      // }
      // console.log("accountHasDeposits", accountHasDeposits);
    } catch (e: any) {
      setAccountHasDeposits(false);
      console.error("Error fetching deposits:", e);
    }
  };

  const deposit = async () => {
    if (!account) {
      console.log("No account connected");
      return;
    };
    setTransactionInProgress(true);

    const transaction: InputTransactionData = {
      data: {
        function: `${YIELD}::yield::deposit`,
        functionArguments: [100000000] // todo get amount from input
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


  const withdraw = async () => {
    if (!account) {
      console.log("No account connected");
      return;
    };
    setTransactionInProgress(true);

    const transaction: InputTransactionData = {
      data: {
        function: `${YIELD}::yield::withdraw`,
        functionArguments: []
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

  return (
    <div className="flex items-center flex-col flex-grow pt-10">
      <div className="px-5">
        <h1 className="text-center">
          <span className="block text-2xl mb-2">Staked tokens:</span>
          {deposits.toString()} MOVE
          
        </h1>
        



        <button className="btn btn-secondary mt-2 w-full"
          onClick={async () => {
            try {
              await deposit();
            } catch (err) {
              console.error("Error calling deposit function");
            }
          }}>
          Deposit 1 MOVE
        </button>
        <button className="btn btn-secondary mt-2 w-full"
          onClick={async () => {
            try {
              await withdraw();
            } catch (err) {
              console.error("Error calling withdraw function");
            }
          }}>
          Withdraw ALL
        </button>
      </div>
    </div>
  );
};

export default Yield;
