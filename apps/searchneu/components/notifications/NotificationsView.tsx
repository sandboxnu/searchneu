"use client";

import NotificationsCourseCard from "./NotificationsCourseCard";
import { TrackerCourse } from "@/app/notifications/page";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteAllTrackersForCourseAction } from "@/lib/auth/tracking-actions";
import { NotificationTerm } from "./NotificationsSidebar";

export function NotificationsView({
  courses,
  terms,
}: {
  courses: TrackerCourse[];
  terms: NotificationTerm[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleUnsubscribeCourse = (courseId: number) => {
    startTransition(async () => {
      const sectionIds = courses
        .find((course) => course.courseId === courseId)
        ?.sections.map((s) => s.id);

      if (!sectionIds) return;

      await deleteAllTrackersForCourseAction(sectionIds);
      router.refresh();
    });
  };

  const handleViewAllSections = (courseId: number) => {
    const section = courses.find((course) => course.courseId === courseId)
      ?.sections[0];

    if (!section) return;

    router.push(
      `/catalog/${terms[0].term}/${section.courseSubject}%20${section.courseNumber}`,
    );
  };

  // TODO: When no courses present
  if (courses.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-neu5 text-sm">No subscribed sections yet.</p>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto">
      <div className="flex flex-col gap-6 pb-6">
        {courses.map((course) => (
          <NotificationsCourseCard
            key={course.courseName}
            course={course}
            term={terms.find((term) => term.name === course.sections[0].term)}
            onViewAllSections={() => handleViewAllSections(course.courseId)}
            onUnsubscribeAll={() => handleUnsubscribeCourse(course.courseId)}
            isPending={isPending}
          />
        ))}
      </div>
    </div>
  );
}
