import { TokenInput } from '@components/common/TokenInput';
import { useState } from 'react';
import { parseUnits } from 'viem';

interface WithdrawFormProps {
  onWithdraw: (amount: string) => Promise<void>;
  isPending: boolean;
  isConnected: boolean;
  userVaultBalance: bigint;
  decimals: number;
}

/**
 * 取款表单组件
 */
export const WithdrawForm = ({
  onWithdraw,
  isPending,
  isConnected,
  userVaultBalance,
  decimals,
}: WithdrawFormProps) => {
  const [amount, setAmount] = useState('');

  const handleSubmit = async () => {
    if (!amount || !isConnected) return;

    // 验证输入
    try {
      parseUnits(amount, decimals); // 检查是否能正确解析
    } catch {
      return; // 无效输入
    }

    await onWithdraw(amount);
    setAmount('');
  };

  return (
    <div className="rounded-xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 p-5 transition-all hover:border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-500/20">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-base">📤</span>
        <span className="text-sm font-semibold text-white">从金库取出</span>
      </div>

      <TokenInput
        value={amount}
        onChange={setAmount}
        balance={userVaultBalance}
        decimals={decimals}
        symbol="USDT"
        placeholder="例如 50"
        disabled={!isConnected}
        colorTheme="emerald"
      />

      <button
        onClick={handleSubmit}
        type="button"
        disabled={isPending || !isConnected || !amount}
        className="mt-4 w-full cursor-pointer rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-sm font-bold text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-emerald-500/50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
      >
        {isPending ? '⏳ 交易发送中...' : '💸 从金库取出'}
      </button>
    </div>
  );
};
