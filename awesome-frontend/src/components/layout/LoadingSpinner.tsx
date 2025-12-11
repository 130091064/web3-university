const LoadingSpinner = () => {
  return (
    <div className="flex min-h-[220px] items-center justify-center">
      <div className="flex max-w-sm flex-col items-center gap-4 rounded-2xl bg-white/90 px-6 py-5 shadow-sm ring-1 ring-slate-100">
        {/* 圆形旋转 Loader */}
        <div className="relative h-10 w-10">
          {/* 背景环 */}
          <div className="absolute inset-0 rounded-full border-2 border-slate-200/70" />
          {/* 旋转前景环 */}
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
          <span className="sr-only">页面加载中</span>
        </div>

        {/* 文案区域 */}
        <div className="text-sm font-medium text-slate-800">正在加载学习空间…</div>
        <p className="text-xs text-slate-500 text-center">正在同步账户与课程数据，请稍候。</p>

        {/* Skeleton 提示区（让结构看起来更“完整”一点） */}
        <div className="mt-1 w-full space-y-2">
          <div className="h-2 w-full rounded-full bg-slate-100 animate-pulse" />
          <div className="h-2 w-4/5 rounded-full bg-slate-100 animate-pulse" />
          <div className="h-2 w-3/5 rounded-full bg-slate-100 animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
