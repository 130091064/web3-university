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
    <div className="rounded-2xl bg-slate-900/95 p-4 text-xs text-slate-50 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-semibold text-sky-100">身份签名标识</p>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${profileSourceBadgeClass}`}
        >
          ● {profileSourceLabel}
        </span>
      </div>

      {profile ? (
        <>
          <p className="mt-2 text-slate-300">
            地址：
            <span className="font-mono">{shortenAddress(profile.address)}</span>
          </p>
          <p className="mt-1 text-slate-300">昵称：{profile.nickname}</p>
          {signatureShort && (
            <p className="mt-1 text-slate-400">
              签名摘要：
              <span className="font-mono">{signatureShort}</span>
            </p>
          )}
          <p className="mt-2 text-[11px] text-slate-400">
            昵称变更需要重新发起钱包签名。云端 KV 仅保存签名结果，不接触你的私钥。
          </p>
        </>
      ) : (
        <p className="mt-2 text-[11px] text-slate-400">
          还没有签名昵称。完成一次「签名并保存昵称」后，这里会生成你的身份标识，并显示是「仅本地签名」还是「已同步云端
          KV」。
        </p>
      )}
    </div>
  );
};
