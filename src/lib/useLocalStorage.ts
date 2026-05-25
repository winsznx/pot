"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Persisted state with localStorage. Returns the fallback during SSR and on
 * parse failure. Storage writes are best-effort — quota-exceeded swallows
 * silently rather than throwing into the render tree.
 */
export function useLocalStorage<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);

  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(key);
        if (raw !== null) setValue(JSON.parse(raw) as T);
      } catch {
        // ignore malformed payloads, keep the fallback
      }
    }, 0);
    return () => window.clearTimeout(t);
  }, [key]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          // quota / private mode — swallow
        }
        return resolved;
      });
    },
    [key],
  );

  return [value, update] as const;
}
