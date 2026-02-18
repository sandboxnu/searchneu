import { db, favoritedSchedulesT, favoritedScheduleSectionsT, savedPlansT, sectionsT, coursesT, subjectsT, meetingTimesT } from "@/lib/db";
import { verifyUser } from "@/lib/controllers/auditPlans";
import { eq, and } from "drizzle-orm";
import { NextRequest } from "next/server";

// GET a favorited schedule with detailed section information
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const favoritedScheduleId = parseInt(id);
  if (isNaN(favoritedScheduleId)) {
    return Response.json({ error: "Favorited schedule ID is not a number" }, { status: 400 });
  }

  try {
    // Get the favorited schedule and verify ownership
    const favoritedSchedule = await db.query.favoritedSchedulesT.findFirst({
      where: eq(favoritedSchedulesT.id, favoritedScheduleId),
    });

    if (!favoritedSchedule) {
      return Response.json({ error: "Favorited schedule not found" }, { status: 404 });
    }

    // Verify the associated plan belongs to the user
    const plan = await db.query.savedPlansT.findFirst({
      where: eq(savedPlansT.id, favoritedSchedule.planId),
    });

    if (!plan || plan.userId !== user.id) {
      return Response.json({ error: "Favorited schedule not found" }, { status: 404 });
    }

    // Get all sections for this favorited schedule with course details
    const favoritedSections = await db
      .select({
        sectionId: sectionsT.id,
        courseSubject: subjectsT.code,
        courseNumber: coursesT.courseNumber,
      })
      .from(favoritedScheduleSectionsT)
      .innerJoin(sectionsT, eq(favoritedScheduleSectionsT.sectionId, sectionsT.id))
      .innerJoin(coursesT, eq(sectionsT.courseId, coursesT.id))
      .innerJoin(subjectsT, eq(coursesT.subject, subjectsT.id))
      .where(eq(favoritedScheduleSectionsT.favoritedScheduleId, favoritedScheduleId));

    // Get meeting times for each section
    const sectionsWithMeetings = await Promise.all(
      favoritedSections.map(async (section) => {
        const meetingTimes = await db
          .select({
            days: meetingTimesT.days,
            startTime: meetingTimesT.startTime,
            endTime: meetingTimesT.endTime,
          })
          .from(meetingTimesT)
          .where(eq(meetingTimesT.sectionId, section.sectionId));

        return {
          sectionId: section.sectionId,
          courseSubject: section.courseSubject,
          courseNumber: section.courseNumber,
          meetingTimes,
        };
      })
    );

    return Response.json({
      name: favoritedSchedule.name,
      sections: sectionsWithMeetings,
    });
  } catch (error) {
    console.error("Error getting favorited schedule:", error);
    return Response.json(
      { error: "Failed to get favorited schedule" },
      { status: 500 },
    );
  }
}

// DELETE a favorited schedule
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const favoritedScheduleId = parseInt(id);
  if (isNaN(favoritedScheduleId)) {
    return Response.json({ error: "Favorited schedule ID is not a number" }, { status: 400 });
  }

  try {
    // Get the favorited schedule to check ownership via plan
    const favoritedSchedule = await db.query.favoritedSchedulesT.findFirst({
      where: eq(favoritedSchedulesT.id, favoritedScheduleId),
    });

    if (!favoritedSchedule) {
      return Response.json({ error: "Favorited schedule not found" }, { status: 404 });
    }

    // Verify the associated plan belongs to the user
    const plan = await db.query.savedPlansT.findFirst({
      where: eq(savedPlansT.id, favoritedSchedule.planId),
    });

    if (!plan || plan.userId !== user.id) {
      return Response.json({ error: "Favorited schedule not found" }, { status: 404 });
    }

    // Delete the favorited schedule (cascade will delete sections)
    const result = await db
      .delete(favoritedSchedulesT)
      .where(eq(favoritedSchedulesT.id, favoritedScheduleId))
      .returning();

    return Response.json({ success: true, deleted: result[0] });
  } catch (error) {
    console.error("Error deleting favorited schedule:", error);
    return Response.json(
      { error: "Failed to delete favorited schedule" },
      { status: 500 },
    );
  }
}
