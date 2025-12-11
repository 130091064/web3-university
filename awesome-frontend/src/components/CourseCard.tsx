import { formatDateTime } from '@utils';
import { formatUnits } from 'viem';

export interface UICourse {
  id: bigint;
  author: `0x${string}`;
  price: bigint;
  metadataURI: string;
  isActive: boolean;
  studentCount?: bigint;
  createdAt?: bigint;
  isAuthor: boolean;
  hasPurchased: boolean;
}

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
  let statusColor = '';

  if (!isActive) {
    statusText = '下架';
    statusColor = 'bg-slate-100 text-slate-500';
  } else if (course.isAuthor) {
    statusText = '我的课程';
    statusColor = 'bg-amber-50 text-amber-700';
  } else if (course.hasPurchased) {
    statusText = '已购买';
    statusColor = 'bg-emerald-50 text-emerald-700';
  } else {
    statusText = '上架中';
    statusColor = 'bg-sky-50 text-sky-700';
  }

  // 按钮文案
  let buttonLabel = '购买';
  if (course.isAuthor) {
    buttonLabel = '作者';
  } else if (course.hasPurchased) {
    buttonLabel = '已购买';
  }

  const canBuy = isActive && !course.isAuthor && !course.hasPurchased && !disabled;

  const trimmedMeta = (metadataURI || '').trim();
  const isUrl = /^https?:\/\//i.test(trimmedMeta);

  return (
    <div className="flex flex-col justify-between rounded-2xl bg-white/90 p-4 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              课程 #{id.toString()}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${statusColor}`}
            >
              {statusText}
            </span>
          </div>

          <p className="text-xs text-slate-500">
            作者：
            <span className="font-mono text-slate-700">{shorten(author)}</span>
          </p>

          {createdAtText && <p className="text-[11px] text-slate-500">创建于：{createdAtText}</p>}
        </div>

        <div className="shrink-0 text-right">
          <div className="text-sm font-semibold text-slate-900">{formattedPrice} YD</div>
          {studentCount !== undefined && (
            <div className="mt-1 text-xs text-slate-500">已购 {studentCount.toString()} 人</div>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          {trimmedMeta ? (
            isUrl ? (
              <a
                href={trimmedMeta}
                target="_blank"
                rel="noreferrer"
                className="truncate text-xs text-sky-600 underline-offset-2 hover:text-sky-700 hover:underline"
                title={trimmedMeta}
              >
                课程链接：{trimmedMeta}
              </a>
            ) : (
              <p className="line-clamp-2 text-xs text-slate-600">{trimmedMeta}</p>
            )
          ) : (
            <p className="text-xs text-slate-400">暂无课程简介</p>
          )}
        </div>

        <button
          type="button"
          disabled={!canBuy || buying}
          onClick={() => onBuy(id)}
          className="shrink-0 cursor-pointer rounded-xl bg-linear-to-r from-sky-500 to-indigo-500 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:bg-none disabled:text-slate-500"
        >
          {buying ? '处理中...' : buttonLabel}
        </button>
      </div>
    </div>
  );
};
