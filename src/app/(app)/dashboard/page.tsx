"use client";

import Link from "next/link";
import { CircleAlert, LoaderCircle } from "lucide-react";
import { ActionPanel } from "@/components/dashboard/ActionPanel";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { StreamStatusBadge } from "@/components/dashboard/StreamStatusBadge";
import { useStreams } from "@/hooks/useStreams";
import { shortenAddress } from "@/lib/utils/format";
import { deriveStreamLifecycle, getStreamUrgencyScore } from "@/lib/utils/streamLifecycle";

export default function DashboardOverviewPage() {
  const creatorQuery = useStreams("creator");
  const recipientQuery = useStreams("recipient");

  const isLoading = creatorQuery.isLoading || recipientQuery.isLoading;
  const error = creatorQuery.error || recipientQuery.error;
  const errorMessage = error instanceof Error ? error.message : "Unknown error";

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoaderCircle size={32} className="animate-spin text-violet-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <CircleAlert size={48} strokeWidth={1.75} className="text-red-400" />
        <h1 className="text-xl font-semibold text-zinc-900">Couldn&apos;t load dashboard overview</h1>
        <p className="max-w-sm text-sm text-zinc-500">{errorMessage}</p>
      </div>
    );
  }

  const creatorRows = (creatorQuery.data ?? []).map((stream) => ({
    stream,
    lifecycle: deriveStreamLifecycle(stream),
  }));
  const recipientRows = (recipientQuery.data ?? []).map((stream) => ({
    stream,
    lifecycle: deriveStreamLifecycle(stream),
  }));

  const creatorActionRows = creatorRows
    .filter((row) => getStreamUrgencyScore(row.lifecycle) >= 3)
    .sort((a, b) => getStreamUrgencyScore(b.lifecycle) - getStreamUrgencyScore(a.lifecycle))
    .slice(0, 4);

  const recipientActionRows = recipientRows
    .filter((row) => row.lifecycle.breakdown.claimable > 0)
    .sort((a, b) => b.lifecycle.breakdown.claimable - a.lifecycle.breakdown.claimable)
    .slice(0, 4);

  const upcomingUnlockRows = recipientRows
    .filter((row) => row.lifecycle.breakdown.claimable <= 0 && row.lifecycle.status !== "awaiting_milestone")
    .sort((a, b) => {
      const aTime = a.lifecycle.nextUnlockAt ?? Number.POSITIVE_INFINITY;
      const bTime = b.lifecycle.nextUnlockAt ?? Number.POSITIVE_INFINITY;
      return aTime - bTime;
    })
    .slice(0, 4);

  const milestoneRows = [...creatorRows, ...recipientRows]
    .filter((row) => row.lifecycle.status === "awaiting_milestone")
    .slice(0, 4);

  const readyToCloseRows = creatorRows
    .filter((row) => row.lifecycle.readyToClose)
    .sort((a, b) => b.stream.createdAt - a.stream.createdAt)
    .slice(0, 4);

  const readyToCloseCount = creatorRows.filter((row) => row.lifecycle.readyToClose).length;
  const creatorClaimBacklog = creatorRows.filter((row) => row.lifecycle.breakdown.claimable > 0).length;
  const recipientClaimableCount = recipientRows.filter((row) => row.lifecycle.breakdown.claimable > 0).length;
  const milestoneWaitCount = [...creatorRows, ...recipientRows].filter((row) => row.lifecycle.status === "awaiting_milestone").length;

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Dashboard Overview</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Action-first summary across your creator and recipient vesting activity.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/creator"
            className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            Open creator workspace
          </Link>
          <Link
            href="/dashboard/recipient"
            className="rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-500"
          >
            View incoming streams
          </Link>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 xl:grid-cols-6">
        <MetricCard label="Created Streams" value={creatorRows.length} hint="Creator-side ownership" />
        <MetricCard label="Incoming Streams" value={recipientRows.length} hint="Allocations to your wallet" />
        <MetricCard label="Recipient Claim Backlog" value={creatorClaimBacklog} hint="Recipients can withdraw now" />
        <MetricCard label="Claimable To Me" value={recipientClaimableCount} hint="Withdraw-ready streams" />
        <MetricCard label="Awaiting Milestone" value={milestoneWaitCount} hint="Needs milestone completion" />
        <MetricCard label="Ready To Close" value={readyToCloseCount} hint="Settled creator streams" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ActionPanel
          title="Needs Action"
          description="High-priority creator and recipient items that need attention first."
          emptyMessage="No urgent stream actions right now."
          items={[
            ...creatorActionRows.map(({ stream, lifecycle }) => ({
              href: `/streams/${stream.publicKey.toBase58()}`,
              title: `Creator stream for ${shortenAddress(stream.recipient, 6)}`,
              subtitle: lifecycle.nextEventLabel,
              meta: lifecycle.readyToClose ? "Ready to close" : "Creator action",
            })),
            ...recipientActionRows.map(({ stream, lifecycle }) => ({
              href: `/streams/${stream.publicKey.toBase58()}`,
              title: `Claim from ${shortenAddress(stream.creator, 6)}`,
              subtitle: lifecycle.nextEventLabel,
              meta: "Withdraw now",
            })),
          ].slice(0, 6)}
        />

        <ActionPanel
          title="Upcoming Unlocks"
          description="Recipient streams that are not claimable yet but have a clear next event."
          emptyMessage="No upcoming unlocks to watch right now."
          items={upcomingUnlockRows.map(({ stream, lifecycle }) => ({
            href: `/streams/${stream.publicKey.toBase58()}`,
            title: `Incoming stream from ${shortenAddress(stream.creator, 6)}`,
            subtitle: lifecycle.nextEventLabel,
            meta: "Track unlock",
          }))}
        />

        <ActionPanel
          title="Waiting On Milestones"
          description="Milestone-gated streams that are blocked until a creator marks them complete."
          emptyMessage="No milestone-gated streams are waiting right now."
          items={milestoneRows.map(({ stream, lifecycle }) => ({
            href: `/streams/${stream.publicKey.toBase58()}`,
            title: `Milestone stream ${shortenAddress(stream.publicKey, 6)}`,
            subtitle: lifecycle.nextEventLabel,
            meta: stream.recipient ? "Milestone gate" : undefined,
          }))}
        />

        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-zinc-900">Ready To Close</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Creator-owned streams whose lifecycle is already settled.
              </p>
            </div>
            <Link href="/dashboard/creator" className="text-sm font-medium text-violet-600 hover:text-violet-500">
              View all
            </Link>
          </div>

          {readyToCloseRows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-5 text-sm text-zinc-500">
              No creator streams are ready to close yet.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {readyToCloseRows.map(({ stream, lifecycle }) => (
                <Link
                  key={stream.publicKey.toBase58()}
                  href={`/streams/${stream.publicKey.toBase58()}`}
                  className="flex items-start justify-between gap-3 rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 transition-colors hover:border-zinc-200 hover:bg-white"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{shortenAddress(stream.recipient, 6)}</p>
                    <p className="mt-1 text-xs text-zinc-500">{lifecycle.nextEventLabel}</p>
                  </div>
                  <StreamStatusBadge status={lifecycle.status} readyToClose={lifecycle.readyToClose} />
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
