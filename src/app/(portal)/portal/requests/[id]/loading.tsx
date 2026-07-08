import { Skeleton } from "@/components/ui/skeleton";

export default function RequestDetailLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back + Status */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>

      {/* Review chip + serif hero card */}
      <div className="rounded-2xl border p-5 space-y-2">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-6 w-32 rounded-md" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-4 w-2/3" />
      </div>

      {/* Title + Meta */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-3/4" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-16 rounded-md" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>

      {/* Deliverables */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      </div>

      {/* Action bar (Approve pill + Request changes pill) */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Skeleton className="h-14 flex-1 rounded-full" />
        <Skeleton className="h-14 w-40 rounded-full" />
      </div>

      {/* Comments */}
      <div className="space-y-4">
        <Skeleton className="h-5 w-24" />
        {[1, 2].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
