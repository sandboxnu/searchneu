import {
  CreateAuditPlanInput,
  UpdateAuditPlanInput,
} from "../graduate/api-dtos";
import { db, user as usersT, auditPlansT } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import {
  getByMajorAndYear,
  getByMinorAndYear,
  isMajorInYear,
  isValidConcentrationForMajor,
} from "./majors";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Verifies the current user from their JWT token and returns their user data.
 *
 * @returns the authenticated user object with their ID, or null if not authenticated
 */
export async function verifyUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

  const users = await db
    .select({
      id: usersT.id,
    })
    .from(usersT)
    .where(eq(usersT.id, session.user.id));

  if (users.length === 0) {
    return null;
  }

  const user = users[0];

  if (!user) {
    return null;
  }

  return user;
}

/**
 * Retrieves the given audit plan for a specific user
 *
 * @param id the audit plan's ID
 * @param userId the ID of the user requesting the audit plan
 *
 * @returns the audit plan if found and belongs to the user, null otherwise
 */
export async function getAuditPlan(id: number, userId: string) {
  const auditPlan = await db.query.auditPlansT.findFirst({
    where: and(eq(auditPlansT.id, id), eq(auditPlansT.userId, userId)),
  });

  return auditPlan;
}

/**
 * Creates a new audit plan for a user with validation of major, minor, and concentration
 *
 * @param createAuditPlanInput the audit plan data: name, schedule, major, minor, concentration, and catalog year
 * @param userId the ID of the user creating the plan
 *
 * @returns the created audit plan object, or null if validation/creation fails
 */
export async function createAuditPlan(
  createAuditPlanInput: CreateAuditPlanInput,
  userId: string,
) {
  const { name, schedule, majors, minors, concentration, catalogYear } =
    createAuditPlanInput;

  if (majors) {
    const majorName = await getByMajorAndYear(majors, catalogYear ?? 0);

    if (!majorName) {
      console.debug(
        `Attempting to create a plan with an unsupported major: ${majorName}, ${catalogYear}`,
      );
      return null;
    }
  }

  if (majors && catalogYear) {
    const isValidYear = await isMajorInYear(majors, catalogYear);

    if (!isValidYear) {
      console.debug("Attempting to create plan with invalid catalog year", {
        majors,
        catalogYear,
      });
      return null;
    }

    const isValidConcentration = await isValidConcentrationForMajor(
      majors,
      catalogYear,
      concentration ?? "",
    );

    if (!isValidConcentration) {
      console.debug("Attempting to create plan with invalid concentration", {
        majors,
        catalogYear,
        concentration,
      });
      return null;
    }
  }

  if (minors) {
    const minorName = await getByMinorAndYear(minors, catalogYear ?? 0);

    if (!minorName) {
      console.debug(
        `Attempting to create a plan with an unsupported minor: ${minorName}, ${catalogYear}`,
      );
      return null;
    }
  }

  const plan = await db
    .insert(auditPlansT)
    .values({
      name,
      userId,
      schedule,
      majors,
      minors,
      concentration,
      catalogYear,
    })
    .returning();

  if (plan.length === 0) {
    return null;
  }

  return plan[0];
}

/**
 * Updates an existing audit plan for a user with respective validation depending
 * on what fields are being updated
 *
 * @param updateAuditPlanInput the update plan data: name, schedule, major,
 * minor, concentration, catalogYear
 * @param id the ID of the plan to be updated
 * @param userId the ID of the user updating the plan
 *
 * @returns the updated audit plan object or null if validation/creation fails
 */
export async function updateAuditPlan(
  updateAuditPlanInput: UpdateAuditPlanInput,
  id: number,
  userId: string,
) {
  const {
    majors: newMajors,
    minors: newMinors,
    catalogYear: newCatalogYear,
    concentration: newConcentrationName,
    schedule: newSchedule,
    name: newName,
  } = updateAuditPlanInput;

  const currentAuditPlan = await getAuditPlan(id, userId);

  if (!currentAuditPlan) {
    return null;
  }

  const isMajorInfoUpdate = newMajors || newCatalogYear || newConcentrationName;

  /** Wipe Major => Remove existing major from the plan. */
  const isWipeMajorUpdate =
    !newMajors &&
    !newCatalogYear &&
    !newConcentrationName &&
    currentAuditPlan.majors?.[0];

  /** Wipe Minor => Remove existing minor from the plan. */
  const isWipeMinorUpdate =
    (newMinors === null || newMinors === undefined || newMinors.length === 0) &&
    currentAuditPlan.minors &&
    currentAuditPlan.minors.length > 0;

  const isMinorInfoUpdate =
    (newMinors && newMinors.length > 0) || newCatalogYear;

  const isScheduleUpdate = newSchedule && !isMajorInfoUpdate;

  if (
    !(
      isWipeMajorUpdate ||
      isMajorInfoUpdate ||
      isMinorInfoUpdate ||
      isScheduleUpdate ||
      newName
    )
  ) {
    console.debug({
      message: "Either update all major fields or only the schedule",
      id,
    });
  }

  // validate the major info if major is being updated
  if (isMajorInfoUpdate) {
    const majorToValidate = newMajors || currentAuditPlan.majors;
    const yearToValidate = newCatalogYear || currentAuditPlan.catalogYear;
    const concentrationToValidate =
      newConcentrationName ?? currentAuditPlan.concentration;

    if (majorToValidate && yearToValidate) {
      const isValidYear = await isMajorInYear(majorToValidate, yearToValidate);

      if (!isValidYear) {
        console.debug("Attempting to update plan with invalid catalog year", {
          majorName: majorToValidate,
          catalogYear: yearToValidate,
        });
        return null;
      }

      const isValidConcentration = await isValidConcentrationForMajor(
        majorToValidate,
        yearToValidate,
        concentrationToValidate || "",
      );

      if (!isValidConcentration) {
        console.debug("Attempting to update plan with invalid concentration", {
          majorName: majorToValidate,
          catalogYear: yearToValidate,
          concentration: concentrationToValidate,
        });
        return null;
      }
    }
  }

  if (
    isMinorInfoUpdate &&
    (newMinors || currentAuditPlan.minors) &&
    (newCatalogYear || currentAuditPlan.catalogYear)
  ) {
    const yearToValidate = newCatalogYear || currentAuditPlan.catalogYear;
    const minorName = await getByMinorAndYear(
      newMinors ?? currentAuditPlan.minors ?? [],
      yearToValidate ?? 0,
    );

    if (!minorName) {
      console.debug(
        `Attempting to update a plan with an invalid minor: ${minorName}, ${yearToValidate}`,
      );
      return null;
    }
  }

  let name = currentAuditPlan.name;
  let schedule = currentAuditPlan.schedule;
  let majors: string[] | null | undefined = isWipeMajorUpdate
    ? null
    : currentAuditPlan.majors;
  let catalogYear: number | null | undefined = isWipeMajorUpdate
    ? null
    : currentAuditPlan.catalogYear;
  let concentration: string | null | undefined = isWipeMajorUpdate
    ? null
    : currentAuditPlan.concentration;
  let minors: string[] | null | undefined = isWipeMinorUpdate
    ? null
    : currentAuditPlan.minors;

  if (newSchedule) {
    schedule = newSchedule;
  }

  if (newName) {
    name = newName;
  }

  if (newMajors) {
    majors = newMajors;
    catalogYear = newCatalogYear;
    concentration = newConcentrationName;
  }

  if (newMinors) {
    minors = newMinors;
  }

  if (newMinors && newMinors.length > 0) {
    minors = newMinors;
  }

  const newPlan = {
    name,
    majors,
    minors,
    catalogYear,
    concentration,
    schedule,
  };

  const updatedAuditPlan = await db
    .update(auditPlansT)
    .set({
      name: newPlan.name,
      schedule: newPlan.schedule,
      majors: newPlan.majors,
      minors: newPlan.minors,
      concentration: newPlan.concentration,
      catalogYear: newPlan.catalogYear,
    })
    .where(and(eq(auditPlansT.id, id), eq(auditPlansT.userId, userId)))
    .returning();

  if (updatedAuditPlan.length === 0) {
    return null;
  }

  return updatedAuditPlan[0];
}

/**
 * Deletes an audit plan
 *
 * @param id the ID of the plan to be deleted
 * @param userId the user requesting deletion
 *
 * @returns the deleted audit plan object, or null if deletion failed
 */
export async function deleteAuditPlan(id: number, userId: string) {
  const deleteResult = await db
    .delete(auditPlansT)
    .where(and(eq(auditPlansT.id, id), eq(auditPlansT.userId, userId)))
    .returning();

  if (deleteResult.length === 0) {
    return null;
  }

  return deleteResult[0];
}
