import type { StreamAmountBreakdown } from "@/lib/utils/streamLifecycle";

type AmountBreakdownBarProps = {
  breakdown: StreamAmountBreakdown;
  compact?: boolean;
};

export function AmountBreakdownBar({ breakdown, compact = false }: AmountBreakdownBarProps) {
  const total = breakdown.total || 1;
  const claimedWidth = (breakdown.claimed / total) * 100;
  const claimableWidth = (breakdown.claimable / total) * 100;
  const lockedWidth = (breakdown.locked / total) * 100;

  return (
    <div>
      <div className={`flex overflow-hidden rounded-full bg-zinc-100 ring-1 ring-inset ring-zinc-200 ${compact ? "h-2.5" : "h-3.5"}`}>
        <div className="bg-zinc-950" style={{ width: `${claimedWidth}%` }} />
        <div className="bg-violet-500" style={{ width: `${claimableWidth}%` }} />
        <div className="bg-zinc-200" style={{ width: `${lockedWidth}%` }} />
      </div>
      <div className={`mt-2 grid gap-2 text-[11px] font-medium text-zinc-500 ${compact ? "grid-cols-3" : "grid-cols-4"}`}>
        <span>Vested {breakdown.vestingProgressPct}%</span>
        <span>Claimed {breakdown.claimProgressPct}%</span>
        <span>Claimable now</span>
        {!compact ? <span>Locked</span> : null}
      </div>
    </div>
  );
}
