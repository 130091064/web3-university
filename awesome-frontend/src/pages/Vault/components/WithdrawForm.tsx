import { useState } from 'react';

interface WithdrawFormProps {
  onWithdraw: (amount: string) => Promise<void>;
  isPending: boolean;
  isConnected: boolean;
  userVaultBalance: string;
}

/**
 * 取款表单组件
 */
export const WithdrawForm = ({
  onWithdraw,
  isPending,
  isConnected,
  userVaultBalance,
}: WithdrawFormProps) => {
  const [amount, setAmount] = useState('');

  const handleSubmit = async () => {
    if (!amount) return;
    await onWithdraw(amount);
    setAmount('');
  };

  return (
    <div className="rounded-xl bg-white/90 p-4 shadow-sm ring-1 ring-slate-100">
      <div className="mb-2 flex items-center justify-between text-sm font-medium text-slate-900">
        <span>从金库取出</span>
        <span className="text-[11px] text-slate-500">可取：{userVaultBalance} USDT</span>
      </div>
      <input
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-100"
        placeholder="例如 50"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button
        onClick={handleSubmit}
        type="button"
        disabled={isPending || !isConnected}
        className="mt-3 w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isPending ? '交易发送中...' : '从金库取出'}
      </button>
    </div>
  );
};
