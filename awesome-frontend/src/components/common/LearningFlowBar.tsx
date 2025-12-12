import { useNavigate } from 'react-router-dom';

type LearningFlowBarProps = {
  currentStep?: number;
};

type StepConfig = {
  id: number;
  label: string;
  description: string;
  to?: string;
};

const steps: StepConfig[] = [
  { id: 1, label: '充 ETH', description: '从交易所或水龙头获取测试 ETH。' },
  { id: 2, label: '换 YD', description: '在资产兑换页，用 ETH 换取平台代币 YD。', to: '/' },
  { id: 3, label: '买课程', description: '在课程市场使用 YD 购买课程。', to: '/courses' },
  { id: 4, label: '换 USDT', description: '将 YD 兑换为 USDT，作为学习收益。', to: '/swap' },
  {
    id: 5,
    label: '存金库',
    description: '把 USDT 存入理财金库，按链上利率自动赚取利息。',
    to: '/vault',
  },
];

export const LearningFlowBar = ({ currentStep }: LearningFlowBarProps) => {
  const navigate = useNavigate();

  const handleStepClick = (step: StepConfig) => {
    if (!step.to) return;
    navigate(step.to);
  };

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/5 via-white/10 to-white/5 backdrop-blur-md border border-white/20 shadow-2xl">
      <div className="px-4 py-5 sm:px-6">
        {/* 标题区域 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-5 bg-gradient-to-b from-blue-500 to-violet-500 rounded-full animate-pulse" />
              <span
                className="inline-block w-1 h-3 bg-gradient-to-b from-violet-500 to-cyan-500 rounded-full animate-pulse"
                style={{ animationDelay: '0.2s' }}
              />
            </div>
            <h3 className="text-base font-bold bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
              资金流转路径
            </h3>
          </div>
          <p className="hidden sm:block text-xs text-slate-300">
            从 ETH 到课程收益与理财的完整链路
          </p>
        </div>

        {/* 步骤流程 */}
        <div className="relative">
          {/* 背景进度条 */}
          <div className="absolute top-[22px] left-[40px] right-[40px] h-0.5 bg-gradient-to-r from-white/10 via-white/20 to-white/10" />

          {/* 当前进度动画条 */}
          {currentStep && (
            <div
              className="absolute top-[22px] left-[40px] h-0.5 bg-gradient-to-r from-blue-500 via-violet-500 to-cyan-500 transition-all duration-1000 ease-out shadow-lg shadow-blue-500/50"
              style={{
                width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
                maxWidth: 'calc(100% - 80px)',
              }}
            />
          )}

          <div className="flex items-center justify-between gap-2">
            {steps.map((step, index) => {
              const isActive = currentStep === step.id;
              const isPassed = currentStep ? step.id < currentStep : false;
              const isClickable = Boolean(step.to);

              return (
                <div key={step.id} className="relative flex-1 flex flex-col items-center group">
                  {/* 步骤圆圈按钮 */}
                  <button
                    type="button"
                    onClick={() => handleStepClick(step)}
                    disabled={!isClickable}
                    className={[
                      'relative z-10 flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold transition-all duration-300',
                      isActive
                        ? 'bg-gradient-to-br from-blue-500 to-violet-500 text-white shadow-lg shadow-blue-500/50 animate-pulse scale-110'
                        : isPassed
                          ? 'bg-gradient-to-br from-blue-500/30 to-violet-500/30 text-blue-300 border-2 border-blue-400/50'
                          : 'bg-white/10 backdrop-blur-sm text-slate-400 border-2 border-white/20',
                      isClickable && !isActive
                        ? 'cursor-pointer hover:scale-110 hover:bg-gradient-to-br hover:from-blue-500/50 hover:to-violet-500/50 hover:text-white hover:shadow-lg hover:shadow-blue-500/30'
                        : !isClickable
                          ? 'cursor-not-allowed opacity-60'
                          : '',
                    ].join(' ')}
                  >
                    {/* 激活状态的外圈光晕 */}
                    {isActive && (
                      <span className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 opacity-30 blur-md animate-ping" />
                    )}
                    <span className="relative z-10">{step.id}</span>
                  </button>

                  {/* 步骤标签 */}
                  <div className="mt-2 text-center">
                    <p
                      className={[
                        'text-xs font-semibold transition-colors duration-300 whitespace-nowrap',
                        isActive ? 'text-blue-400' : isPassed ? 'text-blue-300' : 'text-slate-300',
                      ].join(' ')}
                    >
                      {step.label}
                    </p>
                  </div>

                  {/* Hover 提示卡片 - 升级版 */}
                  <div className="pointer-events-none absolute top-full mt-3 hidden w-48 group-hover:block z-20 animate-fade-in">
                    <div className="relative rounded-xl bg-slate-900/98 backdrop-blur-md border-2 border-cyan-400/70 p-3 shadow-2xl shadow-cyan-500/50 ring-1 ring-cyan-300/30">
                      {/* 内发光效果 */}
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 pointer-events-none" />

                      {/* 小三角 */}
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 border-8 border-transparent border-b-slate-900/98" />

                      <div className="relative flex items-start gap-2">
                        <span className="text-lg">{['⚡', '🎯', '📚', '💰', '🏦'][index]}</span>
                        <div>
                          <p className="text-xs font-semibold text-white mb-1">{step.label}</p>
                          <p className="text-[10px] text-slate-300 leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                      </div>

                      {/* 顶部和底部光效 */}
                      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-70" />
                      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-70" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 移动端说明文案 */}
        <p className="sm:hidden text-xs text-slate-300 text-center mt-4">
          从 ETH 到课程收益与理财的完整链路
        </p>
      </div>
    </section>
  );
};
