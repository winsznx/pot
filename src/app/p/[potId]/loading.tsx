import { Skeleton } from "@/components/Skeleton";

export default function PotDetailLoading() {
  return (
    <main className="app-shell">
      <div className="container-wide py-20">
        <div className="grid gap-10 md:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="mt-8 h-3 w-full" />
            <div className="mt-2 flex gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-48" />
            <Skeleton className="h-32" />
            <Skeleton className="h-12" />
          </div>
        </div>
      </div>
    </main>
  );
}
