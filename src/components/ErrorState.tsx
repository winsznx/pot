"use client";

import type { ReactNode } from "react";

type Props = {
  title?: string;
  description?: ReactNode;
  hint?: ReactNode;
  onRetry?: () => void;
  className?: string;
};

export function ErrorState({
  title = "Something went sideways",
  description,
  hint,
  onRetry,
  className = "",
}: Props) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center gap-3 rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-6 py-12 text-center ${className}`}
    >
      <span aria-hidden className="text-2xl">⚠︎</span>
      <h3 className="text-mono text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
      {description && (
        <p className="max-w-md text-mono text-sm text-[var(--text-secondary)]">{description}</p>
      )}
      {hint && <p className="text-mono text-xs text-[var(--text-tertiary)]">{hint}</p>}
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-ghost mt-1">
          Try again
        </button>
      )}
    </div>
  );
}
