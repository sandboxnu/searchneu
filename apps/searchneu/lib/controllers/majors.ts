import { GraduateAPI } from "../graduate/graduateApiClient";
import { Major, Minor, SupportedConcentrations } from "@/lib/graduate/types";

const UNDECIDED_STRING = "Undecided";

/**
 * Retrieves a Major with the given major and year
 *
 * @param majorName the major to find
 * @param catalogYear the associated year for the given major
 *
 * @returns the major object if found, null otherwise
 */
export async function getByMajorAndYear(
  majorNames: string[],
  catalogYear: number,
): Promise<Major | null> {
  try {
    const majors = await Promise.all(
      majorNames.map((majorName) =>
        GraduateAPI.majors.get(catalogYear, majorName),
      ),
    );

    return majors[0];
  } catch (error) {
    console.error("error getting by major and year", error);
    return null;
  }
}

/**
 * Retrieves a Minor with the given minor and year
 *
 * @param minorName the minor to find
 * @param catalogYear the associated year for the given minor
 *
 * @returns the minor object if found, null otherwise
 */
export async function getByMinorAndYear(
  minorNames: string[],
  catalogYear: number,
): Promise<Minor | null> {
  try {
    const minors = await Promise.all(
      minorNames.map((minorName) =>
        GraduateAPI.minors.get(catalogYear, minorName),
      ),
    );

    return minors[0];
  } catch (error) {
    console.error("error getting by minor and year", error);
    return null;
  }
}

/**
 * Retrieves the corresponding concentrations for a gien major
 *
 * @param majorName the major name to retrieve concentrations for
 * @param catalogYear the associated year for the given major
 *
 * @returns a SupportedConcentrationsobject if found, null if otherwise
 */
export async function getConcentrationsInfoForMajor(
  majorNames: string[],
  catalogYear: number,
): Promise<SupportedConcentrations | null> {
  try {
    const major = await getByMajorAndYear(majorNames, catalogYear);

    if (!major) {
      return null;
    }

    const concentrations =
      major.concentrations?.concentrationOptions?.map(
        (concentration) => concentration.title,
      ) ?? [];

    return {
      concentrations,
      minRequiredConcentrations: major.concentrations?.minOptions ?? 0,
      verified: major.metadata?.verified ?? false,
    };
  } catch (error) {
    console.error("Failed to get concentrations info", {
      majorNames,
      catalogYear,
      error,
    });
    return null;
  }
}

/**
 * Validates whether a given concentration is valid for a specific major
 *
 * @param majorName the major name
 * @param catalogYear the associated year for the given major
 * @param concentrationName the concentration chosen
 *
 * @returns true, if concentration is valid, false otherwise
 */
export async function isValidConcentrationForMajor(
  majorNames: string[],
  catalogYear: number,
  concentrationName: string,
): Promise<boolean> {
  const concentrationsInfo = await getConcentrationsInfoForMajor(
    majorNames,
    catalogYear,
  );

  if (!concentrationsInfo) {
    console.debug("Concentration info for major not found", {
      majorNames,
      catalogYear,
      concentrationName,
    });
    return false;
  }

  const { concentrations, minRequiredConcentrations } = concentrationsInfo;

  // major doesn't have any concentrations
  if (concentrations.length === 0) {
    return concentrationName === "";
  }

  if (minRequiredConcentrations > 0 && !concentrationName) {
    console.debug(
      "Concentration not provided for major with required concentration",
      {
        majorNames,
        catalogYear,
        minRequiredConcentrations,
      },
    );
    return false;
  }

  const isValidConcentrationName =
    concentrations.includes(concentrationName) ||
    concentrationName === UNDECIDED_STRING;

  if (!isValidConcentrationName) {
    console.debug("Invalid concentration name for major", {
      majorNames,
      catalogYear,
      concentrationName,
    });
    return false;
  }

  return true;
}

/**
 * Checks if a major exists in a specific catalog year.
 *
 * @param majorName the name of the major to check
 * @param catalogYear the associated year for the given major
 *
 * @returns true if the major exists in the catalog year, false otherwise
 */
export async function isMajorInYear(
  majorNames: string[],
  catalogYear: number,
): Promise<boolean> {
  try {
    const major = await getByMajorAndYear(majorNames, catalogYear);

    if (!major) {
      console.debug("Invalid catalog year for major", {
        majorNames,
        catalogYear,
      });
      return false;
    }

    return true;
  } catch (error) {
    console.debug("Major not found", { majorNames, catalogYear, error });
    return false;
  }
}
