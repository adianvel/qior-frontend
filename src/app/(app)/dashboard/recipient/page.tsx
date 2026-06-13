"use client";

import Link from "next/link";
import { ArrowRight, CircleAlert, CircleCheck, LoaderCircle, Wallet } from "lucide-react";
import { AmountBreakdownBar } from "@/components/dashboard/AmountBreakdownBar";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { StreamStatusBadge } from "@/components/dashboard/StreamStatusBadge";
import { useStreams } from "@/hooks/useStreams";
import { useMintDecimals } from "@/hooks/useMintDecimals";
import { useWithdraw } from "@/hooks/useWithdraw";
import { formatTokenAmount, formatTokenAmountCompact, shortenAddress } from "@/lib/utils/format";
import { deriveStreamLifecycle, getModeLabel } from "@/lib/utils/streamLifecycle";

export default function RecipientDashboardPage() {
  const { data: streams, isLoading, error, refetch } = useStreams("recipient");
  const { data: mintDecimals = {} } = useMintDecimals(streams?.map((stream) => stream.mint) ?? []);
  const { withdraw, status: withdrawStatus, error: withdrawError, activeStreamId, isProcessingStream } = useWithdraw();
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

      const aTime = a.lifecycle.nextUnlockAt ?? Number.POSITIVE_INFINITY;
      const bTime = b.lifecycle.nextUnlockAt ?? Number.POSITIVE_INFINITY;
      if (aTime !== bTime) return aTime - bTime;

      return Number(a.lifecycle.status === "awaiting_milestone") - Number(b.lifecycle.status === "awaiting_milestone");
    });

  const claimableCount = streamRows.filter((row) => row.lifecycle.breakdown.claimable > 0).length;
  const waitingMilestoneCount = streamRows.filter((row) => row.lifecycle.status === "awaiting_milestone").length;
  const claimableRows = streamRows.filter((row) => row.lifecycle.breakdown.claimable > 0);
  const claimableMintBreakdown = Array.from(
    claimableRows.reduce((map, row) => {
      const mintAddress = row.stream.mint.toBase58();
      const current = map.get(mintAddress) ?? {
        mintAddress,
        decimals: mintDecimals[mintAddress] ?? 6,
        total: 0,
      };
      current.total += row.lifecycle.breakdown.claimable;
      map.set(mintAddress, current);
      return map;
    }, new Map<string, { mintAddress: string; decimals: number; total: number }>())
      .values()
  );
  const claimableMintSummary = claimableMintBreakdown.length === 0
    ? "No claimable balances yet"
    : claimableMintBreakdown
      .slice(0, 2)
      .map((entry) => `${formatTokenAmountCompact(entry.total, entry.decimals)} ${shortenAddress(entry.mintAddress, 4)}`)
      .join(" / ");

  const getRecipientStateMessage = (nextEventLabel: string, status: string) => {
    if (status === "awaiting_milestone") return "Waiting for the creator to mark the milestone as completed.";
    if (status === "cliff_locked") return `${nextEventLabel}. Nothing can be withdrawn before the cliff.`;
    if (status === "scheduled") return `${nextEventLabel}. Vesting has not started yet.`;
    if (status === "vesting") return `${nextEventLabel}. This stream is unlocking gradually over time.`;
    if (status === "completed") return "This stream is fully claimed or no further recipient action is needed.";

    return nextEventLabel;
  };

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_18px_60px_rgba(24,24,27,0.045)] md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-zinc-950">Incoming Streams</h1>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">Sorted by claimable balance first, then the next unlock.</p>
        </div>
        <p className="w-fit rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-500">
          {streams.length} allocation{streams.length === 1 ? "" : "s"}
        </p>
      </div>
      {withdrawError && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {withdrawError}
        </div>
      )}

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Incoming Streams" value={streams.length} hint="All allocations to your wallet" />
        <MetricCard label="Claimable Now" value={claimableCount} hint="Streams ready to withdraw" />
        <MetricCard label="Waiting Milestone" value={waitingMilestoneCount} hint="Needs creator confirmation" />
        <MetricCard label="Claimable Mints" value={claimableMintBreakdown.length} hint={claimableMintSummary} />
      </div>

      <div className="flex flex-col gap-4">
        {streamRows.map(({ stream, lifecycle }) => {
          const decimals = mintDecimals[stream.mint.toBase58()] ?? 6;
          const claimable = lifecycle.breakdown.claimable;
          const isBusy = isProcessingStream(stream.publicKey);
          const isLastSuccessful = withdrawStatus === "success" && activeStreamId === stream.publicKey.toBase58();
          const isPendingState = withdrawStatus === "preparing" || withdrawStatus === "awaiting_signature" || withdrawStatus === "confirming";

          return (
            <div key={stream.publicKey.toBase58()} className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_18px_60px_rgba(24,24,27,0.045)]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">From</p>
                  <p className="mt-1 font-mono text-sm font-semibold text-zinc-950">{shortenAddress(stream.creator, 6)}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs font-medium text-zinc-400">{getModeLabel(lifecycle.mode)}</span>
                    <span className="text-xs text-zinc-400">{lifecycle.nextEventLabel}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                  <StreamStatusBadge status={lifecycle.status} readyToClose={lifecycle.readyToClose} />
                  <Link
                    href={`/streams/${stream.publicKey.toBase58()}`}
                    className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-950"
                  >
                    Detail <ArrowRight size={12} strokeWidth={2.5} />
                  </Link>
                </div>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-zinc-500">
                {getRecipientStateMessage(lifecycle.nextEventLabel, lifecycle.status)}
              </p>

              <div className="mt-4">
                <AmountBreakdownBar breakdown={lifecycle.breakdown} compact />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 border-t border-zinc-200 pt-4 sm:grid-cols-3 sm:divide-x sm:divide-zinc-200 sm:gap-0">
                <div>
                  <p className="text-[11px] font-medium text-zinc-400">Total</p>
                  <p className="font-mono text-sm font-semibold text-zinc-950">{formatTokenAmount(stream.totalAmount, decimals)}</p>
                </div>
                <div className="sm:px-4">
                  <p className="text-[11px] font-medium text-zinc-400">Vested</p>
                  <p className="font-mono text-sm font-semibold text-zinc-950">{formatTokenAmount(lifecycle.breakdown.vested, decimals)}</p>
                </div>
                <div className="sm:pl-4">
                  <p className="text-[11px] font-medium text-zinc-400">Claimable</p>
                  <p className="font-mono text-sm font-semibold text-violet-600">{formatTokenAmountCompact(claimable, decimals)}</p>
                </div>
              </div>

              <div className="mt-5 border-t border-zinc-300 pt-5">
                <div className="flex justify-center">
                  <div className="inline-flex rounded-full bg-zinc-100 p-1 shadow-[inset_0_0_0_1px_rgba(24,24,27,0.05)]">
                    <button
                      onClick={() => withdraw(stream.publicKey, {
                        mint: stream.mint,
                        escrowTokenAccount: stream.escrowTokenAccount,
                        escrowBump: stream.escrowBump,
                      })}
                      disabled={claimable <= 0 || isPendingState}
                      className="flex min-w-44 cursor-pointer items-center justify-center gap-2 rounded-full bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-violet-300 disabled:text-white/80 active:scale-[0.97]"
                    >
                      {isLastSuccessful ? (
                        <><CircleCheck size={16} /> Withdrawn</>
                      ) : isBusy ? (
                        <><LoaderCircle size={16} className="animate-spin" /> {
                          withdrawStatus === "preparing" ? "Preparing..." :
                          withdrawStatus === "awaiting_signature" ? "Approve..." :
                          "Confirming..."
                        }</>
                      ) : (
                        <>Withdraw {formatTokenAmountCompact(claimable, decimals)}</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
