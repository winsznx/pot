type Props = {
  label?: string;
  className?: string;
};

export function Divider({ label, className = "" }: Props) {
  if (!label) {
    return <hr className={`border-t border-[var(--border-subtle)] ${className}`} />;
  }
  return (
    <div
      className={`flex items-center gap-3 text-[11px] uppercase tracking-[0.15em] text-[var(--text-tertiary)] text-mono ${className}`}
    >
      <span className="flex-1 border-t border-[var(--border-subtle)]" />
      <span>{label}</span>
      <span className="flex-1 border-t border-[var(--border-subtle)]" />
    </div>
  );
}
