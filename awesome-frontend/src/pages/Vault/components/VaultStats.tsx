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
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm border border-blue-500/20 p-4 transition-all hover:border-blue-400/40 hover:shadow-lg hover:shadow-blue-500/20">
          <div className="text-xs text-slate-300 mb-2">💰 钱包 USDT 余额</div>
          <div className="text-xl font-bold text-blue-400">{userUsdtDisplay}</div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 backdrop-blur-sm border border-violet-500/20 p-4 transition-all hover:border-violet-400/40 hover:shadow-lg hover:shadow-violet-500/20">
          <div className="text-xs text-slate-300 mb-2">🏛️ 金库持仓</div>
          <div className="text-xl font-bold text-violet-400">{userVaultDisplay}</div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 backdrop-blur-sm border border-emerald-500/20 p-4 transition-all hover:border-emerald-400/40 hover:shadow-lg hover:shadow-emerald-500/20">
          <div className="text-xs text-slate-300 mb-2">📦 金库总资产 (USDT)</div>
          <div className="text-xl font-bold text-emerald-400">{totalAssetsDisplay}</div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-pink-500/10 to-rose-500/10 backdrop-blur-sm border border-pink-500/20 p-4 transition-all hover:border-pink-400/40 hover:shadow-lg hover:shadow-pink-500/20">
          <div className="text-xs text-slate-300 mb-2 flex items-center gap-1">
            📈 年化利率 (APY)
            <span className="cursor-help" title="APY = 年化收益率，根据链上实时利率计算">
              ❓
            </span>
          </div>
          <div className="text-xl font-bold text-pink-400">{apyDisplay}</div>
          <div className="text-xs text-slate-400 mt-1">每日自动复利</div>
        </div>
      </div>

      {/* 高级数据折叠 */}
      {isConnected && (
        <div className="mb-5 text-xs">
          <button
            type="button"
            onClick={onToggleAdvanced}
            className="inline-flex cursor-pointer items-center gap-1 text-slate-400 transition hover:text-cyan-400"
          >
            {showAdvanced ? '▼ 隐藏高级数据' : '▶ 查看高级数据'}
          </button>
          {showAdvanced && (
            <div className="mt-3 rounded-lg bg-white/5 border border-white/10 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Liquidity Index</span>
                <span className="font-mono text-cyan-400">{indexDisplay}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">预估日收益</span>
                <span className="font-medium text-emerald-400">
                  {apyDisplay !== '-'
                    ? `≈ ${(parseFloat(apyDisplay.replace('%', '')) / 365).toFixed(4)}%`
                    : '-'}
                </span>
              </div>
              <div className="pt-2 border-t border-white/10 text-xs text-slate-400">
                💡 收益会自动计入您的金库份额，随时可取出本金+收益
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
