import { LearningFlowBar } from '@components/LearningFlowBar';
import { erc20Abi, YD_TOKEN_ADDRESS, YD_USDT_SWAP_ADDRESS, ydUsdtSwapAbi } from '@contracts';
import { useCallback, useEffect, useState } from 'react';
import { formatUnits, parseUnits } from 'viem';
import { useConnection, usePublicClient, useWriteContract } from 'wagmi';

const SwapPage = () => {
  const { address, isConnected } = useConnection();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

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

  useEffect(() => {
    if (isConnected) {
      refresh();
    }
  }, [isConnected, refresh]);

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
    if (!inputYd) return;

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
        await publicClient.waitForTransactionReceipt({
          hash: approveHash,
          confirmations: 1,
        });
      }

      const swapHash = await writeContractAsync({
        address: YD_USDT_SWAP_ADDRESS,
        abi: ydUsdtSwapAbi,
        functionName: 'swapYdForUsdt',
        args: [ydAmount],
      });

      await publicClient.waitForTransactionReceipt({
        hash: swapHash,
        confirmations: 1,
      });

      setInputYd('');
      await refresh();
    } catch (e) {
      console.error('swapYdForUsdt error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl bg-white/90 p-4 shadow-sm ring-1 ring-slate-100 sm:p-6">
      <div className="space-y-4">
        {/* ✅ 页面级主副标题（新增） */}
        <div>
          <h1 className="text-xl font-semibold text-slate-900">资产兑换</h1>
          <p className="mt-1 text-sm text-slate-500">基于链上合约的 YD 与 USDT 实时兑换。</p>
        </div>

        <LearningFlowBar currentStep={4} />

        {/* ✅ 你原有的兑换卡片：保持不变 */}
        {!isConnected || !address ? (
          <section className="rounded-2xl bg-slate-50/80 p-4 shadow-sm ring-1 ring-slate-100 sm:p-5">
            <h2 className="text-base font-semibold text-slate-900">YD 兑换 USDT</h2>
            <p className="mt-2 text-sm text-slate-500">请在页面顶部连接钱包后进行兑换。</p>
          </section>
        ) : (
          <section className="rounded-2xl bg-slate-50/80 p-4 shadow-sm ring-1 ring-slate-100 sm:p-5">
            {/* 标题 + 刷新 */}
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">YD 兑换 USDT</h2>
                <p className="mt-1 text-xs text-slate-500">将课程收入中的 YD 按汇率兑换为 USDT。</p>
              </div>
              <button
                onClick={refresh}
                type="button"
                className="inline-flex items-center cursor-pointer rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm hover:bg-slate-50 active:scale-[0.98]"
              >
                刷新汇率
              </button>
            </div>

            {/* 余额 & 汇率 */}
            <div className="mb-4 space-y-1 text-xs">
              <p className="text-slate-600">
                可用 YD：
                <span className="font-mono text-slate-800">{formatUnits(ydBalance, 18)} YD</span>
              </p>
              <p className="text-slate-500">
                当前汇率：{' '}
                <span className="font-medium text-slate-800">
                  {rate ? `1 YD ≈ ${formatUnits(rate, 6)} USDT` : '加载中...'}
                </span>
              </p>
            </div>

            {/* 输入 + 预计获得 + 按钮 */}
            <div className="space-y-3">
              <div>
                <div className="mb-1 block text-xs text-slate-500">想要兑换的 YD 数量</div>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-200"
                  placeholder="例如：100"
                  value={inputYd}
                  onChange={(e) => setInputYd(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                {expectedUsdt ? (
                  <p className="text-[11px] text-slate-500">
                    预计获得：
                    <span className="font-medium text-slate-700">{expectedUsdt} USDT</span>
                  </p>
                ) : (
                  <span className="text-[11px] text-slate-400">
                    输入数量后将显示预计获得的 USDT。
                  </span>
                )}

                <button
                  onClick={handleSwap}
                  type="button"
                  disabled={loading || !inputYd}
                  className="h-10 w-36 shrink-0 rounded-xl bg-indigo-500 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {loading ? '兑换处理中......' : '兑换为 USDT'}
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </section>
  );
};

export default SwapPage;
