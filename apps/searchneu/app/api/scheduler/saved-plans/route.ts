import { verifyUser } from "@/lib/dal/audits";
import {
  db,
  savedPlansT,
  savedPlanCoursesT,
  savedPlanSectionsT,
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

interface SavePlanRequest {
  term: string;
  name: string;
  numCourses?: number;
  startTime?: number | undefined;
  endTime?: number | undefined;
  freeDays?: string[];
  includeHonorsSections?: boolean;
  includeRemoteSections?: boolean;
  hideFilledSections?: boolean;
  campus?: number | undefined;
  nupaths?: number[];
  courses?: SavePlanCourse[];
}

// POST create a new saved plan with courses and sections
export async function POST(req: NextRequest) {
  const user = await verifyUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: SavePlanRequest;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate required fields
  if (!body.term) {
    return Response.json({ error: "term is required" }, { status: 400 });
  }

  try {
    // Auto-generate name if not provided
    let planName = body.name;
    if (!planName) {
      const existingPlans = await db
        .select()
        .from(savedPlansT)
        .where(
          and(eq(savedPlansT.userId, user.id), eq(savedPlansT.term, body.term)),
        );
      planName = `Plan ${existingPlans.length + 1}`;
    }

    // Create the saved plan
    const [savedPlan] = await db
      .insert(savedPlansT)
      .values({
        userId: user.id,
        term: body.term,
        name: planName,
        startTime: body.startTime,
        endTime: body.endTime,
        freeDays: body.freeDays,
        includeHonorsSections: body.includeHonorsSections,
        includeRemoteSections: body.includeRemoteSections,
        hideFilledSections: body.hideFilledSections,
        campus: body.campus,
        nupaths: body.nupaths,
        numCourses: body.numCourses,
      })
      .returning();

    // If courses are provided, create them and their sections
    if (body.courses && body.courses.length > 0) {
      for (const course of body.courses) {
        // Create the saved plan course
        const [savedPlanCourse] = await db
          .insert(savedPlanCoursesT)
          .values({
            planId: savedPlan.id,
            courseId: course.courseId,
            isLocked: course.isLocked,
          })
          .returning();

        // If sections are provided for this course, create them
        if (course.sections && course.sections.length > 0) {
          for (const section of course.sections) {
            await db.insert(savedPlanSectionsT).values({
              savedPlanCourseId: savedPlanCourse.id,
              sectionId: section.sectionId,
              isHidden: section.isHidden,
            });
          }
        }
      }
    }

    // Fetch the complete saved plan with all related data
    const completePlan = await db.query.savedPlansT.findFirst({
      where: eq(savedPlansT.id, savedPlan.id),
      with: {
        courses: {
          with: {
            sections: true,
          },
        },
      },
    });

    return Response.json(completePlan, { status: 201 });
  } catch (error) {
    console.error("Error saving plan:", error);
    return Response.json({ error: "Failed to save plan" }, { status: 500 });
  }
}
