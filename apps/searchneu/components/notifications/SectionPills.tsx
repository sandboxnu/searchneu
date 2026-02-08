import { cn } from "@/lib/cn";

export function SectionPills({
  filled,
  total,
}: {
  filled: number;
  total: number;
}) {
  const safeTotal = Math.max(1, total);
  const safeFilled = Math.max(0, Math.min(filled, safeTotal));

  return (
    <div className="flex w-full items-center gap-1 overflow-hidden">
      {Array.from({ length: safeTotal }).map((_, i) => {
        const isFilled = i < safeFilled;
        const isFirst = i === 0;
        const isLast = i === safeTotal - 1;

        const radiusClass = isFirst
          ? "rounded-l-full rounded-r-[2px]"
          : isLast
            ? "rounded-r-full rounded-l-[2px]"
            : "rounded-[2px]";

        return (
          <div
            key={i}
            className={cn(
              "h-2 flex-1",
              "min-w-[6px]",
              radiusClass,
              isFilled ? "bg-neu7 opacity-95" : "bg-neu3 opacity-85",
            )}
          />
        );
      })}
    </div>
  );
}
