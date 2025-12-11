// 简单的时间格式化：YYYY-MM-DD HH:mm
export const formatDateTime = (ts?: bigint) => {
  if (!ts || ts === 0n) return '';
  const d = new Date(Number(ts) * 1000); // 合约里是秒，这里转毫秒
  const pad = (n: number) => n.toString().padStart(2, '0');
  const Y = d.getFullYear();
  const M = pad(d.getMonth() + 1);
  const D = pad(d.getDate());
  const h = pad(d.getHours());
  const m = pad(d.getMinutes());
  return `${Y}-${M}-${D} ${h}:${m}`;
};
