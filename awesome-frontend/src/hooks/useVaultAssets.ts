import { AAVE_VAULT_ADDRESS, aaveVaultAbi, MOCK_USDT_ADDRESS, mockUSDTAbi } from '@contracts';
import { useCallback, useEffect, useState } from 'react';
import type { Address } from 'viem';
import { usePublicClient } from 'wagmi';

const USDT_DECIMALS = 6;

/**
 * 金库资产数据 Hook
 * 处理 USDT 余额、金库余额、利率等数据的读取和刷新
 */
export function useVaultAssets(address?: Address, isConnected?: boolean) {
  const publicClient = usePublicClient();

  const [userUsdtBalance, setUserUsdtBalance] = useState<bigint | null>(null);
  const [userVaultBalance, setUserVaultBalance] = useState<bigint | null>(null);
  const [totalAssets, setTotalAssets] = useState<bigint | null>(null);
  const [currentIndex, setCurrentIndex] = useState<bigint | null>(null);
  const [liquidityRate, setLiquidityRate] = useState<bigint | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!publicClient || !address || !isConnected) return;

    setIsLoading(true);
    try {
      const [usdtBal, vaultBal, totalAssets_, index_, rate_] = await Promise.all([
        publicClient.readContract({
          address: MOCK_USDT_ADDRESS,
          abi: mockUSDTAbi,
          functionName: 'balanceOf',
          args: [address],
        }),
        publicClient.readContract({
          address: AAVE_VAULT_ADDRESS,
          abi: aaveVaultAbi,
          functionName: 'balanceOf',
          args: [address],
        }),
        publicClient.readContract({
          address: AAVE_VAULT_ADDRESS,
          abi: aaveVaultAbi,
          functionName: 'totalAssets',
        }),
        publicClient.readContract({
          address: AAVE_VAULT_ADDRESS,
          abi: aaveVaultAbi,
          functionName: 'getCurrentIndex',
        }),
        publicClient.readContract({
          address: AAVE_VAULT_ADDRESS,
          abi: aaveVaultAbi,
          functionName: 'liquidityRate',
        }),
      ]);

      setUserUsdtBalance(usdtBal as bigint);
      setUserVaultBalance(vaultBal as bigint);
      setTotalAssets(totalAssets_ as bigint);
      setCurrentIndex(index_ as bigint);
      setLiquidityRate(rate_ as bigint);
    } catch (err) {
      console.error('refresh vault assets failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, address, isConnected]);

  // 自动刷新：首次 + 每 10 秒
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

  // 计算 APY 显示值
  const apyDisplay = (() => {
    if (!liquidityRate) return '-';
    const RAY = 1e27;
    const apy = (Number(liquidityRate) / RAY) * 100;
    return `${apy.toFixed(2)}%`;
  })();

  return {
    userUsdtBalance,
    userVaultBalance,
    totalAssets,
    currentIndex,
    liquidityRate,
    apyDisplay,
    isLoading,
    refresh,
    decimals: USDT_DECIMALS,
  };
}
