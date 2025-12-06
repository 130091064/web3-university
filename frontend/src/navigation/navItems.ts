export type NavItem = {
  key: string;
  path: string;
  label: string;
};

export const navItems: NavItem[] = [
  { key: 'dashboard', path: '/', label: '资产概览 & 兑换 YD' },
  { key: 'courses', path: '/courses', label: '课程平台' },
  { key: 'swap', path: '/swap', label: 'YD 兑换 USDT' },
  { key: 'vault', path: '/vault', label: 'USDT 理财金库' },
  { key: 'me', path: '/me', label: '我的账户 / 已购课程' },
];
