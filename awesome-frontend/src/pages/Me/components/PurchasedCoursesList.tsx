import type { Course } from '@types';
import { formatDateTime, isHttpUrl } from '@utils';
import { formatUnits } from 'viem';

interface PurchasedCoursesListProps {
  courses: Course[];
  userAddress?: string;
  isLoading: boolean;
  error?: string | null;
  isConnected: boolean;
  isWrongNetwork: boolean;
}

/**
 * 已购课程列表组件
 */
export const PurchasedCoursesList = ({
  courses,
  userAddress,
  isLoading,
  error,
  isConnected,
  isWrongNetwork,
}: PurchasedCoursesListProps) => {
  if (!isConnected) {
    return (
      <div className="mt-6 rounded-lg border border-amber-400/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10 backdrop-blur-sm px-5 py-4 text-sm flex items-center gap-3">
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/30 border-2 border-amber-400/60 shadow-lg flex-shrink-0">
          <span className="text-base">🔌</span>
        </span>
        <span className="text-amber-200">连接钱包后即可查看本地址的课程记录。</span>
      </div>
    );
  }

  if (isWrongNetwork) {
    return (
      <div className="mt-6 rounded-lg border border-amber-400/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10 backdrop-blur-sm px-5 py-4 text-sm flex items-center gap-3">
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/30 border-2 border-amber-400/60 shadow-lg flex-shrink-0">
          <span className="text-base">⚠️</span>
        </span>
        <span className="text-amber-200">
          当前网络暂不支持读取课程记录，请在顶部切换到 Sepolia Testnet 后再查看。
        </span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mt-6 text-sm flex items-center gap-3">
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-500/30 border-2 border-slate-400/60 shadow-lg flex-shrink-0 animate-pulse">
          <span className="text-base">⏳</span>
        </span>
        <span className="text-slate-200">正在加载课程数据…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 rounded-lg border border-red-400/30 bg-gradient-to-r from-red-500/10 to-pink-500/10 backdrop-blur-sm px-5 py-4 text-sm flex items-center gap-3">
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/30 border-2 border-red-400/60 shadow-lg flex-shrink-0">
          <span className="text-base">❌</span>
        </span>
        <span className="text-red-200">{error}</span>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="mt-6 rounded-lg border border-cyan-400/30 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 backdrop-blur-sm px-5 py-4 text-sm flex items-center gap-3">
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-500/30 border-2 border-cyan-400/60 shadow-lg flex-shrink-0">
          <span className="text-base">📚</span>
        </span>
        <span className="text-cyan-200">
          当前地址还没有购买任何课程，可以前往「课程平台」选购一门课程试试。
        </span>
      </div>
    );
  }

  return (
    <ul className="mt-6 grid gap-4 md:grid-cols-2">
      {courses.map((course) => {
        const price = formatUnits(course.price, 18);
        const isAuthor = userAddress && course.author.toLowerCase() === userAddress.toLowerCase();
        const meta = (course.metadataURI || '').trim();
        const urlLike = meta && isHttpUrl(meta);

        return (
          <li
            key={course.id.toString()}
            className="h-full rounded-xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 p-5 shadow-lg transition-all hover:border-cyan-400/50 hover:shadow-cyan-500/20 hover:scale-[1.02]"
          >
            <div className="flex h-full flex-col justify-between gap-4">
              {/* 上半区：标题 & 简要信息 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-white">📖 课程 #{course.id.toString()}</p>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      isAuthor
                        ? 'border border-amber-400/50 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300'
                        : 'border border-emerald-400/50 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300'
                    }`}
                  >
                    {isAuthor ? '✍️ 我是作者' : '✅ 已购买'}
                  </span>
                  {!course.isActive && (
                    <span className="inline-flex items-center rounded-full border border-slate-400/50 bg-slate-500/20 px-2.5 py-0.5 text-xs text-slate-300">
                      ⚠️ 已下架
                    </span>
                  )}
                </div>

                {/* metadataURI：URL → 用右侧按钮；否则直接展示简介文案 */}
                {meta ? (
                  urlLike ? (
                    <p className="text-xs text-slate-300">
                      🔗 已配置课程外部页面，可通过下方「去学习」进入。
                    </p>
                  ) : (
                    <p className="text-xs text-slate-300">📝 课程简介：{meta}</p>
                  )
                ) : (
                  <p className="text-xs text-slate-400">暂无课程简介</p>
                )}

                <p className="text-xs text-slate-400">
                  🎓 学生人数：
                  <span className="text-slate-300">{course.studentCount.toString()}</span>
                </p>
                <p className="text-xs text-slate-400">
                  📅 创建时间：
                  <span className="text-slate-300">{formatDateTime(course.createdAt)}</span>
                </p>
              </div>

              {/* 下半区：价格 + 去学习按钮 */}
              <div className="flex flex-col items-end gap-2">
                <p className="text-sm font-bold text-white">
                  💰 价格：<span className="text-cyan-400">{price} YD</span>
                </p>
                {meta && urlLike && (
                  <a
                    href={meta}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-xs font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-cyan-500/50"
                  >
                    🚀 去学习
                  </a>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
};
