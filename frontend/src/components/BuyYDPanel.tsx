import React, { useEffect, useState } from "react";
import { useConnection, usePublicClient, useWriteContract } from "wagmi";
import { formatUnits, parseEther } from "viem";
import { YD_SALE_ADDRESS, ydSaleAbi } from "@contracts";

interface BuyYDPanelProps {
  onBuySuccess?: () => void; // 购买成功后让外部刷新余额
}

const BuyYDPanel: React.FC<BuyYDPanelProps> = ({ onBuySuccess }) => {
  const { address, isConnected } = useConnection();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [rate, setRate] = useState<bigint | null>(null);
  const [ethInput, setEthInput] = useState("");
  const [loading, setLoading] = useState(false);

  // 读取汇率
  const loadRate = async () => {
    if (!publicClient) return;
    const r = (await publicClient.readContract({
      address: YD_SALE_ADDRESS,
      abi: ydSaleAbi,
      functionName: "rate",
    })) as bigint;
    setRate(r);
  };

  useEffect(() => {
    if (isConnected) {
      loadRate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  if (!isConnected) {
    return null;
  }

  let expectedYD = "";
  if (rate && ethInput) {
    try {
      const ethWei = parseEther(ethInput); // 1 ETH = 1e18
      const ydAmount = (ethWei * rate) / 10n ** 18n; // 18 decimals
      expectedYD = formatUnits(ydAmount, 18); // YD 也是 18 位
    } catch {
      expectedYD = "";
    }
  }

  const handleBuy = async () => {
    if (!publicClient || !address || !rate) return;
    if (!ethInput) return;

    try {
      setLoading(true);
      const value = parseEther(ethInput);

      const hash = await writeContractAsync({
        address: YD_SALE_ADDRESS,
        abi: ydSaleAbi,
        functionName: "buyWithEth",
        args: [],
        value,
      });

      await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      });

      setEthInput("");

      // 通知外部刷新余额
      onBuySuccess?.();
    } catch (e) {
      console.error("buyWithEth error:", e);
      // 可以在这里接入 Toast 提示
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-2 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-800">
          使用 Sepolia ETH 购买 YD
        </h2>
        <button
          onClick={loadRate}
          className="rounded-xl border border-slate-200 px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
        >
          刷新汇率
        </button>
      </div>

      <p className="mb-2 text-xs text-slate-600">
        当前汇率： {rate ? `1 ETH ≈ ${formatUnits(rate, 18)} YD` : "加载中..."}
      </p>

      <div className="flex flex-col gap-2 md:flex-row md:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-xs text-slate-500">
            想要花费的 ETH 数量
          </label>
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-200"
            placeholder="例如：0.001"
            value={ethInput}
            onChange={(e) => setEthInput(e.target.value)}
            disabled={loading}
          />
          {expectedYD && (
            <p className="mt-1 text-[11px] text-slate-500">
              预计可获得：{expectedYD} YD
            </p>
          )}
        </div>

        <button
          onClick={handleBuy}
          disabled={loading || !ethInput}
          className="mt-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300 md:mt-0"
        >
          {loading ? "处理中..." : "购买 YD"}
        </button>
      </div>

      <p className="mt-2 text-[11px] text-slate-500">
        * 使用 Sepolia 测试 ETH 按固定汇率兑换平台内代币 YD（仅测试用途）。
      </p>
    </section>
  );
};

export default BuyYDPanel;
