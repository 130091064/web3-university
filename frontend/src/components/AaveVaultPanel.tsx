import React, { useEffect, useState } from "react";
import {
  useConnection,
  usePublicClient,
  useWriteContract,
} from "wagmi";
import { formatUnits, parseUnits } from "viem";
import {
  AAVE_VAULT_ADDRESS,
  aaveVaultAbi,
  erc20Abi,
} from "../contracts";

const AaveVaultPanel: React.FC = () => {
  const { address, isConnected } = useConnection();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [underlyingAddress, setUnderlyingAddress] = useState<`0x${string}`>();
  const [decimals, setDecimals] = useState<number>(6); // USDT 默认 6
  const [walletBalance, setWalletBalance] = useState<string>("0");
  const [vaultBalance, setVaultBalance] = useState<string>("0");
  const [shares, setShares] = useState<string>("0");

  const [amountInput, setAmountInput] = useState("");
  const [loading, setLoading] = useState(false);

  // 拉取 USDT 地址、余额、vault 中余额等
  const refreshInfo = async () => {
    if (!publicClient || !address) return;

    // 1. 从 AaveVault 读出 underlying（USDT 地址）
    const u = (await publicClient.readContract({
      address: AAVE_VAULT_ADDRESS,
      abi: aaveVaultAbi,
      functionName: "underlying",
    })) as `0x${string}`;
    setUnderlyingAddress(u);

    // 2. 读 decimals、钱包 USDT 余额、vault 中余额、用户 share
    const [dec, walletBalRaw, vaultBalRaw, shareRaw] = await Promise.all([
      publicClient.readContract({
        address: u,
        abi: erc20Abi,
        functionName: "decimals",
      }) as Promise<number>,
      publicClient.readContract({
        address: u,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address],
      }) as Promise<bigint>,
      publicClient.readContract({
        address: AAVE_VAULT_ADDRESS,
        abi: aaveVaultAbi,
        functionName: "balanceOf",
        args: [address],
      }) as Promise<bigint>,
      publicClient.readContract({
        address: AAVE_VAULT_ADDRESS,
        abi: aaveVaultAbi,
        functionName: "shares",
        args: [address],
      }) as Promise<bigint>,
    ]);

    setDecimals(dec);
    setWalletBalance(formatUnits(walletBalRaw, dec));
    setVaultBalance(formatUnits(vaultBalRaw, dec));
    setShares(shareRaw.toString());
  };

  useEffect(() => {
    if (isConnected) {
      refreshInfo();
    } else {
      setWalletBalance("0");
      setVaultBalance("0");
      setShares("0");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address]);

  const handleDeposit = async () => {
    if (!publicClient || !address || !underlyingAddress) return;
    if (!amountInput) return;

    try {
      setLoading(true);
      const amount = parseUnits(amountInput, decimals);

      // 1. 检查 allowance
      const allowance = (await publicClient.readContract({
        address: underlyingAddress,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address, AAVE_VAULT_ADDRESS],
      })) as bigint;

      if (allowance < amount) {
        const approveHash = await writeContractAsync({
          address: underlyingAddress,
          abi: erc20Abi,
          functionName: "approve",
          args: [AAVE_VAULT_ADDRESS, amount],
        });

        await publicClient.waitForTransactionReceipt({
          hash: approveHash,
          confirmations: 1,
        });
      }

      // 2. 调用 vault.deposit
      const hash = await writeContractAsync({
        address: AAVE_VAULT_ADDRESS,
        abi: aaveVaultAbi,
        functionName: "deposit",
        args: [amount],
      });

      await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      });

      setAmountInput("");
      await refreshInfo();
    } catch (e) {
      console.error("deposit error:", e);
      // 以后可以在这里接入全局 toast
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawAll = async () => {
    if (!publicClient || !address) return;
    if (shares === "0") return;

    try {
      setLoading(true);

      const hash = await writeContractAsync({
        address: AAVE_VAULT_ADDRESS,
        abi: aaveVaultAbi,
        functionName: "withdrawAll",
        args: [],
      });

      await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      });

      await refreshInfo();
    } catch (e) {
      console.error("withdrawAll error:", e);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) return null;

  return (
    <section className="mt-4 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">
          AAVE 理财金库（USDT）
        </h2>
        <button
          onClick={refreshInfo}
          className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
        >
          刷新
        </button>
      </div>

      <div className="mb-3 space-y-1 text-xs text-slate-600">
        <p>钱包 USDT 余额：{walletBalance}</p>
        <p>金库中 USDT 资产：{vaultBalance}</p>
        <p>我的 share：{shares}</p>
      </div>

      <div className="flex flex-col gap-2 md:flex-row md:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-xs text-slate-500">
            存入金额（USDT）
          </label>
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-200"
            placeholder="例如：10"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="mt-2 flex gap-2 md:mt-0">
          <button
            onClick={handleDeposit}
            disabled={loading || !amountInput}
            className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-600 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading ? "处理中..." : "存入 AAVE"}
          </button>
          <button
            onClick={handleWithdrawAll}
            disabled={loading || shares === "0"}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          >
            赎回全部
          </button>
        </div>
      </div>

      <p className="mt-2 text-[11px] text-slate-500">
        * Demo：你把 USDT 存进 AAVE v3 Sepolia，Vault 会持有 aUSDT。随着时间
        推移，利息会体现在“金库中 USDT 资产”的数字变大。
      </p>
    </section>
  );
};

export default AaveVaultPanel;
