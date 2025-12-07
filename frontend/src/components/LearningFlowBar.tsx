// src/components/LearningFlowBar.tsx
import React from "react";
import { useNavigate } from "react-router-dom";

type LearningFlowBarProps = {
  /** 当前所在步骤 1~5，用来高亮 */
  currentStep?: number;
};

type StepConfig = {
  id: number;
  label: string;
  description: string;
  to?: string; // 有路由的步骤可以点击跳转
};

const steps: StepConfig[] = [
  {
    id: 1,
    label: "充 ETH",
    description: "从交易所或水龙头获取测试 ETH。",
    // 一般是站外动作，所以不设置 to
  },
  {
    id: 2,
    label: "换 YD",
    description: "在资产兑换页，用 ETH 换取平台代币 YD。",
    to: "/",
  },
  {
    id: 3,
    label: "买课程",
    description: "在课程市场使用 YD 购买课程。",
    to: "/courses",
  },
  {
    id: 4,
    label: "换 USDT",
    description: "将 YD 兑换为 USDT，作为学习收益。",
    to: "/swap",
  },
  {
    id: 5,
    label: "存金库",
    description: "把 USDT 存入理财金库，按链上利率自动赚取利息。",
    to: "/vault",
  },
];

export const LearningFlowBar: React.FC<LearningFlowBarProps> = ({
  currentStep,
}) => {
  const navigate = useNavigate();

  const handleStepClick = (step: StepConfig) => {
    if (!step.to) return;
    navigate(step.to);
  };

  return (
    <section className="rounded-2xl bg-slate-50/80 px-4 py-3 shadow-sm ring-1 ring-slate-100 sm:px-5 sm:py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* 左侧：标题 + 步骤条 */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900">资金流转路径</p>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
            {steps.map((step, index) => {
              const isActive = currentStep === step.id;
              const isClickable = Boolean(step.to);
              const isLast = index === steps.length - 1;

              return (
                <React.Fragment key={step.id}>
                  <div className="relative group">
                    <button
                      type="button"
                      onClick={() => handleStepClick(step)}
                      disabled={!isClickable}
                      className={[
                        "inline-flex items-center rounded-full border px-3.5 py-1.5 transition-all duration-200",
                        isActive
                          ? "border-sky-400 bg-sky-500 text-white shadow-sm"
                          : "border-slate-200 bg-white text-slate-800",
                        isClickable
                          ? [
                              "cursor-pointer",
                              "hover:-translate-y-0.5",
                              "hover:shadow-md",
                              "hover:border-sky-300",
                              "hover:bg-sky-50",
                              "hover:text-sky-700",
                              "active:translate-y-0",
                              "active:shadow-sm",
                            ].join(" ")
                          : "cursor-default opacity-80",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold",
                          isActive
                            ? "bg-white/90 text-sky-600"
                            : "bg-slate-100 text-slate-600",
                        ].join(" ")}
                      >
                        {step.id}
                      </span>
                      <span className="ml-2 whitespace-nowrap">
                        {step.label}
                      </span>
                    </button>

                    {/* 悬浮提示气泡（替代“点击跳转”文案） */}
                    <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-max -translate-x-1/2 rounded-xl bg-slate-900 px-3 py-1.5 text-[11px] text-slate-50 shadow-lg group-hover:block">
                      {step.description}
                    </div>
                  </div>

                  {!isLast && <span className="mx-1 text-slate-300">→</span>}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* 右侧：一句说明文案（垂直居中对齐） */}
        <p className="text-xs text-slate-400 sm:text-right">
          从 ETH 到课程收益与理财的完整链路。
        </p>
      </div>
    </section>
  );
};
