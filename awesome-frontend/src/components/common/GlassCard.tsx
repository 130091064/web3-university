import type { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

/**
 * 毛玻璃卡片组件 - 科技感设计
 * @param hover - 是否启用悬浮效果
 * @param glow - 是否启用发光效果
 */
export const GlassCard = ({
  children,
  className = '',
  hover = false,
  glow = false,
}: GlassCardProps) => {
  return (
    <div
      className={[
        'rounded-2xl bg-white/5 backdrop-blur-md',
        'border border-white/10',
        'shadow-xl shadow-black/5',
        hover && 'card-hover cursor-pointer',
        glow && 'glow-effect',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
};
