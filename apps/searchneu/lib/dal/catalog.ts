import "server-only";
import { db, catalogMajorsT, catalogMinorsT } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { cache } from "react";
import type {
  Major,
  Minor,
  Template,
  Section,
  SupportedMajors,
  SupportedMinors,
  SupportedConcentrations,
} from "@/lib/graduate/types";

/**
 * Fetch a single major by catalog year and name.
 */
export const getMajor = cache(
  async (catalogYear: number, majorName: string): Promise<Major | null> => {
    const rows = await db
      .select()
      .from(catalogMajorsT)
      .where(
        and(
          eq(catalogMajorsT.yearVersion, catalogYear),
          eq(catalogMajorsT.name, majorName),
        ),
      )
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    const concentrationOptions = row.concentrationOptions as Section[];
    const minConcentrationOptions = row.minConcentrationOptions;

    return {
      name: row.name,
      requirementSections: row.requirementSections as Section[],
      totalCreditsRequired: row.totalCreditsRequired,
      yearVersion: row.yearVersion,
      concentrations:
        concentrationOptions.length > 0
          ? { minOptions: minConcentrationOptions, concentrationOptions }
          : undefined,
    };
  },
);

/**
 * Fetch a single minor by catalog year and name.
 */
export const getMinor = cache(
  async (catalogYear: number, minorName: string): Promise<Minor | null> => {
    const rows = await db
      .select()
      .from(catalogMinorsT)
      .where(
        and(
          eq(catalogMinorsT.yearVersion, catalogYear),
          eq(catalogMinorsT.name, minorName),
        ),
      )
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    return {
      name: row.name,
      requirementSections: row.requirementSections as Section[],
      totalCreditsRequired: row.totalCreditsRequired,
      yearVersion: row.yearVersion,
    };
  },
);

/**
 * Return all supported majors grouped by year.
 */
export const getSupportedMajors = cache(
  async (): Promise<{ supportedMajors: SupportedMajors }> => {
    const rows = await db
      .select({
        name: catalogMajorsT.name,
        yearVersion: catalogMajorsT.yearVersion,
        concentrationOptions: catalogMajorsT.concentrationOptions,
        minConcentrationOptions: catalogMajorsT.minConcentrationOptions,
      })
      .from(catalogMajorsT);

    const supportedMajors: SupportedMajors = {};

    for (const row of rows) {
      const year = String(row.yearVersion);
      if (!supportedMajors[year]) supportedMajors[year] = {};

      const concentrationOptions = row.concentrationOptions as Section[];
      const entry: SupportedConcentrations = {
        concentrations: concentrationOptions.map((c) => c.title),
        minRequiredConcentrations: row.minConcentrationOptions,
        verified: false,
      };

      supportedMajors[year][row.name] = entry;
    }

    return { supportedMajors };
  },
);

/**
 * Return all supported minors grouped by year.
 */
export const getSupportedMinors = cache(
  async (): Promise<{ supportedMinors: SupportedMinors }> => {
    const rows = await db.select().from(catalogMinorsT);

    const supportedMinors: SupportedMinors = {};

    for (const row of rows) {
      const year = String(row.yearVersion);
      if (!supportedMinors[year]) supportedMinors[year] = {};

      supportedMinors[year][row.name] = {
        name: row.name,
        requirementSections: row.requirementSections as Section[],
        totalCreditsRequired: row.totalCreditsRequired,
        yearVersion: row.yearVersion,
      };
    }

    return { supportedMinors };
  },
);

/**
 * Fetch the template for a given major, or null if none exists.
 */
export const getTemplateForMajor = cache(
  async (catalogYear: number, majorName: string): Promise<Template | null> => {
    const rows = await db
      .select({
        name: catalogMajorsT.name,
        yearVersion: catalogMajorsT.yearVersion,
        templateOptions: catalogMajorsT.templateOptions,
      })
      .from(catalogMajorsT)
      .where(
        and(
          eq(catalogMajorsT.yearVersion, catalogYear),
          eq(catalogMajorsT.name, majorName),
        ),
      )
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    const templateOptions = row.templateOptions as Record<string, unknown>;
    if (!templateOptions || Object.keys(templateOptions).length === 0) {
      return null;
    }

    return {
      name: row.name,
      yearVersion: row.yearVersion,
      templateData: templateOptions as Template["templateData"],
    };
  },
);
