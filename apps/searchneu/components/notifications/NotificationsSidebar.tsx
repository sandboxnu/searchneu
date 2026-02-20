"use client";

import { Button } from "../ui/button";
import { Info, Trash2, CircleQuestionMark } from "lucide-react";
import { SectionPills } from "./SectionPills";
import { TooltipTrigger, TooltipContent, Tooltip } from "../ui/tooltip";
import { PastNotificationCard } from "./PastNotificationCard";
import { deleteAllTrackersAction } from "@/lib/auth/tracking-actions";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { NotificationsSidebarProps } from "./NotificationsWrapper";

export function NotificationsSidebar({
  subscribedCount,
  totalLimit,
  termNames,
  notifications,
}: NotificationsSidebarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleUnsubscribeAll = () => {
    startTransition(async () => {
      await deleteAllTrackersAction();
      router.refresh();
    });
  };

  const formatNotificationDate = (date: Date) => {
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return {
        dateLabel: "Today",
        time: date.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
        isToday: true,
      };
    }

    return {
      dateLabel: date.toLocaleDateString("en-US"),
      time: date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
      isToday: false,
    };
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 pb-4">
      <div className="bg-neu1 border-neu25 shadow-[-2px_4px_12px_rgba(221, 221, 221, 0.1)] shadow-neu-card flex flex-col gap-1 rounded-lg border px-4 py-4">
        <h3 className="text-neu6 text-xs font-bold">SEMESTER</h3>
        <h3 className="text-neu9 text-2xl font-bold">{termNames.join(", ")}</h3>
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
          {subscribedCount}/{totalLimit} Sections
        </h3>

        <div className="mb-1 flex h-6 items-center">
          <SectionPills filled={subscribedCount} total={totalLimit} />
        </div>

        <Button
          variant="secondary"
          className="text-neu6 bg-neu2 hover:text-neu9 cursor-pointer rounded-full px-2 py-1"
          onClick={handleUnsubscribeAll}
          disabled={isPending || subscribedCount === 0}
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
          {notifications.map((notif) => {
            const { dateLabel, time, isToday } = formatNotificationDate(
              notif.sentAt,
            );
            return (
              <PastNotificationCard
                key={notif.id}
                crn={notif.crn}
                course={`${notif.courseSubject} ${notif.courseNumber} - ${notif.courseName}`}
                dateLabel={dateLabel}
                time={time}
                isToday={isToday}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
