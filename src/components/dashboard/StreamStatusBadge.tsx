"use client";

import { getStreamStatusMeta, type StreamLifecycleStatus } from "@/lib/utils/streamLifecycle";

type StreamStatusBadgeProps = {
  status: StreamLifecycleStatus;
  readyToClose?: boolean;
};

const toneClasses = {
  neutral: "bg-zinc-100 text-zinc-600",
  warning: "bg-amber-50 text-amber-700",
  success: "bg-emerald-50 text-emerald-700",
  accent: "bg-violet-50 text-violet-700",
  danger: "bg-red-50 text-red-600",
} as const;

export function StreamStatusBadge({ status, readyToClose = false }: StreamStatusBadgeProps) {
  const meta = getStreamStatusMeta(status, readyToClose);

  return (
    <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-medium ${toneClasses[meta.tone]}`}>
      {meta.label}
    </span>
  );
}
