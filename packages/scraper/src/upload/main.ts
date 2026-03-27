/**
 * Uploads a scraped term cache to the database.
 *
 * The entire upload runs inside a single transaction so the term
 * either uploads completely or fails with no partial state.
 *
 * Campuses, buildings, and subjects are treated as "config as code" —
 * the static config files are the source of truth. The uploader syncs
 * DB state to match config (upsert with updates) and warns about
 * entries that exist in the DB but are missing from config (drift).
 *
 * When `partOfTerm` is provided, only sections matching that part are
 * uploaded, and the term entry uses the given partOfTerm code. When
 * omitted, all sections are uploaded under the default partOfTerm "1".
 */

import * as z from "zod";
import { TermConfig } from "../config";
import {
  ScraperBannerCache,
  ScraperBannerCacheSection,
} from "../schemas/scraper/banner-cache";
import type { StaticConfig } from "../schemas/scraper/static-config";
import { type createDbClient } from "@sneu/db/pg";
import { termsT } from "@sneu/db/schema";
import type { ScraperEventEmitter } from "../events";
import { upsertCampuses } from "./steps/campuses";
import { upsertBuildings } from "./steps/buildings";
import { upsertRooms } from "./steps/rooms";
import { upsertNupaths } from "./steps/nupaths";
import { upsertSubjects } from "./steps/subjects";
import { upsertCourses } from "./steps/courses";
import { upsertSections } from "./steps/sections";
import { upsertNupathMappings } from "./steps/nupath-mappings";
import { upsertMeetingTimes } from "./steps/meeting-times";

/**
 * @param partOfTerm When provided, only sections with this partOfTerm are
 *   uploaded and the DB term entry uses this value. When omitted, all
 *   sections are uploaded under the default partOfTerm "1".
 */
export async function uploadCatalogTerm(
  scrape: z.infer<typeof ScraperBannerCache>,
  db: ReturnType<typeof createDbClient>,
  config: z.infer<typeof TermConfig>,
  staticConfig: StaticConfig,
  partOfTerm?: string,
  emitter?: ScraperEventEmitter,
): Promise<void> {
  const effectivePartOfTerm = partOfTerm ?? "1";

  // Filter scrape data when a specific partOfTerm is requested
  const filteredScrape = partOfTerm
    ? filterScrapeByPartOfTerm(scrape, partOfTerm)
    : scrape;

  emitter?.emit("upload:start", { term: scrape.term.code });

  await db.transaction(async (tx) => {
    // ===== reference / static data (config as code) =====
    const campusResult = await upsertCampuses(tx, staticConfig);
    emitter?.emit("upload:progress", { step: "campuses" });
    if (campusResult.staleCodes.length > 0) {
      emitter?.emit("warn", {
        message: `campuses in DB but not in config: ${campusResult.staleCodes.join(", ")}`,
        data: { entity: "campuses", codes: campusResult.staleCodes },
      });
    }

    const buildingResult = await upsertBuildings(
      tx,
      staticConfig,
      campusResult.maps.codeMap,
    );
    emitter?.emit("upload:progress", { step: "buildings" });
    if (buildingResult.staleCodes.length > 0) {
      emitter?.emit("warn", {
        message: `buildings in DB but not in config: ${buildingResult.staleCodes.join(", ")}`,
        data: { entity: "buildings", codes: buildingResult.staleCodes },
      });
    }

    const buildingRoomMap = await upsertRooms(
      tx,
      filteredScrape,
      buildingResult.codeMap,
      staticConfig,
    );
    emitter?.emit("upload:progress", { step: "rooms" });

    const nupathResult = await upsertNupaths(tx, staticConfig);

    const subjectResult = await upsertSubjects(tx, staticConfig);
    emitter?.emit("upload:progress", { step: "subjects" });
    if (subjectResult.staleCodes.length > 0) {
      emitter?.emit("warn", {
        message: `subjects in DB but not in config: ${subjectResult.staleCodes.join(", ")}`,
        data: { entity: "subjects", codes: subjectResult.staleCodes },
      });
    }

    // ===== term =====
    const partConfig = partOfTerm
      ? config.parts?.find((p) => p.code === partOfTerm)
      : undefined;
    const termName = partConfig?.name ?? config.name ?? scrape.term.description;
    const activeUntil = new Date(partConfig?.activeUntil ?? config.activeUntil);
    const [termRow] = await tx
      .insert(termsT)
      .values({
        term: scrape.term.code,
        partOfTerm: effectivePartOfTerm,
        name: termName,
        activeUntil,
      })
      .onConflictDoUpdate({
        target: [termsT.term, termsT.partOfTerm],
        set: {
          name: termName,
          activeUntil,
        },
      })
      .returning({ id: termsT.id });
    const termId = termRow.id;
    emitter?.emit("upload:progress", { step: "term" });

    // ===== term-specific data =====
    const courseMap = await upsertCourses(
      tx,
      filteredScrape,
      subjectResult.map,
      termId,
    );
    emitter?.emit("upload:progress", { step: "courses" });

    const { sectionsMap, meetingTimes, removedSectionIds } =
      await upsertSections(
        tx,
        filteredScrape,
        courseMap,
        campusResult.maps.nameMap,
        termId,
      );
    emitter?.emit("upload:progress", { step: "sections" });

    if (removedSectionIds.length > 0) {
      emitter?.emit("upload:sections-to-remove", {
        count: removedSectionIds.length,
      });
    }

    // ===== relationships =====
    await upsertNupathMappings(
      tx,
      filteredScrape,
      courseMap,
      nupathResult.map,
      nupathResult.codes,
    );

    const staleMeetingTimeIds = await upsertMeetingTimes(
      tx,
      termId,
      meetingTimes,
      sectionsMap,
      buildingRoomMap,
    );

    if (staleMeetingTimeIds.length > 0) {
      emitter?.emit("upload:meeting-times-to-remove", {
        count: staleMeetingTimeIds.length,
      });
    }
  });

  emitter?.emit("upload:done", {
    term: scrape.term.code,
    part: effectivePartOfTerm,
  });
}

/**
 * Returns a filtered copy of the scrape with only sections matching the
 * given partOfTerm, and only courses that still have sections after filtering.
 */
export function filterScrapeByPartOfTerm(
  scrape: z.infer<typeof ScraperBannerCache>,
  partOfTerm: string,
): z.infer<typeof ScraperBannerCache> {
  const filteredSections: Record<
    string,
    z.infer<typeof ScraperBannerCacheSection>[]
  > = {};

  for (const [courseKey, sections] of Object.entries(scrape.sections)) {
    const matching = sections.filter((s) => s.partOfTerm === partOfTerm);
    if (matching.length > 0) {
      filteredSections[courseKey] = matching;
    }
  }

  const remainingCourseKeys = new Set(Object.keys(filteredSections));
  const filteredCourses = scrape.courses.filter((c) =>
    remainingCourseKeys.has(c.subject + c.courseNumber),
  );

  return {
    ...scrape,
    courses: filteredCourses,
    sections: filteredSections,
  };
}
