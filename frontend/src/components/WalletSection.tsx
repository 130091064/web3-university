import React from 'react';

interface WalletSectionProps {
  address?: string;
  ydBalance?: string;
  isConnected: boolean;
  onRefresh?: () => void;
}

const shorten = (addr?: string) =>
  addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

export const WalletSection: React.FC<WalletSectionProps> = ({ address, ydBalance, isConnected, onRefresh }) => {
  return (
    <section className="mb-6 rounded-3xl bg-linear-to-br from-white via-sky-50 to-blue-50/80 p-5 shadow-xl shadow-sky-100/80 ring-1 ring-sky-100/80">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">钱包 & 资产概览</h2>
          {isConnected ? (
            <>
              <p className="mt-1 text-sm text-slate-600 break-all">
                当前地址：<span className="font-mono">{shorten(address)}</span>
              </p>
              <p className="mt-1 text-sm text-slate-600">
                YD 余额：<span className="font-semibold">{ydBalance}</span>
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-slate-500">请先在页面顶部连接钱包。</p>
          )}
        </div>
        {isConnected && onRefresh && (
          <button
            onClick={onRefresh}
            className="rounded-xl bg-linear-to-r from-sky-400 to-cyan-400 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-cyan-200/80 transition hover:shadow-md active:scale-[0.98]"
          >
            刷新
          </button>
        )}
      </div>
    </section>
  );
};
