import { CreatePlanInput } from "@/app/graduate/lib/api-dtos";
import { db, auditPlansT } from "@/lib/db";

export async function createAuditPlan(createPlanInput: CreatePlanInput, userId: number ) {
  const { name, schedule, major, minor, concentration, catalogYear } = createPlanInput;

  /* TBD:
  // if the plan has a major, then validate the major, year, concentration
  if (majorName) {
    const major = this.majorService.findByMajorAndYear(
      majorName,
      catalogYear
    );
    if (!major) {
      this.logger.debug(
        {
          message: "Attempting to create a plan with an unsupported major.",
          majorName,
          catalogYear,
        },
        this.formatPlanServiceCtx("create")
      );

      return null;
    }

    const isValidConcentrationForMajor =
      this.majorService.isValidConcentrationForMajor(
        majorName,
        catalogYear,
        concentrationName
      );

    if (!isValidConcentrationForMajor) {
      this.logger.debug(
        {
          message:
            "Attempting to create a plan with an unsupported concentration.",
          majorName,
          catalogYear,
        },
        this.formatPlanServiceCtx("create")
      );

      return null;
    }
   */

  const plan = await db
    .insert(auditPlansT)
    .values({
        name,
        userId,
        schedule,
        major,
        minor,
        concentration,
        catalogYear
    })
    .returning();

  return plan;
}