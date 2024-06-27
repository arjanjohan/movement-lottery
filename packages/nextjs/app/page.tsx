"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { BanknotesIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";
import TeamComponent from "../components/Team";


const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <h1 className="text-center">
            <span className="block text-2xl mb-2">Welcome to</span>
            <div className="flex justify-center">
              <img src="/logo.png" width={200} />
            </div>
            <span className="block text-4xl font-bold">WinWin Lottery</span>
          </h1>
          <p className="text-center text-lg">
            WinWin is the first lottery that gives 100% (or more) Return To Player!
          </p>
          
          <div className="flex justify-center items-center space-x-2 flex-col sm:flex-row">
            <p className="my-2 font-medium">Connected Address:</p>
            <Address address={connectedAddress} />
          </div>
        </div>

        <div className="flex-grow bg-base-300 w-full mt-16 px-8 py-12">
          <div className="flex justify-center items-center gap-12 flex-col sm:flex-row">
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <BanknotesIcon className="h-8 w-8 fill-secondary" />
              <p>
                Head over to the {" "}
                <Link href="/lotteries" passHref className="link">
                  Lotteries
                </Link>{" "}
                tab to create a lottery of buy tickets for an existing one.
              </p>
            </div>
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <MagnifyingGlassIcon className="h-8 w-8 fill-secondary" />
              <p>
                Are you an AVS operator? Head over to the {" "}
                <Link href="https://winwin-avs.vercel.app/" className="link">
                  AVS dashboard
                </Link>{" "}
                page.
              </p>
            </div>
          </div>
        </div>
        <TeamComponent/>

      </div>
    </>
  );
};

export default Home;
