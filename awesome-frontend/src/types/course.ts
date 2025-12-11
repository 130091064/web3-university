import type { Address } from 'viem';

/**
 * 链上课程数据结构
 */
export interface Course {
  id: bigint;
  author: Address;
  price: bigint;
  metadataURI: string;
  isActive: boolean;
  studentCount: bigint;
  createdAt: bigint;
}

/**
 * UI 展示用的课程数据结构（包含额外状态）
 */
export interface UICourse {
  id: bigint;
  author: Address;
  price: bigint;
  metadataURI: string;
  isActive: boolean;
  studentCount?: bigint;
  createdAt?: bigint;
  isAuthor: boolean;
  hasPurchased: boolean;
}
