export default function Loading() {
  return (
    <div className="bg-secondary flex h-full w-full gap-6 px-4 pt-4 xl:px-6">
      {/* Left sidebar skeleton */}
      <div className="bg-background h-[calc(100vh-72px)] w-75 shrink-0 animate-pulse rounded-lg p-6">
        <div className="mb-6 flex gap-4">
          <div className="bg-neu2 h-4 w-16 rounded" />
          <div className="bg-neu2 h-4 w-12 rounded" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-neu2 h-16 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Calendar skeleton */}
      <div className="flex min-w-0 flex-1 gap-6">
        <div className="min-w-0 flex-1">
          <div className="bg-neu2 mb-2 h-4 w-24 animate-pulse rounded" />
          <div className="bg-background h-[calc(100vh-100px)] animate-pulse rounded-lg" />
        </div>

        {/* Right sidebar skeleton */}
        <div className="w-48 shrink-0 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-background h-24 animate-pulse rounded-lg"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
