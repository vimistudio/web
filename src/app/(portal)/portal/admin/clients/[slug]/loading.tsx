import { Skeleton } from "@/components/ui/skeleton";

export default function ClientBoardLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-7 w-40" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((col) => (
          <div key={col} className="space-y-3">
            <Skeleton className="h-5 w-24" />
            {[1, 2].map((card) => (
              <Skeleton key={card} className="h-28 w-full rounded-lg" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
