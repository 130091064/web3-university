import { useCallback, useEffect, useRef } from 'react';

interface UseAutoRefreshOptions {
  /** 刷新间隔（毫秒），默认30秒 */
  interval?: number;
  /** 是否启用自动刷新，默认true */
  enabled?: boolean;
  /** 是否在首次挂载时立即执行，默认false */
  immediate?: boolean;
}

/**
 * 统一的自动刷新Hook
 * @param callback 刷新时执行的回调函数
 * @param options 配置选项
 * @returns 手动刷新函数
 */
export const useAutoRefresh = (
  callback: () => void | Promise<void>,
  options: UseAutoRefreshOptions = {},
) => {
  const { interval = 30000, enabled = true, immediate = false } = options;

  const savedCallback = useRef(callback);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 保存最新的callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // 手动刷新函数
  const manualRefresh = useCallback(async () => {
    try {
      await savedCallback.current();
    } catch (error) {
      console.error('Manual refresh error:', error);
    }
  }, []);

  // 自动刷新逻辑
  useEffect(() => {
    if (!enabled) {
      // 清理定时器
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // 首次立即执行
    if (immediate) {
      void savedCallback.current();
    }

    // 设置定时器
    timerRef.current = setInterval(() => {
      void savedCallback.current();
    }, interval);

    // 清理函数
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [enabled, interval, immediate]);

  return manualRefresh;
};
