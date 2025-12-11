import { LearningFlowBar } from '@components/LearningFlowBar';
import { AAVE_VAULT_ADDRESS, aaveVaultAbi, MOCK_USDT_ADDRESS, mockUSDTAbi } from '@contracts';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatUnits, parseUnits } from 'viem';
import { useConnection, usePublicClient, useWriteContract } from 'wagmi';

const USDT_DECIMALS = 6;

// 金额格式化：保留 4 位，再去掉多余 0，纯整数时显示带千位分隔的整数
function formatTokenAmount(value: bigint | null, decimals: number) {
  if (value === null) return '-';
  try {
    const asStr = formatUnits(value, decimals); // e.g. "1099400.0"
    const num = Number(asStr);
    if (Number.isNaN(num)) return asStr;

    const fixed = num.toFixed(4); // "1099400.0000"
    if (fixed.endsWith('.0000')) {
      return Math.round(num).toLocaleString();
    }
    // 去掉末尾多余 0，比如 "900.1950" -> "900.195"
    const trimmed = fixed.replace(/0+$/, '').replace(/\.$/, '');
    const [intPart, decimalPart] = trimmed.split('.');
    return decimalPart
      ? `${Number(intPart).toLocaleString()}.${decimalPart}`
      : Number(intPart).toLocaleString();
  } catch {
    return '-';
  }
}

const VaultPage = () => {
  const { address, status } = useConnection();
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending } = useWriteContract();

  const isConnected = status === 'connected' && !!address;

  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [userUsdtBalance, setUserUsdtBalance] = useState<bigint | null>(null);
  const [userVaultBalance, setUserVaultBalance] = useState<bigint | null>(null);
  const [totalAssets, setTotalAssets] = useState<bigint | null>(null);
  const [currentIndex, setCurrentIndex] = useState<bigint | null>(null);
  const [liquidityRate, setLiquidityRate] = useState<bigint | null>(null);

  const refresh = useCallback(async () => {
    if (!publicClient || !address || !isConnected) return;

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
      console.error('refresh failed:', err);
    }
  }, [publicClient, address, isConnected]);

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

  const userUsdtDisplay = useMemo(
    () => formatTokenAmount(userUsdtBalance, USDT_DECIMALS),
    [userUsdtBalance],
  );

  const userVaultDisplay = useMemo(
    () => formatTokenAmount(userVaultBalance, USDT_DECIMALS),
    [userVaultBalance],
  );

  const totalAssetsDisplay = useMemo(
    () => formatTokenAmount(totalAssets, USDT_DECIMALS),
    [totalAssets],
  );

  const apyDisplay = useMemo(() => {
    if (!liquidityRate) return '-';
    const RAY = 1e27;
    const apy = (Number(liquidityRate) / RAY) * 100;
    return `${apy.toFixed(2)}%`;
  }, [liquidityRate]);

  const indexDisplay = useMemo(() => (currentIndex ? String(currentIndex) : '-'), [currentIndex]);

  async function handleDeposit() {
    if (!address) {
      setTxStatus('请先连接钱包');
      return;
    }
    if (!depositAmount) {
      setTxStatus('请输入存入金额');
      return;
    }

    try {
      const parsed = parseUnits(depositAmount, USDT_DECIMALS);

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
      setDepositAmount('');
      await refresh();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : '存入失败';
      setTxStatus(`存入失败：${message}`);
    }
  }

  async function handleWithdraw() {
    if (!address) {
      setTxStatus('请先连接钱包');
      return;
    }
    if (!withdrawAmount) {
      setTxStatus('请输入取出金额');
      return;
    }

    try {
      const parsed = parseUnits(withdrawAmount, USDT_DECIMALS);

      setTxStatus('正在发送取出交易（withdraw）...');
      await writeContractAsync({
        address: AAVE_VAULT_ADDRESS,
        abi: aaveVaultAbi,
        functionName: 'withdraw',
        args: [parsed],
      });

      setTxStatus('取出成功');
      setWithdrawAmount('');
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
          <div className="mb-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-xl bg-white/90 p-3 shadow-sm ring-1 ring-slate-100">
              <div className="text-xs text-slate-500">钱包 USDT 余额</div>
              <div className="mt-2 text-lg font-semibold text-slate-900">{userUsdtDisplay}</div>
            </div>
            <div className="rounded-xl bg白/90 p-3 shadow-sm ring-1 ring-slate-100">
              <div className="text-xs text-slate-500">金库持仓</div>
              <div className="mt-2 text-lg font-semibold text-slate-900">{userVaultDisplay}</div>
            </div>
            <div className="rounded-xl bg-white/90 p-3 shadow-sm ring-1 ring-slate-100">
              <div className="text-xs text-slate-500">金库总资产（USDT）</div>
              <div className="mt-2 text-lg font-semibold text-slate-900">{totalAssetsDisplay}</div>
            </div>
            <div className="rounded-xl bg-white/90 p-3 shadow-sm ring-1 ring-slate-100">
              <div className="text-xs text-slate-500">当前年化利率（APY）</div>
              <div className="mt-2 text-lg font-semibold text-slate-900">{apyDisplay}</div>
            </div>
          </div>

          {/* 高级数据折叠 */}
          {isConnected && (
            <div className="mb-4 text-[11px] text-slate-400">
              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className="inline-flex cursor-pointer items-center gap-1 underline-offset-2 hover:text-slate-600 hover:underline"
              >
                {showAdvanced ? '隐藏高级数据' : '查看高级数据'}
              </button>
              {showAdvanced && (
                <p className="mt-1 font-mono text-[11px] text-slate-500">
                  liquidityIndex: {indexDisplay}
                </p>
              )}
            </div>
          )}

          {/* 存入 / 取出 */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* 存入 */}
            <div className="rounded-xl bg-white/90 p-4 shadow-sm ring-1 ring-slate-100">
              <div className="mb-2 flex items-center justify-between text-sm font-medium text-slate-900">
                <span>存入 USDT</span>
                <span className="text-[11px] text-slate-500">可用：{userUsdtDisplay} USDT</span>
              </div>
              <input
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-100"
                placeholder="例如 100"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
              />
              <button
                onClick={handleDeposit}
                type="button"
                disabled={isPending || !isConnected}
                className="mt-3 w-full rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isPending ? '交易发送中...' : '存入金库'}
              </button>
            </div>

            {/* 取出 */}
            <div className="rounded-xl bg-white/90 p-4 shadow-sm ring-1 ring-slate-100">
              <div className="mb-2 flex items-center justify-between text-sm font-medium text-slate-900">
                <span>从金库取出</span>
                <span className="text-[11px] text-slate-500">可取：{userVaultDisplay} USDT</span>
              </div>
              <input
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-100"
                placeholder="例如 50"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
              />
              <button
                onClick={handleWithdraw}
                type="button"
                disabled={isPending || !isConnected}
                className="mt-3 w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isPending ? '交易发送中...' : '从金库取出'}
              </button>
            </div>
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
