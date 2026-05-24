import type { ReactNode } from "react";

type Props = {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  className?: string;
};

export function StatTile({ label, value, hint, className = "" }: Props) {
  return (
    <div
      className={`rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-5 py-6 ${className}`}
    >
      <div className="text-mono text-[11px] uppercase tracking-[0.15em] text-[var(--text-tertiary)]">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold leading-none tabular-nums text-[var(--text-primary)] md:text-3xl">
        {value}
      </div>
      {hint && (
        <div className="mt-2 text-mono text-xs text-[var(--text-tertiary)]">{hint}</div>
      )}
    </div>
  );
}
