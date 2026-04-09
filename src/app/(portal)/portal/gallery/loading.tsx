import { Skeleton } from "@/components/ui/skeleton";

export default function GalleryLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-8 w-16 rounded-full" />
        ))}
      </div>
      <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
        {[40, 52, 44, 56, 48, 36, 60, 44].map((h, i) => (
          <Skeleton
            key={i}
            className="break-inside-avoid rounded-lg"
            style={{ height: `${h * 4}px` }}
          />
        ))}
      </div>
    </div>
  );
}
