interface ProfileCardProps {
  isConnected: boolean;
  nicknameInput: string;
  onNicknameChange: (value: string) => void;
  onSave: () => void;
  isSigning: boolean;
  isSyncingRemote: boolean;
  profileNickname?: string;
  signError?: Error | null;
}

/**
 * 昵称设置卡片
 */
export const ProfileCard = ({
  isConnected,
  nicknameInput,
  onNicknameChange,
  onSave,
  isSigning,
  isSyncingRemote,
  profileNickname,
  signError,
}: ProfileCardProps) => {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">
      <p className="text-sm font-medium text-slate-700">昵称设置（链上签名）</p>

      <div className="mt-3 space-y-3 text-sm">
        <div className="flex flex-col gap-2">
          <div className="text-xs text-slate-500">昵称（签名后将与当前地址绑定）</div>
          <input
            className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none ring-0 transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
            placeholder="例如：Web3 学习者"
            value={nicknameInput}
            onChange={(e) => onNicknameChange(e.target.value)}
            disabled={!isConnected || isSigning}
          />
        </div>

        <button
          type="button"
          onClick={onSave}
          disabled={!isConnected || !nicknameInput.trim() || isSigning}
          className="inline-flex h-9 cursor-pointer items-center justify-center rounded-xl bg-sky-500 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSigning ? '签名中…' : isSyncingRemote ? '同步云端中…' : '签名并保存昵称'}
        </button>

        {profileNickname && (
          <p className="text-xs text-slate-500">
            已签名昵称：
            <span className="font-medium">{profileNickname}</span>
          </p>
        )}

        {signError && <p className="text-xs text-red-500">签名失败：{signError.message}</p>}
      </div>
    </div>
  );
};
