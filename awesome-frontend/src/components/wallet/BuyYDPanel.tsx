import { useConfirmDialog } from '@components/common/ConfirmDialog';
import { useToast } from '@components/common/Toast';
import { YD_SALE_ADDRESS, ydSaleAbi } from '@contracts';
import { useWaitForTransaction } from '@hooks/useWaitForTransaction';
import { formatErrorMessage, isUserRejected } from '@utils/errorHandler';
import { useCallback, useEffect, useState } from 'react';
import { formatUnits, parseEther } from 'viem';
import { useConnection, usePublicClient, useWriteContract } from 'wagmi';

interface BuyYDPanelProps {
  onBuySuccess?: () => void;
}

const BuyYDPanel = ({ onBuySuccess }: BuyYDPanelProps) => {
  const { address, isConnected } = useConnection();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const { waitForReceipt } = useWaitForTransaction();
  const { showSuccess, showError, showWarning, ToastComponent } = useToast();
  const { confirm, DialogComponent } = useConfirmDialog();

  const [rate, setRate] = useState<bigint | null>(null);
  const [ethInput, setEthInput] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ 用 useCallback 包一层，让 loadRate 在依赖不变时保持稳定引用
  const loadRate = useCallback(async () => {
    if (!publicClient) return;

    try {
      const r = (await publicClient.readContract({
        address: YD_SALE_ADDRESS,
        abi: ydSaleAbi,
        functionName: 'rate',
      })) as bigint;
      setRate(r);
    } catch (e) {
      console.error('loadRate error:', e);
    }
  }, [publicClient]);

  // ✅ 把 loadRate 放进依赖数组，lint 就不会再报错了
  useEffect(() => {
    if (isConnected) {
      void loadRate();
    }
  }, [isConnected, loadRate]);

  if (!isConnected) {
    return null;
  }

  let expectedYD = '';
  if (rate && ethInput) {
    try {
      const ethWei = parseEther(ethInput);
      const ydAmount = (ethWei * rate) / 10n ** 18n;
      expectedYD = formatUnits(ydAmount, 18);
    } catch {
      expectedYD = '';
    }
  }

  const handleBuy = async () => {
    if (!publicClient || !address || !rate) return;
    if (!ethInput) {
      showWarning('请输入 ETH 数量');
      return;
    }

    // 确认弹窗
    const confirmed = await confirm(
      '确认购买',
      `您将用 ${ethInput} ETH 购买 ${expectedYD} YD，确认继续？`,
      'info',
    );
    if (!confirmed) return;

    try {
      setLoading(true);
      const value = parseEther(ethInput);

      const hash = await writeContractAsync({
        address: YD_SALE_ADDRESS,
        abi: ydSaleAbi,
        functionName: 'buyWithEth',
        args: [],
        value,
      });

      await waitForReceipt(hash);

      showSuccess(`成功购买 ${expectedYD} YD`);
      setEthInput('');
      onBuySuccess?.();
    } catch (e) {
      console.error('buyWithEth error:', e);

      // 如果是用户取消，显示警告而非错误
      if (isUserRejected(e)) {
        showWarning(formatErrorMessage(e));
      } else {
        showError(`购买失败：${formatErrorMessage(e)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex h-full min-h-[280px] flex-col">
      {/* 标题 + 刷新汇率 */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="inline-block w-1.5 h-5 bg-gradient-to-b from-emerald-500 to-cyan-500 rounded-full"></span>
          购买 YD
        </h2>
        <button
          type="button"
          onClick={() => void loadRate()}
          className="inline-flex items-center cursor-pointer rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/15 hover:text-white hover:border-emerald-400/50 active:scale-95"
        >
          🔄 刷新
        </button>
      </div>

      {/* 主体内容 */}
      <div className="flex-1 space-y-4">
        {/* 当前汇率 */}
        <div className="rounded-lg bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 px-4 py-3">
          <div className="text-xs text-slate-300 mb-1">当前汇率</div>
          <div className="text-sm font-semibold text-emerald-400">
            {rate ? `1 ETH ≈ ${formatUnits(rate, 18)} YD` : '加载中...'}
          </div>
        </div>

        {/* 输入区 */}
        <div>
          <div className="mb-2 block text-sm font-medium text-slate-300">ETH 数量</div>
          <input
            className="w-full rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm px-4 py-3 text-sm text-white placeholder-slate-400 outline-none transition focus:border-emerald-400/50 focus:bg-white/10 disabled:opacity-50"
            placeholder="输入 ETH 数量"
            value={ethInput}
            onChange={(e) => setEthInput(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* 预计获得 + 按钮 */}
        <div className="space-y-3">
          {expectedYD ? (
            <div className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-4 py-2">
              <p className="text-xs text-slate-300">预计获得</p>
              <p className="text-lg font-bold text-cyan-400 mt-1">{expectedYD} YD</p>
            </div>
          ) : (
            <div className="text-center py-3">
              <span className="text-xs text-slate-400">💡 输入数量后将显示预计获得的 YD</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleBuy}
            disabled={loading || !ethInput}
            className="w-full h-12 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 text-sm font-bold text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-emerald-500/50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? '⏳ 处理中...' : '🚀 购买 YD'}
          </button>
        </div>
      </div>

      {/* Toast & Dialog */}
      <ToastComponent />
      <DialogComponent />
    </section>
  );
};

export default BuyYDPanel;
