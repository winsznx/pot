"use client";

import { useEffect, useState } from "react";

/**
 * True only after first client render. Use to avoid hydration mismatches when
 * a tree depends on browser-only state (wallet, localStorage, matchMedia).
 */
export function useIsClient(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
