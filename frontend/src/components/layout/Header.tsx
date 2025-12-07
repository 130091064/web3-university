import { NavLink } from "react-router-dom";
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
import { navItems } from "../../navigation/navItems";
import logoPng from "@assets/logo.png";

const shorten = (addr?: string) =>
  addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

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
    if (!isConnected || !activeChainId) return "未连接";
    if (activeChainId === sepolia.id) return "Sepolia Testnet";
    if (activeChainId === mainnet.id) return "Ethereum Mainnet";
    return `Chain ${activeChainId}`;
  };

  // 这两个状态只在“已连接钱包”时才有意义
  const isOnSepolia = isConnected && activeChainId === sepolia.id;
  const isWrongNetwork =
    isConnected && !!activeChainId && activeChainId !== sepolia.id;

  // 圆点颜色：未连接 → 灰色；已连 & 正常 → 绿；已连 & 错链 → 黄
  const networkDotClass = !isConnected
    ? "bg-slate-300"
    : isOnSepolia
    ? "bg-emerald-500"
    : "bg-amber-500";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-sky-200/70 bg-linear-to-r from-sky-50 via-sky-100 to-blue-100/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* 左侧：Logo + 顶部导航 */}
        <div className="flex min-w-0 flex-1 items-center gap-6">
          <div className="flex shrink-0 items-center gap-2 text-lg font-semibold tracking-tight text-slate-900">
            <img src={logoPng} alt="Web3 大学" className="h-8 w-8" />
            <span>Web3 大学</span>
          </div>

          <nav className="hidden flex-1 items-center gap-1 whitespace-nowrap text-sm md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.key}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  [
                    "inline-flex items-center rounded-full px-3.5 py-1.5 transition-colors",
                    isActive
                      ? "bg-linear-to-r from-sky-500 to-indigo-500 text-white shadow-sm"
                      : "text-slate-600 hover:bg-white/60 hover:text-slate-900",
                  ].join(" ")
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* 右侧：网络 + 钱包合并状态框 */}
        <div className="flex shrink-0 items-center">
          <div
            className={[
              "flex h-9 items-center gap-2 rounded-full px-3 text-xs font-medium shadow-sm ring-1",
              isWrongNetwork
                ? "bg-amber-50/95 text-amber-800 ring-amber-200"
                : "bg-white/90 text-slate-600 ring-slate-100",
            ].join(" ")}
          >
            {/* 网络小圆点 */}
            <span className={`h-2 w-2 rounded-full ${networkDotClass}`} />

            {/* 网络文案 */}
            <span
              className={
                isWrongNetwork
                  ? "text-[11px] text-amber-800"
                  : "text-[11px] text-slate-500"
              }
            >
              {renderChainLabel()}
            </span>

            {/* 错链时的提醒 + 一键切换（仅已连接时） */}
            {isWrongNetwork && (
              <>
                <span className="hidden text-[11px] text-amber-700 sm:inline">
                  未支持
                </span>
                <button
                  onClick={handleSwitchToSepolia}
                  className="ml-1 cursor-pointer rounded-full bg-amber-500 px-2 py-0.5 text-[11px] text-white hover:bg-amber-600"
                >
                  切到 Sepolia
                </button>
              </>
            )}

            {/* 分隔线 */}
            <span className="mx-1 h-4 w-px bg-slate-200/70" />

            {/* 钱包区 */}
            {!isConnected ? (
              <button
                onClick={handleConnect}
                disabled={!activeConnector}
                className="rounded-full bg-linear-to-r from-sky-500 to-indigo-500 px-3 py-1 text-[11px] font-semibold text-white shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                连接钱包
              </button>
            ) : (
              <div className="flex items-center gap-2">
                {ensAvatar && (
                  <img
                    src={ensAvatar}
                    alt="avatar"
                    className="h-5 w-5 rounded-full object-cover"
                  />
                )}
                <span className="max-w-[120px] truncate text-[11px] text-slate-800">
                  {ensName ?? shorten(address)}
                </span>
                <button
                  onClick={() => disconnect()}
                  className="ml-1 cursor-pointer rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600 hover:bg-slate-200"
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
