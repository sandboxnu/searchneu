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
import { redirect } from "next/navigation";

export interface TrackerSection {
  id: number;
  crn: string;
  messageCount: number;
  messageLimit: number;
  faculty: string;
  meetingTimes: SectionTableMeetingTime[];
  campus: string;
  term: string;
  courseId: number;
  courseName: string;
  courseRegister: string;
  courseSubject: string;
  courseNumber: string;
  seatRemaining: number;
  seatCapacity: number;
  waitlistCapacity: number;
  waitlistRemaining: number;
}

export type TrackerCourse = {
  courseId: number;
  courseName: string;
  courseTitle: string;
  sections: TrackerSection[];
  unsubscribedCount: number;
  unsubscribedWithSeatsCount: number;
};

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/"); // TODO: update design when not signed in
  }

  const currentUser = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
  });

  const trackers = await db.query.trackersT.findMany({
    where: and(
      eq(trackersT.userId, session.user.id),
      isNull(trackersT.deletedAt),
    ),
  });

  const notifications = currentUser
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
        .where(eq(notificationsT.userId, currentUser.id))
        .orderBy(desc(notificationsT.sentAt))
    : [];

  const trackedSectionIds = trackers.map((t) => t.sectionId);
  const trackerMap = new Map(
    trackers.map((t) => [
      t.sectionId,
      { messageCount: t.messageCount, messageLimit: t.messageLimit },
    ]),
  );
  const sections =
    trackedSectionIds.length > 0
      ? await getSectionInfo(trackedSectionIds, trackerMap)
      : [];

  const terms = await db
    .selectDistinct({
      name: termsT.name,
      term: termsT.term,
      activeUntil: termsT.activeUntil,
    })
    .from(sectionsT)
    .innerJoin(termsT, eq(sectionsT.term, termsT.term))
    .where(inArray(sectionsT.id, trackedSectionIds));

  // Group all sections by course
  const courseMap = new Map<number, TrackerCourse>();

  for (const section of sections) {
    if (!courseMap.has(section.courseId)) {
      courseMap.set(section.courseId, {
        courseId: section.courseId,
        courseName: section.courseRegister,
        courseTitle: section.courseName,
        unsubscribedCount: 0,
        unsubscribedWithSeatsCount: 0,
        sections: [],
      });
    }
    courseMap.get(section.courseId)!.sections.push(section);
  }

  // Get unsubscribed sections available per course
  const trackedCourseIds = [...new Set(sections.map((s) => s.courseId))];

  const allSectionsForTrackedCourses =
    trackedCourseIds.length > 0
      ? await db.query.sectionsT.findMany({
          where: inArray(sectionsT.courseId, trackedCourseIds),
          columns: {
            id: true,
            courseId: true,
            seatRemaining: true,
          },
        })
      : [];

  const subscribedByCourse = new Map<number, Set<number>>();
  for (const s of sections) {
    if (!subscribedByCourse.has(s.courseId))
      subscribedByCourse.set(s.courseId, new Set());
    subscribedByCourse.get(s.courseId)!.add(s.id);
  }

  const unsubCountsByCourse = new Map<
    number,
    { unsub: number; unsubSeats: number }
  >();
  for (const section of allSectionsForTrackedCourses) {
    const subscribed =
      subscribedByCourse.get(section.courseId)?.has(section.id) ?? false;
    if (subscribed) continue;

    const currCourse = unsubCountsByCourse.get(section.courseId) ?? {
      unsub: 0,
      unsubSeats: 0,
    };
    currCourse.unsub += 1;
    if (section.seatRemaining > 0) currCourse.unsubSeats += 1;
    unsubCountsByCourse.set(section.courseId, currCourse);
  }

  for (const course of courseMap.values()) {
    const c = unsubCountsByCourse.get(course.courseId) ?? {
      unsub: 0,
      unsubSeats: 0,
    };
    course.unsubscribedCount = c.unsub;
    course.unsubscribedWithSeatsCount = c.unsubSeats;
  }

  const courses = Array.from(courseMap.values());

  return (
    <div className="bg-secondary h-full min-h-0 w-full overflow-hidden p-4 xl:px-6">
      <NotificationsWrapper
        subscribedCount={trackers.length}
        totalLimit={currentUser?.trackingLimit ?? 12}
        terms={terms}
        notifications={notifications}
        courses={courses}
      />
    </div>
  );
}
