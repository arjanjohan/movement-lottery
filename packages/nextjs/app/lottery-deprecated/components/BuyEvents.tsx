import React from "react";
import { Address as AddressType } from "viem";
import { Address } from "~~/components/scaffold-eth";

export type Buy = {
  address: AddressType;
  amount: number;
};

export type BuyEventsProps = {
  buys: Buy[];
};

export const BuyEvents = ({ buys }: BuyEventsProps) => {
  return (
    
  );
};
