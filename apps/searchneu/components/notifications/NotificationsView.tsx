"use client";

import {
  NotificationsCourseCard,
  NotificationCourseCardEmpty,
  NotificationCourseCardSkeleton,
} from "./NotificationsCourseCard";
import { type TrackerCourse } from "@/app/notifications/page";
import { use } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

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

  const isEmpty = courses.length == 0;
  return (
    <div
      className={`h-full min-h-0 ${isEmpty ? "overflow-hidden" : "overflow-y-auto"}`}
    >
      <div className="flex flex-col gap-6 pb-6">
        {isEmpty ? (
          <NotificationViewEmpty signedIn />
        ) : (
          courses.map((course) => (
            <NotificationsCourseCard
              key={course.courseRegister}
              course={course}
              term={terms.find((term) => term.term === course.term)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export function NotificationsViewSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <NotificationCourseCardSkeleton />
      <NotificationCourseCardSkeleton />
      <NotificationCourseCardSkeleton />
    </div>
  );
}

export function NotificationViewEmpty({ signedIn }: { signedIn?: boolean }) {
  return (
    <div className="flex flex-col gap-5">
      <NotificationCourseCardEmpty className="opacity-[0.7] blur-[2px]" />
      <div className="relative">
        <NotificationCourseCardEmpty className="opacity-[0.55] blur-[3px]" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <span className="text-neu8 text-lg font-medium">
            No notification trackers yet
          </span>
          <span className="text-neu5 w-60 text-center text-sm font-medium">
            {signedIn
              ? "Start by toggling on notifications of sections through the catalog."
              : "Start by signing in and toggling notifications."}
          </span>
          <Link
            href="/catalog"
            className="bg-neu1 text-neu6 flex items-center gap-2 rounded-3xl border px-18 py-2 text-sm"
          >
            Go to catalog
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
      <NotificationCourseCardEmpty className="opacity-[0.4] blur-[4px]" />
    </div>
  );
}
