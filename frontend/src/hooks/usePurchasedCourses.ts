import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import type { Address } from "viem";
import { COURSE_MARKETPLACE_ADDRESS, courseMarketplaceAbi } from "@contracts";

/**
 * 按用户地址查询「已购买课程的 ID 列表」
 * 对应合约函数：getPurchasedCourseIds(address user)
 */
export function usePurchasedCourses(userAddress?: Address) {
  const publicClient = usePublicClient();
  const [ids, setIds] = useState<bigint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicClient || !userAddress) return;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = (await publicClient.readContract({
          address: COURSE_MARKETPLACE_ADDRESS,
          abi: courseMarketplaceAbi,
          functionName: "getPurchasedCourseIds",
          args: [userAddress],
        })) as bigint[];

        setIds(result);
      } catch (e) {
        console.error(e);
        const message =
          e instanceof Error ? e.message : "Failed to load purchased courses";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [publicClient, userAddress]);

  return { ids, loading, error };
}
