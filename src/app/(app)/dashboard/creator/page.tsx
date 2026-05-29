"use client";

import Link from "next/link";
import { CircleAlert, CirclePlus, Layers, LoaderCircle } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { StreamStatusBadge } from "@/components/dashboard/StreamStatusBadge";
import { useStreams } from "@/hooks/useStreams";
import { useMintDecimals } from "@/hooks/useMintDecimals";
import { formatTokenAmount, shortenAddress } from "@/lib/utils/format";
import { deriveStreamLifecycle, getModeLabel } from "@/lib/utils/streamLifecycle";

export default function CreatorDashboardPage() {
  const { data: streams, isLoading, error, refetch } = useStreams("creator");
  const { data: mintDecimals = {} } = useMintDecimals(streams?.map((stream) => stream.mint) ?? []);
  const errorMessage = error instanceof Error ? error.message : "Unknown error";

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
      const aPriority = Number(b.lifecycle.readyToClose) - Number(a.lifecycle.readyToClose);
      if (aPriority !== 0) return aPriority;

      return b.lifecycle.breakdown.claimable - a.lifecycle.breakdown.claimable;
    });

  const claimableNow = streamRows.filter((row) => row.lifecycle.breakdown.claimable > 0).length;
  const awaitingMilestone = streamRows.filter((row) => row.lifecycle.status === "awaiting_milestone").length;
  const readyToClose = streamRows.filter((row) => row.lifecycle.readyToClose).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">My Streams</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Streams you created as a token distributor.</p>
        </div>
        <Link
          href="/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg active:scale-[0.97] transition-all"
        >
          <CirclePlus size={14} strokeWidth={2.5} /> New Stream
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Total Streams" value={streams.length} hint="All creator-owned streams" />
        <MetricCard label="Claimable Now" value={claimableNow} hint="Recipients can withdraw" />
        <MetricCard label="Awaiting Milestone" value={awaitingMilestone} hint="Needs creator follow-up" />
        <MetricCard label="Ready To Close" value={readyToClose} hint="Lifecycle already settled" />
      </div>

      <div className="border border-zinc-200 rounded-xl bg-white overflow-hidden">
        <div className="grid grid-cols-[1.2fr_0.8fr_0.9fr_0.9fr_0.9fr_0.8fr] gap-3 px-5 py-3 border-b border-zinc-100 text-[11px] text-zinc-400 uppercase tracking-wide">
          <span>Recipient</span>
          <span>Mode</span>
          <span>Vested</span>
          <span>Claimable</span>
          <span>Next Event</span>
          <span>Status</span>
        </div>
        {streamRows.map(({ stream, lifecycle }) => {
          const decimals = mintDecimals[stream.mint.toBase58()] ?? 6;

          return (
            <Link
              key={stream.publicKey.toBase58()}
              href={`/streams/${stream.publicKey.toBase58()}`}
              className="grid grid-cols-[1.2fr_0.8fr_0.9fr_0.9fr_0.9fr_0.8fr] gap-3 items-center px-5 py-3.5 border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors text-sm"
            >
              <div>
                <p className="font-mono text-xs text-zinc-900">{shortenAddress(stream.recipient, 6)}</p>
                <p className="mt-1 text-[11px] text-zinc-400">Claimed {formatTokenAmount(lifecycle.breakdown.claimed, decimals)}</p>
              </div>
              <span className="text-zinc-500 text-xs">{getModeLabel(lifecycle.mode)}</span>
              <span className="text-zinc-600 font-mono text-xs">{formatTokenAmount(lifecycle.breakdown.vested, decimals)}</span>
              <span className="font-mono text-xs text-emerald-600">{formatTokenAmount(lifecycle.breakdown.claimable, decimals)}</span>
              <span className="text-zinc-500 text-xs">{lifecycle.nextEventLabel}</span>
              <StreamStatusBadge status={lifecycle.status} readyToClose={lifecycle.readyToClose} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
