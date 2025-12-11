import { usePublicClient } from 'wagmi';

/**
 * 等待交易确认的 Hook
 * 封装 publicClient.waitForTransactionReceipt 调用
 * 统一处理交易确认逻辑，默认等待 1 个确认
 */
export function useWaitForTransaction() {
  const publicClient = usePublicClient();

  /**
   * 等待交易收据
   * @param hash 交易哈希
   * @param confirmations 确认数，默认 1
   * @throws 如果 publicClient 不可用或交易失败
   */
  const waitForReceipt = async (hash: `0x${string}`, confirmations = 1) => {
    if (!publicClient) {
      throw new Error('Public client not available');
    }

    return await publicClient.waitForTransactionReceipt({
      hash,
      confirmations,
    });
  };

  return { waitForReceipt };
}
