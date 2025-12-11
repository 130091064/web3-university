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
      <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
        连接钱包后即可查看本地址的课程记录。
      </div>
    );
  }

  if (isWrongNetwork) {
    return (
      <div className="mt-6 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
        当前网络暂不支持读取课程记录，请在顶部切换到 Sepolia Testnet 后再查看。
      </div>
    );
  }

  if (isLoading) {
    return <div className="mt-6 text-sm text-slate-500">正在加载课程数据…</div>;
  }

  if (error) {
    return <div className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>;
  }

  if (courses.length === 0) {
    return (
      <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
        当前地址还没有购买任何课程，可以前往「课程平台」选购一门课程试试。
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
            className="h-full rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm"
          >
            <div className="flex h-full flex-col justify-between gap-3 md:gap-2">
              {/* 上半区：标题 & 简要信息 */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">
                    课程 #{course.id.toString()}
                  </p>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      isAuthor
                        ? 'border border-amber-100 bg-amber-50 text-amber-700'
                        : 'border border-emerald-100 bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {isAuthor ? '我是作者' : '已购买'}
                  </span>
                  {!course.isActive && (
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-500">
                      已下架
                    </span>
                  )}
                </div>

                {/* metadataURI：URL → 用右侧按钮；否则直接展示简介文案 */}
                {meta ? (
                  urlLike ? (
                    <p className="text-xs text-slate-500">
                      已配置课程外部页面，可通过右侧「去学习」进入。
                    </p>
                  ) : (
                    <p className="text-xs text-slate-600">课程简介：{meta}</p>
                  )
                ) : (
                  <p className="text-xs text-slate-400">暂无课程简介</p>
                )}

                <p className="text-xs text-slate-500">学生人数：{course.studentCount.toString()}</p>
                <p className="text-xs text-slate-500">
                  创建时间：{formatDateTime(course.createdAt)}
                </p>
              </div>

              {/* 下半区：价格 + 去学习按钮 */}
              <div className="flex flex-col items-end gap-2">
                <p className="text-sm font-semibold text-slate-900">价格：{price} YD</p>
                {meta && urlLike && (
                  <a
                    href={meta}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-xl bg-sky-500 px-4 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-sky-600"
                  >
                    去学习
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
