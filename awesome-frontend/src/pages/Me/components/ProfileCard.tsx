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
    <div className="rounded-xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 p-5 transition-all hover:border-violet-400/50 hover:shadow-lg hover:shadow-violet-500/20">
      <p className="text-sm font-semibold text-white flex items-center gap-2">
        <span className="text-base">✍️</span>
        昵称设置（链上签名）
      </p>

      <div className="mt-4 space-y-4">
        <div className="flex flex-col gap-2">
          <div className="text-xs text-slate-300">昵称（签名后将与当前地址绑定）</div>
          <input
            className="rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm px-4 py-3 text-sm text-white placeholder-slate-400 outline-none transition focus:border-violet-400/50 focus:bg-white/10 disabled:opacity-50"
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
          className="w-full rounded-lg cursor-pointer bg-gradient-to-r from-violet-500 to-purple-500 px-4 py-3 text-sm font-bold text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-violet-500/50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        >
          {isSigning ? '⏳ 签名中…' : isSyncingRemote ? '🔄 同步云端中…' : '✅ 签名并保存昵称'}
        </button>

        {profileNickname && (
          <p className="text-xs text-slate-300">
            已签名昵称：
            <span className="font-medium text-violet-400 ml-1">{profileNickname}</span>
          </p>
        )}

        {signError && <p className="text-xs text-red-400">签名失败：{signError.message}</p>}
      </div>
    </div>
  );
};
