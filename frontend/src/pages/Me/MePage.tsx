import { useEffect, useMemo, useState } from "react";
import {
  useConnection,
  useChainId,
  useEnsName,
  useEnsAvatar,
  useSignMessage,
} from "wagmi";
import { formatUnits, type Address } from "viem";
import { useCourses, type Course } from "@hooks/useCourses";
import { usePurchasedCourses } from "@hooks/usePurchasedCourses";
import { formatDateTime } from "@utils";

type UserProfile = {
  address: string;
  nickname: string;
  signature: string;
  message: string;
  updatedAt: number;
};

// Cloudflare Worker API 根地址（本地默认 8787，线上用 VITE_PROFILE_API_BASE_URL 覆盖）
const PROFILE_API_BASE_URL =
  import.meta.env.VITE_PROFILE_API_BASE_URL ?? "http://localhost:8787";

const shortenAddress = (addr?: string) => {
  if (!addr) return "";
  return addr.slice(0, 6) + "..." + addr.slice(-4);
};

const MePage = () => {
  const connection = useConnection();
  const globalChainId = useChainId();

  const address = connection.address;
  const chainId = connection.chainId ?? globalChainId;
  const isConnected = Boolean(address);

  const MAINNET_CHAIN_ID = 1; // ENS 固定使用主网

  // ENS 信息（固定主网查询）
  const { data: ensName } = useEnsName({
    address,
    chainId: MAINNET_CHAIN_ID,
  });

  const ensNameString = typeof ensName === "string" ? ensName : undefined;

  const { data: ensAvatar } = useEnsAvatar({
    name: ensNameString,
    chainId: MAINNET_CHAIN_ID,
  });

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [nicknameInput, setNicknameInput] = useState("");
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSyncingRemote, setIsSyncingRemote] = useState(false);
  const [remoteError, setRemoteError] = useState<string | null>(null);

  const storageKey = address
    ? `web3-university-profile-${address.toLowerCase()}`
    : null;

  // 从 localStorage 读取昵称签名信息；没有的话用 ENS 作为默认输入框内容
  useEffect(() => {
    if (!address || !storageKey) {
      setProfile(null);
      setNicknameInput("");
      return;
    }

    let cancelled = false;

    const loadProfile = async () => {
      setIsLoadingProfile(true);
      setRemoteError(null);

      try {
        // 1️⃣ 优先尝试从远程 Worker 读取
        try {
          const res = await fetch(
            `${PROFILE_API_BASE_URL}/profile?address=${address}`
          );

          if (res.ok) {
            const data = (await res.json()) as {
              profile: UserProfile | null;
            };

            if (!cancelled && data.profile) {
              // 远程存在昵称 → 作为权威来源，同时写回 localStorage
              const remoteProfile = data.profile;
              localStorage.setItem(storageKey, JSON.stringify(remoteProfile));
              setProfile(remoteProfile);
              setNicknameInput(remoteProfile.nickname);
              return; // 直接返回，不再读 localStorage
            }
          } else {
            console.warn("Remote profile request failed:", res.status);
          }
        } catch (e) {
          console.warn("Failed to load remote profile", e);
          setRemoteError("远程昵称读取失败，已使用本地缓存。");
        }

        // 2️⃣ 远程没有 / 失败 → 回退到 localStorage + ENS
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw) as UserProfile;
          if (!cancelled) {
            setProfile(parsed);
            setNicknameInput(parsed.nickname);
          }
        } else {
          if (!cancelled) {
            setProfile(null);
            setNicknameInput(ensNameString ?? "");
          }
        }
      } catch (e) {
        console.error("Failed to load profile", e);
        if (!cancelled) {
          setProfile(null);
          setNicknameInput(ensNameString ?? "");
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

  // 签名修改昵称（wagmi v2 写法）
  const {
    signMessage,
    isPending: isSigning,
    error: signError,
  } = useSignMessage({
    mutation: {
      async onSuccess(signature, variables) {
        if (!address || !storageKey) return;

        const message = String(variables?.message ?? "");
        const trimmedNickname = nicknameInput.trim();
        if (!trimmedNickname) return;

        const nextProfile: UserProfile = {
          address,
          nickname: trimmedNickname,
          signature,
          message,
          updatedAt: Date.now(),
        };

        localStorage.setItem(storageKey, JSON.stringify(nextProfile));
        setProfile(nextProfile);

        // 2️⃣ 同步到 Cloudflare KV
        setIsSyncingRemote(true);
        setRemoteError(null);

        try {
          const res = await fetch(`${PROFILE_API_BASE_URL}/profile`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(nextProfile),
          });

          if (!res.ok) {
            const data = await res.json().catch(() => null);
            const msg =
              (data && (data.error as string)) || `同步云端失败：${res.status}`;
            console.error("Sync profile to Worker failed:", msg);
            setRemoteError(msg);
          }
        } catch (e) {
          console.error("Sync profile to Worker error:", e);
          setRemoteError("同步云端失败，请稍后重试。");
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
      "Web3 大学 · 昵称签名确认",
      `地址: ${address}`,
      `新昵称: ${value}`,
      `时间戳: ${Date.now()}`,
    ].join("\n");

    signMessage({ message });
  };

  // 课程数据（全量课程列表）
  const {
    courses,
    loading: isCoursesLoading,
    error: coursesError,
  } = useCourses();

  // 已购课程 ID 列表（来自合约 getPurchasedCourseIds）
  const userAddress = address as Address | undefined;
  const {
    ids: purchasedIds,
    loading: isPurchasedLoading,
    error: purchasedError,
  } = usePurchasedCourses(userAddress);

  // 根据已购 ID + 全量课程，计算真正的「已购买课程」列表
  const myCourses: Course[] = useMemo(() => {
    if (!courses || !purchasedIds || purchasedIds.length === 0) return [];
    const idSet = new Set(purchasedIds.map((id) => id.toString()));
    return courses.filter((course) => idSet.has(course.id.toString()));
  }, [courses, purchasedIds]);

  // 用于展示的“当前昵称”优先级：签名昵称 > ENS > 地址缩写
  const displayNickname =
    profile?.nickname || ensNameString || shortenAddress(address);

  // 简单生成一个短的“身份签名摘要”（展示在深色卡片里）
  const signatureShort = profile?.signature
    ? `${profile.signature.slice(0, 10)}...${profile.signature.slice(-10)}`
    : "";

  return (
    <section className="space-y-8">
      {/* 顶部 - 用户基础信息 */}
      <div className="rounded-3xl bg-white/80 p-6 shadow-sm">
        <p className="text-xl font-semibold">用户中心（M5）</p>
        <p className="mt-2 text-sm text-slate-500">
          通过钱包签名安全地管理昵称，并查看你在平台上购买 / 拥有的课程。
        </p>

        {!isConnected ? (
          <div className="mt-6 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
            请先在右上角连接钱包，才能使用用户中心功能。
          </div>
        ) : (
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {/* 钱包信息 */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
              <p className="text-sm font-medium text-slate-600">钱包信息</p>
              <div className="mt-3 flex items-center gap-3">
                {ensAvatar && (
                  <img
                    src={ensAvatar}
                    alt="ENS Avatar"
                    className="h-10 w-10 rounded-full border border-slate-200"
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
                      <span className="text-slate-500">最近签名时间：</span>
                      <span>
                        {new Date(profile.updatedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {isLoadingProfile && (
                    <p className="pt-1 text-xs text-slate-400">
                      正在加载昵称信息…
                    </p>
                  )}
                  {remoteError && (
                    <p className="pt-1 text-xs text-amber-600">{remoteError}</p>
                  )}
                </div>
              </div>
            </div>

            {/* 昵称 & 签名 */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
              <p className="text-sm font-medium text-slate-600">
                昵称设置（通过签名确认）
              </p>

              <div className="mt-3 space-y-3 text-sm">
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-slate-500">
                    当前昵称（可修改后签名保存）
                  </label>
                  <input
                    className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none ring-0 transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
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
                  className="inline-flex h-9 items-center justify-center rounded-xl bg-sky-500 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isSigning
                    ? "签名中…"
                    : isSyncingRemote
                    ? "同步云端中…"
                    : "签名并保存昵称"}
                </button>

                {isLoadingProfile && (
                  <p className="text-xs text-slate-400">
                    正在加载本地昵称信息…
                  </p>
                )}

                {profile && (
                  <p className="text-xs text-slate-500">
                    已签名保存的昵称：{" "}
                    <span className="font-medium">{profile.nickname}</span>
                  </p>
                )}

                {signError && (
                  <p className="text-xs text-red-500">
                    签名失败：{signError.message}
                  </p>
                )}

                {/* ✅ 身份签名标识（防篡改感） */}
                <div className="rounded-2xl bg-slate-900 p-4 text-xs text-slate-100 shadow-sm">
                  <p className="text-[13px] font-semibold text-sky-100">
                    身份签名标识
                  </p>
                  {profile ? (
                    <>
                      <p className="mt-2 text-slate-300">
                        昵称绑定地址：
                        <span className="font-mono">
                          {shortenAddress(profile.address)}
                        </span>
                      </p>
                      <p className="mt-1 text-slate-300">
                        当前昵称：{profile.nickname}
                      </p>
                      <p className="mt-1 text-slate-400">
                        签名摘要：
                        <span className="font-mono">{signatureShort}</span>
                      </p>
                      <p className="mt-2 text-[11px] text-slate-400">
                        以上签名由钱包对昵称和地址进行确认，记录在本地与云端 KV
                        中，仅你本人持有私钥才能重新生成，用于证明「这个昵称确实是你本人认领」。
                      </p>
                      <p className="mt-2 inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                        ● 已验证
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-[11px] text-slate-400">
                      当前还没有签名昵称。完成一次「签名并保存昵称」后，这里会生成一个只属于你的身份标识，用于后续课程记录、排行榜等场景。
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 已购课程列表 */}
      <div className="rounded-3xl bg-white/80 p-6 shadow-sm">
        <p className="text-lg font-semibold">已购买的课程</p>
        <p className="mt-2 text-sm text-slate-500">
          基于合约中按学生地址记录的购买关系，展示当前钱包已经购买的课程。
          作者自己创建的课程也会出现在列表中。
        </p>

        {!isConnected ? (
          <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
            请先连接钱包后查看已购课程。
          </div>
        ) : isCoursesLoading || isPurchasedLoading ? (
          <div className="mt-6 text-sm text-slate-500">正在加载课程数据…</div>
        ) : coursesError || purchasedError ? (
          <div className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
            加载课程失败：{coursesError || purchasedError}
          </div>
        ) : myCourses.length === 0 ? (
          <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
            当前钱包还没有购买任何课程。可以前往「课程平台」页面选购课程。
          </div>
        ) : (
          <ul className="mt-6 space-y-4">
            {myCourses.map((course) => (
              <li
                key={course.id.toString()}
                className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      课程 #{course.id.toString()}
                    </p>
                    {course.metadataURI && (
                      <a
                        href={course.metadataURI}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 block text-xs text-sky-600 hover:underline"
                      >
                        {course.metadataURI}
                      </a>
                    )}
                    <p className="mt-1 text-xs text-slate-500">
                      学生人数：{course.studentCount.toString()}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      状态：{course.isActive ? "上架中" : "已下架"}
                    </p>
                  </div>
                  <div className="mt-2 text-right md:mt-0">
                    <p className="text-sm font-semibold text-slate-800">
                      价格：{formatUnits(course.price, 18)} YD
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      创建时间：{formatDateTime(course.createdAt)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default MePage;
