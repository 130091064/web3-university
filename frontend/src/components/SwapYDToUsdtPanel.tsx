import React, { useEffect, useState } from "react";
import { useConnection, usePublicClient, useWriteContract } from "wagmi";
import { formatUnits, parseUnits } from "viem";
import {
  YD_TOKEN_ADDRESS,
  erc20Abi,
  YD_USDT_SWAP_ADDRESS,
  ydUsdtSwapAbi,
} from "../contracts";

interface SwapYDToUsdtPanelProps {
  onSwapSuccess?: () => void; // 兑换成功后，让外层刷新余额 & AAVE 面板
}

const SwapYDToUsdtPanel: React.FC<SwapYDToUsdtPanelProps> = ({
  onSwapSuccess,
}) => {
  const { address, isConnected } = useConnection();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [ydBalance, setYdBalance] = useState<bigint>(0n);
  const [rate, setRate] = useState<bigint | null>(null); // 1 YD 可换多少 USDT(1e6)
  const [inputYd, setInputYd] = useState("");
  const [loading, setLoading] = useState(false);

  // 读取 YD 余额 & 汇率
  const refresh = async () => {
    if (!publicClient || !address) return;

    const [bal, r] = await Promise.all([
      publicClient.readContract({
        address: YD_TOKEN_ADDRESS,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address],
      }) as Promise<bigint>,
      publicClient.readContract({
        address: YD_USDT_SWAP_ADDRESS,
        abi: ydUsdtSwapAbi,
        functionName: "rateUsdtPerYd",
      }) as Promise<bigint>,
    ]);

    setYdBalance(bal);
    setRate(r);
  };

  useEffect(() => {
    if (isConnected) {
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  if (!isConnected || !address) {
    return null;
  }

  // 预计能拿到多少 USDT
  let expectedUsdt = "";
  if (rate && inputYd) {
    try {
      const ydAmount = parseUnits(inputYd, 18); // YD 18 位精度
      const usdtOut = (ydAmount * rate) / 10n ** 18n; // 计算规则和合约一致
      expectedUsdt = formatUnits(usdtOut, 6); // USDT 6 位
    } catch {
      expectedUsdt = "";
    }
  }

  const handleSwap = async () => {
    if (!publicClient || !address || !rate) return;
    if (!inputYd) return;

    try {
      setLoading(true);

      const ydAmount = parseUnits(inputYd, 18);

      // 1. 检查 allowance
      const allowance = (await publicClient.readContract({
        address: YD_TOKEN_ADDRESS,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address, YD_USDT_SWAP_ADDRESS],
      })) as bigint;

      if (allowance < ydAmount) {
        const approveHash = await writeContractAsync({
          address: YD_TOKEN_ADDRESS,
          abi: erc20Abi,
          functionName: "approve",
          args: [YD_USDT_SWAP_ADDRESS, ydAmount],
        });
        await publicClient.waitForTransactionReceipt({
          hash: approveHash,
          confirmations: 1,
        });
      }

      // 2. 兑换
      const swapHash = await writeContractAsync({
        address: YD_USDT_SWAP_ADDRESS,
        abi: ydUsdtSwapAbi,
        functionName: "swapYdForUsdt",
        args: [ydAmount],
      });

      await publicClient.waitForTransactionReceipt({
        hash: swapHash,
        confirmations: 1,
      });

      setInputYd("");
      await refresh(); // 更新 YD 余额

      onSwapSuccess?.();
    } catch (e) {
      console.error("swapYdForUsdt error:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-800">
          将课程收入 YD 兑换为 USDT
        </h2>
        <button
          onClick={refresh}
          className="rounded-xl border border-slate-200 px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
        >
          刷新
        </button>
      </div>

      <p className="mb-1 text-xs text-slate-600">
        我的 YD 余额：{formatUnits(ydBalance, 18)} YD
      </p>
      <p className="mb-3 text-xs text-slate-500">
        当前汇率：{" "}
        {rate
          ? `1 YD ≈ ${formatUnits(rate, 6)} USDT（仅作演示，固定汇率）`
          : "加载中..."}
      </p>

      <div className="flex flex-col gap-2 md:flex-row md:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-xs text-slate-500">
            想要兑换的 YD 数量
          </label>
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-200"
            placeholder="例如：100"
            value={inputYd}
            onChange={(e) => setInputYd(e.target.value)}
            disabled={loading}
          />
          {expectedUsdt && (
            <p className="mt-1 text-[11px] text-slate-500">
              预计可获得：{expectedUsdt} USDT
            </p>
          )}
        </div>

        <button
          onClick={handleSwap}
          disabled={loading || !inputYd}
          className="mt-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-600 disabled:cursor-not-allowed disabled:bg-slate-300 md:mt-0"
        >
          {loading ? "兑换中..." : "兑换为 USDT"}
        </button>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
        * 本模块演示课程作者将 YD 收益按固定汇率兑换为 USDT，再通过下方 AAVE
        理财金库将 USDT 存入 AAVE v3 Sepolia 赚取利息。实际生产环境中，兑换
        步骤通常会由中心化交易所或聚合 DEX 完成。
      </p>
    </section>
  );
};

export default SwapYDToUsdtPanel;
