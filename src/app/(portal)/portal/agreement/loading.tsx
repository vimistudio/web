import { Skeleton } from "@/components/ui/skeleton";

export default function AgreementLoading() {
  return (
    <div className="space-y-8 max-w-[980px] mx-auto">
      {/* Hero */}
      <div className="space-y-3">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      {/* Deal card */}
      <Skeleton className="h-32 w-full rounded-2xl" />
      {/* Docs grid */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-3.5">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 rounded-2xl" />
        ))}
      </div>
      {/* Team */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <Skeleton className="h-44 rounded-2xl" />
        <Skeleton className="h-44 rounded-2xl" />
      </div>
    </div>
  );
}
