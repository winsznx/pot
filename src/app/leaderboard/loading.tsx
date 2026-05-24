import { Skeleton } from "@/components/Skeleton";

export default function LeaderboardLoading() {
  return (
    <main className="app-shell">
      <div className="container-wide py-20">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-10 w-2/3 mt-3" />
        <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--border-subtle)] md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="mt-8 space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    </main>
  );
}
