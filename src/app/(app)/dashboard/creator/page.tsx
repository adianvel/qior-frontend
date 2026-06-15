"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CircleAlert, CirclePlus, Layers, LoaderCircle } from "lucide-react";
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
  { value: "cliff", label: "Cliff" },
  { value: "linear", label: "Linear" },
  { value: "milestone", label: "Milestone" },
];

const STREAMS_PER_PAGE = 10;

export default function CreatorDashboardPage() {
  const { data: streams, isLoading, error, refetch } = useStreams("creator");
  const { data: mintDecimals = {} } = useMintDecimals(streams?.map((stream) => stream.mint) ?? []);
  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  const [selectedStatus, setSelectedStatus] = useState<StreamFilterStatus>("all");
  const [selectedMode, setSelectedMode] = useState<"all" | StreamMode>("all");
  const [currentPage, setCurrentPage] = useState(1);

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

  const awaitingMilestone = streamRows.filter((row) => row.lifecycle.status === "awaiting_milestone").length;
  const readyToClose = streamRows.filter((row) => row.lifecycle.readyToClose).length;
  const avgVestedProgress = streamRows.length > 0
    ? Math.round(streamRows.reduce((sum, row) => sum + row.lifecycle.breakdown.vestingProgressPct, 0) / streamRows.length)
    : 0;

  const filteredRows = streamRows.filter(({ lifecycle }) => {
    if (!matchesStreamFilter(lifecycle, selectedStatus)) return false;
    if (selectedMode !== "all" && lifecycle.mode !== selectedMode) return false;

    return true;
  });
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / STREAMS_PER_PAGE));
  const page = Math.min(currentPage, totalPages);
  const pageStart = (page - 1) * STREAMS_PER_PAGE;
  const pageRows = filteredRows.slice(pageStart, pageStart + STREAMS_PER_PAGE);
  const firstShown = filteredRows.length === 0 ? 0 : pageStart + 1;
  const lastShown = Math.min(pageStart + pageRows.length, filteredRows.length);

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 mb-8 lg:grid-cols-4">
        <MetricCard label="Total Streams" value={streams.length} hint="All creator-owned streams" />
        <MetricCard label="Avg Vested" value={`${avgVestedProgress}%`} hint="Average vesting progress" />
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
            <p className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-500">
              {filteredRows.length === 0 ? "0 shown" : `${firstShown}-${lastShown} of ${filteredRows.length} shown`}
            </p>
            <Link
              href="/create"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-violet-500 active:scale-[0.97]"
            >
              <CirclePlus size={13} strokeWidth={2.5} /> New
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {statusFilters.map((filter) => (
            <FilterChip
              key={filter.value}
              active={selectedStatus === filter.value}
              label={filter.label}
              onClick={() => {
                setSelectedStatus(filter.value);
                setCurrentPage(1);
              }}
            />
          ))}
          <span className="mx-1 hidden h-6 w-px bg-zinc-200 lg:inline-flex" />
          {modeFilters.map((filter) => (
            <FilterChip
              key={filter.value}
              active={selectedMode === filter.value}
              label={filter.label}
              onClick={() => {
                setSelectedMode(filter.value);
                setCurrentPage(1);
              }}
            />
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-[0_18px_60px_rgba(24,24,27,0.045)]">
        <div className="hidden grid-cols-[1.2fr_0.75fr_0.85fr_0.85fr_0.9fr_minmax(132px,0.8fr)] gap-3 border-b border-zinc-100 bg-zinc-50 px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400 md:grid">
          <span>Recipient</span>
          <span>Mode</span>
          <span>Vested</span>
          <span>Claimable</span>
          <span>Next Event</span>
          <span>Status</span>
        </div>
        {pageRows.map(({ stream, lifecycle }) => {
          const decimals = mintDecimals[stream.mint.toBase58()] ?? 6;

          return (
            <Link
              key={stream.publicKey.toBase58()}
              href={`/streams/${stream.publicKey.toBase58()}`}
              className="grid gap-4 border-b border-zinc-100 px-5 py-4 text-sm transition-colors hover:bg-zinc-50/80 md:grid-cols-[1.2fr_0.75fr_0.85fr_0.85fr_0.9fr_minmax(132px,0.8fr)] md:items-center md:gap-3"
            >
              <div className="flex items-start justify-between gap-3 md:block">
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400 md:hidden">Recipient</p>
                  <p className="font-mono text-xs font-semibold text-zinc-950">{shortenAddress(stream.recipient, 6)}</p>
                  <p className="mt-1 text-[11px] text-zinc-400">Claimed {formatTokenAmount(lifecycle.breakdown.claimed, decimals)}</p>
                </div>
                <div className="md:hidden">
                  <StreamStatusBadge status={lifecycle.status} readyToClose={lifecycle.readyToClose} />
                </div>
              </div>
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400 md:hidden">Mode</p>
                <span className="text-xs font-medium text-zinc-500">{getModeLabel(lifecycle.mode)}</span>
              </div>
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400 md:hidden">Vested</p>
                <span className="font-mono text-xs text-zinc-600">{formatTokenAmount(lifecycle.breakdown.vested, decimals)}</span>
              </div>
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400 md:hidden">Claimable</p>
                <span className="font-mono text-xs font-semibold text-zinc-950">{formatTokenAmount(lifecycle.breakdown.claimable, decimals)}</span>
              </div>
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400 md:hidden">Next Event</p>
                <span className="text-xs text-zinc-500">{lifecycle.nextEventLabel}</span>
              </div>
              <div className="hidden md:block">
                <StreamStatusBadge status={lifecycle.status} readyToClose={lifecycle.readyToClose} />
              </div>
            </Link>
          );
        })}
        {filteredRows.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-zinc-500">
            No streams match the current filters.
          </div>
        ) : null}
      </div>

      {filteredRows.length > 0 ? (
        <div className="mt-5 flex justify-center">
          <div className="inline-flex items-center gap-3 rounded-full bg-zinc-100 p-1 shadow-[inset_0_0_0_1px_rgba(24,24,27,0.05)]">
            <button
              type="button"
              onClick={() => setCurrentPage((value) => Math.max(1, value - 1))}
              disabled={page <= 1}
              aria-label="Previous page"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-zinc-950 shadow-[0_6px_18px_rgba(24,24,27,0.1)] transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:text-zinc-300 disabled:shadow-none"
            >
              <ArrowLeft size={23} strokeWidth={2.1} />
            </button>
            <p className="min-w-16 text-center text-base font-semibold text-zinc-600">
              {page} of {totalPages}
            </p>
            <button
              type="button"
              onClick={() => setCurrentPage((value) => Math.min(totalPages, value + 1))}
              disabled={page >= totalPages}
              aria-label="Next page"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-zinc-950 shadow-[0_6px_18px_rgba(24,24,27,0.1)] transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:text-zinc-300 disabled:shadow-none"
            >
              <ArrowRight size={23} strokeWidth={2.1} />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
