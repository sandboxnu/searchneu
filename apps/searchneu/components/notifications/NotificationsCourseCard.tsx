"use client";
import NotificationsSectionCard from "./NotificationsSectionCard";
import { Trash2 } from "lucide-react";
import type { SectionTableMeetingTime } from "@/components/catalog/SectionTable";

interface Section {
  crn: string;
  messagesSent: number;
  messageLimit: number;
  isSubscribed: boolean;
  meetingTimes: SectionTableMeetingTime[];
  professor: string;
  location: string;
  campus: string;
  enrollmentSeats: {
    current: number;
    total: number;
  };
  waitlistSeats: {
    current: number;
    total: number;
  };
}

interface NotificationsCourseCardProps {
  courseName: string;
  courseTitle: string;
  sections: Section[];
  onToggleSubscription?: (crn: string) => void;
  onViewAllSections?: () => void;
  onUnsubscribeAll?: () => void;
  isPending?: boolean;
}

export default function NotificationsCourseCard({
  courseName,
  courseTitle,
  sections,
  onToggleSubscription,
  onViewAllSections,
  onUnsubscribeAll,
  isPending,
}: NotificationsCourseCardProps) {
  const unsubscribedCount = sections.filter((s) => !s.isSubscribed).length;
  const totalSections = sections.length;

  return (
    <div className="border-neu2 flex flex-col gap-3 rounded-lg border bg-white p-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-neu8 text-xl leading-[120%] font-bold">
            {courseName}
          </h3>
          <p className="text-neu8 text-base font-normal">{courseTitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="border-neu2 bg-neu2 hover:bg-neu3 text-neu7 flex h-9 items-center gap-[10px] rounded-[24px] border px-4 py-2 text-[14px] leading-[16.8px] font-semibold transition"
            onClick={onViewAllSections}
            disabled={isPending}
          >
            View all sections
          </button>
          <button
            className="border-neu2 bg-neu2 hover:bg-neu3 flex h-9 w-9 items-center justify-center rounded-[24px] border transition"
            onClick={onUnsubscribeAll}
            disabled={isPending}
          >
            <Trash2 className="text-neu6 h-4 w-4 shrink-0" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sections.map((section, index) => (
          <NotificationsSectionCard
            key={index}
            {...section}
            onToggleSubscription={() => onToggleSubscription?.(section.crn)}
          />
        ))}
      </div>

      {unsubscribedCount > 0 && (
        <p className="text-neu5 text-sm italic">
          {unsubscribedCount}/{totalSections} unsubscribed sections available
        </p>
      )}
    </div>
  );
}
