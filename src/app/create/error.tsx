"use client";

import { ErrorState } from "@/components/ErrorState";

export default function CreateError({
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
          title="Could not load the pot creator"
          description="The form failed to mount. Reload — if it keeps failing, check that your wallet is on Celo mainnet."
          hint={error.digest}
          onRetry={reset}
        />
      </div>
    </main>
  );
}
