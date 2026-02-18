import { db, savedPlansT, favoritedSchedulesT, favoritedScheduleSectionsT } from "@/lib/db";
import { verifyUser } from "@/lib/controllers/auditPlans";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

interface CreateFavoritedScheduleRequest {
  planId: number;
  name: string;
  sectionIds: number[];
}

// POST create a new favorited schedule
export async function POST(req: NextRequest) {
  const user = await verifyUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: CreateFavoritedScheduleRequest;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate required fields
  if (!body.planId || typeof body.planId !== "number") {
    return Response.json({ error: "planId is required and must be a number" }, { status: 400 });
  }

  if (!body.name) {
    return Response.json({ error: "name is required" }, { status: 400 });
  }

  if (!Array.isArray(body.sectionIds)) {
    return Response.json({ error: "sectionIds must be an array" }, { status: 400 });
  }

  try {
    // Verify the plan exists and belongs to the user
    const plan = await db.query.savedPlansT.findFirst({
      where: eq(savedPlansT.id, body.planId),
    });

    if (!plan || plan.userId !== user.id) {
      return Response.json({ error: "Plan not found" }, { status: 404 });
    }

    // Create the favorited schedule
    const [favoritedSchedule] = await db
      .insert(favoritedSchedulesT)
      .values({
        planId: body.planId,
        name: body.name,
      })
      .returning();

    // Create favorited schedule sections
    if (body.sectionIds.length > 0) {
      for (const sectionId of body.sectionIds) {
        await db.insert(favoritedScheduleSectionsT).values({
          favoritedScheduleId: favoritedSchedule.id,
          sectionId: sectionId,
        });
      }
    }

    // Fetch the complete favorited schedule with sections
    const completeFavoritedSchedule = await db.query.favoritedSchedulesT.findFirst({
      where: eq(favoritedSchedulesT.id, favoritedSchedule.id),
    });

    return Response.json(completeFavoritedSchedule, { status: 201 });
  } catch (error) {
    console.error("Error creating favorited schedule:", error);
    return Response.json(
      { error: "Failed to create favorited schedule" },
      { status: 500 },
    );
  }
}
