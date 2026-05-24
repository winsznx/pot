"use client";

import { addressUrl } from "@/lib/celoscan";
import { shortAddr } from "@/lib/format";
import { useClipboard } from "@/lib/useClipboard";

type Props = {
  address: string;
  chainId?: number;
  linkToScan?: boolean;
  short?: boolean;
};

export function AddressChip({ address, chainId, linkToScan = true, short = true }: Props) {
  const { copied, copy } = useClipboard();
  const label = short ? shortAddr(address) : address;

  if (!linkToScan) {
    return (
      <button
        type="button"
        onClick={() => copy(address)}
        className="text-mono inline-flex items-center gap-1 text-sm"
        title={copied ? "Copied" : "Copy address"}
      >
        <span>{label}</span>
        <span aria-hidden className="text-xs text-[var(--text-tertiary)]">
          {copied ? "✓" : "⧉"}
        </span>
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <a
        href={addressUrl(address, chainId)}
        target="_blank"
        rel="noreferrer"
        className="text-mono text-sm hover:underline"
      >
        {label}
      </a>
      <button
        type="button"
        onClick={() => copy(address)}
        aria-label={copied ? "Copied" : "Copy address"}
        className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
      >
        {copied ? "✓" : "⧉"}
      </button>
    </span>
  );
}
