const LoadingSpinner = () => {
  return (
    <div className="flex min-h-[220px] items-center justify-center">
      <div className="flex max-w-sm flex-col items-center gap-4 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 px-6 py-5 shadow-lg shadow-blue-500/20">
        {/* 圆形旋转 Loader */}
        <div className="relative h-12 w-12">
          {/* 背景环 */}
          <div className="absolute inset-0 rounded-full border-2 border-white/20" />
          {/* 旋转前景环 */}
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-cyan-400 border-r-blue-400" />
          <span className="sr-only">页面加载中</span>
        </div>

        {/* 文案区域 */}
        <div className="text-sm font-bold text-white">正在加载学习空间…</div>
        <p className="text-xs text-slate-300 text-center">正在同步账户与课程数据，请稍候。</p>

        {/* Skeleton 提示区（让结构看起来更"完整"一点） */}
        <div className="mt-1 w-full space-y-2">
          <div className="h-2 w-full rounded-full bg-white/10 animate-pulse" />
          <div className="h-2 w-4/5 rounded-full bg-white/10 animate-pulse" />
          <div className="h-2 w-3/5 rounded-full bg-white/10 animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
