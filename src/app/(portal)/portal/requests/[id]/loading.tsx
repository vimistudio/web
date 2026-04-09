import { Skeleton } from "@/components/ui/skeleton";

export default function RequestDetailLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back + Status */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>

      {/* Progress stepper */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-2 flex-1 rounded" />
          </div>
        ))}
      </div>

      {/* Title + Meta */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-3/4" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>

      {/* Deliverables */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </div>
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
