import { TooltipTrigger, Tooltip, TooltipContent } from "../ui/tooltip";

type PastNotificationCardProps = {
  crn: string;
  course: string;
  dateLabel: string;
  time: string;
  isToday?: boolean;
};

export function PastNotificationCard({
  crn,
  course,
  dateLabel,
  time,
  isToday = false,
}: PastNotificationCardProps) {
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
