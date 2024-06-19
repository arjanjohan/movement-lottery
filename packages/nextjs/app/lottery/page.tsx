"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";

const Lottery: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  return (
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <h1 className="text-center">
            <span className="block text-2xl mb-2">Nothing to see here</span>
          </h1>
        </div>
      </div>
  );
};

export default Lottery;
