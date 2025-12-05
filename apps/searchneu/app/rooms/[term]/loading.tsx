export default function Loading() {
  return (
    <div className="space-y-6">
      {[...Array(5)].map((_, i) => (
        <div key={i}>
          <div className="mb-3 h-6 w-48 animate-pulse rounded bg-gray-800" />
          <div className="flex flex-wrap gap-3">
            {[...Array(8)].map((_, j) => (
              <div
                key={j}
                className="h-10 w-20 animate-pulse rounded-lg bg-gray-800"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
