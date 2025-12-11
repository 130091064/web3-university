import { YD_SALE_ADDRESS, ydSaleAbi } from '@contracts';
import { useWaitForTransaction } from '@hooks/useWaitForTransaction';
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
    if (!ethInput) return;

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

      setEthInput('');
      onBuySuccess?.();
    } catch (e) {
      console.error('buyWithEth error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex h-full min-h-[260px] flex-col rounded-2xl bg-slate-50/60 p-4 shadow-sm ring-1 ring-slate-100 sm:p-5">
      {/* 标题 + 刷新汇率 */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-slate-900">购买 YD</h2>
        <button
          type="button"
          onClick={() => void loadRate()}
          className="inline-flex items-center cursor-pointer rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm hover:bg-slate-50"
        >
          刷新汇率
        </button>
      </div>

      {/* 主体内容，用 flex-1 撑开 */}
      <div className="flex-1">
        {/* 当前汇率 */}
        <div className="mb-3 text-xs text-slate-600">
          当前汇率：
          <span className="font-medium">
            {rate ? `1 ETH ≈ ${formatUnits(rate, 18)} YD` : '加载中...'}
          </span>
        </div>

        {/* 输入区 + 预计数量 + 按钮 */}
        <div className="space-y-3">
          <div>
            <div className="mb-1 block text-xs text-slate-500">ETH 数量</div>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-200"
              placeholder="输入 ETH 数量"
              value={ethInput}
              onChange={(e) => setEthInput(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            {expectedYD ? (
              <p className="text-[11px] text-slate-500">
                预计获得：
                <span className="font-medium text-slate-700">{expectedYD} YD</span>
              </p>
            ) : (
              <span className="text-[11px] text-slate-400">输入数量后将显示预计获得的 YD。</span>
            )}

            <button
              type="button"
              onClick={handleBuy}
              disabled={loading || !ethInput}
              className="h-10 w-32 shrink-0 rounded-xl bg-emerald-500 px-4 text-sm font-medium text-white shadow-sm hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {loading ? '处理中...' : '购买 YD'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BuyYDPanel;
