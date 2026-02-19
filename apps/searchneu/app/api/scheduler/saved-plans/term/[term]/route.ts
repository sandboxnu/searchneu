import {
  db,
  savedPlansT,
  savedPlanCoursesT,
  savedPlanSectionsT,
  favoritedSchedulesT,
  favoritedScheduleSectionsT,
  sectionsT,
  coursesT,
  subjectsT,
  meetingTimesT,
} from "@/lib/db";
import { verifyUser } from "@/lib/controllers/auditPlans";
import { eq, and, desc } from "drizzle-orm";
import { NextRequest } from "next/server";

// GET all saved plans for a user in a specific term
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ term: string }> },
) {
  const user = await verifyUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { term } = await params;

  try {
    // Get all saved plans for this user and term, ordered by updatedAt DESC
    const plans = await db
      .select()
      .from(savedPlansT)
      .where(and(eq(savedPlansT.userId, user.id), eq(savedPlansT.term, term)))
      .orderBy(desc(savedPlansT.updatedAt));

    // For each plan, get courses, sections, and favorited schedules
    const plansWithDetails = await Promise.all(
      plans.map(async (plan) => {
        // Get courses for this plan with course details
        const planCourses = await db
          .select({
            courseId: savedPlanCoursesT.courseId,
            isLocked: savedPlanCoursesT.isLocked,
            courseSubject: subjectsT.code,
            courseNumber: coursesT.courseNumber,
            courseName: coursesT.name,
          })
          .from(savedPlanCoursesT)
          .innerJoin(coursesT, eq(savedPlanCoursesT.courseId, coursesT.id))
          .innerJoin(subjectsT, eq(coursesT.subject, subjectsT.id))
          .where(eq(savedPlanCoursesT.planId, plan.id));

        // For each course, get its sections
        const coursesWithSections = await Promise.all(
          planCourses.map(async (course) => {
            const sections = await db
              .select({
                sectionId: savedPlanSectionsT.sectionId,
                isHidden: savedPlanSectionsT.isHidden,
              })
              .from(savedPlanSectionsT)
              .innerJoin(
                savedPlanCoursesT,
                eq(savedPlanSectionsT.savedPlanCourseId, savedPlanCoursesT.id),
              )
              .where(
                and(
                  eq(savedPlanCoursesT.planId, plan.id),
                  eq(savedPlanCoursesT.courseId, course.courseId),
                ),
              );

            return {
              courseId: course.courseId,
              isLocked: course.isLocked,
              courseSubject: course.courseSubject,
              courseNumber: course.courseNumber,
              courseName: course.courseName,
              sections,
            };
          }),
        );

        // Get favorited schedules for this plan
        const favSchedules = await db
          .select()
          .from(favoritedSchedulesT)
          .where(eq(favoritedSchedulesT.planId, plan.id));

        // For each favorited schedule, get the detailed section info
        const favoritedSchedulesWithDetails = await Promise.all(
          favSchedules.map(async (favSchedule) => {
            // Get all sections for this favorited schedule with course details
            const favoritedSections = await db
              .select({
                sectionId: sectionsT.id,
                courseSubject: subjectsT.code,
                courseNumber: coursesT.courseNumber,
              })
              .from(favoritedScheduleSectionsT)
              .innerJoin(
                sectionsT,
                eq(favoritedScheduleSectionsT.sectionId, sectionsT.id),
              )
              .innerJoin(coursesT, eq(sectionsT.courseId, coursesT.id))
              .innerJoin(subjectsT, eq(coursesT.subject, subjectsT.id))
              .where(
                eq(
                  favoritedScheduleSectionsT.favoritedScheduleId,
                  favSchedule.id,
                ),
              );

            // Get meeting times for each section
            const sectionsWithMeetings = await Promise.all(
              favoritedSections.map(async (section) => {
                const meetingTimes = await db
                  .select({
                    id: meetingTimesT.id,
                    sectionId: meetingTimesT.sectionId,
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
              }),
            );

            return {
              id: favSchedule.id,
              name: favSchedule.name,
              createdAt: favSchedule.createdAt,
              updatedAt: favSchedule.updatedAt,
              sections: sectionsWithMeetings,
            };
          }),
        );

        return {
          ...plan,
          courses: coursesWithSections,
          favoritedSchedules: favoritedSchedulesWithDetails,
        };
      }),
    );

    return Response.json(plansWithDetails);
  } catch (error) {
    console.error("Error getting saved plans:", error);
    return Response.json(
      { error: "Failed to get saved plans" },
      { status: 500 },
    );
  }
}
