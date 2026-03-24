/* eslint-disable @typescript-eslint/no-explicit-any */
import { verifyUser } from "@/lib/dal/audits";
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
import { eq, and } from "drizzle-orm";
import { NextRequest } from "next/server";

interface SavePlanSection {
  sectionId: number;
  isHidden?: boolean;
}

interface SavePlanCourse {
  courseId: number;
  isLocked?: boolean;
  sections?: SavePlanSection[];
}

interface UpdatePlanRequest {
  name?: string;
  numCourses?: number;
  startTime?: number | null;
  endTime?: number | null;
  freeDays?: string[];
  includeHonorsSections?: boolean;
  includeRemoteSections?: boolean;
  hideFilledSections?: boolean;
  campus?: number | null;
  nupaths?: number[];
  courses?: SavePlanCourse[];
}

// GET a single saved plan by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await verifyUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const planId = parseInt(id);
  if (isNaN(planId)) {
    return Response.json({ error: "Invalid plan ID" }, { status: 400 });
  }

  try {
    // Get the plan
    const plan = await db.query.savedPlansT.findFirst({
      where: and(eq(savedPlansT.id, planId), eq(savedPlansT.userId, user.id)),
    });

    if (!plan) {
      return Response.json({ error: "Plan not found" }, { status: 404 });
    }

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
            eq(favoritedScheduleSectionsT.favoritedScheduleId, favSchedule.id),
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

    return Response.json({
      ...plan,
      courses: coursesWithSections,
      favoritedSchedules: favoritedSchedulesWithDetails,
    });
  } catch (error) {
    console.error("Error fetching saved plan:", error);
    return Response.json(
      { error: "Failed to fetch saved plan" },
      { status: 500 },
    );
  }
}

// PATCH update a saved plan
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await verifyUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const planId = parseInt(id);
  if (isNaN(planId)) {
    return Response.json({ error: "Invalid plan ID" }, { status: 400 });
  }

  // Check if plan exists and belongs to user
  const existingPlan = await db.query.savedPlansT.findFirst({
    where: and(eq(savedPlansT.id, planId), eq(savedPlansT.userId, user.id)),
  });

  if (!existingPlan) {
    return Response.json({ error: "Plan not found" }, { status: 404 });
  }

  let body: UpdatePlanRequest;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    // Update plan fields if provided
    const updateData: any = {
      ...(body.name && { name: body.name }),
      ...(body.numCourses && { numCourses: body.numCourses }),
      ...(body.startTime && { startTime: body.startTime }),
      ...(body.endTime && { endTime: body.endTime }),
      ...(body.freeDays && { freeDays: body.freeDays }),
      ...(body.includeHonorsSections !== undefined && {
        includeHonorsSections: body.includeHonorsSections,
      }),
      ...(body.includeRemoteSections !== undefined && {
        includeRemoteSections: body.includeRemoteSections,
      }),
      ...(body.hideFilledSections !== undefined && {
        hideFilledSections: body.hideFilledSections,
      }),
      ...(body.campus && { campus: body.campus }),
      ...(body.nupaths && { nupaths: body.nupaths }),
    };

    if (Object.keys(updateData).length > 0) {
      await db
        .update(savedPlansT)
        .set(updateData)
        .where(eq(savedPlansT.id, planId));
    }

    // If courses are provided, synchronize them and their sections
    const incomingCourses = body.courses;
    if (incomingCourses !== undefined) {
      const courses = incomingCourses;
      const existingCourses = await db
        .select({
          id: savedPlanCoursesT.id,
          courseId: savedPlanCoursesT.courseId,
        })
        .from(savedPlanCoursesT)
        .where(eq(savedPlanCoursesT.planId, planId));

      const existingCourseByCourseId = new Map(
        existingCourses.map((course) => [course.courseId, course]),
      );
      const incomingCourseIds = new Set(
        courses.map((course) => course.courseId),
      );

      // Remove courses that are no longer present in the request payload.
      for (const existingCourse of existingCourses) {
        if (!incomingCourseIds.has(existingCourse.courseId)) {
          await db
            .delete(savedPlanCoursesT)
            .where(eq(savedPlanCoursesT.id, existingCourse.id));
        }
      }

      for (const course of courses) {
        const existingCourse = existingCourseByCourseId.get(course.courseId);
        let savedPlanCourseId: number;

        if (existingCourse) {
          savedPlanCourseId = existingCourse.id;

          await db
            .update(savedPlanCoursesT)
            .set({ isLocked: course.isLocked ?? false })
            .where(eq(savedPlanCoursesT.id, savedPlanCourseId));
        } else {
          const [savedPlanCourse] = await db
            .insert(savedPlanCoursesT)
            .values({
              planId: planId,
              courseId: course.courseId,
              isLocked: course.isLocked ?? false,
            })
            .returning({ id: savedPlanCoursesT.id });

          savedPlanCourseId = savedPlanCourse.id;
        }

        const incomingSections = course.sections ?? [];
        const existingSections = await db
          .select({
            id: savedPlanSectionsT.id,
            sectionId: savedPlanSectionsT.sectionId,
          })
          .from(savedPlanSectionsT)
          .where(eq(savedPlanSectionsT.savedPlanCourseId, savedPlanCourseId));

        const existingSectionBySectionId = new Map(
          existingSections.map((section) => [section.sectionId, section]),
        );
        const incomingSectionIds = new Set(
          incomingSections.map((section) => section.sectionId),
        );

        // Remove sections that are no longer present for this course.
        for (const existingSection of existingSections) {
          if (!incomingSectionIds.has(existingSection.sectionId)) {
            await db
              .delete(savedPlanSectionsT)
              .where(eq(savedPlanSectionsT.id, existingSection.id));
          }
        }

        for (const section of incomingSections) {
          const existingSection = existingSectionBySectionId.get(
            section.sectionId,
          );

          if (existingSection) {
            await db
              .update(savedPlanSectionsT)
              .set({ isHidden: section.isHidden ?? false })
              .where(eq(savedPlanSectionsT.id, existingSection.id));
          } else {
            await db.insert(savedPlanSectionsT).values({
              savedPlanCourseId,
              sectionId: section.sectionId,
              isHidden: section.isHidden ?? false,
            });
          }
        }
      }
    }

    // Fetch the updated plan with all related data
    const updatedPlan = await db.query.savedPlansT.findFirst({
      where: eq(savedPlansT.id, planId),
      with: {
        courses: {
          with: {
            sections: true,
          },
        },
      },
    });

    return Response.json(updatedPlan);
  } catch (error) {
    console.error("Error updating saved plan:", error);
    return Response.json(
      { error: "Failed to update saved plan" },
      { status: 500 },
    );
  }
}

// DELETE a saved plan
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await verifyUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const planId = parseInt(id);
  if (isNaN(planId)) {
    return Response.json({ error: "Invalid plan ID" }, { status: 400 });
  }

  try {
    // Delete the plan (cascade will automatically delete courses and sections)
    const result = await db
      .delete(savedPlansT)
      .where(and(eq(savedPlansT.id, planId), eq(savedPlansT.userId, user.id)))
      .returning();

    if (result.length === 0) {
      return Response.json({ error: "Plan not found" }, { status: 404 });
    }

    return Response.json({ success: true, deleted: result[0] });
  } catch (error) {
    console.error("Error deleting saved plan:", error);
    return Response.json(
      { error: "Failed to delete saved plan" },
      { status: 500 },
    );
  }
}
