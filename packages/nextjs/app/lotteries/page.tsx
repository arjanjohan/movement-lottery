"use client";

import { useState, useEffect } from "react";
import { NextPage } from "next";
import { IntegerInput } from "~~/components/scaffold-eth";
import Link from "next/link";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { LOTTERY } from "../../contracts/addresses";
import { useWallet, InputTransactionData } from "@aptos-labs/wallet-adapter-react";

const OverviewPage: NextPage = () => {
  const { account, signAndSubmitTransaction } = useWallet();
  const aptosConfig = new AptosConfig({
    network: Network.CUSTOM,
    fullnode: 'https://aptos.devnet.m1.movementlabs.xyz',
    indexer: 'https://indexer.devnet.m1.movementlabs.xyz/',
    faucet: 'https://faucet2.movementlabs.xyz'
  });
  const aptos = new Aptos(aptosConfig);

  const [lotteries, setLotteries] = useState<any[]>([]);
  const [returnToPlayer, setReturnToPlayer] = useState(100);
  const [showOpenOnly, setShowOpenOnly] = useState(false);
  const [lotteryCreateFee, setLotteryCreateFee] = useState<number>(20000000);

  useEffect(() => {
    fetchLottery();
  }, [account?.address]);

  const fetchLottery = async () => {
    try {
      const lotteryResource = await aptos.getAccountResource({
        accountAddress: LOTTERY,
        resourceType: `${LOTTERY}::lottery::LotteriesManager`
      });
      console.log("lotteryResource:", lotteryResource);
      // setLotteryCreateFee(lotteryResource.create_fee);

      const fetchedLotteries = lotteryResource.lotteries.data.map((lottery: any) => ({
        id: lottery.key,
        isOpen: lottery.value.is_open,
        totalAmount: lottery.value.total_amount,
        players: lottery.value.players,
        signerCap: lottery.value.signer_cap,
        tickets: lottery.value.tickets,
        winningAddress: lottery.value.winning_address,
        winningTicket: lottery.value.winning_ticket,
        rtp: lottery.value.rtp_percentage,
        yieldEarned: lottery.value.yield_earned
      }));

      setLotteries(fetchedLotteries);
    } catch (e: any) {
      console.log("error fetching lotteryResource", e);
    }
  };

  const createLottery = async () => {
    if (!account) {
      console.log("No account connected");
      return;
    }

    const transaction: InputTransactionData = {
      data: {
        function: `${LOTTERY}::lottery::create_lottery`,
        functionArguments: [returnToPlayer]
      }
    };
    console.log("transaction", transaction);
    try {
      // sign and submit transaction to chain
      const response = await signAndSubmitTransaction(transaction);
      // wait for transaction
      await aptos.waitForTransaction({ transactionHash: response.hash });
      fetchLottery(); // Refresh lotteries after creating a new one
    } catch (error: any) {
      console.log("error", error);
    }
  };

  const handleToggleChange = () => {
    setShowOpenOnly(!showOpenOnly);
  };


  const formatMoveAmounts = (amount: number) => {
    return parseFloat(((amount/100000000) ).toFixed(8).toString());
  }

  const filteredLotteries = showOpenOnly
    ? lotteries.filter(lottery => lottery.isOpen)
    : lotteries;

  return (
    <div className="flex items-center flex-col flex-grow pt-10">
      <div className="flex flex-col items-center space-y-4 bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-3 m-4 w-full max-w-lg">
        <h1 className="text-center">
          <span className="block text-2xl mb-2">Create Lottery</span>
        </h1>

        <div className="flex flex-col space-y-2">
          Return to Player %:
          <IntegerInput
            placeholder="Return to Player %"
            value={returnToPlayer.toString()}
            onChange={value => setReturnToPlayer(Number(value))}
            disableMultiplyBy1e18
          />
        </div>
        Fee: {formatMoveAmounts(lotteryCreateFee)} MOVE

        <button
          className="btn btn-secondary mt-2"
          onClick={async () => {
            try {
              await createLottery();
            } catch (err) {
              console.error("Error calling create_lottery function");
            }
          }}
        >
          Create Lottery
        </button>
      </div>
      <div className="flex justify-center p-3 m-4  px-4 md:px-0">
        <div className="overflow-x-auto w-full shadow-lg shadow-secondary border-8 border-secondary rounded-xl">
          <div className="flex justify-end p-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showOpenOnly}
                onChange={handleToggleChange}
                className="mr-2"
              />
              Show Only Open Lotteries
            </label>
          </div>
          <table className="table text-xl bg-base-100 table-zebra w-full md:table-md table-sm">
            <thead>
              <tr className="rounded-xl text-sm text-base-content">
                <th className="bg-primary">Lottery Id</th>
                <th className="bg-primary">RTP %</th>
                <th className="bg-primary">Players</th>
                <th className="bg-primary">Pool size (MOVE)</th>
                <th className="bg-primary">Status</th>
                <th className="bg-primary">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLotteries.map((lottery, index) => (
                <tr key={index}>
                  <td>{lottery.id}</td>
                  <td>{lottery.rtp}%</td>
                  <td>{lottery.players.length}</td>
                  <td>{formatMoveAmounts(lottery.totalAmount)} MOVE</td>
                  <td>{lottery.isOpen ? "Open" : "Closed"}</td>
                  <td>
                    <Link legacyBehavior href={`/lotteries/${lottery.id}`}>
                      <a className="btn btn-secondary">View</a>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OverviewPage;
