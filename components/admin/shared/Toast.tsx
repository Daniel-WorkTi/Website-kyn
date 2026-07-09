"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

export type ToastType = "ok" | "error" | "pending";

export type ToastState = {
  message: string;
  type: ToastType;
} | null;

type ToastProps = {
  toast: ToastState;
  onDismiss: () => void;
};

export function Toast({ toast, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!toast) {
      setVisible(false);
      return;
    }
    setVisible(true);
    if (toast.type !== "pending") {
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onDismiss, 200);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast, onDismiss]);

  if (!toast) return null;

  const Icon =
    toast.type === "error" ? XCircle : toast.type === "pending" ? Loader2 : CheckCircle2;

  const colors =
    toast.type === "error"
      ? "border-red-500/30 bg-red-950/90 text-red-100"
      : toast.type === "pending"
        ? "border-white/10 bg-zinc-900/95 text-zinc-200"
        : "border-accent/30 bg-zinc-900/95 text-white";

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        "fixed bottom-6 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-2.5",
        "rounded-xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-md",
        "transition-all duration-200",
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0 pointer-events-none",
        colors
      ].join(" ")}
    >
      <Icon
        className={["size-4 shrink-0", toast.type === "pending" ? "animate-spin" : ""].join(" ")}
        strokeWidth={1.75}
      />
      <span>{toast.message}</span>
    </div>
  );
}
