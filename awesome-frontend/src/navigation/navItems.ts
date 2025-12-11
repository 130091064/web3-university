export type NavItem = {
  key: string;
  path: string;
  label: string;
};

export const navItems: NavItem[] = [
  { key: 'dashboard', path: '/', label: '资产概览' },
  { key: 'courses', path: '/courses', label: '课程市场' },
  { key: 'swap', path: '/swap', label: '资产兑换' },
  { key: 'vault', path: '/vault', label: '理财金库' },
  { key: 'me', path: '/me', label: '我的账户' },
];
