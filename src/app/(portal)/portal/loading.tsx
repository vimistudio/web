import { Skeleton } from "@/components/ui/skeleton";

export default function PortalLoading() {
  return (
    <div className="space-y-5 md:space-y-7">
      {/* Hero: eyebrow, serif greeting, summary + New Request pill */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2.5">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-9 w-72 max-w-full" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="hidden md:block h-12 w-40 rounded-full" />
      </div>

      {/* Segmented toggle */}
      <Skeleton className="hidden md:block h-10 w-44 rounded-full" />

      {/* Board columns with cards */}
      <div className="hidden md:grid grid-cols-4 gap-[18px]">
        {[1, 2, 3, 4].map((col) => (
          <div key={col} className="space-y-3">
            <Skeleton className="h-4 w-24" />
            {[1, 2].map((card) => (
              <Skeleton key={card} className="h-32 w-full rounded-2xl" />
            ))}
          </div>
        ))}
      </div>

      {/* Mobile stacked cards */}
      <div className="md:hidden space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
      </div>
    </div>
  );
}
