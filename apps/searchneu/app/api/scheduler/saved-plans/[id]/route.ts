/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  db,
  savedPlansT,
  savedPlanCoursesT,
  savedPlanSectionsT,
} from "@/lib/db";
import { verifyUser } from "@/lib/controllers/auditPlans";
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
  startTime?: number | null;
  endTime?: number | null;
  freeDays?: string[];
  includeHonorsSections?: boolean;
  includeRemoteSections?: boolean;
  hideFilledSections?: boolean;
  campuses?: number | null;
  nupaths?: number[];
  courses?: SavePlanCourse[];
}

// PATCH update an existing saved plan
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
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.startTime !== undefined) updateData.startTime = body.startTime;
    if (body.endTime !== undefined) updateData.endTime = body.endTime;
    if (body.freeDays !== undefined) updateData.freeDays = body.freeDays;
    if (body.includeHonorsSections !== undefined)
      updateData.includeHonorsSections = body.includeHonorsSections;
    if (body.includeRemoteSections !== undefined)
      updateData.includeRemoteSections = body.includeRemoteSections;
    if (body.hideFilledSections !== undefined)
      updateData.hideFilledSections = body.hideFilledSections;
    if (body.campuses !== undefined) updateData.campuses = body.campuses;
    if (body.nupaths !== undefined) updateData.nupaths = body.nupaths;

    if (Object.keys(updateData).length > 0) {
      await db
        .update(savedPlansT)
        .set(updateData)
        .where(eq(savedPlansT.id, planId));
    }

    // If courses are provided, replace all existing courses
    if (body.courses !== undefined) {
      // Delete all existing courses (cascade will delete sections)
      await db
        .delete(savedPlanCoursesT)
        .where(eq(savedPlanCoursesT.planId, planId));

      // Insert new courses
      if (body.courses.length > 0) {
        for (const course of body.courses) {
          const [savedPlanCourse] = await db
            .insert(savedPlanCoursesT)
            .values({
              planId: planId,
              courseId: course.courseId,
              isLocked: course.isLocked ?? false,
            })
            .returning();

          // Insert sections for this course
          if (course.sections && course.sections.length > 0) {
            for (const section of course.sections) {
              await db.insert(savedPlanSectionsT).values({
                savedPlanCourseId: savedPlanCourse.id,
                sectionId: section.sectionId,
                isHidden: section.isHidden ?? false,
              });
            }
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
