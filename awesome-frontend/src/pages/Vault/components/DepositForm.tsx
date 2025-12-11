import { useState } from 'react';

interface DepositFormProps {
  onDeposit: (amount: string) => Promise<void>;
  isPending: boolean;
  isConnected: boolean;
  userUsdtBalance: string;
}

/**
 * 存款表单组件
 */
export const DepositForm = ({
  onDeposit,
  isPending,
  isConnected,
  userUsdtBalance,
}: DepositFormProps) => {
  const [amount, setAmount] = useState('');

  const handleSubmit = async () => {
    if (!amount) return;
    await onDeposit(amount);
    setAmount('');
  };

  return (
    <div className="rounded-xl bg-white/90 p-4 shadow-sm ring-1 ring-slate-100">
      <div className="mb-2 flex items-center justify-between text-sm font-medium text-slate-900">
        <span>存入 USDT</span>
        <span className="text-[11px] text-slate-500">可用：{userUsdtBalance} USDT</span>
      </div>
      <input
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-100"
        placeholder="例如 100"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button
        onClick={handleSubmit}
        type="button"
        disabled={isPending || !isConnected}
        className="mt-3 w-full rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isPending ? '交易发送中...' : '存入金库'}
      </button>
    </div>
  );
};
