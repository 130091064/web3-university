import { type Course, useCourses } from '@hooks/useCourses';
import { usePurchasedCourses } from '@hooks/usePurchasedCourses';
import { formatDateTime } from '@utils';
import { useEffect, useMemo, useState } from 'react';
import { type Address, formatUnits } from 'viem';
import { useChainId, useConnection, useEnsAvatar, useEnsName, useSignMessage } from 'wagmi';
import { sepolia } from 'wagmi/chains';

type UserProfile = {
  address: string;
  nickname: string;
  signature: string;
  message: string;
  updatedAt: number;
};

type ProfileSource = 'none' | 'remote' | 'local';

// Cloudflare Worker API 根地址（本地默认 8787，线上用 VITE_PROFILE_API_BASE_URL 覆盖）
const PROFILE_API_BASE_URL =
  (process.env.VITE_PROFILE_API_BASE_URL as string) ?? 'http://localhost:8787';

const shortenAddress = (addr?: string) => (addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '');

// 简单判断是否为 http(s) 链接
const isHttpUrl = (value: string) => /^https?:\/\//i.test(value.trim());

const MePage = () => {
  const connection = useConnection();
  const globalChainId = useChainId();

  const address = connection.address;
  const chainId = connection.chainId ?? globalChainId;
  const isConnected = Boolean(address);

  // 课程合约所在网络（你现在是部署在 Sepolia）
  const isOnSepolia = chainId === sepolia.id;
  const isWrongNetwork = isConnected && !isOnSepolia;

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

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [nicknameInput, setNicknameInput] = useState('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSyncingRemote, setIsSyncingRemote] = useState(false);
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const [profileSource, setProfileSource] = useState<ProfileSource>('none');

  const storageKey = address ? `web3-university-profile-${address.toLowerCase()}` : null;

  // 从远程 KV + localStorage 读取昵称签名信息；没有的话用 ENS 作为默认输入框内容
  useEffect(() => {
    if (!address || !storageKey) {
      setProfile(null);
      setNicknameInput('');
      setProfileSource('none');
      return;
    }

    let cancelled = false;

    const loadProfile = async () => {
      setIsLoadingProfile(true);
      setRemoteError(null);
      setProfileSource('none');

      try {
        // 1️⃣ 优先尝试从远程 Worker 读取
        try {
          const res = await fetch(`${PROFILE_API_BASE_URL}/profile?address=${address}`);

          if (res.ok) {
            const data = (await res.json()) as {
              profile: UserProfile | null;
            };

            if (!cancelled && data.profile) {
              const remoteProfile = data.profile;
              localStorage.setItem(storageKey, JSON.stringify(remoteProfile));
              setProfile(remoteProfile);
              setNicknameInput(remoteProfile.nickname);
              setProfileSource('remote');
              return;
            }
          } else {
            console.warn('Remote profile request failed:', res.status);
          }
        } catch (e) {
          console.warn('Failed to load remote profile', e);
          setRemoteError('云端昵称读取失败，已使用本地缓存。');
        }

        // 2️⃣ 远程没有 / 失败 → 回退到 localStorage + ENS
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw) as UserProfile;
          if (!cancelled) {
            setProfile(parsed);
            setNicknameInput(parsed.nickname);
            setProfileSource('local');
          }
        } else {
          if (!cancelled) {
            setProfile(null);
            setNicknameInput(ensNameString ?? '');
            setProfileSource('none');
          }
        }
      } catch (e) {
        console.error('Failed to load profile', e);
        if (!cancelled) {
          setProfile(null);
          setNicknameInput(ensNameString ?? '');
          setProfileSource('none');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingProfile(false);
        }
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [address, storageKey, ensNameString]);

  // 签名修改昵称
  const {
    signMessage,
    isPending: isSigning,
    error: signError,
  } = useSignMessage({
    mutation: {
      async onSuccess(signature, variables) {
        if (!address || !storageKey) return;

        const message = String(variables?.message ?? '');
        const trimmedNickname = nicknameInput.trim();
        if (!trimmedNickname) return;

        const nextProfile: UserProfile = {
          address,
          nickname: trimmedNickname,
          signature,
          message,
          updatedAt: Date.now(),
        };

        // 本地缓存
        localStorage.setItem(storageKey, JSON.stringify(nextProfile));
        setProfile(nextProfile);
        setProfileSource('local');

        // 同步到 Cloudflare KV
        setIsSyncingRemote(true);
        setRemoteError(null);

        try {
          const res = await fetch(`${PROFILE_API_BASE_URL}/profile`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(nextProfile),
          });

          if (res.ok) {
            setProfileSource('remote');
          } else {
            const data = await res.json().catch(() => null);
            const msg = (data && (data.error as string)) || `同步云端失败：${res.status}`;
            console.error('Sync profile to Worker failed:', msg);
            setRemoteError(msg);
            setProfileSource('local');
          }
        } catch (e) {
          console.error('Sync profile to Worker error', e);
          setRemoteError('同步云端失败，请稍后重试。');
          setProfileSource('local');
        } finally {
          setIsSyncingRemote(false);
        }
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

  // 已购课程 ID 列表（来自合约 getPurchasedCourseIds）
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

  const signatureShort = profile?.signature
    ? `${profile.signature.slice(0, 10)}...${profile.signature.slice(-10)}`
    : '';

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

  return (
    <section className="rounded-2xl bg-white/90 p-4 shadow-sm ring-1 ring-slate-100 sm:p-6">
      <div className="space-y-6">
        {/* ✅ 页面级主 / 副标题，跟其他页面统一 */}
        <div>
          <h1 className="text-xl font-semibold text-slate-900">我的账户</h1>
          <p className="mt-1 text-sm text-slate-500">
            管理你的链上身份，并查看学习资产与课程记录。
          </p>
        </div>

        {/* 顶部：账户 & 昵称 */}
        <div className="rounded-3xl bg-slate-50/80 p-4 shadow-sm ring-1 ring-slate-100 sm:p-6">
          {!isConnected ? (
            <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
              请先在页面顶部连接钱包，再进入用户中心。
            </div>
          ) : (
            <div className="space-y-6">
              {/* 第一行：钱包信息 + 昵称设置 */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* 钱包信息卡片 */}
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
                      {ensNameString && (
                        <div>
                          <span className="text-slate-500">ENS：</span>
                          <span>{ensNameString}</span>
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
                      {profile && (
                        <div>
                          <span className="text-slate-500">最近签名：</span>
                          <span>{new Date(profile.updatedAt).toLocaleString()}</span>
                        </div>
                      )}
                      {isLoadingProfile && (
                        <p className="pt-1 text-xs text-slate-400">正在加载昵称信息…</p>
                      )}
                      {remoteError && <p className="pt-1 text-xs text-amber-600">{remoteError}</p>}
                    </div>
                  </div>
                </div>

                {/* 昵称设置卡片 */}
                <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">
                  <p className="text-sm font-medium text-slate-700">昵称设置（链上签名）</p>

                  <div className="mt-3 space-y-3 text-sm">
                    <div className="flex flex-col gap-2">
                      <div className="text-xs text-slate-500">昵称（签名后将与当前地址绑定）</div>
                      <input
                        className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none ring-0 transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
                        placeholder="例如：Web3 学习者"
                        value={nicknameInput}
                        onChange={(e) => setNicknameInput(e.target.value)}
                        disabled={!isConnected || isSigning}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveNickname}
                      disabled={!isConnected || !nicknameInput.trim() || isSigning}
                      className="inline-flex cursor-pointer h-9 items-center justify-center rounded-xl bg-sky-500 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {isSigning ? '签名中…' : isSyncingRemote ? '同步云端中…' : '签名并保存昵称'}
                    </button>

                    {profile && (
                      <p className="text-xs text-slate-500">
                        已签名昵称：
                        <span className="font-medium">{profile.nickname}</span>
                      </p>
                    )}

                    {signError && (
                      <p className="text-xs text-red-500">签名失败：{signError.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 第二行：身份签名标识（全宽） */}
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
            </div>
          )}
        </div>

        {/* 已购课程 */}
        <div className="rounded-3xl bg-slate-50/80 p-4 shadow-sm ring-1 ring-slate-100 sm:p-6">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <p className="text-base sm:text-lg font-semibold text-slate-900">已购课程</p>
              <p className="mt-1 text-sm text-slate-500">
                基于链上记录展示当前地址已购买 / 创建的课程。
              </p>
            </div>
          </div>

          {!isConnected ? (
            <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
              连接钱包后即可查看本地址的课程记录。
            </div>
          ) : isWrongNetwork ? (
            <div className="mt-6 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
              当前网络暂不支持读取课程记录，请在顶部切换到 Sepolia Testnet 后再查看。
            </div>
          ) : isCoursesLoading || isPurchasedLoading ? (
            <div className="mt-6 text-sm text-slate-500">正在加载课程数据…</div>
          ) : friendlyCourseError ? (
            <div className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {friendlyCourseError}
            </div>
          ) : myCourses.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
              当前地址还没有购买任何课程，可以前往「课程平台」选购一门课程试试。
            </div>
          ) : (
            <ul className="mt-6 grid gap-4 md:grid-cols-2">
              {myCourses.map((course) => {
                const price = formatUnits(course.price, 18);
                const isAuthor = address && course.author.toLowerCase() === address.toLowerCase();
                const meta = (course.metadataURI || '').trim();
                const urlLike = meta && isHttpUrl(meta);

                return (
                  <li
                    key={course.id.toString()}
                    className="h-full rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm"
                  >
                    <div className="flex h-full flex-col justify-between gap-3 md:gap-2">
                      {/* 上半区：标题 & 简要信息 */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900">
                            课程 #{course.id.toString()}
                          </p>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                              isAuthor
                                ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            }`}
                          >
                            {isAuthor ? '我是作者' : '已购买'}
                          </span>
                          {!course.isActive && (
                            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-500">
                              已下架
                            </span>
                          )}
                        </div>

                        {/* metadataURI：URL → 用右侧按钮；否则直接展示简介文案 */}
                        {meta ? (
                          urlLike ? (
                            <p className="text-xs text-slate-500">
                              已配置课程外部页面，可通过右侧「去学习」进入。
                            </p>
                          ) : (
                            <p className="text-xs text-slate-600">课程简介：{meta}</p>
                          )
                        ) : (
                          <p className="text-xs text-slate-400">暂无课程简介</p>
                        )}

                        <p className="text-xs text-slate-500">
                          学生人数：{course.studentCount.toString()}
                        </p>
                        <p className="text-xs text-slate-500">
                          创建时间：{formatDateTime(course.createdAt)}
                        </p>
                      </div>

                      {/* 下半区：价格 + 去学习按钮 */}
                      <div className="flex flex-col items-end gap-2">
                        <p className="text-sm font-semibold text-slate-900">价格：{price} YD</p>
                        {meta && urlLike && (
                          <a
                            href={meta}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center rounded-xl bg-sky-500 px-4 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-sky-600"
                          >
                            去学习
                          </a>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
};

export default MePage;
