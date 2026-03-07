"use client";
import { TrackerCourse } from "@/app/notifications/page";
import NotificationsSectionCard, {
  NotificationSectionCardEmpty,
  NotificationSectionCardSkeleton,
} from "./NotificationsSectionCard";
import { Trash2 } from "lucide-react";
import { NotificationTerm } from "./NotificationsView";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteAllTrackersForCourseAction } from "@/lib/auth/tracking-actions";
import { Skeleton } from "../ui/skeleton";
import { cn } from "@/lib/cn";

interface NotificationsCourseCardProps {
  term?: NotificationTerm;
  course: TrackerCourse;
}

export default function NotificationsCourseCard({
  term,
  course,
}: NotificationsCourseCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const sections = course.sections;

  function handleUnsubscribeCourse() {
    startTransition(async () => {
      const sectionIds = sections.map((s) => s.id);

      if (!sectionIds) return;

      await deleteAllTrackersForCourseAction(sectionIds);
      router.refresh();
    });
  }

  function handleViewAllSections() {
    router.push(
      `/catalog/${course.term}/${course.courseRegister.slice(0, 4)}%20${course.courseRegister.slice(4, 8)}`,
    );
  }

  return (
    <div className="border-neu2 flex flex-col gap-3 rounded-lg border bg-white p-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-neu8 text-xl leading-[120%] font-bold">
            {course.courseRegister}
          </h3>
          <p className="text-neu8 text-base font-normal">
            {course.courseTitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="border-neu2 bg-neu2 hover:bg-neu3 text-neu7 flex h-9 items-center gap-[10px] rounded-[24px] border px-4 py-2 text-[14px] leading-[16.8px] font-semibold transition"
            onClick={handleViewAllSections}
            disabled={isPending}
          >
            View all sections
          </button>
          <button
            className="border-neu2 bg-neu2 hover:bg-neu3 flex h-9 w-9 items-center justify-center rounded-[24px] border transition"
            onClick={handleUnsubscribeCourse}
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
          : "No unsubscribed sections"}
      </p>
    </div>
  );
}

export function NotificationCourseCardSkeleton() {
  return (
    <div className="bg-neu1 border-neu25 shadow-neu-card flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-center items-start justify-between">
        <div>
          <Skeleton className="h-6 w-50 rounded-none" />
          <Skeleton className="mt-2 h-4 w-60 rounded-none" />
        </div>

        <div className="flex gap-2">
          <Skeleton className="h-9 w-35 rounded-[24px]" />
          <Skeleton className="h-9 w-9 rounded-[24px]" />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <NotificationSectionCardSkeleton />
        <NotificationSectionCardSkeleton />
        <NotificationSectionCardSkeleton />
      </div>
      <Skeleton className="h-4 w-60 rounded-none" />
    </div>
  );
}

export function NotificationCourseCardEmpty({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-neu1 border-neu25 shadow-neu-card flex flex-col gap-3 rounded-lg border p-4",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="bg-neu2 h-6 w-50 rounded-none" />
          <div className="bg-neu2 mt-2 h-4 w-60 rounded-none" />
        </div>

        <div className="flex gap-2">
          <div className="bg-neu2 h-9 w-35 rounded-[24px]" />
          <div className="bg-neu2 h-9 w-9 rounded-[24px]" />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <NotificationSectionCardEmpty />
        <NotificationSectionCardEmpty />
        <NotificationSectionCardEmpty />
      </div>

      <div className="bg-neu2 h-4 w-60 rounded-none" />
    </div>
  );
}
