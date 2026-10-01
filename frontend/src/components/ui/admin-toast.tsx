"use client";

import { NotificationToast } from "@/components/ui/notification-toast";
import React, { createContext, useCallback, useContext, useState } from "react";

type ToastInput = {
  title: string;
  message: string;
  variant?: "success" | "error";
  durationMs?: number;
};

type ToastItem = ToastInput & {
  id: string;
};

type ToastContextValue = {
  notify: (input: ToastInput) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function AdminToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    ({ title, message, variant = "success", durationMs = 4000 }: ToastInput) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts((prev) => [
        ...prev,
        { id, title, message, variant, durationMs },
      ]);

      window.setTimeout(() => dismiss(id), durationMs);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ notify, dismiss }}>
      {children}
      <div className="fixed right-6 bottom-6 z-[60] space-y-3">
        {toasts.map((toast) => (
          <NotificationToast
            key={toast.id}
            title={toast.title}
            message={toast.message}
            variant={toast.variant}
            onClose={() => dismiss(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useAdminToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useAdminToast must be used within AdminToastProvider");
  }
  return ctx;
}
