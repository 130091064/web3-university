import { useCourses } from '@hooks/useCourses';
import { useProfile } from '@hooks/useProfile';
import { usePurchasedCourses } from '@hooks/usePurchasedCourses';
import { useWalletStatus } from '@hooks/useWalletStatus';
import type { Course } from '@types';
import { shortenAddress } from '@utils';
import { useMemo, useState } from 'react';
import type { Address } from 'viem';
import { useEnsAvatar, useEnsName, useSignMessage } from 'wagmi';
import { ProfileCard } from './components/ProfileCard';
import { ProfileSignatureDisplay } from './components/ProfileSignatureDisplay';
import { PurchasedCoursesList } from './components/PurchasedCoursesList';
import { WalletInfoCard } from './components/WalletInfoCard';

const MePage = () => {
  const { address, chainId, isConnected, isWrongNetwork } = useWalletStatus();

  const MAINNET_CHAIN_ID = 1; // ENS 固定使用主网

  // ENS 信息（固定主网查询）
  const { data: ensName } = useEnsName({
    address,
    chainId: MAINNET_CHAIN_ID,
  });
  const ensNameString = typeof ensName === 'string' ? ensName : undefined;

  const { data: ensAvatar } = useEnsAvatar({
    name: ensNameString,
    chainId: MAINNET_CHAIN_ID,
  });

  // 使用 useProfile Hook 管理个人资料
  const {
    profile,
    isLoading: isLoadingProfile,
    remoteError,
    profileSource,
    saveLocal,
    syncToRemote,
  } = useProfile(address, ensNameString);

  const [nicknameInput, setNicknameInput] = useState('');
  const [isSyncingRemote, setIsSyncingRemote] = useState(false);

  // 签名修改昵称
  const {
    signMessage,
    isPending: isSigning,
    error: signError,
  } = useSignMessage({
    mutation: {
      async onSuccess(signature, variables) {
        if (!address) return;

        const message = String(variables?.message ?? '');
        const trimmedNickname = nicknameInput.trim();
        if (!trimmedNickname) return;

        const nextProfile = {
          address,
          nickname: trimmedNickname,
          signature,
          message,
          updatedAt: Date.now(),
        };

        // 本地缓存
        saveLocal(nextProfile);

        // 同步到云端
        setIsSyncingRemote(true);
        await syncToRemote(nextProfile);
        setIsSyncingRemote(false);
      },
    },
  });

  const handleSaveNickname = () => {
    if (!isConnected || !address) return;
    const value = nicknameInput.trim();
    if (!value) return;

    const message = [
      'Web3 大学 · 昵称签名确认',
      `地址: ${address}`,
      `新昵称: ${value}`,
      `时间戳: ${Date.now()}`,
    ].join('\n');

    signMessage({ message });
  };

  // 课程数据（全量课程列表）
  const { courses, loading: isCoursesLoading, error: coursesError } = useCourses();

  // 已购课程 ID 列表
  const userAddress = address as Address | undefined;
  const {
    ids: purchasedIds,
    loading: isPurchasedLoading,
    error: purchasedError,
  } = usePurchasedCourses(userAddress);

  // 统一处理「课程相关错误」的对用户文案
  const rawCourseError = coursesError || purchasedError;
  let friendlyCourseError: string | null = null;
  if (rawCourseError) {
    if (isWrongNetwork) {
      friendlyCourseError =
        '当前网络与课程合约所在网络不一致，请切换到顶部的 Sepolia Testnet 后再查看课程记录。';
    } else {
      friendlyCourseError = '加载课程记录失败，请稍后重试。';
    }
    console.error('MePage course error:', rawCourseError);
  }

  // 计算真正的「已购买课程」列表
  const myCourses: Course[] = useMemo(() => {
    if (!courses || !purchasedIds || purchasedIds.length === 0) return [];
    const idSet = new Set(purchasedIds.map((id) => id.toString()));
    return courses.filter((course) => idSet.has(course.id.toString()));
  }, [courses, purchasedIds]);

  // 显示用昵称：签名昵称 > ENS > 地址缩写
  const displayNickname = profile?.nickname || ensNameString || shortenAddress(address);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="space-y-2 animate-slide-up">
        <h1 className="text-3xl font-bold gradient-text">我的账户</h1>
        <p className="text-slate-300">管理你的链上身份，并查看学习资产与课程记录</p>
      </div>

      {/* 顶部：账户 & 昵称 */}
      <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/20 p-6 shadow-2xl">
          {!isConnected ? (
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 backdrop-blur-sm px-4 py-3">
              <p className="text-sm text-amber-300">请先在页面顶部连接钱包，再进入用户中心</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 第一行：钱包信息 + 昵称设置 */}
              <div className="grid gap-6 md:grid-cols-2">
                <WalletInfoCard
                  address={address}
                  ensName={ensNameString}
                  ensAvatar={ensAvatar}
                  chainId={chainId}
                  displayNickname={displayNickname}
                  profileUpdatedAt={profile?.updatedAt}
                  isLoadingProfile={isLoadingProfile}
                  remoteError={remoteError}
                />

                <ProfileCard
                  isConnected={isConnected}
                  nicknameInput={nicknameInput}
                  onNicknameChange={setNicknameInput}
                  onSave={handleSaveNickname}
                  isSigning={isSigning}
                  isSyncingRemote={isSyncingRemote}
                  profileNickname={profile?.nickname}
                  signError={signError}
                />
              </div>

              {/* 第二行：身份签名标识（全宽） */}
              <ProfileSignatureDisplay profile={profile} profileSource={profileSource} />
            </div>
          )}
        </div>

        {/* 已购课程 */}
        <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/20 p-6 shadow-2xl">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="inline-block w-1.5 h-5 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full"></span>
                  已购课程
                </h2>
                <p className="mt-1 text-sm text-slate-300">
                  基于链上记录展示当前地址已购买 / 创建的课程
                </p>
              </div>
            </div>

            <PurchasedCoursesList
              courses={myCourses}
              userAddress={address}
              isLoading={isCoursesLoading || isPurchasedLoading}
              error={friendlyCourseError}
              isConnected={isConnected}
              isWrongNetwork={isWrongNetwork}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MePage;
