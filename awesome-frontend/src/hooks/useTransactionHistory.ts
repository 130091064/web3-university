import { useCallback, useEffect, useState } from 'react';

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'swap' | 'buyYD' | 'purchase';
  amount: string;
  token: string;
  timestamp: number;
  txHash?: string;
  status: 'pending' | 'success' | 'failed';
  details?: string;
}

const STORAGE_KEY = 'web3_transaction_history';
const MAX_HISTORY = 50; // 最多保存50条记录

export const useTransactionHistory = (address?: string) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // 从 localStorage 加载历史记录
  const loadHistory = useCallback(() => {
    if (!address) {
      setTransactions([]);
      return;
    }

    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${address.toLowerCase()}`);
      if (stored) {
        const parsed = JSON.parse(stored) as Transaction[];
        setTransactions(parsed);
      }
    } catch (e) {
      console.error('Failed to load transaction history:', e);
    }
  }, [address]);

  // 保存历史记录到 localStorage
  const saveHistory = useCallback(
    (txs: Transaction[]) => {
      if (!address) return;

      try {
        localStorage.setItem(`${STORAGE_KEY}_${address.toLowerCase()}`, JSON.stringify(txs));
      } catch (e) {
        console.error('Failed to save transaction history:', e);
      }
    },
    [address],
  );

  // 添加新交易
  const addTransaction = useCallback(
    (tx: Omit<Transaction, 'id' | 'timestamp'>) => {
      const newTx: Transaction = {
        ...tx,
        id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        timestamp: Date.now(),
      };

      setTransactions((prev) => {
        const updated = [newTx, ...prev].slice(0, MAX_HISTORY);
        saveHistory(updated);
        return updated;
      });

      return newTx.id;
    },
    [saveHistory],
  );

  // 更新交易状态
  const updateTransaction = useCallback(
    (id: string, updates: Partial<Transaction>) => {
      setTransactions((prev) => {
        const updated = prev.map((tx) => (tx.id === id ? { ...tx, ...updates } : tx));
        saveHistory(updated);
        return updated;
      });
    },
    [saveHistory],
  );

  // 清空历史记录
  const clearHistory = useCallback(() => {
    setTransactions([]);
    if (address) {
      localStorage.removeItem(`${STORAGE_KEY}_${address.toLowerCase()}`);
    }
  }, [address]);

  // 加载历史记录
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return {
    transactions,
    addTransaction,
    updateTransaction,
    clearHistory,
    loadHistory,
  };
};
