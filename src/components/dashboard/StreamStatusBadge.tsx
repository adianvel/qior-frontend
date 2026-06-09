"use client";

import { getStreamStatusMeta, type StreamLifecycleStatus } from "@/lib/utils/streamLifecycle";

type StreamStatusBadgeProps = {
  status: StreamLifecycleStatus;
  readyToClose?: boolean;
};

const toneClasses = {
  neutral: "bg-zinc-100 text-zinc-600 ring-zinc-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  accent: "bg-violet-50 text-violet-700 ring-violet-200",
  danger: "bg-red-50 text-red-600 ring-red-200",
} as const;

export function StreamStatusBadge({ status, readyToClose = false }: StreamStatusBadgeProps) {
  const meta = getStreamStatusMeta(status, readyToClose);

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${toneClasses[meta.tone]}`}>
      {meta.label}
    </span>
  );
}
