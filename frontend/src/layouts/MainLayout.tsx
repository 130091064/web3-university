import { Outlet } from "react-router-dom";
import Header from "@components/layout/Header";
import FullScreenLoader from "@components/layout/FullScreenLoader";
import { useEffect, useState, Suspense } from "react";
import LoadingSpinner from "@components/layout/LoadingSpinner";

let hasBootedOnce = false;

const MainLayout = () => {
  // 首次进入应用：hasBootedOnce 为 false → booting = true
  // 之后再次挂载 MainLayout：hasBootedOnce 已经是 true → booting = false
  const [booting, setBooting] = useState(() => !hasBootedOnce);

  useEffect(() => {
    // 如果当前不是 booting 状态，就什么都不做
    if (!booting) return;

    // 记录：已经启动过一次了
    hasBootedOnce = true;

    // 做一个“最小展示时长”，避免闪一下
    const timer = setTimeout(() => {
      setBooting(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [booting]);
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-800">
      {/* 全局启动遮罩：只在第一次挂载时出现 */}
      {booting && <FullScreenLoader />}

      {/* 顶部全局头部（含主导航） */}
      <Header />

      {/* 主体区域：只保留内容区，居中 + 限宽 */}
      <div className="flex flex-1">
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          {/* 统一卡片背景基调 */}
          <div className="h-full space-y-6">
            <Suspense fallback={booting ? null : <LoadingSpinner />}>
              {/* booting 时其实也可以不渲染 Outlet，但保持简单即可 */}
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
