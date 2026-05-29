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
      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">Lifecycle Timeline</h2>
          <span className="text-xs text-zinc-500">{getModeLabel(mode)}</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Created", value: "Escrow funded" },
            { label: "Milestone", value: stream.milestoneReached ? "Reached" : "Waiting" },
            { label: "Withdraw", value: "Recipient claims" },
          ].map((item, index) => (
            <div key={item.label} className="relative rounded-xl border border-zinc-100 bg-zinc-50 p-3">
              {index < 2 ? <div className="absolute left-full top-1/2 hidden h-px w-3 -translate-y-1/2 bg-zinc-200 md:block" /> : null}
              <p className="text-[11px] uppercase tracking-wide text-zinc-400">{item.label}</p>
              <p className="mt-1 text-sm font-medium text-zinc-800">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900">Lifecycle Timeline</h2>
        <span className="text-xs text-zinc-500">{getModeLabel(mode)}</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Start", value: formatDate(stream.startTime) },
          { label: "Cliff", value: formatDate(stream.cliffTime) },
          { label: "End", value: formatDate(stream.endTime) },
        ].map((item, index) => (
          <div key={item.label} className="relative rounded-xl border border-zinc-100 bg-zinc-50 p-3">
            {index < 2 ? <div className="absolute left-full top-1/2 hidden h-px w-3 -translate-y-1/2 bg-zinc-200 md:block" /> : null}
            <p className="text-[11px] uppercase tracking-wide text-zinc-400">{item.label}</p>
            <p className="mt-1 text-sm font-medium text-zinc-800">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
