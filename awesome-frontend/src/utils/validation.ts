/**
 * 判断字符串是否为 http(s) URL
 * @param value 待检查的字符串
 * @returns 是否为 URL
 */
export function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

/**
 * 验证以太坊地址格式
 * @param address 地址字符串
 * @returns 是否为有效地址
 */
export function isValidAddress(address?: string): boolean {
  if (!address) return false;
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}
