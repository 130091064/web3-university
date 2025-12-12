import logoPng from '@assets/logo.png';
import { NavLink } from 'react-router-dom';
import {
  useChainId,
  useConnect,
  useConnection,
  useConnectors,
  useDisconnect,
  useEnsAvatar,
  useEnsName,
  useSwitchChain,
} from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { navItems } from '../../navigation/navItems';

const shorten = (addr?: string) => (addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '');

const Header = () => {
  const { connect } = useConnect();
  const connectors = useConnectors();
  const { disconnect } = useDisconnect();
  const { address, isConnected, chainId: connectionChainId } = useConnection();

  // wagmi 当前链（可能是上次记录的）
  const wagmiChainId = useChainId();
  // 统一“真实链”：优先钱包连接上的链，再退回 wagmi 记录
  const activeChainId = connectionChainId ?? wagmiChainId;
  const { switchChainAsync } = useSwitchChain();

  const { data: ensName } = useEnsName({
    address,
    chainId: mainnet.id,
    query: { enabled: Boolean(address) },
  });

  const { data: ensAvatar } = useEnsAvatar({
    name: ensName!,
    chainId: mainnet.id,
    query: { enabled: Boolean(ensName) },
  });

  const activeConnector = connectors[0];

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

  const renderChainLabel = () => {
    // ❗ 没连接钱包时，统一展示“未连接”
    if (!isConnected || !activeChainId) return '未连接';
    if (activeChainId === sepolia.id) return 'Sepolia Testnet';
    if (activeChainId === mainnet.id) return 'Ethereum Mainnet';
    return `Chain ${activeChainId}`;
  };

  // 这两个状态只在“已连接钱包”时才有意义
  const isOnSepolia = isConnected && activeChainId === sepolia.id;
  const isWrongNetwork = isConnected && !!activeChainId && activeChainId !== sepolia.id;

  // 圆点颜色：未连接 → 灰色；已连 & 正常 → 绿；已连 & 错链 → 黄
  const networkDotClass = !isConnected
    ? 'bg-slate-300'
    : isOnSepolia
      ? 'bg-emerald-500'
      : 'bg-amber-500';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-900/80 backdrop-blur-xl shadow-lg shadow-blue-500/5">
      {/* 顶部发光线 */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500 to-transparent" />

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* 左侧：Logo + 导航 */}
        <div className="flex min-w-0 flex-1 items-center gap-8">
          <div className="flex shrink-0 items-center gap-3 text-lg font-bold tracking-tight">
            <div className="relative">
              <img src={logoPng} alt="Web3 大学" className="h-9 w-9 drop-shadow-lg" />
              <div className="absolute inset-0 h-9 w-9 rounded-full bg-blue-500/20 blur-md" />
            </div>
            <span className="gradient-text hidden sm:inline">Web3 大学</span>
          </div>

          <nav className="hidden flex-1 items-center gap-2 whitespace-nowrap text-sm md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.key}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  [
                    'inline-flex items-center rounded-lg px-4 py-2 font-medium transition-all duration-200',
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-lg shadow-blue-500/30'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white',
                  ].join(' ')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* 右侧：网络 + 钱包 */}
        <div className="flex shrink-0 items-center">
          <div
            className={[
              'flex h-10 items-center gap-3 rounded-xl px-4 text-xs font-medium backdrop-blur-md ring-1 transition-all',
              isWrongNetwork
                ? 'bg-amber-500/20 text-amber-300 ring-amber-500/30'
                : 'bg-white/10 text-slate-300 ring-white/10 hover:bg-white/15',
            ].join(' ')}
          >
            {/* 网络指示器 */}
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${networkDotClass} animate-pulse`} />
              <span className="text-xs font-medium">{renderChainLabel()}</span>
            </div>

            {/* 错链警告 */}
            {isWrongNetwork && (
              <>
                <span className="hidden text-xs text-amber-300 sm:inline">⚠️ 不支持</span>
                <button
                  onClick={handleSwitchToSepolia}
                  type="button"
                  className="rounded-lg bg-amber-500 px-3 py-1 text-xs font-semibold text-white shadow-lg transition hover:bg-amber-600 hover:shadow-amber-500/30"
                >
                  切换网络
                </button>
              </>
            )}

            {/* 分隔线 */}
            <span className="mx-1 h-5 w-px bg-white/20" />

            {/* 钱包连接状态 */}
            {!isConnected ? (
              <button
                onClick={handleConnect}
                disabled={!activeConnector}
                type="button"
                className="group cursor-pointer relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-500 to-violet-500 px-4 py-1.5 text-xs font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-blue-500/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="relative z-10">连接钱包</span>
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-blue-500 opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                {ensAvatar && (
                  <div className="relative">
                    <img
                      src={ensAvatar}
                      alt="avatar"
                      className="h-6 w-6 rounded-full object-cover ring-2 ring-blue-500/50"
                    />
                  </div>
                )}
                <span className="max-w-[100px] truncate text-xs font-semibold text-white">
                  {ensName ?? shorten(address)}
                </span>
                <button
                  onClick={() => disconnect()}
                  type="button"
                  className="rounded-lg cursor-pointer bg-white/10 px-2 py-1 text-xs text-slate-300 transition hover:bg-white/20 hover:text-white"
                >
                  断开
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
