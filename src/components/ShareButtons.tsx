"use client";

import { useState } from "react";

export function ShareButtons({ potId, title }: { potId: string; title: string }) {
  const [copied, setCopied] = useState(false);

  const url = typeof window !== "undefined"
    ? `${window.location.origin}/p/${potId}`
    : `https://pot.maypos.xyz/p/${potId}`;

  const text = `Help me with: ${title}`;
  const waHref = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
  const xHref = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;

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
    <div className="flex flex-wrap gap-2">
      <a href={waHref} target="_blank" rel="noreferrer" className="btn-ghost-primary border border-dark-carbon">
        WHATSAPP
      </a>
      <a href={xHref} target="_blank" rel="noreferrer" className="btn-ghost-primary border border-dark-carbon">
        X / TWITTER
      </a>
      <button type="button" onClick={copyLink} className="btn-ghost-primary border border-dark-carbon">
        {copied ? "COPIED ✓" : "COPY LINK"}
      </button>
    </div>
  );
}
