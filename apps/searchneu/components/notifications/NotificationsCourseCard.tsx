"use client";
import { TrackerCourse } from "@/app/notifications/page";
import NotificationsSectionCard from "./NotificationsSectionCard";
import { Trash2 } from "lucide-react";
import { NotificationTerm } from "./NotificationsSidebar";
interface NotificationsCourseCardProps {
  term?: NotificationTerm;
  course: TrackerCourse;
  onViewAllSections: () => void;
  onUnsubscribeAll: () => void;
  isPending: boolean;
}

export default function NotificationsCourseCard({
  term,
  course,
  onViewAllSections,
  onUnsubscribeAll,
  isPending,
}: NotificationsCourseCardProps) {
  const sections = course.sections;

  return (
    <div className="border-neu2 flex flex-col gap-3 rounded-lg border bg-white p-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-neu8 text-xl leading-[120%] font-bold">
            {course.courseName}
          </h3>
          <p className="text-neu8 text-base font-normal">
            {course.courseTitle}
          </p>
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
          <NotificationsSectionCard key={index} section={section} term={term} />
        ))}
      </div>

      <p className="text-neu5 text-sm italic">
        {course.unsubscribedCount > 0
          ? `${course.unsubscribedWithSeatsCount}/${course.unsubscribedCount} unsubscribed sections available`
          : "No unsubscribed section"}
      </p>
    </div>
  );
}
