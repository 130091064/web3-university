import React from "react";

interface WalletSectionProps {
  address?: string;
  ydBalance?: string;
  isConnected: boolean;
  onRefresh?: () => void;
}

const shorten = (addr?: string) =>
  addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

export const WalletSection: React.FC<WalletSectionProps> = ({
  address,
  ydBalance,
  isConnected,
  onRefresh,
}) => {
  return (
    <section className="flex h-full min-h-[260px] flex-col rounded-2xl bg-slate-50/80 p-4 shadow-sm ring-1 ring-slate-100 sm:p-5">
      {/* 头部 */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-slate-900">
            钱包 & 资产概览
          </h2>
          {isConnected ? (
            <p className="text-xs text-slate-500">
              钱包地址：
              <span className="font-mono text-slate-700">
                {shorten(address)}
              </span>
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              连接钱包后即可查看你的链上资产。
            </p>
          )}
        </div>

        {isConnected && onRefresh && (
          <button
            onClick={onRefresh}
            className="inline-flex items-center cursor-pointer rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 active:scale-[0.98]"
          >
            刷新资产
          </button>
        )}
      </div>

      {/* 主体内容：用 flex-1 把内容往下撑，让卡片高度更接近右侧 */}
      {isConnected && (
        <div className="mt-4 flex-1">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* YD 余额卡片 */}
            <div className="rounded-xl bg-white/90 p-3 shadow-sm ring-1 ring-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">
                  YD 余额
                </span>
                <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] text-sky-700">
                  平台代币
                </span>
              </div>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                {ydBalance ?? "0"}
              </p>
            </div>

            {/* 统计占位卡片 */}
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-400">
              预留统计位，可扩展显示 USDT 余额、课程收益等数据。
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
