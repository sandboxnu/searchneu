import {
  NotificationCountCardSkeleton,
  NotificationTermCardSkeleton,
  PreviousNotificationsCardSkeleton,
} from "@/components/notifications/NotificationsSidebar";

export default function Loading() {
  return (
    <div className="bg-secondary h-full min-h-0 w-full overflow-hidden p-4 xl:px-6">
      <div className="grid h-full min-h-0 w-full grid-cols-6">
        <div className="col-span-1 min-h-0">
          <div className="flex h-full min-h-0 flex-col gap-2 pb-4">
            <NotificationTermCardSkeleton />
            <NotificationCountCardSkeleton />
            <PreviousNotificationsCardSkeleton />
          </div>
        </div>
        <div className="col-span-5 min-h-0 pl-6">
          {/* <Suspense fallback={<div>loading...</div>}> */}
          {/*   <NotificationsView courses={courses} termsPromise={terms} /> */}
          {/* </Suspense> */}
        </div>
      </div>
    </div>
  );
}
