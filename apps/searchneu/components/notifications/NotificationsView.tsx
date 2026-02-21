"use client";

import NotificationsCourseCard from "./NotificationsCourseCard";
import { TrackerSection } from "@/app/notifications/page";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  deleteAllTrackersForCourseAction,
  deleteTrackerAction,
} from "@/lib/auth/tracking-actions";

export function NotificationsView({
  sections,
  termId,
}: {
  sections: TrackerSection[];
  termId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const courseMap = new Map<
    string,
    {
      courseName: string;
      courseTitle: string;
      sections: TrackerSection[];
    }
  >();

  for (const section of sections) {
    if (!courseMap.has(section.courseRegister)) {
      courseMap.set(section.courseRegister, {
        courseName: section.courseRegister,
        courseTitle: section.courseName,
        sections: [],
      });
    }
    courseMap.get(section.courseRegister)!.sections.push(section);
  }

  const courses = Array.from(courseMap.values());

  const handleUnsubscribeCourse = (courseRegister: string) => {
    startTransition(async () => {
      const sectionIds = courseMap
        .get(courseRegister)!
        .sections.map((s) => s.id);
      await deleteAllTrackersForCourseAction(sectionIds);
      router.refresh();
    });
  };

  const handleViewAllSections = (courseRegister: string) => {
    const s = courseMap.get(courseRegister)!.sections[0];
    router.push(`/catalog/${termId}/${s.courseSubject}%20${s.courseNumber}`);
  };

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
            courseName={course.courseName}
            courseTitle={course.courseTitle}
            sections={course.sections.map((s) => ({
              crn: s.crn,
              messagesSent: s.messageCount,
              messageLimit: s.messageLimit,
              isSubscribed: true,
              meetingTimes: s.meetingTimes,
              professor: s.faculty,
              location: s.meetingTimes[0]?.room?.building?.name ?? "TBA",
              campus: s.campus,
              enrollmentSeats: {
                current: s.seatRemaining,
                total: s.seatCapacity,
              },
              waitlistSeats: {
                current: s.waitlistRemaining,
                total: s.waitlistCapacity,
              },
            }))}
            onToggleSubscription={(crn) => {
              const section = course.sections.find((s) => s.crn === crn);
              if (!section) return;

              startTransition(async () => {
                await deleteTrackerAction(section.id);
              });
            }}
            onViewAllSections={() => handleViewAllSections(course.courseName)}
            onUnsubscribeAll={() => handleUnsubscribeCourse(course.courseName)}
            isPending={isPending}
          />
        ))}
      </div>
    </div>
  );
}
