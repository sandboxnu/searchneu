"use client";

import NotificationsCourseCard from "./NotificationsCourseCard";
import { TrackerCourse } from "@/app/notifications/page";
import { use } from "react";

export interface NotificationTerm {
  name: string;
  term: string;
  activeUntil: Date;
}

export function NotificationsView({
  coursesPromise,
  termsPromise,
}: {
  coursesPromise: Promise<TrackerCourse[]>;
  termsPromise: Promise<NotificationTerm[]>;
}) {
  const terms = use(termsPromise);
  const courses = use(coursesPromise);

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
            key={course.courseRegister}
            course={course}
            term={terms.find((term) => term.name === course.term)}
          />
        ))}
      </div>
    </div>
  );
}

export function NotificationsViewSkeleton() {
  return (
    <div className="h-full min-h-0 overflow-y-auto">
      <div className="flex flex-col gap-6 pb-6"></div>
    </div>
  );
}
