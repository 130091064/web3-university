import { COURSE_MARKETPLACE_ADDRESS, courseMarketplaceAbi } from '@contracts';
import type { Course } from '@types';
import { useCallback, useEffect, useState } from 'react';
import { usePublicClient } from 'wagmi';

export function useCourses(reloadKey?: number, enabled = true) {
  const publicClient = usePublicClient();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ⭐ load 不依赖 reloadKey，只依赖 publicClient 和 enabled
  const load = useCallback(async () => {
    if (!publicClient || !enabled) {
      setCourses([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const nextId = (await publicClient.readContract({
        address: COURSE_MARKETPLACE_ADDRESS,
        abi: courseMarketplaceAbi,
        functionName: 'nextCourseId',
      })) as bigint;

      const count = Number(nextId);
      const result: Course[] = [];

      for (let i = 1; i <= count; i++) {
        const id = BigInt(i);
        const course = (await publicClient.readContract({
          address: COURSE_MARKETPLACE_ADDRESS,
          abi: courseMarketplaceAbi,
          functionName: 'getCourse',
          args: [id],
        })) as Course;

        result.push({ ...course });
      }

      setCourses(result);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, [publicClient, enabled]);

  // ⭐ 1) publicClient 变化 → 加载课程（首次加载也在这里）
  useEffect(() => {
    void load();
  }, [load]);

  // ⭐ 2) reloadKey 变化 → 再次触发 load()
  useEffect(() => {
    if (reloadKey !== undefined) {
      void load();
    }
  }, [reloadKey, load]);

  return { courses, loading, error };
}
