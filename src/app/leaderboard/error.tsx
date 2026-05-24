"use client";

import { ErrorState } from "@/components/ErrorState";

export default function LeaderboardError({
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
          title="Leaderboard didn't index"
          description="Couldn't aggregate the event logs. RPC might be rate-limiting — refresh or come back in a minute."
          hint={error.digest}
          onRetry={reset}
        />
      </div>
    </main>
  );
}
