// src/App.tsx
import React, { useEffect, useState } from "react";
import { useConnection, usePublicClient, useWriteContract } from "wagmi";
import { formatUnits, parseUnits } from "viem";

import Header from "./components/Header";
import { WalletSection } from "./components/WalletSection";
import { CreateCourseForm } from "./components/CreateCourseForm";
import { CourseList } from "./components/CourseList";
import AaveVaultPanel from "./components/AaveVaultPanel";
import type { UICourse } from "./components/CourseCard";
import BuyYDPanel from "./components/BuyYDPanel";
import SwapYDToUsdtPanel from "./components/SwapYDToUsdtPanel";

import { useCourses } from "./hooks/useCourses";
import {
  YD_TOKEN_ADDRESS,
  COURSE_MARKETPLACE_ADDRESS,
  ydTokenAbi,
  courseMarketplaceAbi,
} from "./contracts";

const App: React.FC = () => {
  // 钱包连接信息（和 Header 保持一致）
  const { address, isConnected } = useConnection();
  const publicClient = usePublicClient();

  // wagmi 写操作（同一个 writeContractAsync 用在 approve / createCourse / buyCourse）
  const { writeContractAsync } = useWriteContract();

  // 基础课程数据（来自自定义 hook）
  const [reloadKey, setReloadKey] = useState(0);
  const { courses, loading, error } = useCourses(reloadKey);

  // UI 用课程：带 isAuthor / hasPurchased
  const [uiCourses, setUiCourses] = useState<UICourse[]>([]);

  // YD 余额
  const [ydBalance, setYdBalance] = useState<string>("0");

  // 创建 / 购买 状态
  const [creating, setCreating] = useState(false);
  const [buyingCourseId, setBuyingCourseId] = useState<bigint | undefined>();

  // 读取 YD 余额
  const fetchYdBalance = async () => {
    if (!publicClient || !address) {
      setYdBalance("0");
      return;
    }
    try {
      const [balanceRaw, decimals] = await Promise.all([
        publicClient.readContract({
          address: YD_TOKEN_ADDRESS,
          abi: ydTokenAbi,
          functionName: "balanceOf",
          args: [address],
        }) as Promise<bigint>,
        publicClient.readContract({
          address: YD_TOKEN_ADDRESS,
          abi: ydTokenAbi,
          functionName: "decimals",
        }) as Promise<number>,
      ]);

      setYdBalance(formatUnits(balanceRaw, decimals));
    } catch (err) {
      console.error("fetchYdBalance error:", err);
      setYdBalance("0");
    }
  };

  // 根据基础 courses + 当前 address，补充 isAuthor / hasPurchased
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
            !!address && c.author.toLowerCase() === address.toLowerCase(),
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
              !!address && c.author.toLowerCase() === address.toLowerCase(),
            hasPurchased,
          });
        }
        setUiCourses(list);
      } catch (err) {
        console.error("build uiCourses error:", err);
        // 出错就先退回到不含 hasPurchased 的简单列表
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
              !!address && c.author.toLowerCase() === address.toLowerCase(),
            hasPurchased: false,
          }))
        );
      }
    };

    loadStates();
  }, [publicClient, courses, address]);

  // 连接状态变化时刷新一次
  useEffect(() => {
    if (isConnected) {
      fetchYdBalance();
      setReloadKey((k) => k + 1);
    } else {
      setYdBalance("0");
      setUiCourses([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address]);

  // 手动刷新按钮
  const handleRefreshAll = () => {
    fetchYdBalance();
    setReloadKey((k) => k + 1);
  };

  // 创建课程（把用户输入的“整数 YD”转成 18 位精度）
  const handleCreateCourse = async (priceStr: string, metadataURI: string) => {
    if (!isConnected || !address || !publicClient) return;
    if (!priceStr || !metadataURI) return;

    try {
      setCreating(true);

      // 用户输入的是 “100 YD” 这种整数，我们按 18 位精度转成最小单位
      const price = parseUnits(priceStr, 18);

      const hash = await writeContractAsync({
        address: COURSE_MARKETPLACE_ADDRESS,
        abi: courseMarketplaceAbi,
        functionName: "createCourse",
        args: [price, metadataURI],
      });

      console.log("createCourse tx:", hash);

      await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      });

      console.log("createCourse confirmed");

      // 刷新列表 & 余额
      await fetchYdBalance();
      setReloadKey((k) => k + 1);
    } catch (err) {
      console.error("createCourse error:", err);
    } finally {
      setCreating(false);
    }
  };

  // 购买课程（含 YD approve 流程）
  const handleBuyCourse = async (courseId: bigint) => {
    if (!isConnected || !address || !publicClient) return;

    try {
      setBuyingCourseId(courseId);

      const target = uiCourses.find((c) => c.id === courseId);
      if (!target) throw new Error("Course not found in uiCourses");
      const price = target.price;

      // 1. 检查 allowance 是否足够
      const allowance = (await publicClient.readContract({
        address: YD_TOKEN_ADDRESS,
        abi: ydTokenAbi,
        functionName: "allowance",
        args: [address, COURSE_MARKETPLACE_ADDRESS],
      })) as bigint;

      console.log("current allowance:", allowance.toString());

      if (allowance < price) {
        console.log("Allowance not enough, sending approve...");

        const approveHash = await writeContractAsync({
          address: YD_TOKEN_ADDRESS,
          abi: ydTokenAbi,
          functionName: "approve",
          args: [COURSE_MARKETPLACE_ADDRESS, price],
        });

        console.log("approve tx:", approveHash);

        await publicClient.waitForTransactionReceipt({
          hash: approveHash,
          confirmations: 1,
        });

        console.log("approve confirmed");
      } else {
        console.log("Allowance sufficient, skip approve.");
      }

      // 2. 调用 buyCourse
      const buyHash = await writeContractAsync({
        address: COURSE_MARKETPLACE_ADDRESS,
        abi: courseMarketplaceAbi,
        functionName: "buyCourse",
        args: [courseId],
      });

      console.log("buyCourse tx:", buyHash);

      await publicClient.waitForTransactionReceipt({
        hash: buyHash,
        confirmations: 1,
      });

      console.log("buyCourse confirmed");

      await fetchYdBalance();
      setReloadKey((k) => k + 1);
    } catch (err) {
      console.error("buyCourse error:", err);
    } finally {
      setBuyingCourseId(undefined);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-sky-50 via-blue-50 to-blue-100 text-slate-800">
      {/* 顶部 Header（你自己的组件） */}
      <Header />

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        {/* 钱包 & 资产概览 */}
        <WalletSection
          address={address}
          ydBalance={ydBalance}
          isConnected={isConnected}
          onRefresh={handleRefreshAll}
        />

        <BuyYDPanel
          onBuySuccess={() => {
            // 购买成功后让全局 reloadKey + 1
            setReloadKey((k) => k + 1);
          }}
        />

        {/* 创建课程区域 */}
        <CreateCourseForm
          onCreate={handleCreateCourse}
          isCreating={creating}
          disabled={!isConnected}
        />

        {/* 课程列表 */}
        <CourseList
          courses={uiCourses}
          onBuy={handleBuyCourse}
          buyingCourseId={buyingCourseId}
          disabled={!isConnected}
          loading={loading}
        />

        {/* 错误提示 */}
        {error && (
          <p className="text-xs text-rose-500">加载课程时发生错误：{error}</p>
        )}

        <SwapYDToUsdtPanel
          onSwapSuccess={() => {
            // 兑换成功后，你可以让上层去刷新钱包/金库信息（看你 reloadKey 的设计）
          }}
        />

        <AaveVaultPanel />
      </main>
    </div>
  );
};

export default App;
