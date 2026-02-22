"use client";

import { TrackerCourse } from "@/app/notifications/page";
import {
  NotificationsSidebar,
  NotificationsSidebarProps,
} from "./NotificationsSidebar";
import { NotificationsView } from "./NotificationsView";

export type NotificationsProps = NotificationsSidebarProps & {
  courses: TrackerCourse[];
};

export function NotificationsWrapper({
  subscribedCount,
  totalLimit,
  terms,
  notifications,
  courses,
}: NotificationsProps) {
  return (
    <div className="grid h-full min-h-0 w-full grid-cols-6">
      <div className="col-span-1 min-h-0">
        <NotificationsSidebar
          subscribedCount={subscribedCount}
          totalLimit={totalLimit}
          terms={terms}
          notifications={notifications}
        />
      </div>
      <div className="col-span-5 min-h-0 pl-6">
        <NotificationsView courses={courses} terms={terms} />
      </div>
    </div>
  );
}
