import { useEffect, useState } from 'react';

type LocalUserProfile = {
  address: string;
  nickname: string;
  signature: string;
  message: string;
  updatedAt: number;
};

export type ProfileSource = 'none' | 'remote' | 'local';

const PROFILE_API_BASE_URL =
  (process.env.VITE_PROFILE_API_BASE_URL as string) ?? 'http://localhost:8787';

/**
 * 个人资料管理 Hook
 * 处理本地存储 + 云端同步逻辑
 */
export function useProfile(address?: string, ensName?: string) {
  const [profile, setProfile] = useState<LocalUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const [profileSource, setProfileSource] = useState<ProfileSource>('none');

  const storageKey = address ? `web3-university-profile-${address.toLowerCase()}` : null;

  // 从远程 KV + localStorage 读取昵称签名信息
  useEffect(() => {
    if (!address || !storageKey) {
      setProfile(null);
      setProfileSource('none');
      return;
    }

    let cancelled = false;

    const loadProfile = async () => {
      setIsLoading(true);
      setRemoteError(null);
      setProfileSource('none');

      try {
        // 1️⃣ 优先尝试从远程 Worker 读取
        try {
          const res = await fetch(`${PROFILE_API_BASE_URL}/profile?address=${address}`);

          if (res.ok) {
            const data = (await res.json()) as {
              profile: LocalUserProfile | null;
            };

            if (!cancelled && data.profile) {
              const remoteProfile = data.profile;
              localStorage.setItem(storageKey, JSON.stringify(remoteProfile));
              setProfile(remoteProfile);
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

        // 2️⃣ 远程没有 / 失败 → 回退到 localStorage
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw) as LocalUserProfile;
          if (!cancelled) {
            setProfile(parsed);
            setProfileSource('local');
          }
        } else {
          if (!cancelled) {
            setProfile(null);
            setProfileSource('none');
          }
        }
      } catch (e) {
        console.error('Failed to load profile', e);
        if (!cancelled) {
          setProfile(null);
          setProfileSource('none');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [address, storageKey, ensName]);

  /**
   * 同步 profile 到云端
   */
  const syncToRemote = async (profileData: LocalUserProfile): Promise<boolean> => {
    if (!storageKey) return false;

    setRemoteError(null);

    try {
      const res = await fetch(`${PROFILE_API_BASE_URL}/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (res.ok) {
        setProfileSource('remote');
        return true;
      } else {
        const data = await res.json().catch(() => null);
        const msg = (data && (data.error as string)) || `同步云端失败：${res.status}`;
        console.error('Sync profile to Worker failed:', msg);
        setRemoteError(msg);
        setProfileSource('local');
        return false;
      }
    } catch (e) {
      console.error('Sync profile to Worker error', e);
      setRemoteError('同步云端失败，请稍后重试。');
      setProfileSource('local');
      return false;
    }
  };

  /**
   * 保存 profile 到本地
   */
  const saveLocal = (profileData: LocalUserProfile) => {
    if (!storageKey) return;
    localStorage.setItem(storageKey, JSON.stringify(profileData));
    setProfile(profileData);
    setProfileSource('local');
  };

  return {
    profile,
    isLoading,
    remoteError,
    profileSource,
    saveLocal,
    syncToRemote,
  };
}
