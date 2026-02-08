"use client";

import { NotificationsSidebar } from "./NotificationsSidebar";
import { NotificationsView } from "./NotificationsView";

export function NotificationsWrapper() {
  return (
    <div className="grid h-full min-h-0 w-full grid-cols-6">
      <div className="col-span-1 min-h-0">
        <NotificationsSidebar />
      </div>
      <div className="col-span-5 min-h-0 pl-6">
        <NotificationsView />
      </div>
    </div>
  );
}
