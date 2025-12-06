import { useCallback, useEffect, useState } from "react";
import { useConnection, usePublicClient } from "wagmi";
import { formatUnits } from "viem";

import { WalletSection } from "@components/WalletSection";
import BuyYDPanel from "@components/BuyYDPanel";
import { YD_TOKEN_ADDRESS, ydTokenAbi } from "@contracts";

const DashboardPage = () => {
  const { address, isConnected } = useConnection();
  const publicClient = usePublicClient();
  const [ydBalance, setYdBalance] = useState<string>("0");

  const fetchYdBalance = useCallback(async () => {
    if (!publicClient || !address) {
      setYdBalance("0");
      return;
    }

    try {
      const [balanceRaw, decimals] = await Promise.all([
        publicClient.readContract({
          address: YD_TOKEN_ADDRESS,
          abi: ydTokenAbi,
          functionName: "balanceOf",
          args: [address],
        }) as Promise<bigint>,
        publicClient.readContract({
          address: YD_TOKEN_ADDRESS,
          abi: ydTokenAbi,
          functionName: "decimals",
        }) as Promise<number>,
      ]);

      setYdBalance(formatUnits(balanceRaw, decimals));
    } catch (err) {
      console.error("fetchYdBalance error:", err);
      setYdBalance("0");
    }
  }, [publicClient, address]);

  useEffect(() => {
    if (isConnected) {
      const timer = setTimeout(() => {
        fetchYdBalance();
      }, 0);
      return () => clearTimeout(timer);
    }

    const resetTimer = setTimeout(() => {
      setYdBalance("0");
    }, 0);
    return () => clearTimeout(resetTimer);
  }, [isConnected, fetchYdBalance]);

  return (
    <div className="flex flex-col gap-6">
      <WalletSection
        address={address}
        ydBalance={ydBalance}
        isConnected={isConnected}
        onRefresh={fetchYdBalance}
      />

      <BuyYDPanel
        onBuySuccess={async () => {
          await fetchYdBalance();
        }}
      />
    </div>
  );
};

export default DashboardPage;
