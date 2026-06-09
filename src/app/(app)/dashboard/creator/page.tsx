"use client";

import { useState } from "react";
import Link from "next/link";
import { CircleAlert, CirclePlus, Layers, LoaderCircle } from "lucide-react";
import { FilterChip } from "@/components/dashboard/FilterChip";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { StreamStatusBadge } from "@/components/dashboard/StreamStatusBadge";
import { useStreams } from "@/hooks/useStreams";
import { useMintDecimals } from "@/hooks/useMintDecimals";
import { formatTokenAmount, shortenAddress } from "@/lib/utils/format";
import {
  deriveStreamLifecycle,
  getModeLabel,
  getStreamUrgencyScore,
  matchesStreamFilter,
  type StreamFilterStatus,
  type StreamMode,
} from "@/lib/utils/streamLifecycle";

const statusFilters: Array<{ value: StreamFilterStatus; label: string }> = [
  { value: "all", label: "All" },
  { value: "action-needed", label: "Needs action" },
  { value: "claimable", label: "Claimable" },
  { value: "awaiting-milestone", label: "Awaiting milestone" },
  { value: "ready-to-close", label: "Ready to close" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const modeFilters: Array<{ value: "all" | StreamMode; label: string }> = [
  { value: "all", label: "All modes" },
  { value: "time-based", label: "Time-based" },
  { value: "milestone-based", label: "Milestone" },
];

export default function CreatorDashboardPage() {
  const { data: streams, isLoading, error, refetch } = useStreams("creator");
  const { data: mintDecimals = {} } = useMintDecimals(streams?.map((stream) => stream.mint) ?? []);
  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  const [selectedStatus, setSelectedStatus] = useState<StreamFilterStatus>("all");
  const [selectedMode, setSelectedMode] = useState<"all" | StreamMode>("all");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoaderCircle size={32} className="animate-spin text-violet-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
        <CircleAlert size={48} strokeWidth={1.75} className="text-red-400" />
        <h2 className="text-lg font-semibold text-zinc-900">Couldn&apos;t load streams</h2>
        <p className="text-sm text-zinc-500 max-w-sm">
          {errorMessage}
        </p>
        <button
          onClick={() => refetch()}
          className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg active:scale-[0.97] transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!streams || streams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Layers size={48} strokeWidth={1.5} className="text-zinc-300" />
        <h2 className="text-lg font-semibold text-zinc-900">No streams yet</h2>
        <p className="text-sm text-zinc-500 text-center max-w-sm">
          You haven&apos;t created any vesting streams yet.
        </p>
        <Link
          href="/create"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg active:scale-[0.97] transition-all mt-2"
        >
          <CirclePlus size={16} strokeWidth={2.5} /> Create your first stream
        </Link>
      </div>
    );
  }

  const streamRows = streams
    .map((stream) => ({
      stream,
      lifecycle: deriveStreamLifecycle(stream),
    }))
    .sort((a, b) => {
      const urgencyDelta = getStreamUrgencyScore(b.lifecycle) - getStreamUrgencyScore(a.lifecycle);
      if (urgencyDelta !== 0) return urgencyDelta;

      return b.lifecycle.breakdown.claimable - a.lifecycle.breakdown.claimable;
    });

  const claimableNow = streamRows.filter((row) => row.lifecycle.breakdown.claimable > 0).length;
  const awaitingMilestone = streamRows.filter((row) => row.lifecycle.status === "awaiting_milestone").length;
  const readyToClose = streamRows.filter((row) => row.lifecycle.readyToClose).length;
  const avgVestedProgress = streamRows.length > 0
    ? Math.round(streamRows.reduce((sum, row) => sum + row.lifecycle.breakdown.vestingProgressPct, 0) / streamRows.length)
    : 0;
  const avgClaimProgress = streamRows.length > 0
    ? Math.round(streamRows.reduce((sum, row) => sum + row.lifecycle.breakdown.claimProgressPct, 0) / streamRows.length)
    : 0;

  const filteredRows = streamRows.filter(({ lifecycle }) => {
    if (!matchesStreamFilter(lifecycle, selectedStatus)) return false;
    if (selectedMode !== "all" && lifecycle.mode !== selectedMode) return false;

    return true;
  });

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 mb-8 xl:grid-cols-6">
        <MetricCard label="Total Streams" value={streams.length} hint="All creator-owned streams" />
        <MetricCard label="Avg Vested" value={`${avgVestedProgress}%`} hint="Average vesting progress" />
        <MetricCard label="Avg Claimed" value={`${avgClaimProgress}%`} hint="Average claimed progress" />
        <MetricCard label="Claimable Now" value={claimableNow} hint="Recipients can withdraw" />
        <MetricCard label="Awaiting Milestone" value={awaitingMilestone} hint="Needs creator follow-up" />
        <MetricCard label="Ready To Close" value={readyToClose} hint="Lifecycle already settled" />
      </div>

      <div className="mb-5 flex flex-col gap-4 rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_18px_60px_rgba(24,24,27,0.045)]">
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-zinc-950">My Streams</h1>
            <p className="text-xs leading-relaxed text-zinc-500">Sorted by urgency first so close-ready and action-needed streams stay on top.</p>
          </div>
          <div className="flex items-center gap-2">
            <p className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-500">{filteredRows.length} of {streamRows.length} shown</p>
            <Link
              href="/create"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-violet-500 active:scale-[0.97]"
            >
              <CirclePlus size={13} strokeWidth={2.5} /> New
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => (
            <FilterChip
              key={filter.value}
              active={selectedStatus === filter.value}
              label={filter.label}
              onClick={() => setSelectedStatus(filter.value)}
            />
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {modeFilters.map((filter) => (
            <FilterChip
              key={filter.value}
              active={selectedMode === filter.value}
              label={filter.label}
              onClick={() => setSelectedMode(filter.value)}
            />
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-[0_18px_60px_rgba(24,24,27,0.045)]">
        <div className="hidden grid-cols-[1.2fr_0.8fr_0.9fr_0.9fr_0.9fr_0.8fr] gap-3 border-b border-zinc-100 bg-zinc-50 px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400 md:grid">
          <span>Recipient</span>
          <span>Mode</span>
          <span>Vested</span>
          <span>Claimable</span>
          <span>Next Event</span>
          <span>Status</span>
        </div>
        {filteredRows.map(({ stream, lifecycle }) => {
          const decimals = mintDecimals[stream.mint.toBase58()] ?? 6;

          return (
            <Link
              key={stream.publicKey.toBase58()}
              href={`/streams/${stream.publicKey.toBase58()}`}
              className="grid gap-3 border-b border-zinc-100 px-5 py-4 text-sm transition-colors hover:bg-zinc-50/80 md:grid-cols-[1.2fr_0.8fr_0.9fr_0.9fr_0.9fr_0.8fr] md:items-center"
            >
              <div>
                <p className="font-mono text-xs font-semibold text-zinc-950">{shortenAddress(stream.recipient, 6)}</p>
                <p className="mt-1 text-[11px] text-zinc-400">Claimed {formatTokenAmount(lifecycle.breakdown.claimed, decimals)}</p>
              </div>
              <span className="text-xs font-medium text-zinc-500">{getModeLabel(lifecycle.mode)}</span>
              <span className="font-mono text-xs text-zinc-600">{formatTokenAmount(lifecycle.breakdown.vested, decimals)}</span>
              <span className="font-mono text-xs font-semibold text-violet-600">{formatTokenAmount(lifecycle.breakdown.claimable, decimals)}</span>
              <span className="text-xs text-zinc-500">{lifecycle.nextEventLabel}</span>
              <StreamStatusBadge status={lifecycle.status} readyToClose={lifecycle.readyToClose} />
            </Link>
          );
        })}
        {filteredRows.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-zinc-500">
            No streams match the current filters.
          </div>
        ) : null}
      </div>
    </div>
  );
}
