"use client";

import { ErrorState } from "@/components/ErrorState";

export default function DashboardError({
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
          title="Dashboard failed to load"
          description="The contract reads timed out. Forno can be slow under load — give it another shot."
          hint={error.digest}
          onRetry={reset}
        />
      </div>
    </main>
  );
}
