import { formatUnits } from 'viem';

/**
 * 缩短地址显示
 * @param addr 完整地址
 * @returns 缩短后的地址，如 "0x1234...5678"
 */
export function shortenAddress(addr?: string): string {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

/**
 * 金额格式化：保留 4 位小数，去掉多余的 0，纯整数时显示带千位分隔
 * @param value bigint 金额
 * @param decimals 小数位数
 * @returns 格式化后的字符串
 */
export function formatTokenAmount(value: bigint | null, decimals: number): string {
  if (value === null) return '-';

  try {
    const asStr = formatUnits(value, decimals);
    const num = Number(asStr);

    if (Number.isNaN(num)) return asStr;

    const fixed = num.toFixed(4);

    // 如果是纯整数（.0000），返回带千位分隔的整数
    if (fixed.endsWith('.0000')) {
      return Math.round(num).toLocaleString();
    }

    // 去掉末尾多余的 0，如 "900.1950" -> "900.195"
    const trimmed = fixed.replace(/0+$/, '').replace(/\.$/, '');
    const [intPart, decimalPart] = trimmed.split('.');

    return decimalPart
      ? `${Number(intPart).toLocaleString()}.${decimalPart}`
      : Number(intPart).toLocaleString();
  } catch {
    return '-';
  }
}

/**
 * 格式化百分比
 * @param value 数值
 * @param decimals 保留小数位
 * @returns 格式化后的百分比字符串，如 "3.45%"
 */
export function formatPercentage(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * 格式化时间戳为可读日期时间
 * @param ts Unix 时间戳（秒，bigint 类型）
 * @returns 格式化后的日期时间字符串，如 "2024-01-15 14:30"
 */
export function formatDateTime(ts?: bigint): string {
  if (!ts || ts === 0n) return '';
  const d = new Date(Number(ts) * 1000); // 合约里是秒，这里转毫秒
  const pad = (n: number) => n.toString().padStart(2, '0');
  const Y = d.getFullYear();
  const M = pad(d.getMonth() + 1);
  const D = pad(d.getDate());
  const h = pad(d.getHours());
  const m = pad(d.getMinutes());
  return `${Y}-${M}-${D} ${h}:${m}`;
}
