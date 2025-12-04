import React from "react";
import { formatUnits } from "viem";

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

const shorten = (addr: string) =>
  addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

// 简单的时间格式化：YYYY-MM-DD HH:mm
const formatDateTime = (ts?: bigint) => {
  if (!ts || ts === 0n) return "";
  const d = new Date(Number(ts) * 1000); // 合约里是秒，这里转毫秒
  const pad = (n: number) => n.toString().padStart(2, "0");
  const Y = d.getFullYear();
  const M = pad(d.getMonth() + 1);
  const D = pad(d.getDate());
  const h = pad(d.getHours());
  const m = pad(d.getMinutes());
  return `${Y}-${M}-${D} ${h}:${m}`;
};

interface CourseCardProps {
  course: UICourse;
  onBuy: (courseId: bigint) => void;
  buying: boolean;
  disabled: boolean;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  onBuy,
  buying,
  disabled,
}) => {
  const { id, author, price, metadataURI, isActive, studentCount, createdAt } =
    course;

  const formattedPrice = formatUnits(price, 18);
  const createdAtText = formatDateTime(createdAt);

  // 顶部状态标签
  let statusText = "";
  let statusColor = "";

  if (!isActive) {
    statusText = "已下架";
    statusColor = "bg-slate-100 text-slate-500";
  } else if (course.isAuthor) {
    statusText = "我是作者";
    statusColor = "bg-amber-50 text-amber-700";
  } else if (course.hasPurchased) {
    statusText = "已购买";
    statusColor = "bg-emerald-50 text-emerald-700";
  } else {
    statusText = "可购买";
    statusColor = "bg-sky-50 text-sky-700";
  }

  // 按钮文案 & 状态
  let buttonLabel = "购买课程";
  if (course.isAuthor) {
    buttonLabel = "我是作者";
  } else if (course.hasPurchased) {
    buttonLabel = "已购买";
  }

  const canBuy =
    isActive && !course.isAuthor && !course.hasPurchased && !disabled;

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
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

          <p className="mt-1 text-xs text-slate-500">
            作者：<span className="font-mono">{shorten(author)}</span>
          </p>

          {/* 创建时间 */}
          {createdAtText && (
            <p className="mt-1 text-[11px] text-slate-500">
              创建于：{createdAtText}
            </p>
          )}

          {/* 已购/作者提示 */}
          {course.isAuthor && (
            <p className="mt-1 text-[11px] text-amber-600">
              你是该课程的作者，自动拥有此课程。
            </p>
          )}
          {!course.isAuthor && course.hasPurchased && (
            <p className="mt-1 text-[11px] text-emerald-700">
              你已购买此课程，可以随时查看学习记录（后续可扩展）。
            </p>
          )}
        </div>

        <div className="text-right">
          <div className="text-sm font-semibold text-slate-800">
            {formattedPrice} YD
          </div>
          {studentCount !== undefined && (
            <div className="mt-1 text-xs text-slate-500">
              已有 {studentCount.toString()} 人购买
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <a
          href={metadataURI}
          target="_blank"
          rel="noreferrer"
          className="truncate text-xs text-sky-600 underline-offset-2 hover:underline"
        >
          {metadataURI || "无 metadataURI"}
        </a>

        <button
          disabled={!canBuy || buying}
          onClick={() => onBuy(id)}
          className="rounded-xl bg-sky-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {buying ? "处理中..." : buttonLabel}
        </button>
      </div>
    </div>
  );
};
