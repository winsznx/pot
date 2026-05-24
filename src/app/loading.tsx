import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="app-shell">
      <div className="container-wide py-20">
        <div className="space-y-4">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
