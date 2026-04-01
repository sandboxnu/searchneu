/**
 * CLI tool: migrate-trackers
 *
 * Two-phase helper for catalog drop/re-upload migrations.
 * Handles every user-facing table that holds an FK (or logical FK)
 * to a catalog object (terms, courses, sections):
 *
 *   - tracker                        (sectionId  → sections)
 *   - saved_plans                    (termId     → terms)
 *   - saved_plan_courses             (courseId   → courses, no formal FK)
 *   - saved_plan_sections            (sectionId  → sections)
 *   - generated_schedules            (termId     → terms)
 *   - generated_schedule_sections    (sectionId  → sections)
 *   - favorited_schedules            (planId     → saved_plans, internal)
 *   - favorited_schedule_sections    (sectionId  → sections)
 *
 *   detach   — saves complete row data (with natural keys) for every
 *              affected row, deletes those rows, then drops all FK
 *              constraints pointing at catalog tables.  After detach
 *              the catalog tables have no dependents and can be freely
 *              dropped / migrated / re-uploaded (incl. db:push).
 *
 *   reattach — reads the mapping file, resolves new catalog IDs via
 *              natural keys, and re-inserts all rows that could be
 *              resolved.  Orphaned rows are reported and skipped.
 *              Any FK constraints not already present are re-added.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { defineCommand } from "citty";
import { brandIntro, p, pc, setVerbosity, isVerbose } from "../ui";
import { getDb } from "@sneu/db/pg";
import {
  termsT,
  coursesT,
  sectionsT,
  subjectsT,
  trackersT,
} from "@sneu/db/schema";
import {
  savedPlansT,
  savedPlanCoursesT,
  savedPlanSectionsT,
  generatedSchedulesT,
  generatedScheduleSectionsT,
  favoritedSchedulesT,
  favoritedScheduleSectionsT,
} from "@sneu/db/schema";
import { eq, sql } from "drizzle-orm";

// ── FK constraints that point at catalog tables ──────────────

type CatalogConstraint = {
  table: string;
  name: string;
  column: string;
  refTable: string;
  onDelete: "no action" | "cascade";
};

const CATALOG_CONSTRAINTS: CatalogConstraint[] = [
  {
    table: "tracker",
    name: "tracker_sectionId_sections_id_fk",
    column: "sectionId",
    refTable: "sections",
    onDelete: "no action",
  },
  {
    table: "saved_plans",
    name: "saved_plans_termId_terms_id_fk",
    column: "termId",
    refTable: "terms",
    onDelete: "cascade",
  },
  {
    table: "saved_plan_sections",
    name: "saved_plan_sections_sectionId_sections_id_fk",
    column: "sectionId",
    refTable: "sections",
    onDelete: "cascade",
  },
  {
    table: "generated_schedules",
    name: "generated_schedules_termId_terms_id_fk",
    column: "termId",
    refTable: "terms",
    onDelete: "cascade",
  },
  {
    table: "generated_schedule_sections",
    name: "generated_schedule_sections_sectionId_sections_id_fk",
    column: "sectionId",
    refTable: "sections",
    onDelete: "cascade",
  },
  {
    table: "favorited_schedule_sections",
    name: "favorited_schedule_sections_sectionId_sections_id_fk",
    column: "sectionId",
    refTable: "sections",
    onDelete: "cascade",
  },
];

// ── Mapping file ─────────────────────────────────────────────

const MAPPING_FILENAME = "catalog-migration-mapping.json";

// Each saved row stores the complete DB columns plus natural-key
// fields needed to resolve the new catalog IDs on reattach.

type SavedTracker = {
  id: number;
  userId: string;
  sectionId: number;
  notificationMethod: string;
  messageCount: number;
  messageLimit: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  // natural key
  term: string;
  partOfTerm: string;
  crn: string;
};

type SavedPlan = {
  id: number;
  userId: string;
  termId: number;
  name: string;
  numCourses: number | null;
  startTime: number | null;
  endTime: number | null;
  freeDays: string[];
  includeHonorsSections: boolean;
  includeRemoteSections: boolean;
  hideFilledSections: boolean;
  campus: number;
  nupaths: number[];
  createdAt: string;
  updatedAt: string;
  // natural key
  term: string;
  partOfTerm: string;
};

type SavedPlanCourse = {
  id: number;
  planId: number;
  courseId: number;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
  // natural key
  term: string;
  partOfTerm: string;
  subjectCode: string;
  courseNumber: string;
};

type SavedPlanSection = {
  id: number;
  savedPlanCourseId: number;
  sectionId: number;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
  // natural key
  term: string;
  partOfTerm: string;
  crn: string;
};

type SavedFavSchedule = {
  id: number;
  planId: number;
  name: string;
  createdAt: string;
  updatedAt: string;
};

type SavedFavScheduleSection = {
  id: number;
  favoritedScheduleId: number;
  sectionId: number;
  createdAt: string;
  updatedAt: string;
  // natural key
  term: string;
  partOfTerm: string;
  crn: string;
};

type SavedGenSchedule = {
  id: number;
  userId: string;
  termId: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  // natural key
  term: string;
  partOfTerm: string;
};

type SavedGenScheduleSection = {
  scheduleId: number;
  sectionId: number;
  // natural key
  term: string;
  partOfTerm: string;
  crn: string;
};

type MigrationMapping = {
  version: 2;
  createdAt: string;
  trackers: SavedTracker[];
  savedPlans: SavedPlan[];
  savedPlanCourses: SavedPlanCourse[];
  savedPlanSections: SavedPlanSection[];
  favoritedSchedules: SavedFavSchedule[];
  favoritedScheduleSections: SavedFavScheduleSection[];
  generatedSchedules: SavedGenSchedule[];
  generatedScheduleSections: SavedGenScheduleSection[];
};

// ── detach ────────────────────────────────────────────────────

const detach = defineCommand({
  meta: {
    name: "detach",
    description:
      "save all affected rows, delete them, and drop catalog FK constraints",
  },
  args: {
    outDir: {
      type: "string",
      default: "backups",
      description: "directory to write the mapping file to",
    },
    dryRun: {
      type: "boolean",
      description: "show what would happen without modifying the database",
    },
    verbose: {
      alias: "v",
      type: "boolean",
      description: "show detailed output",
    },
  },
  async run({ args }) {
    setVerbosity({ verbose: args.verbose });
    brandIntro("tools migrate-trackers detach");

    const db = getDb(process.env.DATABASE_URL!, true);
    const outDir = path.resolve(args.outDir);
    mkdirSync(outDir, { recursive: true });

    // ── 1. Save complete row data with natural keys ─────────

    // trackers → sections → terms
    const trackers: SavedTracker[] = (
      await db
        .select({
          id: trackersT.id,
          userId: trackersT.userId,
          sectionId: trackersT.sectionId,
          notificationMethod: trackersT.notificationMethod,
          messageCount: trackersT.messageCount,
          messageLimit: trackersT.messageLimit,
          createdAt: trackersT.createdAt,
          updatedAt: trackersT.updatedAt,
          deletedAt: trackersT.deletedAt,
          term: termsT.term,
          partOfTerm: termsT.partOfTerm,
          crn: sectionsT.crn,
        })
        .from(trackersT)
        .innerJoin(sectionsT, eq(trackersT.sectionId, sectionsT.id))
        .innerJoin(termsT, eq(sectionsT.termId, termsT.id))
    ).map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      deletedAt: r.deletedAt?.toISOString() ?? null,
    }));

    // saved_plans → terms (full row data)
    const savedPlans: SavedPlan[] = (
      await db
        .select({
          id: savedPlansT.id,
          userId: savedPlansT.userId,
          termId: savedPlansT.termId,
          name: savedPlansT.name,
          numCourses: savedPlansT.numCourses,
          startTime: savedPlansT.startTime,
          endTime: savedPlansT.endTime,
          freeDays: savedPlansT.freeDays,
          includeHonorsSections: savedPlansT.includeHonorsSections,
          includeRemoteSections: savedPlansT.includeRemoteSections,
          hideFilledSections: savedPlansT.hideFilledSections,
          campus: savedPlansT.campus,
          nupaths: savedPlansT.nupaths,
          createdAt: savedPlansT.createdAt,
          updatedAt: savedPlansT.updatedAt,
          term: termsT.term,
          partOfTerm: termsT.partOfTerm,
        })
        .from(savedPlansT)
        .innerJoin(termsT, eq(savedPlansT.termId, termsT.id))
    ).map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

    // saved_plan_courses → courses → terms + subjects
    const savedPlanCourses: SavedPlanCourse[] = (
      await db
        .select({
          id: savedPlanCoursesT.id,
          planId: savedPlanCoursesT.planId,
          courseId: savedPlanCoursesT.courseId,
          isLocked: savedPlanCoursesT.isLocked,
          createdAt: savedPlanCoursesT.createdAt,
          updatedAt: savedPlanCoursesT.updatedAt,
          term: termsT.term,
          partOfTerm: termsT.partOfTerm,
          subjectCode: subjectsT.code,
          courseNumber: coursesT.courseNumber,
        })
        .from(savedPlanCoursesT)
        .innerJoin(coursesT, eq(savedPlanCoursesT.courseId, coursesT.id))
        .innerJoin(termsT, eq(coursesT.termId, termsT.id))
        .innerJoin(subjectsT, eq(coursesT.subject, subjectsT.id))
    ).map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

    // saved_plan_sections → sections → terms
    const savedPlanSections: SavedPlanSection[] = (
      await db
        .select({
          id: savedPlanSectionsT.id,
          savedPlanCourseId: savedPlanSectionsT.savedPlanCourseId,
          sectionId: savedPlanSectionsT.sectionId,
          isHidden: savedPlanSectionsT.isHidden,
          createdAt: savedPlanSectionsT.createdAt,
          updatedAt: savedPlanSectionsT.updatedAt,
          term: termsT.term,
          partOfTerm: termsT.partOfTerm,
          crn: sectionsT.crn,
        })
        .from(savedPlanSectionsT)
        .innerJoin(sectionsT, eq(savedPlanSectionsT.sectionId, sectionsT.id))
        .innerJoin(termsT, eq(sectionsT.termId, termsT.id))
    ).map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

    // favorited_schedules (no catalog FK, but cascade-deletes from saved_plans)
    const favoritedSchedules: SavedFavSchedule[] = (
      await db.select().from(favoritedSchedulesT)
    ).map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

    // favorited_schedule_sections → sections → terms
    const favoritedScheduleSections: SavedFavScheduleSection[] = (
      await db
        .select({
          id: favoritedScheduleSectionsT.id,
          favoritedScheduleId: favoritedScheduleSectionsT.favoritedScheduleId,
          sectionId: favoritedScheduleSectionsT.sectionId,
          createdAt: favoritedScheduleSectionsT.createdAt,
          updatedAt: favoritedScheduleSectionsT.updatedAt,
          term: termsT.term,
          partOfTerm: termsT.partOfTerm,
          crn: sectionsT.crn,
        })
        .from(favoritedScheduleSectionsT)
        .innerJoin(
          sectionsT,
          eq(favoritedScheduleSectionsT.sectionId, sectionsT.id),
        )
        .innerJoin(termsT, eq(sectionsT.termId, termsT.id))
    ).map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

    // generated_schedules → terms
    const generatedSchedules: SavedGenSchedule[] = (
      await db
        .select({
          id: generatedSchedulesT.id,
          userId: generatedSchedulesT.userId,
          termId: generatedSchedulesT.termId,
          createdAt: generatedSchedulesT.createdAt,
          updatedAt: generatedSchedulesT.updatedAt,
          deletedAt: generatedSchedulesT.deletedAt,
          term: termsT.term,
          partOfTerm: termsT.partOfTerm,
        })
        .from(generatedSchedulesT)
        .innerJoin(termsT, eq(generatedSchedulesT.termId, termsT.id))
    ).map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      deletedAt: r.deletedAt?.toISOString() ?? null,
    }));

    // generated_schedule_sections → sections → terms
    const generatedScheduleSections: SavedGenScheduleSection[] = await db
      .select({
        scheduleId: generatedScheduleSectionsT.scheduleId,
        sectionId: generatedScheduleSectionsT.sectionId,
        term: termsT.term,
        partOfTerm: termsT.partOfTerm,
        crn: sectionsT.crn,
      })
      .from(generatedScheduleSectionsT)
      .innerJoin(
        sectionsT,
        eq(generatedScheduleSectionsT.sectionId, sectionsT.id),
      )
      .innerJoin(termsT, eq(sectionsT.termId, termsT.id));

    // ── Save mapping file ───────────────────────────────────

    const mapping: MigrationMapping = {
      version: 2,
      createdAt: new Date().toISOString(),
      trackers,
      savedPlans,
      savedPlanCourses,
      savedPlanSections,
      favoritedSchedules,
      favoritedScheduleSections,
      generatedSchedules,
      generatedScheduleSections,
    };

    const counts = [
      ["trackers", trackers.length],
      ["saved_plans", savedPlans.length],
      ["saved_plan_courses", savedPlanCourses.length],
      ["saved_plan_sections", savedPlanSections.length],
      ["favorited_schedules", favoritedSchedules.length],
      ["favorited_schedule_sections", favoritedScheduleSections.length],
      ["generated_schedules", generatedSchedules.length],
      ["generated_schedule_sections", generatedScheduleSections.length],
    ] as const;

    const totalRows = counts.reduce((sum, [, n]) => sum + n, 0);

    p.note(
      counts.map(([name, n]) => `${name}: ${pc.bold(String(n))}`).join("\n"),
      `Saved ${totalRows} rows`,
    );

    const mappingPath = path.join(outDir, MAPPING_FILENAME);
    writeFileSync(mappingPath, JSON.stringify(mapping, null, 2));
    p.log.info(`Mapping saved → ${pc.dim(mappingPath)}`);

    if (args.dryRun) {
      p.note(
        [
          `Would delete all rows from affected tables`,
          ...CATALOG_CONSTRAINTS.map((c) => `Would drop FK ${pc.bold(c.name)}`),
        ].join("\n"),
        "Dry Run",
      );
      p.outro("Dry run complete — no changes made");
      return;
    }

    // ── 2. Delete rows and drop constraints ─────────────────

    await db.transaction(async (tx) => {
      // Delete parent rows — internal CASCADE handles children:
      //   saved_plans → saved_plan_courses → saved_plan_sections
      //                → favorited_schedules → favorited_schedule_sections
      //   generated_schedules → generated_schedule_sections
      await tx.delete(savedPlansT);
      await tx.delete(generatedSchedulesT);
      await tx.delete(trackersT);

      if (isVerbose()) {
        p.log.info("Deleted all rows from affected tables");
      }
    });

    // Drop FK constraints (outside tx so db:push can run independently)
    const existing = await db.execute(sql`
      SELECT constraint_name FROM information_schema.table_constraints
      WHERE constraint_type = 'FOREIGN KEY'
        AND constraint_name = ANY(${sql`ARRAY[${sql.join(
          CATALOG_CONSTRAINTS.map((c) => sql`${c.name}`),
          sql`, `,
        )}]`})
    `);
    const existingNames = new Set(
      existing.rows.map(
        (r) => (r as { constraint_name: string }).constraint_name,
      ),
    );

    let dropped = 0;
    for (const c of CATALOG_CONSTRAINTS) {
      if (!existingNames.has(c.name)) {
        if (isVerbose()) {
          p.log.warning(`${pc.dim(c.name)} — already absent, skipping`);
        }
        continue;
      }
      await db.execute(
        sql`ALTER TABLE ${sql.identifier(c.table)} DROP CONSTRAINT ${sql.identifier(c.name)}`,
      );
      dropped++;
      if (isVerbose()) {
        p.log.info(`Dropped ${pc.bold(c.name)}`);
      }
    }

    p.log.info(
      `Deleted ${pc.bold(String(totalRows))} rows, dropped ${pc.bold(String(dropped))} FK constraints`,
    );
    p.outro(
      `Detached — catalog tables can now be dropped / migrated / re-uploaded.\n` +
        `  After uploading new data, run: ${pc.bold("cli tools migrate-trackers reattach")}`,
    );
  },
});

// ── reattach ──────────────────────────────────────────────────

const reattach = defineCommand({
  meta: {
    name: "reattach",
    description:
      "re-insert saved rows with resolved catalog IDs and restore FK constraints",
  },
  args: {
    mappingFile: {
      type: "string",
      default: path.join("backups", MAPPING_FILENAME),
      description: "path to the catalog-migration-mapping.json from detach",
    },
    dryRun: {
      type: "boolean",
      description: "show what would happen without modifying the database",
    },
    verbose: {
      alias: "v",
      type: "boolean",
      description: "show detailed output",
    },
  },
  async run({ args }) {
    setVerbosity({ verbose: args.verbose });
    brandIntro("tools migrate-trackers reattach");

    const mappingPath = path.resolve(args.mappingFile);
    if (!existsSync(mappingPath)) {
      p.cancel(
        `Mapping file not found: ${mappingPath}\n` +
          `Run "cli tools migrate-trackers detach" first.`,
      );
      return;
    }

    const mapping: MigrationMapping = JSON.parse(
      readFileSync(mappingPath, "utf8"),
    );

    const db = getDb(process.env.DATABASE_URL!, true);

    // ── 1. Build lookups ────────────────────────────────────

    const termLookup = new Map<string, number>();
    for (const t of await db
      .select({
        id: termsT.id,
        term: termsT.term,
        partOfTerm: termsT.partOfTerm,
      })
      .from(termsT)) {
      termLookup.set(`${t.term}/${t.partOfTerm}`, t.id);
    }

    const sectionLookup = new Map<string, number>();
    for (const s of await db
      .select({
        id: sectionsT.id,
        crn: sectionsT.crn,
        term: termsT.term,
        partOfTerm: termsT.partOfTerm,
      })
      .from(sectionsT)
      .innerJoin(termsT, eq(sectionsT.termId, termsT.id))) {
      sectionLookup.set(`${s.term}/${s.partOfTerm}/${s.crn}`, s.id);
    }

    const courseLookup = new Map<string, number>();
    for (const c of await db
      .select({
        id: coursesT.id,
        term: termsT.term,
        partOfTerm: termsT.partOfTerm,
        subjectCode: subjectsT.code,
        courseNumber: coursesT.courseNumber,
      })
      .from(coursesT)
      .innerJoin(termsT, eq(coursesT.termId, termsT.id))
      .innerJoin(subjectsT, eq(coursesT.subject, subjectsT.id))) {
      courseLookup.set(
        `${c.term}/${c.partOfTerm}/${c.subjectCode}/${c.courseNumber}`,
        c.id,
      );
    }

    p.log.info(
      `Lookups: ${termLookup.size} terms, ${sectionLookup.size} sections, ${courseLookup.size} courses`,
    );

    // ── 2. Resolve and categorise ───────────────────────────

    const stats = {
      trackers: { resolved: 0, orphaned: 0 },
      savedPlans: { resolved: 0, orphaned: 0 },
      savedPlanCourses: { resolved: 0, orphaned: 0 },
      savedPlanSections: { resolved: 0, orphaned: 0 },
      favoritedSchedules: { resolved: 0, orphaned: 0 },
      favoritedScheduleSections: { resolved: 0, orphaned: 0 },
      generatedSchedules: { resolved: 0, orphaned: 0 },
      generatedScheduleSections: { resolved: 0, orphaned: 0 },
    };

    // ── saved_plans: resolve termId, track orphaned plan IDs ─
    const orphanedPlanIds = new Set<number>();
    const resolvedPlans: (SavedPlan & { newTermId: number })[] = [];
    for (const row of mapping.savedPlans) {
      const newTermId = termLookup.get(`${row.term}/${row.partOfTerm}`);
      if (newTermId !== undefined) {
        resolvedPlans.push({ ...row, newTermId });
        stats.savedPlans.resolved++;
      } else {
        orphanedPlanIds.add(row.id);
        stats.savedPlans.orphaned++;
      }
    }

    // ── saved_plan_courses: resolve courseId, skip if parent orphaned ─
    const orphanedSpcIds = new Set<number>();
    const resolvedCourses: (SavedPlanCourse & { newCourseId: number })[] = [];
    for (const row of mapping.savedPlanCourses) {
      if (orphanedPlanIds.has(row.planId)) {
        orphanedSpcIds.add(row.id);
        stats.savedPlanCourses.orphaned++;
        continue;
      }
      const newCourseId = courseLookup.get(
        `${row.term}/${row.partOfTerm}/${row.subjectCode}/${row.courseNumber}`,
      );
      if (newCourseId !== undefined) {
        resolvedCourses.push({ ...row, newCourseId });
        stats.savedPlanCourses.resolved++;
      } else {
        orphanedSpcIds.add(row.id);
        stats.savedPlanCourses.orphaned++;
      }
    }

    // ── saved_plan_sections: resolve sectionId, skip if parent orphaned ─
    const resolvedPlanSections: (SavedPlanSection & {
      newSectionId: number;
    })[] = [];
    for (const row of mapping.savedPlanSections) {
      if (orphanedSpcIds.has(row.savedPlanCourseId)) {
        stats.savedPlanSections.orphaned++;
        continue;
      }
      const newSectionId = sectionLookup.get(
        `${row.term}/${row.partOfTerm}/${row.crn}`,
      );
      if (newSectionId !== undefined) {
        resolvedPlanSections.push({ ...row, newSectionId });
        stats.savedPlanSections.resolved++;
      } else {
        stats.savedPlanSections.orphaned++;
      }
    }

    // ── favorited_schedules: skip if parent plan orphaned ─
    const orphanedFavIds = new Set<number>();
    const resolvedFavSchedules: SavedFavSchedule[] = [];
    for (const row of mapping.favoritedSchedules) {
      if (orphanedPlanIds.has(row.planId)) {
        orphanedFavIds.add(row.id);
        stats.favoritedSchedules.orphaned++;
      } else {
        resolvedFavSchedules.push(row);
        stats.favoritedSchedules.resolved++;
      }
    }

    // ── favorited_schedule_sections: resolve sectionId, skip if parent orphaned ─
    const resolvedFavSections: (SavedFavScheduleSection & {
      newSectionId: number;
    })[] = [];
    for (const row of mapping.favoritedScheduleSections) {
      if (orphanedFavIds.has(row.favoritedScheduleId)) {
        stats.favoritedScheduleSections.orphaned++;
        continue;
      }
      const newSectionId = sectionLookup.get(
        `${row.term}/${row.partOfTerm}/${row.crn}`,
      );
      if (newSectionId !== undefined) {
        resolvedFavSections.push({ ...row, newSectionId });
        stats.favoritedScheduleSections.resolved++;
      } else {
        stats.favoritedScheduleSections.orphaned++;
      }
    }

    // ── generated_schedules: resolve termId ─
    const orphanedGsIds = new Set<number>();
    const resolvedGenSchedules: (SavedGenSchedule & {
      newTermId: number;
    })[] = [];
    for (const row of mapping.generatedSchedules) {
      const newTermId = termLookup.get(`${row.term}/${row.partOfTerm}`);
      if (newTermId !== undefined) {
        resolvedGenSchedules.push({ ...row, newTermId });
        stats.generatedSchedules.resolved++;
      } else {
        orphanedGsIds.add(row.id);
        stats.generatedSchedules.orphaned++;
      }
    }

    // ── generated_schedule_sections: resolve sectionId, skip if parent orphaned ─
    const resolvedGenSections: (SavedGenScheduleSection & {
      newSectionId: number;
    })[] = [];
    for (const row of mapping.generatedScheduleSections) {
      if (orphanedGsIds.has(row.scheduleId)) {
        stats.generatedScheduleSections.orphaned++;
        continue;
      }
      const newSectionId = sectionLookup.get(
        `${row.term}/${row.partOfTerm}/${row.crn}`,
      );
      if (newSectionId !== undefined) {
        resolvedGenSections.push({ ...row, newSectionId });
        stats.generatedScheduleSections.resolved++;
      } else {
        stats.generatedScheduleSections.orphaned++;
      }
    }

    // ── trackers: resolve sectionId ─
    const resolvedTrackers: (SavedTracker & { newSectionId: number })[] = [];
    for (const row of mapping.trackers) {
      const newSectionId = sectionLookup.get(
        `${row.term}/${row.partOfTerm}/${row.crn}`,
      );
      if (newSectionId !== undefined) {
        resolvedTrackers.push({ ...row, newSectionId });
        stats.trackers.resolved++;
      } else {
        stats.trackers.orphaned++;
      }
    }

    // ── 3. Report ────────────────────────────────────────────

    const reportLines: string[] = [];
    for (const [table, s] of Object.entries(stats)) {
      const parts = [`${pc.green(String(s.resolved))} resolved`];
      if (s.orphaned > 0) parts.push(`${pc.red(String(s.orphaned))} orphaned`);
      reportLines.push(`${table}: ${parts.join(", ")}`);
    }
    p.note(reportLines.join("\n"), "Resolution Summary");

    if (args.dryRun) {
      p.outro("Dry run complete — no changes made");
      return;
    }

    // ── 4. Re-insert in a transaction ────────────────────────

    await db.transaction(async (tx) => {
      // Parents first, then children, in FK-safe order.

      // saved_plans
      for (const r of resolvedPlans) {
        await tx.execute(sql`
          INSERT INTO "saved_plans"
            ("id","userId","termId","name","numCourses","startTime","endTime",
             "freeDays","includeHonorsSections","includeRemoteSections",
             "hideFilledSections","campus","nupaths","createdAt","updatedAt")
          OVERRIDING SYSTEM VALUE VALUES
            (${r.id},${r.userId},${r.newTermId},${r.name},${r.numCourses},
             ${r.startTime},${r.endTime},${pgTextArray(r.freeDays)},
             ${r.includeHonorsSections},${r.includeRemoteSections},
             ${r.hideFilledSections},${r.campus},${pgIntArray(r.nupaths)},
             ${r.createdAt},${r.updatedAt})
        `);
      }

      // saved_plan_courses
      for (const r of resolvedCourses) {
        await tx.execute(sql`
          INSERT INTO "saved_plan_courses"
            ("id","planId","courseId","isLocked","createdAt","updatedAt")
          OVERRIDING SYSTEM VALUE VALUES
            (${r.id},${r.planId},${r.newCourseId},${r.isLocked},
             ${r.createdAt},${r.updatedAt})
        `);
      }

      // saved_plan_sections
      for (const r of resolvedPlanSections) {
        await tx.execute(sql`
          INSERT INTO "saved_plan_sections"
            ("id","savedPlanCourseId","sectionId","isHidden","createdAt","updatedAt")
          OVERRIDING SYSTEM VALUE VALUES
            (${r.id},${r.savedPlanCourseId},${r.newSectionId},${r.isHidden},
             ${r.createdAt},${r.updatedAt})
        `);
      }

      // favorited_schedules
      for (const r of resolvedFavSchedules) {
        await tx.execute(sql`
          INSERT INTO "favorited_schedules"
            ("id","planId","name","createdAt","updatedAt")
          OVERRIDING SYSTEM VALUE VALUES
            (${r.id},${r.planId},${r.name},${r.createdAt},${r.updatedAt})
        `);
      }

      // favorited_schedule_sections
      for (const r of resolvedFavSections) {
        await tx.execute(sql`
          INSERT INTO "favorited_schedule_sections"
            ("id","favoritedScheduleId","sectionId","createdAt","updatedAt")
          OVERRIDING SYSTEM VALUE VALUES
            (${r.id},${r.favoritedScheduleId},${r.newSectionId},
             ${r.createdAt},${r.updatedAt})
        `);
      }

      // generated_schedules
      for (const r of resolvedGenSchedules) {
        await tx.execute(sql`
          INSERT INTO "generated_schedules"
            ("id","userId","termId","createdAt","updatedAt","deletedAt")
          OVERRIDING SYSTEM VALUE VALUES
            (${r.id},${r.userId},${r.newTermId},${r.createdAt},
             ${r.updatedAt},${r.deletedAt})
        `);
      }

      // generated_schedule_sections (no identity column)
      for (const r of resolvedGenSections) {
        await tx.execute(sql`
          INSERT INTO "generated_schedule_sections"
            ("scheduleId","sectionId")
          VALUES (${r.scheduleId},${r.newSectionId})
        `);
      }

      // trackers
      for (const r of resolvedTrackers) {
        await tx.execute(sql`
          INSERT INTO "tracker"
            ("id","userId","sectionId","notificationMethod","messageCount",
             "messageLimit","createdAt","updatedAt","deletedAt")
          OVERRIDING SYSTEM VALUE VALUES
            (${r.id},${r.userId},${r.newSectionId},${r.notificationMethod},
             ${r.messageCount},${r.messageLimit},${r.createdAt},
             ${r.updatedAt},${r.deletedAt})
        `);
      }

      // ── Reset identity sequences ───────────────────────────

      const seqTables = [
        "tracker",
        "saved_plans",
        "saved_plan_courses",
        "saved_plan_sections",
        "favorited_schedules",
        "favorited_schedule_sections",
        "generated_schedules",
      ];
      for (const table of seqTables) {
        await tx.execute(sql`
          SELECT setval(
            pg_get_serial_sequence(${table}, 'id'),
            m
          ) FROM (SELECT MAX("id") AS m FROM ${sql.identifier(table)}) sub
          WHERE m IS NOT NULL
        `);
      }

      // ── Re-add any missing FK constraints ──────────────────

      const existingFks = await tx.execute(sql`
        SELECT constraint_name FROM information_schema.table_constraints
        WHERE constraint_type = 'FOREIGN KEY'
          AND constraint_name = ANY(${sql`ARRAY[${sql.join(
            CATALOG_CONSTRAINTS.map((c) => sql`${c.name}`),
            sql`, `,
          )}]`})
      `);
      const existingNames = new Set(
        existingFks.rows.map(
          (r) => (r as { constraint_name: string }).constraint_name,
        ),
      );

      let added = 0;
      for (const c of CATALOG_CONSTRAINTS) {
        if (existingNames.has(c.name)) {
          if (isVerbose()) {
            p.log.info(`${pc.dim(c.name)} — already present`);
          }
          continue;
        }
        await tx.execute(sql`
          ALTER TABLE ${sql.identifier(c.table)}
          ADD CONSTRAINT ${sql.identifier(c.name)}
          FOREIGN KEY (${sql.identifier(c.column)})
          REFERENCES "public".${sql.identifier(c.refTable)}("id")
          ON DELETE ${sql.raw(c.onDelete)} ON UPDATE no action
        `);
        added++;
        if (isVerbose()) {
          p.log.info(`Added ${pc.bold(c.name)}`);
        }
      }

      if (added > 0) {
        p.log.info(`Re-added ${pc.bold(String(added))} FK constraints`);
      }
    });

    const totalResolved = Object.values(stats).reduce(
      (sum, s) => sum + s.resolved,
      0,
    );
    const totalOrphaned = Object.values(stats).reduce(
      (sum, s) => sum + s.orphaned,
      0,
    );

    p.outro(
      `Reattach complete — ${pc.green(String(totalResolved))} rows restored` +
        (totalOrphaned > 0
          ? `, ${pc.red(String(totalOrphaned))} orphaned (not in new catalog)`
          : ""),
    );
  },
});

// ── Helpers ──────────────────────────────────────────────────

/**
 * Drizzle's sql`` template drops empty JS arrays, producing `()` instead
 * of a parameterised value.  These helpers emit a cast literal that PG
 * always accepts, even for empty arrays.
 */
function pgTextArray(arr: string[]) {
  const literal = `{${arr.map((s) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`).join(",")}}`;
  return sql`${literal}::text[]`;
}

function pgIntArray(arr: number[]) {
  const literal = `{${arr.join(",")}}`;
  return sql`${literal}::integer[]`;
}

// ── Parent command ────────────────────────────────────────────

export default defineCommand({
  meta: {
    name: "migrate-trackers",
    description:
      "detach/reattach catalog FKs on trackers, plans, and schedules for catalog migrations",
  },
  subCommands: {
    detach,
    reattach,
  },
});
