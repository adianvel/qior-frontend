"use client";

import Link from "next/link";
import { PlusCircle, Stack, SpinnerGap, WarningCircle } from "@phosphor-icons/react";
import { useStreams } from "@/hooks/useStreams";
import { useMintDecimals } from "@/hooks/useMintDecimals";
import { getStreamStatus, formatTokenAmount, shortenAddress, formatTimeRemaining } from "@/lib/utils/format";

export default function CreatorDashboardPage() {
  const { data: streams, isLoading, error, refetch } = useStreams("creator");
  const { data: mintDecimals = {} } = useMintDecimals(streams?.map((stream) => stream.mint) ?? []);
  const errorMessage = error instanceof Error ? error.message : "Unknown error";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <SpinnerGap size={32} className="animate-spin text-violet-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
        <WarningCircle size={48} weight="duotone" className="text-red-400" />
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
        <Stack size={48} weight="duotone" className="text-zinc-300" />
        <h2 className="text-lg font-semibold text-zinc-900">No streams yet</h2>
        <p className="text-sm text-zinc-500 text-center max-w-sm">
          You haven&apos;t created any vesting streams yet.
        </p>
        <Link
          href="/create"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg active:scale-[0.97] transition-all mt-2"
        >
          <PlusCircle size={16} weight="bold" /> Create your first stream
        </Link>
      </div>
    );
  }

  const active = streams.filter((s) => getStreamStatus(s) === "active").length;
  const completed = streams.filter((s) => getStreamStatus(s) === "completed").length;
  const cancelled = streams.filter((s) => getStreamStatus(s) === "cancelled").length;

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
          <PlusCircle size={14} weight="bold" /> New Stream
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="border border-zinc-200 rounded-xl bg-white p-4">
          <p className="text-[11px] text-zinc-400 uppercase tracking-wide">Total</p>
          <p className="text-2xl font-bold text-zinc-900 font-mono mt-1">{streams.length}</p>
        </div>
        <div className="border border-zinc-200 rounded-xl bg-white p-4">
          <p className="text-[11px] text-zinc-400 uppercase tracking-wide">Active</p>
          <p className="text-2xl font-bold text-zinc-900 font-mono mt-1">{active}</p>
        </div>
        <div className="border border-zinc-200 rounded-xl bg-white p-4">
          <p className="text-[11px] text-zinc-400 uppercase tracking-wide">Completed</p>
          <p className="text-2xl font-bold text-zinc-900 font-mono mt-1">{completed}</p>
        </div>
        <div className="border border-zinc-200 rounded-xl bg-white p-4">
          <p className="text-[11px] text-zinc-400 uppercase tracking-wide">Cancelled</p>
          <p className="text-2xl font-bold text-zinc-900 font-mono mt-1">{cancelled}</p>
        </div>
      </div>

      {/* Table */}
      <div className="border border-zinc-200 rounded-xl bg-white overflow-hidden">
        <div className="grid grid-cols-[1.4fr_0.9fr_0.9fr_0.8fr_0.9fr_0.6fr] gap-3 px-5 py-3 border-b border-zinc-100 text-[11px] text-zinc-400 uppercase tracking-wide">
          <span>Recipient</span>
          <span>Total</span>
          <span>Withdrawn</span>
          <span>Progress</span>
          <span>Time Left</span>
          <span>Status</span>
        </div>
        {streams.map((stream) => {
          const status = getStreamStatus(stream);
          const decimals = mintDecimals[stream.mint.toBase58()] ?? 6;
          const pct = stream.totalAmount > 0 ? Math.round((stream.withdrawnAmount / stream.totalAmount) * 100) : 0;
          return (
            <Link
              key={stream.publicKey.toBase58()}
              href={`/streams/${stream.publicKey.toBase58()}`}
              className="grid grid-cols-[1.4fr_0.9fr_0.9fr_0.8fr_0.9fr_0.6fr] gap-3 items-center px-5 py-3.5 border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors text-sm"
            >
              <span className="text-zinc-900 font-mono text-xs">{shortenAddress(stream.recipient, 6)}</span>
              <span className="text-zinc-600 font-mono text-xs">{formatTokenAmount(stream.totalAmount, decimals)}</span>
              <span className="text-zinc-600 font-mono text-xs">{formatTokenAmount(stream.withdrawnAmount, decimals)}</span>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-500 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[11px] text-zinc-500 font-mono">{pct}%</span>
              </div>
              <span className="text-zinc-500 font-mono text-xs">{formatTimeRemaining(stream.endTime)}</span>
              <span
                className={`text-xs font-medium ${
                  status === "active" ? "text-emerald-500" : status === "completed" ? "text-violet-500" : "text-zinc-400"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
