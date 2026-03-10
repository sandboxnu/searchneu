import {
  NotificationCountCardSkeleton,
  NotificationTermCardSkeleton,
  PastNotificationsSectionSkeleton,
} from "@/components/notifications/NotificationsSidebar";
import { NotificationsViewSkeleton } from "@/components/notifications/NotificationsView";

export default function Loading() {
  return (
    <div className="bg-secondary h-full min-h-0 w-full overflow-hidden p-4 xl:px-6">
      <div className="grid h-full min-h-0 w-full grid-cols-6">
        <div className="col-span-1 min-h-0">
          <div className="flex h-full min-h-0 flex-col gap-2 pb-4">
            <NotificationTermCardSkeleton />
            <NotificationCountCardSkeleton />
            <PastNotificationsSectionSkeleton />
          </div>
        </div>
        <div className="col-span-5 min-h-0 pl-6">
          <NotificationsViewSkeleton />
        </div>
      </div>
    </div>
  );
}
