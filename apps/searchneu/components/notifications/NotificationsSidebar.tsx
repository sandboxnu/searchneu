"use client";

import { Button } from "../ui/button";
import { Info, Trash2 } from "lucide-react";
import { SectionPills } from "./SectionPills";
import { TooltipTrigger, TooltipContent, Tooltip } from "../ui/tooltip";
import {
  PastNotificationCard,
  PastNotificationCardsEmpty,
  PastNotificationCardSkeleton,
} from "./PastNotificationCard";
import { deleteAllTrackersAction } from "@/lib/auth/tracking-actions";
import { useRouter } from "next/navigation";
import { use, useTransition } from "react";
import { Skeleton } from "../ui/skeleton";

interface Notification {
  id: number;
  crn: string;
  courseName: string;
  courseSubject: string;
  courseNumber: string;
  sentAt: Date;
}

interface NotificationTerm {
  name: string;
  term: string;
}

export function NotificationTermCard({
  termsPromise,
}: {
  termsPromise?: Promise<NotificationTerm[]>;
}) {
  const terms = termsPromise ? use(termsPromise) : [];
  const termNames = terms.map((term) => term.name);

  return (
    <div className="bg-neu1 border-neu25 shadow-[-2px_4px_12px_rgba(221, 221, 221, 0.1)] shadow-neu-card flex flex-col gap-1 rounded-lg border px-4 py-4">
      <h3 className="text-neu6 text-xs font-bold">SEMESTER</h3>
      {terms.length > 0 && (
        <h3 className="text-neu9 text-2xl font-bold">{termNames.join(", ")}</h3>
      )}
    </div>
  );
}

export function NotificationTermCardSkeleton() {
  return (
    <div className="bg-neu1 border-neu25 shadow-[-2px_4px_12px_rgba(221, 221, 221, 0.1)] shadow-neu-card flex flex-col gap-1 rounded-lg border px-4 py-4">
      <h3 className="text-neu6 text-xs font-bold">SEMESTER</h3>
      <Skeleton className="text-neu9 h-8" />
    </div>
  );
}

function InfoTooltip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="text-neu6 hover:text-neu9 transition">
          <Info className="size-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="right"
        className="max-w-60 min-w-0 break-words whitespace-normal"
      >
        <p>{text}</p>
      </TooltipContent>
    </Tooltip>
  );
}
export function NotificationCountCard({
  subscribedCount,
  totalLimit,
}: {
  subscribedCount: number;
  totalLimit: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleUnsubscribeAll = () => {
    startTransition(async () => {
      await deleteAllTrackersAction();
      router.refresh();
    });
  };
  return (
    <div className="bg-neu1 border-neu25 shadow-neu-card flex flex-col gap-2 rounded-lg border px-4 py-4">
      <div className="flex items-center justify-between">
        <h3 className="text-neu6 text-xs font-bold">SUBSCRIBED SECTIONS</h3>
        <InfoTooltip text="You can track up to 12 sections at once. If full, turn off notifications for a section to free up a slot for another." />
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
  );
}

export function NotificationCountCardSkeleton() {
  return (
    <div className="bg-neu1 border-neu25 shadow-neu-card flex flex-col gap-2 rounded-lg border px-4 py-4">
      <div className="flex items-center justify-between">
        <h3 className="text-neu6 text-xs font-bold">SUBSCRIBED SECTIONS</h3>
        <Info className="text-neu6 size-4" />
      </div>

      <Skeleton className="text-neu9 h-7.5" />
      <Skeleton className="text-neu9 mt-2 mb-3 h-2" />
      <Skeleton className="text-neu9 h-9 rounded-full" />
    </div>
  );
}

export function PastNotificationsSection({
  notificationsPromise,
}: {
  notificationsPromise: Promise<Notification[]>;
}) {
  const notifications = use(notificationsPromise);

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
    <div className="bg-neu1 border-neu25 shadow-neu-card flex min-h-0 flex-1 flex-col gap-2 rounded-lg border px-4 py-4">
      <div className="flex items-center justify-between">
        <h3 className="text-neu6 text-xs font-bold">PAST NOTIFICATIONS</h3>
        <InfoTooltip
          text="All your past notifications in one place. Sections are shown by CRN,
          and each entry matches a text sent to your phone."
        />
      </div>

      <div className="scrollbar-track-transparent flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        {notifications.length > 0 ? (
          notifications.map((notif) => {
            const { dateLabel, time, isToday } = formatNotificationDate(
              notif.sentAt,
            );
            return (
              <PastNotificationCard
                key={notif.id}
                crn={notif.crn}
                course={`${notif.courseSubject} ${notif.courseName}`}
                dateLabel={dateLabel}
                time={time}
                isToday={isToday}
              />
            );
          })
        ) : (
          <div className="flex flex-col gap-2 overflow-hidden">
            <span className="text-neu5 my-3 text-center italic">
              Previously sent notifications will show up here.
            </span>
            <PastNotificationCardsEmpty />
          </div>
        )}
      </div>
    </div>
  );
}

export function PastNotificationsSectionSkeleton() {
  return (
    <div className="bg-neu1 border-neu25 shadow-neu-card flex min-h-0 flex-1 flex-col gap-2 rounded-lg border px-4 py-4">
      <div className="flex items-center justify-between">
        <h3 className="text-neu6 text-xs font-bold">PAST NOTIFICATIONS</h3>
        <Info className="text-neu6 size-4" />
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 7 }).map((_, i) => {
          return <PastNotificationCardSkeleton key={i} />;
        })}
      </div>
    </div>
  );
}

export function PastNotificationsSectionEmpty() {
  return (
    <div className="bg-neu1 border-neu25 shadow-neu-card flex min-h-0 flex-1 flex-col gap-2 rounded-lg border px-4 py-4">
      <div className="flex items-center justify-between">
        <h3 className="text-neu6 text-xs font-bold">PAST NOTIFICATIONS</h3>
        <InfoTooltip
          text="All your past notifications in one place. Sections are shown by CRN,
          and each entry matches a text sent to your phone."
        />
      </div>
      <div className="flex flex-col gap-2">
        <PastNotificationCardsEmpty />;
      </div>
    </div>
  );
}
