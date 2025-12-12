import type { ProfileSource } from '@hooks/useProfile';
import { shortenAddress } from '@utils';

interface ProfileSignatureDisplayProps {
  profile: {
    address: string;
    nickname: string;
    signature: string;
  } | null;
  profileSource: ProfileSource;
}

/**
 * 身份签名标识展示组件
 */
export const ProfileSignatureDisplay = ({
  profile,
  profileSource,
}: ProfileSignatureDisplayProps) => {
  // 云端 / 本地 来源文案
  let profileSourceLabel = '尚未签名';
  let profileSourceBadgeClass = 'bg-slate-700 text-slate-200 border border-slate-500/60';

  if (profile) {
    if (profileSource === 'remote') {
      profileSourceLabel = '已同步云端 KV';
      profileSourceBadgeClass = 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/60';
    } else if (profileSource === 'local') {
      profileSourceLabel = '仅本地签名';
      profileSourceBadgeClass = 'bg-amber-500/20 text-amber-100 border border-amber-400/60';
    } else {
      profileSourceLabel = '签名来源未知';
      profileSourceBadgeClass = 'bg-slate-700 text-slate-200 border border-slate-500/60';
    }
  }

  const signatureShort = profile?.signature
    ? `${profile.signature.slice(0, 10)}...${profile.signature.slice(-10)}`
    : '';

  return (
    <div className="rounded-xl bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-md border border-cyan-500/30 p-5 shadow-xl">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-sm font-bold text-cyan-400 flex items-center gap-2">
          <span className="text-base">🔐</span>
          身份签名标识
        </p>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${profileSourceBadgeClass}`}
        >
          ● {profileSourceLabel}
        </span>
      </div>

      {profile ? (
        <div className="mt-4 space-y-2">
          <p className="text-sm text-slate-300">
            地址：
            <span className="font-mono text-cyan-400 ml-1">{shortenAddress(profile.address)}</span>
          </p>
          <p className="text-sm text-slate-300">
            昵称：<span className="text-white font-medium ml-1">{profile.nickname}</span>
          </p>
          {signatureShort && (
            <p className="text-xs text-slate-400">
              签名摘要：
              <span className="font-mono ml-1">{signatureShort}</span>
            </p>
          )}
          <p className="mt-3 text-xs text-slate-400 leading-relaxed">
            💡 昵称变更需要重新发起钱包签名。云端 KV 仅保存签名结果，不接触你的私钥。
          </p>
        </div>
      ) : (
        <p className="mt-4 text-xs text-slate-400 leading-relaxed">
          ⚠️
          还没有签名昵称。完成一次「签名并保存昵称」后，这里会生成你的身份标识，并显示是「仅本地签名」还是「已同步云端
          KV」。
        </p>
      )}
    </div>
  );
};
