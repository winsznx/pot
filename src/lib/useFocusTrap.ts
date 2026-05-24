"use client";

import { useEffect, type RefObject } from "react";

/**
 * Trap keyboard focus inside the ref'd container while `active` is true.
 * Used for modal / drawer accessibility — Tab cycles within, Esc returns
 * focus to the trigger.
 */
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useFocusTrap(active: boolean, containerRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const items = container.querySelectorAll<HTMLElement>(FOCUSABLE);
    items[0]?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const focusables = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => !el.hasAttribute("disabled"),
      );
      if (focusables.length === 0) return;
      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    container.addEventListener("keydown", onKey);
    return () => {
      container.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
    };
  }, [active, containerRef]);
}
