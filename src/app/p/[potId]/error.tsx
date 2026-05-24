"use client";

import { ErrorState } from "@/components/ErrorState";

export default function PotDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="app-shell">
      <div className="container-wide py-20">
        <ErrorState
          title="That pot wouldn't load"
          description="Either the id doesn't exist or the chain read timed out. Try refreshing."
          hint={error.digest}
          onRetry={reset}
        />
      </div>
    </main>
  );
}
