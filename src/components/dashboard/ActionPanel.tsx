import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

type ActionItem = {
  href: string;
  title: string;
  subtitle: string;
  meta?: string;
};

type ActionPanelProps = {
  title: string;
  description: string;
  emptyMessage: string;
  items: ActionItem[];
};

export function ActionPanel({ title, description, emptyMessage, items }: ActionPanelProps) {
  return (
    <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_18px_60px_rgba(24,24,27,0.045)]">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-zinc-950">{title}</h2>
          <p className="mt-1 max-w-md text-sm leading-relaxed text-zinc-500">{description}</p>
        </div>
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-500">{items.length}</span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-5 text-sm text-zinc-500">
          {emptyMessage}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {items.map((item) => (
            <Link
              key={`${item.href}-${item.title}`}
              href={item.href}
              className="group flex items-start justify-between gap-4 rounded-2xl border border-zinc-100 bg-zinc-50/80 px-4 py-3.5 transition-all hover:border-zinc-300 hover:bg-white"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-950">{item.title}</p>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500">{item.subtitle}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {item.meta ? <span className="hidden rounded-full bg-white px-2 py-1 text-[11px] font-medium text-zinc-500 shadow-sm sm:inline-flex">{item.meta}</span> : null}
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-zinc-400 shadow-sm transition-colors group-hover:bg-zinc-950 group-hover:text-white">
                  <ArrowUpRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
