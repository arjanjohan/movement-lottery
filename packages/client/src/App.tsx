// src/App.tsx
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import { Layout, Row, Col, Button, Spin, List, Input } from "antd";

import React, { useEffect, useState } from "react";
import { useWallet, InputTransactionData } from "@aptos-labs/wallet-adapter-react";

import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import { Aptos } from "@aptos-labs/ts-sdk";

type Player = {
  address: string;
};

export const aptos = new Aptos();
export const moduleAddress = "0x509a53ac2be5e7ab02ad1ca467f1960c6077450870cfee55bfe13235fbaad3c0";

function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [betAmount, setBetAmount] = useState<string>("");
  const { account, signAndSubmitTransaction } = useWallet();
  const [transactionInProgress, setTransactionInProgress] = useState<boolean>(false);
  const [balance, setBalance] = useState<number>(0);

  const onWriteBetAmount = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setBetAmount(value);
  };

  const fetchPlayers = async () => {
    if (!account) return;
    try {
      const lotteryResource = await aptos.getAccountResource({
        accountAddress: account?.address,
        resourceType: `${moduleAddress}::Lottery::Lotts`
      });
      const playerList = (lotteryResource as any).data.players;
      setPlayers(playerList);
    } catch (e: any) {
      console.log("Error fetching players", e);
    }
  };

  const fetchBalance = async () => {
    if (!account) return;
    try {
      const balance = await aptos.getAccountResource({
        accountAddress: account?.address,
        resourceType: `${moduleAddress}::Lottery::Lotts`
      });
      setBalance((balance as any).data.totalamount);
    } catch (e: any) {
      console.log("Error fetching balance", e);
    }
  };

  const placeBet = async () => {
    if (!account) return;
    setTransactionInProgress(true);

    const transaction: InputTransactionData = {
      data: {
        function: `${moduleAddress}::Lottery::place_bet`,
        functionArguments: [account.address, parseInt(betAmount)]
      }
    };
    try {
      // sign and submit transaction to chain
      const response = await signAndSubmitTransaction(transaction);
      // wait for transaction
      await aptos.waitForTransaction({ transactionHash: response.hash });
      setBetAmount("");
      fetchPlayers();
      fetchBalance();
    } catch (error: any) {
      console.log("Error placing bet", error);
    } finally {
      setTransactionInProgress(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
    fetchBalance();
  }, [account?.address]);

  return (
    <>
      <Layout>
        <Row align="middle">
          <Col span={10} offset={2}>
            <h1>Lottery</h1>
          </Col>
          <Col span={12} style={{ textAlign: "right", paddingRight: "200px" }}>
            <WalletSelector />
          </Col>
        </Row>
      </Layout>
      <Spin spinning={transactionInProgress}>
        <Row gutter={[0, 32]} style={{ marginTop: "2rem" }}>
          <Col span={8} offset={8}>
            <Input.Group compact>
              <Input
                onChange={onWriteBetAmount}
                style={{ width: "calc(100% - 60px)" }}
                placeholder="Bet Amount"
                size="large"
                value={betAmount}
              />
              <Button onClick={placeBet} type="primary" style={{ height: "40px", backgroundColor: "#3f67ff" }}>
                Place Bet
              </Button>
            </Input.Group>
          </Col>
          <Col span={8} offset={8}>
            {players && (
              <List
                size="small"
                bordered
                dataSource={players}
                renderItem={(player: Player) => (
                  <List.Item>
                    <List.Item.Meta
                      description={
                        <a
                          href={`https://explorer.aptoslabs.com/account/${player.address}/`}
                          target="_blank"
                        >{`${player.address.slice(0, 6)}...${player.address.slice(-5)}`}</a>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
            <h2>Total Balance: {balance}</h2>
          </Col>
        </Row>
      </Spin>
    </>
  );
}

export default App;
