import type { Transaction } from '@hooks/useTransactionHistory';
import { useState } from 'react';

interface TransactionHistoryProps {
  transactions: Transaction[];
  onClear?: () => void;
}

const TransactionHistory = ({ transactions, onClear }: TransactionHistoryProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (transactions.length === 0) {
    return null;
  }

  // 交易类型映射
  const getTypeLabel = (type: Transaction['type']) => {
    const typeMap = {
      deposit: '💰 存入',
      withdraw: '💸 取出',
      swap: '🔄 兑换',
      buyYD: '🚀 购买',
      purchase: '🛒 购买课程',
    };
    return typeMap[type] || type;
  };

  // 状态映射
  const getStatusBadge = (status: Transaction['status']) => {
    const statusMap = {
      pending: { text: '⏳ 处理中', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
      success: {
        text: '✅ 成功',
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      },
      failed: { text: '❌ 失败', color: 'text-red-400 bg-red-500/10 border-red-500/30' },
    };
    return statusMap[status];
  };

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    // 小于1分钟
    if (diff < 60000) return '刚刚';
    // 小于1小时
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    // 小于24小时
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    // 其他情况显示日期
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const displayedTransactions = isExpanded ? transactions : transactions.slice(0, 3);

  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/20 p-4 shadow-2xl">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <span className="inline-block w-1 h-4 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></span>
          交易历史 ({transactions.length})
        </h3>
        {onClear && transactions.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-slate-400 hover:text-red-400 transition cursor-pointer"
          >
            清空
          </button>
        )}
      </div>

      {/* 交易列表 */}
      <div className="space-y-2">
        {displayedTransactions.map((tx) => {
          const statusBadge = getStatusBadge(tx.status);
          return (
            <div
              key={tx.id}
              className="rounded-lg bg-white/5 border border-white/10 p-3 hover:bg-white/10 transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {/* 类型 + 金额 */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white">{getTypeLabel(tx.type)}</span>
                    <span className="text-sm font-bold text-cyan-400">
                      {tx.amount} {tx.token}
                    </span>
                  </div>

                  {/* 时间 + 详情 */}
                  <div className="text-xs text-slate-400">
                    {formatTime(tx.timestamp)}
                    {tx.details && <span className="ml-2">· {tx.details}</span>}
                  </div>

                  {/* 交易哈希 */}
                  {tx.txHash && (
                    <a
                      href={`https://sepolia.etherscan.io/tx/${tx.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 transition inline-flex items-center gap-1 mt-1"
                    >
                      查看交易 ↗
                    </a>
                  )}
                </div>

                {/* 状态标签 */}
                <span
                  className={`text-xs cursor-pointer font-medium px-2 py-1 rounded border ${statusBadge.color} whitespace-nowrap`}
                >
                  {statusBadge.text}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 展开/收起按钮 */}
      {transactions.length > 3 && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full mt-3 text-xs cursor-pointer text-slate-400 hover:text-white transition py-2 rounded-lg hover:bg-white/5"
        >
          {isExpanded ? '收起 ▲' : `查看更多 (${transactions.length - 3}) ▼`}
        </button>
      )}
    </div>
  );
};

export default TransactionHistory;
