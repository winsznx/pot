"use client";

import { useEffect, useState } from "react";

/**
 * True only after first client render. Use to avoid hydration mismatches when
 * a tree depends on browser-only state (wallet, localStorage, matchMedia).
 */
export function useIsClient(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(t);
  }, []);
  return mounted;
}
