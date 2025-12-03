// src/App.tsx
import React, { useEffect, useState } from "react";
import { formatEther } from "viem";
import { useConnection, usePublicClient, useWriteContract } from "wagmi";

import Header from "./components/Header";
import {
  COURSE_MARKETPLACE_ADDRESS,
  YD_TOKEN_ADDRESS,
  courseMarketplaceAbi,
  ydTokenAbi,
} from "./contracts";
import { useCourses, type Course } from "./hooks/useCourses";

const App: React.FC = () => {
  const { courses, loading, error } = useCourses();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-10 pt-4 md:px-8">
        {/* 顶部导航 / 钱包区 */}
        <Header />

        <main className="mt-6 flex flex-1 flex-col gap-8">
          {/* Hero / 概览 */}
          <Hero coursesCount={courses.length} />

          {/* 课程列表 */}
          <CourseSection courses={courses} loading={loading} error={error} />
        </main>
      </div>
    </div>
  );
};

export default App;

// ---------- Hero ----------

const Hero: React.FC<{ coursesCount: number }> = ({ coursesCount }) => {
  return (
    <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/10 via-slate-900/80 to-indigo-500/10 p-6 shadow-2xl shadow-black/50 md:p-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-xl space-y-3">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            WEB3 大学
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-50 md:text-3xl">
            课程平台 · Sepolia
          </h1>
          <p className="text-sm leading-relaxed text-slate-300/80 md:text-[15px]">
            链上课程上架、购买与学习的统一入口。连接钱包即可探索 Web3
            开发、智能合约与区块链应用的最新内容， 实时跟进行业趋势。
          </p>
        </div>

        <div className="grid w-full max-w-xs grid-cols-3 gap-3 text-xs md:text-sm">
          <InfoCard label="网络" value="Sepolia" />
          <InfoCard label="支付代币" value="YD" />
          <InfoCard label="课程数量" value={coursesCount.toString()} />
        </div>
      </div>
    </section>
  );
};

const InfoCard: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <div className="rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-3 text-center shadow-lg shadow-black/40">
    <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
      {label}
    </div>
    <div className="mt-1 text-sm font-semibold text-slate-50 md:text-base">
      {value}
    </div>
  </div>
);

// ---------- Course Section / List ----------

type CourseListProps = {
  courses: Course[];
  loading: boolean;
  error: string | null;
};

const CourseSection: React.FC<CourseListProps> = ({
  courses,
  loading,
  error,
}) => (
  <section className="space-y-4">
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold text-slate-50 md:text-xl">
        课程列表
      </h2>
      <p className="text-xs text-slate-400">
        使用 YD 代币购买课程，链上记录你的学习足迹。
      </p>
    </div>

    <CourseList courses={courses} loading={loading} error={error} />
  </section>
);

const CourseList: React.FC<CourseListProps> = ({ courses, loading, error }) => {
  const { status, address } = useConnection();
  const isConnected = status === "connected" && !!address;

  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [pendingCourseId, setPendingCourseId] = useState<bigint | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // 记录“当前地址是否已经购买某课程”
  const [purchasedMap, setPurchasedMap] = useState<Record<string, boolean>>({});

  // 读取已购状态
  useEffect(() => {
    if (!publicClient || !address || !courses.length) return;

    let cancelled = false;

    const loadPurchased = async () => {
      const next: Record<string, boolean> = {};

      for (const course of courses) {
        try {
          const purchased = (await publicClient.readContract({
            address: COURSE_MARKETPLACE_ADDRESS,
            abi: courseMarketplaceAbi,
            functionName: "hasPurchased",
            args: [address, course.id],
          })) as boolean;

          next[course.id.toString()] = purchased;
        } catch (e) {
          console.error("load hasPurchased error", e);
        }
      }

      if (!cancelled) setPurchasedMap(next);
    };

    loadPurchased();

    return () => {
      cancelled = true;
    };
  }, [publicClient, address, courses]);

  const handleBuy = async (course: Course) => {
    if (!isConnected || !address || !publicClient) {
      setMessage("请先连接钱包");
      return;
    }

    // 已购买就不再发交易，直接提示
    if (purchasedMap[course.id.toString()]) {
      setMessage("你已经购买过这门课程啦");
      return;
    }

    try {
      setMessage(null);
      setPendingCourseId(course.id);

      // 1. allowance
      const allowance = (await publicClient.readContract({
        address: YD_TOKEN_ADDRESS,
        abi: ydTokenAbi,
        functionName: "allowance",
        args: [address, COURSE_MARKETPLACE_ADDRESS],
      })) as bigint;

      // 2. 不足则 approve
      if (allowance < course.price) {
        setMessage("正在授权 YD 代币...");
        const approveHash = await writeContractAsync({
          address: YD_TOKEN_ADDRESS,
          abi: ydTokenAbi,
          functionName: "approve",
          args: [COURSE_MARKETPLACE_ADDRESS, course.price],
        });

        await publicClient.waitForTransactionReceipt({ hash: approveHash });
      }

      // 3. buyCourse
      setMessage("正在购买课程...");
      const buyHash = await writeContractAsync({
        address: COURSE_MARKETPLACE_ADDRESS,
        abi: courseMarketplaceAbi,
        functionName: "buyCourse",
        args: [course.id],
      });

      await publicClient.waitForTransactionReceipt({ hash: buyHash });

      // 更新本地已购状态
      setPurchasedMap((prev) => ({
        ...prev,
        [course.id.toString()]: true,
      }));

      setMessage("购买成功 ✅");
    } catch (err: any) {
      console.error(err);
      const msg = err?.shortMessage || err?.message || "购买失败";

      if (msg.includes("Already purchased")) {
        setPurchasedMap((prev) => ({
          ...prev,
          [course.id.toString()]: true,
        }));
        setMessage("你已经购买过这门课程啦");
      } else {
        setMessage(msg);
      }
    } finally {
      setPendingCourseId(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 text-sm text-slate-300">
        课程加载中...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-500/40 bg-rose-950/40 p-6 text-sm text-rose-100">
        加载失败：{error}
      </div>
    );
  }

  if (!courses.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 text-sm text-slate-300">
        当前还没有上架课程，可以通过 Remix 或作者中心创建第一门课程。
      </div>
    );
  }

  return (
    <section className="space-y-3">
      {message && (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/40 px-4 py-3 text-xs text-emerald-100">
          {message}
        </div>
      )}

      <ul className="grid gap-6 md:grid-cols-2">
        {courses.map((course) => {
          const isPending = pendingCourseId === course.id;
          const purchased = !!purchasedMap[course.id.toString()];

          return (
            <li
              key={course.id.toString()}
              className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/40"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                  课程 #{course.id.toString()}
                </div>
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-300">
                  {course.isActive ? "上架中" : "已下架"}
                </span>
              </div>

              <div className="space-y-1">
                <div className="text-xl font-semibold text-slate-50">
                  {formatEther(course.price)} YD
                </div>
                <div className="text-xs text-slate-400">
                  作者：{course.author}
                </div>
                <div className="text-xs text-slate-400">
                  metadataURI：{course.metadataURI}
                </div>
              </div>

              <button
                className={`mt-2 w-full rounded-2xl border border-transparent px-4 py-3 text-sm font-semibold tracking-wide transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                  isPending || purchased
                    ? "bg-slate-600"
                    : "bg-emerald-500 hover:bg-emerald-400 shadow-lg shadow-emerald-900/40"
                }`}
                disabled={
                  !isConnected || !course.isActive || isPending || purchased
                }
                onClick={() => handleBuy(course)}
              >
                {!isConnected
                  ? "请先连接钱包"
                  : !course.isActive
                  ? "课程已下架"
                  : purchased
                  ? "已购买"
                  : isPending
                  ? "处理中..."
                  : "购买课程"}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
