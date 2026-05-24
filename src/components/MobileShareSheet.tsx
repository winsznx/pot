"use client";

import { useEffect } from "react";
import { CopyButton } from "./CopyButton";
import { QrCode } from "./QrCode";
import { tweetLink, telegramLink, whatsAppLink, defaultShareText } from "@/lib/share";

type Props = {
  open: boolean;
  onClose: () => void;
  url: string;
  title?: string;
};

/**
 * Bottom-sheet share for mobile. Wraps the QR + native intents in one trigger
 * so the share buttons don't sprawl across the pot detail page.
 */
export function MobileShareSheet({ open, onClose, url, title }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const text = defaultShareText(title);

  return (
    <div className="fixed inset-0 z-[85] flex items-end justify-center" role="dialog" aria-modal="true">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div className="relative w-full max-w-md rounded-t-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[var(--border-strong)]" />
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-white p-3">
            <QrCode value={url} size={184} />
          </div>
          <div className="grid w-full grid-cols-3 gap-2">
            <a href={whatsAppLink(text, url)} target="_blank" rel="noreferrer" className="btn-ghost text-center">
              WhatsApp
            </a>
            <a href={tweetLink(text, url)} target="_blank" rel="noreferrer" className="btn-ghost text-center">
              X
            </a>
            <a href={telegramLink(text, url)} target="_blank" rel="noreferrer" className="btn-ghost text-center">
              Telegram
            </a>
          </div>
          <div className="flex w-full items-center justify-between gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3 py-2">
            <span className="truncate text-mono text-xs text-[var(--text-tertiary)]">{url}</span>
            <CopyButton value={url} />
          </div>
        </div>
      </div>
    </div>
  );
}
