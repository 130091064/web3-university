interface WalletSectionProps {
  address?: string;
  ydBalance?: string;
  isConnected: boolean;
  onRefresh?: () => void;
}

const shorten = (addr?: string) => (addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '');

export const WalletSection = ({
  address,
  ydBalance,
  isConnected,
  onRefresh,
}: WalletSectionProps) => {
  return (
    <section className="flex h-full min-h-[280px] flex-col">
      {/* 头部 */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="inline-block w-1.5 h-5 bg-gradient-to-b from-blue-500 to-violet-500 rounded-full"></span>
            钱包 & 资产概览
          </h2>
          {isConnected ? (
            <p className="text-sm text-slate-300">
              钱包地址：
              <span className="font-mono text-blue-400 ml-1">{shorten(address)}</span>
            </p>
          ) : (
            <p className="text-sm text-slate-300">连接钱包后即可查看你的链上资产</p>
          )}
        </div>

        {isConnected && onRefresh && (
          <button
            onClick={onRefresh}
            type="button"
            className="inline-flex items-center cursor-pointer rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/15 hover:text-white hover:border-blue-400/50 active:scale-95"
          >
            🔄 刷新
          </button>
        )}
      </div>

      {/* 主体内容 */}
      {isConnected && (
        <div className="flex-1">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* YD 余额卡片 */}
            <div className="group rounded-xl bg-gradient-to-br from-blue-500/10 to-violet-500/10 backdrop-blur-sm border border-blue-500/20 p-4 transition-all hover:border-blue-400/40 hover:shadow-lg hover:shadow-blue-500/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-300">YD 余额</span>
                <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-blue-300 border border-blue-500/30">
                  平台代币
                </span>
              </div>
              <p className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                {ydBalance ?? '0'}
              </p>
              <div className="mt-2 text-xs text-slate-400">YD Token</div>
            </div>

            {/* 统计占位卡片 */}
            <div className="rounded-xl border border-dashed border-white/10 bg-white/5 backdrop-blur-sm p-4 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl mb-2">📊</div>
                <p className="text-xs text-slate-300 font-medium">更多资产统计</p>
                <p className="text-[10px] text-slate-400 mt-1">USDT 余额、课程收益等</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
