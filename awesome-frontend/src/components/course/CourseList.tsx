import type { UICourse } from '@types';
import { CourseCard } from './CourseCard';

interface CourseListProps {
  courses: UICourse[];
  onBuy: (courseId: bigint) => void;
  buyingCourseId?: bigint;
  disabled: boolean;
  loading: boolean;
}

export const CourseList = ({
  courses,
  onBuy,
  buyingCourseId,
  disabled,
  loading,
}: CourseListProps) => {
  const isEmpty = courses.length === 0;

  return (
    <section className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/20 p-4 shadow-2xl sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="inline-block w-1.5 h-5 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full"></span>
            课程列表
          </h2>
          <p className="mt-1 text-sm text-slate-300">浏览当前上架的课程，用 YD 一键购买</p>
        </div>

        {loading && (
          <span className="rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs text-slate-300">
            加载中…
          </span>
        )}
      </div>

      {isEmpty ? (
        <div className="rounded-xl border-2 border-dashed border-white/20 bg-white/5 backdrop-blur-sm p-6 text-center">
          <div className="text-4xl mb-3">📚</div>
          <p className="text-sm text-slate-300">
            {disabled ? '连接钱包后可创建课程或查看已购课程' : '暂时没有课程，你可以先创建一门'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
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
