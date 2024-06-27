"use client";

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { Address } from "~~/components/scaffold-eth";
import { LOTTERY } from "../../../contracts/addresses";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

const LotteryDetails = () => {
   
  const id  = 1;

  const { account } = useWallet();
  const aptosConfig = new AptosConfig({
    network: Network.CUSTOM,
    fullnode: 'https://aptos.devnet.m1.movementlabs.xyz',
    indexer: 'https://indexer.devnet.m1.movementlabs.xyz/',
    faucet: 'https://faucet2.movementlabs.xyz'
  });
  const aptos = new Aptos(aptosConfig);

  const [lotteryDetails, setLotteryDetails] = useState<any>(null);

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
    } catch (e: any) {
      console.log("error fetching lottery details", e);
    }
  };

  if ( !lotteryDetails) {
    return <div>Loading...</div>;
  }

  return (
    <div className="py-10 px-10">
      <div className="grid grid-cols-3 max-lg:grid-cols-1">
        <div className="max-lg:row-start-3">
          <div className="mx-10">
            <div className="flex w-auto justify-center h-10">
              <p className="flex justify-center text-lg font-bold">Lottery Details</p>
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
                      <Address address={player.address} size="lg" />
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
            <div>{lotteryDetails.total_amount / 100000000} MOVE</div>
          </div>
          <div className="flex flex-col items-center space-y-4 bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-3 m-4 w-full max-w-lg">
            <span className="text-xl"> Tickets </span>
            <div>{lotteryDetails.tickets.length}</div>
          </div>
          <div className="flex flex-col items-center space-y-4 bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-3 m-4 w-full max-w-lg">
            <span className="text-xl"> Winner: </span>
            <div>{lotteryDetails.is_open || lotteryDetails.winning_address === '0x0' ? "..." : lotteryDetails.winning_address}</div>
          </div>
        </div>
        <div className="flex flex-col items-center pt-4 max-lg:row-start-1">
          <div className="flex flex-col items-center space-y-4 bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-3 m-4 w-full max-w-lg">
            <span className="text-xl"> Lottery status: </span>
            <div>{lotteryDetails.is_open ? "OPEN" : "CLOSED"}</div>
          </div>
          <div className="flex flex-col items-center space-y-4 bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-3 m-4 w-full max-w-lg">
            <span className="text-xl"> Total prize pool: </span>
            <div>{lotteryDetails.total_amount / 100000000} MOVE</div>
            <span className="text-xl"> Number of players: </span>
            <div>{lotteryDetails.players.length}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LotteryDetails;
