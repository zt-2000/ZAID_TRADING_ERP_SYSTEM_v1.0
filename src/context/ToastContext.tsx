import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastMessage } from '../types';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

interface ToastContextType {
  toasts: ToastMessage[];
  showToast: (title: string, description?: string, type?: ToastMessage['type'], duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((
    title: string,
    description?: string,
    type: ToastMessage['type'] = 'info',
    duration = 4000
  ) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, title, description, type, duration };
    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          let Icon = Info;
          let iconColor = 'text-blue-600 dark:text-blue-400';
          let borderClass = 'border-slate-200 dark:border-neutral-800';

          if (toast.type === 'success') {
            Icon = CheckCircle2;
            iconColor = 'text-[#167a53] dark:text-[#34d399]';
            borderClass = 'border-[#167a53]/30 dark:border-[#167a53]/40';
          } else if (toast.type === 'error') {
            Icon = AlertCircle;
            iconColor = 'text-rose-600 dark:text-rose-400';
            borderClass = 'border-rose-200 dark:border-rose-900/40';
          } else if (toast.type === 'warning') {
            Icon = AlertTriangle;
            iconColor = 'text-amber-600 dark:text-amber-400';
            borderClass = 'border-amber-200 dark:border-amber-900/40';
          }

          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-[#181f1b] border ${borderClass} shadow-lg shadow-black/5 dark:shadow-black/30 transition-all transform animate-in slide-in-from-right duration-200`}
            >
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-neutral-100">{toast.title}</p>
                {toast.description && (
                  <p className="text-xs text-slate-600 dark:text-neutral-400 mt-0.5 leading-relaxed">
                    {toast.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 p-0.5 rounded transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
