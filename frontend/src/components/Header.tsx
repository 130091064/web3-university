import React from "react";
import {
  useConnect,
  useConnectors,
  useDisconnect,
  useConnection,
  useEnsName,
  useEnsAvatar,
  useSwitchChain,
  useChainId,
} from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";

const shorten = (addr?: string) =>
  addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

const Header: React.FC = () => {
  const { connect } = useConnect();
  const connectors = useConnectors();
  const { disconnect } = useDisconnect();
  const { address, isConnected } = useConnection();
  const { data: ensName } = useEnsName({
    address,
    chainId: mainnet.id,
    enabled: Boolean(address),
  });
  const { data: ensAvatar } = useEnsAvatar({
    name: ensName!,
    chainId: mainnet.id,
    enabled: Boolean(ensName),
  });

  const chainId = useChainId();
  const { chains, switchChainAsync } = useSwitchChain();

  const activeConnector = connectors[0]; // 简单用第一个 injected（MetaMask）

  const handleConnect = () => {
    if (!activeConnector) return;
    connect({ connector: activeConnector });
  };

  const handleSwitchToSepolia = async () => {
    try {
      await switchChainAsync?.({ chainId: sepolia.id });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-sky-200/70 bg-gradient-to-r from-sky-100 via-sky-200 to-blue-200 backdrop-blur shadow-xl shadow-sky-200/50">
      <div className="max-w-6xl mx-auto flex flex-col gap-3 px-4 sm:px-6 lg:px-8 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
            My Courses
          </p>
          <div className="text-xl font-semibold text-slate-900">Web3 大学</div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-slate-700">
          {/* 当前网络 */}
          <div className="text-xs text-slate-500">
            网络：
            {chainId === sepolia.id
              ? "Sepolia"
              : chainId === mainnet.id
              ? "Mainnet"
              : `Chain ${chainId}`}
          </div>

          {/* 切换到 Sepolia 按钮（如果当前不是） */}
          {chainId !== sepolia.id && (
            <button
              className="px-3 py-1.5 rounded-full border border-sky-100 bg-sky-50/80 text-xs text-sky-700 hover:bg-sky-100 transition-colors"
              onClick={handleSwitchToSepolia}
            >
              切到 Sepolia
            </button>
          )}

          {/* 连接 / 已连接 状态 */}
          {!isConnected ? (
            <button
              className="px-4 py-2 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 text-sm font-semibold text-white shadow-lg shadow-sky-200/70 disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={handleConnect}
              disabled={!activeConnector}
            >
              连接钱包
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white/70 text-slate-700 shadow-sm">
              {ensAvatar && (
                <img
                  src={ensAvatar}
                  alt="avatar"
                  className="w-6 h-6 rounded-full object-cover"
                />
              )}
              <span className="text-sm">
                {ensName ?? shorten(address)}
              </span>
              <button
                onClick={() => disconnect()}
                className="ml-1 text-xs rounded-full border border-slate-200 px-2 py-0.5 text-slate-500 hover:bg-slate-50"
              >
                断开
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
