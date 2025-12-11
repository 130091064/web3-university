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
    <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">
      <p className="text-sm font-medium text-slate-700">钱包信息</p>

      <div className="mt-3 flex items-center gap-3">
        {ensAvatar && (
          <img
            src={ensAvatar}
            alt="ENS Avatar"
            className="h-10 w-10 rounded-full border border-slate-200 object-cover"
          />
        )}

        <div className="space-y-1 text-sm text-slate-700">
          <div>
            <span className="text-slate-500">当前地址：</span>
            <span className="font-mono">{shortenAddress(address)}</span>
          </div>
          {ensName && (
            <div>
              <span className="text-slate-500">ENS：</span>
              <span>{ensName}</span>
            </div>
          )}
          <div>
            <span className="text-slate-500">当前网络：</span>
            <span>ChainId {chainId}</span>
          </div>
          <div>
            <span className="text-slate-500">当前昵称：</span>
            <span className="font-medium">{displayNickname}</span>
          </div>
          {profileUpdatedAt && (
            <div>
              <span className="text-slate-500">最近签名：</span>
              <span>{new Date(profileUpdatedAt).toLocaleString()}</span>
            </div>
          )}
          {isLoadingProfile && <p className="pt-1 text-xs text-slate-400">正在加载昵称信息…</p>}
          {remoteError && <p className="pt-1 text-xs text-amber-600">{remoteError}</p>}
        </div>
      </div>
    </div>
  );
};
