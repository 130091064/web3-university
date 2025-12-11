import { formatTokenAmount } from '@utils';

interface VaultStatsProps {
  userUsdtBalance: bigint | null;
  userVaultBalance: bigint | null;
  totalAssets: bigint | null;
  apyDisplay: string;
  decimals: number;
  showAdvanced: boolean;
  currentIndex: bigint | null;
  onToggleAdvanced: () => void;
  isConnected: boolean;
}

/**
 * 金库资产统计卡片
 */
export const VaultStats = ({
  userUsdtBalance,
  userVaultBalance,
  totalAssets,
  apyDisplay,
  decimals,
  showAdvanced,
  currentIndex,
  onToggleAdvanced,
  isConnected,
}: VaultStatsProps) => {
  const userUsdtDisplay = formatTokenAmount(userUsdtBalance, decimals);
  const userVaultDisplay = formatTokenAmount(userVaultBalance, decimals);
  const totalAssetsDisplay = formatTokenAmount(totalAssets, decimals);
  const indexDisplay = currentIndex ? String(currentIndex) : '-';

  return (
    <>
      {/* 概览统计 */}
      <div className="mb-4 grid gap-3 md:grid-cols-4">
        <div className="rounded-xl bg-white/90 p-3 shadow-sm ring-1 ring-slate-100">
          <div className="text-xs text-slate-500">钱包 USDT 余额</div>
          <div className="mt-2 text-lg font-semibold text-slate-900">{userUsdtDisplay}</div>
        </div>
        <div className="rounded-xl bg-white/90 p-3 shadow-sm ring-1 ring-slate-100">
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
            onClick={onToggleAdvanced}
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
    </>
  );
};
