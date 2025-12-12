const FullScreenLoader = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md">
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 px-8 py-6 shadow-2xl shadow-cyan-500/20">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-2 border-white/20" />
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-cyan-400 border-r-blue-400" />
        </div>
        <div className="text-sm font-bold text-white">正在准备你的学习空间…</div>
        <p className="text-xs text-slate-300 text-center">正在同步账户与课程数据，请稍候。</p>

        {/* ✅ 品牌标识：放这里 */}
        <p className="mt-1 text-[11px] text-slate-400">🚀 Web3 大学 · 去中心化学习平台</p>
      </div>
    </div>
  );
};

export default FullScreenLoader;
