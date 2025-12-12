import { TokenInput } from '@components/common/TokenInput';
import { useState } from 'react';
import { parseUnits } from 'viem';

interface DepositFormProps {
  onDeposit: (amount: string) => Promise<void>;
  isPending: boolean;
  isConnected: boolean;
  userUsdtBalance: bigint;
  decimals: number;
}

/**
 * 存款表单组件
 */
export const DepositForm = ({
  onDeposit,
  isPending,
  isConnected,
  userUsdtBalance,
  decimals,
}: DepositFormProps) => {
  const [amount, setAmount] = useState('');

  const handleSubmit = async () => {
    if (!amount || !isConnected) return;

    // 验证输入
    try {
      parseUnits(amount, decimals); // 检查是否能正确解析
    } catch {
      return; // 无效输入
    }

    await onDeposit(amount);
    setAmount('');
  };

  return (
    <div className="rounded-xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 p-5 transition-all hover:border-blue-400/50 hover:shadow-lg hover:shadow-blue-500/20">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-base">📥</span>
        <span className="text-sm font-semibold text-white">存入 USDT</span>
      </div>

      <TokenInput
        value={amount}
        onChange={setAmount}
        balance={userUsdtBalance}
        decimals={decimals}
        symbol="USDT"
        placeholder="例如 100"
        disabled={!isConnected}
        colorTheme="blue"
      />

      <button
        onClick={handleSubmit}
        type="button"
        disabled={isPending || !isConnected || !amount}
        className="mt-4 w-full cursor-pointer rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-3 text-sm font-bold text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-blue-500/50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
      >
        {isPending ? '⏳ 交易发送中...' : '🚀 存入金库'}
      </button>
    </div>
  );
};
