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
    <section className="rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
        <p className="mt-1 text-sm text-zinc-500">{description}</p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-5 text-sm text-zinc-500">
          {emptyMessage}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <Link
              key={`${item.href}-${item.title}`}
              href={item.href}
              className="flex items-start justify-between gap-4 rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 transition-colors hover:border-zinc-200 hover:bg-white"
            >
              <div>
                <p className="text-sm font-medium text-zinc-900">{item.title}</p>
                <p className="mt-1 text-xs text-zinc-500">{item.subtitle}</p>
              </div>
              <div className="flex items-center gap-2">
                {item.meta ? <span className="text-xs text-zinc-400">{item.meta}</span> : null}
                <ArrowUpRight size={14} className="text-zinc-400" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
