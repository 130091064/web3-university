import { shortenAddress } from '@utils';

interface WalletInfoCardProps {
  address?: string;
  ensName?: string;
  ensAvatar?: string | null;
  chainId: number;
  displayNickname: string;
  profileUpdatedAt?: number;
  isLoadingProfile: boolean;
  remoteError?: string | null;
}

/**
 * 钱包信息卡片
 */
export const WalletInfoCard = ({
  address,
  ensName,
  ensAvatar,
  chainId,
  displayNickname,
  profileUpdatedAt,
  isLoadingProfile,
  remoteError,
}: WalletInfoCardProps) => {
  return (
    <div className="rounded-xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 p-5 transition-all hover:border-blue-400/50 hover:shadow-lg hover:shadow-blue-500/20">
      <p className="text-sm font-semibold text-white flex items-center gap-2">
        <span className="text-base">💼</span>
        钱包信息
      </p>

      <div className="mt-4 flex items-center gap-3">
        {ensAvatar && (
          <img
            src={ensAvatar}
            alt="ENS Avatar"
            className="h-12 w-12 rounded-full border-2 border-cyan-400/50 object-cover shadow-lg"
          />
        )}

        <div className="space-y-1.5 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">当前地址：</span>
            <span className="font-mono text-cyan-400">{shortenAddress(address)}</span>
          </div>
          {ensName && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400">ENS：</span>
              <span className="text-blue-400">{ensName}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-slate-400">当前网络：</span>
            <span className="text-slate-300">ChainId {chainId}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">当前昵称：</span>
            <span className="font-medium text-white">{displayNickname}</span>
          </div>
          {profileUpdatedAt && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400">最近签名：</span>
              <span className="text-slate-300 text-xs">
                {new Date(profileUpdatedAt).toLocaleString()}
              </span>
            </div>
          )}
          {isLoadingProfile && <p className="pt-1 text-xs text-slate-400">正在加载昵称信息…</p>}
          {remoteError && <p className="pt-1 text-xs text-amber-400">{remoteError}</p>}
        </div>
      </div>
    </div>
  );
};
