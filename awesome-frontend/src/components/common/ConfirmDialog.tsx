import { useState } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'info' | 'warning' | 'danger';
}

/**
 * 交易确认弹窗组件
 * 用于重要操作的二次确认
 */
export const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  onConfirm,
  onCancel,
  type = 'info',
}: ConfirmDialogProps) => {
  if (!isOpen) return null;

  const typeClasses = {
    info: {
      icon: 'ℹ️',
      confirmBg: 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:shadow-blue-500/50',
    },
    warning: {
      icon: '⚠️',
      confirmBg: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-amber-500/50',
    },
    danger: {
      icon: '🚨',
      confirmBg: 'bg-gradient-to-r from-red-500 to-pink-500 hover:shadow-red-500/50',
    },
  };

  const config = typeClasses[type];

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 p-6 shadow-2xl shadow-cyan-500/20 animate-slide-up">
        {/* 标题 */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">{config.icon}</span>
          <h2 className="text-lg font-bold text-white">{title}</h2>
        </div>

        {/* 消息内容 */}
        <div className="mb-6">
          <p className="text-sm text-slate-300 leading-relaxed">{message}</p>
        </div>

        {/* 按钮组 */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            type="button"
            className="flex-1 rounded-lg bg-white/10 border border-white/20 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/15 hover:text-white"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            type="button"
            className={`flex-1 rounded-lg px-4 py-3 text-sm font-bold text-white shadow-lg transition-all hover:scale-[1.02] ${config.confirmBg}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * 确认弹窗Hook
 */
export const useConfirmDialog = () => {
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'danger';
    onConfirm: () => void;
  } | null>(null);

  const confirm = (
    title: string,
    message: string,
    type: 'info' | 'warning' | 'danger' = 'info',
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialog({
        isOpen: true,
        title,
        message,
        type,
        onConfirm: () => {
          setDialog(null);
          resolve(true);
        },
      });
    });
  };

  const handleCancel = () => {
    setDialog(null);
  };

  const DialogComponent = () =>
    dialog ? (
      <ConfirmDialog
        isOpen={dialog.isOpen}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
        onConfirm={dialog.onConfirm}
        onCancel={handleCancel}
      />
    ) : null;

  return {
    confirm,
    DialogComponent,
  };
};
