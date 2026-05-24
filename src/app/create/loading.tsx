import { Skeleton } from "@/components/Skeleton";

export default function CreateLoading() {
  return (
    <main className="app-shell">
      <div className="container-wide grid gap-10 py-20 md:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-5 w-full" />
          <div className="mt-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        </div>
        <Skeleton className="h-72" />
      </div>
    </main>
  );
}
