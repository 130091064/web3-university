import { formatUnits } from 'viem';

interface TokenInputProps {
  value: string;
  onChange: (value: string) => void;
  balance: bigint;
  decimals: number;
  symbol: string;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  colorTheme?: 'blue' | 'emerald' | 'violet';
}

/**
 * 通用Token输入组件
 * - 数字验证
 * - 余额检查
 * - 最大按钮
 * - 统一样式
 */
export const TokenInput = ({
  value,
  onChange,
  balance,
  decimals,
  symbol,
  placeholder = '输入数量',
  disabled = false,
  label,
  colorTheme = 'blue',
}: TokenInputProps) => {
  const balanceDisplay = formatUnits(balance, decimals);

  // 颜色主题映射
  const colorClasses = {
    blue: {
      focus: 'focus:border-blue-400/50',
      button: 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:shadow-blue-500/50',
    },
    emerald: {
      focus: 'focus:border-emerald-400/50',
      button: 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-emerald-500/50',
    },
    violet: {
      focus: 'focus:border-violet-400/50',
      button: 'bg-gradient-to-r from-violet-500 to-purple-500 hover:shadow-violet-500/50',
    },
  };

  const colors = colorClasses[colorTheme];

  // 处理输入变化 - 只允许数字和小数点
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;

    // 允许空值
    if (input === '') {
      onChange('');
      return;
    }

    // 只允许数字和一个小数点
    if (!/^\d*\.?\d*$/.test(input)) {
      return;
    }

    // 不允许多个小数点
    if ((input.match(/\./g) || []).length > 1) {
      return;
    }

    // 不允许以多个0开头（除非是0.xxx）
    if (/^0\d+/.test(input)) {
      return;
    }

    onChange(input);
  };

  // 设置最大值
  const handleMax = () => {
    if (disabled) return;
    onChange(balanceDisplay);
  };

  // 检查余额是否充足
  const isInsufficient = value && Number(value) > Number(balanceDisplay);

  return (
    <div className="flex flex-col gap-2">
      {/* 标签和余额 */}
      <div className="flex items-center justify-between">
        {label && <div className="text-sm font-medium text-slate-300">{label}</div>}
        <span className="text-xs text-slate-400">
          可用：<span className="text-white font-mono">{balanceDisplay}</span> {symbol}
        </span>
      </div>

      {/* 输入框 + 最大按钮 */}
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm px-4 py-3 pr-20 text-sm text-white placeholder-slate-400 outline-none transition ${colors.focus} focus:bg-white/10 disabled:opacity-50 ${
            isInsufficient ? 'border-red-400/50 bg-red-500/5' : ''
          }`}
        />
        <button
          type="button"
          onClick={handleMax}
          disabled={disabled}
          className="absolute cursor-pointer right-2 top-1/2 -translate-y-1/2 rounded-md bg-white/10 border border-white/20 px-3 py-1 text-xs font-medium text-slate-300 transition hover:bg-white/20 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          最大
        </button>
      </div>

      {/* 余额不足提示 */}
      {isInsufficient && <p className="text-xs text-red-400">⚠️ 余额不足</p>}
    </div>
  );
};
