"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Copy + 2s "copied" flag. Falls back to a textarea selection when the modern
 * Clipboard API isn't available (Safari < 13, insecure contexts).
 */
export function useClipboard(resetMs = 2000) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  const copy = useCallback(
    async (value: string) => {
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(value);
        } else {
          const textarea = document.createElement("textarea");
          textarea.value = value;
          textarea.style.position = "fixed";
          textarea.style.opacity = "0";
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          textarea.remove();
        }
        setCopied(true);
        if (timer.current) window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setCopied(false), resetMs);
        return true;
      } catch {
        return false;
      }
    },
    [resetMs],
  );

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  return { copied, copy };
}
