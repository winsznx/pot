type Props = {
  chainId: number;
  className?: string;
};

const LABELS: Record<number, { name: string; tone: string }> = {
  42220: { name: "Celo mainnet", tone: "bg-emerald-500" },
  44787: { name: "Alfajores", tone: "bg-amber-400" },
};

export function ChainBadge({ chainId, className = "" }: Props) {
  const info = LABELS[chainId] ?? { name: `Chain ${chainId}`, tone: "bg-slate-400" };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-2.5 py-1 text-[11px] uppercase tracking-wide text-[var(--text-secondary)] text-mono ${className}`}
    >
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${info.tone}`} />
      {info.name}
    </span>
  );
}
