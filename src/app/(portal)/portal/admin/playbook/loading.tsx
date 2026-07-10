export default function PlaybookLoading() {
  return (
    <div className="space-y-6">
      {/* Hero + stats */}
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2 max-w-xl">
          <div className="vm-shimmer h-9 w-44 rounded-lg" />
          <div className="vm-shimmer h-4 w-80 rounded" />
        </div>
        <div className="flex gap-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="vm-shimmer h-12 w-20 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="vm-shimmer h-7 w-16 rounded-full" />
        ))}
      </div>

      {/* Card grid */}
      <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
        {[40, 52, 44, 56, 48, 36, 60, 44].map((h, i) => (
          <div
            key={i}
            className="vm-shimmer break-inside-avoid rounded-[18px]"
            style={{ height: `${h * 4}px` }}
          />
        ))}
      </div>

      <p className="text-center text-sm text-[color:var(--vimi-muted)]">
        Cargando el playbook…
      </p>
    </div>
  );
}
