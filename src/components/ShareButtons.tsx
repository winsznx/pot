"use client";

import { useState } from "react";
import { useAccount } from "wagmi";

export function ShareButtons({ potId, title }: { potId: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const { address } = useAccount();

  // Append the connected wallet as a referrer so the destination page can credit
  // the sharer for any contributions that arrive via this link.
  const ref = address ? `?ref=${address.toLowerCase()}` : "";
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/p/${potId}${ref}`
      : `https://pot.timjosh507.workers.dev/p/${potId}${ref}`;

  const text = `Help me with: ${title}`;
  const waHref = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
  const xHref = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  const fcHref = `https://warpcast.com/~/compose?text=${encodeURIComponent(`${text} ${url}`)}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <a
          href={waHref}
          target="_blank"
          rel="noreferrer"
          className="btn-ghost-primary border border-dark-carbon"
        >
          WHATSAPP
        </a>
        <a
          href={xHref}
          target="_blank"
          rel="noreferrer"
          className="btn-ghost-primary border border-dark-carbon"
        >
          X / TWITTER
        </a>
        <a
          href={fcHref}
          target="_blank"
          rel="noreferrer"
          className="btn-ghost-primary border border-dark-carbon"
        >
          FARCASTER
        </a>
        <button
          type="button"
          onClick={copyLink}
          className="btn-ghost-primary border border-dark-carbon"
        >
          {copied ? "COPIED ✓" : "COPY LINK"}
        </button>
      </div>
      {address && (
        <p className="text-[13px] text-ash-gray text-mono">
          Sharing as <span className="text-polar-white">{address.slice(0, 6)}…{address.slice(-4)}</span> — you&apos;re credited as the referrer.
        </p>
      )}
    </div>
  );
}
