import React from "react";
import { Address as AddressType } from "viem";
import { Address } from "~~/components/scaffold-eth";

export type Holder = {
  address: AddressType;
  amount: number;
};

export type TopHoldersProps = {
  holders: Holder[];
};

export const TopHolders = ({ holders }: TopHoldersProps) => {
  return (
    <div className="mx-10">
      <div className="flex w-auto justify-center h-10">
        <p className="flex justify-center text-lg font-bold">Top Ticket Holders</p>
      </div>

      <table className="mt-4 p-2 bg-base-100 table table-zebra shadow-lg w-full overflow-hidden">
        <thead className="text-accent text-lg">
          <tr>
            <th className="bg-primary text-lg" colSpan={3}>
              <span>Address</span>
            </th>
            <th className="bg-primary text-lg">
              <span>Roll</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {holders.map(({ address, amount }, i) => (
            <tr key={i}>
              <td colSpan={3} className="py-3.5">
                <Address address={address} size="lg" />
              </td>
              <td className="col-span-1 text-lg">
                <span> {amount} </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
