import type { Address } from 'viem';

/**
 * 用户个人资料
 */
export interface UserProfile {
  address: Address;
  ensName?: string;
  avatar?: string;
  bio?: string;
  email?: string;
  twitter?: string;
  github?: string;
}

/**
 * 个人资料来源类型
 */
export type ProfileSource = 'none' | 'remote' | 'local';
