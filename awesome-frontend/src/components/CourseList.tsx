import React from "react";
import { CourseCard, type UICourse } from "./CourseCard";

interface CourseListProps {
  courses: UICourse[];
  onBuy: (courseId: bigint) => void;
  buyingCourseId?: bigint;
  disabled: boolean;
  loading: boolean;
}

export const CourseList: React.FC<CourseListProps> = ({
  courses,
  onBuy,
  buyingCourseId,
  disabled,
  loading,
}) => {
  const isEmpty = courses.length === 0;

  return (
    <section className="rounded-2xl bg-slate-50/80 p-4 shadow-sm ring-1 ring-slate-100 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">课程列表</h2>
          <p className="mt-1 text-xs text-slate-500">
            浏览当前上架的课程，用 YD 一键购买。
          </p>
        </div>

        {loading && (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-500">
            加载中…
          </span>
        )}
      </div>

      {isEmpty ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 p-5 text-sm text-slate-500">
          {disabled ? (
            <p>连接钱包后可创建课程或查看已购课程。</p>
          ) : (
            <p>暂时没有课程，你可以先创建一门。</p>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {courses.map((course) => (
            <CourseCard
              key={course.id.toString()}
              course={course}
              onBuy={onBuy}
              buying={
                buyingCourseId !== undefined && buyingCourseId === course.id
              }
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </section>
  );
};
