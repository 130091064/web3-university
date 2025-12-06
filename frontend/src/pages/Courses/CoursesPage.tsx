import { useEffect, useState, useCallback } from "react";
import { useConnection, usePublicClient, useWriteContract } from "wagmi";
import { parseUnits } from "viem";

import { CreateCourseForm } from "@components/CreateCourseForm";
import { CourseList } from "@components/CourseList";
import type { UICourse } from "@components/CourseCard";
import { useCourses } from "@hooks/useCourses";
import {
  COURSE_MARKETPLACE_ADDRESS,
  YD_TOKEN_ADDRESS,
  courseMarketplaceAbi,
  ydTokenAbi,
} from "@contracts";

const CoursesPage = () => {
  const { address, isConnected } = useConnection();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [reloadKey, setReloadKey] = useState(0);
  const { courses, loading, error } = useCourses(reloadKey);
  const [uiCourses, setUiCourses] = useState<UICourse[]>([]);
  const [creating, setCreating] = useState(false);
  const [buyingCourseId, setBuyingCourseId] = useState<bigint | undefined>();

  useEffect(() => {
    if (!publicClient || !courses.length) {
      setUiCourses(
        courses.map((c) => ({
          id: c.id,
          author: c.author,
          price: c.price,
          metadataURI: c.metadataURI,
          isActive: c.isActive,
          studentCount: undefined,
          createdAt: undefined,
          isAuthor:
            !!address && c.author.toLowerCase() === address?.toLowerCase(),
          hasPurchased: false,
        }))
      );
      return;
    }

    const loadStates = async () => {
      try {
        const list: UICourse[] = [];
        for (const c of courses) {
          let hasPurchased = false;

          if (address) {
            hasPurchased = (await publicClient.readContract({
              address: COURSE_MARKETPLACE_ADDRESS,
              abi: courseMarketplaceAbi,
              functionName: "hasPurchased",
              args: [address, c.id],
            })) as boolean;
          }

          list.push({
            id: c.id,
            author: c.author,
            price: c.price,
            metadataURI: c.metadataURI,
            isActive: c.isActive,
            studentCount: c.studentCount,
            createdAt: c.createdAt,
            isAuthor:
              !!address && c.author.toLowerCase() === address?.toLowerCase(),
            hasPurchased,
          });
        }
        setUiCourses(list);
      } catch (err) {
        console.error("build uiCourses error:", err);
        setUiCourses(
          courses.map((c) => ({
            id: c.id,
            author: c.author,
            price: c.price,
            metadataURI: c.metadataURI,
            isActive: c.isActive,
            studentCount: c.studentCount,
            createdAt: c.createdAt,
            isAuthor:
              !!address && c.author.toLowerCase() === address?.toLowerCase(),
            hasPurchased: false,
          }))
        );
      }
    };

    loadStates();
  }, [publicClient, courses, address]);

  const handleCreateCourse = useCallback(
    async (priceStr: string, metadataURI: string) => {
      if (!isConnected || !address || !publicClient) return;
      if (!priceStr || !metadataURI) return;

      try {
        setCreating(true);
        const price = parseUnits(priceStr, 18);

        const hash = await writeContractAsync({
          address: COURSE_MARKETPLACE_ADDRESS,
          abi: courseMarketplaceAbi,
          functionName: "createCourse",
          args: [price, metadataURI],
        });

        await publicClient.waitForTransactionReceipt({
          hash,
          confirmations: 1,
        });

        setReloadKey((k) => k + 1);
      } catch (err) {
        console.error("createCourse error:", err);
      } finally {
        setCreating(false);
      }
    },
    [isConnected, address, publicClient, writeContractAsync]
  );

  const handleBuyCourse = useCallback(
    async (courseId: bigint) => {
      if (!isConnected || !address || !publicClient) return;

      try {
        setBuyingCourseId(courseId);

        const target = uiCourses.find((c) => c.id === courseId);
        if (!target) throw new Error("Course not found in uiCourses");
        const price = target.price;

        const allowance = (await publicClient.readContract({
          address: YD_TOKEN_ADDRESS,
          abi: ydTokenAbi,
          functionName: "allowance",
          args: [address, COURSE_MARKETPLACE_ADDRESS],
        })) as bigint;

        if (allowance < price) {
          const approveHash = await writeContractAsync({
            address: YD_TOKEN_ADDRESS,
            abi: ydTokenAbi,
            functionName: "approve",
            args: [COURSE_MARKETPLACE_ADDRESS, price],
          });

          await publicClient.waitForTransactionReceipt({
            hash: approveHash,
            confirmations: 1,
          });
        }

        const buyHash = await writeContractAsync({
          address: COURSE_MARKETPLACE_ADDRESS,
          abi: courseMarketplaceAbi,
          functionName: "buyCourse",
          args: [courseId],
        });

        await publicClient.waitForTransactionReceipt({
          hash: buyHash,
          confirmations: 1,
        });

        setReloadKey((k) => k + 1);
      } catch (err) {
        console.error("buyCourse error:", err);
      } finally {
        setBuyingCourseId(undefined);
      }
    },
    [isConnected, address, publicClient, uiCourses, writeContractAsync]
  );

  useEffect(() => {
    if (isConnected) {
      setReloadKey((k) => k + 1);
    } else {
      setUiCourses([]);
    }
  }, [isConnected]);

  return (
    <div className="flex flex-col gap-6">
      <CreateCourseForm
        onCreate={handleCreateCourse}
        isCreating={creating}
        disabled={!isConnected}
      />

      <CourseList
        courses={uiCourses}
        onBuy={handleBuyCourse}
        buyingCourseId={buyingCourseId}
        disabled={!isConnected}
        loading={loading}
      />

      {error && (
        <p className="text-xs text-rose-500">加载课程时发生错误：{error}</p>
      )}
    </div>
  );
};

export default CoursesPage;
