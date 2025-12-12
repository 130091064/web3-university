import { useConfirmDialog } from '@components/common/ConfirmDialog';
import { LearningFlowBar } from '@components/common/LearningFlowBar';
import { useToast } from '@components/common/Toast';
import TransactionHistory from '@components/common/TransactionHistory';
import { AAVE_VAULT_ADDRESS, aaveVaultAbi, MOCK_USDT_ADDRESS, mockUSDTAbi } from '@contracts';
import { useAutoRefresh } from '@hooks/useAutoRefresh';
import { useTransactionHistory } from '@hooks/useTransactionHistory';
import { useVaultAssets } from '@hooks/useVaultAssets';
import { useWalletStatus } from '@hooks/useWalletStatus';
import { formatErrorMessage, isUserRejected } from '@utils/errorHandler';
import { useState } from 'react';
import { parseUnits } from 'viem';
import { useWriteContract } from 'wagmi';
import { DepositForm } from './components/DepositForm';
import { VaultStats } from './components/VaultStats';
import { WithdrawForm } from './components/WithdrawForm';

const VaultPage = () => {
  const { address, isConnected, isWrongNetwork } = useWalletStatus();
  const { writeContractAsync, isPending } = useWriteContract();
  const { showSuccess, showError, showWarning, ToastComponent } = useToast();
  const { confirm, DialogComponent } = useConfirmDialog();
  const { transactions, addTransaction, updateTransaction, clearHistory } =
    useTransactionHistory(address);

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

  // 自动刷新（每30秒）
  const manualRefresh = useAutoRefresh(refresh, {
    enabled: isConnected && !isWrongNetwork,
    interval: 30000,
  });

  async function handleDeposit(depositAmount: string) {
    if (!address) {
      showWarning('请先连接钱包');
      return;
    }
    if (!depositAmount) {
      showWarning('请输入存入金额');
      return;
    }
    if (isWrongNetwork) {
      showError('当前网络暂不支持存入，请切换到 Sepolia Testnet 后再试。');
      return;
    }

    // 确认弹窗
    const confirmed = await confirm(
      '确认存入',
      `您将存入 ${depositAmount} USDT 到理财金库，确认继续？`,
      'info',
    );
    if (!confirmed) return;

    // 添加待处理交易记录
    const txId = addTransaction({
      type: 'deposit',
      amount: depositAmount,
      token: 'USDT',
      status: 'pending',
      details: '存入理财金库',
    });

    try {
      const parsed = parseUnits(depositAmount, decimals);

      const hash = await writeContractAsync({
        address: MOCK_USDT_ADDRESS,
        abi: mockUSDTAbi,
        functionName: 'approve',
        args: [AAVE_VAULT_ADDRESS, parsed],
      });

      await writeContractAsync({
        address: AAVE_VAULT_ADDRESS,
        abi: aaveVaultAbi,
        functionName: 'deposit',
        args: [parsed],
      });

      // 更新交易为成功
      updateTransaction(txId, {
        status: 'success',
        txHash: hash,
      });

      showSuccess(`成功存入 ${depositAmount} USDT`);
      await refresh();
    } catch (err) {
      console.error(err);

      // 如果是用户取消，不记录为失败
      if (isUserRejected(err)) {
        updateTransaction(txId, {
          status: 'failed',
        });
        showWarning(formatErrorMessage(err));
        return;
      }

      // 更新交易为失败
      updateTransaction(txId, {
        status: 'failed',
      });

      showError(`存入失败：${formatErrorMessage(err)}`);
    }
  }

  async function handleWithdraw(withdrawAmount: string) {
    if (!address) {
      showWarning('请先连接钱包');
      return;
    }
    if (!withdrawAmount) {
      showWarning('请输入取出金额');
      return;
    }
    if (isWrongNetwork) {
      showError('当前网络暂不支持取出，请切换到 Sepolia Testnet 后再试。');
      return;
    }

    // 确认弹窗
    const confirmed = await confirm(
      '确认取出',
      `您将从金库取出 ${withdrawAmount} USDT，确认继续？`,
      'warning',
    );
    if (!confirmed) return;

    // 添加待处理交易记录
    const txId = addTransaction({
      type: 'withdraw',
      amount: withdrawAmount,
      token: 'USDT',
      status: 'pending',
      details: '从理财金库取出',
    });

    try {
      const parsed = parseUnits(withdrawAmount, decimals);

      const hash = await writeContractAsync({
        address: AAVE_VAULT_ADDRESS,
        abi: aaveVaultAbi,
        functionName: 'withdraw',
        args: [parsed],
      });

      // 更新交易为成功
      updateTransaction(txId, {
        status: 'success',
        txHash: hash,
      });

      showSuccess(`成功取出 ${withdrawAmount} USDT`);
      await refresh();
    } catch (err) {
      console.error(err);

      // 如果是用户取消，不记录为失败
      if (isUserRejected(err)) {
        updateTransaction(txId, {
          status: 'failed',
        });
        showWarning(formatErrorMessage(err));
        return;
      }

      // 更新交易为失败
      updateTransaction(txId, {
        status: 'failed',
      });

      showError(`取出失败：${formatErrorMessage(err)}`);
    }
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="space-y-2 animate-slide-up">
        <h1 className="text-3xl font-bold gradient-text">理财金库</h1>
        <p className="text-slate-300">将 USDT 存入金库，按链上利率自动生息</p>
      </div>

      <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <LearningFlowBar currentStep={5} />
      </div>

      {/* 主内容区 */}
      <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <section className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/20 p-6 shadow-2xl">
          {/* 标题 + 简介 + 刷新 */}
          <div className="mb-6 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="inline-block w-1.5 h-5 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></span>
                USDT 理财金库
              </h2>
              <p className="mt-1 text-sm text-slate-300">
                将 USDT 存入金库，按链上利率自动计息，可随时取出
              </p>
            </div>
            {isConnected && (
              <button
                onClick={manualRefresh}
                type="button"
                className="inline-flex items-center cursor-pointer rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/15 hover:text-white hover:border-purple-400/50 active:scale-95"
              >
                🔄 刷新资产
              </button>
            )}
          </div>

          {/* 未连接提示 */}
          {!isConnected && (
            <div className="mb-5 rounded-xl bg-amber-500/10 border border-amber-500/30 backdrop-blur-sm px-4 py-3">
              <p className="text-sm text-amber-300">
                当前未连接钱包，连接后可查看金库资产并进行存取操作
              </p>
            </div>
          )}

          {/* 网络错误提示 */}
          {isConnected && isWrongNetwork && (
            <div className="mb-5 rounded-xl bg-red-500/10 border border-red-500/30 backdrop-blur-sm px-4 py-3">
              <p className="text-sm text-red-300">
                ⚠️ 当前网络暂不支持理财金库功能，请在顶部切换到 Sepolia Testnet 后再试。
              </p>
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
              userUsdtBalance={userUsdtBalance ?? 0n}
              decimals={decimals}
            />

            <WithdrawForm
              onWithdraw={handleWithdraw}
              isPending={isPending}
              isConnected={isConnected}
              userVaultBalance={userVaultBalance ?? 0n}
              decimals={decimals}
            />
          </div>

          {/* 交易历史 */}
          {isConnected && transactions.length > 0 && (
            <div className="mt-4">
              <TransactionHistory transactions={transactions} onClear={clearHistory} />
            </div>
          )}

          {/* Toast & Dialog */}
          <ToastComponent />
          <DialogComponent />
        </section>
      </div>
    </div>
  );
};

export default VaultPage;
