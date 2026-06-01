"use client";

import { QrCode } from "./QrCode";
import { CopyButton } from "./CopyButton";

type Props = {
  title: string;
  subtitle?: string;
  url: string;
  amountLabel?: string;
  brand?: string;
  className?: string;
};

/**
 * Vertical sharable card for a pot. Renders inline; an end-to-end "save as
 * image" path can hook html-to-image later, the layout is already CSS-clean.
 */
export function ShareCard({
  title,
  subtitle,
  url,
  amountLabel,
  brand = "Pot · Celo + Stacks",
  className = "",
}: Props) {
  return (
    <div
      className={`flex w-full max-w-sm flex-col gap-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.15em] text-mono text-[var(--text-tertiary)]">
          {brand}
        </span>
        {amountLabel && (
          <span className="rounded-full bg-[var(--bg-subtle)] px-2.5 py-1 text-[11px] uppercase tracking-wide text-mono text-[var(--text-secondary)]">
            {amountLabel}
          </span>
        )}
      </div>

      <div>
        <h3 className="text-xl font-semibold text-[var(--text-primary)]">{title}</h3>
        {subtitle && (
          <p className="mt-2 text-sm text-[var(--text-secondary)] line-clamp-3">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-white p-4">
        <QrCode value={url} size={208} alt={`QR for ${title}`} />
      </div>

      <div className="flex items-center justify-between gap-2">
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="truncate text-mono text-xs text-[var(--text-tertiary)] hover:underline"
        >
          {url}
        </a>
        <CopyButton value={url} />
      </div>
    </div>
  );
}
