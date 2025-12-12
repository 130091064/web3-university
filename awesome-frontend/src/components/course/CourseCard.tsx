import type { UICourse } from '@types';
import { formatDateTime } from '@utils';
import { formatUnits } from 'viem';

const shorten = (addr: string) => (addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '');

interface CourseCardProps {
  course: UICourse;
  onBuy: (courseId: bigint) => void;
  buying: boolean;
  disabled: boolean;
}

export const CourseCard = ({ course, onBuy, buying, disabled }: CourseCardProps) => {
  const { id, author, price, metadataURI, isActive, studentCount, createdAt } = course;

  const formattedPrice = formatUnits(price, 18);
  const createdAtText = formatDateTime(createdAt);

  // 顶部状态标签
  let statusText = '';

  if (!isActive) {
    statusText = '下架';
  } else if (course.isAuthor) {
    statusText = '我的课程';
  } else if (course.hasPurchased) {
    statusText = '已购买';
  } else {
    statusText = '上架中';
  }

  const canBuy = isActive && !course.isAuthor && !course.hasPurchased && !disabled;

  const trimmedMeta = (metadataURI || '').trim();
  const isUrl = /^https?:\/\//i.test(trimmedMeta);

  return (
    <div className="group flex flex-col justify-between rounded-xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 p-4 shadow-lg transition-all hover:border-cyan-400/50 hover:shadow-xl hover:shadow-cyan-500/20">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              课程 #{id.toString()}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                !isActive
                  ? 'bg-slate-500/20 text-slate-300 border-slate-500/30'
                  : course.isAuthor
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : course.hasPurchased
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
              }`}
            >
              {statusText}
            </span>
          </div>

          <p className="text-xs text-slate-300">
            作者：
            <span className="font-mono text-cyan-400 ml-1">{shorten(author)}</span>
          </p>

          {createdAtText && <p className="text-xs text-slate-400">创建于：{createdAtText}</p>}
        </div>

        <div className="shrink-0 text-right">
          <div className="text-base font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            {formattedPrice} YD
          </div>
          {studentCount !== undefined && (
            <div className="mt-1 text-xs text-slate-400">👥 {studentCount.toString()} 人</div>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          {trimmedMeta ? (
            isUrl ? (
              <a
                href={trimmedMeta}
                target="_blank"
                rel="noreferrer"
                className="truncate text-xs text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1"
                title={trimmedMeta}
              >
                🔗 课程链接
              </a>
            ) : (
              <p className="line-clamp-2 text-xs text-slate-300">{trimmedMeta}</p>
            )
          ) : (
            <p className="text-xs text-slate-500">⚠️ 暂无课程简介</p>
          )}
        </div>

        <button
          type="button"
          disabled={!canBuy || buying}
          onClick={() => onBuy(id)}
          className={[
            'shrink-0 rounded-lg px-5 py-2 text-xs font-bold transition-all',
            canBuy
              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg hover:scale-[1.05] hover:shadow-cyan-500/50'
              : 'bg-white/10 border border-white/20 text-slate-400 cursor-not-allowed',
          ].join(' ')}
        >
          {buying
            ? '⏳ 处理中...'
            : course.isAuthor
              ? '👤 作者'
              : course.hasPurchased
                ? '✔️ 已购买'
                : '🛒 购买'}
        </button>
      </div>
    </div>
  );
};
