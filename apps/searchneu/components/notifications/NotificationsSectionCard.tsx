"use client";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TrackingSwitch } from "@/components/auth/TrackingSwitch";
import { MeetingBlocks } from "@/components/catalog/SectionTableBlocks";
import { type TrackerSection } from "@/app/notifications/page";
import { type NotificationTerm } from "./NotificationsView";
import { Skeleton } from "../ui/skeleton";
import { Bell } from "lucide-react";
import { cn } from "@/lib/cn";

export default function NotificationsSectionCard({
  section,
  term,
}: {
  section: TrackerSection;
  term?: NotificationTerm;
}) {
  const now = new Date();

  return (
    <div className="bg-neu2 border-neu2 flex min-h-[229.538px] max-w-[450px] min-w-82 flex-1 flex-col items-start justify-center gap-2.5 rounded-lg border p-3">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-neu7 text-sm leading-[130%] font-bold whitespace-nowrap">
            CRN {section.crn}
          </span>

          <NotificationBells
            messagesSent={section.messageCount}
            messageLimit={section.messageLimit}
            isSubscribed={true}
          />
        </div>

        <div className="ml-auto">
          <TrackingSwitch
            sectionId={section.id}
            inital={true}
            isTermActive={!!term?.activeUntil && term.activeUntil > now}
          />
        </div>
      </div>
      <hr className="border-neu4 w-full border-t-[0.5px]" />

      <div className="grid w-full grid-cols-2 gap-x-6 gap-y-3">
        <InfoSection label="MEETING TIMES">
          <MeetingBlocks meetings={section.meetingTimes} crn={section.crn} />
        </InfoSection>

        <InfoSection label="PROFESSOR">
          <span className="text-neu9 text-base">{section.faculty}</span>
        </InfoSection>

        <InfoSection label="LOCATION">
          <span className="text-neu9 text-base">
            {section.meetingTimes?.[0]?.room?.building?.name ?? "TBA"}
          </span>
        </InfoSection>

        <InfoSection label="CAMPUS">
          <span className="text-neu9 text-base">{section.campus}</span>
        </InfoSection>

        <SeatCounter
          label="ENROLLMENT SEATS"
          current={section.seatRemaining}
          total={section.seatCapacity}
        />

        <SeatCounter
          label="WAITLIST SEATS"
          current={section.waitlistRemaining}
          total={section.waitlistCapacity}
        />
      </div>
    </div>
  );
}

function NotificationBells({
  messagesSent,
  messageLimit,
  isSubscribed,
}: {
  messagesSent: number;
  messageLimit: number;
  isSubscribed: boolean;
}) {
  const filledBells = Math.max(messageLimit - messagesSent, 0);
  const emptySlots = messagesSent;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1">
          {Array.from({ length: emptySlots }).map((_, i) => (
            <div
              key={`diamond-${i}`}
              className="flex size-2.5 items-center justify-center rounded-sm"
            >
              <svg width="10" height="10" viewBox="0 0 10 10">
                <path d="M5 0L10 5L5 10L0 5L5 0Z" className="fill-r1" />
              </svg>
            </div>
          ))}

          {Array.from({ length: filledBells }).map((_, i) => (
            <Bell
              key={i}
              className={cn(
                "text-r4 size-3 fill-current stroke-0",
                isSubscribed ? "opacity-100" : "opacity-40",
              )}
            />
          ))}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>
          {filledBells} notification{filledBells !== 1 ? "s" : ""} remaining
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

function InfoSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-neu5 text-xs font-bold uppercase">{label}</span>
      {children}
    </div>
  );
}

function SeatCounter({
  label,
  current,
  total,
}: {
  label: string;
  current: number;
  total: number;
}) {
  const focused = current > 0;
  return (
    <div
      className={`flex h-[54px] flex-col justify-center gap-1 rounded-lg border bg-white px-3 ${
        focused ? "border-neu3" : "border-neu2"
      }`}
    >
      <span
        className={`text-xs font-bold uppercase ${
          focused ? "text-neu7" : "text-neu5"
        }`}
      >
        {label}
      </span>
      {total > 0 ? (
        <div className="text-base leading-[18.2px]">
          <span
            className={
              focused ? "text-neu9 font-bold" : "text-neu7 font-normal"
            }
          >
            {current}
          </span>
          <span className={focused ? "text-neu7" : "text-neu5"}>
            {" "}
            / {total}
          </span>
        </div>
      ) : (
        <span className="text-neu5 text-xs italic">None</span>
      )}
    </div>
  );
}

export function NotificationSectionCardSkeleton() {
  return (
    <div className="border-neu25 bg-neu2 flex min-h-[229.538px] max-w-[450px] min-w-[328px] flex-col gap-2 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-20 rounded-none" />
          <Skeleton className="h-4 w-15 rounded-none" />
        </div>
        <Skeleton className="h-6 w-10 rounded-none" />
      </div>
      <div className="bg-neu25 h-0.5 w-full" />
      <div className="grid grid-cols-2 gap-7">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-25 rounded-none" />
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-4 rounded-none" />
            ))}
          </div>
          <Skeleton className="mb-2 h-4 w-40 rounded-none" />
          <Skeleton className="h-4 w-25 rounded-none" />
          <Skeleton className="mb-2 h-4 w-40 rounded-none" />
          <Skeleton className="h-10 w-47 rounded-none" />
        </div>
        <div className="flex flex-col gap-2 justify-self-center">
          <Skeleton className="h-4 w-25 rounded-none" />
          <Skeleton className="mb-8 h-4 w-40 rounded-none" />
          <Skeleton className="h-4 w-25 rounded-none" />
          <Skeleton className="mb-2 h-4 w-40 rounded-none" />
          <Skeleton className="h-10 w-47 rounded-none" />
        </div>
      </div>
    </div>
  );
}

export function NotificationSectionCardEmpty() {
  return <div className="bg-neu2 h-60 w-105 rounded-md" />;
}
