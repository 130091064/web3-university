import { useConfirmDialog } from '@components/common/ConfirmDialog';
import { LearningFlowBar } from '@components/common/LearningFlowBar';
import { useToast } from '@components/common/Toast';
import { TokenInput } from '@components/common/TokenInput';
import TransactionHistory from '@components/common/TransactionHistory';
import { erc20Abi, YD_TOKEN_ADDRESS, YD_USDT_SWAP_ADDRESS, ydUsdtSwapAbi } from '@contracts';
import { useAutoRefresh } from '@hooks/useAutoRefresh';
import { useTransactionHistory } from '@hooks/useTransactionHistory';
import { useWaitForTransaction } from '@hooks/useWaitForTransaction';
import { useWalletStatus } from '@hooks/useWalletStatus';
import { formatErrorMessage, isUserRejected } from '@utils/errorHandler';
import { useCallback, useEffect, useState } from 'react';
import { formatUnits, parseUnits } from 'viem';
import { usePublicClient, useWriteContract } from 'wagmi';

const SwapPage = () => {
  const { address, isConnected, isWrongNetwork } = useWalletStatus();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const { waitForReceipt } = useWaitForTransaction();
  const { showSuccess, showError, showWarning, ToastComponent } = useToast();
  const { confirm, DialogComponent } = useConfirmDialog();
  const { transactions, addTransaction, updateTransaction, clearHistory } =
    useTransactionHistory(address);

  const [ydBalance, setYdBalance] = useState<bigint>(0n);
  const [rate, setRate] = useState<bigint | null>(null);
  const [inputYd, setInputYd] = useState('');
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!publicClient || !address) return;

    try {
      const [bal, r] = await Promise.all([
        publicClient.readContract({
          address: YD_TOKEN_ADDRESS,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [address],
        }) as Promise<bigint>,
        publicClient.readContract({
          address: YD_USDT_SWAP_ADDRESS,
          abi: ydUsdtSwapAbi,
          functionName: 'rateUsdtPerYd',
        }) as Promise<bigint>,
      ]);

      setYdBalance(bal);
      setRate(r);
    } catch (e) {
      console.error('refresh swap data error:', e);
    }
  }, [publicClient, address]);

  // 首次加载
  useEffect(() => {
    if (isConnected) {
      refresh();
    }
  }, [isConnected, refresh]);

  // 自动刷新（每30秒）
  const manualRefresh = useAutoRefresh(refresh, {
    enabled: isConnected && !isWrongNetwork,
    interval: 30000,
  });

  // 预计获得的 USDT
  let expectedUsdt = '';
  if (rate && inputYd) {
    try {
      const ydAmount = parseUnits(inputYd, 18);
      const usdtOut = (ydAmount * rate) / 10n ** 18n;
      expectedUsdt = formatUnits(usdtOut, 6);
    } catch {
      expectedUsdt = '';
    }
  }

  const handleSwap = async () => {
    if (!publicClient || !address || !rate) return;
    if (!inputYd) {
      showWarning('请输入兑换数量');
      return;
    }
    if (isWrongNetwork) {
      showError('当前网络暂不支持兑换，请切换到 Sepolia Testnet 后再试。');
      return;
    }

    // 确认弹窗
    const confirmed = await confirm(
      '确认兑换',
      `您将用 ${inputYd} YD 兑换 ${expectedUsdt} USDT，确认继续？`,
      'info',
    );
    if (!confirmed) return;

    // 添加待处理交易记录
    const txId = addTransaction({
      type: 'swap',
      amount: inputYd,
      token: 'YD',
      status: 'pending',
      details: `兑换 ${expectedUsdt} USDT`,
    });

    try {
      setLoading(true);

      const ydAmount = parseUnits(inputYd, 18);

      const allowance = (await publicClient.readContract({
        address: YD_TOKEN_ADDRESS,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [address, YD_USDT_SWAP_ADDRESS],
      })) as bigint;

      if (allowance < ydAmount) {
        const approveHash = await writeContractAsync({
          address: YD_TOKEN_ADDRESS,
          abi: erc20Abi,
          functionName: 'approve',
          args: [YD_USDT_SWAP_ADDRESS, ydAmount],
        });
        await waitForReceipt(approveHash);
      }

      const swapHash = await writeContractAsync({
        address: YD_USDT_SWAP_ADDRESS,
        abi: ydUsdtSwapAbi,
        functionName: 'swapYdForUsdt',
        args: [ydAmount],
      });

      await waitForReceipt(swapHash);

      // 更新交易为成功
      updateTransaction(txId, {
        status: 'success',
        txHash: swapHash,
      });

      showSuccess(`成功兑换 ${expectedUsdt} USDT`);
      setInputYd('');
      await refresh();
    } catch (e) {
      console.error('swapYdForUsdt error:', e);

      // 如果是用户取消，不记录为失败
      if (isUserRejected(e)) {
        updateTransaction(txId, {
          status: 'failed',
        });
        showWarning(formatErrorMessage(e));
      } else {
        // 更新交易为失败
        updateTransaction(txId, {
          status: 'failed',
        });
        showError(`兑换失败：${formatErrorMessage(e)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="space-y-2 animate-slide-up">
        <h1 className="text-3xl font-bold gradient-text">资产兑换</h1>
        <p className="text-slate-300">基于链上合约的 YD 与 USDT 实时兑换</p>
      </div>

      <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <LearningFlowBar currentStep={4} />
      </div>

      {/* 兑换卡片 */}
      <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
        {!isConnected || !address ? (
          <section className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/20 p-6 shadow-2xl">
            <div className="text-center space-y-3">
              <div className="text-4xl">🔄</div>
              <h2 className="text-lg font-bold text-white">YD 兑换 USDT</h2>
              <p className="text-sm text-slate-300">请在页面顶部连接钱包后进行兑换</p>
            </div>
          </section>
        ) : isWrongNetwork ? (
          <section className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/20 p-6 shadow-2xl">
            <div className="text-center space-y-3">
              <div className="text-4xl">⚠️</div>
              <h2 className="text-lg font-bold text-white">网络错误</h2>
              <p className="text-sm text-amber-300">
                当前网络暂不支持兑换功能，请在顶部切换到 Sepolia Testnet 后再试。
              </p>
            </div>
          </section>
        ) : (
          <section className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/20 p-6 shadow-2xl">
            {/* 标题 + 刷新 */}
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="inline-block w-1.5 h-5 bg-gradient-to-b from-emerald-500 to-cyan-500 rounded-full"></span>
                  YD 兑换 USDT
                </h2>
                <p className="mt-1 text-sm text-slate-300">将课程收入中的 YD 按汇率兑换为 USDT</p>
              </div>
              <button
                onClick={manualRefresh}
                type="button"
                className="inline-flex items-center cursor-pointer rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/15 hover:text-white hover:border-emerald-400/50 active:scale-95"
              >
                🔄 刷新汇率
              </button>
            </div>

            {/* 余额 & 汇率 */}
            <div className="mb-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-gradient-to-r from-blue-500/10 to-violet-500/10 border border-blue-500/20 px-4 py-3">
                <div className="text-xs text-slate-300 mb-1">可用 YD</div>
                <div className="text-base font-bold text-blue-400 font-mono">
                  {formatUnits(ydBalance, 18)} YD
                </div>
              </div>
              <div className="rounded-lg bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 px-4 py-3">
                <div className="text-xs text-slate-300 mb-1">当前汇率</div>
                <div className="text-sm font-semibold text-emerald-400">
                  {rate ? `1 YD ≈ ${formatUnits(rate, 6)} USDT` : '加载中...'}
                </div>
              </div>
            </div>

            {/* 输入 + 预计获得 + 按钮 */}
            <div className="space-y-4">
              <TokenInput
                value={inputYd}
                onChange={setInputYd}
                balance={ydBalance}
                decimals={18}
                symbol="YD"
                label="想要兑换的 YD 数量"
                placeholder="例如：100"
                disabled={loading}
                colorTheme="emerald"
              />

              {expectedUsdt ? (
                <div className="space-y-2">
                  <div className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-4 py-3">
                    <p className="text-xs text-slate-300">预计获得</p>
                    <p className="text-lg font-bold text-cyan-400 mt-1">{expectedUsdt} USDT</p>
                  </div>

                  {/* 汇率详情 */}
                  {rate && (
                    <div className="rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-xs text-slate-300 space-y-1">
                      <div className="flex items-center justify-between">
                        <span>兑换汇率</span>
                        <span className="font-medium text-slate-200">
                          1 YD = {formatUnits(rate, 6)} USDT
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>预估Gas费</span>
                        <span className="font-medium text-amber-400">≈ 0.001 ETH</span>
                      </div>
                      <div className="pt-1 border-t border-white/10 text-slate-400 text-xs">
                        💡 实际到账取决于交易确认时的链上汇率
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-3">
                  <span className="text-xs text-slate-400">💡 输入数量后将显示预计获得的 USDT</span>
                </div>
              )}

              <button
                onClick={handleSwap}
                type="button"
                disabled={loading || !inputYd}
                className="w-full h-12 cursor-pointer rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 text-sm font-bold text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-emerald-500/50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? '⏳ 兑换处理中...' : '🔄 兑换为 USDT'}
              </button>
            </div>
          </section>
        )}
      </div>

      {/* 交易历史 */}
      {isConnected && transactions.length > 0 && (
        <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <TransactionHistory transactions={transactions} onClear={clearHistory} />
        </div>
      )}

      {/* Toast & Dialog */}
      <ToastComponent />
      <DialogComponent />
    </div>
  );
};

export default SwapPage;
