import { db } from "@/db";
import { TooltipProvider } from "../ui/tooltip";
import { Section, SectionCard } from "./SectionCard";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/auth/utils";
import { config } from "@/lib/auth/auth";
import { and, eq, isNull } from "drizzle-orm";
import { trackersT, usersT, sectionsT } from "@/db/schema";

async function getTrackedSections() {
  const cookieJar = await cookies();
  const guid = await verifyJWT(cookieJar.get(config.cookieName)?.value ?? "");
  if (!guid) {
    return;
  }

  const user = await db.query.usersT.findFirst({
    where: eq(usersT.guid, guid),
  });
  if (!user) {
    return;
  }

  // PERF: add class to trackers to select directly
  // PERF: add guid to trackers (and remove the whole stupid user id thing) to select directly
  const trackedSections = await db.query.trackersT.findMany({
    where: and(eq(trackersT.userId, user.id), isNull(trackersT.deletedAt)),
  });

  return trackedSections.map((t) => t.sectionId);
}

export async function SectionTable({ courseId }: { courseId: number }) {
  const sections = await db
    .select({
      id: sectionsT.id,
      crn: sectionsT.crn,
      campus: sectionsT.campus,
      seatCapacity: sectionsT.seatCapacity,
      seatRemaining: sectionsT.seatRemaining,
      waitlistCapacity: sectionsT.waitlistCapacity,
      waitlistRemaining: sectionsT.waitlistRemaining,
      meetingTimes: sectionsT.meetingTimes,
      faculty: sectionsT.faculty,
      honors: sectionsT.honors,
    })
    .from(sectionsT)
    .where(eq(sectionsT.courseId, courseId));

  const totalSeats = sections.reduce((agg, s) => agg + s.seatCapacity, 0);
  const seatsRemaining = sections.reduce((agg, s) => agg + s.seatRemaining, 0);

  const trackedSections = await getTrackedSections();

  return (
    <TooltipProvider delayDuration={700}>
      <div className="bg-neu2 flex w-full flex-col gap-1 rounded-lg p-1">
        <p className="text-neu6 w-full text-center text-sm">
          {sections.length} Sections | {totalSeats} Seat
          {totalSeats !== 1 && "s"} | {seatsRemaining} Seat
          {seatsRemaining !== 1 && "s"} Remaining
        </p>

        {sections.map((section, i) => (
          <SectionCard
            key={i}
            section={section as Section}
            initalTracked={trackedSections?.includes(section.id) ?? false}
          />
        ))}
      </div>
    </TooltipProvider>
  );
}
