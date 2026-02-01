import {
  CreateAuditPlanInput,
  UpdateAuditPlanInput,
} from "@/app/graduate/lib/api-dtos";
import { db, auditPlansT, usersT } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { getGuid } from "@/lib/auth/utils";

export async function verifyUser() {
  const guid = await getGuid();

  if (!guid) {
    return null;
  }

  const users = await db
    .select({
      id: usersT.id
    })
    .from(usersT)
    .where(eq(usersT.guid, guid));
  const user = users[0];

  if (!user) {
    return null;
  }

  return user;
}

export async function getAuditPlan(id: number, userId: number) {

  const auditPlan = await db.query.auditPlansT.findFirst({
    where: and(eq(auditPlansT.id, id), eq(auditPlansT.userId, userId))
  });

  return auditPlan;
}

export async function createAuditPlan(createAuditPlanInput: CreateAuditPlanInput, userId: number ) {
  const { name, schedule, major, minor, concentration, catalogYear } = createAuditPlanInput;

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

  return plan[0];
}

export async function updateAuditPlan(updateAuditPlanInput: UpdateAuditPlanInput, id: number, userId: number) {
  const { major: newMajorName,
    minor: newMinorName,
    catalogYear: newCatalogYear,
    concentration: newConcentrationName,
    schedule: newSchedule,
    name: newName, } = updateAuditPlanInput;

  const currentAuditPlan = await getAuditPlan(id, userId);

  if (!currentAuditPlan) {
    return null;
  }

  /**
   * If the major is being updated, all the fields related to the major
   * (catalog year, concentration) are updated.
   *
   * TODO: Fix the DTO issue that populates undefined values for fields not
   * present. https://github.com/sandboxnu/graduatenu/issues/533
   */
    // It is necessary for this to be OR because we need to run an update if any of these are true.
  const isMajorInfoUpdate =
      newMajorName || newCatalogYear || newConcentrationName;

  /** Wipe Major => Remove existing major from the plan. */
  const isWipeMajorUpdate =
    !newMajorName &&
    !newCatalogYear &&
    !newConcentrationName &&
    currentAuditPlan.major;

  /** Wipe Minor => Remove existing minor from the plan. */
  const isWipeMinorUpdate = newMinorName === "" && currentAuditPlan.minor;

  const isMinorInfoUpdate = newMinorName || newCatalogYear;

  const isScheduleUpdate = newSchedule && !isMajorInfoUpdate;


  // TBD
  // if (
  //   !(
  //     isWipeMajorUpdate ||
  //     isMajorInfoUpdate ||
  //     isMinorInfoUpdate ||
  //     isScheduleUpdate ||
  //     newName
  //   )
  // ) {
  //   this.logger.debug(
  //     { message: "Either update all major fields or only the schedule", id },
  //     this.formatPlanServiceCtx("update")
  //   );
  // }
  //
  // // validate the major info if major is being updated
  // if (isMajorInfoUpdate) {
  //   // validate the major, year, concentration pair if either one is being update
  //   const major = this.majorService.findByMajorAndYear(
  //     newMajorName,
  //     newCatalogYear
  //   );
  //
  //   if (!major) {
  //     this.logger.debug(
  //       {
  //         message: "Attempting to update a plan with an unsupported major.",
  //         newMajorName,
  //         newCatalogYear,
  //       },
  //       this.formatPlanServiceCtx("update")
  //     );
  //     throw new InvalidMajor();
  //   }
  //
  //   const isValidMajorCatalogueYear = this.majorService.isValidCatalogueYear(
  //     newMajorName,
  //     newCatalogYear,
  //     newConcentrationName
  //   );
  //
  //   if (!isValidMajorCatalogueYear) {
  //     this.logger.debug(
  //       {
  //         message: "Attempting to add plan with an invalid catalogue year",
  //         newMajorName,
  //         newCatalogYear,
  //       },
  //       this.formatPlanServiceCtx("update")
  //     );
  //
  //     throw new InvalidCatalogYear();
  //     return null;
  //   }
  //
  //   const isValidConcentrationForMajor =
  //     this.majorService.isValidConcentrationForMajor(
  //       newMajorName,
  //       newCatalogYear,
  //       newConcentrationName
  //     );
  //
  //   if (!isValidConcentrationForMajor) {
  //     this.logger.debug(
  //       {
  //         message:
  //           "Attempting to update a plan with an unsupported concentration.",
  //         newMajorName,
  //         newCatalogYear,
  //       },
  //       this.formatPlanServiceCtx("update")
  //     );
  //
  //     throw new InvalidConcentration();
  //   }
  // }
  //
  /**
   * If some fields are not being updated, we use previous values. This is
   * needed cause we fields not being updated are still in the DTO for some
   * reason. Hence, if we simply update the plan with the DTO we override the
   * fields not being updated with undefined in the database, essentially
   * wiping it out.
   *
   * This should go away with TODO: https://github.com/sandboxnu/graduatenu/issues/533
   */
  let name = currentAuditPlan.name;
  let schedule = currentAuditPlan.schedule;
  let major = isWipeMajorUpdate ? undefined : currentAuditPlan.major;
  let minor = isWipeMinorUpdate ? undefined : currentAuditPlan.minor;
  let catalogYear = isWipeMajorUpdate ? undefined : currentAuditPlan.catalogYear;
  let concentration = isWipeMajorUpdate
    ? undefined
    : currentAuditPlan.concentration;

  if (newSchedule) {
    schedule = newSchedule;
  }

  if (newName) {
    name = newName;
  }

  if (newMajorName) {
    major = newMajorName;
    catalogYear = newCatalogYear;
    concentration = newConcentrationName;
  }

  if (newMinorName) {
    minor = newMinorName;
  }

  if (newMinorName === null) {
    minor = null;
  }

  const newPlan = {
    name,
    major,
    minor,
    catalogYear,
    concentration,
    schedule,
  };

  const updatedAuditPlan = await db
    .update(auditPlansT)
    .set({ name: newPlan.name,
      schedule: newPlan.schedule,
      major: newPlan.major,
      minor: newPlan.minor,
      concentration: newPlan.concentration,
      catalogYear: newPlan.catalogYear })
    .where(and(eq(auditPlansT.id, id), eq(auditPlansT.userId, userId)))
    .returning();

  return updatedAuditPlan[0];
}

export async function deleteAuditPlan(id: number, userId: number) {
  const deleteResult = await db.delete(auditPlansT)
    .where(and(eq(auditPlansT.id, id), eq(auditPlansT.userId, userId)))
    .returning();

  return deleteResult[0] || null;
}