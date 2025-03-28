'use client';

import React, { createContext, useContext, useState } from 'react';

interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (toast: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = (data: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { id, ...data };
    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      dismiss(id);
    }, 5000);
  };

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const dismissAll = () => {
    setToasts([]);
  };

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss, dismissAll }}>
      {children}
      {toasts.length > 0 && (
        <div className="fixed bottom-0 right-0 z-50 p-4 space-y-4 w-full max-w-sm">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`p-4 rounded-md shadow-lg border ${
                toast.variant === 'destructive'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-white border-gray-200'
              }`}
            >
              {toast.title && (
                <div className="font-medium">{toast.title}</div>
              )}
              {toast.description && (
                <div className="mt-1 text-sm text-gray-700">
                  {toast.description}
                </div>
              )}
              <button
                onClick={() => dismiss(toast.id)}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}; 