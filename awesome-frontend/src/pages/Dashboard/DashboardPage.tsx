import { GlassCard } from '@components/common/GlassCard';
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
    <div className="space-y-6">
      {/* 页面标题区 */}
      <div className="space-y-2 animate-slide-up">
        <h1 className="text-3xl font-bold gradient-text">资产概览</h1>
        <p className="text-slate-300">统一管理你的链上资产与平台代币</p>
      </div>

      {/* 学习流程步骤条 */}
      <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <LearningFlowBar currentStep={2} />
      </div>

      {/* 资产卡片区 */}
      <div
        className="grid gap-6 lg:grid-cols-2 animate-slide-up"
        style={{ animationDelay: '0.2s' }}
      >
        <GlassCard hover className="p-6">
          <WalletSection
            address={address}
            ydBalance={ydBalance}
            isConnected={isConnected}
            onRefresh={fetchYdBalance}
          />
        </GlassCard>

        <GlassCard hover className="p-6">
          <BuyYDPanel
            onBuySuccess={async () => {
              await fetchYdBalance();
            }}
          />
        </GlassCard>
      </div>
    </div>
  );
};

export default DashboardPage;
