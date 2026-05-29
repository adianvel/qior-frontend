import type { StreamAccount } from "@/lib/anchor/types";

export type StreamMode = "time-based" | "milestone-based";

export type StreamLifecycleStatus =
  | "scheduled"
  | "cliff_locked"
  | "vesting"
  | "claimable"
  | "fully_vested_unclaimed"
  | "awaiting_milestone"
  | "milestone_ready"
  | "completed"
  | "cancelled";

export type StreamStatusTone = "neutral" | "warning" | "success" | "accent" | "danger";

export type StreamAmountBreakdown = {
  total: number;
  vested: number;
  claimable: number;
  claimed: number;
  locked: number;
  vestingProgressPct: number;
  claimProgressPct: number;
};

export type DerivedStreamLifecycle = {
  mode: StreamMode;
  status: StreamLifecycleStatus;
  readyToClose: boolean;
  breakdown: StreamAmountBreakdown;
  nextEventLabel: string;
};

export type StreamFilterStatus =
  | "all"
  | "action-needed"
  | "claimable"
  | "awaiting-milestone"
  | "ready-to-close"
  | "completed"
  | "cancelled";

type LifecycleStream = Pick<
  StreamAccount,
  | "totalAmount"
  | "withdrawnAmount"
  | "startTime"
  | "cliffTime"
  | "endTime"
  | "canceled"
  | "milestoneBased"
  | "milestoneReached"
>;

function clampPercentage(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function formatRelativeTimestamp(targetTime: number, now: number): string {
  const seconds = targetTime - now;

  if (seconds <= 0) return "now";

  const days = Math.floor(seconds / 86_400);
  if (days > 0) return `in ${days}d`;

  const hours = Math.floor(seconds / 3_600);
  if (hours > 0) return `in ${hours}h`;

  const minutes = Math.floor(seconds / 60);
  if (minutes > 0) return `in ${minutes}m`;

  return "in <1m";
}

export function getStreamMode(stream: Pick<LifecycleStream, "milestoneBased">): StreamMode {
  return stream.milestoneBased ? "milestone-based" : "time-based";
}

export function getModeLabel(mode: StreamMode): string {
  return mode === "milestone-based" ? "Milestone" : "Time-based";
}

export function getVestedAmountAtTime(
  totalAmount: number,
  startTime: number,
  cliffTime: number,
  endTime: number,
  now = Math.floor(Date.now() / 1000)
): number {
  if (now < cliffTime) return 0;
  if (now >= endTime) return totalAmount;
  if (endTime <= startTime) return 0;

  return Math.floor(totalAmount * (now - startTime) / (endTime - startTime));
}

export function getStreamVestedAmount(stream: LifecycleStream, now = Math.floor(Date.now() / 1000)): number {
  if (stream.milestoneBased) {
    return stream.milestoneReached ? stream.totalAmount : 0;
  }

  return getVestedAmountAtTime(
    stream.totalAmount,
    stream.startTime,
    stream.cliffTime,
    stream.endTime,
    now
  );
}

export function getStreamClaimableAmount(stream: LifecycleStream, now = Math.floor(Date.now() / 1000)): number {
  const vested = getStreamVestedAmount(stream, now);
  return Math.max(0, vested - stream.withdrawnAmount);
}

export function getStreamAmountBreakdown(
  stream: LifecycleStream,
  now = Math.floor(Date.now() / 1000)
): StreamAmountBreakdown {
  const total = stream.totalAmount;
  const vested = getStreamVestedAmount(stream, now);
  const claimable = Math.max(0, vested - stream.withdrawnAmount);
  const claimed = Math.min(stream.withdrawnAmount, total);
  const locked = Math.max(0, total - vested);
  const vestingProgressPct = total > 0 ? clampPercentage((vested / total) * 100) : 0;
  const claimProgressPct = total > 0 ? clampPercentage((claimed / total) * 100) : 0;

  return {
    total,
    vested,
    claimable,
    claimed,
    locked,
    vestingProgressPct,
    claimProgressPct,
  };
}

export function isStreamReadyToClose(stream: LifecycleStream): boolean {
  return stream.canceled || stream.withdrawnAmount >= stream.totalAmount;
}

export function getStreamLifecycleStatus(
  stream: LifecycleStream,
  now = Math.floor(Date.now() / 1000)
): StreamLifecycleStatus {
  if (stream.canceled) return "cancelled";
  if (stream.withdrawnAmount >= stream.totalAmount) return "completed";

  if (stream.milestoneBased) {
    if (!stream.milestoneReached) return "awaiting_milestone";

    return getStreamClaimableAmount(stream, now) > 0 ? "milestone_ready" : "completed";
  }

  if (now < stream.startTime) return "scheduled";
  if (now < stream.cliffTime) return "cliff_locked";

  const breakdown = getStreamAmountBreakdown(stream, now);
  if (breakdown.claimable > 0) {
    return breakdown.vested >= breakdown.total ? "fully_vested_unclaimed" : "claimable";
  }

  return now >= stream.endTime ? "completed" : "vesting";
}

export function getStreamNextEventLabel(stream: LifecycleStream, now = Math.floor(Date.now() / 1000)): string {
  if (stream.canceled) return isStreamReadyToClose(stream) ? "Ready to close" : "Cancelled";
  if (stream.withdrawnAmount >= stream.totalAmount) return "Ready to close";

  if (stream.milestoneBased) {
    return stream.milestoneReached ? "Available now" : "Waiting for milestone";
  }

  if (now < stream.startTime) return `Starts ${formatRelativeTimestamp(stream.startTime, now)}`;
  if (now < stream.cliffTime) return `Cliff ${formatRelativeTimestamp(stream.cliffTime, now)}`;

  const breakdown = getStreamAmountBreakdown(stream, now);
  if (breakdown.claimable > 0) return "Available now";
  if (now >= stream.endTime) return "Fully unlocked";

  return `Ends ${formatRelativeTimestamp(stream.endTime, now)}`;
}

export function deriveStreamLifecycle(
  stream: LifecycleStream,
  now = Math.floor(Date.now() / 1000)
): DerivedStreamLifecycle {
  return {
    mode: getStreamMode(stream),
    status: getStreamLifecycleStatus(stream, now),
    readyToClose: isStreamReadyToClose(stream),
    breakdown: getStreamAmountBreakdown(stream, now),
    nextEventLabel: getStreamNextEventLabel(stream, now),
  };
}

export function getStreamStatusMeta(
  status: StreamLifecycleStatus,
  readyToClose = false
): { label: string; tone: StreamStatusTone } {
  if (readyToClose) {
    return { label: "Ready to close", tone: "accent" };
  }

  switch (status) {
    case "scheduled":
      return { label: "Scheduled", tone: "neutral" };
    case "cliff_locked":
      return { label: "Cliff locked", tone: "warning" };
    case "vesting":
      return { label: "Vesting", tone: "success" };
    case "claimable":
      return { label: "Claimable", tone: "success" };
    case "fully_vested_unclaimed":
      return { label: "Fully vested", tone: "accent" };
    case "awaiting_milestone":
      return { label: "Awaiting milestone", tone: "warning" };
    case "milestone_ready":
      return { label: "Milestone ready", tone: "accent" };
    case "completed":
      return { label: "Completed", tone: "neutral" };
    case "cancelled":
      return { label: "Cancelled", tone: "danger" };
  }
}

export function getStreamUrgencyScore(lifecycle: DerivedStreamLifecycle): number {
  if (lifecycle.readyToClose) return 6;
  if (lifecycle.status === "awaiting_milestone") return 5;
  if (lifecycle.status === "milestone_ready") return 4;
  if (lifecycle.status === "fully_vested_unclaimed") return 4;
  if (lifecycle.status === "claimable") return 3;
  if (lifecycle.status === "cliff_locked") return 2;
  if (lifecycle.status === "scheduled") return 1;

  return 0;
}

export function matchesStreamFilter(
  lifecycle: DerivedStreamLifecycle,
  filter: StreamFilterStatus
): boolean {
  switch (filter) {
    case "all":
      return true;
    case "action-needed":
      return lifecycle.readyToClose
        || lifecycle.status === "awaiting_milestone"
        || lifecycle.status === "claimable"
        || lifecycle.status === "fully_vested_unclaimed"
        || lifecycle.status === "milestone_ready";
    case "claimable":
      return lifecycle.breakdown.claimable > 0;
    case "awaiting-milestone":
      return lifecycle.status === "awaiting_milestone";
    case "ready-to-close":
      return lifecycle.readyToClose;
    case "completed":
      return lifecycle.status === "completed";
    case "cancelled":
      return lifecycle.status === "cancelled";
  }
}
