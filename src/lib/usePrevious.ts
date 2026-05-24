"use client";

import { useEffect, useRef } from "react";

/**
 * Track the previous value of any prop or state. Useful for diff-driven UI
 * (toast on tx hash change, animate on amount delta, etc.).
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}
