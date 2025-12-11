import { useChainId, useConnection } from 'wagmi';
import { sepolia } from 'wagmi/chains';

/**
 * 钱包连接状态检查 Hook
 * 统一处理钱包连接、网络检查等逻辑
 */
export function useWalletStatus(targetChainId?: number) {
  const connection = useConnection();
  const globalChainId = useChainId();

  const address = connection.address;
  const chainId = connection.chainId ?? globalChainId;
  const isConnected = Boolean(address);

  // 默认检查 Sepolia 网络
  const targetChain = targetChainId ?? sepolia.id;
  const isOnTargetChain = chainId === targetChain;
  const isWrongNetwork = isConnected && !isOnTargetChain;

  return {
    address,
    chainId,
    isConnected,
    isOnTargetChain,
    isWrongNetwork,
    status: connection.status,
  };
}
