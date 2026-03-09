import { Skeleton } from "../ui/skeleton";
import { TooltipTrigger, Tooltip, TooltipContent } from "../ui/tooltip";

export function PastNotificationCard({
  crn,
  course,
  dateLabel,
  time,
  isToday = false,
}: {
  crn: string;
  course: string;
  dateLabel: string;
  time: string;
  isToday?: boolean;
}) {
  return (
    <div className="bg-neu2 border-neu2 flex w-full flex-col gap-2 rounded-lg border p-3 text-sm shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
      <div className="grid grid-cols-[auto_1fr] items-center gap-2">
        <span className="text-neu9 font-bold">CRN {crn}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-neu6 cursor-default truncate text-right">
              {course}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            {course}
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="flex w-full items-center justify-between text-xs font-semibold">
        <span className={isToday ? "text-red" : "text-neu6"}>{dateLabel}</span>
        <span className="text-neu6">{time}</span>
      </div>
    </div>
  );
}

export function PastNotificationCardSkeleton() {
  return (
    <div className="bg-neu2 flex flex-col gap-2 rounded-md p-3">
      <div className="flex justify-between">
        <Skeleton className="h-5 w-22 rounded-none" />
        <Skeleton className="h-5 w-30 rounded-none" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-3 w-17 rounded-none" />
        <Skeleton className="h-3 w-10 rounded-none" />
      </div>
    </div>
  );
}

export function PastNotificationCardsEmpty() {
  const opacities = [
    "opacity-100",
    "opacity-90",
    "opacity-80",
    "opacity-70",
    "opacity-60",
    "opacity-50",
    "opacity-40",
  ];
  return Array.from({ length: 7 }).map((_, i) => {
    return (
      <div
        key={i}
        className={`bg-neu2 h-17 w-full rounded-md ${opacities[i]}`}
      />
    );
  });
}
