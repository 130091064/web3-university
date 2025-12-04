import { useEffect, useState } from 'react';
import { usePublicClient } from 'wagmi';
import type { Address } from 'viem';
import { COURSE_MARKETPLACE_ADDRESS, courseMarketplaceAbi } from '../contracts';

export type Course = {
  id: bigint;
  author: Address;
  price: bigint;
  metadataURI: string;
  isActive: boolean;
  studentCount: bigint;
  createdAt: bigint;
};

export function useCourses(reloadKey?: number) {
  const publicClient = usePublicClient();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicClient) return;

    const load = async () => {
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
          })) as any;

          result.push({
            id: course.id,
            author: course.author,
            price: course.price,
            metadataURI: course.metadataURI,
            isActive: course.isActive,
            studentCount: course.studentCount,
            createdAt: course.createdAt,
          });
        }

        setCourses(result);
      } catch (e: any) {
        console.error(e);
        setError(e?.message ?? 'Failed to load courses');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [publicClient, reloadKey]);

  return { courses, loading, error };
}
