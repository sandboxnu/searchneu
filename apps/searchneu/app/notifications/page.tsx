import { SectionTableMeetingTime } from "@/components/catalog/SectionTable";
import { NotificationsWrapper } from "@/components/notifications/NotificationsWrapper";
import { db } from "@/lib/db";
import { notificationsT } from "@sneu/db/schema";
import { getTrackedSections } from "../catalog/[term]/[course]/page";
import { inArray } from "drizzle-orm";
import { getSectionInfo } from "@/lib/controllers/getTrackers";

export interface TrackerSection {
  id: number;
  crn: string;
  faculty: string;
  meetingTimes: SectionTableMeetingTime[];
  campus: string;
  seatRemaining: number;
  seatCapacity: number;
  waitlistCapacity: number;
  waitlistRemaining: number;
}

export default async function Page() {
  const trackedSections = await getTrackedSections();
  const notifications = await db.query.notificationsT.findMany({
    where: inArray(notificationsT.trackerId, trackedSections),
  });
  console.log("Tracked sections", trackedSections);
  console.log("Notifcaitons", notifications);

  const sections = await getSectionInfo(trackedSections);
  console.log("SECTION", sections);
  console.log("SECTION FIRST", sections);

  return (
    <div className="bg-secondary h-full min-h-0 w-full overflow-hidden px-4 xl:px-6">
      <NotificationsWrapper />
    </div>
  );
}
