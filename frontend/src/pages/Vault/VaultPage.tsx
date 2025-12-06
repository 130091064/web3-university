import { useCallback, useEffect, useMemo, useState } from "react";
import { useConnection, usePublicClient, useWriteContract } from "wagmi";
import { formatUnits, parseUnits } from "viem";

import {
  AAVE_VAULT_ADDRESS,
  MOCK_USDT_ADDRESS,
  aaveVaultAbi,
  mockUSDTAbi,
} from "@contracts";

const USDT_DECIMALS = 6;

const VaultPage = () => {
  const { address, status } = useConnection();
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending } = useWriteContract();

  const isConnected = status === "connected" && !!address;

  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [txStatus, setTxStatus] = useState<string | null>(null);

  const [userUsdtBalance, setUserUsdtBalance] = useState<bigint | null>(null);
  const [userVaultBalance, setUserVaultBalance] = useState<bigint | null>(null);
  const [totalAssets, setTotalAssets] = useState<bigint | null>(null);
  const [currentIndex, setCurrentIndex] = useState<bigint | null>(null);
  const [liquidityRate, setLiquidityRate] = useState<bigint | null>(null);

  const refresh = useCallback(async () => {
    if (!publicClient || !address || !isConnected) return;

    try {
      const [usdtBal, vaultBal, totalAssets_, index_, rate_] = await Promise.all([
        publicClient.readContract({
          address: MOCK_USDT_ADDRESS,
          abi: mockUSDTAbi,
          functionName: "balanceOf",
          args: [address],
        }),
        publicClient.readContract({
          address: AAVE_VAULT_ADDRESS,
          abi: aaveVaultAbi,
          functionName: "balanceOf",
          args: [address],
        }),
        publicClient.readContract({
          address: AAVE_VAULT_ADDRESS,
          abi: aaveVaultAbi,
          functionName: "totalAssets",
        }),
        publicClient.readContract({
          address: AAVE_VAULT_ADDRESS,
          abi: aaveVaultAbi,
          functionName: "getCurrentIndex",
        }),
        publicClient.readContract({
          address: AAVE_VAULT_ADDRESS,
          abi: aaveVaultAbi,
          functionName: "liquidityRate",
        }),
      ]);

      setUserUsdtBalance(usdtBal as bigint);
      setUserVaultBalance(vaultBal as bigint);
      setTotalAssets(totalAssets_ as bigint);
      setCurrentIndex(index_ as bigint);
      setLiquidityRate(rate_ as bigint);
    } catch (err) {
      console.error("refresh failed:", err);
    }
  }, [publicClient, address, isConnected]);

  useEffect(() => {
    if (!isConnected) return;

    const initial = setTimeout(() => {
      refresh();
    }, 0);

    const timer = setInterval(() => {
      refresh();
    }, 10_000);

    return () => {
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, [isConnected, refresh]);

  const userUsdtDisplay = useMemo(
    () =>
      userUsdtBalance !== null
        ? Number(formatUnits(userUsdtBalance, USDT_DECIMALS)).toFixed(4)
        : "-",
    [userUsdtBalance]
  );

  const userVaultDisplay = useMemo(
    () =>
      userVaultBalance !== null
        ? Number(formatUnits(userVaultBalance, USDT_DECIMALS)).toFixed(4)
        : "-",
    [userVaultBalance]
  );

  const totalAssetsDisplay = useMemo(
    () =>
      totalAssets !== null
        ? Number(formatUnits(totalAssets, USDT_DECIMALS)).toFixed(4)
        : "-",
    [totalAssets]
  );

  const apyDisplay = useMemo(() => {
    if (!liquidityRate) return "-";
    const RAY = 1e27;
    const apy = (Number(liquidityRate) / RAY) * 100;
    return `${apy.toFixed(2)}%`;
  }, [liquidityRate]);

  const indexDisplay = useMemo(() => (currentIndex ? String(currentIndex) : "-"), [currentIndex]);

  async function handleDeposit() {
    if (!address) return setTxStatus("请先连接钱包");
    if (!depositAmount) return setTxStatus("请输入存入金额");

    try {
      const parsed = parseUnits(depositAmount, USDT_DECIMALS);

      setTxStatus("钱包签名中（approve）...");
      await writeContractAsync({
        address: MOCK_USDT_ADDRESS,
        abi: mockUSDTAbi,
        functionName: "approve",
        args: [AAVE_VAULT_ADDRESS, parsed],
      });

      setTxStatus("钱包签名中（deposit）...");
      await writeContractAsync({
        address: AAVE_VAULT_ADDRESS,
        abi: aaveVaultAbi,
        functionName: "deposit",
        args: [parsed],
      });

      setTxStatus("✅ 存入成功");
      setDepositAmount("");
      await refresh();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "存入失败";
      setTxStatus(`❌ 存入失败：${message}`);
    }
  }

  async function handleWithdraw() {
    if (!address) return setTxStatus("请先连接钱包");
    if (!withdrawAmount) return setTxStatus("请输入取出金额");

    try {
      const parsed = parseUnits(withdrawAmount, USDT_DECIMALS);

      setTxStatus("钱包签名中（withdraw）...");
      await writeContractAsync({
        address: AAVE_VAULT_ADDRESS,
        abi: aaveVaultAbi,
        functionName: "withdraw",
        args: [parsed],
      });

      setTxStatus("✅ 取出成功");
      setWithdrawAmount("");
      await refresh();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "取出失败";
      setTxStatus(`❌ 取出失败：${message}`);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-2 text-xl font-semibold">USDT 理财金库（AaveVault）</h2>
      <p className="mb-4 text-sm text-slate-600">
        基于 MockUSDT + Aave 指数利息模型，实现随时间自动增长的 USDT 理财金库，仅用于演示。
      </p>

      {!isConnected && (
        <div className="mb-4 rounded-lg bg-yellow-100 px-3 py-2 text-sm text-yellow-800">
          请先连接钱包
        </div>
      )}

      <div className="mb-4 grid gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-xs text-slate-500">我的 mUSDT 余额</div>
          <div className="mt-1 text-lg font-semibold">{userUsdtDisplay}</div>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-xs text-slate-500">我在金库中的余额</div>
          <div className="mt-1 text-lg font-semibold">{userVaultDisplay}</div>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-xs text-slate-500">金库总资产</div>
          <div className="mt-1 text-lg font-semibold">{totalAssetsDisplay}</div>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-xs text-slate-500">当前年化利率（APY）</div>
          <div className="mt-1 text-lg font-semibold">{apyDisplay}</div>
        </div>
      </div>

      <div className="mb-4 text-xs text-slate-500">
        当前 liquidityIndex：<span className="ml-1 font-mono">{indexDisplay}</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="mb-2 text-sm font-medium">存入 mUSDT</div>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
            placeholder="例如 100"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
          />
          <button
            onClick={handleDeposit}
            disabled={isPending}
            className="mt-3 w-full rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
          >
            {isPending ? "交易发送中..." : "存入金库"}
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 p-4">
          <div className="mb-2 text-sm font-medium">从金库取出 mUSDT</div>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            placeholder="例如 50"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
          />
          <button
            onClick={handleWithdraw}
            disabled={isPending}
            className="mt-3 w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {isPending ? "交易发送中..." : "从金库取出"}
          </button>
        </div>
      </div>

      {txStatus && (
        <div className="mt-4 rounded-lg bg-slate-900 px-3 py-2 text-xs text-slate-50">{txStatus}</div>
      )}
    </div>
  );
};

export default VaultPage;
