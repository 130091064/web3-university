import React from 'react';
import { CourseCard, type UICourse } from './CourseCard';

interface CourseListProps {
  courses: UICourse[];
  onBuy: (courseId: bigint) => void;
  buyingCourseId?: bigint;
  disabled: boolean;
  loading: boolean;
}

export const CourseList: React.FC<CourseListProps> = ({ courses, onBuy, buyingCourseId, disabled, loading }) => {
  return (
    <section className="rounded-3xl bg-gradient-to-br from-white via-sky-50 to-blue-50/80 p-5 shadow-xl shadow-sky-100/70 ring-1 ring-sky-100/80">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">课程列表</h2>
        {loading && <span className="text-xs text-slate-500">加载课程中...</span>}
      </div>

      {courses.length === 0 ? (
        <p className="text-sm text-slate-500">暂无课程，你可以先创建一门课程试试。</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {courses.map((course) => (
            <CourseCard
              key={course.id.toString()}
              course={course}
              onBuy={onBuy}
              buying={buyingCourseId !== undefined && buyingCourseId === course.id}
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </section>
  );
};
