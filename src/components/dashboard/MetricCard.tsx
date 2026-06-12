type MetricCardProps = {
  label: string;
  value: string | number;
  hint?: string;
};

export function MetricCard({ label, value, hint }: MetricCardProps) {
  return (
    <div className="relative overflow-hidden rounded-[24px] border border-zinc-200 bg-white p-4 shadow-[0_18px_50px_rgba(24,24,27,0.04)] transition-all hover:border-zinc-300">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">{label}</p>
      <p className="mt-2 font-mono text-[28px] font-semibold leading-none tracking-tight text-zinc-950">{value}</p>
      {hint ? <p className="mt-2 line-clamp-2 min-h-[32px] text-xs leading-relaxed text-zinc-500">{hint}</p> : null}
    </div>
  );
}
