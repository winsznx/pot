"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ConnectButton } from "./ConnectButton";
import { NetworkSelector } from "./NetworkSelector";

const LINKS = [
  { href: "/#how", label: "How it works" },
  { href: "/#trust", label: "Trust" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/create", label: "Open a pot" },
];

/**
 * Mobile-only slide-out nav. Locks body scroll while open, closes on Esc or
 * backdrop click, and traps focus inside the dialog while open — without the
 * focus trap, keyboard users opening the drawer would Tab straight into the
 * inert page behind the overlay, violating the aria-modal="true" contract.
 * Focus is restored to the trigger button on close.
 */
export function NavDrawer() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const trigger = triggerRef.current;
    document.body.style.overflow = "hidden";

    // Move focus into the dialog on open.
    closeBtnRef.current?.focus();

    const focusable = () =>
      Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => !el.hasAttribute("inert"));

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const nodes = focusable();
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
      // Restore focus to the trigger so the user lands back where they were.
      trigger?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        aria-haspopup="dialog"
        className="grid h-10 w-10 place-items-center rounded-lg border border-[var(--border-subtle)] lg:hidden"
      >
        <span aria-hidden className="text-lg leading-none">☰</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] lg:hidden">
          {/* Backdrop: aria-hidden div + onClick so it doesn't enter the tab
              order in front of the dialog (the previous <button> backdrop made
              Tab land on "Close menu" first, and Shift-Tab from inside escaped
              the dialog). */}
          <div
            aria-hidden="true"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="absolute inset-y-0 right-0 flex w-[min(320px,86vw)] flex-col gap-3 bg-[var(--bg-surface)] p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold">Menu</span>
              <button
                ref={closeBtnRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="h-9 w-9 rounded-md border border-[var(--border-subtle)]"
              >
                ×
              </button>
            </div>
            <nav className="mt-4 flex flex-col">
              <div className="mb-4 grid gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
                <NetworkSelector />
                <ConnectButton />
              </div>
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
