"use client";

import { CircleAlert, CircleCheck, LoaderCircle, Wallet } from "lucide-react";
import { AmountBreakdownBar } from "@/components/dashboard/AmountBreakdownBar";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { StreamStatusBadge } from "@/components/dashboard/StreamStatusBadge";
import { useStreams } from "@/hooks/useStreams";
import { useMintDecimals } from "@/hooks/useMintDecimals";
import { useWithdraw } from "@/hooks/useWithdraw";
import { formatTokenAmount, shortenAddress } from "@/lib/utils/format";
import { deriveStreamLifecycle, getModeLabel } from "@/lib/utils/streamLifecycle";

export default function RecipientDashboardPage() {
  const { data: streams, isLoading, error, refetch } = useStreams("recipient");
  const { data: mintDecimals = {} } = useMintDecimals(streams?.map((stream) => stream.mint) ?? []);
  const { withdraw, status: withdrawStatus, error: withdrawError } = useWithdraw();
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
        <h2 className="text-lg font-semibold text-zinc-900">Couldn&apos;t load incoming streams</h2>
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
        <Wallet size={48} strokeWidth={1.5} className="text-zinc-300" />
        <h2 className="text-lg font-semibold text-zinc-900">No incoming streams</h2>
        <p className="text-sm text-zinc-500 text-center max-w-sm">
          No tokens are being vested to your wallet yet.
        </p>
      </div>
    );
  }

  const streamRows = streams
    .map((stream) => ({
      stream,
      lifecycle: deriveStreamLifecycle(stream),
    }))
    .sort((a, b) => {
      if (a.lifecycle.breakdown.claimable !== b.lifecycle.breakdown.claimable) {
        return b.lifecycle.breakdown.claimable - a.lifecycle.breakdown.claimable;
      }

      return Number(b.lifecycle.status === "awaiting_milestone") - Number(a.lifecycle.status === "awaiting_milestone");
    });

  const totalClaimable = streamRows.reduce((sum, row) => sum + row.lifecycle.breakdown.claimable, 0);
  const claimableCount = streamRows.filter((row) => row.lifecycle.breakdown.claimable > 0).length;
  const waitingMilestoneCount = streamRows.filter((row) => row.lifecycle.status === "awaiting_milestone").length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Incoming Streams</h1>
      <p className="text-sm text-zinc-500 mt-0.5 mb-8">Tokens being vested to your wallet.</p>
      {withdrawError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {withdrawError}
        </div>
      )}

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Incoming Streams" value={streams.length} hint="All allocations to your wallet" />
        <MetricCard label="Claimable Now" value={claimableCount} hint="Streams ready to withdraw" />
        <MetricCard label="Waiting Milestone" value={waitingMilestoneCount} hint="Needs creator confirmation" />
        <MetricCard label="Claimable Amount" value={formatTokenAmount(totalClaimable, 6)} hint="Mixed-mint approximation" />
      </div>

      <div className="flex flex-col gap-4">
        {streamRows.map(({ stream, lifecycle }) => {
          const decimals = mintDecimals[stream.mint.toBase58()] ?? 6;
          const claimable = lifecycle.breakdown.claimable;

          return (
            <div key={stream.publicKey.toBase58()} className="border border-zinc-200 rounded-xl bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-zinc-400">From</p>
                  <p className="text-sm font-mono text-zinc-900">{shortenAddress(stream.creator, 6)}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-zinc-400">{getModeLabel(lifecycle.mode)}</span>
                    <span className="text-xs text-zinc-400">{lifecycle.nextEventLabel}</span>
                  </div>
                </div>
                <StreamStatusBadge status={lifecycle.status} readyToClose={lifecycle.readyToClose} />
              </div>

              <div className="mt-4">
                <AmountBreakdownBar breakdown={lifecycle.breakdown} compact />
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-zinc-100">
                <div>
                  <p className="text-[11px] text-zinc-400">Total</p>
                  <p className="text-sm font-mono font-semibold text-zinc-900">{formatTokenAmount(stream.totalAmount, decimals)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-zinc-400">Vested</p>
                  <p className="text-sm font-mono font-semibold text-zinc-900">{formatTokenAmount(lifecycle.breakdown.vested, decimals)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-zinc-400">Claimable</p>
                  <p className="text-sm font-mono font-semibold text-emerald-600">{formatTokenAmount(claimable, decimals)}</p>
                </div>
              </div>

              <button
                onClick={() => withdraw(stream.publicKey, {
                  mint: stream.mint,
                  escrowTokenAccount: stream.escrowTokenAccount,
                  escrowBump: stream.escrowBump,
                })}
                disabled={claimable <= 0 || withdrawStatus !== "idle"}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg active:scale-[0.97] transition-all"
              >
                {withdrawStatus === "success" ? (
                  <><CircleCheck size={16} /> Withdrawn</>
                ) : withdrawStatus === "preparing" || withdrawStatus === "awaiting_signature" || withdrawStatus === "confirming" ? (
                  <><LoaderCircle size={16} className="animate-spin" /> {
                    withdrawStatus === "preparing" ? "Preparing..." :
                    withdrawStatus === "awaiting_signature" ? "Approve..." :
                    "Confirming..."
                  }</>
                ) : (
                  <>Withdraw {formatTokenAmount(claimable, decimals)}</>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
