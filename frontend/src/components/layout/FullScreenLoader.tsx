const FullScreenLoader = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/10 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-white/95 px-8 py-6 shadow-lg ring-1 ring-slate-200">
        <div className="relative h-10 w-10">
          <div className="absolute inset-0 rounded-full border-2 border-slate-200" />
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
        </div>
        <div className="text-sm font-medium text-slate-900">
          正在准备你的学习空间…
        </div>
        <p className="text-xs text-slate-500 text-center">
          正在同步账户与课程数据，请稍候。
        </p>

        {/* ✅ 品牌标识：放这里 */}
        <p className="mt-1 text-[11px] text-slate-400">
          Web3 大学 · 去中心化学习平台
        </p>
      </div>
    </div>
  );
};

export default FullScreenLoader;
