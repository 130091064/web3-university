import { useEffect, useState } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose?: () => void;
}

/**
 * Toast提示组件
 * 用于显示友好的成功/错误提示
 */
export const Toast = ({ message, type = 'info', duration = 3000, onClose }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const colorClasses = {
    success:
      'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-500/50 text-emerald-300',
    error: 'bg-gradient-to-r from-red-500/20 to-pink-500/20 border-red-500/50 text-red-300',
    warning:
      'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/50 text-amber-300',
    info: 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/50 text-blue-300',
  };

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  };

  return (
    <div className="fixed top-20 right-4 z-[9999] animate-slide-up pointer-events-auto">
      <div
        className={`rounded-xl border backdrop-blur-md shadow-2xl px-5 py-4 max-w-md min-w-[300px] ${colorClasses[type]}`}
      >
        <div className="flex items-start gap-3">
          <span className="text-xl flex-shrink-0">{icons[type]}</span>
          <p className="text-sm flex-1 break-words">{message}</p>
          <button
            type="button"
            onClick={() => {
              setIsVisible(false);
              onClose?.();
            }}
            className="text-white/60 hover:text-white transition flex-shrink-0"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Toast管理Hook
 */
export const useToast = () => {
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
    key: number;
  } | null>(null);

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type, key: Date.now() });
  };

  const hideToast = () => {
    setToast(null);
  };

  const ToastComponent = () =>
    toast ? (
      <Toast key={toast.key} message={toast.message} type={toast.type} onClose={hideToast} />
    ) : null;

  return {
    showSuccess: (msg: string) => showToast(msg, 'success'),
    showError: (msg: string) => showToast(msg, 'error'),
    showWarning: (msg: string) => showToast(msg, 'warning'),
    showInfo: (msg: string) => showToast(msg, 'info'),
    ToastComponent,
  };
};
