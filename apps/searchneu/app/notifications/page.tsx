import { SectionTableMeetingTime } from "@/components/catalog/SectionTable";
import { NotificationsWrapper } from "@/components/notifications/NotificationsWrapper";
import {
  db,
  trackersT,
  coursesT,
  sectionsT,
  subjectsT,
  termsT,
  user,
} from "@/lib/db";
import { notificationsT } from "@sneu/db/schema";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { getSectionInfo } from "@/lib/controllers/getTrackers";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

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
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) {
    const currentUser = await db.query.user.findFirst({
      where: eq(user.id, session.user.id),
    });

    const trackers = await db.query.trackersT.findMany({
      where: and(
        eq(trackersT.userId, session.user.id),
        isNull(trackersT.deletedAt),
      ),
    });

    const trackerIds = trackers.map((t) => t.id);
    const notifications =
      trackerIds.length > 0
        ? await db
            .select({
              id: notificationsT.id,
              crn: sectionsT.crn,
              courseName: coursesT.name,
              courseSubject: subjectsT.code,
              courseNumber: coursesT.courseNumber,
              sentAt: notificationsT.sentAt,
            })
            .from(notificationsT)
            .innerJoin(trackersT, eq(notificationsT.trackerId, trackersT.id))
            .innerJoin(sectionsT, eq(trackersT.sectionId, sectionsT.id))
            .innerJoin(coursesT, eq(sectionsT.courseId, coursesT.id))
            .innerJoin(subjectsT, eq(coursesT.subject, subjectsT.id))
            .where(inArray(notificationsT.trackerId, trackerIds))
            .orderBy(desc(notificationsT.sentAt))
        : [];
    const trackedSectionIds = trackers.map((t) => t.sectionId);
    const sections =
      trackedSectionIds.length > 0
        ? await getSectionInfo(trackedSectionIds)
        : [];
    const terms = await db
      .selectDistinct({ name: termsT.name })
      .from(sectionsT)
      .innerJoin(termsT, eq(sectionsT.term, termsT.term))
      .where(inArray(sectionsT.id, trackedSectionIds));

    return (
      <div className="bg-secondary h-full min-h-0 w-full overflow-hidden px-4 xl:px-6">
        <NotificationsWrapper
          subscribedCount={trackers.length}
          totalLimit={currentUser?.trackingLimit ?? 12}
          termNames={terms.map((term) => term.name)}
          notifications={notifications}
          sections={sections}
        />
      </div>
    );
  }
}
