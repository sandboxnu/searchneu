import { Button } from "../ui/button";
import { Info, Trash2, CircleQuestionMark } from "lucide-react";
import { SectionPills } from "./SectionPills";
import { TooltipTrigger, TooltipContent, Tooltip } from "../ui/tooltip";
import { PastNotificationCard } from "./PastNotificationCard";

export function NotificationsSidebar() {
  const subscribedSections = 6;
  const totalSections = 12;

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 pb-4">
      <div className="bg-neu1 border-neu25 shadow-[-2px_4px_12px_rgba(221, 221, 221, 0.1)] shadow-neu-card flex flex-col gap-1 rounded-lg border px-4 py-4">
        <h3 className="text-neu6 text-xs font-bold">SEMESTER</h3>
        <h3 className="text-neu9 text-2xl font-bold">
          Summer I, Summer II 2026
        </h3>
      </div>

      <div className="bg-neu1 border-neu25 shadow-neu-card flex flex-col gap-2 rounded-lg border px-4 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-neu6 text-xs font-bold">SUBSCRIBED SECTIONS</h3>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="text-neu6 hover:text-neu9 transition"
              >
                <Info className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p>Subscribed Sections.</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <h3 className="text-neu9 text-2xl font-bold">
          {subscribedSections}/{totalSections} Sections
        </h3>

        <div className="mb-1 flex h-6 items-center">
          <SectionPills filled={subscribedSections} total={totalSections} />
        </div>

        <Button
          variant="secondary"
          className="text-neu6 bg-neu2 hover:text-neu9 cursor-pointer rounded-full px-2 py-1"
          onClick={() => console.log("clicked")}
        >
          <Trash2 className="size-4" />
          Unsubscribe from all
        </Button>
      </div>

      <div className="bg-neu1 border-neu25 shadow-neu-card flex min-h-0 flex-1 flex-col gap-2 rounded-lg border px-4 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-neu6 text-xs font-bold">PAST NOTIFICATIONS</h3>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="text-neu6 hover:text-neu9 transition"
              >
                <CircleQuestionMark className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p>Past Notifications.</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="scrollbar-track-transparent flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
          {Array.from({ length: 3 }).map((_, i) => (
            <PastNotificationCard
              key={`today-${i}`}
              crn="10431"
              course="Organic Chemistry 1"
              dateLabel="Today"
              time="5:13pm"
              isToday
            />
          ))}
          {Array.from({ length: 3 }).map((_, i) => (
            <PastNotificationCard
              key={`past-${i}`}
              crn="10431"
              course="Organic Chemistry 1"
              dateLabel="1/8/2026"
              time="5:13pm"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
