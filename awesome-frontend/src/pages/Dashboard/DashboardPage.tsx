import { LearningFlowBar } from '@components/common/LearningFlowBar';
import BuyYDPanel from '@components/wallet/BuyYDPanel';
import { WalletSection } from '@components/wallet/WalletSection';
import { YD_TOKEN_ADDRESS, ydTokenAbi } from '@contracts';
import { useCallback, useEffect, useState } from 'react';
import { formatUnits } from 'viem';
import { useConnection, usePublicClient } from 'wagmi';

const DashboardPage = () => {
  const { address, isConnected } = useConnection();
  const publicClient = usePublicClient();
  const [ydBalance, setYdBalance] = useState<string>('0');

  const fetchYdBalance = useCallback(async () => {
    if (!publicClient || !address) {
      setYdBalance('0');
      return;
    }

    try {
      const [balanceRaw, decimals] = await Promise.all([
        publicClient.readContract({
          address: YD_TOKEN_ADDRESS,
          abi: ydTokenAbi,
          functionName: 'balanceOf',
          args: [address],
        }) as Promise<bigint>,
        publicClient.readContract({
          address: YD_TOKEN_ADDRESS,
          abi: ydTokenAbi,
          functionName: 'decimals',
        }) as Promise<number>,
      ]);

      setYdBalance(formatUnits(balanceRaw, decimals));
    } catch (err) {
      console.error('fetchYdBalance error:', err);
      setYdBalance('0');
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
      setYdBalance('0');
    }, 0);
    return () => clearTimeout(resetTimer);
  }, [isConnected, fetchYdBalance]);

  return (
    <section className="rounded-2xl bg-white/90 p-4 shadow-sm ring-1 ring-slate-100 sm:p-6">
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-slate-900">资产概览</h1>
          <p className="text-sm text-slate-500">统一管理你的链上资产与平台代币。</p>
        </div>

        {/* 学习资金流向步骤条 */}
        <LearningFlowBar currentStep={2} />

        {/* 左右两卡片：钱包概览 + 购买 YD */}
        <div className="grid gap-4 lg:grid-cols-2">
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
      </div>
    </section>
  );
};

export default DashboardPage;
