"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const LINKS = [
  { href: "/#how", label: "How it works" },
  { href: "/#trust", label: "Trust" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/create", label: "Open a pot" },
];

/**
 * Mobile-only slide-out nav. Locks body scroll while open and closes on Esc
 * or backdrop click. Designed to mirror the desktop NAV links so navigation
 * stays one mental model.
 */
export function NavDrawer() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="grid h-10 w-10 place-items-center rounded-lg border border-[var(--border-subtle)] md:hidden"
      >
        <span aria-hidden className="text-lg leading-none">☰</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="absolute inset-y-0 right-0 flex w-[min(320px,86vw)] flex-col gap-3 bg-[var(--bg-surface)] p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold">Menu</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="h-9 w-9 rounded-md border border-[var(--border-subtle)]"
              >
                ×
              </button>
            </div>
            <nav className="mt-4 flex flex-col">
              {LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="border-b border-[var(--border-subtle)] py-3 text-[15px] text-[var(--text-primary)]"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
