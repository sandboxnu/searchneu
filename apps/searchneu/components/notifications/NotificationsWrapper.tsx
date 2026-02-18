"use client";

import { NotificationsSidebar } from "./NotificationsSidebar";
import { NotificationsView } from "./NotificationsView";
import { TrackerSection } from "@/app/notifications/page";

export type NotificationsSidebarProps = {
  subscribedCount: number;
  totalLimit: number;
  termNames: string[];
  notifications: Array<{
    id: number;
    crn: string;
    courseName: string;
    courseSubject: string;
    courseNumber: string;
    sentAt: Date;
  }>;
};

export type NotificationsProps = NotificationsSidebarProps & {
  sections: TrackerSection[];
};

export function NotificationsWrapper({
  subscribedCount,
  totalLimit,
  termNames,
  notifications,
  sections,
}: NotificationsProps) {
  return (
    <div className="grid h-full min-h-0 w-full grid-cols-6">
      <div className="col-span-1 min-h-0">
        <NotificationsSidebar
          subscribedCount={subscribedCount}
          totalLimit={totalLimit}
          termNames={termNames}
          notifications={notifications}
        />
      </div>
      <div className="col-span-5 min-h-0 pl-6">
        <NotificationsView sections={sections} />
      </div>
    </div>
  );
}
