"use client";

import { useEffect, useState } from "react";

/**
 * Trail the input value by `delayMs`. Useful for keypress→on-chain reads so we
 * don't fire a getLogs per keystroke.
 */
export function useDebounce<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
