/**
 * 错误处理工具函数
 */

/**
 * 检查是否为用户取消交易
 */
export const isUserRejected = (error: unknown): boolean => {
  if (!error) return false;

  const errorMessage =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  // 检查常见的用户取消关键词
  return (
    errorMessage.includes('user rejected') ||
    errorMessage.includes('user denied') ||
    errorMessage.includes('user cancelled') ||
    errorMessage.includes('user canceled') ||
    errorMessage.includes('transaction was rejected') ||
    errorMessage.includes('rejected the request')
  );
};

/**
 * 格式化错误信息，使其更加用户友好
 */
export const formatErrorMessage = (error: unknown): string => {
  // 如果是用户取消
  if (isUserRejected(error)) {
    return '您已取消此操作';
  }

  // 如果是Error对象
  if (error instanceof Error) {
    const message = error.message;

    // 处理一些常见的Web3错误
    if (message.includes('insufficient funds')) {
      return '余额不足，请检查账户余额';
    }
    if (message.includes('gas required exceeds')) {
      return 'Gas费用不足，请增加Gas上限';
    }
    if (message.includes('execution reverted')) {
      return '交易执行失败，请检查合约状态';
    }
    if (message.includes('nonce too low')) {
      return '交易nonce过低，请重试';
    }
    if (message.includes('replacement transaction underpriced')) {
      return '替换交易Gas价格过低';
    }
    if (message.includes('network')) {
      return '网络连接失败，请检查网络';
    }

    // 返回原始消息（去掉过长的技术细节）
    const shortMessage = message.split('\n')[0]; // 只取第一行
    if (shortMessage.length > 100) {
      return `${shortMessage.substring(0, 100)}...`;
    }
    return shortMessage;
  }

  // 其他情况
  return '操作失败，请重试';
};
