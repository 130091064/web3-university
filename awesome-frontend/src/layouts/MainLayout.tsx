import FullScreenLoader from '@components/layout/FullScreenLoader';
import Header from '@components/layout/Header';
import LoadingSpinner from '@components/layout/LoadingSpinner';
import { Suspense, useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';

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
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-slate-100">
      {/* 动态网格背景 */}
      <div className="fixed inset-0 grid-bg opacity-30" />

      {/* 渐变光效背景 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-float" />
        <div
          className="absolute -bottom-1/2 -right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl animate-float"
          style={{ animationDelay: '3s' }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: '1.5s' }}
        />
      </div>

      {/* 全局启动遮罩 */}
      {booting && <FullScreenLoader />}

      {/* 顶部导航 */}
      <Header />

      {/* 主体内容区 */}
      <div className="relative flex flex-1 z-10">
        <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="h-full space-y-6 animate-fade-in">
            <Suspense fallback={booting ? null : <LoadingSpinner />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>

      {/* 页脚装饰线 */}
      <div className="relative z-10 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
    </div>
  );
};

export default MainLayout;
