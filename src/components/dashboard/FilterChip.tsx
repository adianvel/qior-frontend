type FilterChipProps = {
  active: boolean;
  label: string;
  onClick: () => void;
};

export function FilterChip({ active, label, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border-violet-200 bg-violet-50 text-violet-700"
          : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900"
      }`}
    >
      {label}
    </button>
  );
}
