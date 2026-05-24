"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ErrorState";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[pot] route error:", error);
  }, [error]);

  return (
    <main className="app-shell flex min-h-screen items-center justify-center px-5 py-20">
      <ErrorState
        title="The page tripped on a stone"
        description="An unhandled error reached this route. The contract is fine — only the page failed to render."
        hint={error.digest ? `Trace: ${error.digest}` : undefined}
        onRetry={reset}
      />
    </main>
  );
}
