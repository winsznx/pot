import { Skeleton } from "@/components/Skeleton";

export default function DashboardLoading() {
  return (
    <main className="app-shell">
      <div className="container-wide py-20">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-10 w-2/3 mt-3" />
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    </main>
  );
}
