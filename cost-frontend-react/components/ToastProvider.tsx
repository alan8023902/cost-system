import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export type ToastItem = {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
};

type ToastContextValue = {
  push: (toast: Omit<ToastItem, 'id'>) => void;
  success: (message: string, options?: Partial<Omit<ToastItem, 'id' | 'type' | 'message'>>) => void;
  error: (message: string, options?: Partial<Omit<ToastItem, 'id' | 'type' | 'message'>>) => void;
  warning: (message: string, options?: Partial<Omit<ToastItem, 'id' | 'type' | 'message'>>) => void;
  info: (message: string, options?: Partial<Omit<ToastItem, 'id' | 'type' | 'message'>>) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 2600;

const iconMap: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={16} className="text-emerald-600" />,
  error: <XCircle size={16} className="text-red-600" />,
  warning: <AlertTriangle size={16} className="text-amber-600" />,
  info: <Info size={16} className="text-blue-600" />,
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const duration = toast.duration ?? DEFAULT_DURATION;
    setToasts((prev) => [...prev, { ...toast, id }]);
    if (duration > 0) {
      window.setTimeout(() => removeToast(id), duration);
    }
  }, [removeToast]);

  const api = useMemo(() => ({
    push,
    success: (message: string, options?: Partial<Omit<ToastItem, 'id' | 'type' | 'message'>>) =>
      push({ type: 'success', message, ...options }),
    error: (message: string, options?: Partial<Omit<ToastItem, 'id' | 'type' | 'message'>>) =>
      push({ type: 'error', message, ...options }),
    warning: (message: string, options?: Partial<Omit<ToastItem, 'id' | 'type' | 'message'>>) =>
      push({ type: 'warning', message, ...options }),
    info: (message: string, options?: Partial<Omit<ToastItem, 'id' | 'type' | 'message'>>) =>
      push({ type: 'info', message, ...options }),
  }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="ui-toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`ui-toast ui-toast-${toast.type}`}>
            <div className="ui-toast-icon">{iconMap[toast.type]}</div>
            <div className="flex-1">
              {toast.title && <div className="text-xs font-semibold text-slate-800 mb-0.5">{toast.title}</div>}
              <div className="text-sm text-slate-700">{toast.message}</div>
            </div>
            <button
              className="ui-toast-close"
              onClick={() => removeToast(toast.id)}
              aria-label="关闭提示"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
};
