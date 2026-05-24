"use client";

import { useEffect } from "react";

/**
 * Sync `document.title` while a tree is mounted, restoring on unmount. Good
 * for client-driven detail views that don't get static metadata.
 */
export function useDocumentTitle(title: string | null | undefined) {
  useEffect(() => {
    if (!title) return;
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
