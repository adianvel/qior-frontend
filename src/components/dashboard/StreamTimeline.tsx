import type { StreamAccount } from "@/lib/anchor/types";
import { formatDate } from "@/lib/utils/format";
import { getModeLabel, type StreamMode } from "@/lib/utils/streamLifecycle";

type StreamTimelineProps = {
  stream: Pick<StreamAccount, "startTime" | "cliffTime" | "endTime" | "milestoneReached">;
  mode: StreamMode;
};

export function StreamTimeline({ stream, mode }: StreamTimelineProps) {
  if (mode === "milestone-based") {
    return (
      <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_18px_60px_rgba(24,24,27,0.045)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-950">Lifecycle Timeline</h2>
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-500">{getModeLabel(mode)}</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Created", value: "Escrow funded" },
            { label: "Milestone", value: stream.milestoneReached ? "Reached" : "Waiting" },
            { label: "Withdraw", value: "Recipient claims" },
          ].map((item, index) => (
            <div key={item.label} className="relative rounded-2xl border border-zinc-100 bg-zinc-50 p-3.5">
              {index < 2 ? <div className="absolute left-full top-1/2 hidden h-px w-3 -translate-y-1/2 bg-zinc-200 md:block" /> : null}
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">{item.label}</p>
              <p className="mt-1.5 text-sm font-semibold text-zinc-900">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_18px_60px_rgba(24,24,27,0.045)]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-950">Lifecycle Timeline</h2>
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-500">{getModeLabel(mode)}</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Start", value: formatDate(stream.startTime) },
          { label: "Cliff", value: formatDate(stream.cliffTime) },
          { label: "End", value: formatDate(stream.endTime) },
        ].map((item, index) => (
          <div key={item.label} className="relative rounded-2xl border border-zinc-100 bg-zinc-50 p-3.5">
            {index < 2 ? <div className="absolute left-full top-1/2 hidden h-px w-3 -translate-y-1/2 bg-zinc-200 md:block" /> : null}
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">{item.label}</p>
            <p className="mt-1.5 text-sm font-semibold text-zinc-900">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
