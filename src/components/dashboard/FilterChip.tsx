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
      className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition-all ${
        active
          ? "border-violet-600 bg-violet-600 text-white"
          : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:text-zinc-950"
      }`}
    >
      {label}
    </button>
  );
}
