import { LearningFlowBar } from '@components/common/LearningFlowBar';
import { AAVE_VAULT_ADDRESS, aaveVaultAbi, MOCK_USDT_ADDRESS, mockUSDTAbi } from '@contracts';
import { useVaultAssets } from '@hooks/useVaultAssets';
import { useWalletStatus } from '@hooks/useWalletStatus';
import { formatTokenAmount } from '@utils';
import { useState } from 'react';
import { parseUnits } from 'viem';
import { useWriteContract } from 'wagmi';
import { DepositForm } from './components/DepositForm';
import { VaultStats } from './components/VaultStats';
import { WithdrawForm } from './components/WithdrawForm';

const VaultPage = () => {
  const { address, isConnected } = useWalletStatus();
  const { writeContractAsync, isPending } = useWriteContract();

  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 使用 useVaultAssets Hook 获取资产数据
  const {
    userUsdtBalance,
    userVaultBalance,
    totalAssets,
    currentIndex,
    apyDisplay,
    refresh,
    decimals,
  } = useVaultAssets(address, isConnected);

  const userUsdtDisplay = formatTokenAmount(userUsdtBalance, decimals);
  const userVaultDisplay = formatTokenAmount(userVaultBalance, decimals);

  async function handleDeposit(depositAmount: string) {
    if (!address) {
      setTxStatus('请先连接钱包');
      return;
    }
    if (!depositAmount) {
      setTxStatus('请输入存入金额');
      return;
    }

    try {
      const parsed = parseUnits(depositAmount, decimals);

      setTxStatus('正在授权 USDT（approve）...');
      await writeContractAsync({
        address: MOCK_USDT_ADDRESS,
        abi: mockUSDTAbi,
        functionName: 'approve',
        args: [AAVE_VAULT_ADDRESS, parsed],
      });

      setTxStatus('正在发送存入交易（deposit）...');
      await writeContractAsync({
        address: AAVE_VAULT_ADDRESS,
        abi: aaveVaultAbi,
        functionName: 'deposit',
        args: [parsed],
      });

      setTxStatus('存入成功');
      await refresh();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : '存入失败';
      setTxStatus(`存入失败：${message}`);
    }
  }

  async function handleWithdraw(withdrawAmount: string) {
    if (!address) {
      setTxStatus('请先连接钱包');
      return;
    }
    if (!withdrawAmount) {
      setTxStatus('请输入取出金额');
      return;
    }

    try {
      const parsed = parseUnits(withdrawAmount, decimals);

      setTxStatus('正在发送取出交易（withdraw）...');
      await writeContractAsync({
        address: AAVE_VAULT_ADDRESS,
        abi: aaveVaultAbi,
        functionName: 'withdraw',
        args: [parsed],
      });

      setTxStatus('取出成功');
      await refresh();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : '取出失败';
      setTxStatus(`取出失败：${message}`);
    }
  }

  return (
    <section className="rounded-2xl bg-white/90 p-4 shadow-sm ring-1 ring-slate-100 sm:p-6">
      <div className="space-y-4">
        {/* ✅ 页面级主 / 副标题 */}
        <div>
          <h1 className="text-xl font-semibold text-slate-900">理财金库</h1>
          <p className="mt-1 text-sm text-slate-500">将 USDT 存入金库，按链上利率自动生息。</p>
        </div>

        <LearningFlowBar currentStep={5} />

        {/* ✅ 原有卡片结构保持不变 */}
        <section className="rounded-2xl bg-slate-50/80 p-4 shadow-sm ring-1 ring-slate-100 sm:p-6">
          {/* 标题 + 简介 + 刷新 */}
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-slate-900">USDT 理财金库</h2>
              <p className="mt-1 text-sm text-slate-500">
                将 USDT 存入金库，按链上利率自动计息，可随时取出。
              </p>
            </div>
            {isConnected && (
              <button
                onClick={refresh}
                type="button"
                className="inline-flex items-center cursor-pointer rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm hover:bg-slate-50 active:scale-[0.98]"
              >
                刷新资产
              </button>
            )}
          </div>

          {/* 未连接提示 */}
          {!isConnected && (
            <div className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
              当前未连接钱包，连接后可查看金库资产并进行存取操作。
            </div>
          )}

          {/* 概览统计 */}
          <VaultStats
            userUsdtBalance={userUsdtBalance}
            userVaultBalance={userVaultBalance}
            totalAssets={totalAssets}
            apyDisplay={apyDisplay}
            decimals={decimals}
            showAdvanced={showAdvanced}
            currentIndex={currentIndex}
            onToggleAdvanced={() => setShowAdvanced((v) => !v)}
            isConnected={isConnected}
          />

          {/* 存入 / 取出 */}
          <div className="grid gap-4 md:grid-cols-2">
            <DepositForm
              onDeposit={handleDeposit}
              isPending={isPending}
              isConnected={isConnected}
              userUsdtBalance={userUsdtDisplay}
            />

            <WithdrawForm
              onWithdraw={handleWithdraw}
              isPending={isPending}
              isConnected={isConnected}
              userVaultBalance={userVaultDisplay}
            />
          </div>

          {/* 交易状态条 */}
          {txStatus && (
            <div className="mt-4 rounded-xl bg-slate-900/90 px-3 py-2 text-xs text-slate-50">
              {txStatus}
            </div>
          )}
        </section>
      </div>
    </section>
  );
};

export default VaultPage;
