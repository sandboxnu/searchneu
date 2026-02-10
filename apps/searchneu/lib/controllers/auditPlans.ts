import {
  CreateAuditPlanInput,
  UpdateAuditPlanInput,
} from "../graduate/api-dtos";
import { db, usersT, auditPlansT } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { getGuid } from "@/lib/auth/utils";
import {
  getByMajorAndYear,
  getByMinorAndYear,
  isMajorInYear,
  isValidConcentrationForMajor,
} from "./majors";

/**
 * Verifies the current user from their JWT token and returns their user data.
 *
 * @returns the authenticated user object with their ID, or null if not authenticated
 */
export async function verifyUser() {
  const guid = await getGuid();

  if (!guid) {
    return null;
  }

  const users = await db
    .select({
      id: usersT.id,
    })
    .from(usersT)
    .where(eq(usersT.guid, guid));

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
export async function getAuditPlan(id: number, userId: number) {
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
  userId: number,
) {
  const { name, schedule, major, minor, concentration, catalogYear } =
    createAuditPlanInput;

  if (major) {
    const majorName = await getByMajorAndYear(major, catalogYear ?? 0);

    if (!majorName) {
      console.debug(
        `Attempting to create a plan with an unsupported major: ${majorName}, ${catalogYear}`,
      );
      return null;
    }
  }

  if (major && catalogYear) {
    const isValidYear = await isMajorInYear(major, catalogYear);

    if (!isValidYear) {
      console.debug("Attempting to create plan with invalid catalog year", {
        major,
        catalogYear,
      });
      return null;
    }

    const isValidConcentration = await isValidConcentrationForMajor(
      major,
      catalogYear,
      concentration ?? "",
    );

    if (!isValidConcentration) {
      console.debug("Attempting to create plan with invalid concentration", {
        major,
        catalogYear,
        concentration,
      });
      return null;
    }
  }

  if (minor) {
    const minorName = await getByMinorAndYear(minor, catalogYear ?? 0);

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
      major,
      minor,
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
  userId: number,
) {
  const {
    major: newMajorName,
    minor: newMinorName,
    catalogYear: newCatalogYear,
    concentration: newConcentrationName,
    schedule: newSchedule,
    name: newName,
  } = updateAuditPlanInput;

  const currentAuditPlan = await getAuditPlan(id, userId);

  if (!currentAuditPlan) {
    return null;
  }

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
    const majorToValidate = newMajorName || currentAuditPlan.major;
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
    (newMinorName || currentAuditPlan.minor) &&
    (newCatalogYear || currentAuditPlan.catalogYear)
  ) {
    const yearToValidate = newCatalogYear || currentAuditPlan.catalogYear;
    const minorName = await getByMinorAndYear(
      newMinorName ?? currentAuditPlan.minor ?? "",
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
  let major = isWipeMajorUpdate ? undefined : currentAuditPlan.major;
  let minor = isWipeMinorUpdate ? undefined : currentAuditPlan.minor;
  let catalogYear = isWipeMajorUpdate
    ? undefined
    : currentAuditPlan.catalogYear;
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
    .set({
      name: newPlan.name,
      schedule: newPlan.schedule,
      major: newPlan.major,
      minor: newPlan.minor,
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
export async function deleteAuditPlan(id: number, userId: number) {
  const deleteResult = await db
    .delete(auditPlansT)
    .where(and(eq(auditPlansT.id, id), eq(auditPlansT.userId, userId)))
    .returning();

  if (deleteResult.length === 0) {
    return null;
  }

  return deleteResult[0];
}
